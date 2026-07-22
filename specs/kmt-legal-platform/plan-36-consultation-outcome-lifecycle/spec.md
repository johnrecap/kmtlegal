# Feature Specification: Consultation Outcome Lifecycle

**Feature Branch**: `main`

**Created**: 2026-07-22

**Status**: Approved for implementation

**Input**: Introduce an explicit outcome lifecycle for online consultation bookings so expired requests no longer remain indefinitely in the active review queue, while preserving manual outcome confirmation, audited recovery, permissions, Arabic RTL usability, and safe deployment.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classify expired consultation requests (Priority: P1)

As an operations user, I need an expired consultation booking to leave the current queue within one maintenance cycle so the active queue reflects work that can still be actioned.

**Why this priority**: Expired requests currently remain operationally active and mislead both administrators and secretaries.

**Independent Test**: Create expired consultation scenarios with and without assignment or review, run one classification cycle, and observe the correct operational outcome without any request becoming successful automatically.

**Acceptance Scenarios**:

1. **Given** a pending consultation whose primary booking has reached its end time and has neither an assigned lawyer nor a recorded review, **when** classification runs, **then** the request is classified as `MISSED`.
2. **Given** a pending consultation whose primary booking has reached its end time and has either an assigned lawyer or a recorded review, **when** classification runs, **then** the request is classified as `AWAITING_RESULT`.
3. **Given** a pending consultation whose primary booking has not reached its end time, **when** classification runs, **then** its outcome remains `PENDING`.
4. **Given** the same eligible request is processed repeatedly, **when** classification runs more than once, **then** only one outcome transition, one audit event, and one applicable notification are recorded.
5. **Given** an expired consultation, **when** automated classification runs, **then** it never assigns `SUCCESSFUL`, `NO_SHOW`, or `CANCELLED` solely because time elapsed.

---

### User Story 2 - Confirm or correct a consultation result (Priority: P1)

As an authorized administrator or secretary, I need to confirm the real result after the scheduled consultation ends so reporting is accurate and the linked booking reflects the same final result.

**Why this priority**: A consultation outcome is a business fact that cannot be inferred safely from elapsed time.

**Independent Test**: Open an eligible expired request, confirm each supported final outcome, and verify that the consultation, primary booking, audit history, and visible state agree.

**Acceptance Scenarios**:

1. **Given** an expired request in `AWAITING_RESULT`, **when** an authorized user confirms success using the latest version, **then** the request becomes `SUCCESSFUL` and its primary booking becomes completed.
2. **Given** an expired request in `AWAITING_RESULT`, **when** an authorized user confirms that the client did not attend, **then** the request becomes `NO_SHOW` and its primary booking records no-show.
3. **Given** an expired request in `AWAITING_RESULT`, **when** an authorized user confirms cancellation, **then** the request becomes `CANCELLED` and its primary booking becomes cancelled.
4. **Given** a final result already exists, **when** an authorized user corrects it, **then** a new reason is mandatory and a distinct audit event records the correction without erasing the prior history.
5. **Given** two operators loaded the same outcome version, **when** one saves first, **then** the second receives a recoverable state-changed response and no update is silently overwritten.
6. **Given** a lawyer or marketing staff member, **when** they attempt a manual outcome change, **then** the action is denied even if the interface was bypassed.

---

### User Story 3 - Reopen and reschedule a missed request (Priority: P2)

As an authorized administrator or secretary, I need to recover a genuinely missed request by assigning a lawyer and a future booking while preserving the recorded missed event.

**Why this priority**: Missed requests need an explicit recovery path rather than being edited back into the active queue without traceability.

**Independent Test**: Reopen a missed request with valid future details, then attempt invalid and conflicting alternatives and verify that input is preserved for correction.

**Acceptance Scenarios**:

1. **Given** a request in `MISSED`, **when** an authorized user supplies a lawyer, future start time, duration, delivery method, reason, and latest version, **then** the request returns to `PENDING` with a rescheduled primary booking and preserved missed audit history.
2. **Given** a missed request, **when** the requested lawyer or client has a conflicting active appointment, **then** reopening is rejected with a recoverable conflict response and no partial changes.
3. **Given** a non-missed request, **when** reopening is requested, **then** the action is rejected and the normal outcome flow remains intact.
4. **Given** an expired request in `MISSED`, **when** assignment, review, conversion, or another protected mutation is attempted directly, **then** the action requires the explicit reopen flow.

---

### User Story 4 - Operate outcome queues consistently (Priority: P2)

As an administrator or secretary, I need consultation tabs, dashboard counts, calendar state, and notifications to use the same outcome rules so every operational surface tells the same story.

**Why this priority**: Different counts or stale alerts cause duplicated work and hide missed clients.

**Independent Test**: Seed a representative request in each outcome state and compare the list tabs, detail view, dashboard counters, calendar presentation, and notification center under each supported role.

**Acceptance Scenarios**:

1. **Given** requests in each outcome state, **when** an authorized user visits the consultation list, **then** shareable RTL tabs appear in this order: current, awaiting result, missed, successful, no-show, cancelled, all.
2. **Given** search or filters are active, **when** the user changes the outcome tab, **then** compatible filters remain, pagination returns to the first page, and counts keep the same authorization scope.
3. **Given** an awaiting-result or missed consultation, **when** it appears in the calendar, **then** its effective consultation state is visible instead of a misleading scheduled state.
4. **Given** an expired request leaves the current review queue, **when** notifications are refreshed, **then** obsolete review alerts are removed or resolved and only the applicable outcome alert remains.
5. **Given** dashboard outcome cards are visible, **when** the user activates one, **then** it opens the matching filtered list and explains the counting timeframe without introducing charts.

---

### User Story 5 - Deploy and reconcile safely (Priority: P3)

As a release operator, I need the new lifecycle to be introduced additively, reconcile existing records once, and prove the maintenance process remains stable after restart.

**Why this priority**: Existing production data must gain accurate outcomes without destructive rollback or a restart loop.

**Independent Test**: Apply the additive change to a disposable or staging database containing representative historical records, run reconciliation, restart through the supported deployment path, and observe stability for longer than one maintenance cycle.

**Acceptance Scenarios**:

1. **Given** historical completed, no-show, cancelled, rejected, and expired active bookings, **when** reconciliation runs, **then** each receives the documented outcome without data deletion.
2. **Given** the previous application version is restored after the additive data change, **when** it reads existing records, **then** it safely ignores the new outcome data and no existing status value is removed.
3. **Given** deployment restarts the application and maintenance process, **when** health is observed for longer than one classification cycle, **then** both remain online and the maintenance restart counter does not continue increasing unexpectedly.

### Edge Cases

- The boundary is exact: a booking is eligible at `endsAt`, not before it, with no commercial grace period.
- The primary booking is the oldest linked consultation appointment that is not attached to a case; later case follow-ups never determine the original consultation outcome.
- Classification uses the Cairo business clock for presentation while comparing absolute instants for correctness.
- A request with assignment but no review, or review but no assignment, becomes `AWAITING_RESULT`; `MISSED` requires both conditions to be absent.
- A worker racing with review, assignment, manual outcome, rejection, conversion, or reopen must leave one valid state and one audit event for the winning transition.
- A missing primary booking must not be guessed from a case follow-up; the record is skipped with privacy-safe operational evidence for remediation.
- Final outcome correction must not erase who recorded the previous result or why it changed.
- Reopen must reject past times, invalid duration, missing delivery method, missing reason, stale version, and scheduling conflicts without partial updates.
- Empty, loading, error, denied, stale-state, and conflict states must remain actionable on desktop and mobile RTL layouts.

## Scope & Connected Impact *(mandatory)*

### In Scope

- An explicit consultation outcome lifecycle and historical reconciliation.
- Automated expired-request classification no later than one 60-second maintenance cycle after the end time.
- Manual result confirmation and audited correction by authorized operations roles.
- Audited reopen and future rescheduling of missed requests with conflict protection.
- Consistent list tabs, counts, dashboard cards, calendar presentation, notifications, detail actions, Cairo date display, Arabic copy, and deployment evidence.

### Out of Scope

- Activating Paymob or any paid-booking behavior.
- Adding or changing two-factor authentication.
- Upgrading Prisma or changing the existing authentication model.
- Adding client analytics, a charting library, a new UI library, or a second maintenance process.
- Automatically changing server-wide npm configuration or Nginx HTTP/2 directives.
- Creating a local database or creating test data in production.
- Closing or replacing the outstanding evidence tasks in PLAN-35.

### Existing Behavior to Preserve

- Public free-booking creation, current authentication, role navigation, legal case workflows, calendar conflict rules, audit redaction, and PLAN-35 behavior.
- Existing appointment statuses and the distinction between consultation requests and case follow-up appointments.
- The current aaPanel and PM2 deployment entry point and maintenance process identity.
- All existing production records, audit history, and compatible rollback to the previous application version.

### Affected Surfaces

- **Actors/Roles**: Secretary, Office Admin, and Super Admin can perform manual outcome operations; lawyers and Marketing Staff remain read-only for this lifecycle.
- **UI/Routes**: Admin consultations list/detail/actions, dashboard cards, calendar state, notification center, responsive mobile cards, keyboard behavior, and RTL tab overflow.
- **API/Services**: Consultation list/detail and mutation contracts, scheduling conflict checks, shared outcome service, audit events, notification scope, dashboard scope, and maintenance reconciliation.
- **Data**: Consultation outcome fields, actor relationship, optimistic version, indexes, primary-booking selection, additive migration, backfill, and rollback compatibility.
- **Messages/Localization**: Central Arabic UI copy, stable error codes, Cairo date/time formatting, accessible live feedback, and removal of stale roadmap labels.
- **Tests/Docs/Deployment**: Characterization, contract, permission, race, migration, worker, UI, Playwright, deployment stability, implementation status, and server guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain exactly one canonical outcome for every consultation request: `PENDING`, `AWAITING_RESULT`, `MISSED`, `SUCCESSFUL`, `NO_SHOW`, or `CANCELLED`.
- **FR-002**: A request MUST remain `PENDING` before the end of its primary booking.
- **FR-003**: At or after the primary booking end, an unassigned and unreviewed pending request MUST become `MISSED` within 60 seconds.
- **FR-004**: At or after the primary booking end, a pending request with either assignment or review MUST become `AWAITING_RESULT` within 60 seconds.
- **FR-005**: Automated processing MUST NOT assign a final successful, no-show, or cancelled outcome merely because time elapsed.
- **FR-006**: The system MUST identify the primary booking as the oldest linked consultation appointment without a case association.
- **FR-007**: Case follow-up appointments MUST NOT influence the original consultation outcome.
- **FR-008**: Classification and reconciliation MUST be repeatable without duplicate transitions, audits, or notifications.
- **FR-009**: Manual outcome changes MUST require both consultation-review and appointment-management authority on the server.
- **FR-010**: Authorized users MUST be able to confirm `SUCCESSFUL`, `NO_SHOW`, or `CANCELLED` only when the primary booking has ended.
- **FR-011**: A successful, no-show, or cancelled consultation MUST synchronize the primary booking to the corresponding terminal booking state in the same atomic operation.
- **FR-012**: Manual outcome changes MUST record the time, actor, categorized reason where required, an optional internal note, and an incremented version.
- **FR-013**: Correcting a final result MUST require a new reason and MUST append a distinct audit event without deleting previous audit history.
- **FR-014**: Every manual mutation MUST reject a stale expected outcome version without partial changes.
- **FR-015**: A missed request MUST return to `PENDING` only through an explicit reopen-and-reschedule operation.
- **FR-016**: Reopen MUST require an authorized actor, assigned lawyer, future start time, valid duration, delivery method, categorized reason, and current outcome version.
- **FR-017**: Reopen MUST check lawyer and client scheduling conflicts and leave all records unchanged on conflict.
- **FR-018**: Reopen MUST preserve the recorded missed transition and append a separate recovery audit event.
- **FR-019**: Direct assignment, review, rejection, or conversion MUST enforce lifecycle compatibility and direct missed requests to the reopen flow.
- **FR-020**: Rejection or cancellation paths MUST leave the consultation outcome and primary booking in a consistent cancelled state.
- **FR-021**: Authorized users MUST have shareable outcome views for current, awaiting result, missed, successful, no-show, cancelled, and all requests.
- **FR-022**: Outcome views MUST return scoped counts, canonical outcome data, and the primary booking, using the same permission and filter semantics as the records shown.
- **FR-023**: Changing an outcome view MUST preserve compatible search and filters and reset pagination to the first page.
- **FR-024**: Dashboard counts, consultation lists, calendar state, and notifications MUST use the same canonical outcome scope.
- **FR-025**: Awaiting-result and missed requests MUST display their effective consultation outcome in calendar and operational surfaces rather than a misleading scheduled state.
- **FR-026**: Obsolete active-review notifications MUST be resolved when a request leaves the current queue, and repeated processing MUST not create duplicate alerts.
- **FR-027**: Dashboard outcome cards MUST show direct counts, a clear timeframe, and a link to the matching view without adding charts.
- **FR-028**: All new or changed user-facing text MUST use the central message source and natural Arabic copy; internal enum names and error details MUST not leak to users.
- **FR-029**: Dates and times on affected server and client surfaces MUST render consistently in `Africa/Cairo` without hydration mismatch.
- **FR-030**: Outcome UI MUST support RTL ordering, keyboard focus, screen-reader status announcements, 44-pixel touch targets, mobile overflow, and explicit loading, empty, error, denied, conflict, stale-state, and success states.
- **FR-031**: The data change MUST be additive, indexed for outcome and primary-booking access, backfillable, and readable by the previous application version without deleting existing data or status values.
- **FR-032**: Historical completed, no-show, cancelled, rejected, and expired active bookings MUST receive deterministic documented outcomes during reconciliation.
- **FR-033**: The existing maintenance process MUST perform reconciliation once after migration and ongoing classification at most 60 seconds apart, with privacy-safe structured counts and no new process identity.
- **FR-034**: Deployment MUST back up data, apply the additive migration, run reconciliation before restart, restart supported processes, and verify health and restart stability for longer than one maintenance cycle.
- **FR-035**: Server guidance MUST document the npm global-config warning and deprecated Nginx HTTP/2 syntax as manual, backup-first remediations validated before reload; deployment automation MUST NOT edit them.
- **FR-036**: Runtime admin UI MUST not expose obsolete PLAN-17 or PLAN-19 roadmap references.
- **FR-037**: Stable machine-readable failures MUST distinguish not-ready outcomes, concurrent state changes, reopen-required mutations, and appointment conflicts while preserving safe localized recovery guidance.
- **FR-038**: Audit and operational logs MUST exclude client names, contact details, free-form notes, credentials, and other sensitive payloads.

### Key Entities

- **Consultation request outcome**: The canonical operational or final result, its version, transition time, actor, categorized reason, and optional internal note.
- **Primary consultation booking**: The oldest consultation appointment linked to the request and not linked to a legal case; it provides the lifecycle time boundary and receives terminal status synchronization.
- **Outcome transition audit**: An append-only record of automatic classification, manual confirmation, correction, or reopen, using privacy-safe structured metadata.
- **Outcome view**: A shareable filtered operational queue with record data and counts under one permission scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every eligible expired request leaves the current queue no later than 60 seconds after its primary booking ends.
- **SC-002**: Reprocessing the same unchanged request produces zero duplicate audit records and zero duplicate notifications.
- **SC-003**: For representative data, list counts, dashboard counts, calendar outcome state, and notification state agree for 100% of outcome categories under the same role.
- **SC-004**: One operator can confirm or correct an eligible result in one detail-screen flow, while stale concurrent submissions are rejected without data loss.
- **SC-005**: A missed request can be reopened only with all required recovery details, and every invalid or conflicting attempt leaves zero partial mutations.
- **SC-006**: Automated tests cover before, exact, and after-end boundaries; both branches of the assignment/review rule; all manual outcomes; all authorized and denied roles; idempotency; and named race conditions.
- **SC-007**: Desktop and mobile RTL browser flows complete tab navigation, result confirmation, reopen, conflict recovery, and state refresh with zero unexpected console or hydration errors.
- **SC-008**: On staging or a disposable database, reconciliation maps every documented historical scenario deterministically and rollback to the previous application reads existing data without loss.
- **SC-009**: After supported deployment, application and maintenance processes remain healthy for more than 60 seconds with no unexpected increase in restart count.
- **SC-010**: No repository change, audit metadata, operational log, fixture, screenshot, or documentation artifact contains real credentials or client data.

## Assumptions

- The existing authentication, permission helpers, audit utilities, appointment conflict rules, design system, and aaPanel/PM2 deployment path are reused.
- Cairo is the business presentation timezone; persisted timestamps remain absolute instants.
- There is no commercial grace period after the scheduled end.
- The existing maintenance process can run every 60 seconds without a separate worker.
- Local verification runs without a database; database-backed migration and acceptance evidence is recorded only when a staging or disposable PostgreSQL environment is available.
- Live production mutations and creation of test records require separate approval.
- Previously shared administrative credentials will be rotated after live acceptance and will never be stored or repeated in project artifacts.
