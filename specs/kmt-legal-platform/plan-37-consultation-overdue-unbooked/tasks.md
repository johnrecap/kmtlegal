# Tasks: PLAN-37 Consultation Overdue-Unbooked Recovery

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contract](./contracts/consultation-overdue-unbooked-contract.md), and [quickstart.md](./quickstart.md)

**Tests**: Risk-based tests precede behavior. Local-no-DB, safe browser, staging/database, deployment, and live evidence remain distinct.

**Execution constraint**: Complete sequentially in this Codex task without subagents. `[P]` is intentionally unused because policy, services, worker, copy, UI, tests, and evidence have shared ownership.

## Format and operating rules

- Each task has a unique ID, story label where applicable, exact files, dependencies, and an independently observable checkpoint.
- Root alone updates `.specify/**`, `specs/**`, task check-off, integration evidence, commit, and push.
- No implementation task starts before T005 has zero unresolved CRITICAL/HIGH and zero unaccepted MEDIUM findings.
- No Prisma schema/migration file or local database is used.
- Existing `.playwright-mcp/` and unrelated files are never touched or staged.

## Phase 1 — Spec Kit activation and clean design gate

**Goal**: Create an independent, decision-complete PLAN-37 package without reopening PLAN-36.

**Independent Test**: Active feature points to PLAN-37; every artifact/checklist exists; analyze finds no blocking or accepted-medium gap.

- [x] T001 Activate PLAN-37 by updating `.specify/feature.json` and create `specs/kmt-legal-platform/plan-37-consultation-overdue-unbooked/spec.md` with the approved scope, assumptions, and constitution boundaries.
- [x] T002 Record inspected-system evidence and resolve threshold, current/overdue sets, schedule transaction, legacy reconciliation, alerts, UI, and no-DB decisions in `specs/kmt-legal-platform/plan-37-consultation-overdue-unbooked/research.md`.
- [x] T003 Define the implementation in `plan.md`, `data-model.md`, `contracts/consultation-overdue-unbooked-contract.md`, and `quickstart.md`, explicitly recording no schema/migration change.
- [x] T004 Complete `checklists/requirements.md` and `checklists/delivery.md` with no unresolved question or unchecked requirements-quality item.
- [x] T005 Generate this dependency-ordered task set and record a clean read-only pass in `analyze.md` before any product code changes.

**Checkpoint**: Spec Kit gate is clean; T006 may begin.

## Phase 2 — Characterization and expected-red foundation (US1, US2, US3, US4)

**Goal**: Prove the current broad `PENDING` behavior and protect exact new requirements before implementation.

**Independent Test**: Existing PLAN-36 suites stay green; new assertions fail only for missing PLAN-37 behavior.

- [x] T006 [US1–US4] Add expected-red boundary/current/overdue/June/snapshot, schedule contract/permission/conflict/version, converted/rejected missing-primary, dashboard/notification, copy, and UI contract characterization in `tests/server/consultation-overdue-unbooked-characterization.test.ts`, `tests/server/consultation-outcome-service.test.ts`, `tests/server/consultation-outcome-contract.test.ts`, `tests/server/consultation-outcome-maintenance.test.ts`, `tests/server/admin-consultations.test.ts`, `tests/server/admin-dashboard.test.ts`, and `tests/server/admin-notifications.test.ts`; record the intended failures without changing shared PLAN-36 fixture meaning.

**Checkpoint**: Expected-red evidence exists before policy/service behavior changes.

## Phase 3 — Canonical timing policy and read contract (US1, US4)

**Goal**: Make one fixed-clock policy the source of truth for all eight views, counts, and operational timing.

**Independent Test**: Before/equality/after predicates and June future/no-primary cases are mutually correct under one injected `asOf`.

- [x] T007 [US1] Extend `src/server/admin/consultation-outcome-policy.ts` with the 72-hour constant/helpers, active no-primary statuses, `overdue_unbooked`, time-aware current/overdue predicates, and compatible review-filter rules; update focused policy/service tests with one explicit `asOf`.
- [x] T008 [US4] Extend purpose-built DTO/list/count orchestration in `src/server/admin/consultation-outcome-service.ts`, `src/server/admin/consultation-review-service.ts`, and `src/app/api/admin/consultations/route.ts` to return `asOf`, `operationalTiming`, and `viewCounts.overdue_unbooked`, passing the same snapshot to records/counts without exposing raw fields.

**Checkpoint**: Consultation list contract and all eight counts are internally consistent.

## Phase 4 — Atomic schedule-and-assign flow (US2)

**Goal**: Resolve any active pending no-primary request through one authorized, future, conflict-safe transaction.

**Independent Test**: Happy path writes client/appointment/request/review/audit/notification once; every invalid/forbidden/conflicting/stale/existing-primary case writes nothing.

- [x] T009 [US2] Implement the schedule schema and atomic command in `src/server/admin/consultation-review-service.ts`, reusing PLAN-36 dual-permission guard, client linking, active-lawyer validation, appointment conflict transaction, conditional outcome version, safe audit catalog in `src/server/audit/audit-event-catalog.ts`, and notification synchronization; add focused service/race/permission tests first within the task.
- [x] T010 [US2] Add `POST /api/admin/consultations/[consultationId]/schedule` in `src/app/api/admin/consultations/[consultationId]/schedule/route.ts` using existing auth, validation, error envelope, serialization-state mapping, and purpose-built detail response; extend route contract tests for all stable recovery cases.

**Checkpoint**: Schedule API is atomic, authorized, versioned, and safe for UI consumption.

## Phase 5 — Legacy reconciliation and overdue alerts (US3, US4)

**Goal**: Repair terminal missing-primary rows and generate one actionable overdue alert through the existing worker.

**Independent Test**: Repeated cycles/races produce one eligible transition/audit/alert; scheduling/closure resolves overdue; manual outcome works only for explicit converted legacy records.

- [x] T011 [US3–US4] Extend `scripts/consultation-outcome-maintenance.mjs`, `src/server/admin/consultation-outcome-service.ts`, `src/server/admin/notification-service.ts`, and `src/lib/plan36-runtime-copy.json`: reconcile `CONVERTED + PENDING` no-primary to `AWAITING_RESULT` with `BACKFILL_CONVERTED_WITHOUT_PRIMARY`, reconcile `REJECTED + PENDING` no-primary to `CANCELLED`, permit only that converted marker to receive a manual result without appointment synchronization, upsert/resolve overdue notifications idempotently, tolerate nullable appointment audit metadata, and report privacy-safe counts; complete worker/outcome/notification idempotency and race tests.

**Checkpoint**: Legacy rows and overdue alerts converge without a schema change or duplicate evidence.

## Phase 6 — Dashboard, notifications, and Arabic RTL operations UI (US2, US4)

**Goal**: Make every operational surface expose the same overdue definition and a recoverable scheduling action.

**Independent Test**: Dashboard/list/alert counts agree; authorized operators schedule on desktop/mobile RTL while errors preserve inputs and focus.

- [x] T012 [US4] Add `consultations.overdue_unbooked` to `src/server/admin/dashboard-service.ts`, `src/features/admin/dashboard/admin-command-center.tsx`, and `src/features/admin/notifications/admin-notification-popover.tsx`, using the shared policy, role scope, link, definition, notification label, and fixed operation clock; complete dashboard/notification focused tests.
- [x] T013 [US2–US4] Add all new Arabic text to `src/lib/ui-copy.ts`, rename the list label to “تاريخ إنشاء الطلب”, add eight ordered shareable tabs/counts/definitions and Cairo “متأخر منذ” presentation in `src/app/(app-ar)/admin/consultations/page.tsx`, pass primary/timing/schedule eligibility into `src/app/(app-ar)/admin/consultations/[consultationId]/page.tsx`, and implement/wire `src/features/admin/consultations/consultation-schedule-form.tsx` plus `consultation-action-panel.tsx`, reusing reopen controls/helpers and existing tokens; cover loading/empty/denied/validation/conflict/stale/success/retry, preserved fields, keyboard focus, `aria-live`, 44px targets, mobile overflow, and RTL with no new library.

**Checkpoint**: UI copy and interactions represent the contract on desktop/mobile RTL.

## Phase 7 — Integrated automated and browser verification (US1–US4)

**Goal**: Prove boundary, atomicity, permission, consistency, concurrency, and user recovery before release documentation.

**Independent Test**: Focused/full local checks pass without DB; browser evidence passes on safe fixtures or is explicitly deferred.

- [x] T014 [US1–US3] Complete focused service/contract/permission/race/idempotency tests for exact boundary, June cases, fixed snapshot, schedule happy/failure paths, legacy repairs, manual converted outcome, and no duplicate audit/notification in all affected `tests/server/*.test.ts` files; confirm no test connects a local database.
- [x] T015 [US4] Add `tests/e2e/plan37-consultation-overdue-unbooked.spec.ts` for desktop/mobile RTL tab navigation, creation/overdue labels, scheduling, validation/conflict/stale input recovery, accessibility, overflow, console/network/hydration checks, gated to safe non-production fixtures.
- [x] T016 [US1–US4] Run focused tests, full `npm test`, `npm run typecheck`, `npm run lint`, no-DB `npm run build`, and `npm run security:secrets`; execute Playwright when safe fixtures are available and record PASS/SKIPPED/Deferred separately in `quickstart.md`.

**Checkpoint**: Required local evidence is green and environment-dependent checks are honestly labeled.

## Phase 8 — Durable documentation, release acceptance, and convergence (US1–US4)

**Goal**: Synchronize product/release truth, verify the supported deployment path, and close only after converge adds zero work.

**Independent Test**: Docs match the implemented contract; server acceptance follows backup/no-fixture rules; final converge has no finding/task.

- [x] T017 [US4] Update `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`, `docs/KMT_LEGAL_SPEC_KIT_PLAN_INDEX.md`, `docs/KMT_LEGAL_FEATURE_INVENTORY.md`, `docs/SERVER_COMMANDS.md`, `docs/RELEASE_QA_CHECKLIST.md`, and PLAN-37 quickstart evidence with no-migration/no-local-DB boundaries, one-shot reconciliation, PM2 stability, and any deferred staging/browser/live gates; preserve PLAN-35/PLAN-36 evidence.
- [x] T018 [US1–US4] Run Spec Kit implement completion and converge, append/execute any discovered tasks until a subsequent pass adds none, inspect the diff for secrets/unrelated/Prisma/`.playwright-mcp/` changes, commit and push `origin/main`, then hand off `cd /www/wwwroot/kmtlegal` and `bash deploy/install/aapanel-pm2-update.sh`.

### Converge-appended tasks

- [x] T019 [US1–US4] Align the PLAN-37 contract/data-model source of truth with the implemented API field names, supported appointment modes, response envelope, canonical-oldest current rule, existing Prisma field names, and actual privacy-safe maintenance summary.
- [x] T020 [US2–US4] Revalidate future time when the serializable schedule transaction begins, add a clock-advance regression, add complete repeated-run converted/rejected no-primary transition/audit/notification tests, and guard “متأخر منذ” behind the derived overdue boolean.

## Dependencies and execution order

```text
T001 → T002 → T003 → T004 → T005
T005 → T006 → T007 → T008
T008 → T009 → T010 → T011
T011 → T012 → T013
T013 → T014 → T015 → T016
T016 → T017 → T019 → T020 → T018
```

## Requirement traceability

| Requirement set | Tasks |
|---|---|
| FR-001–FR-009 timing/views/contracts | T006–T008, T013–T016 |
| FR-010–FR-016 schedule/authorization/recovery | T006, T009–T010, T013–T016 |
| FR-017–FR-020 legacy reconciliation | T006, T011, T014–T016 |
| FR-021–FR-025 alerts/dashboard/copy/RTL | T006, T011–T016 |
| FR-026–FR-028 privacy/worker/no-DB release | T011, T014–T018 |
| SC-001–SC-009 | T006–T018 |

## File ownership matrix

| Lane | Order | Files |
|---|---|---|
| Spec Kit | T001–T005, T017–T018 | `.specify/feature.json`, PLAN-37 artifacts, docs/evidence |
| Characterization | T006 | Named PLAN-37/current server tests only |
| Timing/read model | T007–T008 | policy, outcome/review list service, list API |
| Scheduling | T009–T010 | review service, audit catalog, schedule route, contract tests |
| Worker/alerts | T011–T012 | maintenance, outcome/notification/dashboard services, runtime copy, consumers/tests |
| Copy/UI | T013 | `ui-copy.ts`, list/detail/action/schedule UI |
| Integrated QA | T014–T016 | affected server tests and PLAN-37 e2e |
| Release | T017–T018 | durable docs, task evidence, Git |

## Stop conditions

- Stop before T006 for any incomplete checklist or unresolved CRITICAL/HIGH/unaccepted MEDIUM analysis finding.
- Stop schedule work on any partial-write, permission, duplicate-primary, stale-version, conflict-mapping, or PII risk.
- Stop if a Prisma/schema/migration change appears; PLAN-37 must solve the issue without one.
- Do not mark database/browser/live evidence PASS without the named safe environment.
- Do not create production fixtures or expose credentials.
- Do not complete T018 until all required local checks pass and converge adds zero tasks.
