// Safe restore for paired backup sets. DEFAULT IS DRY-RUN (inspect only).
// Apply mode (writes) requires ALL of:
//   --apply --set=<setId> --target-database-url=<url> --target-uploads=<dir> --confirm=<setId>
//
// Refuses: production/source overlap, non-empty targets, bad checksums,
// archive traversal, and letting the archive's DB name override the target.
// DB-object ownership (--no-owner) and application user permissions are
// different concerns: objects land owned by the restore role; grants follow
// existing project conventions afterwards.

import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import pg from "pg";
import {
  DB_DUMP_NAME,
  MANIFEST_CHECKSUM_NAME,
  MANIFEST_NAME,
  REQUIRED_ARTIFACTS,
  UPLOADS_ARCHIVE_NAME,
  assertArchiveEntriesSafe,
  assertDistinctTargets,
  assertSafeDestination,
  databaseNameFromUrl,
  logEvent,
  redactDatabaseUrl,
  sha256File,
  validateManifest,
  verifySetIntegrity
} from "./paired-backup-lib.mjs";

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) out[match[1]] = match[2];
    else if (arg.startsWith("--")) out[arg.slice(2)] = true;
  }
  return out;
}

export async function loadAndVerifySet({ backupRoot, setId }) {
  const setDir = path.join(path.resolve(backupRoot), setId);
  for (const name of REQUIRED_ARTIFACTS) {
    const stat = await fs.stat(path.join(setDir, name)).catch(() => null);
    if (!stat || !stat.isFile()) {
      const error = new Error(`[paired-restore:incomplete] Backup set is missing ${name}; refusing restore.`);
      error.stage = "incomplete";
      throw error;
    }
  }
  const sidecar = (await fs.readFile(path.join(setDir, MANIFEST_CHECKSUM_NAME), "utf8")).split(/\s+/)[0];
  const manifestDigest = await sha256File(path.join(setDir, MANIFEST_NAME));
  if (sidecar !== manifestDigest) {
    const error = new Error("[paired-restore:integrity] Manifest checksum mismatch; refusing restore.");
    error.stage = "integrity";
    throw error;
  }
  const manifest = JSON.parse(await fs.readFile(path.join(setDir, MANIFEST_NAME), "utf8"));
  validateManifest(manifest);
  if (manifest.setId !== setId) {
    const error = new Error("[paired-restore:manifest] Manifest setId does not match the requested set.");
    error.stage = "manifest";
    throw error;
  }
  await verifySetIntegrity(setDir, manifest);
  return { setDir, manifest };
}

async function runTool(run, stage, cmd, args) {
  try {
    return await run(cmd, args);
  } catch (error) {
    if (!error.stage) error.stage = stage;
    throw error;
  }
}

async function listArchiveEntries(run, archivePath) {
  const { stdout } = await runTool(run, "archive", "tar", ["-tzf", archivePath]);
  return String(stdout).split("\n").map((line) => line.trim()).filter(Boolean);
}

async function assertEmptyDatabase(pgModule, targetDatabaseUrl) {
  const client = new pgModule.Client({ connectionString: targetDatabaseUrl });
  await client.connect();
  try {
    const { rows } = await client.query("SELECT count(*)::int AS count FROM pg_tables WHERE schemaname = 'public'");
    if (rows[0].count !== 0) {
      const error = new Error("[paired-restore:restore-target] Target database is not empty; refusing overwrite. Use a new empty database.");
      error.stage = "restore-target";
      throw error;
    }
  } finally {
    await client.end().catch(() => {});
  }
}

async function assertEmptyDir(dir) {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const entries = await fs.readdir(dir);
  if (entries.length !== 0) {
    const error = new Error(`[paired-restore:restore-target] Target uploads directory is not empty: ${dir}`);
    error.stage = "restore-target";
    throw error;
  }
}

function sha256Buffer(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Drill verification against the RESTORED database (never the live source):
// every non-deleted Document row must resolve to restored bytes, matching the
// manifest inventory where listed. A required missing file or checksum
// mismatch FAILS verification — never re-upload recovery, never silent.
// Extra archived files are reported as a separate finding, not a failure.
export async function verifyRestoredDocuments({ targetDatabaseUrl, targetUploads, manifest }, deps = {}) {
  const pgModule = deps.pgModule ?? pg;
  const client = new pgModule.Client({ connectionString: targetDatabaseUrl });
  await client.connect();
  let rows;
  try {
    const result = await client.query('SELECT "fileKey" FROM "Document" WHERE "deletedAt" IS NULL');
    rows = result.rows;
  } catch {
    return { checked: false, note: "skipped-no-document-table" };
  } finally {
    await client.end().catch(() => {});
  }
  const expected = new Map(manifest.uploads.files.map((file) => [file.relative, file.sha256]));
  const referenced = new Set();
  const missing = [];
  const mismatched = [];
  for (const row of rows) {
    const relative = String(row.fileKey ?? "").replace(/\\/g, "/").replace(/^\.\//, "");
    if (!relative || relative.startsWith("/") || relative === ".." || relative.startsWith("../") || relative.includes("/../")) {
      missing.push(relative || "(empty-fileKey)");
      continue;
    }
    referenced.add(relative);
    const absolute = path.join(targetUploads, relative);
    if (!absolute.startsWith(targetUploads + path.sep)) {
      missing.push(relative);
      continue;
    }
    const data = await fs.readFile(absolute).catch(() => null);
    if (!data) {
      missing.push(relative);
      continue;
    }
    const digest = sha256Buffer(data);
    if (!expected.has(relative) || expected.get(relative) !== digest) {
      if (!expected.has(relative)) missing.push(relative);
      else mismatched.push(relative);
    }
  }
  const restored = await (await import("./paired-backup-lib.mjs")).inventoryUploads(targetUploads);
  const extra = restored.map((file) => file.relative).filter((relative) => !referenced.has(relative));
  if (missing.length !== 0 || mismatched.length !== 0) {
    const error = new Error(
      `[paired-restore:verify] ${missing.length} required file(s) missing, ${mismatched.length} checksum mismatch(es).` +
        ` Samples: ${[...missing, ...mismatched].slice(0, 5).join(", ")}. Restored targets preserved for diagnosis; not reported as success.`
    );
    error.stage = "verify";
    error.detail = { missing: missing.length, mismatched: mismatched.length, extra: extra.length };
    throw error;
  }
  return { checked: true, required: referenced.size, extra };
}

export async function inspectBackupSet(options = {}, deps = {}) {
  const run = deps.exec ?? execFileAsync;
  const { setDir, manifest } = await loadAndVerifySet({ backupRoot: options.backupRoot, setId: options.setId });
  const entries = await listArchiveEntries(run, path.join(setDir, UPLOADS_ARCHIVE_NAME));
  assertArchiveEntriesSafe(entries);
  const report = {
    ok: true,
    dryRun: true,
    setId: manifest.setId,
    createdAt: manifest.createdAt,
    artifacts: manifest.artifacts,
    archiveEntries: entries.length,
    fileInventory: manifest.uploads.fileCount,
    verifiedConsistent: manifest.consistency.verifiedConsistent === true,
    restoreDrillVerified: false,
    consistency: manifest.consistency
  };
  logEvent({ ...report, database: manifest.database?.name ?? null });
  return report;
}

export async function restorePairedBackupSet(options = {}, deps = {}) {
  const env = options.env ?? process.env;
  const run = deps.exec ?? execFileAsync;
  const pgModule = deps.pgModule ?? pg;
  const { setDir, manifest } = await loadAndVerifySet({ backupRoot: options.backupRoot, setId: options.setId });

  const targetDatabaseUrl = options.targetDatabaseUrl ?? env.PAIRED_RESTORE_DATABASE_URL;
  const targetUploads = options.targetUploads;
  if (!targetDatabaseUrl) throwRestore("restore-target", "A separately designated target database URL is required (PAIRED_RESTORE_DATABASE_URL).");
  if (!targetUploads) throwRestore("restore-target", "A separate target uploads directory is required (--target-uploads).");
  if (options.confirm !== options.setId) throwRestore("restore-target", "Explicit confirmation is required: --confirm=<setId> must match the backup set.");
  const sourceDatabaseUrl = options.sourceDatabaseUrl ?? env.DATABASE_URL ?? "";
  if (sourceDatabaseUrl && targetDatabaseUrl === sourceDatabaseUrl) {
    throwRestore("restore-target", "Restore target must not be the source/production database.");
  }
  const sourceUploads = manifest.uploads.source;
  const target = assertDistinctTargets({ targetUploads, sourceUploads, backupDir: options.backupRoot });
  await assertEmptyDatabase(pgModule, targetDatabaseUrl);
  await assertEmptyDir(target);

  const entries = await listArchiveEntries(run, path.join(setDir, UPLOADS_ARCHIVE_NAME));
  assertArchiveEntriesSafe(entries);

  const binDir = options.binDir ?? env.POSTGRES_BACKUP_BIN_DIR ?? "";
  const dumpTool = binDir ? path.join(binDir, "pg_restore") : "pg_restore";
  const targetDbName = databaseNameFromUrl(targetDatabaseUrl);
  // No --create: the archive's original DB name must never override the designated target.
  await runTool(run, "restore-database", dumpTool, [`--dbname=${targetDatabaseUrl}`, "--no-owner", "--exit-on-error", path.join(setDir, DB_DUMP_NAME)]);
  await runTool(run, "restore-files", "tar", ["-xzf", path.join(setDir, UPLOADS_ARCHIVE_NAME), "-C", target, "--no-same-owner"]);

  const { inventoryUploads } = await import("./paired-backup-lib.mjs");
  const restored = await inventoryUploads(target);
  const expected = new Map(manifest.uploads.files.map((file) => [file.relative, file.sha256]));
  if (restored.length !== expected.size) throwRestore("verify", "Restored file count does not match the manifest inventory.");
  for (const file of restored) {
    if (expected.get(file.relative) !== file.sha256) throwRestore("verify", `Restored file mismatch: ${file.relative}`);
  }

  let documentCheck = { checked: false, note: "not-requested" };
  if (options.verifyDocuments ?? env.PAIRED_RESTORE_VERIFY_DOCUMENTS === "true") {
    documentCheck = await verifyRestoredDocuments({ targetDatabaseUrl, targetUploads: target, manifest }, { pgModule });
  }

  const completion = {
    ok: true,
    dryRun: false,
    setId: manifest.setId,
    targetDatabase: redactDatabaseUrl(targetDatabaseUrl),
    targetUploads: target,
    files: restored.length,
    verifiedConsistent: manifest.consistency.verifiedConsistent === true,
    restoreDrillVerified: false,
    documentCheck
  };
  logEvent(completion);
  return completion;
}

function throwRestore(stage, message) {
  const error = new Error(`[paired-restore:${stage}] ${message}`);
  error.stage = stage;
  throw error;
}

const invokedAsCli = process.argv[1] && process.argv[1].endsWith("paired-restore.mjs");
if (invokedAsCli) {
  const args = parseArgs(process.argv.slice(2));
  const env = process.env;
  (async () => {
    if (!args.apply) {
      if (!args.set) throwRestore("config", "--set=<setId> is required (dry-run inspection).");
      await inspectBackupSet({ backupRoot: args["backup-root"] ?? env.DATABASE_BACKUP_DIR, setId: args.set });
      return;
    }
    await restorePairedBackupSet({
      backupRoot: args["backup-root"] ?? env.DATABASE_BACKUP_DIR,
      setId: args.set,
      targetUploads: args["target-uploads"],
      confirm: args.confirm,
      verifyDocuments: args["verify-documents"] === true,
      env
    });
  })().then(
    () => {},
    () => {
      process.exitCode = 1;
    }
  );
}

export { assertSafeDestination };
