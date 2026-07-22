# PLAN-36 Research and Decisions

**Date**: 2026-07-22

**Status**: Complete — no unresolved clarification remains.

## Evidence inspected

- `prisma/schema.prisma` consultation, appointment, user, notification, and audit models.
- Existing consultation list/detail/assign/review/reject/convert services and API routes.
- Existing appointment overlap detection and serializable transaction helper.
- Existing dashboard, notification-center, audit catalog, API error, permissions, and UI copy sources.
- Existing consultation list/detail/action UI, admin calendar, date formatting, and RTL components.
- Existing `payment-maintenance.mjs`, aaPanel/PM2 deployment script, environment example, and server runbook.
- PLAN-35 artifacts and status, with open DB/live evidence preserved.
- The supplied server deployment report describing healthy migrations, an npm global-config warning, deprecated Nginx HTTP/2 syntax, and a historically high PM2 restart count.

## R1 — Model outcome as a separate lifecycle axis

**Decision**: Add `ConsultationOutcomeStatus` to `ConsultationRequest` rather than expanding or replacing `ConsultationStatus` or `AppointmentStatus`.

**Rationale**:

- `ConsultationStatus` currently represents intake/payment/case-conversion workflow.
- `AppointmentStatus` represents the booking record and already has the terminal values needed for synchronization.
- Outcome is an independent operational/result dimension; keeping it separate avoids breaking current filters, converted/rejected behavior, and previous application code.
- An additive default allows old rows and the previous binary to coexist during application rollback.

**Alternatives considered**:

- Reuse `ConsultationStatus`: rejected because one field could not express converted/review workflow and result independently.
- Add `AWAITING_RESULT` and `MISSED` to `AppointmentStatus`: rejected because those are consultation operations states, not generic appointment facts.
- Create a standalone outcome table: rejected for v1 because one canonical current outcome plus append-only `AuditLog` provides the required history with less transactional complexity.

## R2 — Select one primary booking deterministically

**Decision**: The primary booking is the oldest appointment linked by `consultationRequestId` with `type=CONSULTATION` and `caseId IS NULL`, ordered by `startsAt` and then `id`.

**Rationale**:

- Conversion may create later consultation-type appointments linked to a legal case.
- `caseId IS NULL` cleanly separates the original booking from case follow-ups.
- A deterministic secondary ID order prevents unstable selection when timestamps match.
- A compound index supports list/detail/worker selection without changing historical appointment identities.

**Alternatives considered**:

- First active appointment: rejected because a terminal original booking would disappear from selection.
- Latest appointment: rejected because case follow-up would overwrite the original outcome boundary.
- Add `primaryAppointmentId` immediately: rejected because it would require a more invasive backfill and dual-source consistency; the indexed relation is sufficient for PLAN-36.

## R3 — Use explicit state transitions and optimistic concurrency

**Decision**: All outcome mutations use one shared transition service, `outcomeVersion`, a current-row re-read, and a conditional update within a transaction.

**Rationale**:

- Operators and the maintenance cycle can race at the exact booking boundary.
- `expectedOutcomeVersion` turns silent last-write-wins into a recoverable `CONSULTATION_STATE_CHANGED` response.
- The consultation, primary appointment, audit, and notification changes either commit together or not at all.
- A conditional update count of zero is the authoritative lost-race signal.

**Alternatives considered**:

- Updated-at comparison: rejected because timestamp precision and unrelated edits can create false conflicts.
- Database row lock through raw SQL only: rejected because it would duplicate Prisma transaction behavior and still requires a client version contract.
- Blind idempotency keys: rejected because these are corrections to one versioned resource, not replayable create operations.

## R4 — Keep automated and manual transitions deliberately different

**Decision**:

- Worker: `PENDING` → `MISSED` only when both assignment and review are absent; otherwise `PENDING` → `AWAITING_RESULT`.
- Manual: `AWAITING_RESULT` → `SUCCESSFUL|NO_SHOW|CANCELLED` after the end time.
- Correction: one final state → another final state only with a new reason and version.
- Recovery: `MISSED` → `PENDING` only through reopen with assignment and future rescheduling.

**Rationale**: Time can establish that an appointment window ended, but cannot establish attendance or success. Missed recovery changes scheduling and therefore needs a separate guarded flow.

**Alternatives considered**:

- Auto-success on elapsed time: rejected as factually unsafe.
- Let outcome endpoint operate directly on `MISSED`: rejected because it would bypass required contact/rebooking recovery.
- Let assign/review silently reopen: rejected because it would erase the operational meaning and auditability of `MISSED`.

## R5 — Require the intersection of existing permissions

**Decision**: Manual outcome and reopen require both `consultation.review.any` and `appointment.manage.any`.

**Rationale**:

- Result changes affect a consultation and its appointment.
- Existing default grants cover Secretary, Office Admin, and Super Admin while excluding lawyers and Marketing Staff.
- Reusing existing permission keys avoids a migration and makes policy intent explicit.

**Alternatives considered**:

- Consultation permission alone: rejected because the operation also mutates booking state.
- Appointment permission alone: rejected because it would grant result authority outside consultation review scope.
- New outcome permission: deferred because the requested default role boundary already maps exactly to the intersection.

## R6 — Extend the existing maintenance process with a testable helper

**Decision**: Extract outcome reconciliation/classification into `scripts/consultation-outcome-maintenance.mjs` and import it from `scripts/payment-maintenance.mjs`; keep the existing PM2 process and set the maintenance interval default/example to 60 seconds.

**Rationale**:

- The approved plan forbids another worker.
- A dependency-injected helper can be tested without a local database and can share the generated Prisma client at runtime.
- The existing single-flight guard prevents overlapping cycles.
- Structured output can report only counts by transition and skip reason.

**Alternatives considered**:

- New cron or PM2 process: rejected by scope and increases operational failure modes.
- API-request-time lazy classification only: rejected because requests could remain stale indefinitely without page traffic.
- Put all logic inline in the worker: rejected because race/idempotency tests would become brittle and require a live database.

## R7 — Use transition-triggered notification synchronization

**Decision**: Keep one deduplicated consultation notification per recipient/resource, resolve obsolete review alerts, and upsert the applicable awaiting-result or missed alert only when the outcome transition wins.

**Rationale**:

- The existing unique key already prevents duplicate consultation notifications.
- A previously read review row must be updated and reset when a genuinely new outcome transition occurs; `createMany(skipDuplicates)` alone cannot do that.
- Repeated worker scans do not touch unchanged rows, so they cannot re-notify or reset read state.

**Alternatives considered**:

- One notification row per lifecycle stage: rejected because the existing unique key and center dedupe expect one resource alert.
- Derive every alert synthetically from list queries: rejected because missed/awaiting result need distinct transition timing and unread behavior.

## R8 — Share view predicates across list, dashboard, and notifications

**Decision**: Define canonical outcome view names and scoped where-builders in the outcome service. List records, `viewCounts`, dashboard cards, and notification queue queries consume them.

**Rationale**:

- PLAN-35 constitution requires one scope per domain.
- Counts calculated with separate filters are the current source of operational drift.
- Query links remain shareable and preserve compatible search/filter inputs while resetting page.

**Alternatives considered**:

- Duplicate query objects at each consumer: rejected as the bug pattern PLAN-36 is correcting.
- Client-side counting: rejected because pagination and permissions make it incomplete and unsafe.

## R9 — Expose purpose-built DTOs and stable conflict codes

**Decision**: Extend the list/detail contract with selected outcome and primary-booking fields; add `CONSULTATION_OUTCOME_NOT_READY`, `CONSULTATION_STATE_CHANGED`, and `CONSULTATION_REOPEN_REQUIRED` to the stable API code union and central localized message map; preserve `APPOINTMENT_CONFLICT`.

**Rationale**:

- Raw Prisma records expose more legal/contact text than operational cards need.
- Stable codes let Arabic UI provide exact recovery actions without parsing server text.
- Version and primary-booking fields are required to make the manual forms safe.

**Alternatives considered**:

- Reuse generic `CONFLICT`: rejected because each recovery path is materially different.
- Localize messages inside route files: rejected because the existing central message source is authoritative.

## R10 — Store reason codes separately from internal notes

**Decision**: Persist a bounded machine reason code string and a separate optional internal note. Audit metadata contains only the reason code, statuses, version, source, and safe IDs; it never contains the note or consultation summary.

**Rationale**:

- Categorized reasons are filterable and safe for structured evidence.
- Internal notes can contain legal or client context and must not enter logs or audit metadata.
- A string reason code can evolve without another PostgreSQL enum migration; Zod owns the current allowed catalog.

**Alternatives considered**:

- One free-text reason: rejected for reporting, localization, and privacy.
- PostgreSQL reason enum: rejected because reason categories are likely to evolve more frequently than the lifecycle state.

## R11 — Make reconciliation the backfill and keep rollback non-destructive

**Decision**: The migration adds schema only and defaults old records to `PENDING`. The required one-shot maintenance run immediately after migration performs deterministic historical reconciliation and writes one system audit per actual transition. Rollback restores the previous application binary but retains the added enum, columns, relation, and indexes.

**Rationale**:

- Application reconciliation can reuse the exact primary-booking and transition rules, including audit and notification behavior.
- Schema-only migration reduces long table-locking data work during deploy.
- Retaining columns makes rollback safe; dropping them would destroy newly recorded outcomes.

**Alternatives considered**:

- SQL-only backfill: rejected because it would duplicate application rules and make per-transition audit/notification behavior inconsistent.
- Down migration dropping columns: rejected as destructive and incompatible with the approved rollback rule.

## R12 — Pin Cairo at the shared formatting boundary

**Decision**: Add `timeZone: "Africa/Cairo"` to affected `Intl.DateTimeFormat` instances in `legal-format.ts` and continue transporting ISO instants in contracts.

**Rationale**:

- Server and browser defaults currently differ, producing hydration mismatch.
- Explicit presentation timezone preserves absolute storage while giving the office one business clock.
- A shared helper corrects every affected consumer without client-only rendering.

**Alternatives considered**:

- Suppress hydration warnings: rejected because it hides a real content mismatch.
- Render dates only after hydration: rejected because it creates layout shift and weakens server rendering.

## R13 — Reuse current UI primitives and URL query state

**Decision**: Use semantic links for tabs, existing button/input/select/badge/card/table styles, query parameters for shareability, and small focused forms inside the current action panel/detail page.

**Rationale**:

- No new component library is necessary.
- Links provide keyboard behavior and shareable views by default.
- Existing responsive table/mobile card patterns and design tokens preserve PLAN-35 consistency.

**Alternatives considered**:

- Client-only tab state: rejected because it is not shareable and complicates server data loading.
- Charts for outcomes: explicitly excluded; direct linked counts are more actionable.
- Modal framework addition: rejected; existing dialog/form primitives are sufficient.

## R14 — Prove PM2 stability relative to the post-restart baseline

**Decision**: Deployment records the maintenance process restart count immediately after the intentional restart, waits more than 60 seconds, then fails if status is not online or the count increased again.

**Rationale**:

- Historical restart count may already be high, so requiring zero is incorrect.
- Comparing after the intentional restart detects a crash loop without erasing operational history.
- The wait covers at least one maintenance cycle and therefore exercises the new reconciliation path.

**Alternatives considered**:

- Reset PM2 counters: rejected because it destroys useful operational evidence.
- Check only `pm2 describe` after two seconds: rejected because a process can crash on its first scheduled cycle.

## R15 — Keep server-wide warning remediation manual

**Decision**: Document how to inspect and fix the npm global `init.module` setting and how to back up, edit, validate, and reload deprecated Nginx HTTP/2 syntax. The deploy script reports but does not mutate those global files.

**Rationale**:

- Those files are outside the repository and may serve other applications.
- Nginx changes require an exact backup and `nginx -t` before reload.
- The warnings do not block PLAN-36 application correctness.

**Alternatives considered**:

- Auto-edit global config during deploy: rejected as overly broad and risky.

## R16 — Separate local, database, browser, and live evidence

**Decision**: Run focused/full tests, typecheck, lint, Prisma validate/generate, and build locally without `DATABASE_URL`. Record database-backed migration/race evidence on staging/disposable PostgreSQL, browser evidence through the existing harness, and live acceptance only with explicit authorization and no production fixtures.

**Rationale**:

- The user explicitly prohibited local database installation.
- Constitution requires honest evidence labels.
- PLAN-35's open DB/live tasks remain independent and cannot be satisfied by PLAN-36 checks.

**Alternatives considered**:

- Treat mocked tests as DB PASS: rejected by the constitution.
- Seed production for acceptance: rejected without separate approval.
