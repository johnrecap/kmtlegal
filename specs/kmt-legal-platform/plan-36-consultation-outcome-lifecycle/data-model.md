# PLAN-36 Data Model and State Design

**Status**: Approved design

**Migration strategy**: Additive schema migration followed by idempotent application reconciliation. No destructive down migration.

## 1. Canonical outcome vocabulary

```text
ConsultationOutcomeStatus
├── PENDING
├── AWAITING_RESULT
├── MISSED
├── SUCCESSFUL
├── NO_SHOW
└── CANCELLED
```

- `PENDING`: The original booking has not ended, or a missed request has been explicitly reopened with a future booking.
- `AWAITING_RESULT`: The original booking ended and the request had an assignment or recorded review; an authorized operator must confirm the real result.
- `MISSED`: The original booking ended with neither an assigned lawyer nor a recorded review.
- `SUCCESSFUL`: An authorized operator confirmed the consultation completed successfully.
- `NO_SHOW`: An authorized operator confirmed the client did not attend.
- `CANCELLED`: An authorized operator or consistent rejection path confirmed cancellation.

These values do not replace `ConsultationStatus` or `AppointmentStatus`.

## 2. ConsultationRequest extension

Add the following fields to `ConsultationRequest`:

| Field | Prisma shape | Required/default | Meaning and validation |
|---|---|---|---|
| `outcomeStatus` | `ConsultationOutcomeStatus` | required, default `PENDING` | Canonical current outcome |
| `outcomeAt` | `DateTime?` | nullable | Instant of the most recent actual outcome transition; null for untouched pending rows |
| `outcomeById` | `String? @db.Uuid` | nullable | Actor for the most recent manual transition; null for system classification/reconciliation |
| `outcomeBy` | `User?` | nullable relation | Relation name `ConsultationOutcomeActor`, `onDelete: SetNull` |
| `outcomeReasonCode` | `String?` | nullable | Bounded categorized reason owned by service validation |
| `outcomeNote` | `String?` | nullable | Internal note, maximum 800 characters, never copied to audit/log metadata |
| `outcomeVersion` | `Int` | required, default `0` | Optimistic concurrency version; increment exactly once per committed outcome transition |

Add the reverse relation to `User`:

```text
consultationOutcomeChanges ConsultationRequest[] @relation("ConsultationOutcomeActor")
```

### Indexes

```text
@@index([outcomeStatus, createdAt])
@@index([outcomeById])
```

The first index supports outcome views and counts. The second supports relation access and actor retention behavior.

### Invariants

1. `outcomeVersion >= 0`.
2. A committed transition increments `outcomeVersion` by one; unrelated consultation edits do not.
3. `outcomeAt` is non-null after any automated or manual transition away from the original default state.
4. `outcomeById` is null for worker/reconciliation transitions and set to the authenticated actor for manual confirmation, correction, reopen, or cancellation/rejection synchronization.
5. `outcomeNote` is never returned by list DTOs and never written to logs or `AuditLog.metadata`.
6. Final-state correction requires a new reason code even if the target final value equals a previous historical value.
7. Reopen changes the current outcome to `PENDING`, sets the recovery reason/note as current metadata, and preserves the old missed event in `AuditLog`.

## 3. Primary consultation booking

No new foreign key is introduced in PLAN-36. The primary booking is derived with one canonical selector:

```text
consultationRequestId = request.id
AND type = CONSULTATION
AND caseId IS NULL
ORDER BY startsAt ASC, id ASC
TAKE 1
```

Add to `Appointment`:

```text
@@index([consultationRequestId, type, caseId, startsAt])
@@index([type, caseId, endsAt, consultationRequestId])
```

The first index supports request-to-primary lookup. The second supports maintenance discovery of ended primary candidates. Existing appointment identities and statuses remain unchanged.

### Primary-booking invariants

1. Appointments with a non-null `caseId` are follow-ups and never define the original consultation outcome.
2. A terminal primary appointment maps to the outcome during reconciliation:
   - `COMPLETED` → `SUCCESSFUL`
   - `NO_SHOW` → `NO_SHOW`
   - `CANCELLED` → `CANCELLED`
3. Manual final outcome synchronization maps back to the primary appointment:
   - `SUCCESSFUL` → `COMPLETED`
   - `NO_SHOW` → `NO_SHOW`
   - `CANCELLED` → `CANCELLED`
4. `AWAITING_RESULT` and `MISSED` do not introduce new appointment enum values. API/calendar DTOs expose an effective consultation outcome alongside the stored appointment status.
5. A missing primary booking is not replaced with a case follow-up. Maintenance skips it with a structured count and safe diagnostic code.

## 4. Reason-code catalog

The database stores a string so future categories do not require a PostgreSQL enum migration. The service validates the current catalog:

### Initial result reasons

- `COMPLETED_AS_SCHEDULED`
- `CLIENT_NO_SHOW`
- `CANCELLED_BY_CLIENT`
- `CANCELLED_BY_OFFICE`
- `TECHNICAL_ISSUE`
- `OTHER`

### Correction reasons

- `CORRECTED_OPERATOR_ERROR`
- `CORRECTED_AFTER_VERIFICATION`
- `CORRECTED_CLIENT_UPDATE`
- `OTHER`

### Reopen reasons

- `REOPEN_CLIENT_REQUEST`
- `REOPEN_OFFICE_FOLLOW_UP`
- `REOPEN_SCHEDULING_ERROR`
- `OTHER`

### Automated reasons

- `AUTO_ENDED_UNASSIGNED_UNREVIEWED`
- `AUTO_ENDED_ASSIGNED_OR_REVIEWED`
- `BACKFILL_APPOINTMENT_COMPLETED`
- `BACKFILL_APPOINTMENT_NO_SHOW`
- `BACKFILL_APPOINTMENT_CANCELLED`
- `BACKFILL_CONSULTATION_REJECTED`
- `BACKFILL_ENDED_UNASSIGNED_UNREVIEWED`
- `BACKFILL_ENDED_ASSIGNED_OR_REVIEWED`

The UI localizes labels from `ui-copy.ts`. Audit metadata stores only the code, not a localized label or free text.

## 5. Outcome state transitions

### Automated classification

```text
PENDING + primary.endsAt <= now
├── assignedLawyerId IS NULL AND secretaryReviewedAt IS NULL
│   └── MISSED
└── assignedLawyerId IS NOT NULL OR secretaryReviewedAt IS NOT NULL
    └── AWAITING_RESULT
```

No other outcome is an automated time-elapse target.

### Manual confirmation

```text
AWAITING_RESULT
├── SUCCESSFUL  -> Appointment.COMPLETED
├── NO_SHOW     -> Appointment.NO_SHOW
└── CANCELLED   -> Appointment.CANCELLED
```

Preconditions:

- Actor has both required permissions.
- Primary booking exists and `endsAt <= now`.
- `expectedOutcomeVersion` equals the stored value.
- Target is one of the three final values.

### Manual correction

```text
SUCCESSFUL | NO_SHOW | CANCELLED
    -> SUCCESSFUL | NO_SHOW | CANCELLED
```

Preconditions are the same as confirmation plus a required correction reason. The primary appointment is remapped atomically. A no-op target is rejected as validation rather than generating a meaningless transition.

### Missed recovery

```text
MISSED -> PENDING
```

Preconditions:

- Actor has both required permissions.
- Current version matches.
- An active lawyer is selected.
- `startsAt > now`, duration is 15–240 minutes, and mode is supported.
- Candidate interval has no lawyer or client overlap under existing active-status rules.

Effects in one transaction:

- Update the primary appointment start/end/mode/location/lawyer and set status `RESCHEDULED`.
- Set consultation `assignedLawyerId` to the selected lawyer.
- Set `secretaryReviewedAt`/`secretaryReviewedById` if they are absent.
- Set outcome `PENDING`, transition metadata, and increment version.
- Update linked client assignment when a client exists, preserving existing assignment behavior.
- Append `consultation.outcome.reopened` audit and resolve the missed alert.

### Existing consultation mutations

| Existing action | Allowed outcome behavior |
|---|---|
| assign | Allowed while `PENDING` before end or `AWAITING_RESULT`; `MISSED` returns reopen-required; final outcomes and closed consultation workflow states reject |
| review | Allowed while `PENDING` before end or `AWAITING_RESULT`; `MISSED` returns reopen-required; final outcomes reject |
| reject | Requires both manual-outcome permissions, then sets consultation workflow `REJECTED`, outcome `CANCELLED`, and primary appointment `CANCELLED` atomically unless already consistently closed |
| convert | `MISSED` returns reopen-required; final `NO_SHOW`/`CANCELLED` reject; `SUCCESSFUL` or eligible `AWAITING_RESULT` may convert under existing case rules without altering the original outcome except where the operator first confirms it |

## 6. Optimistic concurrency protocol

For every manual transition:

1. Parse and validate request, role permissions, and expected version.
2. Start the existing appointment-safe transaction mode appropriate to update or reschedule.
3. Load consultation and primary appointment in the transaction.
4. Validate current lifecycle and time boundary.
5. Run overlap checks for reopen.
6. Execute a conditional `updateMany` on `id + outcomeVersion + expected current outcome` with `outcomeVersion: { increment: 1 }`.
7. If update count is zero, throw `CONSULTATION_STATE_CHANGED`; the transaction rolls back.
8. Apply appointment/assignment/notification changes and append audit in the same transaction.
9. Select and return the purpose-built updated DTO.

The maintenance path uses the same conditional-update concept but treats a zero count as a benign lost race and emits no audit or notification.

## 7. Audit model

No schema change is required because `AuditLog.actorId` is already nullable.

### Actions

- `consultation.outcome.awaiting_result`
- `consultation.outcome.missed`
- `consultation.outcome.confirmed`
- `consultation.outcome.corrected`
- `consultation.outcome.reopened`
- `consultation.outcome.backfilled`

### Allowed metadata

```text
fromOutcome
toOutcome
reasonCode
outcomeVersion
source            # WORKER | RECONCILIATION | ADMIN
primaryAppointmentId
assignedLawyerId  # where applicable
```

Prohibited metadata includes names, phone numbers, email, consultation summary, opposing party, free-form note, request body, token, session, or database URL.

## 8. Notification projection

The existing `Notification` schema and unique key remain unchanged.

One notification per recipient and consultation resource is updated on a winning transition:

| Outcome | Notification behavior |
|---|---|
| `PENDING` and unreviewed/current | Existing review queue behavior |
| `AWAITING_RESULT` | Upsert localized awaiting-result alert and mark unread |
| `MISSED` | Upsert localized missed-request alert and mark unread |
| final outcome | Resolve unread consultation alert |
| reopened `PENDING` | Resolve missed alert; normal current/review visibility is derived from current state |

Repeated maintenance on an unchanged row does not call the notification transition, so it cannot re-open a read alert.

## 9. View projections

Canonical view mapping:

| View | Predicate |
|---|---|
| `current` | `outcomeStatus = PENDING` and primary booking has not ended after reconciliation expectations |
| `awaiting_result` | `outcomeStatus = AWAITING_RESULT` |
| `missed` | `outcomeStatus = MISSED` |
| `successful` | `outcomeStatus = SUCCESSFUL` |
| `no_show` | `outcomeStatus = NO_SHOW` |
| `cancelled` | `outcomeStatus = CANCELLED` |
| `all` | no outcome predicate |

Every predicate is combined with the actor's existing consultation scope. `viewCounts` are calculated with actor scope and compatible non-view filters, but not the selected view predicate, so tab counts remain useful while search/assignment/status filters are active.

## 10. Migration, reconciliation, and rollback

### Additive migration

1. Create PostgreSQL enum `ConsultationOutcomeStatus`.
2. Add outcome columns with `outcomeStatus DEFAULT 'PENDING'` and `outcomeVersion DEFAULT 0`.
3. Add the nullable actor foreign key with `ON DELETE SET NULL`.
4. Add compound indexes.
5. Do not update, remove, or rename existing enum values, columns, or rows.

### Reconciliation order

For every row still `PENDING`, using the primary appointment:

1. Consultation workflow `REJECTED` → `CANCELLED`; cancel primary appointment if not already terminal.
2. Primary appointment `COMPLETED` → `SUCCESSFUL`.
3. Primary appointment `NO_SHOW` → `NO_SHOW`.
4. Primary appointment `CANCELLED` → `CANCELLED`.
5. Ended and both unassigned/unreviewed → `MISSED`.
6. Ended and assigned or reviewed → `AWAITING_RESULT`.
7. Future/non-ended → remain `PENDING` with no audit.
8. Missing primary → skipped count and safe diagnostic.

Each non-pending result increments version once and adds one system audit. Reruns see a non-pending outcome and do nothing.

### Rollback

- Restore the previous application release only.
- Retain the added enum, columns, relation, indexes, outcome values, and audits.
- The previous Prisma client does not select unknown columns and continues to use existing workflow/appointment fields.
- Do not run a down migration that drops PLAN-36 data.
- Before deployment, create a timestamped custom-format `pg_dump` in a configured directory outside the Git checkout and verify it is non-empty.
