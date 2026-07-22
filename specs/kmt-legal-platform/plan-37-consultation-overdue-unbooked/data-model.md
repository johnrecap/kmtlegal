# Data Model: PLAN-37 Consultation Overdue-Unbooked Recovery

**Schema decision**: No Prisma model, enum, column, relation, index, or migration changes.

PLAN-37 derives operational timing and reuses PLAN-36 persistence.

## Existing persisted entities reused

### `ConsultationRequest`

Relevant existing fields:

- `id`, `createdAt`, `status`
- `outcomeStatus`, `outcomeAt`, `outcomeReasonCode`, `outcomeNote`, `outcomeVersion`
- `outcomeById`, `assignedLawyerId`, `clientId`
- `secretaryReviewedAt`, `secretaryReviewedById`
- contact information needed only inside the existing client-link transaction
- linked `appointments`, converted case relationship, audits, and notifications

No field is added. The overdue view never changes `outcomeStatus`.

### `Appointment`

The primary consultation booking is still the oldest appointment linked to the request where:

```text
type = CONSULTATION
caseId = null
```

Scheduling creates one such appointment with existing fields: client, lawyer, consultation request, title, mode, location, start, end, and `SCHEDULED` status.

### `Client`, `User`, `AuditLog`, and notification record

- Existing client-link/upsert behavior supplies a client for the appointment.
- Existing active-lawyer and permission checks constrain the actor and assignee.
- Existing audit storage records the schedule and legacy outcome transitions using cataloged metadata.
- Existing consultation resource notifications provide dedupe and resolution.

## Derived `OperationalTiming`

```ts
type OperationalTiming = {
  isOverdueUnbooked: boolean;
  overdueAt: Date | null;
};
```

Rules for a list item evaluated at one `asOf`:

1. Find the primary consultation booking using the canonical identity.
2. If a primary booking exists, `overdueAt = null` and `isOverdueUnbooked = false`.
3. If outcome is not `PENDING` or workflow is not active, both fields are false/null.
4. Otherwise `overdueAt = createdAt + 72 hours` and `isOverdueUnbooked = overdueAt <= asOf`.

The list response also returns the fixed `asOf` used for records and counts.

## View state sets

Active workflow statuses for no-primary current/overdue views:

```text
NEW, REVIEWING, PAYMENT_PENDING, SCHEDULED
```

### Current

```text
outcomeStatus = PENDING
AND (
  oldest primaryAppointment.endsAt > asOf
  OR (
    no primary appointment
    AND active workflow status
    AND createdAt > asOf - 72 hours
  )
)
```

### Overdue without booking

```text
outcomeStatus = PENDING
AND no primary appointment
AND active workflow status
AND createdAt <= asOf - 72 hours
```

The exact equality belongs to overdue. The two sets are mutually exclusive.

## Scheduling command and invariants

Input:

```ts
{
  assignedLawyerId: string;      // UUID
  startsAt: string;              // valid future ISO instant
  durationMinutes: number;       // integer 15..240
  mode: AppointmentMode;
  location?: string | null;
  expectedOutcomeVersion: number;
}
```

Preconditions:

- Actor has both required permissions.
- Request has outcome `PENDING`, active workflow status, matching version, and no primary booking.
- Lawyer is active and eligible.
- Start is strictly later than transaction time; end is derived from duration.
- Lawyer and linked client have no conflicting active appointment.

Atomic effects:

1. Create/link the client using the existing consultation contact workflow.
2. Create exactly one primary appointment.
3. Set request `clientId`, `assignedLawyerId`, and workflow `SCHEDULED`.
4. Set secretary review actor/time only if not already set.
5. Increment `outcomeVersion`; retain `outcomeStatus = PENDING`.
6. Append one scheduling audit with enum/ID/version/time metadata only.
7. Resolve/synchronize current and overdue consultation notifications.

An exception rolls back every effect.

## Legacy transition rules

| Existing workflow | Existing outcome | Primary booking | Target outcome | Reason | Appointment mutation |
|---|---|---|---|---|---|
| `CONVERTED` | `PENDING` | None | `AWAITING_RESULT` | `BACKFILL_CONVERTED_WITHOUT_PRIMARY` | None |
| `REJECTED` | `PENDING` | None | `CANCELLED` | Existing system rejection reason | None |

Each transition condition includes the current version/outcome in a conditional update. The winner increments `outcomeVersion`, records a system audit, and synchronizes notifications. A repeat has no effect.

## Manual outcome exception for converted legacy records

The normal PLAN-36 rule requires an ended primary booking. A missing booking is allowed only when all are true:

- workflow is `CONVERTED`;
- outcome is `AWAITING_RESULT`;
- outcome reason is `BACKFILL_CONVERTED_WITHOUT_PRIMARY`;
- converted workflow evidence remains linked where selected;
- actor has both manual-outcome permissions and submits the current version.

The final consultation outcome, actor, reason/note, version, audit, and notification are updated normally. Appointment synchronization is omitted because no appointment exists. Every other missing-primary record returns `CONSULTATION_OUTCOME_NOT_READY`.

## Concurrency and idempotency

- List/read consistency: one immutable `asOf` per operation.
- Scheduling: serializable appointment-conflict transaction plus conditional `outcomeVersion` update.
- State/serialization loser: `CONSULTATION_STATE_CHANGED`.
- Real resource conflict: `APPOINTMENT_CONFLICT`.
- Maintenance: conditional transition on `PENDING`/version; only a winning update writes audit/notification.
- Overdue notification: resource-recipient upsert; derived detection writes no audit.

## Privacy

DTOs expose operational timing, outcome data, and the purpose-built consultation projection only. Audit/log metadata excludes client name, phone, email, free-form location/note, credentials, AI payloads, and raw records.

## Migration and rollback

- Migration: none.
- Prisma generation due to schema change: not required.
- Deployment rollback: application-only; no PLAN-37 data column exists.
- Scheduling/transition records use existing history and are not destructively reverted.
