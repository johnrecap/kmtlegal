# Feature Specification: Admin Operations Remediation

**Feature Branch**: `main`

**Created**: 2026-07-22

**Status**: In Progress — local implementation permitted; database acceptance deferred

**Input**: Convert the comprehensive admin dashboard audit into ordered, executable Spec Kit
phases with connected-impact mapping, exact acceptance criteria, and conflict-safe tasks.

## Clarifications

### Session 2026-07-22

- Q: Does the admin home require a new global dashboard permission? → A: No. Any authenticated staff
  role may open `/admin`; every metric, queue, and action follows its own domain permission/scope.
- Q: Which permission authorizes manual case creation? → A: New canonical `case.create.any`, granted
  by default to Secretary and Office Admin; exact Super Admin retains its wildcard behavior.
- Q: Who can use own-user generic notifications? → A: Lawyer, Secretary, Office Admin, Marketing
  Staff, and exact Super Admin; consultation review rows still require consultation review scope.
- Q: Which roles can be edited in the role-permission matrix? → A: Lawyer, Secretary, Office Admin,
  and Marketing Staff. Guest, Client, and exact Super Admin are protected/read-only, and persisted
  assignments—including an empty set—remain authoritative after bootstrap.
- Q: What counts as an appointment collision? → A: Active appointments for the same lawyer with a
  real time overlap; touching boundaries are allowed, different assigned lawyers do not collide,
  and rescheduling excludes the current record. An active consultation reservation with no lawyer
  protects its office-wide slot until assignment, so public-first/admin-first ordering cannot bypass
  it. The write must remain safe under concurrent requests.
- Q: Can storage paths/policies be changed from the admin page? → A: Environment-owned runtime
  storage configuration is a redacted read-only diagnostic; PLAN-35 does not make it database-editable.
- Q: May a transaction retry repeat an external payment-provider call? → A: No. Only proven
  database-only appointment callbacks may be retried; paid public booking makes exactly one hosted
  checkout call and maps a serialization failure to the recoverable conflict outcome.
- Q: Does role governance also cover existing user administration and live sessions? → A: Yes.
  Existing user list/create/detail/update responses become explicit safe DTOs; inactive, deleted,
  suspended, or inactive-role principals cannot keep an authenticated session; role/status changes
  revoke affected sessions and cannot remove the final active exact Super Admin.
- Q: May implementation continue when no disposable PostgreSQL database is available locally? → A:
  Yes. Local code, contract, unit, type, lint, build, and browser work may continue, while every
  PostgreSQL-dependent assertion remains `BLOCKED` and cannot satisfy a story checkpoint, a
  `DB-Verified` claim, or release acceptance. The connected production database is never used for
  migration, seed, mutation, or concurrency verification.

## User Scenarios & Testing

### User Story 1 - Trust operational counts and scheduling (Priority: P1)

As a lawyer or office operator, I need the dashboard, task board, and calendar to use the same
visibility rules and prevent overlapping appointments so I can trust the workload shown to me.

**Why this priority**: Incorrect counts and double-booked appointments directly affect legal
operations and staff decisions.

**Independent Test**: Seed assignments where a task or appointment belongs to a lawyer's case but
is directly assigned to another staff member, then confirm all authorized surfaces report the same
visibility and that overlapping create/reschedule attempts are rejected without changing data.

**Acceptance Scenarios**:

1. **Given** a case assigned to a lawyer and a related task assigned to another employee, **When**
   the lawyer opens the dashboard and task board, **Then** the task is represented consistently on
   both surfaces.
2. **Given** a case appointment visible through case assignment, **When** the lawyer opens the
   dashboard and calendar, **Then** both surfaces include the same appointment.
3. **Given** an existing active appointment for a lawyer, **When** staff creates or reschedules an
   overlapping appointment, **Then** the operation is rejected with a recoverable Arabic conflict
   message and neither appointment is modified.

---

### User Story 2 - Work inside a permission-aware admin workspace (Priority: P1)

As a staff member, I need navigation, dashboard widgets, page access, and denied states to reflect
my actual permissions so I see useful work rather than inaccessible destinations or unexplained
placeholder values.

**Why this priority**: Role-inappropriate navigation creates dead ends and makes the dashboard
unusable for restricted roles such as Marketing Staff.

**Independent Test**: Sign in as Lawyer, Secretary, Office Admin, Marketing Staff, and Super Admin;
for each role compare visible destinations and widgets with direct page/API authorization outcomes.

**Acceptance Scenarios**:

1. **Given** a staff member without permission for a destination, **When** the admin shell renders,
   **Then** that destination is absent while direct access remains server-side denied.
2. **Given** a role with only a subset of dashboard capabilities, **When** the home page renders,
   **Then** it shows permitted, actionable content and explains any intentionally unavailable area
   without exposing technical permission keys.
3. **Given** an authorization denial, **When** the user reaches the denied state, **Then** navigation
   context remains available and one valid recovery action is presented.

---

### User Story 3 - Process all incoming office work (Priority: P1)

As an authorized office operator, I need public contact messages and all in-app notifications to
appear in review queues so no lead, consultation, task, or operational alert is silently stored
without a staff workflow.

**Why this priority**: Existing data and services are not useful if staff cannot see and process
them from the admin workspace.

**Independent Test**: Create a contact message and generic notification, open the admin queue and
notification center, update their review/read states, and confirm counts and audit behavior update.

**Acceptance Scenarios**:

1. **Given** a new public contact message, **When** authorized staff opens the contact inbox,
   **Then** the message appears with search, status filters, safe contact details, and review/archive
   actions.
2. **Given** unread generic notifications and unreviewed consultations, **When** staff opens the
   notification center, **Then** both sources are represented with one truthful unread count.
3. **Given** a user without contact or notification permission, **When** the shell renders,
   **Then** restricted content and counts are omitted without leaking record details.

---

### User Story 4 - Create and maintain a case without a consultation dependency (Priority: P1)

As authorized case staff, I need to create a case for an existing client and edit its core details
without requiring a consultation conversion, while preserving assignment, audit, and validation
rules.

**Why this priority**: The documented case workflow and client copy promise a manual path that is
not currently available.

**Independent Test**: From an existing client, create a case, edit allowed fields, view it in the
case list/detail and client history, and verify unauthorized and duplicate submissions are denied.

**Acceptance Scenarios**:

1. **Given** an existing active client and authorized staff, **When** a valid case is submitted,
   **Then** one audited case is created and appears on every connected surface.
2. **Given** an existing case, **When** authorized staff edits allowed fields, **Then** the update is
   audited and does not bypass status or assignment rules.
3. **Given** invalid, unauthorized, or duplicate case input, **When** it is submitted, **Then** no
   partial case is created and a localized recovery message is shown.

---

### User Story 5 - Govern roles, users, and permissions safely (Priority: P1)

As a Super Admin, I need to inspect roles and change their permission assignments without locking
out the last active Super Admin or granting capabilities outside the canonical permission catalog.

**Why this priority**: Role management is a required governance capability already represented in
the data model and contract, but the administrative workflow is missing.

**Independent Test**: View the role-permission matrix, update a non-protected role, verify the new
access in a fresh session, inspect admin-user API DTOs, suspend/change a disposable user, and
confirm secret exclusion, session revocation, delegated ceilings, and last-Super-Admin protections.

**Acceptance Scenarios**:

1. **Given** an exact Super Admin, **When** the role matrix opens, **Then** every canonical role and
   permission is displayed with clear groupings and current assignments.
2. **Given** a valid permission change, **When** it is saved, **Then** the assignment and audit log
   update atomically and subsequent authorization uses the new policy.
3. **Given** a change that would remove required access from the final active Super Admin path,
   **When** it is submitted, **Then** the system rejects it without partial updates.
4. **Given** any admin-user list/create/detail/update response, **When** its full serialized payload
   is inspected, **Then** no password, TOTP/recovery secret, session token hash, or whole credential
   record is present.
5. **Given** an account or role loses active access, **When** old credentials/cookies are reused,
   **Then** login/session resolution fails; delegated managers cannot assign beyond their effective
   permission ceiling.

---

### User Story 6 - Act from a role-aware command center (Priority: P2)

As an office operator, I need the admin home page to prioritize today's work and provide direct
drill-down actions rather than presenting equally weighted, disconnected cards.

**Why this priority**: The current page is readable but does not answer what needs attention next.

**Independent Test**: Open the dashboard with mixed pending work and confirm role-allowed priority
queues, time-defined metrics, direct links, a primary action, and partial-data fallbacks.

**Acceptance Scenarios**:

1. **Given** pending appointments, overdue tasks, consultations, contact messages, and document
   review work, **When** an authorized operator opens the dashboard, **Then** the highest-priority
   items are grouped with clear actions and truthful timeframes.
2. **Given** a role that cannot access one workstream, **When** the dashboard renders, **Then** the
   layout adapts without empty placeholder cards or broken hierarchy.
3. **Given** one dashboard data source fails, **When** the page renders, **Then** unaffected sections
   remain usable and the failed section offers a retry or destination-specific fallback.

---

### User Story 7 - Use the admin UI accessibly on mobile and desktop (Priority: P2)

As an Arabic-speaking staff member using keyboard, screen reader, mobile, or desktop, I need
consistent form semantics, navigation, feedback, and recovery states throughout the touched admin
surfaces.

**Why this priority**: Duplicate field identifiers, hidden mobile navigation, ambiguous status
messages, and raw technical text can make otherwise working features unusable.

**Independent Test**: Complete each touched journey at 390px and desktop width using keyboard and
screen-reader semantics, then inspect labels, focus, alerts, mixed-language values, and RTL flow.

**Acceptance Scenarios**:

1. **Given** repeated forms on one page, **When** labels and errors are inspected, **Then** every
   control has a unique identifier and the correct accessible relationship.
2. **Given** a mobile viewport, **When** staff opens navigation, **Then** every authorized destination
   is discoverable without page-level horizontal overflow.
3. **Given** a validation, permission, conflict, loading, empty, success, or server error state,
   **When** it appears, **Then** it uses natural Arabic, correct semantics, and a safe next action.

---

### User Story 8 - Accept the admin release using real evidence (Priority: P1)

As the release owner, I need contracts, tests, status documents, and live evidence to describe the
same delivered behavior so a skipped or superficial check cannot be mistaken for production
acceptance.

**Why this priority**: Current unit checks pass, but dashboard-specific, database-backed, role,
mobile, and live acceptance evidence is incomplete.

**Independent Test**: Execute the feature quickstart against a migrated test database and an
authenticated browser environment, then compare generated evidence with contract and status
claims.

**Acceptance Scenarios**:

1. **Given** the complete implementation, **When** required checks run, **Then** each requirement is
   traceable to passing focused, integration, and browser evidence or an explicit blocker.
2. **Given** a skipped or unavailable environment-dependent test, **When** status is recorded,
   **Then** it is labeled SKIPPED or BLOCKED and does not satisfy the release gate.
3. **Given** a documented route, method, permission, or status, **When** contract validation runs,
   **Then** the claim matches the implementation exactly.
4. **Given** no disposable database is available, **When** local implementation continues,
   **Then** local evidence is recorded separately, database-dependent tasks remain open, and no
   production database is used as a substitute.

### Edge Cases

- A lawyer sees a task or appointment through case assignment while another user is the direct
  assignee.
- Appointment intervals touch at their boundaries, span midnight, or reschedule the same record.
- One dashboard widget fails while others succeed.
- A role has no meaningful dashboard metric but does have one valid admin destination.
- A permission update is concurrent with another governance update or active session.
- Two administrators concurrently try to demote/suspend the final exact Super Admin, or a delegated
  manager tries to promote across its current permission ceiling.
- A contact message or notification is updated twice or no longer exists.
- A case submission is repeated after a network retry.
- Public contact data contains long Arabic/English text, missing optional contact fields, or mixed
  direction content.
- The mobile navigation contains more destinations than fit in one viewport.
- Database, upload diagnostics, or browser credentials are unavailable during acceptance.
- A developer has only a production-connected deployment and no disposable database; local work
  may continue, but database mutation/concurrency evidence remains blocked until an isolated target
  exists.

## Scope & Connected Impact

### In Scope

- Canonical dashboard, task, case, consultation, and appointment visibility scopes.
- Conflict-safe admin appointment create and reschedule behavior.
- Permission-aware admin route registry, navigation, widgets, and denied states.
- Contact message inbox and unified in-app notification center.
- Manual case create/edit and Super Admin role-permission management.
- Existing admin-user response hardening, active-principal session enforcement, affected-session
  revocation, and final-active-Super-Admin protection on user mutations.
- Role-aware dashboard command center and direct drill-down actions.
- Admin mobile navigation, form/table semantics, localized states, and resilient boundaries.
- Contract, task/status documentation, database-backed tests, role-based browser tests, visual and
  accessibility evidence.
- Storage configuration shown as truthful read-only runtime diagnostics.

### Out of Scope

- Public website or client portal redesign.
- Stitch clone modification or strict Stitch-to-product parity.
- New charting, state-management, UI, animation, or localization framework.
- Email, SMS, WhatsApp, push delivery, or notification preference channels.
- Advanced business intelligence, collections forecasting, workload prediction, or AI triage.
- Changing authentication method, payment-provider behavior, Staff 2FA, or deployment platform.
- Runtime editing of filesystem paths, secrets, malware scanner settings, or other server-owned
  configuration.
- English localization of the protected admin workspace.

### Existing Behavior to Preserve

- Existing server-side permission and object-scope enforcement remains authoritative.
- Consultation conversion continues to create linked clients/cases/appointments as it does today.
- Existing client, case, task, document, finance, content, audit, and message routes remain valid.
- Existing contact-message and notification data, audit events, and status values remain compatible.
- Existing Arabic RTL shell, brand, tokens, and responsive record-card patterns are reused.
- Public, client, payment, install, and Stitch surfaces remain isolated from the admin remediation.

### Affected Surfaces

- **Actors/Roles**: Lawyer, Secretary, Office Admin, Marketing Staff, Super Admin; Client and public
  actors are affected only as upstream contact/case data sources.
- **UI/Routes**: Admin home, shell/navigation, calendar, tasks, clients, cases, contact inbox,
  notification center, roles, settings diagnostics, reports, and shared admin states.
- **API/Services**: Dashboard, calendar, case, contact-message, notification, role-permission,
  admin-user governance, session loading, error/localization, audit, and route-contract surfaces.
- **Data**: Appointment, Task, LegalCase, Client, ContactMessage, Notification, Role, Permission,
  RolePermission, User, Session, Setting, and AuditLog; no new persistent entity is assumed.
- **Messages/Localization**: Arabic route labels, status display labels, validation/conflict/denied
  messages, alerts, accessibility names, and stable API error codes.
- **Tests/Docs/Deployment**: Unit/contract, database integration, role-based E2E, responsive visual,
  accessibility, OpenAPI, data model, frontend/backend plans, master task registration,
  implementation status, release checklist, and server evidence handoff.

## Requirements

### Functional Requirements

- **FR-001**: All dashboard counts and lists MUST reuse the same canonical visibility scopes as
  their destination modules.
- **FR-002**: Metric definitions MUST name status membership, timeframe, and scope in user-readable
  Arabic and MUST link to the matching filtered destination.
- **FR-003**: Appointment creation, rescheduling, and consultation assignment/reassignment of a
  linked active appointment MUST reject overlap with an active appointment for the same lawyer and
  MUST preserve active unassigned public consultation-slot exclusivity in either write order.
- **FR-004**: Conflict validation and appointment writes MUST behave atomically under concurrent
  requests and MUST exclude the appointment being rescheduled from self-conflict checks. A retry
  MUST NOT replay an external payment-provider or other non-transactional side effect.
- **FR-005**: Appointment conflicts MUST return a stable conflict code and a localized recovery
  message without changing existing records.
- **FR-006**: One canonical admin route registry MUST define label, icon, group, destination, active
  matching, and required permissions.
- **FR-007**: Admin navigation and dashboard composition MUST be derived from the authenticated
  principal's permissions while server-side guards remain authoritative.
- **FR-008**: Every protected admin route MUST provide a consistent denied state or redirect that
  preserves valid navigation context.
- **FR-009**: The contact inbox MUST list, search, filter, paginate, review, and archive existing
  contact messages according to contact permissions.
- **FR-010**: Contact-message states and new-item counts MUST be available from the dashboard and
  contact inbox without exposing messages to unauthorized roles.
- **FR-011**: The notification center MUST combine generic notifications and consultation review
  work without double-counting and MUST support marking generic notifications read.
- **FR-012**: Generic notification read actions MUST be idempotent, owner-scoped, and reflected in
  the visible unread count after success; consultation review remains its existing separate
  business transition.
- **FR-013**: Authorized staff MUST be able to create a legal case for an existing client without a
  consultation conversion.
- **FR-014**: Authorized staff MUST be able to edit only approved case fields while existing status,
  assignment, ownership, and audit rules remain enforced. Changing `assignedLawyerId` requires
  `case.update.any`; assigned-scope actors cannot transfer a case.
- **FR-015**: Manual case create/edit MUST validate client state, assignee eligibility, file-number
  uniqueness, duplicate submission, and permissions before committing. Replay identity MUST bind
  the request token to the actor and a canonical hash of the normalized create payload.
- **FR-016**: Exact Super Admin users MUST be able to view roles, canonical permissions, and current
  role assignments.
- **FR-017**: Role-permission changes MUST be atomic, audited, restricted to canonical permissions,
  and reflected in subsequent authorization decisions.
- **FR-018**: Role-permission and admin-user role/status changes MUST prevent self-lockout and loss
  of the final active exact Super Admin administration path.
- **FR-019**: The admin home MUST present role-allowed priority queues for today's appointments,
  overdue/open tasks, consultation review, contact messages, and document review where data and
  permissions exist.
- **FR-020**: Every KPI and priority item MUST provide a direct, authorized drill-down action.
- **FR-021**: Dashboard sections MUST degrade independently when one data source fails, with no raw
  internal error text exposed.
- **FR-022**: Dashboard API responses MUST expose purpose-built fields only and MUST NOT serialize
  unused legal, contact, or internal record fields.
- **FR-023**: Storage settings controlled by server environment MUST be displayed as read-only
  diagnostics and MUST NOT claim a runtime change after saving unrelated governance settings.
- **FR-024**: The admin shell MUST provide discoverable, keyboard-operable mobile navigation for
  all authorized destinations without horizontal page overflow.
- **FR-025**: Repeated forms MUST use unique control, help, and error identifiers while preserving
  stable field names for submission.
- **FR-026**: Shared table and filter primitives MUST support descriptive captions, column scope,
  named search regions, and mobile record alternatives.
- **FR-027**: Admin loading, empty, partial, success, warning, conflict, denied, and error states MUST
  preserve shell context and offer an appropriate next action.
- **FR-028**: User-facing statuses, permission denials, validation errors, and internal exceptions
  MUST use existing Arabic display/message helpers or new semantic tokens in the same system.
- **FR-029**: Existing design components and tokens MUST be reused or consolidated; no parallel
  design system or new UI/chart dependency may be introduced.
- **FR-030**: Contract documentation MUST match every affected method, path, permission key,
  request/response shape, status code, and consumer.
- **FR-031**: Automated contract validation MUST detect documented permissions or operations that
  do not exist and implemented operations absent from the affected contract inventory.
- **FR-032**: Focused tests MUST cover allowed and denied roles, canonical scopes, conflicts,
  idempotency, duplicate submissions, DTO minimization, localization, and partial failures.
- **FR-033**: Database-backed and browser tests MUST cover dashboard drill-down, calendar conflict,
  contact triage, notifications, manual case creation, role changes, and mobile navigation.
- **FR-034**: Visual and accessibility evidence MUST cover 390px mobile and desktop layouts,
  keyboard navigation, RTL, focus, labels, alerts, empty/error states, and no horizontal overflow.
- **FR-035**: Delivery status MUST distinguish implemented, locally verified, DB-verified,
  live-accepted, blocked, skipped, and deferred work. Missing disposable PostgreSQL MAY defer only
  database-dependent evidence while local implementation continues; it MUST keep the affected DB
  tasks and story/release checkpoints open, and production data MUST NOT be used as test data.
- **FR-036**: The master platform task list MUST point to this feature task set without duplicating
  individual tasks or IDs.
- **FR-037**: Existing admin-user list, create, detail, and update APIs MUST return purpose-built
  safe DTOs and MUST never serialize `passwordHash`, encrypted TOTP secrets, recovery-code secrets,
  or whole credential records.
- **FR-038**: Password login and session loading MUST reject non-active/deleted users and inactive
  roles without creating a session. A user
  role/status mutation MUST revoke the target user's active sessions when access changes and MUST
  enforce the final-active-exact-Super-Admin invariant atomically with the mutation and audit.
  Delegated `user.manage.any` MUST NOT permit targeting or assigning protected system roles or an
  editable role whose effective permissions are not a subset of the actor's own permissions.

### Key Entities

- **Dashboard Snapshot**: Permission-scoped metrics, priority queues, definitions, destinations,
  and per-section availability/error state.
- **Admin Route Policy**: Canonical route metadata and permission requirements used by navigation,
  labels, and page access UX.
- **Appointment**: Scheduled office event whose active time interval must not overlap for one lawyer.
- **Task**: Work item visible by direct assignment or related case assignment under canonical scope.
- **Contact Message**: Public lead with new, reviewed, and archived lifecycle.
- **Notification**: In-app alert with recipient, read state, destination, and source relationship.
- **Legal Case**: Client matter with unique file identity, assignment, status, and audited changes.
- **Role Permission Assignment**: Canonical permission membership for a role with governance guards.
- **Admin User and Session**: A safe governance projection plus an authenticated principal whose
  user, role, and session must all remain active and nondeleted.
- **Storage Diagnostic**: Read-only representation of effective server-owned upload policy.
- **Acceptance Evidence**: Named check, environment, outcome, timestamp, and artifact/reference.

## Success Criteria

### Measurable Outcomes

- **SC-001**: For every role fixture, dashboard counts and destination lists agree for 100% of
  directly assigned and case-inherited tasks and appointments.
- **SC-002**: 100% of overlapping appointment create/reschedule attempts are rejected without a
  partial write, including concurrent attempts and self-reschedule exclusion.
- **SC-003**: For all five staff roles, visible navigation destinations and dashboard actions match
  direct authorization outcomes with zero inaccessible links shown.
- **SC-004**: Authorized staff can find and classify a new contact message within two navigation
  actions from the admin shell.
- **SC-005**: Generic notification unread counts and read actions remain correct after repeated
  actions and page refreshes in all tested role scenarios.
- **SC-006**: Authorized staff can create a case for an existing client and reach its detail view in
  under three minutes without creating a consultation first.
- **SC-007**: Every unsafe role-permission update in the defined lockout scenarios is rejected with
  zero partial permission changes.
- **SC-008**: Every dashboard metric and priority item displays its timeframe/definition and has a
  working, authorized drill-down destination.
- **SC-009**: At 390px and desktop widths, all touched admin journeys have no page-level horizontal
  overflow and all authorized navigation destinations are keyboard discoverable.
- **SC-010**: No touched admin surface exposes raw enum values, permission keys, internal exception
  text, or unlocalized conflict/validation messages to users.
- **SC-011**: All affected contract operations and permission keys match implementation and pass
  automated bidirectional contract validation.
- **SC-012**: Every functional requirement maps to at least one executable task and one acceptance
  check; all required checks report PASS, BLOCKED, or SKIPPED truthfully, with zero required skips
  counted as release acceptance.
- **SC-013**: Across admin-user list/create/detail/update responses, zero credential secrets are
  serialized; after suspension, deletion, or role deactivation/change, 100% of affected active
  sessions are rejected, and no mutation can remove the final active exact Super Admin.

## Assumptions

- Existing authentication, sessions, Prisma models, audit logging, admin-user governance,
  contact-message APIs, notification services, design primitives, and Arabic message helpers will
  be extended.
- No new database entity or third-party dependency is required; any discovered schema need must
  trigger a specification and planning update before implementation.
- Contact messages remain an office review queue; automatic CRM-client or case creation from a
  contact message is deferred.
- Generic in-app notifications are user-specific; email, SMS, WhatsApp, push, quiet hours, and
  preference management remain deferred.
- Manual case creation is available to roles granted the approved case-create permission and uses
  existing client and lawyer records.
- Role-permission management is restricted to exact Super Admin users and the canonical policy
  catalog.
- Protected admin UI remains Arabic-first; full English admin localization is deferred.
- Existing payments, public booking, client portal, and Stitch clone behavior must not change.
- The current workstation has no disposable PostgreSQL target and no database installation is
  authorized. Local-only implementation is therefore allowed under FR-035, while database-backed
  acceptance remains deferred to a future isolated environment.
