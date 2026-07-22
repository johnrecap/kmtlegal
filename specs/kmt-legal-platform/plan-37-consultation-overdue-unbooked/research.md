# Research: PLAN-37 Consultation Overdue-Unbooked Recovery

**Date**: 2026-07-22

**Status**: Complete — no unresolved clarification

## Clarification record

The user-approved plan resolves all material questions:

- The threshold is 72 exact elapsed hours from `ConsultationRequest.createdAt`.
- An overdue unbooked request stays `PENDING`; it is a derived operational view, not a new database status.
- Recovery schedules a future primary appointment and assigns a lawyer together.
- Converted legacy requests keep manual final outcomes; no fake appointment is created.
- No Prisma/schema/migration work and no local database are allowed.
- Existing permissions require the intersection of consultation review and appointment management.

No `NEEDS CLARIFICATION` marker remains.

## Inspected existing-system evidence

| Surface | Finding | Decision |
|---|---|---|
| `src/server/admin/consultation-outcome-policy.ts` | `current` is only `{ outcomeStatus: PENDING }`; no overdue view exists | Extend the canonical view policy and require an explicit `asOf` |
| `src/server/admin/consultation-review-service.ts` | List/count logic shares the view builder and already owns client upsert behavior | Keep list/count orchestration here and add the atomic initial-schedule command here |
| `src/server/admin/consultation-outcome-service.ts` | PLAN-36 has version checks, permission composition, conflict-safe reopen, DTOs, and manual result rules | Reuse these patterns; add only a narrow converted-legacy missing-primary exception |
| `scripts/consultation-outcome-maintenance.mjs` | Missing primary is returned before rejected handling; converted no-primary is skipped | Reorder/extend deterministic reconciliation and add an overdue notification pass |
| `src/server/admin/notification-service.ts` | Consultation notifications already use resource identity and transition synchronization | Reuse one deduped resource notification; do not add a notification subsystem |
| `src/server/admin/dashboard-service.ts` | Awaiting-result and missed domains use shared outcome predicates | Add overdue-unbooked through the same policy and one `asOf` |
| Consultation list/detail/action UI | Existing tabs, badges, forms, feedback, lawyer options, Cairo conversion, and reopen fields exist | Extend/reuse current primitives and factor shared scheduling fields only if it reduces duplication |
| Prisma schema | PLAN-36 fields, version, relations, appointment/client/review data already exist | No schema or migration change |
| Deployment | Existing one-shot reconciliation runs through the aaPanel/PM2 update script | Reuse unchanged process identity and document PLAN-37 acceptance |

## Decisions

### D1 — Derived view rather than a new outcome

`overdue_unbooked` is computed from `PENDING`, active workflow status, lack of primary booking, and the 72-hour boundary. Persisting another status would require a migration, create two sources of truth, and incorrectly treat a scheduling backlog as a final/transition outcome.

### D2 — Exact time predicate

Capture `asOf` once. Define `overdueAt = createdAt + 72h`; overdue is `overdueAt <= asOf`. Use absolute instants for comparisons and `Africa/Cairo` only for presentation.

### D3 — Current predicate

Current contains:

1. `PENDING` requests with a primary booking whose `endsAt > asOf`; or
2. active-workflow `PENDING` requests without a primary booking where `createdAt > asOf - 72h`.

Ended primary appointments are excluded during the worker’s bounded transition window. Converted/rejected no-primary rows are excluded from both operational queues until reconciliation.

### D4 — Primary booking identity

Reuse PLAN-36 identity: the oldest linked appointment with `type = CONSULTATION` and `caseId = null`. Case follow-ups cannot satisfy or resolve the unbooked condition.

### D5 — One request snapshot

The list service creates one `asOf`, passes it to record predicates and all eight counts, and returns it. Dashboard and notification operations each similarly capture one time. This prevents exact-boundary disagreement inside a response.

### D6 — Scheduling ownership and transaction

Add scheduling to `consultation-review-service.ts`, where client upsert/link logic and workflow mutations already live. Reuse the PLAN-36 serializable appointment-conflict transaction, version comparison, permission helper, active-lawyer validation, audit service, and notification synchronization.

### D7 — Scheduling eligibility

Eligible requests are active workflow statuses (`NEW`, `REVIEWING`, `PAYMENT_PENDING`, `SCHEDULED`) with outcome `PENDING` and no primary booking. Eligibility does not depend on whether 72 hours have elapsed. Converted/rejected/final/missed/awaiting-result records use their existing lifecycle actions.

### D8 — Scheduling atomic effects

Within one transaction: re-read and conditionally lock by outcome version, validate no primary, validate lawyer, link/upsert client, check lawyer/client conflicts, create the primary appointment, set lawyer and `SCHEDULED`, stamp secretary review where absent, increment `outcomeVersion`, append a safe audit, and resolve/synchronize consultation notifications.

### D9 — Recoverable errors

Reuse `APPOINTMENT_CONFLICT` for real appointment conflicts and `CONSULTATION_STATE_CHANGED` for stale version, serialization race, or newly existing/incompatible state. Zod validation handles invalid future time/duration/mode. The UI retains all local input on failures and offers refresh for state change.

### D10 — Converted legacy result exception

Maintenance sets `CONVERTED + PENDING + no primary` to `AWAITING_RESULT` with `BACKFILL_CONVERTED_WITHOUT_PRIMARY`. Manual outcome service permits no-primary confirmation only when the record matches that exact legacy marker (and converted workflow/case evidence where available). Appointment synchronization is skipped; consultation audit/version/actor/reason/notification behavior remains mandatory.

### D11 — Rejected legacy repair

Evaluate rejected workflow before the generic missing-primary skip. Transition it to `CANCELLED`; appointment update is conditional because none exists. Audit metadata permits a nullable appointment ID and contains no client data.

### D12 — Overdue notification without transition audit

The existing maintenance process finds eligible overdue records and upserts the single resource alert per authorized recipient. Detection is derived and does not mutate consultation state, so it creates no transition audit. Scheduling or terminal reconciliation resolves/replaces the alert. Repeated cycles are idempotent.

### D13 — UI and copy

Add the eight-link tab order and central Arabic labels/definitions. Rename the column to “تاريخ إنشاء الطلب” and display “متأخر منذ” using Cairo formatting. Reuse the existing reopen controls, feedback, modal/card patterns, tokens, focus treatment, and mobile layout; no dependency is added.

### D14 — Evidence boundaries

Local checks use mocks/static/contract tests and run without `DATABASE_URL`. Database acceptance is staging/server-only after backup. Browser flows use non-production safe fixtures or are recorded as deferred; they never mutate real production client data.

## Alternatives rejected

- **New Prisma enum/status**: unnecessary and explicitly out of scope.
- **Classify unbooked as `MISSED`**: semantically false because no appointment was missed.
- **Use month or calendar-day comparison**: contradicts the approved 72-hour rule.
- **Schedule without assignment**: leaves the request operationally incomplete and contradicts the approved recovery choice.
- **Create a fake appointment for converted legacy data**: invents history and corrupts reporting.
- **Separate worker or notification table**: duplicates existing infrastructure and PM2 ownership.
