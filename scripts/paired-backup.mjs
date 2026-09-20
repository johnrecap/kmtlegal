// Paired backup set: PostgreSQL custom-format dump + private uploads archive.
// Usage (server):
//   DATABASE_URL=... DATABASE_BACKUP_DIR=... UPLOADS_DIR=... APP_RELEASE=... \
//     node scripts/paired-backup.mjs [--require-quiet]
//
// Publishes <DATABASE_BACKUP_DIR>/<setId>/ ONLY when dump + archive + manifest +
// checksums all verify. Never deletes or prunes previous backups.

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import pg from "pg";
import {
  DB_DUMP_NAME,
  LOCK_NAME,
  MANIFEST_CHECKSUM_NAME,
  MANIFEST_NAME,
  UPLOADS_ARCHIVE_NAME,
  acquireLock,
  assertSafeDestination,
  buildManifest,
  databaseNameFromUrl,
  inventoryUploads,
  logEvent,
  redactDatabaseUrl,
  releaseLock,
  sha256File
} from "./paired-backup-lib.mjs";

const execFileAsync = promisify(execFile);

function toolPath(name, binDir) {
  if (binDir) return path.join(binDir, name);
  return name;
}

async function runTool(run, stage, cmd, args) {
  try {
    return await run(cmd, args);
  } catch (error) {
    if (!error.stage) error.stage = stage;
    throw error;
  }
}

async function countOtherBackends(databaseUrl, pgModule) {
  const client = new pgModule.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const { rows } = await client.query(
      "SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND backend_type = 'client backend' AND pid <> pg_backend_pid()"
    );
    return rows[0].count;
  } finally {
    await client.end().catch(() => {});
  }
}

function parseCliArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) out[match[1]] = match[2];
    else if (arg.startsWith("--")) out[arg.slice(2)] = true;
  }
  return out;
}

export async function createPairedBackupSet(options = {}, deps = {}) {
  const env = options.env ?? process.env;
  const run = deps.exec ?? execFileAsync;
  const databaseUrl = options.databaseUrl ?? env.DATABASE_URL;
  const backupRoot = options.backupRoot ?? env.DATABASE_BACKUP_DIR;
  const uploadsRoot = options.uploadsRoot ?? env.UPLOADS_DIR ?? "/var/lib/kmt-legal/uploads";
  if (!databaseUrl) throwStage("config", "DATABASE_URL is required.");
  if (!backupRoot) throwStage("config", "DATABASE_BACKUP_DIR is required.");
  const binDir = options.binDir ?? env.POSTGRES_BACKUP_BIN_DIR ?? "";
  const appDir = options.appDir ?? env.APP_DIR ?? process.cwd();
  const setId = options.setId ?? `kmt-paired-${new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").slice(0, 17)}`;

  const dest = assertSafeDestination({ destination: backupRoot, uploadsRoot, appDir });
  const uploadsStat = await fs.stat(uploadsRoot).catch(() => throwStage("uploads-source", `UPLOADS_DIR is missing or unreadable: ${uploadsRoot}`));
  if (!uploadsStat.isDirectory()) throwStage("uploads-source", `UPLOADS_DIR is not a directory: ${uploadsRoot}`);

  await fs.mkdir(dest, { recursive: true, mode: 0o700 });
  const lockPath = path.join(dest, LOCK_NAME);
  await acquireLock(lockPath);
  const tmpDir = path.join(dest, `.tmp-${setId}`);
  const finalDir = path.join(dest, setId);
  try {
    if (await fs.stat(finalDir).then(() => true, () => false)) throwStage("publish", `Backup set already exists: ${setId}`);
    await fs.mkdir(tmpDir, { recursive: true, mode: 0o700 });

    const captureMode = options.captureMode ?? env.PAIRED_BACKUP_CAPTURE_MODE ?? "live";
    if (captureMode !== "live" && captureMode !== "maintenance-window") {
      throwStage("config", "capture mode must be live or maintenance-window.");
    }
    const pauseRecord = options.pauseRecord ?? env.PAIRED_BACKUP_PAUSE_RECORD ?? null;
    if (captureMode === "maintenance-window" && !pauseRecord) {
      throwStage("consistency", "maintenance-window capture requires --pause-record describing how writers were paused; refusing verified-consistent completion.");
    }
    const quietDiagnostic = options.requireQuiet ?? env.PAIRED_BACKUP_REQUIRE_QUIET === "true";
    const pgModule = deps.pgModule ?? pg;
    const writerChecks = [];
    async function writerDiagnostic(label) {
      const count = await countOtherBackends(databaseUrl, pgModule);
      writerChecks.push({ at: label, otherBackends: count, isoTime: new Date().toISOString() });
      return count;
    }
    let startWriters = null;
    if (captureMode === "maintenance-window" || quietDiagnostic) {
      startWriters = await writerDiagnostic("capture-start");
      if (startWriters !== 0) {
        throwStage("quiesce", "Other database writers are connected; refusing capture. Pause writers first (see runbook). A quiet activity reading is diagnostic only, never proof.");
      }
    }
    const dumpPath = path.join(tmpDir, DB_DUMP_NAME);
    await runTool(run, "database-dump", toolPath("pg_dump", binDir), ["--dbname=" + databaseUrl, "--format=custom", `--file=${dumpPath}`]);
    const dumpStat = await fs.stat(dumpPath).catch(() => throwStage("database-dump", "pg_dump produced no file."));
    if (!dumpStat.isFile() || dumpStat.size === 0) throwStage("database-dump", "Database dump is empty.");
    await runTool(run, "database-verify", toolPath("pg_restore", binDir), ["--list", dumpPath]);

    const fileInventory = await inventoryUploads(uploadsRoot);
    const archivePath = path.join(tmpDir, UPLOADS_ARCHIVE_NAME);
    await runTool(run, "uploads-archive", "tar", ["-czf", archivePath, "-C", uploadsRoot, "."]);
    const archiveStat = await fs.stat(archivePath).catch(() => throwStage("uploads-archive", "tar produced no archive."));
    if (!archiveStat.isFile() || archiveStat.size === 0) throwStage("uploads-archive", "Uploads archive is empty.");

    let endWriters = null;
    if (captureMode === "maintenance-window") {
      endWriters = await writerDiagnostic("pre-publish");
      if (endWriters !== 0) {
        throwStage("quiesce", "Writers appeared during capture; refusing verified-consistent completion.");
      }
    }
    const verifiedConsistent =
      captureMode === "maintenance-window" && startWriters === 0 && endWriters === 0;
    if ((options.requireConsistent ?? env.PAIRED_BACKUP_REQUIRE_CONSISTENT === "true") && !verifiedConsistent) {
      throwStage("consistency", "Verified-consistent completion required but not established; refusing.");
    }

    const dumpVersion = await runTool(run, "tools", toolPath("pg_dump", binDir), ["--version"]).then((r) => String(r.stdout).trim().split("\n")[0]);
    const restoreVersion = await runTool(run, "tools", toolPath("pg_restore", binDir), ["--version"]).then((r) => String(r.stdout).trim().split("\n")[0]);
    const tarVersion = await runTool(run, "tools", "tar", ["--version"]).then((r) => String(r.stdout).trim().split("\n")[0]);
    let dbServerVersion = null;
    try {
      dbServerVersion = await databaseServerVersion(databaseUrl, deps.pgModule ?? pg);
    } catch {
      dbServerVersion = null;
    }

    const artifacts = [];
    for (const name of [DB_DUMP_NAME, UPLOADS_ARCHIVE_NAME]) {
      const absolute = path.join(tmpDir, name);
      const stat = await fs.stat(absolute);
      artifacts.push({ name, bytes: stat.size, sha256: await sha256File(absolute) });
      await fs.chmod(absolute, 0o600);
    }
    const manifest = buildManifest({
      setId,
      createdAt: new Date().toISOString(),
      appRelease: env.APP_RELEASE ?? null,
      artifacts,
      dbName: databaseNameFromUrl(databaseUrl),
      dbServerVersion,
      toolVersions: { pg_dump: dumpVersion, pg_restore: restoreVersion, tar: tarVersion },
      uploadsSource: uploadsRoot,
      fileInventory,
      consistency: {
        mode: captureMode,
        verifiedConsistent,
        writerPauseEvidence: {
          pauseRecord,
          writerChecks,
          operatorAttested: captureMode === "maintenance-window",
          diagnosticOnlyNote: "pg_stat_activity readings are point-in-time diagnostics, not proof that future writes are prevented. The writer pause itself is established by the operator procedure (runbook pause/verify/capture/resume), never by this script's lock or readings."
        },
        boundary: "pg_dump runs in a single-transaction snapshot; the uploads archive is captured immediately after the dump verifies. A required database row without restored file bytes is a failed/incomplete restore (see restore --verify-documents), never a re-upload recovery."
      }
    });
    const manifestPath = path.join(tmpDir, MANIFEST_NAME);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
    const checksumPath = path.join(tmpDir, MANIFEST_CHECKSUM_NAME);
    await fs.writeFile(checksumPath, `${await sha256File(manifestPath)}  ${MANIFEST_NAME}\n`, { mode: 0o600 });

    await fs.rename(tmpDir, finalDir);
    const completion = {
      ok: true,
      setId,
      directory: finalDir,
      artifactsVerified: true,
      checksumsVerified: true,
      verifiedConsistent,
      restoreDrillVerified: false
    };
    logEvent({ ...completion, database: redactDatabaseUrl(databaseUrl), files: fileInventory.length });
    return completion;
  } catch (error) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    logEvent({ ok: false, setId, stage: error.stage ?? "unknown", message: String(error.message).slice(0, 300) });
    throw error;
  } finally {
    await releaseLock(lockPath);
  }
}

async function databaseServerVersion(databaseUrl, pgModule) {
  const client = new pgModule.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const { rows } = await client.query("SHOW server_version");
    return rows[0]?.server_version ?? null;
  } finally {
    await client.end().catch(() => {});
  }
}

function throwStage(stage, message) {
  const error = new Error(`[paired-backup:${stage}] ${message}`);
  error.stage = stage;
  throw error;
}

const invokedAsCli = process.argv[1] && process.argv[1].endsWith("paired-backup.mjs");
if (invokedAsCli) {
  const args = parseCliArgs(process.argv.slice(2));
  createPairedBackupSet({
    requireQuiet: args["require-quiet"] === true,
    captureMode: args["capture-mode"],
    pauseRecord: args["pause-record"],
    requireConsistent: args["require-consistent"] === true
  }).then(
    () => {},
    (error) => {
      process.exitCode = 1;
    }
  );
}
