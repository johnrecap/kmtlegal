# KMT Legal Platform Project Guide

## Start Here

This repo contains the KMT Legal MVP implementation: a Next.js App Router app, Prisma/PostgreSQL data model, private VPS filesystem upload contract, SMTP email abstraction, AI Provider Gateway, public website, client portal, admin office tools, analytics, and release hardening.

Use this file as the first handoff map. The detailed plan tracker is `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`.
For a current-state PRD and external model review brief, use `docs/KMT_LEGAL_CURRENT_PROJECT_PRD_FOR_REVIEW.md`.

## Current Status

- `PLAN-00` through `PLAN-34` are implemented as code, tests, plans, or handoff artifacts where local infrastructure allows.
- `PLAN-04` still needs a real PostgreSQL runtime check: run migrations and seed against a running `DATABASE_URL`, then rerun seed to verify idempotency.
- DB-backed E2E flows need PostgreSQL plus seed data before they can run end to end.
- PLAN-34 makes Paymob the prepared primary provider, keeps PayTabs disabled standby, leaves paid booking disabled, adds expiring minimized receipts, PostgreSQL rate limiting, async scrypt, required production ClamAV scanning, optional privacy-safe Sentry, locale/error/accessibility/image hardening, and behavior-preserving module decomposition. DB-backed/provider/live deployment evidence remains a release gate.

## Install

```bash
npm ci
```

Required Node.js versions follow the Prisma runtime constraint: `20.19+`, `22.12+`, or `24+`. The repo records this in `package.json` and `.node-version`.

## Local Environment

Create a local env file from `.env.example`. Keep real `.env*` values out of version control.

Important local defaults:

- `APP_ENV=local`
- `APP_ORIGIN=http://localhost:3000`
- `DATABASE_URL=postgresql://kmt_legal:kmt_legal_dev_password@localhost:5432/kmt_legal`
- `PRISMA_POOL_MAX=1` for the local/WASM PostgreSQL handoff; raise this on VPS only after testing with real PostgreSQL.
- `STORAGE_DRIVER=vps-filesystem`
- `MAX_UPLOAD_MB=5`
- `AI_PROVIDER=mock`
- `ANALYTICS_ENABLED=true`
- `STAFF_2FA_MODE=disabled`
- `PAYMENT_PROVIDER=paymob` and `PAYTABS_ENABLED=false`
- `MALWARE_SCAN_MODE=disabled` locally; production must use `required` with a reachable ClamAV daemon.
- `SENTRY_ENABLED=false` until DSN, auth token, org, and project values are supplied.

## Local Database

If Docker is available:

```bash
docker compose up -d db
npm run db:migrate:dev
npm run db:seed
```

If Docker is not available, start PostgreSQL manually and set `DATABASE_URL` before running the same migration and seed commands.

## Run

```bash
npm run dev
```

Open:

- Public site: `http://localhost:3000/`
- Booking: `http://localhost:3000/book-consultation`
- Login: `http://localhost:3000/login`
- Client portal: `http://localhost:3000/portal`
- Admin: `http://localhost:3000/admin`
- Product system: `http://localhost:3000/product-system`
- Stitch clone: `http://localhost:3000/stitch-clone/home`

## Quality Gates

Local non-DB release gates:

```bash
npm run qa:local
```

This runs:

- `npm run db:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Optional browser smoke:

```bash
npm run qa:local:e2e
```

Direct smoke command:

```bash
npm run test:e2e:smoke
```

Optional network-dependent dependency audit:

```bash
npm run security:audit
```

Current audit findings are tracked in `docs/SECURITY_AUDIT_FINDINGS.md`.

## Demo Accounts

Seeded demo accounts are documented in `specs/kmt-legal-platform/quickstart.md`. They only work after database migration and seed. Do not enable `KMT_DEMO_PASSWORD` or `KMT_DEMO_TOTP_SECRET` in production.

## Production Hosting Handoff

Production target is VPS-class hosting. Terminal VPS is the supported default. aaPanel is supported as a VPS panel adapter. cPanel is supported only when the hosting account provides persistent Node.js, PostgreSQL, command execution, env vars, and private storage outside `public_html`.

Relevant files:

- `deploy/env.production.example`
- `deploy/install/install.sh`
- `deploy/nginx/kmt-legal.conf.example`
- `deploy/systemd/kmt-legal.service.example`
- `docs/PLAN_26_PANEL_INSTALLER.md`
- `docs/PLAN_27_LIVE_SITE_QA_REMEDIATION.md`
- `specs/kmt-legal-platform/public-luxury-redesign-plan.md`
- `docs/INSTALL_TERMINAL_VPS.md`
- `docs/INSTALL_AAPANEL.md`
- `docs/INSTALL_CPANEL.md`
- `docs/VPS_DEPLOYMENT_RUNBOOK.md`
- `docs/RELEASE_QA_CHECKLIST.md`

Production uploads must live outside `public/`, for example `/var/lib/kmt-legal/uploads`, and must not be served directly by Nginx. The app streams downloads only after authorization.
Production uploads also require `MALWARE_SCAN_MODE=required`; `/api/health` fails closed if ClamAV cannot answer its probe.

For first setup on a fresh Ubuntu VPS:

```bash
sudo bash deploy/install/install.sh
```

Then open the printed `/install?token=...` URL, create the first Super Admin without TOTP, lock the installer, and run `sudo kmt-legal-disable-installer`.

For aaPanel or cPanel, follow PLAN-26 first. Do not run the root VPS installer inside a panel-managed environment unless you intentionally manage the whole VPS outside the panel.

Production readiness is exposed at `/api/health`. It returns `200` only after env, database, seed, first Super Admin, and installer lock checks pass. Normal app pages are blocked by the readiness gate in production until those checks are healthy.

## Where To Work

- Routes: `src/app`
- Product UI primitives/layouts: `src/components`
- Feature UI modules: `src/features`
- Server services/contracts: `src/server`
- Prisma schema and seed: `prisma`
- Unit and component tests: `tests/server`, `tests/ui`
- Playwright E2E: `tests/e2e`
- Plan and release docs: `docs`

## Blocked Local Checks In This Workspace

- Docker CLI is not installed, so local `docker compose up -d db` could not be run here.
- DB-backed smoke for login -> staff 2FA -> admin, booking -> convert -> portal, and upload/download still requires PostgreSQL plus seed data.
- `npm run security:audit` should be rerun on the release host; current dependency findings are tracked in `docs/SECURITY_AUDIT_FINDINGS.md`.
- Staff TOTP is intentionally deferred; do not enable `STAFF_2FA_MODE=totp` until a future Staff 2FA Rework plan is implemented and tested.
- PLAN-27 live-site QA remediation is partially implemented locally; do not claim production readiness until broader static/mobile smoke, DB-backed staging checks, and deployed-site evidence pass.
- PLAN-34 local static gates pass, but real PostgreSQL migrations/DB E2E, Paymob sandbox, real ClamAV EICAR verification, and post-deploy live/mobile/admin evidence are still required.
