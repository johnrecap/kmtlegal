# Tasks: PLAN-36 Consultation Outcome Lifecycle

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contract](./contracts/consultation-outcome-contract.md), and [quickstart.md](./quickstart.md)

**Tests**: Risk-based tests are mandatory and precede the behavior they protect. Local-no-DB, DB-backed, browser, and live evidence remain separate.

**Execution constraint**: Complete sequentially in this Codex task without subagents. `[P]` is intentionally unused because the accepted plan gives one owner to shared fixtures, schema, services, copy, UI, and deployment files.

## Format and operating rules

- Every task uses `[TaskID] [Story]` and exact paths.
- Root alone updates `.specify/**`, `specs/**`, task check-off, integration evidence, commit, and push.
- A task is checked only when its acceptance evidence exists.
- No code task may start before T005 passes with no unresolved CRITICAL/HIGH and no unaccepted MEDIUM finding.
- PLAN-35 stays `Local-Verified`; PLAN-36 work never changes its deferred DB/live checkboxes.
- No local database is installed or created. Production data mutation requires separate approval.

## Phase 1: Spec Kit activation and design gate

**Goal**: Establish PLAN-36 as an independently executable and internally consistent feature package.

**Independent Test**: Active feature resolves to PLAN-36; both checklists are complete; prerequisites locate every artifact; analyze reports no blocking finding.

- [x] T001 Activate PLAN-36 without reopening PLAN-35 by updating `.specify/feature.json` and creating `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/spec.md` with constitution and scope checks.
- [x] T002 Resolve lifecycle, primary-booking, concurrency, permissions, worker, notification, rollback, timezone, and deployment decisions in `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/research.md`.
- [x] T003 Define technical implementation, data, API, and validation artifacts in `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/plan.md`, `data-model.md`, `contracts/consultation-outcome-contract.md`, and `quickstart.md`.
- [x] T004 Complete requirements-quality gates in `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/checklists/requirements.md` and `checklists/delivery.md` with no unresolved clarification.
- [x] T005 Generate this dependency-ordered task set and run read-only Spec Kit analyze, recording the clean gate in `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/analyze.md` before product code changes.

**Checkpoint**: Planning gate passes; implementation may begin only after T005 is checked.

## Phase 2: Foundation characterization (US1, US2, US3, US4)

**Goal**: Lock existing PLAN-35 behavior and create expected-red PLAN-36 coverage before schema or service changes.

**Independent Test**: Existing compatibility assertions remain green; new lifecycle assertions fail only because outcome behavior is not implemented yet.

### Tests first

- [x] T006 [US4] Add characterization and expected-red coverage for current consultation list, stale unreviewed scope, dashboard counts, notification dedupe, and obsolete runtime copy in `tests/server/consultation-outcome-characterization.test.ts`, reusing existing fixtures from `tests/server/admin-consultations.test.ts`, `admin-dashboard.test.ts`, and `admin-notifications.test.ts` without modifying shared fixture semantics.
- [x] T007 [US2] Add contract, permission, optimistic-version, and race characterization for outcome/reopen and existing mutation guards in `tests/server/consultation-outcome-contract.test.ts`; cover Secretary, Office Admin, Super Admin, Lawyer, Marketing Staff, worker-versus-manual, and stale-version expectations.
- [x] T008 [US1] Add before/exact/after `endsAt`, AND/OR assignment-review classification, primary-versus-case-follow-up, idempotency, and Cairo formatter characterization in `tests/server/consultation-outcome-service.test.ts` and `tests/server/legal-format.test.ts`.

**Checkpoint**: Expected-red evidence is recorded; existing suites have not regressed.

## Phase 3: Additive data foundation (US1)

**Goal**: Add the canonical outcome state and query support without requiring a local database or destructive rollback.

**Independent Test**: Prisma validate/generate succeeds; migration inspection proves additions only; reconciliation fixtures describe every historical mapping.

- [x] T009 [US1] Add `ConsultationOutcomeStatus`, outcome metadata/version/actor relation, user reverse relation, and outcome/primary-booking indexes to `prisma/schema.prisma` exactly as specified in `data-model.md`; do not upgrade Prisma.
- [x] T010 [US1] Create the hand-authored additive migration in `prisma/migrations/20260722180000_plan_36_consultation_outcomes/migration.sql` with enum, columns, FK, and indexes only; retain all new data on application rollback.
- [x] T011 [US1] Add reconciliation/backfill/rollback characterization for completed, no-show, cancelled, rejected, ended pending, future pending, missing-primary, repeated-run, and previous-client compatibility in `tests/server/consultation-outcome-maintenance.test.ts` and document DB-only validation boundaries in `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle/quickstart.md`.

**Checkpoint**: Generated client is current and the additive schema gate passes without database installation.

## Phase 4: Canonical outcome domain and read contracts (US1, US4)

**Goal**: Establish one reusable source for primary-booking identity, outcome transitions, DTOs, actor scopes, view predicates, and counts.

**Independent Test**: Unit tests produce correct primary booking and outcome classification; list DTO and seven views match the approved contract under role scope.

- [x] T012 [US1] Implement `src/server/admin/consultation-outcome-service.ts` with reason catalogs, primary-booking selector, final appointment mapping, manual permission intersection, transition guards, compare-and-swap version helpers, safe audit metadata, and reconciliation interfaces; reuse `src/server/appointments/appointment-conflict-service.ts` and `src/server/audit/audit-service.ts`.
- [x] T013 [US4] Replace raw consultation list/detail serialization with selected purpose-built DTO builders in `src/server/admin/consultation-outcome-service.ts` and `src/server/admin/consultation-review-service.ts`; include outcome actor/version and canonical primary appointment while excluding list notes, AI payloads, opposing-party data, and raw relations.
- [x] T014 [US4] Extend list query/view filters and `viewCounts` in `src/server/admin/consultation-review-service.ts` and `src/app/api/admin/consultations/route.ts`, deriving all seven view predicates and existing role scope from `consultation-outcome-service.ts`; preserve search/assignment/workflow/review filters and pagination contract.

**Checkpoint**: Shared read model is the only outcome scope used by subsequent consumers.

## Phase 5: Manual result confirmation and correction (US2)

**Goal**: Let authorized operations users record or correct factual results atomically after the primary booking ends.

**Independent Test**: Each final result synchronizes its appointment, version, actor/reason, audit, and notifications; denial/stale/not-ready paths leave zero partial writes.

- [x] T015 [US2] Add `POST /api/admin/consultations/{id}/outcome` through `src/app/api/admin/consultations/[consultationId]/outcome/route.ts`, outcome Zod schemas, and atomic transition functions in `src/server/admin/consultation-outcome-service.ts`; extend `src/server/http/errors.ts`, `src/server/audit/audit-event-catalog.ts`, and focused tests for stable errors, correction reason, transaction audit, and version races.

**Checkpoint**: Manual outcome API passes contract/permission/race tests before UI use.

## Phase 6: Audited missed-request recovery (US3)

**Goal**: Reopen only missed requests through an explicit future reschedule with assignment, conflict protection, and preserved history.

**Independent Test**: A valid reopen returns `PENDING` and updates only the primary booking; every invalid/conflicting/stale request is atomic and recoverable.

- [x] T016 [US3] Add `POST /api/admin/consultations/{id}/reopen` through `src/app/api/admin/consultations/[consultationId]/reopen/route.ts` and `src/server/admin/consultation-outcome-service.ts`; require lawyer, future time, 15–240 minute duration, mode, reason, and expected version; reuse conflict transaction/client and append a separate reopen audit.
- [x] T017 [US3] Guard assign/review/reject/convert transitions in `src/server/admin/consultation-review-service.ts`: require reopen for `MISSED`, reject stale/final incompatible mutations, require both outcome permissions for rejection, and atomically set rejection outcome/primary appointment to cancelled with one safe audit and notification resolution; extend existing route tests without changing route shapes.

**Checkpoint**: Missed history cannot be bypassed or erased through an older action.

## Phase 7: Automated classification and operational alerts (US1, US4)

**Goal**: Reconcile historical rows and classify new ended bookings within 60 seconds using the existing maintenance process and consistent alert semantics.

**Independent Test**: One cycle returns privacy-safe counts, repeat cycles create no transition/audit/alert, and payment maintenance still works.

- [x] T018 [US1] Implement dependency-injected reconciliation/classification in `scripts/consultation-outcome-maintenance.mjs`, call it from `scripts/payment-maintenance.mjs`, set interval default to 60 seconds, retain single-flight/batch/failure behavior, and add mock-based worker idempotency/race/structured-log tests in `tests/server/consultation-outcome-maintenance.test.ts`.
- [x] T019 [US4] Refactor consultation alert synchronization and synthetic review scope in `src/server/admin/notification-service.ts` and `src/features/admin/notifications/admin-notification-popover.tsx`: current review, awaiting result, and missed are mutually consistent; transition upserts/resolves one deduplicated record; no ended request remains as review-required.
- [x] T020 [US4] Add linked, role-scoped `consultations.awaiting_result` and `consultations.missed` counts to `src/server/admin/dashboard-service.ts`, `src/features/admin/dashboard/admin-command-center.tsx`, and associated dashboard tests using the shared outcome predicates and no charts.

**Checkpoint**: List, dashboard, calendar/notification inputs use the same canonical state and role scope.

## Phase 8: Arabic RTL consultation operations UI (US2, US3, US4)

**Goal**: Expose shareable queues and safe result/reopen interactions with current design primitives on desktop and mobile.

**Independent Test**: An authorized Arabic RTL user can navigate, confirm/correct, recover conflicts, and reopen with keyboard/mobile support and localized stable errors.

- [x] T021 [US4] Add seven RTL link tabs, count badges, query preservation/page reset, primary-booking start/end/effective state, desktop table, mobile cards, and explicit loading/empty/error/denied states in `src/app/(app-ar)/admin/consultations/page.tsx`; extend `src/server/admin/calendar-service.ts` and `src/app/(app-ar)/admin/calendar/page.tsx` to present `AWAITING_RESULT`/`MISSED` effectively; update focused tests using existing components/tokens and no new library.
- [x] T022 [US2] Extend `src/app/(app-ar)/admin/consultations/[consultationId]/page.tsx` and `src/features/admin/consultations/consultation-action-panel.tsx` with current outcome/version/actor/reason details plus manual result confirmation/correction forms, destructive confirmation, disabled/loading/success/error/stale refresh behavior, and `aria-live` feedback.
- [x] T023 [US3] Implement the missed reopen experience in `src/features/admin/consultations/consultation-reopen-form.tsx` and wire it from the detail action panel; preserve lawyer/time/duration/mode/location/reason/note input after `APPOINTMENT_CONFLICT`, enforce future-time guidance, 44px touch targets, keyboard focus, and mobile layout.
- [x] T024 [US4] Pin affected `Intl.DateTimeFormat` calls to `Africa/Cairo` in `src/lib/legal-format.ts`, verify notification/calendar/consultation consumers use the shared helper, and complete server/client parity assertions in `tests/server/legal-format.test.ts` to remove hydration mismatch.
- [x] T025 [US4] Add all outcome/reason/tab/dashboard/notification/form/error/accessibility copy to `src/lib/ui-copy.ts`, map stable API codes in `src/server/http/errors.ts`, update affected UI consumers, and remove runtime PLAN-17/PLAN-19 text from `src/app/(app-ar)/admin/cases/page.tsx`, `cases/[caseId]/page.tsx`, and `clients/[clientId]/page.tsx` while leaving planning history intact.

**Checkpoint**: UI reuse, RTL, responsive, accessibility, localization, and recovery requirements are complete before browser QA.

## Phase 9: Deployment stability and server operations (US5)

**Goal**: Reconcile after migration, prove the existing maintenance process survives a full cycle, and document server-wide warnings safely.

**Independent Test**: Shell/static contract tests establish sequence and relative restart-count check; staging deploy remains online beyond 60 seconds.

- [x] T026 [US5] Harden `deploy/install/aapanel-pm2-update.sh` and `deploy/env.production.example`: create and verify a timestamped custom-format `pg_dump` outside the Git checkout before migration, run one-shot maintenance after migration and before restart, keep existing PM2 process identity, set the 60-second interval example, capture post-restart counter, wait beyond one cycle, and fail on unexpected counter/status change without resetting history.
- [x] T027 [US5] Update `docs/SERVER_COMMANDS.md` and `docs/RELEASE_QA_CHECKLIST.md` with PLAN-36 sequence, local/no-DB boundaries, manual npm global `init.module` remediation, and backup + `nginx -t` + reload steps for deprecated Nginx HTTP/2 syntax; deployment automation must not edit either global configuration.

**Checkpoint**: Deployment ordering and operational warnings are explicit and non-destructive.

## Phase 10: QA, documentation, implementation close, and convergence (US1–US5)

**Goal**: Produce honest local evidence, record unavailable environment gates, synchronize durable sources, and close only after a clean converge pass.

**Independent Test**: Required local commands pass, DB/browser/live gates are either evidenced or explicitly SKIPPED/Deferred, docs match behavior, and converge appends zero tasks.

- [x] T028 [US1] Run PLAN-36 focused tests, full `npm test`, `npm run db:validate`, `npm run db:generate`, `npm run typecheck`, `npm run lint`, no-DB `npm run build`, and `npm run security:secrets`; add/execute `tests/e2e/plan36-consultation-outcomes.spec.ts` on desktop/mobile RTL when safe fixtures are available, recording console/hydration evidence in `quickstart.md`.
- [x] T029 [US5] Execute or explicitly label DB/staging/live acceptance from `quickstart.md` without production fixture creation; update `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`, `docs/KMT_LEGAL_SPEC_KIT_PLAN_INDEX.md`, `docs/KMT_LEGAL_FEATURE_INVENTORY.md`, and PLAN-36 evidence while preserving PLAN-35 status; record credential rotation as a post-live operational action without storing the credential.
- [x] T030 [US5] Complete Spec Kit implement check-off, inspect the combined diff for secrets/unrelated files, run Spec Kit converge, append/execute any discovered tasks until a subsequent converge adds none, then commit and push `origin/main` and hand off the aaPanel/PM2 update command.

## Dependencies and execution order

### Hard gates

```text
T001 → T002 → T003 → T004 → T005
T005 → T006 → T007 → T008
T008 → T009 → T010 → T011
T011 → T012 → T013 → T014
T014 → T015 → T016 → T017
T017 → T018 → T019 → T020
T020 → T021 → T022 → T023 → T024 → T025
T025 → T026 → T027 → T028 → T029 → T030
```

### User story dependencies

- **US1 classification**: T008–T012 and T018; foundation for all outcome consumers.
- **US2 manual results**: T007, T012–T015, T022, then QA.
- **US3 missed recovery**: T007, T012, T016–T017, T023, then QA.
- **US4 consistent operations UI**: T006, T013–T014, T019–T025, then QA.
- **US5 safe release**: all implementation tasks, then T026–T030.

### Expected-red discipline

- T006–T008 must exist and demonstrate current missing behavior before T009 onward changes expectations.
- Contract/service assertions for T015–T017 are written before the corresponding endpoint behavior within the same task and observed failing for the intended reason.
- Worker assertions are added before the T018 helper is connected.
- Browser flow assertions are authored before final UI acceptance in T028.

## File ownership and merge-conflict matrix

| Ownership lane | Task order | Files |
|---|---|---|
| Spec Kit | T001–T005, T029–T030 | `.specify/feature.json`, PLAN-36 artifacts |
| Test foundation | T006–T008, T011 | new PLAN-36 server tests; existing fixtures read/reused |
| Prisma | T009–T010 | `prisma/schema.prisma`, PLAN-36 migration |
| Outcome backend | T012–T017 | outcome/review services, API routes, errors, audit catalog |
| Worker/consumers | T018–T020 | maintenance scripts, notifications, dashboard |
| Copy/UI | T021–T025 | `ui-copy.ts`, format helper, consultation/admin pages/features |
| Deployment/docs | T026–T027 | aaPanel script, env example, server/QA docs |
| Integrated evidence | T028–T030 | e2e, status/index/inventory, task check-off, git |

Tasks sharing a lane are sequential. No task touches `.playwright-mcp/`.

## Requirement traceability

| Requirement set | Primary tasks |
|---|---|
| FR-001–FR-008 lifecycle/primary/idempotency | T008–T012, T018 |
| FR-009–FR-014 manual authority/result/version | T007, T012, T015, T022 |
| FR-015–FR-020 reopen/existing mutation consistency | T007, T016–T017, T023 |
| FR-021–FR-027 views/counts/calendar/notifications | T006, T013–T014, T019–T021 |
| FR-028–FR-030 copy/Cairo/RTL/accessibility | T021–T025, T028 |
| FR-031–FR-035 migration/worker/deploy/server guidance | T009–T011, T018, T026–T027, T029 |
| FR-036–FR-038 stale copy/errors/privacy | T006, T015, T018, T025, T028 |
| SC-001–SC-010 | T006–T029 |

## Stop conditions

- Stop before T006 if T005 finds unresolved CRITICAL/HIGH or unaccepted MEDIUM issues.
- Stop before T012 if Prisma validation/generation or additive-migration review fails.
- Stop a mutation task on any unhandled partial-write, permission, stale-version, or PII audit risk.
- Do not claim DB/browser/live PASS without the named environment evidence.
- Do not create production test data or rotate credentials without the applicable separate authorization.
- Do not mark T030 complete if converge appends a task or any required local verification fails.

## Phase 11: Convergence

- [x] T031 Make calendar filter boundaries, date-input values, and appointment day grouping derive from explicit `Africa/Cairo` calendar dates in `src/lib/legal-format.ts`, `src/server/admin/case-operations-service.ts`, `src/app/(app-ar)/admin/calendar/page.tsx`, and `tests/server/legal-format.test.ts` per FR-029 (partial).
- [x] T032 Prevent new outcome/reopen validation failures or unknown categorized reasons from exposing English source text or internal reason codes by extending `src/lib/ui-copy.ts`, the consultation list/detail reason-label helpers, and focused localization characterization per FR-028 and FR-037 (partial).
- [x] T033 Extend `tests/e2e/plan36-consultation-outcomes.spec.ts` so the prepared disposable manual-result flow also covers a stale concurrent submission, refresh recovery, and an audited final-result correction while retaining the no-production-fixtures gate per SC-007 and T028 (partial).

## Phase 12: Convergence

- [x] T034 Map a PostgreSQL serialization race during manual outcome, review, or rejection writes to `CONSULTATION_STATE_CHANGED` instead of `APPOINTMENT_CONFLICT`, while preserving appointment-conflict mapping for scheduling transactions; extend `src/server/appointments/appointment-conflict-service.ts`, the PLAN-36 mutation callers, and focused tests per FR-014, FR-037, and SC-004 (partial).
- [x] T035 Make missed-request reopen always check the primary appointment's client for scheduling conflicts even when `ConsultationRequest.clientId` is null, without exposing the internal appointment client ID in API DTOs; extend focused transaction coverage per FR-017 and SC-005 (partial).
- [x] T036 Complete the documented list DTO by returning the nested `secretaryReview` projection from `src/server/admin/consultation-outcome-service.ts` and asserting the purpose-built contract while preserving the current compatible flat fields per contract §2 and T013 (partial).
- [x] T037 Prevent canonical/unknown consultation service categories and PLAN-36 audit sources from exposing internal slugs or source enums by extending the central copy/format helpers and affected list/detail/audit consumers with focused tests per FR-028 and Constitution V (partial).
- [x] T038 Enforce a maintenance stability window longer than 60 seconds and verify both the Next.js app and maintenance PM2 restart counters remain unchanged after that window in `deploy/install/aapanel-pm2-update.sh`; add static ordering/guard coverage per FR-034, SC-009, and T026 (partial).
