# PLAN-36 Consultation Outcome Contract

**Status**: Approved implementation contract

**Base conventions**:

- Protected routes require the existing session cookie and return `Cache-Control: no-store`.
- Success envelope: `{ "data": ..., "requestId": "..." }` where the existing route convention supplies a request ID.
- Error envelope: `{ "error": { "code", "message", "details", "requestId" } }`.
- Dates are ISO-8601 instants. Arabic UI renders them in `Africa/Cairo`.
- Unknown query/body keys are rejected where the existing Zod contract uses strict schemas.
- Manual outcome and reopen operations require both `consultation.review.any` and `appointment.manage.any` on the server.

## 1. Shared types

### `ConsultationOutcomeStatus`

```text
PENDING | AWAITING_RESULT | MISSED | SUCCESSFUL | NO_SHOW | CANCELLED
```

### `ConsultationOutcomeView`

```text
current | awaiting_result | missed | successful | no_show | cancelled | all
```

### `OutcomeActorDto`

```json
{
  "id": "uuid",
  "name": "string"
}
```

Email, phone, role internals, password/session fields, and raw user records are excluded.

### `PrimaryConsultationAppointmentDto`

```json
{
  "id": "uuid",
  "startsAt": "ISO instant",
  "endsAt": "ISO instant",
  "status": "RESERVED|SCHEDULED|COMPLETED|CANCELLED|RESCHEDULED|NO_SHOW",
  "effectiveConsultationOutcome": "PENDING|AWAITING_RESULT|MISSED|SUCCESSFUL|NO_SHOW|CANCELLED",
  "mode": "OFFICE|PHONE|ONLINE|COURT",
  "location": "string|null",
  "lawyer": { "id": "uuid", "name": "string" }
}
```

`lawyer` is nullable. The DTO is null when no valid primary booking exists. Case-linked follow-ups are never returned as this field.

### `ConsultationOutcomeDto`

```json
{
  "status": "AWAITING_RESULT",
  "changedAt": "ISO instant|null",
  "changedBy": { "id": "uuid", "name": "string" },
  "reasonCode": "AUTO_ENDED_ASSIGNED_OR_REVIEWED|null",
  "note": "internal note|null",
  "version": 2
}
```

`changedBy` is nullable for system transitions. `note` is included only on the authorized detail DTO, never list, dashboard, notification, audit, or log DTOs.

## 2. GET `/api/admin/consultations`

### Query

| Parameter | Type/default | Rules |
|---|---|---|
| `view` | `ConsultationOutcomeView`, default `current` | canonical tab filter |
| `q` | string, default empty | trimmed, maximum 120 |
| `status` | existing consultation workflow status or empty | preserved PLAN-35 filter |
| `assigned` | `assigned|unassigned|""` | preserved PLAN-35 filter |
| `review` | `unreviewed|""` | applies only to current pending work; incompatible values are rejected or cleared by UI |
| `page` | positive integer, default 1 | reset to 1 when view changes |
| `pageSize` | 1–50, default 20 | preserved pagination limit |

### Response

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "reference": "CONS-XXXXXXXX",
        "applicant": {
          "displayName": "string",
          "phone": "string",
          "email": "string|null"
        },
        "serviceCategory": "string",
        "urgency": "LOW|NORMAL|HIGH|URGENT",
        "preferredMode": "PHONE|ONLINE|OFFICE",
        "workflowStatus": "SCHEDULED",
        "assignedLawyer": { "id": "uuid", "name": "string" },
        "secretaryReview": {
          "reviewedAt": "ISO instant|null",
          "reviewedBy": { "id": "uuid", "name": "string" }
        },
        "outcome": {
          "status": "PENDING",
          "changedAt": null,
          "changedBy": null,
          "reasonCode": null,
          "version": 0
        },
        "primaryAppointment": null,
        "createdAt": "ISO instant",
        "detailHref": "/admin/consultations/uuid"
      }
    ],
    "total": 1,
    "viewCounts": {
      "current": 1,
      "awaiting_result": 0,
      "missed": 0,
      "successful": 0,
      "no_show": 0,
      "cancelled": 0,
      "all": 1
    },
    "unassignedTotal": 1,
    "unreviewedTotal": 1,
    "filters": {
      "view": "current",
      "q": "",
      "status": "",
      "assigned": "",
      "review": "",
      "page": 1,
      "pageSize": 20
    },
    "page": 1,
    "pageSize": 20
  },
  "requestId": "uuid"
}
```

Nullable nested actors/lawyers are represented as null. List rows exclude consultation summary, opposing party, AI fields, internal outcome note, and raw relations.

### Scope contract

- `consultation.review.any`: all consultations under existing admin scope.
- `consultation.review.assigned`: assigned consultations only, retaining existing lawyer read behavior.
- no consultation review permission: `403 PERMISSION_DENIED`.
- `viewCounts`, `total`, and items use the identical actor scope and compatible search/status/assigned/review filters.

## 3. GET `/api/admin/consultations/{id}`

The existing route remains and returns a purpose-built detail DTO extended with:

- full `ConsultationOutcomeDto`, including internal note for authorized readers;
- `primaryAppointment` selected by the canonical rule;
- other appointments listed separately with case-follow-up identity retained;
- `canManageOutcome` and `canReopen` capability booleans derived from server policy and state, used only for UI affordance;
- assignable lawyers from the existing active-lawyer projection.

Server-side mutation authorization does not rely on capability booleans.

## 4. POST `/api/admin/consultations/{id}/outcome`

### Body

```json
{
  "status": "SUCCESSFUL|NO_SHOW|CANCELLED",
  "expectedOutcomeVersion": 2,
  "reasonCode": "COMPLETED_AS_SCHEDULED",
  "note": "optional internal note"
}
```

Validation:

- `status` is one of the three final values.
- `expectedOutcomeVersion` is an integer from 0 upward.
- `reasonCode` must belong to the initial-result catalog for the first confirmation and is mandatory from the correction catalog for a final-state correction.
- `note` is optional, trimmed, maximum 800 characters, and never logged/audited.
- A correction target equal to the current final state is rejected as `VALIDATION_ERROR`.

### Eligible states

- `AWAITING_RESULT`: initial confirmation is allowed after primary `endsAt`.
- `SUCCESSFUL|NO_SHOW|CANCELLED`: correction is allowed with a new correction reason after primary `endsAt`.
- `PENDING`: `409 CONSULTATION_OUTCOME_NOT_READY`.
- `MISSED`: `409 CONSULTATION_REOPEN_REQUIRED`.

### Success `200`

```json
{
  "data": {
    "consultationId": "uuid",
    "outcome": {
      "status": "SUCCESSFUL",
      "changedAt": "ISO instant",
      "changedBy": { "id": "uuid", "name": "string" },
      "reasonCode": "COMPLETED_AS_SCHEDULED",
      "note": null,
      "version": 3
    },
    "primaryAppointment": {
      "id": "uuid",
      "status": "COMPLETED",
      "startsAt": "ISO instant",
      "endsAt": "ISO instant",
      "effectiveConsultationOutcome": "SUCCESSFUL"
    },
    "corrected": false
  },
  "requestId": "uuid"
}
```

The consultation update, appointment status update, audit event, and notification resolution are atomic.

## 5. POST `/api/admin/consultations/{id}/reopen`

### Body

```json
{
  "assignedLawyerId": "uuid",
  "startsAt": "ISO instant",
  "durationMinutes": 60,
  "mode": "OFFICE|PHONE|ONLINE",
  "location": "optional string",
  "reasonCode": "REOPEN_CLIENT_REQUEST",
  "note": "optional internal note",
  "expectedOutcomeVersion": 1
}
```

Validation:

- Current outcome is exactly `MISSED`.
- Lawyer is active and has the existing Lawyer role.
- Start is strictly later than the server's current instant.
- Duration is an integer from 15 through 240 minutes.
- Mode is supported by the consultation booking flow; office location remains optional under existing rules.
- Reason belongs to the reopen catalog and is required.
- Note is trimmed and at most 800 characters.
- Version matches.
- Existing lawyer/client overlap rules pass.

### Success `200`

Returns updated outcome `PENDING` with incremented version, updated primary appointment, assignment, and a `reopened: true` marker. It does not delete the prior missed audit.

### Conflict behavior

- Lawyer/client overlap: `409 APPOINTMENT_CONFLICT` with the existing safe details contract.
- Stale version: `409 CONSULTATION_STATE_CHANGED`.
- Non-missed state: `409 CONSULTATION_REOPEN_REQUIRED` when a protected direct mutation needs reopen, otherwise state-changed/not-ready as documented by the calling route.
- Any conflict leaves consultation, appointment, client assignment, notification, and audit unchanged.

## 6. Existing mutation compatibility

### Assign and review

- If outcome is `MISSED`, return `409 CONSULTATION_REOPEN_REQUIRED`.
- If outcome is final, return `409 CONSULTATION_STATE_CHANGED` with localized refresh guidance.
- If outcome is `PENDING` or `AWAITING_RESULT`, preserve existing permission and mutation behavior, subject to current workflow-state rules.

### Reject

- Preserve the current endpoint and legacy `{ reason }` body. PLAN-36 may additionally accept optional
  `expectedOutcomeVersion` and categorized `reasonCode`; omitting them keeps existing clients compatible
  while the server still performs its own compare-and-swap against the version loaded inside the transaction.
- Require both `consultation.review.any` and `appointment.manage.any` because rejection now commits a manual cancelled outcome; assigned lawyers cannot perform it.
- In the same transaction set workflow `REJECTED`, outcome `CANCELLED`, primary appointment `CANCELLED`, increment version, resolve notifications, and audit safe reason metadata.
- Repeated rejection of an already consistent closed row retains existing conflict/idempotency behavior and creates no duplicate outcome audit.

### Convert

- If outcome is `MISSED`, return reopen-required.
- If outcome is `NO_SHOW` or `CANCELLED`, reject as state-changed/conflict.
- Conversion never replaces the canonical primary booking with the newly created case follow-up appointment.

## 7. Stable error codes

Extend `ApiErrorCode` and the central localized source-message map:

| Code | HTTP | Recovery |
|---|---:|---|
| `CONSULTATION_OUTCOME_NOT_READY` | 409 | Wait until the primary booking has ended/classified, then refresh |
| `CONSULTATION_STATE_CHANGED` | 409 | Refresh the detail/list and retry from the latest version |
| `CONSULTATION_REOPEN_REQUIRED` | 409 | Open the explicit reopen and reschedule flow |
| `APPOINTMENT_CONFLICT` | 409 | Keep form input, choose another lawyer/time, and retry |

Existing `UNAUTHENTICATED`, `PERMISSION_DENIED`, `NOT_FOUND`, and `VALIDATION_ERROR` conventions remain.

Error `details` may include safe field paths, conflicting resource type, and time boundaries. They must not include another client's identity, notes, legal summary, or contact fields.

## 8. Dashboard contract extension

The existing dashboard response adds two role-scoped, direct-count cards/metrics:

```json
{
  "key": "consultations.awaiting_result",
  "label": "بانتظار النتيجة",
  "value": 4,
  "href": "/admin/consultations?view=awaiting_result",
  "timeframe": "حتى الآن"
}
```

```json
{
  "key": "consultations.missed",
  "label": "طلبات فائتة",
  "value": 2,
  "href": "/admin/consultations?view=missed",
  "timeframe": "حتى الآن"
}
```

The dashboard service imports the same actor scope and outcome predicates as the list. No chart series is added.

## 9. Calendar contract extension

For appointments linked to a consultation request, the calendar item adds:

```json
{
  "consultationOutcome": {
    "status": "MISSED",
    "label": "طلب فائت"
  },
  "effectiveStatusLabel": "طلب فائت"
}
```

Stored `Appointment.status` remains present for compatibility. The Arabic effective label takes precedence in the calendar UI for `AWAITING_RESULT` and `MISSED`.

## 10. Notification contract extension

The existing notification-center envelope remains. Consultation alerts may be:

- synthetic current review item for pending/unreviewed requests;
- generic persisted awaiting-result item with link `?view=awaiting_result` or detail link;
- generic persisted missed item with link `?view=missed` or detail link.

Only recipients with both outcome-management permissions and notification-read permission receive new outcome alerts, with Super Admin wildcard support. Lawyers do not receive manual-outcome alerts in PLAN-36.

## 11. Contract test obligations

- Query accepts all seven views and rejects unknown values.
- Counts/items/dashboard use the same role scope and filters.
- List/detail DTOs exclude prohibited raw fields.
- Manual endpoint tests all three finals, correction reason, before/exact/after end, missing primary, stale version, and each default role.
- Reopen tests required fields, future boundary, conflict preservation, stale version, wrong state, and primary-versus-follow-up identity.
- Existing assign/review/reject/convert tests cover lifecycle guards.
- Every stable code round-trips through `errorToResponse` and Arabic UI recovery copy.
- All protected responses remain `no-store`.
