// Standalone regression lane when the native Vitest bundler is unavailable.
// Real temporary files; database, PM2, dump and health integrations are synthetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runDailyBackup, pruneDailySets } from "../../scripts/daily-paired-backup.mjs";
import { MANIFEST_NAME } from "../../scripts/paired-backup-lib.mjs";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "kmt-retention-"));
  const resolvedRoot = await fs.realpath(root);
  t.after(async () => {
    assert.equal(await fs.realpath(root), resolvedRoot);
    assert.equal(path.dirname(resolvedRoot), await fs.realpath(os.tmpdir()));
    await fs.rm(resolvedRoot, { recursive: true, force: true });
  });
  const app = path.join(root, "app"), uploads = path.join(root, "uploads"), base = path.join(root, "backups");
  for (const folder of [app, uploads, base]) await fs.mkdir(folder);
  await fs.writeFile(path.join(app, ".env.production.local"), "APP_ENV=synthetic\n");
  const receipt = path.join(root, "receipt.json");
  await fs.writeFile(receipt, JSON.stringify({ restoreDrillVerified: true, clientAndDocumentCheckVerified: true, verifiedAt: new Date().toISOString() }));
  const oldSets = [];
  for (let i = 0; i < 30; i++) {
    const setId = `kmt-paired-20260101-${String(i).padStart(8, "0")}`;
    const folder = path.join(base, setId); await fs.mkdir(folder);
    await fs.writeFile(path.join(folder, "daily-managed.json"), JSON.stringify({ format: "kmt-daily@1", setId, verified: true, completedAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString() }));
    oldSets.push(setId);
  }
  await fs.mkdir(path.join(base, "manual-backup"));
  await fs.mkdir(path.join(base, ".tmp-incomplete"));
  const setId = "kmt-paired-20261011-03000000", directory = path.join(base, setId);
  const calls = [];
  const options = {
    env: { APP_DIR: app, UPLOADS_DIR: uploads, DATABASE_BACKUP_DIR: base, DATABASE_URL: "postgresql://synthetic.invalid/example", DAILY_BACKUP_RESTORE_RECEIPT: receipt },
    databaseClient: () => ({ connect: async () => {}, end: async () => {}, query: async () => ({ rows: [{ bytes: "1", version: "160001" }] }) }),
    run: async (command, args) => {
      calls.push([command, ...args]);
      return { stdout: command === "pm2" && args[0] === "jlist" ? JSON.stringify(["kmtlegal", "kmtlegal-payment-maintenance"].map(name => ({ name, pm2_env: { status: "online" } }))) : command === "timedatectl" ? "Africa/Cairo" : args[0] === "--version" ? "PostgreSQL 16.1" : "synthetic-release" };
    },
    backup: async () => {
      assert.deepEqual((await fs.readdir(base)).filter(name => name.startsWith("kmt-paired-")).sort(), oldSets);
      await fs.mkdir(directory); await fs.writeFile(path.join(directory, MANIFEST_NAME), JSON.stringify({ artifacts: [] }));
      return { setId, directory, verifiedConsistent: true, checksumsVerified: true };
    },
    verify: async () => { for (const id of oldSets) await fs.access(path.join(base, id)); },
    fetchHealth: async () => new Response("ok")
  };
  return { base, oldSets, setId, calls, options };
}

test("default retention keeps exactly the newest 15 managed successes", async t => {
  const f = await fixture(t);
  assert.equal(await pruneDailySets(f.base), 15);
  assert.deepEqual((await fs.readdir(f.base)).sort(), [".tmp-incomplete", "manual-backup", ...f.oldSets.slice(-15)].sort());
});

test("a verified successful run reduces 30 old successes plus the new set to the newest 15", async t => {
  const f = await fixture(t);
  assert.equal((await runDailyBackup(f.options)).ok, true);
  assert.deepEqual((await fs.readdir(f.base)).filter(name => name.startsWith("kmt-paired-")).sort(), [...f.oldSets.slice(-14), f.setId].sort());
  assert.equal(JSON.parse(await fs.readFile(path.join(f.base, "daily-last-success.json"), "utf8")).setId, f.setId);
  await fs.access(path.join(f.base, "manual-backup")); await fs.access(path.join(f.base, ".tmp-incomplete"));
});

for (const stage of ["backup", "verify"]) test(`${stage} failure retains every old successful backup`, async t => {
  const f = await fixture(t);
  f.options[stage] = async () => { throw new Error("synthetic failure"); };
  await assert.rejects(runDailyBackup(f.options), /synthetic failure/);
  for (const id of f.oldSets) await fs.access(path.join(f.base, id));
  await assert.rejects(fs.access(path.join(f.base, "daily-last-success.json")));
  assert.deepEqual(f.calls.filter(call => call[1] === "restart").map(call => call[2]).sort(), ["kmtlegal", "kmtlegal-payment-maintenance"]);
});
