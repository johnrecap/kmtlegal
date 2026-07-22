# KMT Legal Platform — Engineering Handoff

**Last updated**: 2026-07-22

**Current delivery focus**: PLAN-35 Admin Operations Remediation

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
| Stitch reference | `stitch_kmt_legal_platform_ui_system`, `src/app/(install-ar)/stitch-clone` | Read-only visual source and isolated mechanical clone |

Do not connect product code or dynamic data to the Stitch clone. Do not edit the exported Stitch
source as part of ordinary product work.

## Current PLAN-35 Snapshot

The local Foundation, scope/appointments, workspace/permissions, Contact/Notifications, Manual
Cases, and Governance lanes are implemented. Governance tasks T082–T090 are locally verified. T091
remains open because it requires disposable PostgreSQL, safe authenticated staff states, concurrent
mutation evidence, and the real nineteen-route-by-five-role browser matrix. The production database
was not used for local acceptance.

The canonical admin registry now exposes all 19 implemented destinations. `roles.list` is visible
only to the exact `Super Admin` role with both `role.manage.any` and `permission.manage.any`.

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

The list accepts bounded `q`, `status`, `topic`, `sortBy`, `sortDirection`, `page`, and `pageSize`
parameters. It returns an explicit minimized projection. Readers can inspect the queue; managers can
apply the stored lifecycle `NEW → REVIEWED/ARCHIVED` and `REVIEWED → ARCHIVED`. Repeating the current
target is idempotent. Conflicting concurrent transitions fail, while successful transitions and the
required audit commit atomically.

No Prisma model, enum, migration, or seed change was needed for this lane.

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

The 2026-07-22 Governance verification passed:

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
