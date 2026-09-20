// Shared helpers for paired DB + uploads backup sets (launch fixes TASK 03).
// No secrets are ever written to manifests or logs; connection strings are redacted.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const MANIFEST_NAME = "manifest.json";
export const MANIFEST_CHECKSUM_NAME = "manifest.sha256";
export const DB_DUMP_NAME = "database.dump";
export const UPLOADS_ARCHIVE_NAME = "uploads.tar.gz";
export const LOCK_NAME = ".paired-backup.lock";
export const REQUIRED_ARTIFACTS = [DB_DUMP_NAME, UPLOADS_ARCHIVE_NAME, MANIFEST_NAME, MANIFEST_CHECKSUM_NAME];

function fail(stage, message) {
  const error = new Error(`[paired-backup:${stage}] ${message}`);
  error.stage = stage;
  throw error;
}

export function redactDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || "5432"}/${dbName}`;
  } catch {
    return "(unparseable-database-url)";
  }
}

export function databaseNameFromUrl(databaseUrl) {
  try {
    return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
  } catch {
    fail("config", "DATABASE_URL is not a valid URL.");
  }
}

export function logEvent(event) {
  console.log(JSON.stringify({ scope: "paired-backup", at: new Date().toISOString(), ...event }));
}

export async function sha256File(absolutePath) {
  const hash = crypto.createHash("sha256");
  const handle = await fs.open(absolutePath, "r");
  try {
    for await (const chunk of handle.createReadStream()) hash.update(chunk);
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

// Inventory private files; symlinks are refused (same rule as batch3 disposable restore).
export async function inventoryUploads(root, prefix = "") {
  const out = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) fail("uploads-scan", `Symlink refused in uploads: ${path.join(prefix, entry.name)}`);
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...(await inventoryUploads(absolute, relative)));
    else if (entry.isFile()) out.push({ relative: relative.split(path.sep).join("/"), sha256: await sha256File(absolute) });
  }
  return out.sort((a, b) => (a.relative < b.relative ? -1 : 1));
}

export function assertSafeDestination({ destination, uploadsRoot, appDir }) {
  const dest = path.resolve(destination);
  const uploads = path.resolve(uploadsRoot);
  if (dest === uploads || dest.startsWith(uploads + path.sep)) {
    fail("destination", "Backup destination must not be inside UPLOADS_DIR.");
  }
  if (appDir) {
    const app = path.resolve(appDir);
    if (dest === app || dest.startsWith(app + path.sep)) {
      fail("destination", "Backup destination must be outside the application checkout.");
    }
  }
  if (/(^|[/\\])public([/\\]|$)/.test(dest)) fail("destination", "Backup destination must not look like a public web directory.");
  return dest;
}

export function assertDistinctTargets({ targetUploads, sourceUploads, backupDir }) {
  const target = path.resolve(targetUploads);
  for (const other of [sourceUploads, backupDir]) {
    if (!other) continue;
    const resolved = path.resolve(other);
    if (target === resolved || target.startsWith(resolved + path.sep)) {
      fail("restore-target", `Restore target must be separate from ${resolved}.`);
    }
  }
  return target;
}

export function assertArchiveEntriesSafe(entries) {
  for (const raw of entries) {
    const entry = String(raw).replace(/^\.\//, "");
    if (!entry || entry.startsWith("/") || /^[a-zA-Z]:/.test(entry)) fail("archive", `Absolute archive entry refused: ${raw}`);
    const normalized = path.posix.normalize(entry);
    if (normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
      fail("archive", `Path traversal refused: ${raw}`);
    }
  }
}

export function buildManifest({ setId, createdAt, appRelease, artifacts, dbName, dbServerVersion, toolVersions, uploadsSource, fileInventory, consistency }) {
  return {
    format: "kmt-paired-backup-set@1",
    setId,
    createdAt,
    appRelease: appRelease || null,
    artifacts,
    database: { name: dbName, serverVersion: dbServerVersion || null },
    tools: toolVersions,
    uploads: { source: uploadsSource, fileCount: fileInventory.length, files: fileInventory },
    consistency
  };
}

export function validateManifest(manifest) {
  if (!manifest || manifest.format !== "kmt-paired-backup-set@1") fail("manifest", "Unknown manifest format.");
  if (!manifest.setId || !manifest.createdAt || !Array.isArray(manifest.artifacts)) fail("manifest", "Manifest is missing required fields.");
  for (const artifact of manifest.artifacts) {
    if (!artifact.name || !artifact.sha256 || !Number.isFinite(artifact.bytes)) {
      fail("manifest", `Manifest artifact entry is incomplete: ${artifact?.name ?? "?"}`);
    }
  }
  if (!manifest.uploads || !Array.isArray(manifest.uploads.files)) fail("manifest", "Manifest uploads inventory is missing.");
  const consistency = manifest.consistency;
  if (!consistency || (consistency.mode !== "live" && consistency.mode !== "maintenance-window")) {
    fail("manifest", "Manifest consistency mode is missing (live|maintenance-window).");
  }
  if (typeof consistency.verifiedConsistent !== "boolean") {
    fail("manifest", "Manifest must state verifiedConsistent explicitly.");
  }
  return true;
}

export async function verifySetIntegrity(setDir, manifest) {
  validateManifest(manifest);
  // The manifest itself is verified by the manifest.sha256 sidecar before this call.
  for (const artifact of manifest.artifacts) {
    if (artifact.name === MANIFEST_NAME || artifact.name === MANIFEST_CHECKSUM_NAME) {
      fail("integrity", `Manifest must not self-reference: ${artifact.name}`);
    }
    const absolute = path.join(setDir, artifact.name);
    const stat = await fs.stat(absolute).catch(() => fail("integrity", `Artifact missing: ${artifact.name}`));
    if (!stat.isFile() || stat.size !== artifact.bytes) fail("integrity", `Artifact size mismatch: ${artifact.name}`);
    const digest = await sha256File(absolute);
    if (digest !== artifact.sha256) fail("integrity", `Checksum mismatch: ${artifact.name}`);
  }
  return true;
}

export async function acquireLock(lockPath) {
  try {
    const handle = await fs.open(lockPath, "wx", 0o600);
    await handle.writeFile(`${process.pid}\n`);
    await handle.close();
  } catch {
    fail("lock", "Another paired backup run holds the lock; refusing concurrent run.");
  }
}

export async function releaseLock(lockPath) {
  await fs.rm(lockPath, { force: true });
}
