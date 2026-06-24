# PLAN-04 Database Schema, Prisma & Seeds

Status: implemented as schema, seed foundation, and local PostgreSQL handoff; database runtime smoke is pending a running PostgreSQL `DATABASE_URL`.

## Scope Completed

- Prisma 7 configured for PostgreSQL through `prisma.config.ts`.
- Prisma Client generation configured with PostgreSQL driver adapter dependencies:
  - `@prisma/client`
  - `prisma`
  - `@prisma/adapter-pg`
  - `pg`
- Core schema added in `prisma/schema.prisma`.
- Initial migration SQL generated under `prisma/migrations/20260623191000_plan_04_05_init/migration.sql`.
- Migration provider lock added in `prisma/migrations/migration_lock.toml`.
- Deterministic seed script added in `prisma/seed.mjs`, with readable Arabic fake demo data.
- Seed policy data shared with auth helpers in `src/server/auth/policy-data.json`.
- Local development PostgreSQL service added in `docker-compose.yml`.
- Default local `DATABASE_URL` now matches the compose database user/database in `.env.example`, `prisma.config.ts`, and `src/server/db/prisma.ts`.

## Models Covered

- Auth/governance: `User`, `Role`, `Permission`, `RolePermission`, `Session`, `SystemSetting`, `AuditLog`.
- Legal operations: `Client`, `LawyerProfile`, `LegalService`, `ConsultationRequest`, `Appointment`.
- Case operations: `LegalCase`, `CaseParty`, `CaseSession`, `InternalNote`.
- Document/task/finance basics: `Document`, `Task`, `Payment`.
- Staff 2FA/email/AI metadata: `StaffTwoFactorCredential`, `EmailOtpChallenge`, `EmailMessage`, `AiProviderRun`.
- Content/notifications: `Article`, `CaseStudy`, `SocialPostDraft`, `Notification`.

## Seed Data

- Roles: Guest, Client, Lawyer, Office Admin, Marketing Staff, Super Admin.
- Permissions use the `resource.action.scope` convention.
- Demo users are fake `@kmt.local` accounts only.
- Staff demo accounts receive local/dev TOTP credentials using `KMT_DEMO_TOTP_SECRET`; production seed requires explicit env values.
- Public demo services, lawyer profile, article, anonymous case study.
- Operational demo client, consultation, case, session, document metadata, task, and invoice basics.

## Verification

- `npm run db:validate`
- `npm run db:generate`
- `npm run test` includes seed contract checks for rerunnable `upsert`/`findOrCreate` patterns and fake readable Arabic seed data.

## Local Runtime Smoke Path

1. Copy `.env.example` to `.env.local` and keep the local `DATABASE_URL` unless using another PostgreSQL instance.
2. Start local PostgreSQL:
   - `docker compose up -d db`
3. Apply schema and run the seed:
   - `npm run db:migrate:dev`
   - `npm run db:seed`
4. Re-run seed once to verify idempotency:
   - `npm run db:seed`
5. Continue with auth runtime smoke:
   - Login as `client@kmt.local` with `KMT_DEMO_PASSWORD` or the default local seed password.
   - Login as `lawyer@kmt.local`, then complete 2FA using the local demo TOTP secret.

Not run yet:

- `npm run db:migrate:dev`
- `npm run db:seed`

Reason: no running PostgreSQL instance was verified in this workspace during this pass, and the Docker CLI is not currently available on this machine.
