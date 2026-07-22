# Implementation Plan: PLAN-37 Consultation Overdue-Unbooked Recovery

**Branch**: `main` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Approved PLAN-37 feature specification.

## Summary

Replace the broad `PENDING` current queue with one time-aware policy: recent no-primary requests remain current for 72 exact hours, future-booked requests remain current, and older active no-primary requests appear in a derived overdue-unbooked view while staying `PENDING`. Add an atomic initial schedule-and-assign endpoint, repair converted/rejected legacy no-primary rows through the existing maintenance process, and keep list, dashboard, notifications, copy, and RTL UI consistent through one `asOf` and existing PLAN-36 infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js production ranges from `package.json`, ECMAScript modules for maintenance scripts

**Primary Dependencies**: Next.js 15 App Router, React 18, Prisma 7.8, PostgreSQL adapter, Zod 4, Tailwind CSS 3, Vitest 4, Playwright 1.51, existing auth/audit/notification/design primitives

**Storage**: Existing PostgreSQL through the unchanged PLAN-36 Prisma schema; no PLAN-37 migration and no local database

**Testing**: Mocked/unit/contract Vitest locally, typecheck/lint/build/secrets without `DATABASE_URL`, Playwright on safe disposable/staging fixtures, database acceptance on staging/server only after backup

**Target Platform**: Arabic RTL Next.js admin deployed on Linux through aaPanel, Nginx, and PM2

**Project Type**: Single full-stack web application with one existing recurring maintenance process

**Performance Goals**: Preserve paginated query behavior; compute all records/counts from one captured clock; worker handles overdue alerts/legacy transitions within its existing 60-second cycle

**Constraints**: No schema/migration, local DB, production fixtures, automatic success, Paymob, 2FA, Prisma upgrade, analytics/chart/UI library, second worker, or PLAN-36 reopening

**Scale/Scope**: One derived list view, one mutation endpoint, two legacy repairs, three connected operational consumers, consultation list/detail scheduling UI, tests/docs/deploy evidence

## Constitution Check

### Before Phase 0 research

- **Spec Kit gate — PASS**: PLAN-37 is independently specified; user decisions resolve the threshold, recovery action, legacy behavior, permissions, database boundary, and scope.
- **Existing-system gate — PASS**: The plan extends PLAN-36 policy/services, conflict transaction, client upsert, audit, notifications, dashboard, forms, copy, worker, and deploy entry point.
- **Connected-impact gate — PASS**: UI, API/service, data/no-migration, auth, messages, worker, dashboard, notifications, tests, docs, and deployment are mapped.
- **Correctness gate — PASS**: Exact boundary, primary identity, active statuses, one `asOf`, version race handling, transaction effects, and legacy exception are deterministic.
- **Quality gate — PASS**: Expected-red, no-DB local, browser, DB/staging, and live evidence are separate.
- **Conflict-control gate — PASS**: Work is sequential in one Codex task; no `[P]` task or subagent is used.

### After Phase 1 design

- **Spec Kit gate — PASS**: Research, data model, contract, quickstart, both checklists, and tasks contain no unresolved marker.
- **Existing-system gate — PASS**: No duplicate scheduler, time library, notification store, permission system, UI library, or worker is introduced.
- **Connected-impact gate — PASS**: Records/counts/dashboard/notifications share the same policy; schedule effects cover client, appointment, request, audit, and alerts.
- **Correctness gate — PASS**: Derived status has no migration, exact equality belongs to overdue, legacy exception is narrowly keyed, and all writes are atomic/idempotent.
- **Quality gate — PASS**: Boundary, permission, contract, race, legacy, UI, RTL, and release checks are named.
- **Conflict-control gate — PASS**: Exact sequential file lanes and stop conditions are recorded in `tasks.md`.

## Project Structure

### Documentation (this feature)

```text
specs/kmt-legal-platform/plan-37-consultation-overdue-unbooked/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── analyze.md
├── contracts/
│   └── consultation-overdue-unbooked-contract.md
├── checklists/
│   ├── requirements.md
│   └── delivery.md
└── tasks.md
```

### Source code affected

```text
src/
├── app/api/admin/consultations/
│   ├── route.ts
│   └── [consultationId]/schedule/route.ts
├── app/(app-ar)/admin/consultations/
│   ├── page.tsx
│   └── [consultationId]/page.tsx
├── features/admin/consultations/
│   ├── consultation-action-panel.tsx
│   ├── consultation-reopen-form.tsx
│   └── consultation-schedule-form.tsx
├── features/admin/dashboard/admin-command-center.tsx
├── features/admin/notifications/admin-notification-popover.tsx
├── lib/
│   ├── ui-copy.ts
│   └── plan36-runtime-copy.json
└── server/admin/
    ├── consultation-outcome-policy.ts
    ├── consultation-outcome-service.ts
    ├── consultation-review-service.ts
    ├── dashboard-service.ts
    └── notification-service.ts

scripts/
└── consultation-outcome-maintenance.mjs

tests/
├── server/
│   ├── consultation-overdue-unbooked-characterization.test.ts
│   ├── consultation-outcome-service.test.ts
│   ├── consultation-outcome-contract.test.ts
│   ├── consultation-outcome-maintenance.test.ts
│   ├── admin-consultations.test.ts
│   ├── admin-dashboard.test.ts
│   └── admin-notifications.test.ts
└── e2e/plan37-consultation-overdue-unbooked.spec.ts

docs/
├── KMT_LEGAL_IMPLEMENTATION_STATUS.md
├── KMT_LEGAL_SPEC_KIT_PLAN_INDEX.md
├── KMT_LEGAL_FEATURE_INVENTORY.md
├── SERVER_COMMANDS.md
└── RELEASE_QA_CHECKLIST.md
```

**Structure Decision**: Keep the current full-stack repository. Add one narrow schedule route/form and extend canonical PLAN-36 modules. No Prisma files are touched.

## Reuse and extension decisions

| Concern | Decision | Existing source |
|---|---|---|
| 72-hour policy and view counts | Extend canonical policy | `consultation-outcome-policy.ts` |
| Purpose-built list/detail DTO | Extend | `consultation-outcome-service.ts` and review service |
| Client link and workflow mutation | Reuse/extend | `consultation-review-service.ts` |
| Conflict transaction | Reuse | `appointment-conflict-service.ts` |
| Authorization | Reuse composed PLAN-36 permission helper | `consultation.review.any` + `appointment.manage.any` |
| Version and race recovery | Reuse | PLAN-36 outcome/reopen patterns and serialization mapping |
| Audit | Extend catalog/payload | Existing `appendAuditLog` with safe metadata |
| Notifications | Extend | Existing consultation resource upsert/resolution |
| Dashboard | Extend | Existing domain-key and shared-predicate pattern |
| Scheduling form | Reuse/form-factor | Existing reopen fields, controls, Cairo conversion, inline feedback |
| Maintenance | Extend | Existing consultation outcome cycle; no new process |
| Deployment | Reuse | Existing aaPanel/PM2 update script and one-shot reconciliation |

## Connected impact map

| Change | Upstream | Downstream | Risk control |
|---|---|---|---|
| Time-aware predicates | `createdAt`, primary appointment, fixed `asOf` | list, counts, dashboard, alerts | One helper and exact-boundary tests |
| Operational timing DTO | selected request and primary booking | table/cards/detail copy | Purpose-built projection; no raw record serialization |
| Schedule transaction | permissions, client upsert, lawyer validation, conflict service, version | primary appointment, assignment, review, audit, notifications, UI | Serializable/conditional write; no partial mutations |
| Converted/rejected repair | existing workflow/outcome/version | result actions, counts, alerts | Narrow reason marker, CAS/idempotency, nullable appointment audit |
| Overdue alert | derived predicate and recipients | notification center | resource upsert, no transition audit, resolve on eligibility end |
| RTL UI | API/copy/format helpers | desktop/mobile operators | Existing design primitives, preserved input, focus/live/touch states |

## Delivery phases

1. **T001–T005 — Spec Kit gate**: Activate independent package, resolve decisions, complete design/checklists/tasks/analyze. No code before clean analysis.
2. **T006 — Characterization**: Expected-red exact boundary, June display, no-primary, snapshot, legacy, permission, and recovery behavior.
3. **T007–T008 — Canonical read policy**: Add fixed-clock view predicates/counts and DTO contract.
4. **T009–T010 — Atomic schedule flow**: Service and API with permission, version, conflict, audit, notification, and tests.
5. **T011 — Maintenance and alerts**: Legacy repairs plus overdue notification idempotency.
6. **T012–T013 — Operational consumers/UI**: Dashboard/notifications then list/detail/scheduling/copy in RTL.
7. **T014–T016 — Verification**: Service/contract/race and Playwright desktop/mobile evidence.
8. **T017–T018 — Docs/release/converge**: Durable docs, full no-DB checks, staging/live boundaries, converge, commit, push, server handoff.

## File conflict control

1. Root alone owns `.specify/**`, PLAN-37 artifacts, task check-off, integration, and final Git operations.
2. Policy/DTO/tests are completed before schedule consumers.
3. `consultation-review-service.ts` and its route/tests form one sequential ownership lane.
4. Maintenance, notification service, dashboard service, runtime copy, and their tests are sequential because they share predicates/alerts.
5. `ui-copy.ts` is edited once after backend contracts stabilize; list/detail/action/schedule UI follows in one lane.
6. Docs/evidence come after behavior and verification.
7. `[P]` is intentionally unused and no subagents are used.
8. `.playwright-mcp/`, Prisma schema/migrations, real credentials, and unrelated files are never staged.

## Risk controls

- **Incorrect month diagnosis**: label `createdAt` explicitly and test June-created future/no-primary cases.
- **Clock drift**: require one passed `asOf`, not scattered `new Date()` calls.
- **False missed outcome**: overdue remains derived and `PENDING`.
- **Duplicate primary appointment**: no-primary precondition plus serializable transaction and version check.
- **Lost operator input**: form state resets only after success; errors render inline with retry/refresh.
- **Permission drift**: server requires both exact permissions; UI visibility mirrors it.
- **Fake legacy history**: converted exception never creates an appointment and is keyed by a system reason.
- **Duplicate audit/alert**: conditional transition and existing resource dedupe; derived overdue creates no audit.
- **PII leakage**: selected DTO and audit metadata whitelist; structured counts only.
- **Local DB violation**: no Prisma change/generation requirement; all local tests mock data access.

## Complexity Tracking

No constitution violation or new subsystem is introduced. The schedule route/form are narrow adapters required for an explicit operation that does not exist in the current API.
