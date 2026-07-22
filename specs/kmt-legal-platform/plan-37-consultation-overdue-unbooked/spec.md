# Feature Specification: Consultation Overdue-Unbooked Recovery

**Feature Branch**: `main`

**Created**: 2026-07-22

**Status**: Approved for implementation

**Input**: Correct the consultation “current” queue so old requests without a primary booking do not remain active forever, provide a recoverable scheduling path, and reconcile legacy converted/rejected records without changing the database schema or making final success automatic.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Separate overdue requests without a booking (Priority: P1)

As an administrator or secretary, I need an unbooked request to leave the current queue after 72 complete hours so the current queue represents actionable recent or scheduled work.

**Why this priority**: The current queue now includes every `PENDING` request, including June requests with no booking, which creates a misleading and permanently growing backlog.

**Independent Test**: Evaluate requests just before, exactly at, and just after 72 elapsed hours using one fixed `asOf`, and compare the current and overdue-unbooked views and counts.

**Acceptance Scenarios**:

1. **Given** an active `PENDING` request with no primary booking and age below 72 hours, **when** the current view is loaded, **then** it appears in current and not overdue-unbooked.
2. **Given** the same kind of request at exactly 72 elapsed hours, **when** views are loaded with the same `asOf`, **then** it appears only in overdue-unbooked while remaining `PENDING`.
3. **Given** a request created in June with a future primary booking, **when** current is loaded in July, **then** it remains current and its displayed date is clearly labeled as the creation date.
4. **Given** an expired primary booking, **when** maintenance has not yet classified it, **then** the request is not misleadingly returned as current.

---

### User Story 2 - Schedule and assign an active unbooked request (Priority: P1)

As an authorized operations user, I need to schedule any active unbooked request and assign its lawyer in one action so recent and overdue requests have the same recovery path.

**Why this priority**: Moving a request into a separate queue is useful only if the operator can resolve it safely without losing entered data or creating conflicting appointments.

**Independent Test**: Schedule an eligible request, then exercise invalid-time, conflict, stale-version, existing-booking, and denied-role cases and verify atomicity and preserved form input.

**Acceptance Scenarios**:

1. **Given** an authorized user and an active `PENDING` request without a primary booking, **when** valid lawyer, future time, duration, mode, optional location, and current version are submitted, **then** one primary booking is created, the lawyer is assigned, secretary review is recorded, and the request becomes scheduled within one transaction.
2. **Given** a lawyer or client conflict, **when** scheduling is submitted, **then** no partial write occurs and the user can correct the same preserved form.
3. **Given** a stale outcome version or a newly existing primary booking, **when** scheduling is submitted, **then** the change is rejected as a state change and no duplicate booking is created.
4. **Given** a Lawyer or Marketing Staff user, **when** scheduling is attempted directly against the API, **then** server authorization denies it.

---

### User Story 3 - Reconcile legacy terminal workflow records (Priority: P2)

As an operations user, I need converted and rejected legacy requests without a primary booking to leave the pending lifecycle deterministically so historical data does not pollute current work.

**Why this priority**: PLAN-36 intentionally skipped missing-primary records; terminal workflow statuses therefore remain `PENDING` unless this narrow reconciliation is added.

**Independent Test**: Run maintenance repeatedly for converted and rejected pending records without primary bookings and verify one transition, one audit, deduplicated notification behavior, and manual result confirmation for the converted case.

**Acceptance Scenarios**:

1. **Given** `CONVERTED + PENDING` without a primary booking, **when** maintenance runs, **then** it becomes `AWAITING_RESULT` once with reason `BACKFILL_CONVERTED_WITHOUT_PRIMARY` and no fake appointment.
2. **Given** that converted legacy record is awaiting result, **when** an authorized user confirms a final result, **then** the manual result is accepted without requiring a nonexistent primary booking and remains audited.
3. **Given** `REJECTED + PENDING` without a primary booking, **when** maintenance runs, **then** it becomes `CANCELLED` once.
4. **Given** unchanged legacy records, **when** maintenance runs again, **then** it creates no duplicate transition, audit, or alert.

---

### User Story 4 - Keep operational surfaces consistent and understandable (Priority: P2)

As an administrator or secretary, I need list tabs, dashboard counts, notifications, details, and dates to use the same time snapshot and definitions so I can trust what each number means.

**Why this priority**: A correct list still fails operationally if another surface keeps the old count, old notification, or ambiguous date label.

**Independent Test**: Compare all affected surfaces for the same representative requests and fixed time, then exercise desktop and mobile RTL scheduling and failure recovery.

**Acceptance Scenarios**:

1. **Given** eligible records, **when** the consultations list loads, **then** the tabs appear in this RTL order: current, overdue without booking, awaiting result, missed, successful, no-show, cancelled, all.
2. **Given** one list response, **when** records and counts are inspected, **then** they derive from one returned `asOf` and expose operational timing for overdue-unbooked requests.
3. **Given** an overdue request is scheduled or closed, **when** notifications refresh, **then** the overdue alert is resolved and not duplicated.
4. **Given** an overdue count on the dashboard, **when** it is activated, **then** it opens the matching shareable view with a clear 72-hour definition.
5. **Given** desktop or mobile RTL, **when** scheduling succeeds or fails, **then** focus, live status, touch targets, input preservation, and layout remain usable without a new UI library.

### Edge Cases

- The boundary is exact elapsed time: `createdAt + 72 hours <= asOf`; calendar dates, month changes, and business days do not alter it.
- `asOf` is captured once per list/dashboard/notification operation; records and counts must not straddle different clocks.
- A primary booking is the oldest linked `CONSULTATION` appointment with `caseId = null`; case follow-ups do not make an unbooked consultation scheduled.
- A no-primary request is overdue only while its workflow is active and outcome is `PENDING`; converted and rejected rows follow legacy reconciliation instead.
- A request with a future primary booking remains current regardless of its creation month; a booking at or before its end time is handled by PLAN-36 outcome classification.
- Review or assignment alone does not resolve overdue-unbooked state because the required primary booking still does not exist.
- Scheduling rejects non-future instants, durations outside 15–240 minutes, inactive lawyers, existing primary bookings, conflicts, and stale versions without partial writes.
- A maintenance race with scheduling or manual outcome leaves one valid winning transition through conditional version checks.
- Only the explicit converted-legacy reason permits a manual result without a primary appointment; arbitrary missing-primary records remain not ready.

## Scope & Connected Impact *(mandatory)*

### In Scope

- A derived `overdue_unbooked` consultation view based on 72 exact elapsed hours.
- One fixed `asOf` per operation and operational timing in consultation list DTOs.
- Atomic scheduling and lawyer assignment for active pending requests without a primary booking.
- Idempotent legacy reconciliation for converted/rejected pending records without primary bookings.
- Matching dashboard count, notification lifecycle, Arabic list/detail copy, responsive RTL scheduling UI, tests, documentation, and deployment acceptance.

### Out of Scope

- Any Prisma schema change, migration, database installation, local database, or production fixture creation.
- Automatic success, Paymob activation, two-factor authentication, Prisma upgrade, analytics, charts, a new UI library, or a second PM2 worker.
- Reopening PLAN-36 or treating PLAN-37 evidence as completion of PLAN-35/PLAN-36 environment gates.

### Existing Behavior to Preserve

- PLAN-36 outcome states, manual final-result confirmation, missed reopen flow, appointment conflict policy, optimistic versioning, permissions, audit privacy, and Cairo formatting.
- Public request creation, client/case workflows, existing primary appointment identity, list filters/search/pagination, dashboard authorization scope, and aaPanel/PM2 deployment entry point.
- Existing database columns and migration history remain unchanged.

### Affected Surfaces

- **Actors/Roles**: Secretary, Office Admin, and Super Admin may schedule; Lawyer and Marketing Staff may not mutate.
- **UI/Routes**: Admin consultation list/detail/action panel, scheduling form, dashboard cards, and notification center on desktop/mobile RTL.
- **API/Services**: Consultation list read contract, new schedule mutation, review/outcome services, conflict service, audit catalog, notification service, dashboard service, and maintenance process.
- **Data**: No schema change; derived timing uses existing `createdAt`, appointments, workflow status, outcome/version, client, lawyer, review, audit, and notification records.
- **Messages/Localization**: Central Arabic copy for the tab, definition, creation date, overdue time, scheduling states, and stable existing errors.
- **Tests/Docs/Deployment**: Characterization, contract, service, worker, permission, race, dashboard/notification, Playwright, status/index/inventory, server and QA guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define overdue-unbooked as an active workflow request with outcome `PENDING`, no primary booking, and `createdAt + 72 hours <= asOf`.
- **FR-002**: A pending no-primary request younger than 72 hours MUST be current and MUST NOT be overdue-unbooked.
- **FR-003**: A pending request with a primary booking whose end is later than `asOf` MUST be current regardless of creation month.
- **FR-004**: A pending request with an ended primary booking MUST NOT appear current while awaiting the PLAN-36 maintenance transition.
- **FR-005**: An overdue-unbooked request MUST remain `PENDING` and MUST NOT become `MISSED` solely because it lacks a booking.
- **FR-006**: Converted and rejected no-primary workflows MUST be excluded from current and overdue-unbooked while reconciliation determines their terminal operational outcome.
- **FR-007**: Every read operation MUST capture one `asOf` and use it for records, all view counts, dashboard counts, notification eligibility, and operational timing in that operation.
- **FR-008**: The consultation list contract MUST support `overdue_unbooked`, return its count, return `asOf`, and provide `isOverdueUnbooked` and `overdueAt` per record.
- **FR-009**: Existing search, assignment, workflow, compatible review, pagination, role scope, and shareable query behavior MUST be preserved; changing views resets pagination.
- **FR-010**: The system MUST provide a scheduling mutation for active `PENDING` requests without a primary booking both before and after the 72-hour boundary.
- **FR-011**: Scheduling MUST require lawyer, future ISO start, 15–240 minute duration, delivery mode, optional location, and `expectedOutcomeVersion`.
- **FR-012**: Scheduling MUST require both `consultation.review.any` and `appointment.manage.any` on the server.
- **FR-013**: Scheduling MUST validate an active eligible lawyer and check both lawyer and client conflicts using the existing conflict policy.
- **FR-014**: Scheduling MUST atomically link or create the client, create exactly one primary booking, assign the lawyer, record secretary review, update workflow to scheduled, increment outcome version, append a privacy-safe audit, and synchronize notifications.
- **FR-015**: A stale version, existing primary booking, incompatible workflow/outcome, conflict, or validation failure MUST produce no partial write and MUST use existing stable recovery codes where applicable.
- **FR-016**: The scheduling UI MUST preserve entered fields after recoverable failures and expose refresh/retry guidance.
- **FR-017**: Maintenance MUST transition `CONVERTED + PENDING` without a primary booking to `AWAITING_RESULT` once with reason `BACKFILL_CONVERTED_WITHOUT_PRIMARY` and without creating an appointment.
- **FR-018**: The explicit converted-legacy state MUST allow authorized manual final result confirmation without a primary booking; all other missing-primary manual outcomes remain not ready.
- **FR-019**: Maintenance MUST transition `REJECTED + PENDING` without a primary booking to `CANCELLED` once.
- **FR-020**: Legacy reconciliation MUST be idempotent under repeated runs and races, with no duplicate audit or notification.
- **FR-021**: Overdue notifications MUST be deduplicated and MUST resolve when a primary booking is created or the request leaves the eligible state.
- **FR-022**: The dashboard MUST expose a role-scoped, clickable overdue-unbooked count using the same predicate and 72-hour definition as the list.
- **FR-023**: The list MUST label `createdAt` as “تاريخ إنشاء الطلب” and show the overdue instant/duration in `Africa/Cairo` without implying the displayed month is the current month.
- **FR-024**: New user-facing text MUST come from the existing central copy sources; enum names, reason codes, and internal errors MUST not leak.
- **FR-025**: The UI MUST reuse existing components and support Arabic RTL order, responsive overflow, keyboard focus, `aria-live`, 44-pixel targets, loading, empty, denied, validation, conflict, stale, success, and retry states.
- **FR-026**: Audit and maintenance output MUST omit names, contact details, notes, credentials, and other PII; derived overdue detection itself MUST NOT create a state-transition audit.
- **FR-027**: The existing maintenance process and aaPanel/PM2 deployment path MUST be reused; no second worker or automatic database/schema action may be introduced.
- **FR-028**: Local verification MUST run without `DATABASE_URL`; database/live validation is separately recorded only on an authorized staging/server environment after backup.

### Key Entities

- **Operational timing**: A derived read model containing the fixed calculation time, the exact 72-hour threshold instant, and whether a pending no-primary request is overdue.
- **Primary consultation booking**: The oldest linked `CONSULTATION` appointment without a case; creating it resolves overdue-unbooked eligibility.
- **Scheduling command**: The authorized, versioned instruction that creates the primary booking and assignment atomically.
- **Legacy missing-primary transition**: An idempotent outcome repair for converted/rejected workflows that does not invent an appointment.
- **Overdue notification**: A deduplicated operational alert derived from current eligibility and resolved when that eligibility ends.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Before/exactly-at/after 72-hour tests place every eligible request in exactly one of current or overdue-unbooked with 100% boundary agreement.
- **SC-002**: A June-created unbooked request older than 72 hours is absent from current, while a June-created request with a future primary booking remains current and clearly displays its creation date.
- **SC-003**: A valid scheduling submission creates one primary booking and completes all related updates atomically; every tested invalid/conflicting/stale submission produces zero partial writes.
- **SC-004**: Secretary, Office Admin, and Super Admin pass scheduling authorization tests; Lawyer and Marketing Staff are denied server-side.
- **SC-005**: Repeated legacy reconciliation produces one transition/audit/notification maximum per eligible record and accepts manual final result for the explicit converted legacy case.
- **SC-006**: List, dashboard, and notification eligibility agree for all representative records when evaluated at the same `asOf`.
- **SC-007**: Desktop and mobile RTL flows navigate all eight tabs and complete scheduling plus conflict/stale recovery with no unexpected console, hydration, focus, or horizontal-overflow error.
- **SC-008**: Focused tests, full tests, typecheck, lint, build, and secrets checks pass locally without a database connection.
- **SC-009**: Authorized staging/server acceptance after backup shows the reconciliation and existing PM2 process remain stable, with no production test data created.

## Assumptions

- “Three days” means 72 exact elapsed hours from `createdAt`, not calendar days or business days.
- Scheduling and lawyer assignment occur together; this is the approved recovery action for unbooked requests.
- Final outcomes remain manual, including converted legacy records.
- The existing PLAN-36 schema already contains every field needed; therefore PLAN-37 has no Prisma change or migration.
- Local implementation and automated verification run without installing or connecting a database.
