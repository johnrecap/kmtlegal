// Read-only guard for a new, client-facing database. It never falls back to DATABASE_URL.
import { readdir, lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modelTables = new Set(Prisma.dmmf.datamodel.models.map((model) => model.dbName ?? model.name));
const bootstrapTables = new Set(["roles", "permissions", "role_permissions", "system_settings"]);
const bootstrapSettings = new Set(["auth.rbac_assignments_bootstrap", "storage.driver", "ai.provider", "payment.gateway"]);

export class HandoffVerificationError extends Error {}

function assert(condition, message) {
  if (!condition) throw new HandoffVerificationError(message);
}

function quoted(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export async function verifyUploadsDirectory(directory, phase) {
  assert(path.isAbsolute(directory), "HANDOFF_UPLOADS_DIR must be an absolute path.");
  const relativeToCheckout = path.relative(root, directory);
  assert(relativeToCheckout === ".." || relativeToCheckout.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToCheckout),
    "HANDOFF_UPLOADS_DIR must be outside the application checkout.");
  const status = await lstat(directory).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!status) {
    assert(phase === "empty", "The new private uploads directory must exist after installation.");
    return;
  }
  assert(status.isDirectory() && !status.isSymbolicLink(), "The new private uploads path must be a regular directory.");
  const resolved = await realpath(directory);
  const normalizeCase = (value) => process.platform === "win32" ? path.normalize(value).toLowerCase() : path.normalize(value);
  assert(normalizeCase(resolved) === normalizeCase(directory),
    "The new private uploads path must not contain symlinks.");
  assert((await readdir(directory)).length === 0, "The new private uploads directory is not empty.");
}

export async function verifyHandoffDatabase(client, { phase, expectedName, uploadsDir }) {
  assert(phase === "empty" || phase === "seeded", "Use --phase=empty or --phase=seeded.");
  assert(typeof expectedName === "string" && expectedName.length > 0, "HANDOFF_DATABASE_NAME is required.");
  assert(typeof uploadsDir === "string" && uploadsDir.length > 0, "HANDOFF_UPLOADS_DIR is required.");

  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try {
    const identity = await client.query("SELECT current_database() AS name");
    assert(identity.rows[0]?.name === expectedName, "The connected database name does not match HANDOFF_DATABASE_NAME.");
    const catalog = await client.query(`
      SELECT n.nspname AS schema, c.relname AS name FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_toast%'
        AND n.nspname NOT LIKE 'pg_temp_%'
        AND c.relkind IN ('r', 'p')
      ORDER BY n.nspname, c.relname
    `);
    const tables = catalog.rows.map((row) => `${row.schema}.${row.name}`);

    if (phase === "empty") {
      assert(tables.length === 0, "The target database already contains user tables; use a newly created database.");
      await verifyUploadsDirectory(uploadsDir, phase);
      return { phase, database: expectedName, userTables: 0, privateUploads: 0 };
    }

    const expectedTables = new Set([...modelTables, "_prisma_migrations"].map((name) => `public.${name}`));
    const missing = [...expectedTables].filter((name) => !tables.includes(name));
    const unexpected = tables.filter((name) => !expectedTables.has(name));
    assert(missing.length === 0, `Required schema tables are missing: ${missing.join(", ")}.`);
    assert(unexpected.length === 0, `Unexpected public tables exist: ${unexpected.join(", ")}.`);

    const migrationDirectories = (await readdir(path.join(root, "prisma", "migrations"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const migrations = await client.query('SELECT migration_name AS name, finished_at AS finished, rolled_back_at AS rolled_back FROM "_prisma_migrations"');
    const applied = migrations.rows.map((row) => row.name).sort();
    assert(migrations.rows.every((row) => row.finished && !row.rolled_back), "A migration is unfinished or rolled back.");
    assert(JSON.stringify(applied) === JSON.stringify(migrationDirectories), "Applied migrations do not exactly match this release.");

    const counts = {};
    for (const table of modelTables) {
      const result = await client.query(`SELECT count(*)::int AS count FROM "public".${quoted(table)}`);
      counts[table] = result.rows[0].count;
      if (!bootstrapTables.has(table)) assert(counts[table] === 0, `Handoff database contains rows in ${table}.`);
    }
    for (const table of ["roles", "permissions", "role_permissions", "system_settings"]) {
      assert(counts[table] > 0, `Production bootstrap is missing ${table}.`);
    }
    const settings = await client.query('SELECT key, value FROM "system_settings"');
    assert(settings.rows.length === bootstrapSettings.size && settings.rows.every((row) => bootstrapSettings.has(row.key)),
      "System settings contain entries beyond the production bootstrap.");
    const storage = settings.rows.find((row) => row.key === "storage.driver")?.value;
    assert(storage?.uploadsDir === uploadsDir, "The seeded storage path does not match HANDOFF_UPLOADS_DIR.");
    const ai = settings.rows.find((row) => row.key === "ai.provider")?.value;
    assert(ai?.productionEnabled === false, "The fresh AI provider must remain disabled until separately configured.");
    await verifyUploadsDirectory(uploadsDir, phase);
    return { phase, database: expectedName, userTables: tables.length, migrations: applied.length,
      roles: counts.roles, permissions: counts.permissions, privateUploads: 0, customerAndOperationalRows: 0 };
  } finally {
    await client.query("ROLLBACK");
  }
}

async function main() {
  const phase = process.argv[2]?.replace(/^--phase=/, "");
  const url = process.env.HANDOFF_DATABASE_URL;
  const expectedName = process.env.HANDOFF_DATABASE_NAME;
  const uploadsDir = process.env.HANDOFF_UPLOADS_DIR;
  assert(url, "HANDOFF_DATABASE_URL is required; DATABASE_URL is never used by this check.");
  let parsed;
  try { parsed = new URL(url); } catch { throw new HandoffVerificationError("HANDOFF_DATABASE_URL must be a PostgreSQL URL."); }
  assert(["postgresql:", "postgres:"].includes(parsed.protocol), "HANDOFF_DATABASE_URL must be a PostgreSQL URL.");
  assert(decodeURIComponent(parsed.pathname.slice(1)) === expectedName, "URL database name does not match HANDOFF_DATABASE_NAME.");
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000, statement_timeout: 15000,
    application_name: "kmt-client-handoff-verify" });
  try {
    await client.connect();
    const result = await verifyHandoffDatabase(client, { phase, expectedName, uploadsDir });
    console.log(JSON.stringify({ status: "VERIFIED", ...result }));
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof HandoffVerificationError ? error.message : `Database verification failed (${error?.code ?? "unknown"}).`;
    console.error(message);
    process.exitCode = 1;
  });
}
