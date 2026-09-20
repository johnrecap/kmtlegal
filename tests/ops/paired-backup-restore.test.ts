// MOCKED / UNIT evidence for paired backup/restore orchestration (TASK 03).
// exec (pg_dump/pg_restore/tar) and pg connections are faked; the filesystem
// checks use real temporary synthetic files. This does NOT prove a real
// restore — the disposable-environment drill is recorded separately as NOT RUN.

import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// @ts-expect-error Paired backup helpers are ESM ops scripts with narrow runtime exports.
import { assertArchiveEntriesSafe, assertSafeDestination, redactDatabaseUrl, validateManifest } from "../../scripts/paired-backup-lib.mjs";
// @ts-expect-error Paired backup helpers are ESM ops scripts with narrow runtime exports.
import { createPairedBackupSet } from "../../scripts/paired-backup.mjs";
// @ts-expect-error Paired backup helpers are ESM ops scripts with narrow runtime exports.
import { inspectBackupSet, loadAndVerifySet, restorePairedBackupSet } from "../../scripts/paired-restore.mjs";

const SECRET_URL = "postgresql://ops-user:s3cret-opaque@localhost:5432/kmt_legal";

async function makeTempRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), "kmt-paired-test-"));
}

async function makeUploads(root: string) {
  const uploads = path.join(root, "uploads");
  await fs.mkdir(path.join(uploads, "documents", "2026"), { recursive: true });
  await fs.writeFile(path.join(uploads, "documents", "2026", "a.pdf"), "%PDF-synthetic-a");
  await fs.writeFile(path.join(uploads, "hello.txt"), "synthetic");
  return uploads;
}

// Fake exec emulating pg_dump/pg_restore/tar at the filesystem level.
function makeFakeExec(staging: string, behavior: Record<string, boolean> = {}) {
  const calls: Array<{ cmd: string; args: string[] }> = [];
  async function archiveSourceDir(args: string[]) {
    const cIndex = args.indexOf("-C");
    return args[cIndex + 1];
  }
  const exec = async (cmd: string, args: string[]) => {
    calls.push({ cmd, args: args.map((a: string) => (typeof a === "string" && a.includes("s3cret") ? "<redacted-arg>" : a)) });
    const base = path.basename(cmd);
    if (base === "pg_dump" && args.includes("--version")) return { stdout: "pg_dump (PostgreSQL) 18.0" };
    if (base === "pg_dump") {
      if (behavior.failDump) throw new Error("pg_dump failed");
      const fileArg = args.find((a: string) => String(a).startsWith("--file="));
      await fs.writeFile(String(fileArg).slice("--file=".length), "SYNTHETIC-DUMP-BYTES");
      return { stdout: "" };
    }
    if (base === "pg_restore" && args.includes("--list")) {
      if (behavior.failList) throw new Error("pg_restore --list failed");
      return { stdout: "TOC" };
    }
    if (base === "pg_restore") return { stdout: "" };
    if (base === "tar" && args[0] === "-czf") {
      if (behavior.failArchive) throw new Error("tar failed");
      const source = await archiveSourceDir(args);
      await fs.cp(source, staging, { recursive: true });
      await fs.writeFile(args[1], "SYNTHETIC-TARBALL");
      return { stdout: "" };
    }
    if (base === "tar" && args[0] === "-tzf") {
      if (behavior.evilListing) return { stdout: "documents/2026/a.pdf\n../../escape.txt\n" };
      return { stdout: "documents/2026/a.pdf\nhello.txt\n" };
    }
    if (base === "tar" && args[0] === "-xzf") {
      const target = args[args.indexOf("-C") + 1];
      await fs.cp(staging, target, { recursive: true });
      return { stdout: "" };
    }
    if (args.includes("--version")) return { stdout: `${base} 1.0` };
    return { stdout: "" };
  };
  return { exec, calls };
}

function makeFakePg(emptyOrOpts: boolean | { empty?: boolean; writers?: number; documents?: Array<{ fileKey: string }> | null } = true) {
  const opts = typeof emptyOrOpts === "boolean" ? { empty: emptyOrOpts } : emptyOrOpts;
  const empty = opts.empty ?? true;
  const writers = opts.writers ?? 0;
  const documents = opts.documents ?? null;
  return {
    Client: class {
      async connect() {}
      async end() {}
      async query(sql: string) {
        if (sql.includes("pg_stat_activity")) return { rows: [{ count: writers }] };
        if (sql.includes("pg_tables")) return { rows: [{ count: empty ? 0 : 3 }] };
        if (sql.includes("server_version")) return { rows: [{ server_version: "18.0-fake" }] };
        if (sql.includes('"Document"')) {
          if (documents === null) throw new Error('relation "Document" does not exist');
          return { rows: documents };
        }
        return { rows: [] };
      }
    }
  };
}

const baseEnv = { APP_RELEASE: "test-release", PAIRED_BACKUP_REQUIRE_QUIET: "false" };

async function successfulBackup(root: string, overrides: { setId?: string; requireQuiet?: boolean; behavior?: Record<string, boolean> } = {}) {
  const uploads = await makeUploads(root);
  const backupRoot = path.join(root, "backups");
  const staging = path.join(root, "staging");
  await fs.mkdir(staging, { recursive: true });
  const { exec } = makeFakeExec(staging, overrides.behavior ?? {});
  const result = await createPairedBackupSet(
    {
      env: baseEnv,
      databaseUrl: SECRET_URL,
      backupRoot,
      uploadsRoot: uploads,
      appDir: path.join(root, "app-checkout"),
      setId: overrides.setId ?? "kmt-paired-testset",
      requireQuiet: overrides.requireQuiet ?? false
    },
    { exec, pgModule: makeFakePg() }
  );
  return { result, uploads, backupRoot, staging };
}

describe("paired backup/restore orchestration (MOCKED exec, real temp fs)", () => {
  let root: string;
  beforeEach(async () => {
    root = await makeTempRoot();
  });

  it("publishes a complete verified set and preserves previous backups", async () => {
    const { result, backupRoot } = await successfulBackup(root);
    const previous = path.join(backupRoot, "kmt-paired-older");
    await fs.mkdir(previous, { recursive: true });
    await fs.writeFile(path.join(previous, "keep.me"), "do-not-touch");
    // Second set to prove previous sets are preserved.
    const uploads = path.join(root, "uploads");
    const staging = path.join(root, "staging2");
    await fs.mkdir(staging, { recursive: true });
    const { exec } = makeFakeExec(staging, {});
    await createPairedBackupSet(
      { env: baseEnv, databaseUrl: SECRET_URL, backupRoot, uploadsRoot: uploads, appDir: path.join(root, "app"), setId: "kmt-paired-second" },
      { exec, pgModule: makeFakePg() }
    );
    expect(await fs.readFile(path.join(previous, "keep.me"), "utf8")).toBe("do-not-touch");
    expect(result.ok).toBe(true);
    const manifest = JSON.parse(await fs.readFile(path.join(result.directory, "manifest.json"), "utf8"));
    expect(validateManifest(manifest)).toBe(true);
    expect(manifest.consistency.mode).toBe("live");
    expect(manifest.consistency.verifiedConsistent).toBe(false);
    expect(result.artifactsVerified).toBe(true);
    expect(result.checksumsVerified).toBe(true);
    expect(result.verifiedConsistent).toBe(false);
    expect(result.restoreDrillVerified).toBe(false);
    const serialized = JSON.stringify(manifest);
    expect(serialized).not.toContain("s3cret");
    const stat = await fs.stat(path.join(result.directory, "database.dump"));
    // POSIX-only assertion: Windows emulates modes via the read-only bit.
    // The production target is Linux, where 0o600/0o700 are enforced.
    if (process.platform !== "win32") expect(stat.mode & 0o777).toBe(0o600);
  });

  it("fails the run on database-dump failure without publishing", async () => {
    const uploads = await makeUploads(root);
    const backupRoot = path.join(root, "backups");
    const { exec } = makeFakeExec(path.join(root, "s"), { failDump: true });
    await expect(
      createPairedBackupSet(
        { env: baseEnv, databaseUrl: SECRET_URL, backupRoot, uploadsRoot: uploads, appDir: path.join(root, "app"), setId: "kmt-paired-doomed" },
        { exec, pgModule: makeFakePg() }
      )
    ).rejects.toMatchObject({ stage: "database-dump" });
    expect(await fs.stat(path.join(backupRoot, "kmt-paired-doomed")).then(() => true, () => false)).toBe(false);
  });

  it("fails the run on uploads-archive failure without publishing", async () => {
    const uploads = await makeUploads(root);
    const backupRoot = path.join(root, "backups");
    const { exec } = makeFakeExec(path.join(root, "s"), { failArchive: true });
    await expect(
      createPairedBackupSet(
        { env: baseEnv, databaseUrl: SECRET_URL, backupRoot, uploadsRoot: uploads, appDir: path.join(root, "app"), setId: "kmt-paired-doomed2" },
        { exec, pgModule: makeFakePg() }
      )
    ).rejects.toMatchObject({ stage: "uploads-archive" });
    expect(await fs.stat(path.join(backupRoot, "kmt-paired-doomed2")).then(() => true, () => false)).toBe(false);
  });

  it("refuses unsafe or overlapping destinations", async () => {
    const uploads = await makeUploads(root);
    expect(() => assertSafeDestination({ destination: path.join(uploads, "backups"), uploadsRoot: uploads })).toThrow(/UPLOADS_DIR/);
    expect(() =>
      assertSafeDestination({ destination: path.join(root, "app-checkout", "backups"), uploadsRoot: uploads, appDir: path.join(root, "app-checkout") })
    ).toThrow(/checkout/);
    expect(() => assertSafeDestination({ destination: "/var/www/public/backups", uploadsRoot: uploads })).toThrow(/public/);
  });

  it("rejects incomplete sets and corrupted checksums on restore", async () => {
    const { backupRoot } = await successfulBackup(root);
    const setDir = path.join(backupRoot, "kmt-paired-testset");
    await fs.rm(path.join(setDir, "uploads.tar.gz"));
    await expect(loadAndVerifySet({ backupRoot, setId: "kmt-paired-testset" })).rejects.toMatchObject({ stage: "incomplete" });

    const { backupRoot: root2 } = await successfulBackup(await makeTempRoot());
    const set2 = path.join(root2, "kmt-paired-testset");
    await fs.writeFile(path.join(set2, "database.dump"), "TAMPERED");
    await expect(loadAndVerifySet({ backupRoot: root2, setId: "kmt-paired-testset" })).rejects.toMatchObject({ stage: "integrity" });
  });

  it("dry-run inspects without writing and refuses traversal listings", async () => {
    const { backupRoot } = await successfulBackup(root);
    const staging = path.join(root, "staging-dry");
    await fs.mkdir(staging, { recursive: true });
    const { exec } = makeFakeExec(staging, {});
    const report = await inspectBackupSet({ backupRoot, setId: "kmt-paired-testset" }, { exec });
    expect(report.ok).toBe(true);
    expect(report.dryRun).toBe(true);

    const { exec: evilExec } = makeFakeExec(staging, { evilListing: true });
    await expect(inspectBackupSet({ backupRoot, setId: "kmt-paired-testset" }, { exec: evilExec })).rejects.toThrow(/traversal|refused/i);
  });

  it("apply requires confirmation, separate empty targets, and verifies files", async () => {
    const { backupRoot, uploads } = await successfulBackup(root);
    const staging = path.join(root, "staging-apply");
    await fs.mkdir(staging, { recursive: true });
    // The fake tar extract materializes the staged tree; seed it like an archive would.
    await fs.cp(uploads, staging, { recursive: true });
    const { exec } = makeFakeExec(staging, {});
    const targetUploads = path.join(root, "restored-uploads");
    const targetUrl = "postgresql://restore-role:other-secret@localhost:5432/kmt_launch_restore_target";

    await expect(
      restorePairedBackupSet({ backupRoot, setId: "kmt-paired-testset", targetDatabaseUrl: targetUrl, targetUploads, confirm: "wrong-id" }, { exec, pgModule: makeFakePg() })
    ).rejects.toMatchObject({ stage: "restore-target" });

    await expect(
      restorePairedBackupSet(
        { backupRoot, setId: "kmt-paired-testset", targetDatabaseUrl: SECRET_URL, targetUploads, confirm: "kmt-paired-testset", sourceDatabaseUrl: SECRET_URL },
        { exec, pgModule: makeFakePg() }
      )
    ).rejects.toMatchObject({ stage: "restore-target" });

    const result = await restorePairedBackupSet(
      { backupRoot, setId: "kmt-paired-testset", targetDatabaseUrl: targetUrl, targetUploads, confirm: "kmt-paired-testset", sourceDatabaseUrl: SECRET_URL },
      { exec, pgModule: makeFakePg(true) }
    );
    expect(result.ok).toBe(true);
    expect(result.files).toBe(2);
    expect(await fs.readFile(path.join(targetUploads, "documents", "2026", "a.pdf"), "utf8")).toBe("%PDF-synthetic-a");
  });

  it("refuses non-empty restore databases", async () => {
    const { backupRoot } = await successfulBackup(root);
    const staging = path.join(root, "staging-nonempty");
    await fs.mkdir(staging, { recursive: true });
    const { exec } = makeFakeExec(staging, {});
    await expect(
      restorePairedBackupSet(
        {
          backupRoot,
          setId: "kmt-paired-testset",
          targetDatabaseUrl: "postgresql://r:x@localhost:5432/target",
          targetUploads: path.join(root, "t"),
          confirm: "kmt-paired-testset"
        },
        { exec, pgModule: makeFakePg(false) }
      )
    ).rejects.toMatchObject({ stage: "restore-target" });
  });

  it("redacts credentials and validates archive entries", () => {
    expect(redactDatabaseUrl(SECRET_URL)).toBe("postgresql://localhost:5432/kmt_legal");
    expect(() => assertArchiveEntriesSafe(["ok/file.txt", "/abs.txt"])).toThrow(/Absolute/);
    expect(() => assertArchiveEntriesSafe(["../escape.txt"])).toThrow(/traversal/i);
  });

  it("maintenance-window capture records two quiet readings and verifiedConsistent", async () => {
    const uploads = await makeUploads(root);
    const backupRoot = path.join(root, "backups");
    const staging = path.join(root, "staging-mw");
    await fs.mkdir(staging, { recursive: true });
    const { exec } = makeFakeExec(staging, {});
    const result = await createPairedBackupSet(
      {
        env: baseEnv,
        databaseUrl: SECRET_URL,
        backupRoot,
        uploadsRoot: uploads,
        appDir: path.join(root, "app"),
        setId: "kmt-paired-mw",
        captureMode: "maintenance-window",
        pauseRecord: "test-procedure: writers paused per runbook"
      },
      { exec, pgModule: makeFakePg() }
    );
    expect(result.verifiedConsistent).toBe(true);
    const manifest = JSON.parse(await fs.readFile(path.join(result.directory, "manifest.json"), "utf8"));
    expect(manifest.consistency.mode).toBe("maintenance-window");
    expect(manifest.consistency.verifiedConsistent).toBe(true);
    expect(manifest.consistency.writerPauseEvidence.writerChecks).toHaveLength(2);
    expect(manifest.consistency.writerPauseEvidence.pauseRecord).toContain("writers paused");
  });

  it("maintenance-window without a pause record refuses verified-consistent completion", async () => {
    const uploads = await makeUploads(root);
    const backupRoot = path.join(root, "backups");
    const { exec } = makeFakeExec(path.join(root, "s-mw"), {});
    await expect(
      createPairedBackupSet(
        { env: baseEnv, databaseUrl: SECRET_URL, backupRoot, uploadsRoot: uploads, appDir: path.join(root, "app"), setId: "kmt-paired-mw-norecord", captureMode: "maintenance-window" },
        { exec, pgModule: makeFakePg() }
      )
    ).rejects.toMatchObject({ stage: "consistency" });
  });

  it("active writers fail the quiet capture instead of claiming consistency", async () => {
    const uploads = await makeUploads(root);
    const backupRoot = path.join(root, "backups");
    const { exec } = makeFakeExec(path.join(root, "s-busy"), {});
    await expect(
      createPairedBackupSet(
        { env: baseEnv, databaseUrl: SECRET_URL, backupRoot, uploadsRoot: uploads, appDir: path.join(root, "app"), setId: "kmt-paired-busy", requireQuiet: true },
        { exec, pgModule: makeFakePg({ writers: 2 }) }
      )
    ).rejects.toMatchObject({ stage: "quiesce" });
  });

  it("require-consistent fails a live capture instead of labeling it verified", async () => {
    const uploads = await makeUploads(root);
    const backupRoot = path.join(root, "backups");
    const { exec } = makeFakeExec(path.join(root, "s-rc"), {});
    await expect(
      createPairedBackupSet(
        { env: baseEnv, databaseUrl: SECRET_URL, backupRoot, uploadsRoot: uploads, appDir: path.join(root, "app"), setId: "kmt-paired-rc", requireConsistent: true },
        { exec, pgModule: makeFakePg() }
      )
    ).rejects.toMatchObject({ stage: "consistency" });
  });

  it("restore document check fails on a required missing file and passes extras separately", async () => {
    const { backupRoot, uploads } = await successfulBackup(root);
    const staging = path.join(root, "staging-doccheck");
    await fs.mkdir(staging, { recursive: true });
    await fs.cp(uploads, staging, { recursive: true });
    const { exec } = makeFakeExec(staging, {});
    const targetUploads = path.join(root, "restored-docs");
    const targetUrl = "postgresql://restore-role:other-secret@localhost:5432/kmt_launch_restore_docs";
    const documents = [{ fileKey: "documents/2026/a.pdf" }, { fileKey: "documents/2026/gone.pdf" }];

    await expect(
      restorePairedBackupSet(
        { backupRoot, setId: "kmt-paired-testset", targetDatabaseUrl: targetUrl, targetUploads, confirm: "kmt-paired-testset", verifyDocuments: true },
        { exec, pgModule: makeFakePg({ documents }) }
      )
    ).rejects.toMatchObject({ stage: "verify" });

    const ok = await restorePairedBackupSet(
      { backupRoot, setId: "kmt-paired-testset", targetDatabaseUrl: targetUrl, targetUploads: path.join(root, "restored-docs-ok"), confirm: "kmt-paired-testset", verifyDocuments: true },
      {
        exec: makeFakeExec(staging, {}).exec,
        pgModule: makeFakePg({ documents: [{ fileKey: "documents/2026/a.pdf" }] })
      }
    );
    expect(ok.documentCheck).toMatchObject({ checked: true, required: 1 });
    expect((ok.documentCheck as { extra: string[] }).extra).toContain("hello.txt");

    const skipped = await restorePairedBackupSet(
      { backupRoot, setId: "kmt-paired-testset", targetDatabaseUrl: targetUrl, targetUploads: path.join(root, "restored-docs-skip"), confirm: "kmt-paired-testset", verifyDocuments: true },
      { exec, pgModule: makeFakePg({ documents: null }) }
    );
    expect(skipped.documentCheck).toMatchObject({ checked: false });
  });
});
