// Disposable synthetic PostgreSQL-protocol test server; never reads .env or existing DBs.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
const db = await PGlite.create();
for (const name of (await readdir("prisma/migrations", { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort()) await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
await db.exec("CREATE TABLE phase_five_fixture_marker(marker text); INSERT INTO phase_five_fixture_marker VALUES ('synthetic-memory-only');");
const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55469, maxConnections: 10 }); await server.start();
const databaseUrl = "postgresql://postgres:synthetic@127.0.0.1:55469/template1";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, max: 1 }) });
const policy = JSON.parse(await readFile("src/server/auth/policy-data.json", "utf8"));
const roles = {};
for (const name of ["Client", "Office Admin", "Lawyer", "Super Admin"]) {
  const role = await prisma.role.create({ data: { name, status: "ACTIVE" } }); roles[name] = role.id;
  for (const key of (name === "Super Admin" ? policy.permissions : policy.rolePermissions[name])) { const permission = await prisma.permission.upsert({ where: { key }, create: { key }, update: {} }); await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } }); }
}
const users = {};
for (const [key, roleName, locale] of [["ar", "Client", "ar"], ["en", "Client", "en"], ["other", "Client", "en"], ["admin", "Super Admin", "ar"], ["lawyer", "Lawyer", "ar"]]) {
  const user = await prisma.user.create({ data: { name: locale === "ar" ? `حساب تجريبي ${key}` : `Synthetic ${key}`, email: `${key}@phase-five.invalid`, roleId: roles[roleName], status: "ACTIVE", locale, emailVerifiedAt: new Date() } });
  const client = roleName === "Client" ? await prisma.client.create({ data: { userId: user.id, fullName: user.name, phone: "01000000000", email: user.email, status: "ACTIVE" } }) : null;
  const token = randomBytes(32).toString("hex"); await prisma.session.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("base64url"), status: "ACTIVE", twoFactorVerifiedAt: roleName !== "Client" ? new Date() : null, expiresAt: new Date(Date.now() + 86400000) } });
  users[key] = { id: user.id, clientId: client?.id, token };
}
await mkdir(".playwright/phase-five", { recursive: true });
await writeFile(".playwright/phase-five/fixtures.json", JSON.stringify({ databaseUrl, users }, null, 2));
await prisma.$disconnect();
console.log("Synthetic phase-five fixture ready on 127.0.0.1:55469. No existing database read or modified.");
async function close() { await prisma.$disconnect(); await server.stop(); await db.close(); process.exit(0); }
process.on("SIGINT", close); process.on("SIGTERM", close);
