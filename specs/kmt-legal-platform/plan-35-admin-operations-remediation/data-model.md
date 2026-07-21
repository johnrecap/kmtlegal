# PLAN-35 Data Model and State Design

**Date**: 2026-07-22

## Schema decision

PLAN-35 reuses existing persistent entities. No Prisma model, column, enum, or relationship change
is planned. A **data-only** Prisma migration may upsert the new permission key and initial role
grants; it must not alter `prisma/schema.prisma`. If implementation discovers a required schema
change, work stops, the feature specification and this document are revised, migration/rollback
effects are analyzed, and the Spec Kit gates run again.

The source of runtime truth after RBAC bootstrap is PostgreSQL `RolePermission`, not the JSON
default catalog. JSON remains the canonical list of valid keys and bootstrap defaults.

## Existing persistent entities

### Role, Permission, and RolePermission

| Field or relation | Existing rule | PLAN-35 rule |
|---|---|---|
| `Role.name` | Unique canonical role name | `Guest`, `Client`, and `Super Admin` are protected; four staff roles are editable |
| `Role.status` | `ACTIVE` or existing role status | Inactive roles cannot be used as mutation targets without an explicit later specification |
| `Role.updatedAt` | Optimistic version source | Client sends the observed value; stale governance update returns `409` |
| `Permission.key` | Unique string | Must exist in `policy-data.json`; add `case.create.any` through a data-only migration |
| `RolePermission(roleId, permissionId)` | Composite primary key | Editable role assignments are atomically replaced; an empty set is valid and remains empty |

**Bootstrap invariants**:

- Catalog roles and permissions are idempotently upserted.
- The PLAN-35 data migration grants `case.create.any` to Secretary and Office Admin and
  `notification.read.self` to all four editable staff roles when those role rows already exist;
  Super Admin remains an exact-role wildcard.
- Use an existing `SystemSetting` row such as `auth.rbac_assignments_bootstrap` as a non-secret
  bootstrap marker. The migration creates it only when an existing `RolePermission` set proves the
  database was already seeded. A fresh database receives no marker during migration; its first seed
  creates all current defaults and then the marker.
- Once the marker exists, a repeat production seed upserts catalog roles/permissions only and does
  not recreate an editable role assignment removed after bootstrap. New default grants on an
  existing database require an explicit data migration.
- Before the marker, initial bootstrap creates roles as active. After the marker, role status is
  runtime-owned; repeat seed must not reactivate an inactive existing role.
- `principalFromUser` uses the persisted array even when it is empty. Policy defaults are only a
  controlled bootstrap/test fallback when no database principal has been loaded.
- At least one active exact Super Admin user remains; protected roles cannot be changed through the
  role-permission endpoint.

### User and Session

Existing `User`, `Role`, `Session`, and `TwoFactorCredential` rows are reused. Admin-user routes
return explicit projections, never a Prisma entity spread:

```text
AdminUserListItem = {
  id, email, name, phone, locale, status, createdAt, updatedAt,
  role: { id, name },
  twoFactor: { recoveryState, enabledAt, lastVerifiedAt } | null,
  counts: { sessions, auditLogs, assignedCases, assignedTasks }
}
AdminUserDetail = AdminUserListItem & {
  rolePermissionKeys, safeSessions, safeAuditRows, clientProfile?, lawyerProfile?
}
```

`passwordHash`, `TwoFactorCredential.secretEncrypted`, recovery-code material, token hashes, and
whole credential/session/user records are forbidden from both shapes. `safeSessions` contains only
the existing operational session metadata accepted by the admin detail UI, never token hashes.

Password login and an authenticated principal are valid only when `User` is `ACTIVE` with
`deletedAt = null` and `Role.status = ACTIVE`; principal loading additionally requires `Session` to
be live/not revoked/not expired. Rejected login creates no session. A role or access-status change revokes
all active sessions for the target user in the same transaction. Before suspending, deleting, or
demoting an exact Super Admin, the transaction locks/rechecks that another active, nondeleted exact
Super Admin exists; otherwise it returns `409` with no mutation or audit row.

A non-Super-Admin principal granted `user.manage.any` can target/assign only active Lawyer,
Secretary, Office Admin, and Marketing Staff roles when both the target's current role permissions
and requested role permissions are subsets of the actor's current effective permissions. The
single-attempt serializable transaction rereads all three sets and conditionally claims the supplied
`User.updatedAt`; concurrent user/role-policy changes return `409` and are not replayed. Protected target/assignment roles (`Super Admin`, `Client`, and
`Guest`) or any cross-ceiling operation require an exact active Super Admin; `Guest` remains excluded
from direct assignment.

### Appointment

Existing fields used: `id`, `lawyerId`, `caseId`, `type`, `status`, `startsAt`, `endsAt`, and audit
relations.

**Interval rule**: appointments use half-open intervals `[startsAt, endsAt)`. Two appointments
overlap when `existing.startsAt < candidate.endsAt` and `existing.endsAt > candidate.startsAt`.
Touching boundaries are allowed.

**Blocking statuses**: `RESERVED`, `SCHEDULED`, and `RESCHEDULED`.

**Scopes**:

- Admin create/reschedule: same `lawyerId` and a blocking status, plus any overlapping active
  unassigned appointment with `consultationRequestId != null` so public reservation ordering is
  symmetric.
- Consultation assignment/reassignment: when a linked appointment is blocking, validate the
  proposed `lawyerId` against the same-lawyer scope before updating both records.
- Public consultation booking: preserve the existing office/consultation-slot exclusivity behavior.
- Reschedule: excludes the current `Appointment.id`.

**Write invariant**: conflict check and create/update occur in one serializable transaction. On an
unresolved serialization race, no record changes and the API returns the stable conflict outcome.
Only database-only create/conversion callbacks may use bounded replay. Reschedule and consultation
assignment update existing rows and therefore use a single attempt on serialization conflict so a
retry cannot overwrite a concurrent update. Paid public booking makes one hosted-checkout call
maximum and does not automatically replay its callback. Admin
create/reschedule, consultation assignment/reassignment, and consultation conversion persist audit
data in the appointment transaction; public booking preserves its existing post-commit best-effort
audit behavior.

### LegalCase and CaseParty

Existing fields used: `id`, unique `internalFileNumber`, `clientId`, `assignedLawyerId`, optional
`consultationRequestId`, `title`, `caseType`, `courtName`, optional `externalCaseNumber`, `status`,
`priority`, `summary`, `parties`, timestamps, and soft-delete marker.

**Manual create invariants**:

- Client exists, is active, and is not deleted.
- Assigned lawyer is an active eligible lawyer.
- Initial status is `NEW`.
- `internalFileNumber` is generated through one shared reference generator and is unique.
- Optional initial parties use existing `CaseParty` validation; full party management is out of
  scope.
- A client-generated UUID request token is required and is used as the new `LegalCase.id`. The
  existing primary-key uniqueness is the atomic replay/concurrency guard. The normalized accepted
  create payload is serialized with stable key ordering, trimmed strings, canonical null/omitted
  handling, and submitted party order, then SHA-256 hashed. If the ID already exists, only a
  matching same-actor, same-token, same-hash creation audit returns the original case; a mismatched
  actor or body returns conflict. Replay matching uses `AuditLog.resourceId = LegalCase.id` and
  `AuditLog.actorId`; only `requestHash` is stored in redacted metadata, avoiding the existing
  token-key redaction rule. No new persistent entity is added.
- Different request tokens are not treated as semantic duplicates. Existing generated
  `internalFileNumber` uniqueness remains the only independent case-reference uniqueness rule.
- Case, initial parties, idempotency/audit metadata, and audit event commit or roll back together.

**Editable core fields**: `title`, `caseType`, `courtName`, `externalCaseNumber`, `priority`, and
`summary` for any actor in approved update scope. Changing eligible `assignedLawyerId` additionally
requires `case.update.any`; `case.update.assigned` can never transfer a case. Status remains on the existing dedicated transition
endpoint. `clientId`, `consultationRequestId`, `internalFileNumber`, and audit fields are immutable
through core edit. The conditional `updatedAt` claim, core update, and redacted before/after audit
row share one transaction; stale version or audit failure changes nothing.

### ContactMessage

Existing states: `NEW`, `REVIEWED`, `ARCHIVED`.

| From | Allowed next state | Repeated same state |
|---|---|---|
| `NEW` | `REVIEWED`, `ARCHIVED` | Idempotent success, no duplicate audit event |
| `REVIEWED` | `ARCHIVED` | Idempotent success, no duplicate audit event |
| `ARCHIVED` | none | Idempotent only when request is also `ARCHIVED`; otherwise `409` |

`contact.read.any` permits list/detail visibility. `contact.manage.any` is required for transitions.
Queue DTOs expose only operational contact fields, never unrelated user/client records.
Transitions use a conditional observed-status claim plus direct audit in one transaction. Two
identical concurrent requests produce one transition/audit and one idempotent same-state result;
audit failure or a conflicting/invalid target changes nothing.

### Notification and ConsultationRequest projection

Persistent records remain separate. PLAN-35 defines a derived `NotificationCenterSnapshot`:

```text
genericUnreadCount: number
consultationReviewCount: number
attentionCount: number
items: NotificationCenterItem[]
nextCursor: string | null
```

`attentionCount = unread generic items not duplicated by a consultation reference + visible
unreviewed consultations`.

`NotificationCenterItem` is discriminated by `kind`:

- `generic`: notification ID, semantic type, title/message display tokens, created time, safe href,
  and `isRead`; owner-only mark-read.
- `consultation-review`: consultation ID, reference, safe applicant display data, scheduled time,
  created time, and authorized review href; cleared only by consultation review semantics.

Deduplication key is `(resourceType, resourceId)`. Generic read is idempotent. Cross-user IDs are
reported as not found to avoid confirming another user's notification.

Counts use the complete permission-scoped sets before item pagination. The bell is a bounded recent
preview. The center is ordered by `createdAt desc`, then `kind asc`, then `id asc`, and uses an
opaque cursor for that last projected tuple; `pageSize` is 1–50. Deduplication is stable across
source fetch boundaries, so following `nextCursor` produces every visible item once.

Generic hrefs pass an internal `/admin` relative-path allowlist. Absolute, protocol-relative,
script/data, control-character, and invalid URLs fall back to the canonical route for the semantic
resource type. The current principal must also pass the canonical route capability for the resolved
path, and a dynamic resource path must pass its canonical object-scope lookup. After permission
removal or object reassignment, projection uses an authorized semantic list,
`/admin/notifications`, or no action rather than an inaccessible resource URL.

### Setting and runtime storage diagnostic

The existing `Setting`/`SystemSetting` row may contain legacy `storage.policy` data, but it is not
the effective runtime source. A derived `StorageRuntimeDiagnostic` contains safe non-secret fields:

```text
source: "environment"
status: "configured" | "unavailable" | "degraded"
driver: "vps-filesystem"
maxUploadMb: number
allowedTypes: string[]
uploadsPathConfigured: boolean
rootStatus: "valid-writable" | "invalid" | "unwritable"
scannerMode: "required" | "optional-disabled"
scannerStatus: "reachable" | "disabled" | "unreachable"
checkedAt: ISO timestamp
editable: false
```

`configured` requires `rootStatus = valid-writable` and every required scanner to be reachable.
`degraded` is allowed only for an explicitly permitted nonproduction disabled scanner with a valid
root. Invalid/unwritable roots and unreachable required scanners are `unavailable`. Derivation runs
once per settings load, does not poll, and uses the existing scanner ping with a maximum two-second
bound when scanning is required. It never returns the absolute private path, credentials, secret
scanner configuration, or the legacy database row's value/update metadata. A PATCH attempt for the
environment-owned policy returns `SETTING_READ_ONLY`.

The settings response excludes the legacy `storage.policy` row from its generic `settings` array;
the safe diagnostic above is the only returned representation of that environment-owned policy.

### AuditLog

Existing audit fields are reused. PLAN-35 adds cataloged actions, without schema changes, for:

- manual case created and core details updated,
- role permissions replaced,
- contact message reviewed/archived where not already cataloged,
- appointment conflict rejection only if the project audit policy records rejected mutations.

Metadata contains IDs, semantic before/after values, the redaction-safe `requestHash` (never the
`requestToken`), and reason codes only. It must not contain contact bodies, case summaries, secrets,
or raw exception text.

## Derived application models

### AdminRoutePolicy

Not persisted. One entry contains:

```text
id, href, activeMatch, group, labelKey, icon, requiredAnyPermissions,
requiredAllPermissions?, exactRole?, staffFallback
```

The predicate is evaluated against the authenticated principal. It drives visibility only; the page
and API execute independent authoritative guards.

### DashboardSnapshotV1

Not persisted. Shape:

```text
version: 1
generatedAt: ISO timestamp
metrics: DashboardMetric[]
prioritySections: DashboardSection[]
quickActionRouteIds: string[]
recentActivity: safe bounded rows
```

`DashboardMetric`: semantic key, numeric value, Arabic label/definition token, timeframe, scope
label token, and authorized route/filter href. It is a discriminated result:

```text
ReadyMetric       = { state: "ready", value: number, ...definition fields }
UnavailableMetric = { state: "unavailable", value: null, recoveryKey, ...definition fields }
```

Unauthorized metrics are omitted. `null` is reserved for a permitted loader failure, never a lack
of permission. Allowed `timeframe` values are `before-generated-at`, `cairo-today`, and
`as-of-generated-at`; allowed `scopeKey` values are `office-wide`, `actor-assigned`,
`actor-or-case-assigned`, and `actor-owned`. Each enum maps to an Arabic copy key.

The canonical metric inventory and relative order are fixed. An unauthorized metric is omitted and
the remaining metrics keep this order:

| Order | Metric key | Definition | Required capability | Timeframe | Permitted scope | Label/definition token stem | Exact href |
|---:|---|---|---|---|---|---|---|
| 1 | `appointments.today` | Active `SCHEDULED` or `RESCHEDULED` appointments in the Cairo-today half-open interval | `appointment.manage.any` or `appointment.read.assigned` | `cairo-today` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.appointmentsToday` | `/admin/calendar?from={cairoStartUtc}&to={cairoNextStartUtc}` |
| 2 | `tasks.overdue` | Non-completed tasks whose due date is before `generatedAt` | `task.manage.any`, `task.manage.assigned`, or `task.read.assigned` | `before-generated-at` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.overdueTasks` | `/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc` |
| 3 | `consultations.unreviewed` | `SCHEDULED` consultations that have not been reviewed at `generatedAt` | `consultation.review.any` or `consultation.review.assigned` | `as-of-generated-at` | `office-wide` or `actor-assigned` | `admin.dashboard.metrics.unreviewedConsultations` | `/admin/consultations?status=SCHEDULED&review=unreviewed` |
| 4 | `contacts.new` | Contact messages in `NEW` state at `generatedAt` | `contact.read.any` or `contact.manage.any` | `as-of-generated-at` | `office-wide` | `admin.dashboard.metrics.newContacts` | `/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=asc` |
| 5 | `documents.under-review` | Documents in `UNDER_REVIEW` state at `generatedAt` | `document.manage.any` or `document.read.assigned` | `as-of-generated-at` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.documentsUnderReview` | `/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc` |
| 6 | `cases.active` | Cases in `ACTIVE` state at `generatedAt` | `case.read.any` or `case.read.assigned` | `as-of-generated-at` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.activeCases` | `/admin/cases?status=ACTIVE&sortBy=updatedAt&sortDirection=desc` |
| 7 | `clients.active` | Clients in `ACTIVE` state at `generatedAt` | `client.read.any` or `client.read.assigned` | `as-of-generated-at` | `office-wide` or `actor-assigned` | `admin.dashboard.metrics.activeClients` | `/admin/clients?status=ACTIVE&sortBy=createdAt&sortDirection=desc` |

For each token stem, append `.label` and `.definition`. Capability and object-scope predicates are
the same predicates used by the destination service; a metric never widens its permitted scope.

Canonical quick actions are filtered by the route registry and retain this fixed relative order:

| Order | Route ID |
|---:|---|
| 1 | `cases.create` |
| 2 | `calendar.list` |
| 3 | `contacts.list` |
| 4 | `content.home` |
| 5 | `roles.list` |

At most five actions are emitted; the first remaining action is the primary action. The array
contains route IDs only, so hrefs and labels always resolve through the canonical route registry.

`DashboardSection`: semantic key, `ready | unavailable`, bounded items (maximum six), authorized
fallback href, and safe retry/recovery token. A source error creates `unavailable`; lack of
permission omits the section entirely.

Dashboard time boundaries use `Africa/Cairo`. `cairo-today` is the half-open interval from Cairo
00:00 through the next Cairo 00:00, converted to UTC for database filters. `generatedAt` is the
cutoff for overdue/current-state metrics.

Permitted priority section order is fixed; unauthorized sections are removed without reordering the
remaining entries:

1. `tasks.overdue`: `URGENT`, `HIGH`, `NORMAL`, `LOW`; then `dueDate` ascending; then ID.
2. `appointments.today`: `startsAt` ascending; then ID.
3. `consultations.unreviewed`: `createdAt` ascending; then ID.
4. `contacts.new`: `createdAt` ascending; then ID.
5. `documents.under-review`: `updatedAt` ascending; then ID.

Every section has at most six items. Destination filters are exact:

- tasks: `/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc`
- appointments: `/admin/calendar?from={cairoStartUtc}&to={cairoNextStartUtc}`
- consultations: `/admin/consultations?status=SCHEDULED&review=unreviewed`
- contacts: `/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=asc`
- documents: `/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc`

`DashboardPriorityItem` is one of these purpose-built unions:

```text
TaskItem = {
  kind: "task", id, title, priority, status, dueAt, caseReference?, href
}
AppointmentItem = {
  kind: "appointment", id, title, status, mode, startsAt, clientDisplayName?, href
}
ConsultationReviewItem = {
  kind: "consultation-review", id, reference, applicantDisplayName, startsAt?, createdAt, href
}
ContactItem = {
  kind: "contact-message", id, senderDisplayName, topic, createdAt, href
}
DocumentReviewItem = {
  kind: "document-review", id, fileName, category, status, updatedAt, href
}
```

Safe mixed-direction strings use `DisplayValue = { text, dir: "auto" | "ltr" }`. No item includes a
full relation, contact body, legal summary/note, credential field, or raw error.

`recentActivity` is optional secondary content, maximum six, sorted `occurredAt desc, id asc`, and
uses only these unions:

```text
CaseActivity   = { kind: "case-updated", id, reference, title, status, occurredAt, href }
ClientActivity = { kind: "client-created", id, displayName, status, occurredAt, href }
ConsultationActivity = { kind: "consultation-created", id, reference, occurredAt, href }
```

## State transitions and concurrency

### Role permission update

1. Authenticate exact active Super Admin.
2. Validate protected-role rule, canonical unique keys, and observed `Role.updatedAt`.
3. Start transaction.
4. Claim the version with a conditional `Role` update on `id + updatedAt`; zero updated rows means
   stale conflict. This deliberately advances `Role.updatedAt` because relation changes alone do not.
5. Re-read the active exact Super Admin invariant, replace editable role links, and create the
   redacted audit event.
6. Commit; subsequent request/session load reads persisted assignments.

Stale version or invariant failure returns `409` with no partial link change.

### Appointment create/reschedule

1. Validate dates, active status, case/lawyer scope, and permissions.
2. Start serializable transaction.
3. Query blocking overlap using the appropriate scope and optional exclusion.
4. On overlap, abort with `APPOINTMENT_CONFLICT`.
5. Write appointment and audit data for admin/conversion writers; keep the existing public
   post-commit best-effort audit boundary.
6. Commit; map exhausted serialization race to the same recoverable conflict family.

Database-only create/conversion callbacks may use the bounded retry policy. Reschedule/assignment
updates and callbacks containing hosted checkout or another external side effect use a single
attempt, so `P2034` neither overwrites a concurrent update nor repeats the provider call.

### Manual case create

1. Validate schema, permission, referenced client/lawyer, and request token; normalize the accepted
   create body and compute its SHA-256 request hash.
2. Start transaction and recheck mutable references.
3. Look up `LegalCase.id = requestToken`; return it only when its creation audit has
   `resourceId = case.id`, matching `actorId`, and matching metadata `requestHash`; otherwise reject
   an ID collision/body mismatch.
4. Generate the internal file number from the reserved case UUID and current year.
5. Create the case with `id = requestToken` and optional initial parties.
6. Create the audit row directly through the same transaction and commit. A concurrent primary-key
   conflict re-enters the replay check rather than creating a second case.

## Retention, privacy, and deletion effects

- PLAN-35 does not change retention or soft-delete policy.
- Contact bodies and legal summaries remain server-side and are selected only for an authorized
  detail view.
- Notification and dashboard projections minimize fields and do not duplicate persistent PII.
- Role/audit records retain governance history according to existing policy.
- No public/client/payment/Stitch entity is migrated or rewritten.
