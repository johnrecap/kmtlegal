import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
// Server scripts are tested with real temporary filesystem and mocked process/database adapters.
// @ts-expect-error JavaScript operational module has no declaration file.
import { runDailyBackup, pruneDailySets } from "../../scripts/daily-paired-backup.mjs";
// @ts-expect-error Operational JavaScript module.
import { MANIFEST_NAME, MANIFEST_CHECKSUM_NAME, sha256File } from "../../scripts/paired-backup-lib.mjs";
const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "kmt-daily-")); roots.push(root);
  for (const directory of ["app", "uploads", "backups"]) await mkdir(path.join(root, directory));
  await writeFile(path.join(root, "app", ".env.production.local"), "APP_ENV=synthetic\n");
  const receipt = path.join(root, "restore.json"); await writeFile(receipt, JSON.stringify({ restoreDrillVerified: true, clientAndDocumentCheckVerified: true, verifiedAt: new Date().toISOString() }));
  const calls: string[][] = [];
  const run = vi.fn(async (command: string, args: string[]) => { calls.push([command, ...args]);
    if (command === "pm2" && args[0] === "jlist") return { stdout: JSON.stringify(["kmtlegal", "kmtlegal-payment-maintenance"].map(name => ({ name, pm2_env: { status: "online" } }))) };
    return { stdout: command === "timedatectl" ? "Africa/Cairo\n" : args[0] === "--version" ? "PostgreSQL 16.1" : "synthetic-release" };
  });
  const env = { APP_DIR: path.join(root, "app"), UPLOADS_DIR: path.join(root, "uploads"), DATABASE_BACKUP_DIR: path.join(root, "backups"), DATABASE_URL: "postgresql://synthetic.invalid/example", DAILY_BACKUP_RESTORE_RECEIPT: receipt };
  const databaseClient = () => ({ connect: async () => {}, end: async () => {}, query: async () => ({ rows: [{ bytes: "1", version: "160001" }] }) });
  return { root, calls, run, env, databaseClient, fetchHealth: async () => new Response("ok") };
}
describe("daily paired backup coordinator", () => {
  it("includes protected recovery configuration in verified checksums before marking daily success", async () => {
    const f = await fixture(); const setId = "kmt-paired-20261009-03000000"; const directory = path.join(f.env.DATABASE_BACKUP_DIR, setId);
    const backup = async () => { await mkdir(directory); await writeFile(path.join(directory, MANIFEST_NAME), JSON.stringify({ artifacts: [] })); return { setId, directory, verifiedConsistent: true, checksumsVerified: true }; };
    const verify = vi.fn(async () => { const manifest = JSON.parse(await readFile(path.join(directory, MANIFEST_NAME), "utf8")); expect(manifest.artifacts).toContainEqual({ name: "recovery.env", bytes: 18, sha256: await sha256File(path.join(directory, "recovery.env")) }); expect((await readFile(path.join(directory, MANIFEST_CHECKSUM_NAME), "utf8")).split(" ")[0]).toBe(await sha256File(path.join(directory, MANIFEST_NAME))); });
    expect(await runDailyBackup({ ...f, backup, verify })).toMatchObject({ ok: true, servicesRecovered: true });
    expect(verify).toHaveBeenCalledOnce(); expect(JSON.parse(await readFile(path.join(f.env.DATABASE_BACKUP_DIR, "daily-last-success.json"), "utf8"))).toMatchObject({ bytes: 18, ok: true });
  });
  it("preflights without stopping writers or copying data", async () => { const f = await fixture(); const backup = vi.fn(); expect(await runDailyBackup({ ...f, backup, preflight: true })).toMatchObject({ ok: true, stage: "preflight" }); expect(backup).not.toHaveBeenCalled(); expect(f.calls.some(call => call.includes("stop"))).toBe(false); });
  it("restarts every stopped writer after capture failure and does not prune old snapshots", async () => {
    const f = await fixture(); await mkdir(path.join(f.env.DATABASE_BACKUP_DIR, "older-unmanaged"));
    await expect(runDailyBackup({ ...f, backup: async () => { throw new Error("synthetic dump failure"); } })).rejects.toThrow("synthetic dump failure");
    expect(f.calls.filter(call => call[1] === "restart").map(call => call[2]).sort()).toEqual(["kmtlegal", "kmtlegal-payment-maintenance"].sort());
    expect(await readdir(f.env.DATABASE_BACKUP_DIR)).toContain("older-unmanaged");
    expect(JSON.parse(await readFile(path.join(f.env.DATABASE_BACKUP_DIR, "daily-last-attempt.json"), "utf8"))).toMatchObject({ ok: false, servicesRecovered: true, failure: "CAPTURE" });
  });
  it("requires a current restore drill before downtime", async () => { const f = await fixture(); await writeFile(f.env.DAILY_BACKUP_RESTORE_RECEIPT, "{}"); await expect(runDailyBackup(f)).rejects.toThrow("restore"); expect(f.calls.some(call => call.includes("stop"))).toBe(false); });
  it("retains the newest 30 managed successes and never deletes unmanaged or malformed sets", async () => {
    const f = await fixture(); const base = f.env.DATABASE_BACKUP_DIR;
    for (let i = 0; i < 32; i++) { const setId = `kmt-paired-20261009-${String(i).padStart(8, "0")}`; const folder = path.join(base, setId); await mkdir(folder); await writeFile(path.join(folder, "daily-managed.json"), JSON.stringify({ format: "kmt-daily@1", setId, verified: true, completedAt: new Date(2026, 0, i + 1).toISOString() })); }
    await mkdir(path.join(base, "manual-backup")); await mkdir(path.join(base, ".tmp-incomplete"));
    expect(await pruneDailySets(base, 30)).toBe(2); const entries = await readdir(base); expect(entries).toHaveLength(32); expect(entries).toContain("manual-backup"); expect(entries).toContain(".tmp-incomplete");
  });
});
