// Server-only coordinator. --preflight never stops services or creates a backup.
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";
import { createPairedBackupSet } from "./paired-backup.mjs";
import { loadAndVerifySet } from "./paired-restore.mjs";
import { assertSafeDestination, inventoryUploads, MANIFEST_NAME, MANIFEST_CHECKSUM_NAME, sha256File } from "./paired-backup-lib.mjs";

const exec = promisify(execFile);
const marker = "daily-managed.json";
const safeSet = /^kmt-paired-\d{8}-\d{8}$/;
const fail = (message) => { throw new Error(message); };
export async function pruneDailySets(root, keep = 30) {
  if (!Number.isInteger(keep) || keep < 1) fail("Invalid retention count.");
  const base = await fs.realpath(root);
  const candidates = [];
  for (const entry of await fs.readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory() || !safeSet.test(entry.name)) continue;
    const directory = path.join(base, entry.name);
    if ((await fs.lstat(directory)).isSymbolicLink() || await fs.realpath(directory) !== directory) continue;
    const managed = await fs.readFile(path.join(directory, marker), "utf8").then(JSON.parse).catch(() => null);
    if (managed?.format !== "kmt-daily@1" || managed.setId !== entry.name || !managed.verified || !Number.isFinite(Date.parse(managed.completedAt))) continue;
    candidates.push({ directory, completedAt: managed.completedAt });
  }
  candidates.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  for (const entry of candidates.slice(keep)) {
    // Recheck the resolved direct child immediately before deletion; no glob cleanup.
    if (path.dirname(await fs.realpath(entry.directory)) !== base || (await fs.lstat(entry.directory)).isSymbolicLink()) fail("Unsafe retention target.");
    await fs.rm(entry.directory, { recursive: true });
  }
  return candidates.slice(keep).length;
}

export async function runDailyBackup({ env = process.env, preflight = false, run = exec, backup = createPairedBackupSet, verify = loadAndVerifySet, fetchHealth = fetch, databaseClient = url => new pg.Client({ connectionString: url }) } = {}) {
  const startedAt = new Date();
  const appDir = await fs.realpath(env.APP_DIR ?? process.cwd());
  const uploadsRoot = await fs.realpath(env.UPLOADS_DIR ?? "/var/lib/kmt-legal/uploads");
  const root = assertSafeDestination({ destination: env.DATABASE_BACKUP_DIR ?? "/www/backup/kmtlegal", appDir, uploadsRoot });
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const backupRoot = await fs.realpath(root);
  assertSafeDestination({ destination: backupRoot, appDir, uploadsRoot });
  if (!env.DATABASE_URL) fail("DATABASE_URL is required.");
  const recoveryEnvFile = env.ENV_FILE ?? path.join(appDir, ".env.production.local");
  if (!(await fs.stat(recoveryEnvFile)).isFile()) fail("Protected restoration configuration is missing.");
  const names = [env.PM2_APP ?? "kmtlegal", ...(env.PAYMENT_MAINTENANCE_PM2_ENABLED === "false" ? [] : [env.PM2_PAYMENT_MAINTENANCE_APP ?? "kmtlegal-payment-maintenance"]), ...(env.KMT_ADDITIONAL_WRITER_APPS ?? "").split(",").filter(Boolean)];
  if (names.some(name => !/^[a-zA-Z0-9_-]+$/.test(name)) || new Set(names).size !== names.length) fail("Invalid PM2 writer inventory.");
  const processes = JSON.parse((await run("pm2", ["jlist"])).stdout);
  if (names.some(name => !processes.some(proc => proc.name === name && proc.pm2_env?.status === "online"))) fail("All declared writer applications must be online before maintenance.");
  const db = databaseClient(env.DATABASE_URL);
  let databaseBytes; let major;
  await db.connect();
  try { const result = await db.query("SELECT pg_database_size(current_database())::text AS bytes, current_setting('server_version_num') AS version"); databaseBytes = BigInt(result.rows[0].bytes); major = Math.floor(Number(result.rows[0].version) / 10000); }
  finally { await db.end(); }
  const binDir = env.POSTGRES_BACKUP_BIN_DIR ?? "";
  const versions = [];
  for (const name of ["pg_dump", "pg_restore"]) {
    const output = (await run(binDir ? path.join(binDir, name) : name, ["--version"])).stdout;
    const version = Number(output.match(/\b(\d+)\.\d+/)?.[1]);
    if (!version || version < major) fail("Install a compatible PostgreSQL backup tool pair."); versions.push(version);
  }
  if (versions[0] !== versions[1]) fail("pg_dump and pg_restore major versions must match.");
  await run("tar", ["--version"]);
  const inventory = await inventoryUploads(uploadsRoot);
  let uploadBytes = 0n;
  for (const item of inventory) uploadBytes += (await fs.stat(path.join(uploadsRoot, item.relative), { bigint: true })).size;
  const stats = await fs.statfs(backupRoot, { bigint: true });
  if (stats.bavail * stats.bsize < (databaseBytes + uploadBytes) * 2n + 1024n ** 3n) fail("Insufficient free space for a verified paired snapshot.");
  if (preflight) return { ok: true, stage: "preflight", writers: names, serverMajor: major, backupRoot };
  const receipt = await fs.readFile(env.DAILY_BACKUP_RESTORE_RECEIPT ?? "", "utf8").then(JSON.parse).catch(() => null);
  if (!receipt?.restoreDrillVerified || !receipt?.clientAndDocumentCheckVerified || !Number.isFinite(Date.parse(receipt.verifiedAt)) || Date.now() - Date.parse(receipt.verifiedAt) > 31 * 86400000 || Date.parse(receipt.verifiedAt) > Date.now()) fail("A successful isolated restore and account/document check receipt within 31 days is required.");
  const zone = (await run("timedatectl", ["show", "--property=Timezone", "--value"])).stdout.trim();
  if (zone !== "Africa/Cairo") fail("The aaPanel daily schedule requires the server timezone Africa/Cairo.");
  const stopped = []; let result; let failure = null; let recovered = false; let bytes = 0; let interrupted = false; let stage = "STOP_WRITERS"; let failureStage = null;
  const onSignal = () => { interrupted = true; };
  const assertRunning = () => { if (interrupted) fail("Maintenance interrupted; restoring writers."); };
  process.on("SIGTERM", onSignal); process.on("SIGINT", onSignal);
  try {
    for (const name of names) { assertRunning(); stopped.push(name); await run("pm2", ["stop", name]); }
    // PM2 waits for process termination; the paired engine then rejects any remaining DB connections.
    stage = "CAPTURE";
    const release = (await run("git", ["-C", appDir, "rev-parse", "HEAD"])).stdout.trim();
    assertRunning();
    result = await backup({ env: { ...env, APP_RELEASE: release }, backupRoot, uploadsRoot, appDir, captureMode: "maintenance-window", requireQuiet: true, requireConsistent: true, pauseRecord: `PM2 stopped: ${names.join(",")}; shared deployment lock held` });
    if (!result.verifiedConsistent || !result.checksumsVerified) fail("Backup consistency verification failed.");
    stage = "VERIFY_CONFIGURATION";
    const configuration = path.join(result.directory, "recovery.env");
    await fs.copyFile(recoveryEnvFile, configuration); await fs.chmod(configuration, 0o600);
    const manifestPath = path.join(result.directory, MANIFEST_NAME);
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    manifest.artifacts.push({ name: "recovery.env", bytes: (await fs.stat(configuration)).size, sha256: await sha256File(configuration) });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 });
    await fs.writeFile(path.join(result.directory, MANIFEST_CHECKSUM_NAME), `${await sha256File(manifestPath)}  ${MANIFEST_NAME}\n`, { mode: 0o600 });
    await verify({ backupRoot, setId: result.setId });
    bytes = manifest.artifacts.reduce((sum, item) => sum + item.bytes, 0);
    assertRunning();
  } catch (error) { failure = error; failureStage = stage; }
  finally {
    const restartErrors = [];
    for (const name of stopped.reverse()) { try { await run("pm2", ["restart", name]); } catch { restartErrors.push(name); } }
    if (restartErrors.length) { failureStage = "RESTART_WRITERS"; failure = new Error("One or more PM2 applications failed to restart; inspect PM2 immediately."); }
    else {
      for (let attempt = 0; attempt < 15; attempt++) {
        try { const response = await fetchHealth(`http://127.0.0.1:${env.PORT ?? "3000"}/api/health`, { signal: AbortSignal.timeout(3000), cache: "no-store" }); if (response.ok) { recovered = true; break; } } catch { /* bounded readiness polling */ }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      if (!recovered) { failureStage = "HEALTH_CHECK"; failure = new Error("Application health did not recover after maintenance."); }
    }
    process.off("SIGTERM", onSignal); process.off("SIGINT", onSignal);
    const status = { ok: !failure, completedAt: new Date().toISOString(), durationMs: Date.now() - startedAt.getTime(), bytes, setId: result?.setId ?? null, servicesRecovered: recovered, failure: failure ? failureStage : null };
    await fs.writeFile(path.join(backupRoot, "daily-last-attempt.json"), JSON.stringify(status, null, 2), { mode: 0o600 });
    if (!failure && result) {
      await fs.writeFile(path.join(result.directory, marker), JSON.stringify({ format: "kmt-daily@1", setId: result.setId, completedAt: status.completedAt, verified: true }), { mode: 0o600 });
      await fs.writeFile(path.join(backupRoot, "daily-last-success.json"), JSON.stringify(status, null, 2), { mode: 0o600 });
      await pruneDailySets(backupRoot, 30);
    }
  }
  if (failure) throw failure;
  return { ok: true, setId: result.setId, servicesRecovered: recovered };
}

if (process.argv[1]?.endsWith("daily-paired-backup.mjs")) {
  if (process.env.KMT_DAILY_LOCK_HELD !== "1") { console.error("Run through deploy/install/aapanel-daily-backup.sh so deployment and backup share a lock."); process.exitCode = 1; }
  else runDailyBackup({ preflight: process.argv.includes("--preflight") }).then(result => console.log(JSON.stringify(result)), () => { console.error("Daily backup failed. Check PM2 health and the protected daily status record. No credentials are printed."); process.exitCode = 1; });
}
