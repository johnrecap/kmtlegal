# plan.md

## Architecture Overview
KMT Legal Platform should be built as a modular Next.js App Router application with server-side feature boundaries. The MVP uses Next.js Server Components, Route Handlers, and Server Actions where appropriate, with domain logic separated into services and repositories. PostgreSQL + Prisma owns persistence. Auth and permissions are centralized. Public content is mostly read-optimized, while portal/admin flows are protected, dynamic, audited, and never shared-cache exposed.

## Recommended Stack
- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui and Radix UI for product UI only, not Stitch clone routes
- Lucide React icons
- React Hook Form + Zod
- next-intl or equivalent i18n
- TanStack Query only where client-side server state is needed
- Recharts for dashboard charts
- PostgreSQL
- Prisma ORM
- Auth.js/NextAuth or equivalent secure cookie session auth
- Private VPS filesystem storage abstraction
- Disabled SMTP/email template abstraction for future activation
- Playwright, Vitest/Jest, Testing Library
- Terminal VPS deployment with Docker or systemd behind Nginx, plus panel-aware aaPanel/cPanel adapter planning

## Why This Stack Fits
- Next.js supports public SEO pages and protected dashboard flows in one codebase.
- Server Actions and Route Handlers are enough for MVP, while service/repository layers keep migration to NestJS possible.
- Prisma + PostgreSQL fit relational legal data and audit trails.
- Tailwind + shadcn/Radix support reusable accessible UI and RTL-compatible styling.
- Zod gives runtime validation for hostile inputs; TypeScript alone is not a security boundary.

## Tradeoffs
- Next.js monolith is faster for MVP but can grow complex if service boundaries are ignored.
- Server Actions reduce API boilerplate but still require explicit validation, authz, CSRF posture, and tests.
- shadcn/ui speeds product UI but must not be used in raw Stitch clone.
- Private VPS filesystem storage is operationally simple but requires strict directory permissions, app-streamed downloads, and backups.

## Simpler Alternative
Use only Next.js + Server Actions + Prisma + private VPS filesystem storage for MVP. SMTP/dev-email transport is deferred and disabled while its env placeholders remain documented.

## Scalable Alternative
Split backend into NestJS or separate API service, add BullMQ + Redis, add storage lifecycle/retention workers, add OpenTelemetry, add full search service, and add OCR/RAG/document processing workers.

## Application Layers
- UI layer: route pages, layouts, reusable components, forms, tables, dashboard widgets.
- Routing layer: public, auth, portal, admin, API, error routes.
- Feature modules: auth, clients, lawyers, services, consultations, cases, appointments, documents, tasks, content, finance, audit, settings, analytics.
- Server actions/API layer: validated entrypoints only; no raw DB calls in components.
- Service layer: business rules, permission checks, audit emission.
- Repository/data access layer: Prisma queries, scoped by ownership and permissions.
- Database layer: PostgreSQL schema, indexes, constraints, migrations, seeds.
- Background jobs: abstraction first for email delivery, reminders, document processing placeholders, content scheduling, and social sync later.
- Integrations: private VPS-class filesystem storage and AI Provider Gateway in MVP; SMTP email, SMS, payment gateway, and social publishing deferred.
- Observability: requestId, structured logs, error capture, privacy-safe telemetry.

## Folder Structure
```text
src/
  app/
    [locale]/
      (public)/
      portal/
      admin/
      login/
    api/
    stitch-clone/
  components/
    ui/
    layout/
    public/
    dashboard/
    legal/
    forms/
    states/
  features/
    auth/
    clients/
    lawyers/
    services/
    consultations/
    cases/
    appointments/
    documents/
    tasks/
    content/
    finance/
    reports/
    audit/
    settings/
    analytics/
  lib/
    auth/
    permissions/
    db/
    validations/
    i18n/
    storage/
    ai/
    email/
    telemetry/
    utils/
  server/
    services/
    repositories/
    actions/
    jobs/
  styles/
  types/
  config/
prisma/
  schema.prisma
  seed.ts
tests/
  unit/
  integration/
  e2e/
docs/
specs/
```

## Routing Plan
### Public Routes
`/`, `/services`, `/services/[slug]`, `/team`, `/team/[slug]`, `/book-consultation`, `/case-studies`, `/case-studies/[slug]`, `/media`, `/articles`, `/articles/[slug]`, `/contact`, `/privacy`, `/terms`.

### Auth Routes
`/login`, logout action, current-user endpoint/action.

### Client Portal Routes
`/portal`, `/portal/cases/[id]`, `/portal/documents`, `/portal/appointments`, `/portal/payments`, `/portal/profile`.

### Admin Routes
`/admin`, `/admin/clients`, `/admin/clients/[id]`, `/admin/consultations`, `/admin/cases`, `/admin/cases/[id]`, `/admin/calendar`, `/admin/tasks`, `/admin/documents`, `/admin/content`, `/admin/content/articles`, `/admin/content/case-studies`, `/admin/finance`, `/admin/reports`, `/admin/users`, `/admin/settings`, `/admin/audit-log`.

### API Routes / Server Actions
Prefer Server Actions for form mutations where suitable and Route Handlers for file upload/download, auth callbacks, webhooks later, and JSON API boundaries. All protected operations require session + permission + object-scope checks.

### Error Routes
401, 403, 404, 500, global error boundary, not-found, permission-blocked state.

## State Management Plan
- Local UI state: component state for toggles, dialogs, tabs, and transient controls.
- Form state: React Hook Form + Zod resolver.
- Server state: Server Components for initial protected reads; TanStack Query only for interactive client-heavy admin tables if needed.
- URL state: search/filter/sort/pagination query params.
- Global auth/session state: server session source of truth; client session context only for UX.
- Cache invalidation: mutation returns explicit revalidate paths/tags or query invalidations; no shared cache for private data.

## Frontend Architecture
- Arabic RTL-first layouts with English-ready LTR mirroring.
- Public shell, portal shell, admin dashboard shell.
- Semantic design tokens from Stitch `DESIGN.md`: surface, elevated, text, outline, primary navy, gold accent, success/warning/error/info/private.
- Components expose complete states: default, hover, focus, active, disabled, loading, empty, error, success, no-permission.
- Admin dashboards prioritize dense, readable tables over marketing layouts.
- Public pages use premium legal trust language and no legal outcome promises.
- Forms include connected labels, validation messages, and safe recovery.

## Backend Architecture
- Auth/session helpers centralized.
- Permission helper accepts actor, permission key, resource ownership context.
- Zod schemas for every server action and route handler.
- Service functions own business rules and audit logging.
- Repositories own Prisma access and always scope by ownership where relevant.
- Unified error shape with localized messages and requestId.
- AuditLog service records actor/action/resource/metadata without sensitive payloads.
- Background job abstraction for later reminders, emails, document processing, and social sync.

## Integration Plan
- Payments: manual/read-only MVP; real gateway deferred.
- Email: SMTP placeholders and templates exist, but runtime UI/backend sending is disabled until a future activation plan.
- SMS/WhatsApp: deferred.
- Storage: private filesystem storage at a path outside the webroot, such as `/var/lib/kmt-legal/uploads` on VPS/aaPanel or a non-`public_html` private path on cPanel; the web server must not serve uploads directly.
- Maps: branch/contact display can use static content in MVP.
- Analytics: privacy-safe event taxonomy only; no raw PII.
- AI: server-side AI Provider Gateway with `mock`, `openrouter`, `openai-compatible`, `local`, or `custom` adapters.
- Social media: drafts and counters only; no external publishing.
- Search: DB search/filter for MVP; full-text/vector search deferred.

## Implementation Milestones

### Milestone 1 - Project Foundation
- Goal: Create buildable Next.js foundation.
- Tasks: TypeScript, Tailwind, shadcn, lint, tests, i18n, RTL, app structure.
- Dependencies: none.
- Output: app shell, scripts, env example.
- Tests: typecheck/build/lint.
- Acceptance: no product logic yet; build passes.

### Milestone 2 - Stitch Visual Clone Harness
- Goal: Preserve Stitch clone exactly as isolated raw visual clone routes before product UI work.
- Tasks: `PLAN-02A` source inventory and asset freeze, `PLAN-02B` raw JSX mechanical conversion, `PLAN-02C` CSS/font/icon/asset preservation, `PLAN-02D` Playwright screenshot capture, `PLAN-02E` visual difference review, `PLAN-02F` targeted parity fix loop, `PLAN-02G` final acceptance report.
- Dependencies: Milestone 1.
- Harness: `.agents/skills/stitch-clone-orchestrator/SKILL.md` and `docs/harness/stitch-clone/team-spec.md`.
- Output: `/stitch-clone/*` raw routes plus `_workspace/stitch-clone/{screen-name}/` evidence files.
- Tests: Playwright screenshots at `390x844` and `1440x900` where desktop references exist.
- Acceptance: clone does not use product components, shadcn/ui, backend calls, dynamic data, CSS simplification, or redesign.

### Milestone 3 - Data, Auth, Permissions, Server Contracts
- Goal: Establish secure data and server foundation.
- Tasks: Prisma schema, seeds, auth, RBAC, staff password login with TOTP deferred, Zod, errors, audit primitive.
- Dependencies: Milestone 1.
- Output: validated schema, seeded roles, auth guards.
- Tests: Prisma validate, permission tests, auth negative tests.
- Acceptance: protected routes/actions reject unauthenticated and unauthorized users.

### Milestone 4 - Public Website and Consultation Intake
- Goal: Public pages and booking flow.
- Tasks: services/team/articles/case studies/contact/booking/AI Gateway organizer output/reference confirmation. Email delivery is deferred.
- Dependencies: Milestones 2 and 3.
- Output: seeded public pages and saved consultation requests.
- Tests: public render, form validation, consultation E2E.
- Acceptance: request saved and marked for review.

### Milestone 5 - Admin Consultation Review and Conversion
- Goal: Convert intake into operational case records.
- Tasks: queue, detail, assign, reject, convert, audit.
- Dependencies: Milestone 4.
- Output: consultation-to-case workflow.
- Tests: conversion integration and E2E.
- Acceptance: created/linked client and case with audit.

### Milestone 6 - Client Portal
- Goal: Client self-service with own data only.
- Tasks: dashboard, case detail, documents/upload, appointments, payments, profile.
- Dependencies: Milestones 3 and 5 plus private VPS storage contract.
- Output: protected client portal.
- Tests: own-data-only access, upload validation.
- Acceptance: client cannot access another client's records.

### Milestone 7 - Internal Operations Dashboard
- Goal: Admin/lawyer operating system.
- Tasks: CRM, cases, sessions, calendar, tasks, documents, content/social, finance/reports, users/settings/audit.
- Dependencies: Milestones 3, 5, and 6 where relevant.
- Output: protected admin dashboard.
- Tests: role matrix, audit logs, table/filter flows.
- Acceptance: admin/staff actions are audited and permissioned.

### Milestone 8 - Security, Observability, QA
- Goal: Harden MVP.
- Tasks: rate limits, CSRF posture, headers, disabled-TOTP readiness checks, disabled-SMTP checks, AI Gateway guardrails, no PII telemetry, error capture, full tests.
- Dependencies: all feature milestones.
- Output: release candidate.
- Tests: E2E, accessibility, security, smoke.
- Acceptance: quality gates pass.

### Milestone 9 - Deployment Readiness
- Goal: Handoff-ready deployment plan.
- Tasks: VPS Docker/systemd config, Nginx reverse proxy, env validation, migrations, PostgreSQL and uploads backup/restore, monitoring, rollback, quickstart.
- Dependencies: Milestone 8.
- Output: deployment docs and runbooks.
- Tests: clean setup and smoke checklist.
- Acceptance: new developer can run and verify MVP from docs.

### Milestone 10 - PLAN-25 No-Code VPS Installer
- Goal: Make first production setup possible without developer knowledge.
- Tasks: disable TOTP flow, keep SMTP disabled, add `STAFF_2FA_MODE=disabled`, add `/install` wizard, add installer API routes, bootstrap first Super Admin, lock installer, add one-command VPS script and handoff docs.
- Dependencies: Milestones 3 and 9 plus PLAN-24 remediation.
- Output: token-protected VPS installer and Super Admin bootstrap.
- Tests: installer contract tests, auth without 2FA, production readiness checks, build, VPS smoke.
- Acceptance: first Super Admin can be created without TOTP; `/install` locks after setup; Super Admin only can create users and change passwords.

### Milestone 11 - PLAN-26 Panel-Aware Installer
- Goal: Let the operator choose the hosting panel before setup so installation follows the correct supported path.
- Tasks: add hosting compatibility matrix, define Terminal VPS / aaPanel / cPanel installer modes, add preflight contract, document panel-specific command and UI handoff, and define rejection messages for unsupported cPanel/shared-hosting cases.
- Dependencies: PLAN-25 installer and PLAN-23 deployment handoff.
- Harness: `docs/harness/panel-installer/team-spec.md`.
- Output: Spec Kit and handoff docs for `terminal-vps`, `aapanel`, and `cpanel` setup paths.
- Tests: preflight rejects missing Node/PostgreSQL/private storage/process manager; panel mode never runs root-only VPS commands; Terminal VPS keeps current root installer path.
- Acceptance: user can pick the panel, see only the steps available for that panel, and unsupported hosting is rejected before migration/build/bootstrap begins.

### Milestone 12 - PLAN-27 Live Site QA Remediation
- Goal: Convert deployed-site QA findings into release-blocking fixes and evidence.
- Tasks: align homepage articles/case studies with DB-backed published content, remove broken public links, add public link-crawl smoke, verify `_next/static` chunk/CSS integrity after auth redirects and admin routes, resolve Cloudflare Insights CSP behavior, add favicon, remove production-visible dev login copy, localize auth errors and admin shell/settings copy, clean booking/contact success UX, hide legacy admin mock AI text, constrain admin overflow, and archive live smoke evidence.
- Dependencies: PLAN-09, PLAN-10, PLAN-11, PLAN-20, PLAN-22, PLAN-23, PLAN-26.
- Current status: local code remediation is partially implemented and re-verified after the admin extension; atomic deploy, DB-backed staging, and deployed live evidence remain open.
- Output: `docs/PLAN_27_LIVE_SITE_QA_REMEDIATION.md`, tasks T181-T204, Gate 6B, release checklist updates, automated smoke coverage, and live deployed evidence.
- Tests: typecheck, unit/contract tests, build, public link-crawl Playwright smoke, authenticated admin live smoke, DB-backed public content smoke, static asset/CSP/favicon smoke, mobile smoke, and deployed live smoke.
- Acceptance: no rendered public link returns 404, no `ChunkLoadError`, no blocked CSP beacon error, favicon resolves, production login/admin copy is clean/localized, booking/contact success states are user-safe, admin mock AI/overflow findings are cleared, and evidence is archived before production-ready status is claimed.

### Milestone 13 - PLAN-28 Public Luxury Redesign
- Goal: Redesign the public website into a dark luxury legal experience inspired by the uploaded reference while preserving all protected product surfaces.
- Tasks: freeze public-only boundary, define scoped public visual contract, select approved imagery, redesign public shell/components, rebuild homepage hierarchy, roll out to services/team/articles/case-studies/media/contact/booking/privacy/terms, update Arabic public labels and metadata, preserve booking/contact contracts, add public link crawl and desktop/mobile screenshots, run design polish, and archive evidence.
- Dependencies: PLAN-09, PLAN-10, PLAN-11, PLAN-20, PLAN-27 public link/content remediation.
- Output: `specs/kmt-legal-platform/public-luxury-redesign-plan.md`, tasks T205-T228, Gate 6C, updated public UI, public QA evidence, and deployment handoff.
- Tests: typecheck, lint, unit/component tests, build, public smoke, public link crawl, booking/contact regression, desktop `1440x900` screenshots, mobile `390x844` screenshots, RTL/accessibility checks, and protected-surface drift spot checks.
- Acceptance: every public route follows the new dark luxury visual language; no admin/portal/product-system/Stitch/shared UI primitive drift; public Arabic copy is safe and outcome-neutral; no visible `EN` toggle exists before full localization; public internal links, booking/contact flows, contrast, focus states, and mobile overflow all pass.
