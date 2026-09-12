# KMT Legal Platform Project Guide

2026-09-12 Batch 9 checkpoint: case-tab document upload retains an authorized current case outside the 100-option list; document soft deletion is confirmed through its dedicated POST route, while ordinary PATCH cannot revive a deleted document. The isolated browser/PostgreSQL lane covers general and case upload targets, six independent role/session scopes, historical case-linked access, both controlled update/delete orders, double delete, retained bytes, keyboard confirmation and 390/768/1440 visual evidence. Tablet document actions are available from `md`. Typecheck, warning-free lint, 523 tests, guarded build, secret scan, 58-page preservation and full cleanup passed; see `docs/reviews/2026-09-12/batch9/BATCH-9.md`. Production and live ClamAV verification remain separate release gates.

2026-09-12 batch 7 checkpoint: batch 6 was accepted and pushed as `ff988e8bbaf2b3ca7e82612071270819a4a5265e`. Batch 7 fixes staff-detail access by clients, nested CRM resource scopes and SHA-256 replay identity redaction, and improves neutral client-case badge contrast with existing tokens. Fourteen unique real HTTP/PostgreSQL scenarios have passing latest evidence across the recorded runs, plus seven existing consultation browser scenarios; unit checks pass 522 with 22 opt-in DB cases skipped. See `docs/reviews/2026-09-12/batch7/BATCH-7.md`, `scenario-results.json` and `verification.json` for precise evidence, intermediate failures, cleanup and remaining gates. No schema or production-role changes. Previously corrupted audit hashes are not automatically repaired. Local commit only pending exact-commit supervisor approval; later office/design work remains deferred.

Historical pre-push batch 6 checkpoint: batch 5 was approved and pushed as `6be83e29f6a2418edf16d38d092a151c9c8c9264`. Batch 6 covers payment trust, local lifecycle and financial-review visibility; see `docs/reviews/2026-09-12/batch6/BATCH-6.md` and its verification.json. Supervisor approval of the exact local commit is required before push. Do not start batch 7 or design work yet.

Payment integration handoff: new Paymob attempts save the server-created `intention_order_id` in the additive nullable unique providerOrderId column. Old open attempts need authenticated provider reconciliation before binding; unsigned metadata is never a backfill source. Read the batch 6 launch runbook before deployment. Checkout now requires expectedPrice from the latest reviewed summary. Financial review is separate from historical gross collection; no refund transfer or verified net settlement is implemented. Test fixtures use a disposable PG18 cluster and loopback provider only; real sandbox/cutover approval remains open.

## Start Here

This repo contains the KMT Legal MVP implementation: a Next.js App Router app, Prisma/PostgreSQL data model, private VPS filesystem upload contract, SMTP email abstraction, AI Provider Gateway, public website, client portal, admin office tools, analytics, and release hardening.

Use this file as the first handoff map. The detailed plan tracker is `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`.
For a current-state PRD and external model review brief, use `docs/KMT_LEGAL_CURRENT_PROJECT_PRD_FOR_REVIEW.md`.

## Current Status

- `PLAN-39` is locally verified. Contact inquiries create privacy-safe alerts for active authorized readers; `/portal`, `/product-system`, and `/stitch-clone` are retired runtime families; `/client` and login are bilingual and use the saved client locale.
- `PLAN-35` through `PLAN-39` still have separately recorded database, authenticated-browser, deployment, or live evidence gates. See `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md` before making a production-readiness claim.
- The public `/privacy` and `/ar/privacy` routes provide a bilingual, responsive privacy and job-applicant notice covering the verified Meta recruitment intake, email CV flow, website forms, client services, privacy rights, retention criteria, Meta processing, and first-party analytics boundaries.
- A disposable PostgreSQL 18.6 cluster passed 17 migrations and repeated seed in batch 2; production database migration/deployment remains unverified.
- DB-backed E2E flows need PostgreSQL plus seed data before they can run end to end.
- PLAN-34 makes Paymob the prepared primary provider, keeps PayTabs disabled standby, leaves paid booking disabled, adds expiring minimized receipts, PostgreSQL rate limiting, async scrypt, required production ClamAV scanning, optional privacy-safe Sentry, locale/error/accessibility/image hardening, and behavior-preserving module decomposition. DB-backed/provider/live deployment evidence remains a release gate.

## Recent Changes

- 2026-09-11 - Batch 5 is prepared locally for supervisor review: bilingual correction/slot revalidation, provider-failure boundaries and input recovery. A one-use same-tab draft handoff preserves data on the existing full-page language switch; no transcript, price or confirmation is stored. See `docs/reviews/2026-09-11/batch5/BATCH-5.md` for scope, retention details, original evidence and remaining design/provider work.

- 2026-09-11 - Batches 1, 2 and 3 were approved and pushed as `7ad0010`, `ea186fd`, and `194f6be`. Batch 3 adds real document HTTP/upload boundaries and a disposable restore drill.
- 2026-09-11 - Batch 4 was approved and pushed as `cf1b835`: exact-date slot confirmation, real date/time validation, bilingual chat date recovery, language hydration safety, and seven real HTTP/browser booking lifecycle cases. See `docs/reviews/2026-09-11/batch4/BATCH-4.md` for the fourteen-step coverage and remaining external/provider/design gates.

- 2026-09-11 - Prepared the first hardening/review batch on `codex/kmt-batch1-hardening` (supervisor review before push).
  - Changed: dependency security updates, matched Prisma CLI/client/adapter 7.10.0, malformed session-cookie handling, stale-slot clearing, payment restoration error handling and checkout handoff validation.
  - Evidence: source inventory preserves 58 page files, 100 API route files and 119 HTTP operations; dynamic patterns and source content slugs are separate. See `docs/reviews/2026-09-11/BATCH-1.md` for verification and explicit runtime limits.
  - Scope: database-backed security/concurrency, provider payment sandbox, backup/restore drill and visual redesign remain open; this batch does not reclassify prior release gates.

- 2026-07-28 - Implemented PLAN-39 site cleanup, contact alerts, and client localization.
  - Changed: permission-based contact bell alerts, true branded bilingual 404 handling, canonical client profile/preferences APIs, complete Arabic/English client and login copy, signed booking-locale inheritance, and an additive consultation-locale migration.
  - Removed: runtime `/portal`, `/product-system`, and `/stitch-clone` pages plus clone/product-only commands and tests.
  - Preserved: offline Stitch source exports and the `/stitch-assets` files used by real product pages.
  - Verification: Prisma validation/generation, typecheck, lint, 437 tests, guarded production build, 46 smoke browser checks, 9 retired-route/404 checks, and bilingual login browser coverage passed without contacting a database.

- 2026-07-22 - Implemented the PLAN-35 Governance local lane.
  - Changed: exact-Super role-permission service/APIs/page, grouped Arabic matrix, safe admin-user DTO selectors, delegated permission ceilings, optimistic serializable user updates, atomic session revocation/audit, final-Super protection, and active user/role checks at login and session resolution.
  - Behavior: only an active exact Super Admin with both governance permissions can edit active operational roles; protected/inactive roles remain read-only, user/API payloads contain no credential records or token hashes, and the admin registry now exposes all nineteen destinations.
  - Verification: 80 focused tests and all 337 unit/contract tests passed with typecheck, warning-free lint, guarded production build, 24-scenario Playwright collection, and diff hygiene. No database was installed or contacted; T083 was collection-verified only and T091 remains open.
  - Handoff: detailed contracts, environment boundaries, and deferred database/browser evidence are recorded in `docs/PROJECT_GUIDE.md` and the PLAN-35 quickstart.

- 2026-07-22 - Implemented the PLAN-35 Contact and Notifications local lane.
  - Changed: protected contact inbox, atomic contact status/audit workflow, unified generic/consultation notification projection, safe permission-aware links, owner-only generic reads, opaque full-center pagination, responsive RTL queue UI, route registry activation, and dashboard count loaders.
  - Behavior: authorized staff can process persisted contact work and reach a complete notification center; the executable admin registry now contains seventeen destinations while case create and role management remain planned.
  - Verification: 39 focused tests and all 304 unit/contract tests passed with typecheck, lint, guarded production build, 19-scenario Playwright collection, and diff hygiene. No database was installed or contacted; T068 remains open.
  - Handoff: detailed architecture, APIs, environment boundaries, and open evidence are recorded in `docs/PROJECT_GUIDE.md`.

- 2026-07-10 - Standardized Git delivery on GitHub only.
  - Changed: local `origin` now targets `https://github.com/johnrecap/kmtlegal.git`; the duplicate remote and obsolete dual-push instructions were removed.
  - Behavior: development pushes and production server pulls now use the same `origin/main` source of truth.
  - Verification: repository search contains no obsolete remote references, and local `main` tracks GitHub `origin/main`.

- 2026-07-10 - Expanded the public privacy and job-applicant notice.
  - Changed: bilingual public content, semantic privacy-page rendering, footer labels, UI tests, and Playwright responsive coverage.
  - Behavior: `/privacy` and `/ar/privacy` now expose a direct Meta-ready notice with applicant data categories, purposes, access, retention criteria, rights contacts, Meta links, and Arabic RTL support.
  - Verification: typecheck and lint passed; 35 Vitest files with 235 tests passed; ten focused Playwright privacy scenarios passed across desktop/mobile and English/Arabic, including sitemap coverage; production build passed with `ALLOW_BUILD_WITHOUT_DATABASE_URL=true`.
  - Release: no database, dependency, environment, push, or deployment change was made.

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
- Client portal: `http://localhost:3000/client`
- Admin: `http://localhost:3000/admin`

Retired `/portal`, `/product-system`, and `/stitch-clone` URLs intentionally return the branded
404. The Stitch source export is an offline archive, not a local route.

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

## 2026-09-11 ordinary delivery checkpoint

Batch 1 was pushed to origin/main as `7ad0010ffad2191bcada37ac45ba8a7ac8a973c4`.
Batch 2 repairs Cairo winter slot conversion, malformed-cookie logout, localized seed upserts,
and initial credential-form submission. Its isolated PostgreSQL 18.6 lane applied 17 migrations
and verified seed idempotency, sessions, client/document service isolation and free-booking races.
See `docs/reviews/2026-09-11/batch2/BATCH-2.md` for exact browser evidence, cleanup and remaining fourteen-step scope.
Batch 2 was subsequently approved and pushed as `ea186fd`. This does not close prior deployment,
provider, full authorization, backup or whole-project evidence gates.

## 2026-09-11 batch 3 data-protection checkpoint

Batch 2 is now pushed as `ea186fdb2e0a3b46572879bdb1683bd0098a153e`. Batch 3 adds real
HTTP document access/upload checks, a source-derived 19-entry office permissions table, and
a disposable PostgreSQL/file restore drill. It fixes initial GET submission in the client/admin
upload forms with the existing hydration guard. Eighteen unique browser/HTTP cases and 35
focused tests pass; 37 restored tables and 39 files match. The disposable cluster and copies
were stopped and removed. See `docs/reviews/2026-09-11/batch3/BATCH-3.md` for the final build result, original
reports and explicit limits. Batch 3 remains local for review; production ClamAV, aaPanel
restore and the full mutation permission matrix remain unverified.

## 2026-09-12 batch 8 office consistency checkpoint

Batch 8 aligns the client dashboard and court-date ownership rules around soft-deleted cases,
adds deterministic pagination and page metadata to the Arabic office calendar, and protects
task updates with atomic `updatedAt` compare-and-swap behavior. Task forms retain the current
case when scoped options or the 100-item option cap omit it, remain inert before hydration,
and preserve drafts through `409` recovery. Historical client-visible documents and issued
invoices remain available after a linked case is soft-deleted.

The disposable PostgreSQL 18/browser lane passed a stable-source 9-scenario suite plus a final
focused case-detail create scenario. Repository typecheck, lint, 522 tests, and production build
pass. See `docs/reviews/2026-09-12/batch8/BATCH-8.md` for the route/data inventory, evidence map,
failure traces, viewport-specific screenshots, scope limits, and cleanup record. This checkpoint
remains local for supervisor review; it has not been pushed or deployed. The synthetic records,
browser server, PostgreSQL cluster, disposable password, and Batch 8 scratch directories were
removed after the evidence archive was written.
