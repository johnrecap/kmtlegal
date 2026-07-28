# KMT Legal Platform — Engineering Handoff

**Last updated**: 2026-07-28

**Current delivery focus**: PLAN-39 Site Cleanup, Contact Alerts, and Client Localization

**Primary setup guide**: `../PROJECT_GUIDE.md`

**Implementation tracker**: `KMT_LEGAL_IMPLEMENTATION_STATUS.md`

## Start Here

KMT Legal is a Next.js App Router application with React, TypeScript, Prisma, and PostgreSQL. It
contains the public bilingual legal website, client workspace, protected Arabic-first admin tools,
private document storage, consultation/payment workflows, and deployment support for aaPanel/PM2.

Install and run:

```bash
npm ci
npm run dev
```

Supported runtimes are recorded in `package.json`: Node `20.19+`, `22.12+`, or `24+`, and npm `10+`.
Copy `.env.example` to a local untracked environment file when runtime services are required. Never
commit real credentials or client data.

## Repository Map

| Area | Location | Purpose |
|---|---|---|
| Routes and route handlers | `src/app` | Public, client, admin, and API entry points |
| Shared UI | `src/components` | Product layouts and reusable primitives |
| Feature UI | `src/features` | Screen-level and domain UI modules |
| Server logic | `src/server` | Auth, policy, services, integrations, and persistence boundaries |
| Data model | `prisma` | PostgreSQL schema, migrations, and seed contracts |
| Automated checks | `tests/server`, `tests/ui`, `tests/e2e` | Unit/contract, component, and Playwright coverage |
| Product plans | `specs/kmt-legal-platform` | Spec Kit requirements, plans, tasks, and analysis |
| Deployment | `deploy`, `docs/SERVER_COMMANDS.md` | aaPanel/PM2 and server handoff |
| Stitch reference | `stitch_kmt_legal_platform_ui_system`, `public/stitch-assets` | Offline read-only design archive and product-used localized images |

Do not recreate runtime Stitch clone pages or connect product code/dynamic data to the archive. Do
not edit the exported Stitch source as part of ordinary product work.

## Recent Changes

- 2026-07-28 - PostgreSQL 18 backup-client deployment remediation
  - The aaPanel/PM2 deploy path now reads the live PostgreSQL major version and selects a matching
    `pg_dump`/`pg_restore` pair before backup.
  - Exact-major tools are preferred; the lowest installed newer pair is accepted; older-only,
    incomplete, mismatched, or invalid explicit pairs stop deployment before migration.
  - `POSTGRES_BACKUP_BIN_DIR` supports nonstandard aaPanel/server installations without putting a
    credential or server path into tracked source.
  - Deterministic tests cover exact, newer, older-only, explicit-override, and fail-closed behavior.
- 2026-07-28 - PLAN-39 site cleanup, contact alerts, and client localization
  - Removed runtime `/portal`, `/product-system`, and `/stitch-clone` pages, their obsolete scripts,
    commands, snapshots, and the old portal profile API.
  - Added a branded bilingual global 404, canonical `/api/client/profile`, self-only
    `/api/client/preferences`, and complete Arabic/English `/client` and `/login` surfaces.
  - Added privacy-safe permission-based contact-message alerts with refresh-on-open and visible-tab
    30-second bell polling; contact persistence does not depend on alert delivery.
  - Added the additive `ConsultationRequest.locale` migration so delayed account setup inherits
    the trusted booking language; historical consultations default to Arabic.
  - Verification: Prisma validate/generate, typecheck, lint, 437 Vitest tests, guarded production
    build, 46 public browser checks, 9 retired-route/404 checks, and bilingual login browser check.
    Authenticated DB/staging, deploy, and live read-only checks remain open.

## Current PLAN-39 Snapshot

PLAN-39 is locally verified. `/client` is the only maintained client route family. Every
`/portal/*`, `/product-system/*`, and `/stitch-clone/*` request falls through to the branded global
404 with a real 404 status and no login redirect. The offline Stitch export remains available only
to developers, and current product images under `/stitch-assets` remain cacheable.

Visitor contact messages remain durable in the existing inbox. A generic alert is created for each
active user whose current effective permissions include notification self-read and contact
read/manage. The alert contains no visitor name, contact detail, topic, or message text. The bell
refreshes when opened and every 30 seconds while the admin document is visible.

Client pages and the shared login gateway use typed Arabic/English catalogs without a new
localization dependency. The account's `User.locale` drives `/client` document language,
direction, navigation, statuses, dates, numbers, currency, assistant, team chat, upload, profile,
and error copy. New account setup signs the consultation's stored booking locale; existing or
unsupported values safely normalize to Arabic.

## Retained PLAN-35 Snapshot

The local Foundation, scope/appointments, workspace/permissions, Contact/Notifications, Manual
Cases, Governance, and Command Center/Storage lanes are implemented. T092–T100 and T102–T106 are
locally verified. T091 remains open for disposable PostgreSQL governance evidence, and T101 remains
open for authenticated five-role dashboard/drill-down execution. The production database was not
used for local acceptance.

The canonical admin registry now exposes all 19 implemented destinations. `roles.list` is visible
only to the exact `Super Admin` role with both `role.manage.any` and `permission.manage.any`.

## Command Center And Storage Runtime Truth

- Admin home: `/admin`
- Snapshot API: `GET /api/admin/dashboard`
- Settings page: `/admin/settings`
- Settings API: `GET /api/admin/settings`

The admin home is a role-aware command center with exact semantic metrics, maximum-six priority
queues, filtered drill-down links, registry-filtered quick actions, and independent partial-failure
states. The settings API returns `{ settings, storageRuntimeDiagnostic }`; legacy `storage.policy`
is excluded and read-only, while the diagnostic derives safe effective facts from environment,
filesystem writability, and bounded scanner reachability without exposing paths or secrets.

## Role And User Governance

- Admin page: `/admin/roles`
- Matrix API: `GET /api/admin/roles`
- Replacement API: `PATCH /api/admin/roles/:roleId/permissions`
- Service: `src/server/admin/role-permission-service.ts`
- UI: `src/features/admin/governance/role-permission-form.tsx`

Guest, Client, and exact Super Admin roles are protected. Inactive roles remain visible but
read-only; Lawyer, Secretary, Office Admin, and Marketing Staff are editable only while active.
Permission replacement accepts strict unique canonical keys, including an intentional empty set,
claims `Role.updatedAt`, replaces assignments and writes one redacted audit inside a single
serializable transaction, and preserves at least one active exact-Super governance path.

Admin-user list/detail/create/update outputs now use explicit safe selectors and named DTOs. They do
not serialize `passwordHash`, TOTP/recovery material, session token hashes, or whole credential
records. Delegated `user.manage.any` can see and assign only active editable roles whose permission
sets are subsets of the actor's live role permissions. Update re-reads actor, target, and next role,
claims `User.updatedAt`, revokes target sessions when role/status access changes, writes the audit in
the same transaction, and cannot remove the final active exact Super Admin.

Password login and session resolution require an active nondeleted user and an active role. This
makes a suspended/deleted user, inactive role, or revoked session unusable on the next request.
No Prisma schema, migration, seed, or new UI dependency was added for this lane.

## Contact Message Flow

- Admin page: `/admin/contact-messages`
- List API: `GET /api/admin/contact-messages`
- Status API: `PATCH /api/admin/contact-messages/:messageId`
- Service: `src/server/admin/contact-message-service.ts`
- UI: `src/features/admin/contact-messages/contact-message-inbox.tsx`
- Public writer: `src/server/contact/contact-message-service.ts`
- Alert writer: `src/server/admin/notification-service.ts`

The list accepts bounded `q`, `status`, `topic`, `sortBy`, `sortDirection`, `page`, and `pageSize`
parameters. It returns an explicit minimized projection. Readers can inspect the queue; managers can
apply the stored lifecycle `NEW → REVIEWED/ARCHIVED` and `REVIEWED → ARCHIVED`. Repeating the current
target is idempotent. Conflicting concurrent transitions fail, while successful transitions and the
required audit commit atomically.

Accepted public messages also create deduplicated, generic per-user notifications for active
authorized recipients. Notification failure is logged without visitor data and does not roll back
the accepted message.

## Notification Flow

- Admin page: `/admin/notifications`
- Preview/center API: `GET /api/admin/notifications`
- Generic read API: `POST /api/admin/notifications/:notificationId/read`
- Service: `src/server/admin/notification-service.ts`
- Bell/popover UI: `src/features/admin/notifications/admin-notification-bell.tsx` and
  `src/features/admin/notifications/admin-notification-popover.tsx`

Preview mode accepts `limit` from 1–10. Full-center mode accepts `pageSize` from 1–50 plus an opaque
`cursor`; preview and center parameters cannot be mixed. The service projects generic notifications
and consultation-review work as distinct item kinds, computes complete-set attention before the
preview limit, deduplicates linked items, and preserves separate read/review state machines.

Generic notification reads require `notification.read.self` and ownership. Action URLs are limited
to safe internal admin destinations and are rechecked against the current principal. Dynamic case
and consultation links are also rechecked against current object scope; stale access falls back to a
safe authorized destination or no action.

## Client Routes, Localization, And Data

- Client routes: `/client`, `/client/cases`, `/client/court-dates`, `/client/files`,
  `/client/payments`, `/client/assistant`, and `/client/profile`
- Client APIs: `GET/PATCH /api/client/profile` and `PATCH /api/client/preferences`
- Locale catalogs: `src/content/client-content.ts` and `src/content/auth-content.ts`
- Client root/document semantics: `src/app/(client)/layout.tsx`
- Account setup routes: `/client-account/setup` and `/ar/client-account/setup`
- Migration: `prisma/migrations/20260728203000_plan_39_consultation_locale/migration.sql`

The preference endpoint accepts strict `{ locale: "ar" | "en" }`, derives the target user from the
session, requires an active linked client profile, and audits the self-owned update. Client-facing
components map stable error codes to catalog copy and do not display raw backend messages.

## Authorization And UI Boundaries

- Page visibility, navigation, and server authorization derive from `src/lib/admin-route-policy.ts`.
- Role governance requires exact Super Admin plus both governance permissions at route, page, and
  service boundaries; navigation discovery alone is never authorization.
- Contact read and manage capabilities remain separate.
- Generic notifications require `notification.read.self`; consultation review permissions alone do
  not grant access to another user's generic notifications.
- New Arabic user-facing copy lives in `src/lib/ui-copy.ts`; raw permission keys and server errors do
  not cross into the UI.
- Contact and notification surfaces reuse the existing design tokens, responsive breakpoints, RTL
  direction, keyboard semantics, accessible status announcements, and retry/error patterns. No new
  UI or animation dependency was added.
- Repeated admin forms preserve stable submission names while deterministic ID prefixes keep labels,
  help, and errors unique. Operational filters, searches, and tables use centralized Arabic
  accessible names, captions, scoped headers, semantic feedback, and mobile record alternatives.
- Local shared-shell baselines cover `1440x900`, `1023x768`, `1024x768`, `390x844`, and `320x568`.
  They are fallback evidence only; protected admin-page visual acceptance remains open in T112 until
  safe authenticated states exist, and production data is never used for that verification.

## Environment Boundaries

Environment names and examples live in `.env.example`. Important groups include:

- Runtime and origin: `APP_ENV`, `APP_ORIGIN`, `APP_RELEASE`
- Database: `DATABASE_URL`, `PRISMA_POOL_MAX`
- Authentication: `AUTH_SECRET`, `STAFF_2FA_MODE`, `SESSION_COOKIE_SECURE`
- Private storage: `UPLOADS_DIR`, `STORAGE_DRIVER`, `MALWARE_SCAN_MODE`
- Optional integrations: SMTP, AI, Paymob, analytics, and Sentry variables

Production requires a real PostgreSQL `DATABASE_URL`. The local-only build guard
`ALLOW_BUILD_WITHOUT_DATABASE_URL=true` lets static validation finish without contacting a database;
it must not be treated as runtime, migration, or production-readiness evidence.

Deploy PLAN-39 only after applying the additive consultation-locale migration. The migration gives
existing rows `ar`, constrains new stored values to `ar` or `en`, and should be retained during an
application rollback rather than dropped.

The protected production deploy discovers a `pg_dump`/`pg_restore` pair that is at least as new as
the live database server and uses the same pair to create and validate the pre-migration archive.
For nonstandard installations, set `POSTGRES_BACKUP_BIN_DIR` in the untracked
`.env.production.local`; see `SERVER_COMMANDS.md`. The deploy stops before migration if it cannot
prove the pair is compatible.

## Verification

Standard local checks:

```bash
npm run typecheck
npm run lint
npm run test
```

No-database build on PowerShell:

```powershell
$env:ALLOW_BUILD_WITHOUT_DATABASE_URL='true'; npm run build
```

The 2026-07-28 PLAN-39 local verification passed:

- `npm run db:validate` and `npm run db:generate`.
- `npm run typecheck`, `npm run lint`, and 437 tests across 61 Vitest files.
- Guarded production build with canonical client/profile/preference routes and no retired routes.
- 46 no-database public Playwright checks.
- 9 retired-route/404/asset Playwright checks.
- Bilingual login Playwright check; authenticated locale persistence was correctly skipped without
  disposable PostgreSQL and explicit `PLAN39_ALLOW_DB_FIXTURES=true`.
- The production deploy reached the mandatory backup gate but stopped safely because the live
  PostgreSQL server was major 18 while the PATH `pg_dump` was major 16. The compatibility
  remediation is locally covered; a fresh server pull/deploy is still required for runtime proof.
- The backup-client follow-up passed 25 focused deployment/security tests, all 443 tests across 62
  Vitest files, typecheck, lint, the guarded production build, both Bash syntax checks, the secret
  scan, diff hygiene, Analyze with zero unresolved findings, and zero-gap Converge.

The retained 2026-07-22 Governance verification passed:

- 80 focused server/component/route/contract tests.
- 337 repository unit/contract tests across 48 files.
- Typecheck and lint.
- Guarded production build with 72 static pages.
- Collection of 24 PLAN-35 Playwright scenarios, including three gated governance DB/browser cases.
- Git diff hygiene.

No DB-backed or authenticated Playwright scenario was claimed as passed. The guarded build generated
the Prisma client but did not connect to a database; it is not migration, seed, runtime, or T091
evidence.

## Known Gaps And Next Work

- Apply the PLAN-39 consultation-locale migration to disposable staging PostgreSQL, then run the
  authenticated client-language persistence suite with `PLAN39_ALLOW_DB_FIXTURES=true`.
- Run the opt-in disposable contact-message browser scenario to prove inbox + bell arrival and the
  denied lawyer/marketing role states against real role records; unit/permission coverage is green.
- Deploy the pushed release through aaPanel/PM2 and run read-only live health, retired-route 404,
  login redirect, and `/stitch-assets` checks before upgrading PLAN-39 beyond local verification.
- Run T091 against disposable migrated PostgreSQL and isolated authenticated staff storage states;
  execute repeat-seed persistence, stale/concurrent role and user mutations, inactive principal,
  target-session revocation, final-Super, and all 95 route/persona cells.
- Preserve T068 and T081 for their contact/notification and manual-case DB/browser evidence.
- Preserve the existing open PLAN-35 DB/auth gates for earlier lanes; skipped tests and 404/405
  responses are not acceptance evidence.
- Continue with the next user-authorized PLAN-35 task IDs only after refreshing downstream Spec Kit
  artifacts and rerunning analyze.

## Production Handoff

After a reviewed push to `origin/main`, the default aaPanel/PM2 update is:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The server must load its real production environment before migrations, build, and restart. See
`SERVER_COMMANDS.md`, `INSTALL_AAPANEL.md`, and `RELEASE_QA_CHECKLIST.md`; never use the local
no-database build guard as a production substitute.
