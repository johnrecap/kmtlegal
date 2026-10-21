import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { verifyHandoffDatabase, verifyUploadsDirectory } from "../../scripts/verify-client-handoff-db.mjs";

const run = promisify(execFile);
const port = 55619;
const url = `postgresql://postgres:synthetic@127.0.0.1:${port}/postgres`;
const uploadsParent = process.env.HANDOFF_TEST_UPLOADS_PARENT || tmpdir();
let db: PGlite;
let socket: PGLiteSocketServer;
let uploads: string;

beforeAll(async () => {
  db = await PGlite.create();
  socket = new PGLiteSocketServer({ db, host: "127.0.0.1", port, maxConnections: 3 });
  await socket.start();
  uploads = await mkdtemp(path.join(uploadsParent, "kmt-client-handoff-test-"));
}, 60000);

afterAll(async () => {
  await socket?.stop();
  await db?.close();
  if (uploads) {
    const parent = await realpath(uploadsParent);
    const target = await realpath(uploads);
    if (path.dirname(target) !== parent || !path.basename(target).startsWith("kmt-client-handoff-test-")) {
      throw new Error("Unsafe isolated-test cleanup path");
    }
    await rm(target, { recursive: true, force: true });
  }
});

describe.sequential("new client database handoff verification (isolated SQL)", () => {
  it("accepts a genuinely empty database and rejects a mismatched target", async () => {
    const result = await verifyHandoffDatabase(db, { phase: "empty", expectedName: "postgres", uploadsDir: uploads });
    expect(result).toMatchObject({ phase: "empty", userTables: 0, privateUploads: 0 });
    const cli = await run(process.execPath, ["scripts/verify-client-handoff-db.mjs", "--phase=empty"], {
      env: { ...process.env, HANDOFF_DATABASE_URL: url, HANDOFF_DATABASE_NAME: "postgres", HANDOFF_UPLOADS_DIR: uploads },
      timeout: 30000, windowsHide: true
    });
    expect(JSON.parse(cli.stdout)).toMatchObject({ status: "VERIFIED", phase: "empty", userTables: 0 });
    expect(cli.stdout).not.toContain("synthetic@");
    const fallbackEnv: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: url,
      HANDOFF_DATABASE_NAME: "postgres", HANDOFF_UPLOADS_DIR: uploads };
    delete fallbackEnv.HANDOFF_DATABASE_URL;
    await expect(run(process.execPath, ["scripts/verify-client-handoff-db.mjs", "--phase=empty"], {
      env: fallbackEnv, timeout: 30000, windowsHide: true
    })).rejects.toMatchObject({ stderr: expect.stringContaining("HANDOFF_DATABASE_URL is required") });
    await expect(verifyUploadsDirectory(process.cwd(), "empty"))
      .rejects.toThrow("outside the application checkout");
    await expect(verifyHandoffDatabase(db, { phase: "empty", expectedName: "kmt_legal", uploadsDir: uploads }))
      .rejects.toThrow("does not match HANDOFF_DATABASE_NAME");
    await db.exec('CREATE SCHEMA handoff_probe; CREATE TABLE handoff_probe.synthetic (id int)');
    await expect(verifyHandoffDatabase(db, { phase: "empty", expectedName: "postgres", uploadsDir: uploads }))
      .rejects.toThrow("already contains user tables");
    await db.exec('DROP SCHEMA handoff_probe CASCADE');
  });

  it("accepts production seed only when every migration and data table is clean", async () => {
    const names = (await readdir("prisma/migrations", { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const name of names) await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
    await db.exec(`CREATE TABLE "_prisma_migrations" (
      migration_name text NOT NULL, finished_at timestamptz, rolled_back_at timestamptz
    )`);
    for (const name of names) await db.query(
      'INSERT INTO "_prisma_migrations" (migration_name, finished_at) VALUES ($1, now())', [name]
    );
    const env: NodeJS.ProcessEnv = { ...process.env, APP_ENV: "production", NODE_ENV: "production", DATABASE_URL: url,
      UPLOADS_DIR: uploads, AUTH_SECRET: randomUUID() };
    delete env.KMT_DEMO_PASSWORD;
    delete env.KMT_DEMO_TOTP_SECRET;
    await run(process.execPath, ["prisma/seed.mjs"], { env, timeout: 60000, windowsHide: true });
    const result = await verifyHandoffDatabase(db, { phase: "seeded", expectedName: "postgres", uploadsDir: uploads });
    expect(result).toMatchObject({ phase: "seeded", migrations: names.length, customerAndOperationalRows: 0 });
    expect(result.roles ?? 0).toBeGreaterThan(0);
    expect(result.permissions ?? 0).toBeGreaterThan(0);
    const cli = await run(process.execPath, ["scripts/verify-client-handoff-db.mjs", "--phase=seeded"], {
      env: { ...process.env, HANDOFF_DATABASE_URL: url, HANDOFF_DATABASE_NAME: "postgres", HANDOFF_UPLOADS_DIR: uploads },
      timeout: 30000, windowsHide: true
    });
    expect(JSON.parse(cli.stdout)).toMatchObject({ status: "VERIFIED", phase: "seeded", customerAndOperationalRows: 0 });
    expect(cli.stdout).not.toContain("synthetic@");
    await expect(verifyHandoffDatabase(db, { phase: "empty", expectedName: "postgres", uploadsDir: uploads }))
      .rejects.toThrow("already contains user tables");
  }, 120000);

  it("rejects a customer row and a private upload, without deleting either", async () => {
    await db.query('INSERT INTO "clients" (id, "fullName", phone, "createdAt", "updatedAt") VALUES ($1, $2, $3, now(), now())',
      [randomUUID(), "Synthetic Client", "+201000000000"]);
    await expect(verifyHandoffDatabase(db, { phase: "seeded", expectedName: "postgres", uploadsDir: uploads }))
      .rejects.toThrow("contains rows in clients");
    await db.exec('DELETE FROM "clients"');
    await mkdir(path.join(uploads, "private"));
    await writeFile(path.join(uploads, "private", "synthetic.txt"), "synthetic only");
    await expect(verifyHandoffDatabase(db, { phase: "seeded", expectedName: "postgres", uploadsDir: uploads }))
      .rejects.toThrow("private uploads directory is not empty");
  });
});
