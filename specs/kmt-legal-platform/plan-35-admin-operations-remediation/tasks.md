# Tasks: PLAN-35 Admin Operations Remediation

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md),
[data-model.md](./data-model.md), and [contracts/admin-operations-contract.md](./contracts/admin-operations-contract.md)

**Execution name**: Reference tasks externally as `PLAN-35/T###`. This file is the only detailed
PLAN-35 task source. The platform master task list contains one roll-up pointer only.

**Tests**: Risk-based tests are mandatory and appear before the implementation they protect.
Expected-red characterization evidence is recorded before changing product behavior.

## Format and operating rules

- `[P]` means the task can run in parallel with adjacent `[P]` tasks because exact files and
  unfinished dependencies do not overlap.
- `[US#]` maps the task to the feature user story.
- Every task names exact files and states its connected impact.
- Root alone edits `.specify/**`, `specs/**`, master tasks/status, task check-off, integration
  evidence, and final commit/push.
- A task touching a shared contract, policy, seed, migration, message map, token, route registry,
  test fixture, or snapshot is sequential even if its immediate product file differs.
- Do not implement any task until the specification and delivery checklists are complete and Spec
  Kit analyze has no unresolved `CRITICAL`/`HIGH` or unaccepted `MEDIUM` finding.

## Phase 1: Foundation characterization and contract controls

**Goal**: Freeze current defects and build the shared permission/contract foundations that block
all user stories.

### Tests first

- [x] T001 [P] Add deterministic Lawyer, Secretary, Office Admin, Marketing Staff, and exact Super Admin principals plus cross-assignment builders in `tests/fixtures/plan35-role-fixtures.ts`; impact: every role/scope test uses one nonproduction source of truth.
- [x] T002 [P] Add a bidirectional affected-route/permission inventory test in `tests/server/plan35-contract-inventory.test.ts`; impact: planned/current method, path, permission, and error-code drift fails before UI integration.
- [x] T003 Update `tests/server/seed-contract.test.ts` with expected-red cases for `case.create.any`, all-staff own notifications, conditional bootstrap marker creation, fresh-database defaults, repeat-seed permission durability, preserved inactive role status, and a deliberately empty editable role; impact: production RBAC/status changes cannot be silently undone and fresh installs cannot lose defaults.
- [x] T004 Update `tests/server/auth-core.test.ts` with an expected-red database-principal case proving zero persisted permissions must remain zero; impact: role-governance removal becomes enforceable in subsequent requests.
- [x] T005 Add route-policy characterization for the fifteen implemented route IDs using T001 in `tests/server/admin-route-policy.test.ts`, plus a contract-only final nineteen-route/five-role fixture whose `contacts.list`, `notifications.list`, `cases.create`, and `roles.list` rows are explicitly `planned` and asserted absent from the executable registry; impact: Foundation can pass without advertising nonexistent consumers while T091 reuses one fixture for the final executable matrix.
- [x] T006 [P] Add stable Arabic message/error-code cases for appointment conflict, case-reference collision recovery, and read-only settings in `tests/server/plan35-error-copy.test.ts`; impact: clients never depend on raw English exceptions or a generic ambiguous conflict.

### Foundation implementation

- [x] T007 Add `case.create.any` and default own-notification grants to `src/server/auth/policy-data.json` after T003 is red; impact: Secretary/Office Admin can create cases and all staff can read only their own generic notifications.
- [x] T008 Add the idempotent data-only permission/grant migration and conditional existing-assignment bootstrap marker in `prisma/migrations/20260722120000_plan_35_admin_operations/migration.sql` after T007; impact: existing production databases receive PLAN-35 keys while a fresh pre-seed database is not falsely marked initialized.
- [x] T009 Change access-control bootstrap in `prisma/seed.mjs` so an unmarked fresh database gets current active defaults and a marker, while marked repeat seeds upsert the catalog without restoring removed assignments or reactivating inactive roles; impact: both first install and runtime-owned post-governance state remain correct.
- [x] T010 Remove the empty-array policy fallback for database principals in `src/server/auth/session-store.ts`; impact: authorization uses persisted `RolePermission` rows exactly, including zero rows.
- [x] T011 Create the typed canonical route registry and capability evaluator with any/all permission plus optional exact-role constraints in `src/lib/admin-route-policy.ts`, initially registering only the fifteen implemented destination IDs while keeping the four planned IDs in the T005 contract fixture until T066/T079/T090; impact: navigation, quick actions, exceptional governance routes, page guards, and contract tests share stable predicates without exposing nonexistent consumers.
- [x] T012 Extend `src/server/http/errors.ts` with planned stable `APPOINTMENT_CONFLICT`, `CASE_REFERENCE_CONFLICT`, and `SETTING_READ_ONLY` codes and normalize the affected unauthenticated outcome; impact: route consumers can map recovery behavior without parsing messages.
- [x] T013 Add typed PLAN-35 Arabic labels, metric definitions, state/recovery text, and error mappings including case-reference collision retry in `src/lib/ui-copy.ts`; impact: all later UI lanes reuse semantic copy and avoid hardcoded permission keys/raw errors.
- [x] T014 Add/redact required PLAN-35 mutation actions in `src/server/audit/audit-event-catalog.ts`; impact: case, role, contact, and appointment work shares audited semantic action names without sensitive payloads.
- [x] T015 Complete the parser/assertions in `tests/server/plan35-contract-inventory.test.ts` so it compares affected route handlers, `src/lib/admin-route-policy.ts`, `src/server/auth/policy-data.json`, and `specs/kmt-legal-platform/plan-35-admin-operations-remediation/contracts/admin-operations-contract.md`; impact: contract validation is bidirectional rather than a hand-maintained whitelist.
- [ ] T016 [DEFERRED-DB] Before any `DB-Verified`, story-checkpoint, release, or production-complete claim, use disposable PostgreSQL to run `npm run db:migrate` and `npm run db:seed` twice and prove fresh defaults, removed/empty permission durability, and inactive-role preservation, recording the command/result matrix in `test-results/plan35/g35-4-foundation.json`; local story implementation may continue after G35-4L without checking off this task, but production PostgreSQL must never be used for this evidence; impact: missing infrastructure stays visible without fabricating or risking permission/data proof.

### Foundation UI contract and authenticated test personas

- [x] T017 [P] [US7] Add expected-red contracts for unique field IDs, table captions/column scope, named filters/search, alert/status, semantic colors, and reduced-motion-safe loading in `tests/ui/admin-accessibility.test.tsx`; impact: shared UI signatures are fixed before any new PLAN-35 screen is built.
- [x] T018 [P] Create disposable Lawyer, Secretary, Office Admin, Marketing Staff, and exact Super Admin database personas, cross-assignment records, login/storage-state helpers, and deterministic cleanup in `tests/fixtures/plan35-db-fixtures.ts` and `tests/e2e/plan35-auth-state.ts`; impact: authenticated browser/DB acceptance uses isolated fake data and never real client records.
- [x] T019 [US7] Add expected-red duplicate-ID, keyboard, native-dialog focus/inert/scroll behavior, RTL logical direction, 44px target, named-region, 1023/1024 breakpoint, and overflow assertions to `tests/e2e/plan35-admin-operations.spec.ts` using T018; impact: responsive accessibility is executable before shell or feature UI changes.
- [x] T020 [US7] Add explicit/id-prefix control, help, and error relationships plus token-backed states in `src/components/ui/field.tsx`; impact: repeated forms keep stable field names without duplicate DOM IDs or ad-hoc error colors.
- [x] T021 [US7] Add accessible caption/name and `scope="col"` support in `src/components/ui/data-table.tsx`; impact: every later operational table has one screen-reader contract.
- [x] T022 [US7] Require descriptive region/search labels in `src/components/ui/filter-bar.tsx` and `src/components/ui/search-input.tsx`; impact: repeated search landmarks are distinguishable before new inboxes and command-center search are implemented.
- [x] T023 [US7] Make `src/lib/design-system/tokens.ts` the semantic color/state source, project it through `tailwind.config.ts` and `src/app/globals.css`, add `src/components/ui/inline-feedback.tsx` and `src/components/ui/skeleton.tsx`, align `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/state.tsx`, and `src/components/ui/toast.tsx`, export through `src/components/ui/index.ts`, then run T017 plus typecheck and record `test-results/plan35/g35-4-ui.json`; impact: later screens start on one verified accessible feedback/loading system without touching Stitch or adding a library.

**Checkpoint G35-4L (local implementation)**: Catalog, route metadata, error/copy tokens, UI
primitives, authenticated test personas, audit names, and contract inventory are locally stable.
T001–T015 and T017–T023 must pass. T019 remains the deliberately recorded expected-red
shell/responsive characterization until T046–T049 and becomes green at T112.

**Checkpoint G35-4D (database acceptance)**: T016 remains open until disposable PostgreSQL exists.
Its absence does not block accepted local code work under FR-035, but it blocks DB verification,
story acceptance, release, and any production-complete claim. Production data is never a substitute.

---

## Phase 2: User Story 1 — Trusted scopes and conflict-safe scheduling (P1)

**Goal**: Dashboard, task board, and calendar report the same authorized work and overlapping
same-lawyer appointments cannot both commit.

**Independent test**: Cross-assignment fixtures produce equal IDs/counts on dashboard and
destination services; exact-boundary appointments pass; concurrent overlap creates one success and
one stable 409 with no partial change.

### Tests first

- [x] T024 [P] [US1] Add expected-red canonical-scope, DTO-minimization, and cross-surface parity cases in `tests/server/admin-dashboard.test.ts`; impact: dashboard drift and record over-serialization become regression failures.
- [x] T025 [P] [US1] Add expected-red half-open interval, active-status, different-lawyer, self-exclusion, rollback, database-only bounded-retry, and external-side-effect single-attempt modes in `tests/server/appointment-conflict-service.test.ts`; impact: the shared conflict primitive has a complete boundary and safe retry contract.
- [x] T026 [US1] Extend `tests/server/admin-cases.test.ts` with expected-red calendar create/reschedule permission, public-reservation cross-order, stale-pre-read orchestration for concurrent same-row reschedule, transaction-local mutable-state/permission recheck, transactional-audit failure rollback, and conflict cases; impact: admin writers cannot bypass the helper, overwrite a concurrent update from stale state, or commit without audit.
- [x] T027 [US1] Extend `tests/server/consultation-contract.test.ts` and `tests/server/analytics-observability.test.ts` with expected-red public booking, paid-booking `P2034` exactly-one-hosted-checkout-call, exactly-one `payment.checkout_reconciliation_required` safe-log event with the contract allowlist/redaction assertions, public/admin cross-order, stale-pre-read linked-assignment recheck/single-attempt conflict/audit rollback, and conversion retry that rereads mutable consultation/assignee state inside every attempt; impact: shared extraction cannot automatically duplicate provider calls, leak reconciliation data, hide orphan risk, overwrite assignments, or convert stale state.
- [ ] T028 [P] [US1] Add concurrent same-lawyer/different-lawyer, public/admin ordering, same-row reschedule, and assignment database scenarios plus bounded `EXPLAIN`/contention evidence to `tests/e2e/plan35-db-backed.spec.ts` and `test-results/plan35/appointment-query-plan.json`; impact: serializable correctness and current-index feasibility are proven against PostgreSQL, with schema re-planning required if the query plan/load gate is unacceptable.

### Implementation

- [x] T029 [US1] Export and reuse one task visibility builder from `src/server/admin/task-document-service.ts`; impact: direct assignee and case-assigned lawyer visibility become identical for task list and dashboard.
- [x] T030 [US1] Export one case/appointment visibility builder from `src/server/admin/case-operations-service.ts` without changing writes yet; impact: calendar/list/dashboard can consume the same object-scope predicate before conflict edits begin.
- [x] T031 [P] [US1] Export reusable consultation visibility predicates from `src/server/admin/consultation-review-service.ts`; impact: dashboard consultation queues match their destination scope.
- [x] T032 [P] [US1] Export reusable client scope selection from `src/server/admin/client-crm-service.ts`; impact: dashboard search/metrics cannot see clients outside the destination contract.
- [x] T033 [US1] Create the half-open overlap predicate, active statuses, symmetric active-unassigned-public reservation guard, office/lawyer scopes, self-exclusion, and serializable wrapper with explicit `database-create-bounded-retry` versus `existing-update-or-external-side-effect-single-attempt` modes in `src/server/appointments/appointment-conflict-service.ts`; impact: all appointment writers receive one atomic mechanism without order gaps, lost updates, or blind callback replay.
- [x] T034 [US1] Replace the local public booking conflict transaction in `src/server/consultations/consultation-assistant-service.ts` with T033 while preserving office-wide slot and post-commit best-effort audit behavior, forcing paid hosted checkout to single-attempt mode, and calling existing `src/server/observability/safe-log.ts` exactly once with `payment.checkout_reconciliation_required` plus only the contract metadata allowlist if provider success precedes transaction failure; impact: public behavior stays compatible, automatic retry cannot create multiple provider sessions, sensitive checkout data stays redacted, and the accepted orphan residual is observable rather than hidden.
- [x] T035 [US1] Route linked-appointment lawyer assignment/reassignment and consultation-conversion creation through T033 in `src/server/admin/consultation-review-service.ts` after T031/T034, moving consultation/status/assignee/active-lawyer/object-scope and previous-audit-value reads inside each callback/attempt and writing audit there; impact: neither stale reassignment nor a conversion retry can create hidden overlap, overwrite newer state, or produce a partial/wrong audit.
- [x] T036 [US1] Move admin calendar create/reschedule in `src/server/admin/case-operations-service.ts` onto T033 after T030/T035, rechecking case, target appointment, permission/object scope, status, lawyer, and previous-audit values inside the callback and persisting audit there; impact: stale pre-reads cannot authorize/overwrite a newer row, same-lawyer conflicts reject atomically, and successful writes are never unaudited.
- [x] T037 [US1] Align `src/app/api/admin/calendar/route.ts` and `src/app/api/admin/calendar/[appointmentId]/reschedule/route.ts` with the stable conflict response and no-store envelope; impact: UI receives one recoverable 409 contract.
- [x] T038 [US1] Refactor `src/server/admin/dashboard-service.ts` and verify `src/app/api/admin/dashboard/route.ts` consume T029–T032 with explicit `select` fields; impact: counts/IDs match destination modules and private unused fields leave no server boundary.
- [ ] T039 [US1] Run T024–T028, `tests/server/admin-task-documents.test.ts` if present or the repository task-document suite, `tests/server/analytics-observability.test.ts`, the consultation suite, and the DB concurrency scenario, recording the redacted reconciliation-event assertion in `test-results/plan35/us1-operations.json`; impact: US1 is independently acceptable before shell or feature UI work.

**Checkpoint US1**: Scope parity and conflict safety are green locally and against PostgreSQL.
Without disposable PostgreSQL, T028 and the DB-backed portion of T039 remain open; T024–T027 and
T029–T038 may be implemented and locally verified, but US1 cannot be checkpoint-accepted.

---

## Phase 3: User Story 2 — Permission-aware admin workspace (P1)

**Goal**: Every staff role discovers only usable destinations while direct page/API guards remain
authoritative and denied states preserve recovery context.

**Independent test**: Five-role matrix compares visible desktop/mobile links with direct page/API
outcomes and asserts natural Arabic recovery without technical permission keys.

### Tests first

- [ ] T040 [P] [US2] Expand `tests/server/admin-route-policy.test.ts` for the fifteen already implemented destination IDs (the final nineteen minus `contacts.list`, `notifications.list`, `cases.create`, and `roles.list`) with every existing list/detail/content child route, exact-versus-longest-prefix precedence, inherited capability, active matcher, and direct-guard equivalence case; impact: the executable baseline cannot become unguarded while planned destinations remain undiscoverable until their page/API lane is complete.
- [ ] T041 [US2] Add expected-red principal-filtering, persisted admin access context, boundary navigation, current-route, native-dialog focus trap/inert background/body scroll lock/Escape/focus return/close-on-navigation assertions to `tests/ui/product-components.test.tsx`; impact: shell and mobile behavior are fixed before component edits.
- [ ] T042 [P] [US2] Add the fifteen-implemented-route-by-five-role baseline navigation/direct-page/direct-API allow/deny matrix to `tests/e2e/plan35-admin-operations.spec.ts`, using the contract's exact representative API probes and asserting the four planned route IDs remain absent from registry/navigation until their owning lanes activate them; impact: every currently executable discovery cell is checked against actual server behavior without accepting 404/405 as a pass for a future route.

### Implementation

- [ ] T043 [US2] Complete labels, icons, groups, exact/static/longest-prefix matching, child-route inheritance, and required capabilities for the fifteen implemented destinations in `src/lib/admin-route-policy.ts`; keep `contacts.list`, `notifications.list`, `cases.create`, and `roles.list` contract-only and undiscoverable until T066/T079/T090; impact: one deterministic registry replaces the unconditional navigation array without exposing links whose page/API does not exist.
- [ ] T044 [US2] Add registry-aware page authorization helpers and a reusable denied result in `src/server/auth/page-guards.tsx`; impact: direct forbidden pages return consistent shell-safe recovery instead of a raw exception/500.
- [ ] T045 [US2] Derive `adminNavItems`, active state, and section labels from T043 in `src/app/(app-ar)/admin/admin-navigation.ts`; impact: desktop/mobile navigation and breadcrumbs cannot drift from route policy.
- [ ] T046 [US2] Create the keyboard-operable RTL mobile menu with native `<dialog>` in `src/components/layout/dashboard-mobile-nav.tsx` and export it from `src/components/layout/index.ts`; impact: authorized destinations remain discoverable below `lg` with modal focus, inert background, scroll lock, Escape/focus restoration, close-on-navigation, and no new library.
- [ ] T047 [US2] Filter navigation/actions with the existing principal and integrate T046 in `src/components/layout/dashboard-shell.tsx`; impact: role-inappropriate links disappear while desktop grouping remains compatible.
- [ ] T048 [US2] Create a safe filtered-nav/user-label provider in `src/features/admin/shell/admin-access-context.tsx`, establish it from authenticated staff in `src/app/(app-ar)/admin/layout.tsx`, and create the shell-preserving state renderer in `src/components/layout/admin-shell-state.tsx`; impact: client error boundaries retain authorized navigation without serializing raw permission keys or refactoring every page shell.
- [ ] T049 [US2] Add context-consuming admin-scoped `src/app/(app-ar)/admin/loading.tsx`, `src/app/(app-ar)/admin/error.tsx`, and `src/app/(app-ar)/admin/not-found.tsx` using T048; impact: authorized navigation survives route-level states without exposing exception digests.
- [ ] T050 [US2] Apply T044 to `src/app/(app-ar)/admin/consultation-availability/page.tsx`, `src/app/(app-ar)/admin/consultations/page.tsx`, `src/app/(app-ar)/admin/consultations/[consultationId]/page.tsx`, `src/app/(app-ar)/admin/clients/page.tsx`, `src/app/(app-ar)/admin/clients/[clientId]/page.tsx`, `src/app/(app-ar)/admin/messages/page.tsx`, `src/app/(app-ar)/admin/messages/[threadId]/page.tsx`, `src/app/(app-ar)/admin/cases/page.tsx`, `src/app/(app-ar)/admin/cases/[caseId]/page.tsx`, `src/app/(app-ar)/admin/calendar/page.tsx`, `src/app/(app-ar)/admin/tasks/page.tsx`, and `src/app/(app-ar)/admin/documents/page.tsx`; impact: registry inheritance and page authorization agree on list/detail operational workstreams.
- [ ] T051 [US2] Apply T044 to `src/app/(app-ar)/admin/finance/page.tsx`, `src/app/(app-ar)/admin/reports/page.tsx`, `src/app/(app-ar)/admin/content/page.tsx`, `src/app/(app-ar)/admin/content/articles/page.tsx`, `src/app/(app-ar)/admin/content/case-studies/page.tsx`, `src/app/(app-ar)/admin/content/social/page.tsx`, `src/app/(app-ar)/admin/users/page.tsx`, `src/app/(app-ar)/admin/users/[userId]/page.tsx`, `src/app/(app-ar)/admin/settings/page.tsx`, and `src/app/(app-ar)/admin/audit-log/page.tsx`; impact: finance/governance/content child pages receive the same denial contract without changing their domain services.
- [ ] T052 [US2] Run T040–T042 through `tests/server/admin-route-policy.test.ts`, `tests/ui/product-components.test.tsx`, and `tests/e2e/plan35-admin-operations.spec.ts` at `1440x900`, `1023x768`, `1024x768`, and `390x844`, recording the fifteen-route baseline in `test-results/plan35/us2-baseline-route-matrix.json` and proving all four planned entries are still absent; impact: the existing workspace shell is independently acceptable before later lanes add discoverable destinations.

**Checkpoint US2**: Five default staff roles have correct discovery and direct access behavior.

---

## Phase 4: User Story 3 — Contact and notification work queues (P1)

**Goal**: Authorized staff can process stored contact messages and see/read generic notifications
alongside consultation review work without leakage or double counting.

**Independent test**: Public contact submit becomes an actionable inbox item; generic and linked
consultation notifications produce the documented count; reader/manager/owner/other-user rules hold.

### Tests first

- [ ] T053 [P] [US3] Extend `tests/server/admin-contact-messages.test.ts` with expected-red transition, concurrent identical/different-target races, same-state idempotency, exact one-audit behavior, audit-failure rollback, minimized DTO, reader/manager, and denied cases; impact: inbox service behavior is atomic and fixed before UI wiring.
- [ ] T054 [P] [US3] Add expected-red complete-set counts, a duplicate beyond the first source fetch, cross-page cursor stability, malicious/external/script `actionUrl` fallback, post-creation permission removal and dynamic-resource reassignment fallback, owner-only read, consultation-review separation, and recipient-permission cases in `tests/server/admin-notifications.test.ts`; impact: notification counts, links, and complete-queue semantics cannot drift or expose newly forbidden/out-of-scope paths.
- [ ] T055 [P] [US3] Add contact inbox responsive/keyboard/state component cases in `tests/ui/admin-contact-message-inbox.test.tsx`; impact: long Arabic/English content and action feedback are covered before the page exists.
- [ ] T056 [P] [US3] Add notification bell/center count, safe-link, cursor load-more/exhaustion, mark-read, retry, and accessible announcement cases in `tests/ui/admin-notification-center.test.tsx`; impact: generic notifications cannot again be returned but not rendered or become inaccessible after the preview.
- [ ] T057 [US3] Add contact-submit-to-triage with at-most-two shell navigation actions and complete generic-notification pagination browser scenarios to `tests/e2e/plan35-admin-operations.spec.ts`; impact: SC-004 and both persisted queues are proven end to end.

### Contact lane

- [ ] T058 [US3] Enforce the state machine with conditional observed-status claims, concurrent same-target idempotency, different-target conflict handling, bounded list projection, and direct same-transaction audit/rollback in `src/server/admin/contact-message-service.ts`; impact: invalid reopen, duplicate audit, and unaudited transition behavior are removed without changing stored states.
- [ ] T059 [US3] Align `src/app/api/admin/contact-messages/route.ts` and `src/app/api/admin/contact-messages/[messageId]/route.ts` with T058 and the common contract; impact: list and mutation remain the only contact admin API path.
- [ ] T060 [US3] Build the responsive search/filter/pagination/detail/actions client in `src/features/admin/contact-messages/contact-message-inbox.tsx`; impact: existing contact data becomes operational with reader-versus-manager controls.
- [ ] T061 [US3] Add the authorized server page at `src/app/(app-ar)/admin/contact-messages/page.tsx`; impact: contact APIs gain a protected admin consumer without changing the public contact flow.

### Notification lane

- [ ] T062 [US3] Implement the discriminated projection, complete-set attention formula before limits, cross-source dedupe, internal-admin href allowlist plus current-principal route capability and canonical dynamic-resource object-scope fallback, opaque stable cursor pagination, strict `notification.read.self`, and safe selects in `src/server/admin/notification-service.ts`; impact: generic and consultation work share one truthful, complete view without forbidden/out-of-scope resource links or merged state machines.
- [ ] T063 [US3] Align preview `limit`, center `pageSize/cursor/nextCursor`, mutual-exclusion validation, and owner-only read in `src/app/api/admin/notifications/route.ts` and `src/app/api/admin/notifications/[notificationId]/read/route.ts` with T062; impact: cross-user access stays 404, repeated read is idempotent, and all stored visible items remain reachable.
- [ ] T064 [US3] Refactor `src/features/admin/notifications/admin-notification-bell.tsx` and create `src/features/admin/notifications/admin-notification-popover.tsx`; impact: the global bell renders generic items, review items, failures, and live count updates.
- [ ] T065 [US3] Add the cursor-paginated full protected center at `src/app/(app-ar)/admin/notifications/page.tsx`; impact: staff can reach the complete authorized queue beyond the compact recent bell without gaps or repeats.

### Integration

- [ ] T066 [US3] After T061/T065 page and T059/T063 API acceptance, add contact and notification route entries in `src/lib/admin-route-policy.ts`, regenerate consumers through `src/app/(app-ar)/admin/admin-navigation.ts`, and extend `tests/server/admin-route-policy.test.ts`; impact: only authorized staff see the two destinations and neither link activates before its consumer exists.
- [ ] T067 [US3] Add permission-scoped new-contact and notification-attention loaders to `src/server/admin/dashboard-service.ts`; impact: the command center can later reuse real queue counts without exposing data to Marketing/Lawyer roles lacking contact scope.
- [ ] T068 [US3] Run T053–T057 plus DB state/idempotency and mobile queue journeys in `tests/e2e/plan35-admin-operations.spec.ts` and `tests/e2e/plan35-db-backed.spec.ts`; impact: US3 is independently acceptable before command-center composition.

**Checkpoint US3**: Stored inbound work is visible, actionable, scoped, audited, and truthfully counted.

---

## Phase 5: User Story 4 — Manual case create and core edit (P1)

**Goal**: Secretary/Office Admin can create an audited case for an existing client and edit approved
core fields without fabricating a consultation.

**Independent test**: First request creates one case; retry returns it; connected list/detail/client
history update; invalid, stale, duplicate, and unauthorized requests create no partial records.

### Tests first

- [ ] T069 [P] [US4] Add expected-red permission, client/lawyer eligibility, canonical request-hash replay through audit `resourceId/actorId/requestHash` after redaction, same-token/different-body conflict, different-token nonduplicate behavior, case-ID collision, `CASE_REFERENCE_CONFLICT`, create/edit audit-failure rollback, redacted edit before/after audit, approved-field, assigned-only transfer denial, and stale-edit cases in `tests/server/admin-manual-cases.test.ts`; impact: neither create nor core edit can commit without correct audit, redacted replay identity, or scope safety.
- [ ] T070 [US4] Extend `tests/server/route-manifest-contract.test.ts` for planned `POST /api/admin/cases` and `PATCH /api/admin/cases/{caseId}` methods and `case.create.any`; impact: server routing cannot lag the feature contract.
- [ ] T071 [P] [US4] Add unique-ID, canonical `PartyType` options, Arabic validation, pending/success/conflict, case-reference-collision value preservation/new-token retry, and keyboard form cases in `tests/ui/admin-manual-case-form.test.tsx`; impact: duplicate submissions, invalid enums, inaccessible labels, and dead-end collision recovery are blocked at component level.
- [ ] T072 [US4] Add create/replay/edit/list/detail/client-history, assigned-transfer denial, denied-role, and timed under-three-minute happy-path DB/browser scenarios to `tests/e2e/plan35-db-backed.spec.ts`; impact: atomic persistence, SC-006 completion time, and connected consumers are verified together.

### Implementation

- [ ] T073 [US4] Extract the existing legal case reference algorithm into `src/server/admin/legal-case-reference.ts` and update `src/server/admin/consultation-review-service.ts` to consume it; impact: consultation conversion and manual creation cannot generate divergent file numbers.
- [ ] T074 [US4] Create `src/server/admin/manual-case-service.ts` with strict existing-enum schemas, canonical normalized-payload SHA-256, `requestToken`-as-case-ID atomic replay using audit `resourceId/actorId/requestHash`, redaction-safe collision handling, stable case-reference conflict, active references, direct transactional case/party/audit creation, and transactional optimistic core edit with redacted before/after audit plus `case.update.any`-only reassignment; impact: one exact service owns all new case write invariants without unaudited edits, masked token metadata, privilege-expanding transfer, or fuzzy duplicate pre-check.
- [ ] T075 [US4] Add POST handling to `src/app/api/admin/cases/route.ts` using T074 and return 201/200 replay outcomes; impact: manual creation becomes an explicit `case.create.any` contract while GET remains compatible.
- [ ] T076 [US4] Add PATCH handling to `src/app/api/admin/cases/[caseId]/route.ts` using T074's scoped transactional edit/audit contract while preserving existing GET; impact: core edit remains separate from status transition and cannot expose partial mutation success.
- [ ] T077 [US4] Build the client-search, lawyer-selection, canonical optional-party choices, idempotent-submit, case-reference-collision value-preserving/new-token retry, and core-edit UI in `src/features/admin/cases/manual-case-form.tsx`; impact: authorized staff can complete the flow with reusable fields and safe recovery.
- [ ] T078 [US4] Add the guarded create page at `src/app/(app-ar)/admin/cases/new/page.tsx`; impact: the route registry's planned create action becomes real only after service/API authorization exists.
- [ ] T079 [US4] After T075/T078, add authorized create/edit actions and post-mutation refresh behavior in `src/app/(app-ar)/admin/cases/page.tsx` and `src/app/(app-ar)/admin/cases/[caseId]/page.tsx`, then activate the exact `cases.create` override in `src/lib/admin-route-policy.ts`, `src/app/(app-ar)/admin/admin-navigation.ts`, and `tests/server/admin-route-policy.test.ts`; impact: existing list/detail remain the source of case truth and `/admin/cases/new` cannot appear before its API/page is executable.
- [ ] T080 [US4] Verify or minimally update `src/server/admin/client-crm-service.ts` and `src/app/(app-ar)/admin/clients/[clientId]/page.tsx` so manually created cases appear through existing client relations; impact: no parallel client-history store is introduced.
- [ ] T081 [US4] Run T069–T072 plus denied/replay/rollback checks in `tests/server/admin-manual-cases.test.ts` and `tests/e2e/plan35-db-backed.spec.ts`; impact: US4 is independently acceptable before role-governance changes.

**Checkpoint US4**: Manual case create/edit is atomic, scoped, audited, localized, and connected.

---

## Phase 6: User Story 5 — Safe role-permission governance (P1)

**Goal**: Exact Super Admin can inspect and atomically replace editable staff-role permissions while
admin-user DTOs, protected targets, login/session validity, the final governance path, and
intentionally empty roles remain safe.

**Independent test**: Successful update affects a fresh request and survives a second seed; no
admin-user response contains credential secrets; inactive/deleted/inactive-role login/session use is
rejected; role/status changes revoke sessions; protected/escalation/final-Super/stale/concurrent/
invalid/failing-audit attempts leave state unchanged.

### Tests first

- [ ] T082 [US5] Add expected-red exact-actor/protected-or-inactive-role/empty-set/canonical-key/stale-write/atomic-audit cases in `tests/server/admin-role-permissions.test.ts`, credential-secret exclusion plus protected-target/assignment, stale `User.updatedAt`, concurrent role-policy ceiling change, cross-editable-role amplification, and final-Super cases in `tests/server/admin-governance.test.ts`, and inactive/deleted/inactive-role login/session cases in `tests/server/auth-core.test.ts`; impact: permission and user governance cannot rely on UI redaction, stale state, inactive targets, privilege amplification, or self-only safety.
- [ ] T083 [US5] Add repeat-seed, persisted-role, delegated protected-role and cross-editable-role permission-ceiling denial, concurrent role-policy-versus-user assignment, stale user update, inactive-principal login/session rejection, target-session revocation, and two-concurrent-final-Super mutation scenarios to `tests/e2e/plan35-db-backed.spec.ts`; impact: governance durability, serialization, and active-principal safety are proven against PostgreSQL.
- [ ] T084 [P] [US5] Add protected/inactive read-only matrix, grouped labels, dirty-state, stale-conflict, and keyboard cases in `tests/ui/admin-role-permission-form.test.tsx`, plus safe admin-user list/detail DTO consumer cases in `tests/ui/product-components.test.tsx`; impact: the UI cannot imply Super Admin wildcard/inactive roles are editable or depend on removed Prisma-shaped credential-bearing fields.

### Implementation

- [ ] T085 [US5] Implement exact-Super-Admin assertions, canonical grouped catalog DTO, protected/inactive read-only roles, optimistic concurrency, atomic replacement, and audit in `src/server/admin/role-permission-service.ts`; impact: one isolated service owns role governance without mutating runtime role status or overloading storage settings.
- [ ] T086 [US5] Add read and mutation routes at `src/app/api/admin/roles/route.ts` and `src/app/api/admin/roles/[roleId]/permissions/route.ts`; impact: direct callers receive purpose-built protected/stale/atomic behavior before UI integration.
- [ ] T087 [US5] Replace broad admin-user returns with explicit safe selects/DTO mappers and actor-filtered target/role options, require/conditionally claim `User.updatedAt`, and enforce a single-attempt serializable transaction with current actor/target/next-role permission-set rereads, protected-role ceilings, final-active-Super, session revocation, and atomic audit in `src/server/admin/governance-service.ts`; enforce active/nondeleted user and active role at password login/session load in `src/server/auth/auth-service.ts` and `src/server/auth/session-store.ts`; then align `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[userId]/route.ts`, `src/app/(app-ar)/admin/users/page.tsx`, `src/app/(app-ar)/admin/users/[userId]/page.tsx`, and `src/features/admin/governance/governance-forms.tsx` to the named DTO/version fields; impact: credential records never cross the API, concurrent policy/user changes cannot amplify or overwrite privileges, and existing consumers remain type-safe.
- [ ] T088 [US5] Build the grouped protected/editable matrix and optimistic save flow in `src/features/admin/governance/role-permission-form.tsx`; impact: exact Super Admin gets a safe operational editor using existing controls.
- [ ] T089 [US5] Add the guarded roles page at `src/app/(app-ar)/admin/roles/page.tsx`; impact: governance becomes discoverable without exposing it to other staff.
- [ ] T090 [US5] After T086/T089, add the roles entry with exact-active-Super-Admin plus both role/permission management requirements to `src/lib/admin-route-policy.ts`, `src/app/(app-ar)/admin/admin-navigation.ts`, and `tests/server/admin-route-policy.test.ts`; impact: one permission key alone cannot advertise/open role governance and the link cannot precede its API/page.
- [ ] T091 [US5] Run T082–T084 plus double-seed inactive-status preservation, empty-role, secret-DTO, protected/inactive target, login/session, revocation, final-Super, fresh-session, and concurrent update checks in `tests/server/admin-role-permissions.test.ts`, `tests/server/admin-governance.test.ts`, `tests/server/auth-core.test.ts`, and `tests/e2e/plan35-db-backed.spec.ts`; then run the now-complete nineteen-route-by-five-role navigation/direct-page/direct-API matrix from `tests/e2e/plan35-admin-operations.spec.ts` with the contract probes and record `test-results/plan35/us5-full-route-matrix.json`; impact: US5 is independently acceptable and all 95 final route cells are executable before dashboard composition.

**Checkpoint US5**: Editable-role assignments persist; admin-user DTOs expose zero credential
secrets; protected targets, login/session state, affected-session revocation, final Super Admin, and
governance access are safe.

---

## Phase 7: User Story 6 — Role-aware admin command center (P2)

**Goal**: Admin home prioritizes authorized work, names metric timeframes/scopes, links directly to
matching filtered destinations, and keeps unaffected widgets usable during a partial failure.

**Independent test**: Each role sees only useful priority sections/actions; one injected loader
failure affects one section; network response is minimized; every href opens an equivalent scope.

### Tests first

- [ ] T092 [P] [US6] Expand `tests/server/admin-dashboard.test.ts` with the exact seven-key metric inventory/order and token stems, exact five-route quick-action order/primary rule, ready/unavailable unions, `Africa/Cairo` boundaries, timeframe/scope enum-to-copy mappings, fixed section order/tie-breakers, authorized hrefs, purpose-built item/activity unions, maximum-six queues, contact/document sources, and per-loader failures; impact: deterministic command-center semantics are fixed before DTO refactor.
- [ ] T093 [P] [US6] Add role-adaptive hierarchy, unavailable-section retry, semantic metric links, and no-placeholder cases in `tests/ui/admin-command-center.test.tsx`; impact: UI cannot regress to equally weighted disconnected cards.
- [ ] T094 [US6] Add five-role command-center/drill-down/payload/partial-failure scenarios to `tests/e2e/plan35-admin-operations.spec.ts`; impact: server and UI scope equivalence is proven end to end.

### Implementation

- [ ] T095 [US6] Implement the exact `DashboardSnapshotV1` discriminated metric/section/item/activity unions, canonical seven-key metric order/token stems, canonical five-route quick-action order/primary rule, Cairo cutoffs, deterministic section/item ordering, exact filtered hrefs, guarded independent loaders, maximum-six queues, purpose-built selects, and route-registry-resolved actions in `src/server/admin/dashboard-service.ts`; impact: the dashboard becomes deterministic, resilient, and privacy-minimized while reusing Phases 2/4–6 services.
- [ ] T096 [US6] Version and return the T095 snapshot from `src/app/api/admin/dashboard/route.ts` without exposing internal loader errors; impact: browser consumers receive one stable no-store contract.
- [ ] T097 [P] [US6] Create accessible metric links and bounded priority lists in `src/features/admin/dashboard/dashboard-metric-link.tsx` and `src/features/admin/dashboard/dashboard-priority-list.tsx`; impact: KPI interpretation and drill-down become reusable domain components, not new primitives.
- [ ] T098 [US6] Compose headings, attention order, contract-ordered route-registry quick actions with the first permitted action primary, partial states, recent activity, and authorized client search in `src/features/admin/dashboard/admin-command-center.tsx`; impact: role capability changes the hierarchy rather than rendering forbidden placeholders or ad-hoc action links.
- [ ] T099 [US6] Replace the current admin-home card layout with T098 in `src/app/(app-ar)/admin/page.tsx`; impact: `/admin` becomes the operational command center while preserving Arabic shell/brand.
- [ ] T100 [US6] Mark dynamic timestamps/IDs with stable visual-test hooks in `src/features/admin/dashboard/admin-command-center.tsx`; impact: screenshots remain deterministic without hiding functional content.
- [ ] T101 [US6] Run T092–T094 plus exact metric/action inventory, DTO inspection, injected failure, and destination-filter parity in `tests/server/admin-dashboard.test.ts` and `tests/e2e/plan35-admin-operations.spec.ts`, recording the ordered keys in `test-results/plan35/us6-dashboard.json`; impact: US6 is independently acceptable.

### Runtime storage truthfulness (connected requirement FR-023)

- [ ] T102 [P] [US6] Add expected-red valid/writable/invalid root, required/disabled/reachable/unreachable scanner, bounded-ping, environment-versus-database, whole-response exclusion of legacy `storage.policy` plus its value/`updatedAt`/`updatedBy`, secret/path redaction, exact settings wrapper, and read-only mutation cases in `tests/server/storage-contract.test.ts` and `tests/server/admin-governance.test.ts`; impact: settings cannot leak a stored path or claim readiness/runtime change that uploads ignore.
- [ ] T103 [US6] Create the one-shot derivation in `src/server/storage/runtime-diagnostic.ts` and reuse effective policy/root/scanner behavior from `src/server/storage/upload-policy.ts`, `src/server/storage/vps-storage.ts`, and `src/server/storage/malware-scan.ts` including bounded `pingClamAv`; impact: UI reports configured/degraded/unavailable truth without paths, secrets, polling, or duplicate readiness logic.
- [ ] T104 [US6] Return `{ settings, storageRuntimeDiagnostic }` with legacy `storage.policy` excluded from the generic array, reject its writes, and align existing consumers in `src/server/admin/governance-service.ts`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/settings/[key]/route.ts`, and `src/app/(app-ar)/admin/settings/page.tsx`; impact: the contract changes explicitly from a bare setting array while stored paths remain compatible, nonauthoritative, and absent from JSON.
- [ ] T105 [US6] Replace editable storage-policy controls with a read-only diagnostic in `src/features/admin/governance/governance-forms.tsx` and `src/app/(app-ar)/admin/settings/page.tsx`; impact: operators receive truthful remediation guidance instead of a false save success.
- [ ] T106 [US6] Run T102 plus `tests/server/security-hardening.test.ts`, `tests/server/storage-contract.test.ts`, `tests/server/readiness-contract.test.ts`, and scanner timeout/reachability cases, recording sanitized results in `test-results/plan35/storage-diagnostic.json`; impact: diagnostic changes cannot alter private storage/upload enforcement or overstate scanner readiness.

**Checkpoint US6**: Command center and storage diagnostics are actionable, scoped, resilient, and truthful.

---

## Phase 8: User Story 7 — Accessible Arabic RTL UI convergence (P2)

**Goal**: Touched journeys work at mobile/desktop widths with keyboard and screen-reader semantics,
unique form relationships, named data regions, stable Arabic feedback, and no horizontal overflow.

**Independent test**: Complete every PLAN-35 journey at 390px and desktop using keyboard, then
assert IDs, labels, alerts/status, table/search naming, RTL direction, focus, touch targets, and
overflow.

### Call-site migration after Foundation UI contract T017–T023

- [ ] T107 [US7] Fix known repeated task/document form IDs and feedback in `src/features/admin/task-documents/task-document-forms.tsx`; impact: the audited duplicate-ID defect is closed without changing submission field names.
- [ ] T108 [P] [US7] Adopt T020–T023 in `src/features/admin/cases/case-action-forms.tsx`, `src/features/admin/clients/client-crm-forms.tsx`, and `src/features/admin/consultations/consultation-action-panel.tsx`; impact: core operational forms gain consistent labels and persistent feedback.
- [ ] T109 [P] [US7] Adopt T020–T023 in `src/features/admin/consultations/consultation-availability-form.tsx`, `src/features/admin/content/content-forms.tsx`, `src/features/admin/finance/finance-forms.tsx`, and `src/features/admin/governance/governance-forms.tsx`; impact: separate files can migrate in parallel after shared primitives freeze and their domain owners hand off.
- [ ] T110 [US7] Add table/filter/search captions and mobile record alternatives to `src/app/(app-ar)/admin/page.tsx`, `src/app/(app-ar)/admin/calendar/page.tsx`, `src/app/(app-ar)/admin/cases/page.tsx`, `src/app/(app-ar)/admin/clients/page.tsx`, `src/app/(app-ar)/admin/consultations/page.tsx`, `src/app/(app-ar)/admin/content/page.tsx`, `src/app/(app-ar)/admin/documents/page.tsx`, `src/app/(app-ar)/admin/tasks/page.tsx`, `src/app/(app-ar)/admin/users/[userId]/page.tsx`, and `src/app/(app-ar)/product-system/_components/product-system-demo.tsx`; impact: every existing consumer of changed primitive signatures remains usable and type-safe.
- [ ] T111 [US7] Run an `rg` inventory of every `src/**` consumer of each changed shared primitive/token/Tailwind/global contract, adopt T020–T023 in `src/app/(app-ar)/admin/audit-log/page.tsx`, `src/app/(app-ar)/admin/finance/page.tsx`, `src/app/(app-ar)/admin/messages/page.tsx`, `src/app/(app-ar)/admin/reports/page.tsx`, `src/app/(app-ar)/admin/users/page.tsx`, `src/features/admin/contact-messages/contact-message-inbox.tsx`, `src/features/admin/notifications/admin-notification-bell.tsx`, `src/features/admin/notifications/admin-notification-popover.tsx`, `src/features/admin/cases/manual-case-form.tsx`, `src/features/admin/governance/role-permission-form.tsx`, and `src/features/admin/dashboard/admin-command-center.tsx`, and write `test-results/plan35/shared-ui-consumer-disposition.json` classifying every consumer as `migrated`, `backward-compatible` with a named passing test, or `blocked-re-spec`; impact: no PLAN-35 or public/client/payment/Stitch consumer is silently broken by a shared signature/token/visual change, and any unproven out-of-scope impact stops for re-specification or a narrower patch.
- [ ] T112 [US7] Run T017, T019, T107–T111, every named compatibility test from `test-results/plan35/shared-ui-consumer-disposition.json`, and the existing public/client product-component regressions, then use Playwright `toHaveScreenshot` with animations disabled, `[data-visual-dynamic]` masking, and `maxDiffPixelRatio: 0.01` at `1440x900`, both sides of `lg` (`1023x768` and `1024x768`), mobile RTL `390x844`, and compact `320x568`, storing report/snapshots under `test-results/plan35/visual/` and the Playwright snapshot directory; impact: US7 is independently accepted with reviewed deterministic visual, semantic, and cross-surface compatibility proof.

**Checkpoint US7**: All touched admin journeys are responsive, keyboard-operable, RTL-correct, and semantically named.

---

## Phase 9: User Story 8 — Evidence-based release and documentation convergence (P1)

**Goal**: Contracts, tests, status documents, and live evidence state exactly what was delivered; a
skip or missing environment never counts as acceptance.

**Independent test**: Run the quickstart on the exact commit, trace each FR/SC to evidence, compare
route/permission contracts bidirectionally, and confirm the documented state equals the highest
completed gate.

### Contract and harness tests first

- [ ] T113 [P] [US8] Extend `tests/server/route-manifest-contract.test.ts` and `tests/server/plan35-contract-inventory.test.ts` for every implemented PLAN-35 method, stable error, permission, and consumer href; impact: planned markers are removed only with real implementations.
- [ ] T114 [P] [US8] Add local/DB/browser/live evidence-state assertions and skip-is-not-pass behavior to `tests/server/plan35-release-evidence.test.ts`; impact: status automation cannot inflate unavailable checks.
- [ ] T115 [US8] Harden `tests/e2e/live-admin-smoke.spec.ts` so PLAN-35 routes require 200 or a documented redirect/outcome rather than merely `<500`; impact: live smoke becomes meaningful while remaining read-only in production.

### Source-of-truth synchronization

- [ ] T116 [US8] Reconcile implemented PLAN-35 methods, schemas, permissions, and errors in `specs/kmt-legal-platform/contracts/openapi-plan.md`; impact: the platform API contract stops advertising nonexistent operations or wrong `reports.read.any` spelling.
- [ ] T117 [US8] Reconcile entities, no-schema/data-only migration decision, scopes, and state rules in `specs/kmt-legal-platform/data-model.md` and `specs/kmt-legal-platform/backend-plan.md`; impact: architecture docs match runtime ownership and transaction behavior.
- [ ] T118 [US8] Reconcile route registry, responsive shell, command center, states, and Arabic UI rules in `specs/kmt-legal-platform/frontend-plan.md`; impact: frontend plan matches delivered navigation/components rather than legacy placeholders.
- [ ] T119 [US8] Add PLAN-35 focused, DB, role, accessibility, visual, live, and skip semantics to `specs/kmt-legal-platform/test-plan.md` and `specs/kmt-legal-platform/quality-gates.md`; impact: release gates become reproducible.
- [ ] T120 [US8] Wire `tests/e2e/plan35-db-backed.spec.ts` and `tests/e2e/plan35-admin-operations.spec.ts` into `scripts/plan23-local-qa.mjs` and the relevant `package.json` QA commands without changing existing command meaning; impact: standard release runs cannot omit PLAN-35.
- [ ] T121 [US8] Update `docs/RELEASE_QA_CHECKLIST.md` and create sanitized evidence index `docs/evidence/PLAN_35_ADMIN_OPERATIONS.md`; impact: every claim links to commit/environment/command/result/artifact.

### Verification and release truth

- [ ] T122 [US8] Run the full local gate from `specs/kmt-legal-platform/plan-35-admin-operations-remediation/quickstart.md`: schema validate/generate, typecheck, lint, all Vitest, build, focused browser, and `git diff --check`; impact: `Local-Verified` is granted only on an all-green exact commit.
- [ ] T123 [US8] On a disposable PostgreSQL database run `npm run qa:db` and `npm run test:e2e:db` including `tests/e2e/plan35-db-backed.spec.ts`, then record clean migration/double-seed, editable/empty role, active-session/final-Super, concurrent appointment, case replay/rollback, and queue/governance results in `docs/evidence/PLAN_35_ADMIN_OPERATIONS.md`; impact: `DB-Verified` is blocked by any skip.
- [ ] T124 [US8] Run `node scripts/run-playwright-with-server.mjs tests/e2e/plan35-admin-operations.spec.ts` for the five-role desktop/mobile, accessibility, deterministic screenshot, console/network, and drill-down matrix, storing artifacts under `test-results/plan35/browser/` and indexing them in `docs/evidence/PLAN_35_ADMIN_OPERATIONS.md`; impact: `Browser-Verified` requires usable responsive evidence.
- [ ] T125 [US8] Run `tests/e2e/live-admin-smoke.spec.ts` read-only with external `KMT_LIVE_*` credentials through the repository Playwright harness and record sanitized expected outcomes in `docs/evidence/PLAN_35_ADMIN_OPERATIONS.md`; impact: missing credentials are `BLOCKED/SKIPPED`, never `Live-Accepted`.
- [ ] T126 [US8] Update `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`, `docs/KMT_LEGAL_SPEC_KIT_PLAN_INDEX.md`, and the single PLAN-35 roll-up in `specs/kmt-legal-platform/tasks.md` to the highest evidenced state; impact: detailed feature tasks are not duplicated and legacy plan history is preserved.
- [ ] T127 [US8] Rerun Spec Kit analyze, record the final finding disposition in `docs/evidence/PLAN_35_ANALYZE_CONVERGE.md`, fix every new `CRITICAL/HIGH`, fix or explicitly accept each `MEDIUM`, then run converge until the same file records that no task was appended; impact: implementation and planning artifacts finish consistent.
- [ ] T128 [US8] Commit the verified accepted task set, push `main` to `origin/main`, and hand off `cd /www/wwwroot/kmtlegal` plus `bash deploy/install/aapanel-pm2-update.sh`; impact: repository and aaPanel/PM2 deployment owner receive one traceable release handoff.

**Checkpoint G35-9**: All claimed gates have exact evidence; analyze/converge are clean; status is
truthful; deployment handoff is ready.

---

## Dependencies and execution order

### Hard gates

1. T001–T006 plus T017/T019 must be written and observed red for the audited gaps while unrelated
   baseline tests remain green.
2. T007–T015 and T017–T023 are blocking and green before local product story implementation. T019's
   expected failure is retained as characterization until US2/US7. T016 is deferred DB evidence:
   it stays open and blocks database/story/release acceptance, not local code execution.
3. T024–T027 and T029–T038 may complete US1's local scope/conflict implementation. T028 and the
   DB-backed portion of T039 must pass on disposable PostgreSQL before US1 is accepted or any
   dependent phase claims an accepted checkpoint.
4. T040–T052 establish shell access and a green fifteen-route baseline; the four planned route IDs
   remain undiscoverable at that checkpoint.
5. US3, US4, and US5 backend/test lanes may start after Foundation, but their page/navigation/UI
   registration waits for US2 T040–T052 and occurs only after each lane's page/API exists: T066 for
   contact/notification, T079 for case create, and T090 for roles. A single route-policy owner uses
   that sequence; parallel teams submit metadata and obey the lanes below.
6. T091 must pass the complete nineteen-route-by-five-role matrix after T090; no 404/405 or skipped
   planned route can satisfy that gate.
7. US6 T092–T106 depends on US1 through US5, including the T091 full route matrix, because it composes
   their stabilized queues, actions, and access context.
8. Shared primitive/persona tasks T017–T023 freeze before every product UI task and before call-site
   convergence T107–T111.
9. Release convergence T113–T128 starts only after all accepted story checkpoints pass.

### Parallel-safe opportunities

- T001, T002, and T006 use separate new test files; T005 starts only after T001 freezes the shared
  five-role fixture.
- T024, T025, and T028 use separate test files; T026/T027 are sequential because their services are
  later edited in the same appointment lane.
- T031 and T032 touch different scope services after the policy contract freezes.
- Contact tests T053/T055 and notification tests T054/T056 are separate lanes.
- US3, US4, and US5 backend/UI work can proceed in parallel only if route registry, navigation,
  dashboard service, UI copy, seed, and shared fixtures remain owned by the designated integrator.
- T097 is isolated domain UI work after dashboard DTO acceptance.
- T108 and T109 list disjoint feature files after primitives freeze.
- T113 and T114 use separate test files; T116–T121 are sequential root-owned documentation/harness
  integration.

## File ownership and merge-conflict matrix

| Lane | Exclusive files | Tasks | Rule |
|---|---|---|---|
| Root/Spec | `.specify/**`, `specs/**`, `docs/KMT_LEGAL_*`, `docs/RELEASE_QA_CHECKLIST.md`, `docs/evidence/**` | T116–T128 and task check-off | Root only; never delegate or copy task rows into master |
| Auth/RBAC foundation | `src/server/auth/policy-data.json`, `src/server/auth/session-store.ts`, `prisma/seed.mjs`, PLAN-35 migration | T003–T010 | One owner through G35-4; then explicitly hands `session-store.ts` to Governance before T082 starts |
| Route policy | `src/lib/admin-route-policy.ts`, `src/app/(app-ar)/admin/admin-navigation.ts`, `src/server/auth/page-guards.tsx` | T011, T040–T052, T066, T079, T090–T091 | Integrator-owned sequence; story lanes submit route metadata requests, not parallel edits |
| Appointment/operations | `src/server/admin/case-operations-service.ts`, `src/server/admin/consultation-review-service.ts`, `src/server/consultations/consultation-assistant-service.ts`, new helper | T025–T037, T073 | Helper then public writer then conversion then admin writer; case reference extraction waits until these finish |
| Dashboard | `src/server/admin/dashboard-service.ts`, dashboard route/page/features/tests | T024, T038, T067, T092–T101 | Scope pass, queue pass, then command-center pass; never concurrent |
| Shell/UI | `src/components/layout/dashboard-shell.tsx`, `src/components/layout/dashboard-mobile-nav.tsx`, `src/components/layout/admin-shell-state.tsx`, `src/components/layout/index.ts`, `src/features/admin/shell/admin-access-context.tsx`, `src/app/(app-ar)/admin/layout.tsx`, `src/app/(app-ar)/admin/loading.tsx`, `src/app/(app-ar)/admin/error.tsx`, `src/app/(app-ar)/admin/not-found.tsx`, `tests/ui/product-components.test.tsx` | T041, T046–T052 | One UI owner until US2 checkpoint |
| Contact | Contact service/routes/feature/page/tests | T053, T055, T057–T061 | May run beside notification/case/role lanes after Foundation |
| Notification | Notification service/routes/bell/popover/page/tests | T054, T056, T057, T062–T065 | May run beside contact lane; route registry/dashboard requests merge later via T066/T067 |
| Cases | Manual-case service/routes/form/pages/tests/client history | T069–T081 | Case service/API before UI; shared consultation service waits for appointment lane |
| Governance | Role-permission service/routes/form/page/tests, `src/server/admin/governance-service.ts`, `src/server/auth/auth-service.ts`, handed-off `src/server/auth/session-store.ts`, admin-user routes/pages/forms/tests | T082–T091 | Sole owner after Auth/RBAC handoff; hands governance service/forms to Storage only after US5 checkpoint |
| Storage settings | `src/server/storage/runtime-diagnostic.ts`, `src/server/storage/upload-policy.ts`, `src/server/storage/vps-storage.ts`, `src/server/storage/malware-scan.ts`, `src/server/admin/governance-service.ts`, `src/features/admin/governance/governance-forms.tsx`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/settings/[key]/route.ts`, `src/app/(app-ar)/admin/settings/page.tsx`, `tests/server/storage-contract.test.ts`, `tests/server/admin-governance.test.ts` | T102–T106 | Runs after governance role service is isolated; one owner for existing governance files |
| Messages/errors | `src/lib/ui-copy.ts`, `src/server/http/errors.ts` | T006, T012–T013 | Freeze semantic codes/copy before route or UI consumers |
| Shared primitives | `src/components/ui/*`, `src/lib/design-system/tokens.ts`, `tailwind.config.ts`, `src/app/globals.css` | T017, T020–T023 | One owner in Foundation; signatures freeze at G35-4 |
| Accessibility handoff | Domain call sites listed explicitly in T107–T111 | T019, T107–T112 | Acquire each file only after its domain checkpoint; never overlap its Cases/Governance/Dashboard/Storage owner |
| QA integration | shared fixtures, route manifest, `scripts/plan23-local-qa.mjs`, `package.json`, live smoke | T001–T006, T018–T019, T113–T125 | One final integrator; story tests may add new files but not edit shared harness concurrently |

## Requirement traceability

| Requirements | Primary tasks |
|---|---|
| FR-001–FR-005 | T024–T039 |
| FR-006–FR-008, FR-024 | T040–T052 |
| FR-009–FR-012 | T053–T068 |
| FR-013–FR-015 | T069–T081 |
| FR-016–FR-018, FR-037–FR-038 | T082–T091 |
| FR-019–FR-023 | T092–T106 |
| FR-025–FR-029 | T017–T023, T107–T112 |
| FR-030–FR-036 | T113–T128 |

## Stop conditions

- Stop and revise `spec.md` if a Prisma structural migration, new dependency, public/client/payment
  behavior change, or new notification channel becomes necessary.
- Stop a lane if its expected-red test does not reproduce the audited gap; investigate the evidence
  before changing behavior.
- Stop release progression on any skipped PLAN-35 DB/browser/live gate required for the claimed
  state.
- Missing disposable PostgreSQL does not stop explicitly accepted local implementation under
  FR-035, but it leaves T016/T028/T039 and every dependent DB acceptance claim open. Never run
  migration, seed, mutation, or concurrency verification against the production-connected database.
- Stop parallel work when two tasks need the same exclusive file; finish and integrate the upstream
  contract owner first.
