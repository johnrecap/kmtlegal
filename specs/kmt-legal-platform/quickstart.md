# quickstart.md

## Status
The MVP implementation and handoff artifacts now exist through partial PLAN-27 live-site QA remediation. Local static/unit/build gates can run without PostgreSQL. Production readiness still requires a running PostgreSQL `DATABASE_URL`, migrations, seed data, DB-backed E2E, dependency audit remediation, installer lock, hosting smoke for the chosen setup mode, and PLAN-27 deployed-site smoke covering public links, static chunks, CSP, favicon, auth/admin copy, booking/contact UX, authenticated admin routes, mobile overflow, and approved production content.

## Prerequisites
- Node.js version compatible with the chosen Next.js version.
- npm, pnpm, or yarn; final package manager to be selected during foundation.
- PostgreSQL.
- Docker optional for local database and production-style runs.
- Private uploads directory outside `public/`; production VPS path should be `/var/lib/kmt-legal/uploads` or configured `UPLOADS_DIR`.
- SMTP env placeholders exist, but email sending is disabled in this release.

## Install Dependencies
After the Next.js project exists:

```bash
npm ci
```

If no lockfile exists yet during foundation:

```bash
npm install
```

Then commit the generated lockfile and use reproducible installs in CI.

## Set Environment Variables
Create `.env.local` from `.env.example` after foundation is implemented. Do not commit real `.env*` values.

Required names are planned in `devops-plan.md`:
- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_ORIGIN`
- `APP_ENV`
- `APP_RELEASE`
- `DB_SETUP_MODE`
- `SESSION_COOKIE_SECURE`
- `CSRF_STRICT_ORIGIN`
- `KMT_DEMO_PASSWORD`
- `KMT_DEMO_TOTP_SECRET`
- `STAFF_2FA_MODE`
- `INSTALLER_ENABLED`
- `INSTALLER_SETUP_TOKEN`
- `INSTALLER_LOCK_PATH`
- `HOSTING_MODE`
- `APP_PORT`
- `PANEL_REVERSE_PROXY_READY`
- `CPANEL_NODE_APP_READY`
- `CPANEL_COMMAND_RUNNER_READY`
- `STORAGE_DRIVER`
- `UPLOADS_DIR`
- `MAX_UPLOAD_MB`
- `ALLOWED_UPLOAD_TYPES`
- `SMTP_ENABLED`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_SECURE`
- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`
- `AI_TIMEOUT_MS`
- `AI_MAX_TOKENS`
- `AI_TEMPERATURE`
- `ANALYTICS_ENABLED`
- `ENABLE_STITCH_CLONE`

Required MVP defaults:
- `STORAGE_DRIVER=vps-filesystem`
- `MAX_UPLOAD_MB=5`
- `ALLOWED_UPLOAD_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png`
- Production must not set `KMT_DEMO_PASSWORD` or `KMT_DEMO_TOTP_SECRET`.
- Production must set `STAFF_2FA_MODE=disabled`; TOTP is deferred in this release.
- Production must keep `INSTALLER_ENABLED=false` after `/install` is completed and locked.
- Production must keep `SMTP_ENABLED=false` until the future SMTP activation plan.
- Production keeps `/stitch-clone/*` disabled unless `ENABLE_STITCH_CLONE=true` is deliberately set for controlled visual QA.

## Start Database
Option A: local PostgreSQL service.

Option B: Docker Compose after foundation adds `docker-compose.yml`:

```bash
docker compose up -d db
```

## Run Migrations
After Prisma is added:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:dev
```

## Seed Data
After `prisma/seed.mjs` exists:

```bash
npm run db:seed
```

Local seed data uses fake legal-office demo records only and writes demo document backing files under private uploads storage. Production seed bootstraps roles/permissions/settings only and must not create demo users.

## Start Dev Server
After app foundation exists:

```bash
npm run dev
```

Open:
- Public site: `http://localhost:3000/`
- Services: `http://localhost:3000/services`
- Booking: `http://localhost:3000/book-consultation`
- Contact: `http://localhost:3000/contact`
- Client portal: `http://localhost:3000/client` (`/portal` remains a compatibility alias)
- Admin: `http://localhost:3000/admin`
- Stitch clone routes: `http://localhost:3000/stitch-clone/...`

## Run Tests
After test scripts exist:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run qa:local
npm run qa:db
npm run qa:release
npm run security:secrets
npm run test:e2e
```

`npm run build` automatically runs `prisma generate` first through `prebuild`. Production builds therefore require `DATABASE_URL` to be present before running the build command.

`qa:db` requires `DATABASE_URL` and runs migrate + seed + seed + DB-backed E2E. `qa:release` adds DB gate, smoke E2E, dependency audit, and secret scan. `qa:local:release` is only a local release-candidate check and does not close production readiness.

## Demo Accounts
Planned seed accounts:
- `client@kmt.local`
- `lawyer@kmt.local`
- `office.admin@kmt.local`
- `marketing@kmt.local`
- `superadmin@kmt.local`

Use `KMT_DEMO_PASSWORD` for local seed credentials. Use `KMT_DEMO_TOTP_SECRET` for local staff TOTP setup. Do not use demo values in production.
Staff demo accounts may include legacy local/dev TOTP seed data, but PLAN-25 login does not require TOTP. Production staff sign in with email and password only until the future Staff 2FA Rework plan.

## Choose Hosting Mode

Before production setup, choose exactly one mode:

- `terminal-vps`: fresh Ubuntu/Debian VPS with sudo/root. This is the safest default and uses the existing one-command installer.
- `aapanel`: aaPanel on a VPS. Create domain/SSL/database/reverse proxy in aaPanel first, then run the panel-assisted install flow.
- `cpanel`: only if the hosting account has Node.js App, PostgreSQL, SSH/Terminal or equivalent command runner, env vars, persistent process, and a private writable folder outside `public_html`.

Unsupported cPanel/shared hosting must stop before build, migration, or `/install` bootstrap. Do not use MySQL, public uploads inside `public_html`, or a static-only hosting mode for this app.

## One-Command Terminal VPS Install

On a fresh Ubuntu VPS, upload or clone the project, then run:

```bash
sudo bash deploy/install/install.sh
```

The script asks for the domain and TLS email, installs the Node/PostgreSQL/Nginx/systemd stack, writes `/etc/kmt-legal/kmt-legal.env`, runs migrations and production seed, starts the app, and prints a one-time URL:

```text
https://your-domain.example/install?token=...
```

Open that URL, run preflight, create the first Super Admin, then lock the installer. After the wizard says it is locked, run:

```bash
sudo kmt-legal-disable-installer
```

Do not expose `/install` after setup. Production readiness fails while `INSTALLER_ENABLED=true`.

## aaPanel Assisted Install

PLAN-26 flow:

1. Choose database mode:
   - `existing` recommended: create PostgreSQL database/user in aaPanel first.
   - `auto`: let the script create it through `psql`; it may not appear in aaPanel UI.
2. In aaPanel, configure the domain, SSL, and reverse proxy to the Node app port.
3. Create a private uploads directory outside the served website root.
4. Run the panel-assisted installer with `--panel=aapanel`.
5. Open `/install?token=...`, create the first Super Admin, lock the installer, then disable installer mode.

aaPanel mode must not run `apt-get`, `systemctl`, or edit `/etc/nginx` directly because the panel owns those services.

## cPanel Conditional Install

PLAN-26 flow:

1. Confirm cPanel provides Node.js App, PostgreSQL, SSH/Terminal or equivalent command runner, env vars, and private storage outside `public_html`.
2. Choose database mode:
   - `existing` recommended: create PostgreSQL database/user in cPanel/host panel first.
   - `auto`: requires `psql` and PostgreSQL admin URL; it may fail or not appear in cPanel UI.
3. If any requirement is missing, this hosting is unsupported for KMT Legal.
4. If all requirements exist, run the cPanel-assisted installer with `--panel=cpanel`.
5. Configure cPanel Node.js startup/env values from the generated instructions.
6. Open `/install?token=...`, create the first Super Admin, lock the installer, then disable installer mode.

## Critical Validation Scenarios
1. Guest submits consultation request.
2. Admin reviews and converts consultation to case.
3. Client logs in and sees only own case.
4. Client uploads valid document.
5. Invalid upload fails by type/size; files over 5MB fail.
6. Lawyer sees assigned cases only.
7. Marketing cannot publish case study without approval.
8. Super Admin changes role and audit log records it.
9. Unauthorized user receives 401/403.
10. Public case study includes anonymization and disclaimer.
11. Staff login reaches admin without 2FA while `STAFF_2FA_MODE=disabled`; `/login/2fa` and 2FA APIs stay disabled.
12. SMTP remains disabled; email helper returns safe disabled metadata without sending.
13. AI Gateway mock/provider output validates schema and is marked review-required.
14. Installer preflight/bootstrap/finish require setup token and lock after first Super Admin.

## Where To Start
1. Read `PROJECT_GUIDE.md`.
2. Configure a real PostgreSQL `DATABASE_URL`.
3. Run `npm run qa:db`.
4. Run `npm run qa:local:e2e`.
5. Run `npm run qa:release` before release handoff.
6. Use `docs/RELEASE_QA_CHECKLIST.md` and `docs/VPS_DEPLOYMENT_RUNBOOK.md` for release handoff.

## Known Setup Gaps
- A real local/staging PostgreSQL URL is still required before running migrations and seeds in this workspace.
- Production SMTP provider details are not selected; SMTP env placeholders exist but UI/backend sending is disabled.
- Staff TOTP is intentionally deferred; do not enable `STAFF_2FA_MODE=totp` in this release.
- Production AI provider/model can remain `mock` or be configured through the AI Gateway using provider-agnostic env vars.
- VPS systemd and Nginx examples exist under `deploy/`; Docker packaging remains optional.
- Upload route runtime smoke still needs a writable private `UPLOADS_DIR` and migrated PostgreSQL database.
- Consultation booking submit also needs a migrated PostgreSQL database for runtime persistence.
- Dependency audit remediation is still a production blocker until `docs/SECURITY_AUDIT_FINDINGS.md` is updated with a passing or explicitly accepted result.
