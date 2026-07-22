# Contract: Consultation Overdue-Unbooked Recovery

## 1. List views

### Request

```http
GET /api/admin/consultations?view=current|overdue_unbooked|awaiting_result|missed|successful|no_show|cancelled|all
```

Existing `search`, `assignment`, `status`, `review`, `page`, and page-size parameters remain compatible. `review=unreviewed` is valid for `current` and `overdue_unbooked`; incompatible view/filter combinations use the existing validation envelope.

### Response extension

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "createdAt": "2026-06-24T08:00:00.000Z",
        "outcome": {
          "status": "PENDING",
          "version": 2
        },
        "primaryAppointment": null,
        "operationalTiming": {
          "isOverdueUnbooked": true,
          "overdueAt": "2026-06-27T08:00:00.000Z"
        }
      }
    ],
    "filters": {
      "view": "overdue_unbooked"
    },
    "viewCounts": {
      "current": 4,
      "overdue_unbooked": 2,
      "awaiting_result": 1,
      "missed": 0,
      "successful": 5,
      "no_show": 1,
      "cancelled": 2,
      "all": 15
    },
    "asOf": "2026-07-22T10:00:00.000Z",
    "page": 1,
    "pageSize": 20,
    "total": 2
  },
  "requestId": "request-id"
}
```

Contract rules:

- `asOf` is one ISO instant used for the selected records and every count in the response.
- `overdueAt` is non-null only for an active pending request without a primary booking.
- `isOverdueUnbooked` is evaluated against response `asOf`.
- `overdue_unbooked` is a view name, never an outcome enum.
- The purpose-built DTO continues excluding sensitive/free-form internal data from list items.

## 2. Initial scheduling

### Request

```http
POST /api/admin/consultations/{consultationId}/schedule
Content-Type: application/json
```

```json
{
  "assignedLawyerId": "uuid",
  "startsAt": "2026-07-25T09:00:00.000Z",
  "durationMinutes": 60,
  "mode": "OFFICE",
  "location": "Optional office label",
  "expectedOutcomeVersion": 2
}
```

Validation:

- `consultationId` and `assignedLawyerId` are UUIDs.
- `startsAt` is a valid ISO instant and strictly future when the transaction evaluates it.
- `durationMinutes` is an integer from 15 through 240.
- `mode` is an existing supported appointment mode.
- `location` is optional and follows the existing appointment length/sanitization rules.
- `expectedOutcomeVersion` is a non-negative integer.

Authorization requires both:

```text
consultation.review.any
appointment.manage.any
```

### Success

```json
{
  "data": {
    "consultationId": "uuid",
    "outcomeStatus": "PENDING",
    "outcomeVersion": 3,
    "primaryAppointment": "purpose-built primary appointment DTO",
    "scheduled": true
  },
  "requestId": "request-id"
}
```

The returned consultation has `PENDING` outcome with an incremented version, active primary appointment, lawyer/client link, scheduled workflow, and secretary review projection.

### Failure behavior

| Condition | Stable code | Recovery |
|---|---|---|
| Lawyer/client appointment overlap | `APPOINTMENT_CONFLICT` | Keep fields; choose another lawyer/time |
| Stale expected version, serialization race, primary appeared, incompatible workflow/outcome | `CONSULTATION_STATE_CHANGED` | Keep fields; refresh record before resubmitting |
| Unauthorized actor | Existing forbidden code | Hide/deny mutation; no write |
| Invalid ID/body/future time/duration/mode | Existing validation envelope | Keep fields; focus the invalid field |
| Missing request | Existing not-found code | Return to list/refresh |

All failures are atomic and expose localized client copy through existing code mapping. Raw database errors and internal enum/reason values are not returned.

## 3. Manual result for converted legacy missing-primary data

The existing endpoint remains:

```http
POST /api/admin/consultations/{consultationId}/outcome
```

No request/response shape changes. Eligibility expands only for:

```text
status = CONVERTED
outcomeStatus = AWAITING_RESULT
outcomeReasonCode = BACKFILL_CONVERTED_WITHOUT_PRIMARY
primaryAppointment = none
```

It records the consultation final outcome and audit but skips appointment synchronization. Every other missing-primary request retains `CONSULTATION_OUTCOME_NOT_READY`.

## 4. Dashboard contract

Add domain key:

```text
consultations.overdue_unbooked
```

It returns the same role scope and time predicate as the list and links to:

```text
/admin/consultations?view=overdue_unbooked
```

The label and definition make the 72-hour no-booking rule explicit. No chart is added.

## 5. Notification contract

- Overdue eligibility upserts one resource notification per authorized recipient through the existing uniqueness semantics.
- Repeated worker cycles do not duplicate it.
- Creating a primary booking, conversion reconciliation, rejection reconciliation, or another terminal outcome resolves/replaces it.
- Assignment or review without a primary booking does not resolve it.
- Notification payload and audit/log metadata contain IDs/status/reason categories only, never contact data or notes.

## 6. Maintenance summary

The existing maintenance cycle reports the following privacy-safe aggregate shape. Converted
legacy transitions increment `awaitingResult`; rejected legacy transitions increment `cancelled`,
and their categorized reasons remain in the per-record audit rather than adding identity-bearing
summary detail:

```text
scanned
transitioned
awaitingResult
missed
successful
noShow
cancelled
lostRace
missingPrimary
overdueUnbooked
overdueNotificationsCreatedOrRefreshed
```

No second process, schema action, or production fixture is part of the contract.
