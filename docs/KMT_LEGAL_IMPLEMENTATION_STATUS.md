# KMT Legal Implementation Status

Last updated: 2026-06-24

This is the main tracking file for the 27 Spec Kit implementation plans.

## Summary

Total plans: 27

| Status | Count |
| --- | ---: |
| Done | 22 |
| In progress / partial | 5 |
| Not started | 0 |

## Current Execution State

| Plan | Status | What Is Done | What Is Still Missing |
| --- | --- | --- | --- |
| PLAN-00 Governance & Source of Truth | Done | `AGENTS.md`, governance doc, source-of-truth rules, Stitch isolation rule. | Nothing blocking for this stage. |
| PLAN-01 Next.js App Foundation | Done | Next.js App Router, TypeScript, Tailwind, ESLint, typecheck, build, Playwright, env example, package scripts. | Some future folders may expand during later feature slices. |
| PLAN-02 Stitch Visual Clone | Done | 23 clone routes generated, screenshots captured, local fonts/icons/images fixed, per-screen visual diff reports, final acceptance files. | Future pixel-perfect pass needs references exported at the same target viewport. |
| PLAN-03 Product Design System & Layout Shells | Done | Product tokens, UI primitives, public/admin/portal shells, RTL/accessibility states, routed `/product-system` showcase screens, component tests, screenshots. | Future feature slices will extend domain-specific components with real data. |
| PLAN-04 Database Schema, Prisma & Seeds | In progress / partial | Prisma 7/PostgreSQL config, schema, generated migration SQL, migration lock, deterministic readable Arabic seed script, role/permission seed data, demo legal data, production bootstrap split from local demo seed, backing file generation for demo document seeds, local PostgreSQL compose handoff, `db:validate`, `db:generate`, and seed contract tests passing. | Run `db:migrate`/`db:seed` twice against a running PostgreSQL `DATABASE_URL` through `npm run qa:db`; confirm seeded document download against private `UPLOADS_DIR`. |
| PLAN-05 Auth, Sessions, Roles & Permissions | Done | Server-side session model, password hashing, secure cookie policy, RBAC helpers, object-scope helpers, login/logout/me handlers, login UI, admin/portal protected entry routes, middleware protection, server page guards, auth/route tests. PLAN-25 disables TOTP/Email OTP/staff 2FA reset active flows; staff sessions become active after password login while `STAFF_2FA_MODE=disabled`. | DB-backed browser smoke remains tied to PLAN-04 PostgreSQL runtime availability. Future Staff 2FA Rework is deferred. |
| PLAN-06 Server Contracts, Validation, Errors & Audit Foundation | Done | Shared error shape, Zod validation helpers, requestId propagation, audit primitive, redaction, pagination/sort utilities, rate-limit hooks, disabled email/template abstraction, auth route validation/rate limits, tests. | Distributed rate limiting and CSRF/origin hardening move to PLAN-22. Future SMTP activation requires a separate plan. |
| PLAN-07 Document Storage & Upload Contract | Done | Private VPS filesystem storage helpers, generated file keys, 5MB allowlist, MIME/content validation, upload/download service contracts, protected routes, safe download headers, audit events, tests. | Runtime smoke needs real PostgreSQL and writable `UPLOADS_DIR`; UI wiring is delivered in PLAN-14/17. |
| PLAN-08 AI Provider Gateway & Legal Guardrails | Done | Provider-agnostic gateway, mock/openrouter/openai-compatible/local/custom registry, deterministic mock tasks, OpenAI-compatible adapter, schema validation, review disclaimer, safety rejection, metadata logging, tests. | Real provider smoke waits for configured provider/model/API key; current MVP feature usage is server-side only. |
| PLAN-09 Public Core Website | Done | Real Arabic home page, public shell/navigation/footer, services index/detail, team index/profile, shared public content, directory search/filter, SEO metadata, render/content tests. | Homepage featured content remains static until a later featured-content rule is added. |
| PLAN-10 Public Content, Media, Contact & Legal Pages | Done | Articles list/detail, anonymous case studies with disclaimers, read-only media wall, contact/branches page, contact API contract, privacy and terms pages, public read-only APIs. | Article and case-study list/detail routes are DB-backed through PLAN-20; legal/privacy copy still needs final legal review before production release. |
| PLAN-11 Consultation Booking Flow | Done | Booking stepper, validation, public consultation API, rate limit hook, duplicate protection, AI organizer classification/summary, disabled/skipped email metadata, public audit metadata. | Runtime DB smoke needs migrated PostgreSQL; admin review/convert continues in PLAN-12. |
| PLAN-12 Admin Consultation Review & Convert To Case | Done | Admin consultation queue/detail pages, list/detail/action APIs, assign/reject/convert service, linked client/case/optional appointment creation, permission checks, audit logs, contract tests. | DB-backed E2E waits for PLAN-04 PostgreSQL runtime. |
| PLAN-13 Client Portal Core | Done | Real portal dashboard, own-case listing/detail, client-safe case content, portal ownership guards, profile linkage checks, tests. | DB-backed browser smoke waits for PLAN-04 PostgreSQL runtime. |
| PLAN-14 Client Documents, Appointments, Payments & Profile | Done | Client document list/upload/download wiring, appointment list, read-only payment list, profile edit basics, portal navigation update, upload contract reuse, tests. | Runtime upload smoke waits for PostgreSQL plus writable private `UPLOADS_DIR`. |
| PLAN-15 Admin Dashboard & Clients CRM | Done | Real `/admin` metrics and operational lists, `/admin/clients` CRM list/search/filter/sort/pagination, client detail, create/edit/assign/archive actions, client-scoped permissions, audit logs, protected APIs, contract tests. | DB-backed browser smoke waits for PLAN-04 PostgreSQL runtime. |
| PLAN-16 Admin Cases, Sessions & Calendar | Done | `/admin/cases` list/search/filter/sort/pagination, `/admin/cases/[caseId]` detail tabs, status update with confirmation/audit, session creation, `/admin/calendar` list/filter/create/reschedule flows, protected APIs, role-scope tests. | DB-backed browser smoke waits for PLAN-04 PostgreSQL runtime. |
| PLAN-17 Admin Tasks & Document Management | Done | `/admin/tasks` task board/list filters, task create/update/assign APIs, `/admin/documents` list/upload/status/delete workflow, case detail task/document tabs, PLAN-07 upload/download reuse, audit logs, permission tests. | DB-backed authenticated browser smoke waits for PostgreSQL and writable `UPLOADS_DIR`. |
| PLAN-18 Admin Users, Settings & Audit Log | Done | `/admin/users`, exact Super Admin user creation, user detail/edit, exact Super Admin password change, role/status/locale governance, `/admin/settings` allowlisted non-secret settings with disabled/read-only SMTP and 2FA policies, `/admin/audit-log` search/filter/pagination, protected APIs, audit events, contract tests. | Invite email flow, email password reset, per-permission editing, production secret editing, audit export, SMTP activation, and Staff 2FA Rework remain deferred. |
| PLAN-19 Admin Finance & Reports Basics | Done | `/admin/finance` manual invoice/payment list, create/edit form, finance filters/summaries, protected finance APIs, `/admin/reports` MVP finance/operations report, report filters, finance/report permissions, audit events, contract tests. | No payment gateway, tax/line-item accounting, refunds, settlement, ledger, exports, or accounting integration in MVP. |
| PLAN-20 Content & Social Hub | Done | `/admin/content` hub, article/case-study/social draft create/edit workflows, pending approval queue, AI social draft panel through the AI gateway, public DB-backed article/case-study pages and APIs, content sidebar links, permission/guardrail tests. | No external social publishing, social OAuth, platform analytics, rich text/media library, or standalone `MediaEntry` CRUD in MVP. |
| PLAN-21 Privacy-Safe Analytics & Observability Events | Done | Internal `analytics_events` store, MVP event taxonomy, client-safe analytics endpoint, strict allowlisted properties, actor hashing, env/release/requestId tags, safe logging helper, booking/upload/consultation/case instrumentation, privacy tests. | External analytics provider, Sentry/hosted observability, dashboard UI, alerting, and retention job remain deferred. |
| PLAN-22 Security, Privacy, Upload & Observability Hardening | Done | Global security headers/CSP, `/api/*` Origin/Referer mutation guard, trusted `X-Real-IP` handling for production, dormant 2FA attempt helpers, AI-specific limiter before public booking AI calls, upload `Content-Length` early rejection, stricter audit/safe-log redaction, production VPS readiness checks, security audit scripts, PLAN-22 doc, hardening tests. | VPS runtime smoke remains part of PLAN-23/release operations. |
| PLAN-23 Testing, QA, Deployment & Handoff | In progress / release-blocked | Non-DB Playwright smoke test, DB-backed E2E suite entrypoint, robust Playwright server runner, `KMT_PORT`-aware Playwright baseURL, local/DB/release QA scripts, VPS env/Nginx/systemd examples, project guide, VPS runbook, release checklist, security audit findings doc, production `/api/health` readiness endpoint and app-entry readiness gate. | Production release is blocked until `qa:db`, `qa:release`, dependency audit remediation, and VPS smoke pass on a real PostgreSQL/VPS target. |
| PLAN-24 Remediation & Production Readiness | In progress / partial | Added remediation epic docs, git hygiene for `_workspace/` and `debug.log`, no-store `/api/auth/me`, disabled Email OTP UI/routes, required destructive/action confirmation checkboxes, separated success/error states in case/document admin forms, production DB fallback removal, production seed/demo split, upload early reject, AI limiter, route-manifest contract test, secret scan script, DB E2E entrypoint. | Remaining: run `qa:db` against real PostgreSQL, execute `qa:release`, complete dependency upgrade pass, verify VPS Nginx/TLS/systemd/private uploads/backups smoke, and update audit findings after package remediation. |
| PLAN-25 No-Code VPS Installer & First Admin Bootstrap | In progress / partial | Added PLAN-25 Spec Kit/docs, disabled active TOTP flow and `/login/2fa`, disabled TOTP/Email OTP/reset routes, staff password login with `STAFF_2FA_MODE=disabled`, token-protected installer APIs, `/install` wizard, first Super Admin bootstrap without TOTP, installer lock, VPS install script, env/systemd updates, and contract tests. | Remaining: run on real VPS/staging target, complete installer browser smoke, run `sudo kmt-legal-disable-installer`, run `qa:release`, and archive production evidence. |
| PLAN-26 Panel-Aware Installer Compatibility | In progress / partial | Added Spec Kit plan for Terminal VPS, aaPanel, and conditional cPanel setup modes; implemented `/install` hosting selector, `hostingMode` preflight contract, Node/PostgreSQL/private uploads/SMTP/TOTP/token checks, DB connectivity/schema/seed preflight, cPanel hard-requirement checks, `deploy/install/panel-install.sh`, `existing` vs `auto` database setup choice, panel install docs, harness team spec, env names, tasks, quality gates, and contract/static tests. | Remaining: test real aaPanel and compatible cPanel targets, run hosting smoke evidence, and archive panel screenshots/logs. |

## Remaining Count

- Fully not started: 0 plans.
- Partially open: 5 plans.
- Done: 22 plans.

## Immediate Next Steps

1. Start PostgreSQL with `docker compose up -d db`, or configure a real `DATABASE_URL`, then run `npm run qa:db`.
2. Run `npm run qa:release` after PostgreSQL, uploads, disabled-SMTP, and AI env decisions are configured for the release candidate.
3. Resolve dependency audit findings through a controlled Next/Prisma upgrade pass; do not use `npm audit fix --force` blindly.
4. Run VPS smoke for `/api/health`, Nginx/TLS/systemd/private uploads/backups before closing PLAN-23/24. SMTP smoke is deferred until the future SMTP activation plan.
5. For aaPanel/cPanel deployment, complete PLAN-26 preflight and smoke before claiming panel compatibility.
6. Keep `/stitch-clone/*` frozen and disabled in production unless `ENABLE_STITCH_CLONE=true` is explicitly set for visual QA.

## Verification Already Passing

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run db:validate`
- `npm run db:generate`
- `npm run test -- tests/server/security-hardening.test.ts`
- `npm run qa:local`
- `npm run test:e2e:smoke`
- `npm run security:secrets`

## Important Notes

- `/stitch-clone/*` is still static and isolated; production middleware blocks it unless `ENABLE_STITCH_CLONE=true`.
- Product design-system components are separate from Stitch clone routes.
- Backend foundation now exists for Prisma, auth, contracts, storage, disabled email templates, and AI.
- Database migrate/seed has not been run in this workspace because no running PostgreSQL instance was verified yet; Docker CLI is not currently available on this machine.
- PLAN-18 browser smoke was completed with a controlled local dev process and Super Admin credentials. Long-running VPS/process-manager behavior remains part of PLAN-23 deployment handoff.
- `npm run security:audit` currently reports dependency vulnerabilities; this blocks production release.
- PLAN-23 ran `npm run security:audit`; it failed and is documented in `docs/SECURITY_AUDIT_FINDINGS.md`.
