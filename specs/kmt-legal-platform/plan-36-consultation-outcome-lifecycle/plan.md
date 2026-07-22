# Implementation Plan: Consultation Outcome Lifecycle

**Branch**: `main` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Approved PLAN-36 specification at `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/spec.md`.

## Summary

Extend the existing consultation request with a separate, explicit outcome dimension. The existing payment-maintenance PM2 process will reconcile old rows and classify ended primary bookings every 60 seconds. A shared outcome service will own primary-booking selection, optimistic version checks, atomic consultation/appointment/audit/notification transitions, and lifecycle guards used by both new endpoints and existing assign/review/reject/convert operations. Admin list, detail, dashboard, calendar, and notifications will consume that same scope and expose Arabic-first RTL recovery flows without adding libraries or changing PLAN-35 evidence status.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js supported production ranges from `package.json`, ECMAScript modules for maintenance scripts, SQL for additive PostgreSQL migration

**Primary Dependencies**: Next.js 15 App Router, React 18, Prisma 7.8, PostgreSQL adapter, Zod 4, Tailwind CSS 3, existing authentication/authorization/audit/notification/design primitives

**Storage**: Existing PostgreSQL database through Prisma; additive enum, nullable outcome metadata, optimistic version, relation, indexes, and idempotent reconciliation; no local database installation

**Testing**: Vitest 4 characterization/contract/service tests, TypeScript compiler, Next lint/build, existing Playwright 1.51 harness for desktop/mobile RTL and console evidence, database-backed validation only on staging/disposable PostgreSQL

**Target Platform**: Next.js web application deployed through aaPanel, Nginx, and PM2 on Linux; Arabic protected admin UI

**Project Type**: Single full-stack web application with server-side App Router pages and API routes plus one existing recurring maintenance process

**Performance Goals**: Classify every eligible booking during the first maintenance cycle at or after `endsAt`, with a maximum configured cycle of 60 seconds; retain paginated list behavior and index the outcome/primary-booking queries

**Constraints**: No Paymob activation, 2FA work, Prisma upgrade, local database, production test data, new UI/animation/chart library, client analytics, second worker, destructive rollback, or runtime PLAN-35 status changes

**Scale/Scope**: One new lifecycle axis, two mutation endpoints, one extended list contract, five connected admin/operational consumers, one additive migration, one existing worker, deployment and documentation updates

## Constitution Check

### Before Phase 0 research

- **Spec Kit gate — PASS**: The constitution is valid at v1.0.0, PLAN-36 has an approved specification, no formal clarification is required because the user resolved all material decisions, and the requirements checklist is 16/16 complete.
- **Existing-system gate — PASS**: The plan extends `ConsultationRequest`, the existing consultation review service/routes, appointment conflict transaction, notification service, dashboard service, UI primitives, `ui-copy.ts`, maintenance script, and aaPanel deployment script.
- **Connected-impact gate — PASS**: Data, services, existing mutations, list/detail contracts, permissions, audit, notifications, dashboard, calendar, UI, timezone, tests, docs, migration, PM2, and rollback are mapped below.
- **Correctness gate — PASS**: One outcome service and one primary-booking selector are the canonical source; mutation authorization requires both permissions; optimistic concurrency and transaction boundaries are specified before UI work.
- **Quality gate — PASS**: Expected-red characterization tests precede behavior changes; local checks are distinct from DB, browser, and live evidence; unavailable DB/live evidence remains explicitly deferred rather than passing.
- **Conflict-control gate — PASS**: Work is single-agent and sequential. Shared files are grouped into ownership lanes and `[P]` is not used for overlapping fixtures or sources.

### After Phase 1 design

- **Spec Kit gate — PASS**: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/consultation-outcome-contract.md](./contracts/consultation-outcome-contract.md), and [quickstart.md](./quickstart.md) resolve all design decisions without `NEEDS CLARIFICATION` markers.
- **Existing-system gate — PASS**: Each new surface has an explicit reuse/extend decision; no parallel authorization, scheduling, audit, notification, formatting, or deployment subsystem is introduced.
- **Connected-impact gate — PASS**: The contract specifies list/count/calendar/notification consistency and lifecycle guards for existing mutations.
- **Correctness gate — PASS**: State transitions, version comparison, primary-booking identity, transaction isolation, audit metadata, notification idempotency, backfill, and rollback are deterministic.
- **Quality gate — PASS**: Quickstart gates cover local-no-DB, disposable/staging DB, Playwright, deployment stability, and live acceptance separately.
- **Conflict-control gate — PASS**: `tasks.md` will preserve the user-approved T001–T030 ordering and exact shared-file ownership.

## Project Structure

### Documentation for this feature

```text
specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── analyze.md
├── contracts/
│   └── consultation-outcome-contract.md
├── checklists/
│   ├── requirements.md
│   └── delivery.md
└── tasks.md
```

### Source code affected during implementation

```text
prisma/
├── schema.prisma
└── migrations/20260722180000_plan_36_consultation_outcomes/migration.sql

src/
├── app/api/admin/consultations/
│   ├── route.ts
│   └── [consultationId]/
│       ├── outcome/route.ts
│       ├── reopen/route.ts
│       ├── assign/route.ts                 # service guard only; route contract preserved
│       ├── review/route.ts                 # service guard only; route contract preserved
│       ├── reject/route.ts                 # service consistency preserved
│       └── convert/route.ts                # service guard only; route contract preserved
├── app/(app-ar)/admin/
│   ├── consultations/page.tsx
│   ├── consultations/[consultationId]/page.tsx
│   ├── calendar/page.tsx
│   ├── cases/page.tsx
│   ├── cases/[caseId]/page.tsx
│   └── clients/[clientId]/page.tsx
├── features/admin/
│   ├── consultations/consultation-action-panel.tsx
│   ├── consultations/consultation-reopen-form.tsx
│   ├── dashboard/admin-command-center.tsx
│   └── notifications/admin-notification-popover.tsx
├── lib/
│   ├── legal-format.ts
│   └── ui-copy.ts
└── server/
    ├── admin/
    │   ├── consultation-outcome-service.ts
    │   ├── consultation-review-service.ts
    │   ├── dashboard-service.ts
    │   ├── notification-service.ts
    │   └── calendar-service.ts
    ├── appointments/appointment-conflict-service.ts   # reused, not duplicated
    ├── audit/audit-event-catalog.ts
    └── http/errors.ts

scripts/
├── consultation-outcome-maintenance.mjs
└── payment-maintenance.mjs

deploy/
├── env.production.example
└── install/aapanel-pm2-update.sh

tests/
├── server/
│   ├── consultation-outcome-characterization.test.ts
│   ├── consultation-outcome-service.test.ts
│   ├── consultation-outcome-contract.test.ts
│   ├── consultation-outcome-maintenance.test.ts
│   ├── admin-consultations.test.ts
│   ├── admin-dashboard.test.ts
│   ├── admin-notifications.test.ts
│   └── legal-format.test.ts
└── e2e/
    └── plan36-consultation-outcomes.spec.ts

docs/
├── KMT_LEGAL_IMPLEMENTATION_STATUS.md
├── KMT_LEGAL_SPEC_KIT_PLAN_INDEX.md
├── KMT_LEGAL_FEATURE_INVENTORY.md
├── SERVER_COMMANDS.md
└── RELEASE_QA_CHECKLIST.md
```

**Structure Decision**: Keep the current single Next.js repository. Add one focused server module and one testable maintenance helper, while routing all consumers through existing services and UI components. The helper is imported by the existing payment-maintenance process; it is not a second process.

## Reuse and Extension Decisions

| Concern | Decision | Existing source |
|---|---|---|
| Outcome storage | Extend | `prisma/schema.prisma` `ConsultationRequest`; do not overload `ConsultationStatus` or `AppointmentStatus` |
| Primary booking | Add shared selector | Consultation appointment relation plus compound index; exclude `caseId != null` follow-ups |
| Conflict safety | Reuse | `runAppointmentConflictTransaction()` and `assertNoAppointmentConflict()` |
| Authorization | Reuse and compose | `hasPermission()`; require both `consultation.review.any` and `appointment.manage.any` |
| API envelope/errors | Extend | `ApiError`, `errorToResponse`, central stable error map |
| Audit | Extend catalog | `appendAuditLog()` inside the same transaction; safe metadata whitelist |
| Notifications | Extend | Existing consultation notification record and dedupe key; update/resolve on transition |
| Dashboard/list scope | Refactor to shared predicates | Outcome view builder from the outcome service; no duplicate count filters |
| UI | Extend existing admin components | Current buttons, forms, badges, tables/cards, page shell, focus styles, and copy map |
| Time display | Fix shared formatter | `legal-format.ts` pinned to `Africa/Cairo` for server/client parity |
| Maintenance | Extend existing PM2 process | `payment-maintenance.mjs`; cycle default becomes 60 seconds |
| Deployment | Harden existing script | Same `aapanel-pm2-update.sh`, process names, and production command |

## Connected Impact Map

| Change | Upstream dependencies | Downstream consumers | Principal risks and controls |
|---|---|---|---|
| Outcome fields and version | Migration, Prisma generation | Services, worker, API DTOs, UI | Additive schema; previous app ignores columns; no enum/status removal |
| Primary-booking selector | Appointment relation and indexes | Worker, manual outcome, reopen, list/detail, calendar | Oldest `CONSULTATION` with `caseId = null`; missing primary is skipped and logged safely |
| Outcome transition service | Permission policy, conflict service, audit, notifications | New endpoints and existing review actions | Serializable/bounded transaction, compare-and-swap version, one audit per transition |
| View filters/counts | Outcome predicates and actor scope | Consultation page and dashboard | One predicate builder; counts and records share actor scope and compatible filters |
| Notification transition | Unique consultation notification key | Popover and notification center | Update or resolve existing row; transition calls only; no duplicate or stale review alert |
| Calendar effective state | Primary booking and outcome | Calendar page | Preserve appointment status contract while adding explicit consultation outcome presentation |
| RTL UI actions | API contracts, `ui-copy.ts` | Desktop/mobile admin operators | Existing components, semantic tabs/forms, `aria-live`, focus, touch target, recoverable errors |
| Worker cycle | Prisma helper, DB | PM2 and deployment | Single-flight, batch limits, idempotent CAS, structured no-PII counts, 60-second maximum interval |
| Deploy sequence | Git/build/migration/PM2 | Production app and worker | Backup prerequisite, one-shot reconcile before restart, compare restart counter after >60 seconds |

## Delivery Phases and Dependencies

### Phase 0 — Spec Kit gate (T001–T005)

Activate PLAN-36, complete all feature artifacts and requirements-quality checks, then perform read-only analyze. No product code changes precede a clean gate.

### Phase 1 — Characterization and expected-red controls (T006–T008)

Lock current list/notification/dashboard behavior, permission boundaries, primary-booking semantics, time boundaries, version races, and old runtime copy. Expected-red assertions describe PLAN-36 behavior while existing PLAN-35 assertions remain green.

### Phase 2 — Additive data foundation (T009–T011)

Add the new lifecycle fields/relation/indexes, create a hand-authored additive migration, and define reconciliation/rollback evidence. Run Prisma validation and generation without installing or connecting a local database.

### Phase 3 — Shared lifecycle and contracts (T012–T014)

Implement the canonical outcome service, purpose-built DTOs, primary-booking selector, view predicates, and counts. This phase blocks endpoints, worker, UI, notifications, and dashboard changes.

### Phase 4 — Manual transitions and existing mutation guards (T015–T017)

Add atomic outcome confirmation/correction and missed reopen endpoints. Then guard assign/review/reject/convert with the same lifecycle and synchronize rejection/cancellation consistently.

### Phase 5 — Reconciliation, alerts, and operational consumers (T018–T020)

Extend the existing maintenance process, transition-aware notifications, and dashboard counters. Classification runs once per eligible transition and emits structured counts without PII.

### Phase 6 — Arabic RTL user experience (T021–T025)

Add shareable tabs/counts, effective appointment state, manual result form, missed reopen form, Cairo formatting, and centralized updated copy. Remove obsolete PLAN-17/PLAN-19 runtime references without changing historical planning documents.

### Phase 7 — Deployment and server guidance (T026–T027)

Run reconciliation after migration and before restart, observe worker restart stability for more than one cycle, and document manual npm/Nginx warning remediation without automatic server-config edits.

### Phase 8 — Evidence, documentation, implement, and converge (T028–T030)

Run focused/full/typecheck/lint/build locally without a database. Record DB, browser, staging, and live evidence only when available and authorized. Update durable documentation, complete all tasks, and run converge until no tasks are appended.

## File Conflict Control

1. `.specify/**` and `specs/**` are written first and only by the root task.
2. `prisma/schema.prisma` and the PLAN-36 migration are completed before any generated-client consumer is edited.
3. `consultation-outcome-service.ts`, `consultation-review-service.ts`, notification/dashboard/calendar services, and their tests are one sequential backend ownership lane.
4. `ui-copy.ts` is edited once after API/copy requirements stabilize; all UI consumers follow it sequentially.
5. Consultation list/detail/action/reopen UI is one sequential lane because the pages share DTOs and query-state semantics.
6. Maintenance helper, existing worker, environment example, deploy script, and server guide are one sequential operations lane.
7. Shared test fixtures are never marked `[P]`; `[P]` is reserved only for isolated tests with no shared file or incomplete dependency.
8. No subagents are used for this plan, matching the approved execution constraint.

## Risk Controls

- **Wrong appointment drives outcome**: central selector requires `type=CONSULTATION`, `caseId=null`, oldest `startsAt`; follow-ups are covered by tests.
- **Automatic false success**: worker transition target is limited to `MISSED` or `AWAITING_RESULT`.
- **Lost concurrent update**: every manual body carries `expectedOutcomeVersion`; update predicate checks both ID and version inside the transaction.
- **Worker/manual race**: transition service re-reads in the transaction and applies a conditional update; loser returns/records no transition.
- **Partial appointment mismatch**: consultation, primary appointment, audit, and notification updates share one transaction.
- **Missed history erased**: reopen appends an audit and increments version; it never deletes prior audit or appointment identity.
- **Permission drift**: manual transition helper requires both named permissions server-side and tests each default role.
- **Stale counts**: list, dashboard, and notifications import shared view/scope predicates.
- **Sensitive telemetry**: audit catalog admits only IDs, enum-like reason/status/version/source values; worker logs counts only; notes stay in the consultation row.
- **Migration/rollback data loss**: migration only adds; rollback is application rollback with columns retained; deploy creates and verifies a non-empty `pg_dump` backup before migration.
- **Local DB absence**: Prisma validate/generate plus mock/characterization tests run locally; DB evidence remains pending until a disposable/staging URL is supplied.
- **Hydration mismatch**: all affected formatters use explicit `Africa/Cairo` rather than server/browser defaults.
- **PM2 restart loop**: deploy captures the post-restart counter, waits longer than 60 seconds, and fails if the counter changes or status leaves online.

## Complexity Tracking

No constitution violations or unjustified new subsystems are introduced. A dedicated outcome service and a testable `.mjs` helper are narrow adapters required to keep one lifecycle source of truth across the web process and the existing maintenance process.
