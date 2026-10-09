// Disposable, memory-only PostgreSQL protocol fixture. Never reads .env or an existing DB.
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash, randomBytes } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';

const db = await PGlite.create();
const migrations = (await readdir('prisma/migrations', { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
for (const name of migrations) await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`, 'utf8'));
await db.exec("CREATE TABLE phase_two_fixture_marker (marker text NOT NULL); INSERT INTO phase_two_fixture_marker VALUES ('memory-only-synthetic-phase-two');");
const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 55449, maxConnections: 10 });
await server.start();
const databaseUrl = 'postgresql://postgres:phase_two_synthetic@127.0.0.1:55449/template1';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, max: 1 }) });
const users = {};
const policy = JSON.parse(await readFile('src/server/auth/policy-data.json', 'utf8'));
for (const [name, keys] of Object.entries({ reviewer: ['report.read.any', 'content.create.any', 'content.approve.any'], denied: [] })) {
  const role = await prisma.role.create({ data: { name: name === 'reviewer' ? policy.roles.officeAdmin : policy.roles.lawyer, status: 'ACTIVE' } });
  for (const key of keys) {
    const permission = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
  }
  const user = await prisma.user.create({ data: { name: `Synthetic ${name}`, email: `${name}@phase-two.invalid`, roleId: role.id, status: 'ACTIVE', locale: 'ar' } });
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(token).digest('base64url'), status: 'ACTIVE', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  users[name] = { id: user.id, roleId: role.id, token };
}
const articles = {};
for (const locale of ['ar', 'en']) for (const kind of ['published', 'draft', 'future', 'archived']) {
  const slug = `phase-two-${kind}`;
  const title = locale === 'ar' ? `مقال تجريبي ${kind}` : `Synthetic article ${kind}`;
  const article = await prisma.article.create({ data: { slug, locale, title, excerpt: locale === 'ar' ? 'محتوى اصطناعي لاختبار العرض والترجمة، وليس للنشر على الموقع الحقيقي.' : 'Synthetic content used only to test rendering and translations, never for production.', content: 'Synthetic fixture content.\n\n## Review\n\n- First point\n- Second point', authorId: users.reviewer.id, category: 'contracts', status: kind === 'draft' ? 'DRAFT' : kind === 'archived' ? 'ARCHIVED' : 'PUBLISHED', publishedAt: kind === 'future' ? new Date(Date.now() + 86400000) : new Date('2026-01-01T00:00:00Z') } });
  articles[`${locale}-${kind}`] = article.id;
}
await prisma.article.create({ data: { slug: 'phase-two-english-only', locale: 'en', title: 'English only synthetic article', excerpt: 'A synthetic untranslated article for language-switch verification.', content: 'Synthetic untranslated content for testing only.', authorId: users.reviewer.id, category: 'intake', status: 'PUBLISHED', publishedAt: new Date('2026-01-01T00:00:00Z') } });
await prisma.contactMessage.create({ data: { fullName: 'Synthetic contact', email: 'contact@phase-two.invalid', topic: 'Synthetic', message: 'Synthetic pre-existing message for aggregate reporting.' } });
await prisma.consultationRequest.create({ data: { fullName: 'Synthetic request', phone: '01000000000', serviceCategory: 'legal-consultation', summary: 'Synthetic pre-existing consultation for aggregate reporting.', preferredMode: 'OFFICE' } });
await mkdir('.playwright', { recursive: true });
await writeFile('.playwright/phase-two-fixtures.json', JSON.stringify({ databaseUrl, users, articles }, null, 2));
await prisma.$disconnect();
console.log(`Memory-only fixture ready on 127.0.0.1:55449; ${migrations.length} existing migrations applied. No production or prior local database touched.`);
async function close() { await prisma.$disconnect(); await server.stop(); await db.close(); process.exit(0); }
process.on('SIGINT', close);
process.on('SIGTERM', close);
