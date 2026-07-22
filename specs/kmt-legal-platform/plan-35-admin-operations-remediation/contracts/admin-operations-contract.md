# PLAN-35 Admin Operations Contract

**Date**: 2026-07-22

**Contract status**: Planning contract. Every row explicitly marks current behavior versus a
PLAN-35 addition. A planned item must not be described as implemented in platform status or live
acceptance until its route, service, authorization, and tests exist.

## Common HTTP conventions

Authenticated admin APIs use the existing no-store envelope:

```json
{ "data": {} }
```

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Arabic user-safe message",
    "details": [],
    "requestId": "uuid-or-forwarded-request-id"
  }
}
```

- `401 AUTH_REQUIRED` is the canonical unauthenticated result. Existing
  `UNAUTHENTICATED` call sites are normalized or explicitly retained by the contract test; the
  affected routes may not document both for the same condition.
- `403 PERMISSION_DENIED` means the authenticated principal lacks the required capability.
- `404 NOT_FOUND` is also used for an object outside the actor's ownership scope when returning 403
  would reveal its existence.
- `400 VALIDATION_ERROR` includes field-safe details and never a Zod/Prisma/raw exception.
- Existing generic `409 CONFLICT` remains valid for unaffected conflicts.
- Planned stable additions: `409 APPOINTMENT_CONFLICT`, `409 CASE_REFERENCE_CONFLICT`, and
  `409 SETTING_READ_ONLY`.
- Mutating responses are `Cache-Control: no-store` and emit an audit event when specified.

## Affected route inventory

| Method and path | Status before PLAN-35 | PLAN-35 behavior | Authorization |
|---|---|---|---|
| `POST /api/auth/login` | Current, hardened | Generic rejection and no session for non-active/deleted user or inactive role | Public credential exchange; valid active principal only |
| `GET /api/auth/me` | Current, hardened representative | No auth context for revoked/expired session or non-active/deleted user/inactive role | Current valid session and active principal |
| `GET /api/admin/dashboard` | Current, extended | Purpose-built role-scoped snapshot with independent widget states | Any authenticated staff; every metric/section applies its domain permission and scope |
| `GET /api/admin/calendar` | Current, scope-aligned | Uses canonical appointment visibility | `appointment.manage.any`, `appointment.read.assigned`, or `case.read.assigned` |
| `POST /api/admin/calendar` | Current, extended | Atomic same-lawyer overlap rejection | `session.manage.any` or `session.manage.assigned` with case scope |
| `POST /api/admin/calendar/{appointmentId}/reschedule` | Current, extended | Atomic overlap rejection excluding self | `appointment.manage.any` or `session.manage.assigned` with object scope |
| `POST /api/admin/consultations/{consultationId}/assign` | Current, extended | Linked active appointment is conflict-checked before lawyer assignment | `consultation.review.any` |
| `GET /api/admin/contact-messages` | Current, extended | Existing query contract plus minimized stable DTO | `contact.read.any` or `contact.manage.any` |
| `PATCH /api/admin/contact-messages/{messageId}` | Current, extended | Enforced state machine and idempotent same-state behavior | `contact.manage.any` |
| `GET /api/admin/notifications` | Current, extended | Unified generic/review projection and truthful counts | `notification.read.self`; consultation items additionally require `consultation.review.any` or `consultation.review.assigned` |
| `POST /api/admin/notifications/{notificationId}/read` | Current, extended | Owner-only idempotent generic mark-read | `notification.read.self` |
| `GET /api/admin/cases` | Current, scope-aligned | Uses canonical case visibility; advertises create action only when allowed | `case.read.any` or `case.read.assigned` |
| `POST /api/admin/cases` | Implemented by PLAN-35 | Manual, audited, idempotent case create | `case.create.any` |
| `GET /api/admin/cases/{caseId}` | Current | Existing scoped detail | `case.read.any` or `case.read.assigned` with object scope |
| `PATCH /api/admin/cases/{caseId}` | Implemented by PLAN-35 | Core-field edit only; status remains separate | `case.update.any` or `case.update.assigned` with object scope |
| `GET /api/admin/roles` | Implemented by PLAN-35 | Protected/editable role matrix and canonical permission catalog | Exact active Super Admin plus `role.manage.any` and `permission.manage.any` |
| `PATCH /api/admin/roles/{roleId}/permissions` | Implemented by PLAN-35 | Atomic replacement with stale-write protection and audit | Exact active Super Admin plus `role.manage.any` and `permission.manage.any` |
| `GET /api/admin/users` | Current, hardened | Purpose-built paginated safe-user DTOs only | `user.manage.any`; protected-target metadata is nonactionable for delegated managers |
| `POST /api/admin/users` | Current, hardened | Purpose-built create DTO; protected-role assignment restricted | Exact active Super Admin and `user.manage.any` |
| `GET /api/admin/users/{userId}` | Current, hardened | Purpose-built safe detail DTO only | `user.manage.any`; exact active Super Admin required for a protected-role target |
| `PATCH /api/admin/users/{userId}` | Current, hardened | Atomic final-Super-Admin guard, session revocation, safe DTO | `user.manage.any`; exact active Super Admin required for a protected-role target/assignment |
| `GET /api/admin/settings` | Current, extended | Includes safe effective storage diagnostic | `settings.manage.any` |
| `PATCH /api/admin/settings/storage.policy` | Current generic key route, constrained | Rejects environment-owned storage mutation | `settings.manage.any`, then `409 SETTING_READ_ONLY` |

## GET `/api/admin/dashboard`

### Response: `DashboardSnapshotV1`

```json
{
  "data": {
    "version": 1,
    "generatedAt": "2026-07-22T10:00:00.000Z",
    "metrics": [
      {
        "key": "tasks.overdue",
        "state": "ready",
        "value": 8,
        "labelKey": "admin.dashboard.metrics.overdueTasks.label",
        "definitionKey": "admin.dashboard.metrics.overdueTasks.definition",
        "timeframe": "before-generated-at",
        "timeframeLabelKey": "admin.dashboard.timeframe.beforeGeneratedAt",
        "scopeKey": "actor-or-case-assigned",
        "scopeLabelKey": "admin.dashboard.scope.actorOrCaseAssigned",
        "href": "/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc"
      }
    ],
    "prioritySections": [
      {
        "key": "tasks.overdue",
        "state": "ready",
        "items": [],
        "href": "/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc"
      },
      {
        "key": "documents.under-review",
        "state": "unavailable",
        "items": [],
        "href": "/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc",
        "recoveryKey": "admin.dashboard.sectionUnavailable"
      }
    ],
    "quickActionRouteIds": ["cases.create"],
    "recentActivity": []
  }
}
```

Rules:

- Omit an unauthorized metric/section/action. `null` does not represent permission denial.
- A permitted metric is exactly `state: ready` with numeric `value`, or `state: unavailable` with
  `value: null` and `recoveryKey`; both variants retain definition/timeframe/scope/href fields.
- A source failure produces only that authorized section's `unavailable` state; unrelated sections
  stay usable.
- Each queue contains at most six items and selects display fields only.
- Every ready metric/queue href points to an authorized destination with equivalent filters/scope.
- Time boundaries use `Africa/Cairo`. `cairo-today` is Cairo midnight to the next Cairo midnight,
  converted to UTC; `before-generated-at` and `as-of-generated-at` use the response cutoff.
- Allowed timeframe-to-copy mappings are
  `before-generated-at -> admin.dashboard.timeframe.beforeGeneratedAt`,
  `cairo-today -> admin.dashboard.timeframe.cairoToday`, and
  `as-of-generated-at -> admin.dashboard.timeframe.asOfGeneratedAt`.
- Allowed scope-to-copy mappings are
  `office-wide -> admin.dashboard.scope.officeWide`,
  `actor-assigned -> admin.dashboard.scope.actorAssigned`,
  `actor-or-case-assigned -> admin.dashboard.scope.actorOrCaseAssigned`, and
  `actor-owned -> admin.dashboard.scope.actorOwned`.
- Full Prisma models, internal notes, contact bodies, phone numbers not required by the item,
  permission keys, and raw errors are forbidden.
- Canonical domain capabilities:
  - cases: `case.read.any | case.read.assigned`
  - consultations: `consultation.review.any | consultation.review.assigned`
  - appointments: `appointment.manage.any | appointment.read.assigned`
  - tasks: `task.manage.any | task.manage.assigned | task.read.assigned`
  - documents: `document.manage.any | document.read.assigned`
  - contacts: `contact.read.any | contact.manage.any`

There is deliberately no `dashboard.read.any` permission in PLAN-35.

Metrics are emitted in this fixed relative order after unauthorized metrics are omitted:

| Metric key | Exact definition | Required capability | Timeframe | Permitted scope | Label/definition token stem | Exact href |
|---|---|---|---|---|---|---|
| `appointments.today` | Active `SCHEDULED` or `RESCHEDULED` appointments in Cairo today | `appointment.manage.any` or `appointment.read.assigned` | `cairo-today` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.appointmentsToday` | `/admin/calendar?from={cairoStartUtc}&to={cairoNextStartUtc}` |
| `tasks.overdue` | Non-completed tasks due before `generatedAt` | `task.manage.any`, `task.manage.assigned`, or `task.read.assigned` | `before-generated-at` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.overdueTasks` | `/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc` |
| `consultations.unreviewed` | `SCHEDULED` and unreviewed consultations at `generatedAt` | `consultation.review.any` or `consultation.review.assigned` | `as-of-generated-at` | `office-wide` or `actor-assigned` | `admin.dashboard.metrics.unreviewedConsultations` | `/admin/consultations?status=SCHEDULED&review=unreviewed` |
| `contacts.new` | Contact messages in `NEW` state at `generatedAt` | `contact.read.any` or `contact.manage.any` | `as-of-generated-at` | `office-wide` | `admin.dashboard.metrics.newContacts` | `/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=asc` |
| `documents.under-review` | Documents in `UNDER_REVIEW` state at `generatedAt` | `document.manage.any` or `document.read.assigned` | `as-of-generated-at` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.documentsUnderReview` | `/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc` |
| `cases.active` | Cases in `ACTIVE` state at `generatedAt` | `case.read.any` or `case.read.assigned` | `as-of-generated-at` | `office-wide` or `actor-or-case-assigned` | `admin.dashboard.metrics.activeCases` | `/admin/cases?status=ACTIVE&sortBy=updatedAt&sortDirection=desc` |
| `clients.active` | Clients in `ACTIVE` state at `generatedAt` | `client.read.any` or `client.read.assigned` | `as-of-generated-at` | `office-wide` or `actor-assigned` | `admin.dashboard.metrics.activeClients` | `/admin/clients?status=ACTIVE&sortBy=createdAt&sortDirection=desc` |

Append `.label` and `.definition` to each token stem. Canonical quick actions are filtered through
the same route policy and retain this exact order: `cases.create`, `calendar.list`, `contacts.list`,
`content.home`, `roles.list`. Emit at most five; the first remaining action is primary. No action
may carry an ad-hoc href or label outside the route registry.

Priority sections are emitted in this fixed relative order after unauthorized sections are omitted:

| Section key | Item order | Exact fallback/drill-down href |
|---|---|---|
| `tasks.overdue` | priority `URGENT,HIGH,NORMAL,LOW`, then `dueDate asc`, then `id asc` | `/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc` |
| `appointments.today` | `startsAt asc`, then `id asc` | `/admin/calendar?from={cairoStartUtc}&to={cairoNextStartUtc}` |
| `consultations.unreviewed` | `createdAt asc`, then `id asc` | `/admin/consultations?status=SCHEDULED&review=unreviewed` |
| `contacts.new` | `createdAt asc`, then `id asc` | `/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=asc` |
| `documents.under-review` | `updatedAt asc`, then `id asc` | `/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc` |

The only priority-item unions are:

```text
TaskItem = { kind: "task", id, title, priority, status, dueAt, caseReference?, href }
AppointmentItem = { kind: "appointment", id, title, status, mode, startsAt, clientDisplayName?, href }
ConsultationReviewItem = { kind: "consultation-review", id, reference, applicantDisplayName, startsAt?, createdAt, href }
ContactItem = { kind: "contact-message", id, senderDisplayName, topic, createdAt, href }
DocumentReviewItem = { kind: "document-review", id, fileName, category, status, updatedAt, href }
```

Mixed-direction display fields use `{ text, dir: "auto" | "ltr" }`. `recentActivity` is optional,
maximum six, ordered `occurredAt desc, id asc`, and contains only:

```text
CaseActivity = { kind: "case-updated", id, reference, title, status, occurredAt, href }
ClientActivity = { kind: "client-created", id, displayName, status, occurredAt, href }
ConsultationActivity = { kind: "consultation-created", id, reference, occurredAt, href }
```

## Calendar conflict contract

### Candidate validation

- `startsAt` and `endsAt` are valid ISO timestamps and `endsAt > startsAt`.
- Admin scheduling may enforce future-time rules already accepted by the calendar service.
- Active blocking statuses are `RESERVED`, `SCHEDULED`, and `RESCHEDULED`.
- Intervals are half-open `[startsAt, endsAt)`: boundary touch is allowed.
- Admin conflict scope is the same lawyer plus any overlapping active unassigned appointment with
  `consultationRequestId != null`; public consultation scope preserves the current office-wide
  consultation-slot rule. This makes public-first/admin-first ordering equivalent while different
  assigned lawyers remain allowed.
- Consultation assignment/reassignment uses same-lawyer scope for its linked blocking appointment
  before changing that appointment's lawyer.
- Reschedule excludes `{appointmentId}` itself.

### Conflict response

```json
{
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "يوجد موعد آخر للمحامي في هذا التوقيت. اختر وقتًا مختلفًا.",
    "details": [],
    "requestId": "..."
  }
}
```

The check and write are one serializable transaction. A rejected or exhausted concurrent request
changes neither appointment. Different assigned lawyers and exact boundary contact are allowed. A
bounded whole-callback retry is allowed only for a proven database-only create/conversion writer.
Reschedule and linked-assignment updates use one attempt so a retry cannot overwrite a concurrent
update. Paid public booking makes exactly one hosted-checkout provider call; its callback is never
automatically replayed, and `P2034` maps to the recoverable conflict family. Admin create/reschedule and
consultation conversion write audit data in the appointment transaction; public booking preserves
its existing post-commit best-effort audit boundary.

Accepted deferred payment residual: provider success followed by database abort can leave one
unreachable checkout because the current provider call is inside the transaction. Emit the stable
privacy-safe observability event `payment.checkout_reconciliation_required` exactly once after the
provider succeeds and the database transaction fails. It MUST use `safeLog("error", event, metadata)`
with only `requestId`, `provider`, `paymentAttemptId`, optional `providerCheckoutId`,
`failureCode: "P2034"`, `retryPolicy: "single_attempt"`, and `source: "public_booking"`. The event
MUST NOT include checkout URL/token, names, phone/email, request body, case/consultation content, or
secrets. `paymentAttemptId` is generated before the callback and remains available if database work
rolls back. Orphan-free provider idempotency/outbox/two-phase behavior requires a separate payment
specification.

## Contact-message contracts

### GET query

Existing fields remain:

```text
q?: string (max 120)
status?: NEW | REVIEWED | ARCHIVED
topic?: canonical contact topic
sortBy?: createdAt | status | topic
sortDirection?: asc | desc
page?: integer >= 1
pageSize?: integer 1..80
```

Response includes `items`, `total`, normalized `filters`, `page`, and `pageSize`. Each item exposes
only `id`, safe sender contact fields, topic, message/preview needed for review, status, timestamps,
and safe reviewer identity.

### PATCH body and transitions

```json
{ "status": "REVIEWED" }
```

- `NEW -> REVIEWED | ARCHIVED`
- `REVIEWED -> ARCHIVED`
- Same-state replay is `200` and creates no duplicate audit event.
- `ARCHIVED -> REVIEWED` is `409 CONFLICT`.
- Reader-only principals receive `403` for mutation.
- A conditional source-status claim and direct audit insert share one transaction. Two identical
  concurrent transitions yield one state change/audit and one idempotent success; a different-target
  race, invalid reopen, or audit failure leaves state and audit unchanged.

## Notification contracts

### GET query

The bell preview accepts legacy `limit` from 1 to 10, default 5. The full center uses `pageSize`
from 1 to 50, default 20, plus an opaque `cursor`. Center ordering is `createdAt desc`, then
`kind asc`, then `id asc`; the returned `nextCursor` identifies the final deduplicated projected
tuple. Supplying both `limit` and `cursor/pageSize` is a validation error.

### Response

```json
{
  "data": {
    "genericUnreadCount": 2,
    "consultationReviewCount": 3,
    "attentionCount": 4,
    "nextCursor": "opaque-or-null",
    "items": [
      {
        "kind": "generic",
        "id": "uuid",
        "type": "TASK",
        "title": "...",
        "body": "...",
        "href": "/admin/tasks?...",
        "readAt": null,
        "createdAt": "..."
      },
      {
        "kind": "consultation-review",
        "id": "uuid",
        "reference": "CONS-12345678",
        "href": "/admin/consultations/uuid",
        "startsAt": "...",
        "createdAt": "..."
      }
    ]
  }
}
```

- Deduplicate on `(resourceType, resourceId)` when a generic notification points to a visible
  consultation review item.
- All three counts are computed from complete permission-scoped sets before preview/pagination.
  `attentionCount` equals unread nonduplicated generic items plus visible unreviewed consultations,
  including duplicates whose counterpart lies outside one source's first fetched page.
- Following `nextCursor` returns every visible center item exactly once with no gap or cross-page
  duplicate.
- A generic `actionUrl` is emitted only when it is a valid relative internal `/admin` path. Absolute,
  protocol-relative, `javascript:`, `data:`, control-character, and invalid values fall back to the
  canonical safe route for the semantic notification type. The resolved route must also pass the
  current principal's canonical route capability, and a known dynamic resource URL must pass its
  canonical object-scope lookup. After permission removal or object reassignment it falls back to
  an authorized semantic list, `/admin/notifications`, or no action rather than exposing a
  forbidden resource path.
- Generic mark-read does not complete consultation review.
- Consultation review resolution may mark its generated generic notification read as a downstream
  effect, but the review transition remains authoritative.
- POST mark-read is idempotent; a cross-user ID returns `404`.

## Manual case contracts

### POST `/api/admin/cases` — implemented

Request:

```json
{
  "requestToken": "client-generated-uuid",
  "clientId": "uuid",
  "assignedLawyerId": "uuid",
  "title": "...",
  "caseType": "...",
  "courtName": "...",
  "externalCaseNumber": "...",
  "priority": "NORMAL",
  "summary": "...",
  "parties": [
    { "name": "...", "partyType": "OPPOSING_PARTY", "notes": "..." }
  ]
}
```

Validation:

- Strict body; canonical existing priority enum and party types
  `CLIENT | OPPOSING_PARTY | WITNESS | EXPERT | OTHER` only.
- Active, nondeleted client; active eligible lawyer.
- Initial status `NEW`; server generates unique `internalFileNumber`.
- Optional initial parties only; full party CRUD and internal notes are out of scope.
- `requestToken` is used as the new case UUID so the existing primary key is the concurrency-safe
  replay guard; the server still generates the human-facing `internalFileNumber`.
- The accepted create body is normalized with stable field ordering, trimmed strings, canonical
  null/omitted handling, and submitted party order, then SHA-256 hashed. Replay matches
  `AuditLog.resourceId = case.id`, `AuditLog.actorId`, and metadata `requestHash`; token-like metadata
  keys are not used because existing audit redaction masks them.
- First success: `201` with `{ case, replayed: false }`.
- Same actor, `requestToken`, and canonical request hash replay: `200` with the original
  `{ case, replayed: true }`.
- An existing token/case without the matching creation actor/audit/hash, including same token with a
  different body, is `409 CONFLICT` and is never returned as a replay.
- Different request tokens are not treated as semantic duplicates; generated
  `internalFileNumber` uniqueness remains enforced. Its rare unique collision returns
  `409 CASE_REFERENCE_CONFLICT`; no record commits, and UI recovery preserves values, creates a new
  request UUID only after the user chooses retry, then resubmits.
- Validation, references, case, parties, redaction-safe `requestHash` audit metadata, and direct audit insert are
  atomic; the best-effort audit helper is not used.

### PATCH `/api/admin/cases/{caseId}` — implemented

Request is strict and must include `updatedAt` for optimistic concurrency. Allowed fields:

```text
title, caseType, courtName, externalCaseNumber, priority, summary, assignedLawyerId, updatedAt
```

Forbidden here: `status`, `clientId`, `internalFileNumber`, `consultationRequestId`, audit metadata,
and deletion. Status continues through the existing status endpoint. `assignedLawyerId` may change
only for `case.update.any`; an actor using `case.update.assigned` may update the other approved fields
while the case remains in scope but cannot transfer it to self or another lawyer. Stale `updatedAt`
returns `409 CONFLICT`. The version claim, update, and redacted before/after core-change audit row
commit in one transaction; stale version or audit failure leaves the case and audit log unchanged.

## Role and permission contracts

### GET `/api/admin/roles` — implemented by PLAN-35

Response:

```json
{
  "data": {
    "permissions": [
      { "key": "case.create.any", "groupKey": "cases", "labelKey": "..." }
    ],
    "roles": [
      {
        "id": "uuid",
        "name": "Secretary",
        "status": "ACTIVE",
        "protected": false,
        "effectiveWildcard": false,
        "userCount": 3,
        "permissionKeys": ["case.create.any"],
        "updatedAt": "..."
      }
    ]
  }
}
```

- Exact `Super Admin`, `Guest`, and `Client` rows are protected/read-only.
- Any inactive role is visible but read-only; PATCH returns `409 CONFLICT`. A marked repeat seed
  preserves inactive status and does not reactivate the row.
- Super Admin shows `effectiveWildcard: true`; stored links are not presented as editable truth.
- Permission labels/groups use the existing Arabic copy/token system; raw keys may be present in the
  payload for stable form submission but are not the only user-facing label.

### PATCH `/api/admin/roles/{roleId}/permissions` — implemented by PLAN-35

Request:

```json
{
  "permissionKeys": ["case.read.any", "case.create.any"],
  "updatedAt": "2026-07-22T10:00:00.000Z"
}
```

- Strict body, unique canonical keys only; an empty list is valid for an editable role.
- Exact active Super Admin actor required even if another role was manually granted management
  permissions.
- Protected target role returns `409 CONFLICT`.
- Stale `updatedAt` returns `409 CONFLICT`.
- The transaction conditionally advances the target `Role.updatedAt`; changing only relation rows
  without advancing the version does not satisfy this contract.
- Replacement and redacted audit event are atomic.
- A failed update leaves the previous assignment exactly intact.
- Subsequent request/session loading uses persisted rows; zero rows remain zero and seed reruns do
  not restore removed defaults.

## Admin-user and session hardening contract

The four affected admin-user operations return explicit `AdminUserListItem` or `AdminUserDetail`
projections. Allowed list/create/update response fields are:

```text
id, email, name, phone, locale, status, createdAt, updatedAt
role: { id, name }
twoFactor: { recoveryState, enabledAt, lastVerifiedAt } | null
counts: { sessions, auditLogs, assignedCases, assignedTasks }
```

Detail may additionally return exactly:

```text
rolePermissionKeys: string[]
safeSessions: { id, status, twoFactorVerifiedAt, expiresAt, revokedAt, ipAddress, createdAt }[]
safeAuditRows: {
  id, action, resourceType, resourceId, redactedMetadata,
  actor: { name, roleName }, createdAt
}[]
clientProfile?: { id, fullName, status }
lawyerProfile?: { id, title, isPublic, bookingEnabled }
```
Every operation explicitly excludes `passwordHash`, `secretEncrypted`, recovery-code material,
session token hashes, whole `TwoFactorCredential` records, and whole Prisma user/session entities.
The create request password is write-only and never appears in a response or audit payload.
The existing user PATCH body retains its strict editable fields and MUST additionally include the
observed `updatedAt` ISO timestamp returned by the DTO.

Target/assignment rules:

- An exact active Super Admin with `user.manage.any` may use the existing create operation and may
  manage active non-Guest role choices, subject to the final-Super-Admin invariant.
- A delegated actor who later receives `user.manage.any` may list safe rows and manage only users in
  active editable operational roles when both the target's current effective permission set and the
  requested role's set are subsets of the actor's current effective permissions. The service
  rechecks those sets in a single-attempt serializable mutation transaction. PATCH requires the
  observed `User.updatedAt` and conditionally claims that version; concurrent user or role-policy
  change returns `409 CONFLICT` and is not replayed. It cannot read protected-account detail, target
  a `Super Admin`, `Client`, or `Guest` account, assign those protected roles, or promote across the
  permission ceiling.
- `Guest` remains unavailable as a direct admin assignment. Creating/promoting to `Super Admin` or
  assigning `Client` is exact-Super-Admin-only.
- Before an exact Super Admin is suspended, deleted, or moved to another role, the transaction
  rechecks that a different active, nondeleted exact Super Admin remains. Concurrent attempts cannot
  both pass; failure is `409 CONFLICT` with no user/session/audit change.
- When `roleId`, `status`, or deletion access state changes, every active target session is revoked
  in the same transaction as the user update and audit. The next request using any old cookie is
  unauthenticated.
- Password login uses the same active-user/nondeleted/active-role rule before creating a session and
  returns the existing generic invalid-credentials outcome on failure. Session resolution itself
  returns no context unless session is live and the same user/role rule still holds.

## Storage diagnostic contract

`GET /api/admin/settings` MUST change its affected consumer contract from the current bare array to
this explicit wrapper; `settings` preserves the existing safe setting-row DTOs and
`storageRuntimeDiagnostic` is the required environment-owned member:

```json
{
  "data": {
    "settings": [],
    "storageRuntimeDiagnostic": {
      "source": "environment",
      "status": "configured",
      "driver": "vps-filesystem",
      "maxUploadMb": 5,
      "allowedTypes": ["application/pdf"],
      "uploadsPathConfigured": true,
      "rootStatus": "valid-writable",
      "scannerMode": "required",
      "scannerStatus": "reachable",
      "checkedAt": "2026-07-22T10:00:00.000Z",
      "editable": false
    }
  }
}
```

`data.settings` excludes the legacy `storage.policy` row entirely; its JSON value can contain an
absolute upload path, so it is not preserved as a redacted-looking generic row. The diagnostic is
the only storage-policy representation in the response.

`configured` requires a valid/writable private root and every required scanner reachable.
`degraded` is allowed only for an explicitly permitted nonproduction disabled scanner with a valid
root. Invalid/unwritable roots or an unreachable required scanner are `unavailable`. The derivation
runs once on settings load, performs no polling, and uses the existing bounded scanner ping with a
maximum two-second timeout only when required. It does not include an absolute path, secrets, or the
legacy `storage.policy` row's value, `updatedAt`, or `updatedBy`.

An attempt to patch the environment-owned key returns:

```json
{
  "error": {
    "code": "SETTING_READ_ONLY",
    "message": "إعدادات التخزين الفعلية تُدار من بيئة الخادم ولا يمكن تعديلها من لوحة التحكم.",
    "details": [],
    "requestId": "..."
  }
}
```

Changing a legacy database row must not change upload/download runtime behavior.

## Canonical admin route policy

| Route ID | Destination | Required capability (`OR` unless stated) | PLAN-35 state |
|---|---|---|---|
| `dashboard.home` | `/admin` | Any authenticated staff role | Existing route, new registry |
| `consultations.availability` | `/admin/consultation-availability` | `appointment.manage.any`, `settings.manage.any` | Existing |
| `consultations.list` | `/admin/consultations` | `consultation.review.any`, `consultation.review.assigned` | Existing |
| `clients.list` | `/admin/clients` | `client.read.any`, `client.read.assigned` | Existing |
| `messages.list` | `/admin/messages` | `conversation.read.any`, `conversation.manage.any` | Existing |
| `cases.list` | `/admin/cases` | `case.read.any`, `case.read.assigned` | Existing |
| `cases.create` | `/admin/cases/new` | `case.create.any` | Implemented page and API |
| `calendar.list` | `/admin/calendar` | `appointment.manage.any`, `appointment.read.assigned` | Existing |
| `tasks.list` | `/admin/tasks` | `task.manage.any`, `task.manage.assigned`, `task.read.assigned` | Existing |
| `documents.list` | `/admin/documents` | `document.manage.any`, `document.read.assigned` | Existing |
| `finance.list` | `/admin/finance` | `finance.read.any`, `finance.manage.any` | Existing |
| `reports.list` | `/admin/reports` | `report.read.any` | Existing; contract typo `reports.read.any` must be removed |
| `content.home` | `/admin/content` | Any canonical content/case-study/social-draft create or approve permission | Existing |
| `contacts.list` | `/admin/contact-messages` | `contact.read.any`, `contact.manage.any` | Implemented page over current API |
| `notifications.list` | `/admin/notifications` | `notification.read.self` | Implemented page over current API |
| `users.list` | `/admin/users` | `user.manage.any` | Existing |
| `roles.list` | `/admin/roles` | Exact active Super Admin **and both** `role.manage.any`, `permission.manage.any` | Implemented by PLAN-35 |
| `settings.home` | `/admin/settings` | `settings.manage.any` | Existing |
| `audit.list` | `/admin/audit-log` | `audit.read.any` | Existing |

Rules:

- The registry controls discovery and authorized href generation, not security by itself.
- Exact static/action matches win before child matching; otherwise the longest registered prefix
  supplies the child capability. `/admin/cases/new` therefore requires `case.create.any`, while a
  case UUID detail inherits `cases.list` read scope.
- Direct page access executes an equivalent server guard and preserves the authorized shell on 403.
- Direct API access independently enforces its service contract.
- Route policy tests compare registry, page guard, API/service capability, and affected contract in
  both directions.

### Protected child-route inventory

| Child route pattern | Registry inheritance or override |
|---|---|
| `/admin/consultations/{consultationId}` | Inherits `consultations.list` |
| `/admin/clients/{clientId}` | Inherits `clients.list` |
| `/admin/messages/{threadId}` | Inherits `messages.list` |
| `/admin/cases/{caseId}` | Inherits `cases.list` |
| `/admin/cases/new` | Exact override `cases.create` |
| `/admin/content/articles` | Inherits `content.home` |
| `/admin/content/case-studies` | Inherits `content.home` |
| `/admin/content/social` | Inherits `content.home` |
| `/admin/users/{userId}` | Inherits `users.list` |

The implemented role, contact, notification, and case-create pages are exact
entries. Any later detail child must be
added to the registry, server guard, contract inventory, and route-policy test together.

### Representative API probes for the nineteen-route matrix

These probes verify that navigation/page policy and server policy agree without creating business
data. They are acceptance probes, not additional affected API contracts. For a permitted default
role, each GET returns `200`; for a denied role it returns `403`. `cases.create` sends a deliberately
invalid non-mutating POST body: a permitted role reaches validation and returns `400`, while a denied
role returns `403`. An unauthenticated probe returns `401`. A scope-safe `404` is valid only for an
object-detail probe added later, never for these list probes.

| Route ID | Representative API probe |
|---|---|
| `dashboard.home` | `GET /api/admin/dashboard` |
| `consultations.availability` | `GET /api/admin/consultation-availability` |
| `consultations.list` | `GET /api/admin/consultations` |
| `clients.list` | `GET /api/admin/clients` |
| `messages.list` | `GET /api/admin/messages` |
| `cases.list` | `GET /api/admin/cases` |
| `cases.create` | `POST /api/admin/cases` with the fixed invalid acceptance fixture |
| `calendar.list` | `GET /api/admin/calendar` |
| `tasks.list` | `GET /api/admin/tasks` |
| `documents.list` | `GET /api/admin/documents` |
| `finance.list` | `GET /api/admin/finance` |
| `reports.list` | `GET /api/admin/reports` |
| `content.home` | `GET /api/admin/content` |
| `contacts.list` | `GET /api/admin/contact-messages` |
| `notifications.list` | `GET /api/admin/notifications` |
| `users.list` | `GET /api/admin/users` |
| `roles.list` | `GET /api/admin/roles` |
| `settings.home` | `GET /api/admin/settings` |
| `audit.list` | `GET /api/admin/audit-log` |

T042/T052 preserve the historical fifteen-route baseline where the four then-planned IDs
(`contacts.list`, `notifications.list`, `cases.create`, `roles.list`) were absent. T066 activated
contact and notification after their page/API existed; T079 has now activated case create, while
T090 has now activated roles after its API and page were implemented. T091 and final browser acceptance run
all nineteen rows by five roles; `404`, `405`, or a skip never satisfies an allowed cell.

## Default role acceptance matrix after PLAN-35 data migration

`Y` means the default role can discover the route and its underlying guard permits the default
scope. Custom governance changes may reduce editable roles later.

| Route ID | Lawyer | Secretary | Office Admin | Marketing Staff | Super Admin |
|---|---:|---:|---:|---:|---:|
| `dashboard.home` | Y | Y | Y | Y | Y |
| `consultations.availability` | — | Y | Y | — | Y |
| `consultations.list` | Y | Y | Y | — | Y |
| `clients.list` | Y | Y | Y | — | Y |
| `messages.list` | — | Y | Y | — | Y |
| `cases.list` | Y | Y | Y | — | Y |
| `cases.create` | — | Y | Y | — | Y |
| `calendar.list` | Y | Y | Y | — | Y |
| `tasks.list` | Y | Y | Y | — | Y |
| `documents.list` | Y | Y | Y | — | Y |
| `finance.list` | — | Y | Y | — | Y |
| `reports.list` | — | Y | Y | — | Y |
| `content.home` | — | — | — | Y | Y |
| `contacts.list` | — | Y | Y | — | Y |
| `notifications.list` | Y | Y | Y | Y | Y |
| `users.list` | — | — | — | — | Y |
| `roles.list` | — | — | — | — | Y |
| `settings.home` | — | — | — | — | Y |
| `audit.list` | — | — | — | — | Y |

This table describes the post-migration defaults, not immutable authorization: later governance may
reduce an editable role. The test fixture must assert direct page/API denial for every `—` cell and
must assert that every inherited child route has the same result as its parent except the exact
`cases.create` override.

## Contract validation obligations

- Parse the affected route manifest and this inventory into method/path pairs.
- Fail when a documented current method does not exist, an affected implemented method is absent,
  or an affected permission key is not in the canonical catalog.
- Planned rows are allowlisted only while status is `Planned`; implementation removes the planned
  marker in the same change as the route and tests.
- Validate `report.read.any`, `case.create.any`, stable error codes, request fields, and consumer hrefs.
- Ensure no route permission appears only in UI metadata without an equivalent server guard.
