# 08 — Calendar, Tasks & Workflow Audit

## Calendar (appointments) — PARTIAL (MEDIUM)

- Creation: `POST /api/admin/calendar` → `createAdminCalendarAppointment`
  (Serializable TX, bounded retry, lawyer scope, `SCHEDULED`, audit).
- Rescheduling: `POST …/[appointmentId]/reschedule` → 404/403 checks, 409
  on terminal states (`CANCELLED|COMPLETED|NO_SHOW`), outcome gate
  (`canUseGenericCalendarReschedule` — consultation appointments only if
  outcome `PENDING` + future, else reopen-required), `excludeAppointmentId`
  conflict check, status → `RESCHEDULED`.
- Conflict detection: WORKING in code (MEDIUM) —
  `appointment-conflict-service.ts` (`ACTIVE=[RESERVED,SCHEDULED,
  RESCHEDULED]`, overlap predicate, scopes office-consultation/lawyer/
  client), reused by booking, review, and outcome services.
- Modes: `OFFICE|PHONE|ONLINE|COURT`; types: `CONSULTATION|COURT_SESSION|
  INTERNAL_MEETING|CALL|ONLINE_MEETING`; filtering by window/type/status.
- Lawyer assignment: yes (scoped queries for non-super roles).
- Availability integration: consultation-availability settings feed public
  slots; no per-lawyer calendars, no blackouts/holidays.

Answers: reminders NO (email templates defined, SMTP off, no scheduler);
overdue logic N/A (appointments are point-in-time; consultations have
`overdue_unbooked` view only); recurring NO; notifications on
create/reschedule NO (in-app triggers cover consultations, not generic
appointments); conflict detection YES (code).

## Tasks — WORKING static (MEDIUM)

- Creation/update: `GET|POST /api/admin/tasks`, `PATCH|DELETE …/[taskId]` →
  `task-document-service.ts`. Fields: title/desc/status/priority/assignee/
  due/case; create defaults assignee=self; assignee allowlist enforced.
- Status: `NEW|IN_PROGRESS|REVIEW|COMPLETED|OVERDUE|ARCHIVED`; priority
  4-level; filters (q/view/mine/overdue/status/priority/assignee/case/
  sort); `overdue = dueDate<now && !COMPLETED|ARCHIVED` (computed view).
- Case relation: yes (`caseId` SetNull, case tabs).
- Kanban: board view exists in admin tasks page (offline Stitch Kanban is
  historical only, not runtime).
- Permissions: staff with task scope; lawyer sees assigned/own-case tasks.
- Optimistic concurrency: `updatedAt` CAS → 409 on stale write.

Answers: reminders NO; overdue logic YES (computed); recurring NO;
notifications on assignment NO; conflict detection N/A.

## Workflow gaps (all DEFERRED or NOT WIRED)

| Capability | Status | Note |
|---|---|---|
| Appointment reminders (email/SMS) | DEFERRED | Templates exist, SMTP off, no scheduler |
| Recurring tasks/appointments | DEFERRED | No RRULE/cron in repo |
| Assignment notifications | NOT WIRED | `NotificationType` has `TASK`/`APPOINTMENT` with no triggers |
| Escalation on overdue consultation | NOT WIRED | View exists, no trigger |
| Calendar cancel/delete UI | GAP (missing) | Service supports terminal states; UI lacks buttons |
| Drag-drop calendar | DEFERRED | List-based UI only |
