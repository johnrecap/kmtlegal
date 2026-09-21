# 04 — Admin Panel Audit

Layout guard: `requireAdminPage("/admin")` (staff roles) +
`requireAdminRoutePage` per page (`canAccessAdminPath`). All mutations via
`/api/admin/*` with `actor` + server-side `hasPermission` checks (sampled:
cases, clients, users/password, roles — all server-enforced, file 05).
Confidence MEDIUM (code + tests; live staff session not exercised here).

## `/admin` Dashboard — PARTIAL

Purpose: command center. Data: today appointments, overdue tasks,
unreviewed/overdue-unbooked/awaiting-result/missed consultations, new
contacts, under-review documents, active cases/clients; priority queues
(limit 6) + recent activity; scope-aware for non-super roles.
Actions: navigate. Tests: dashboard service tests. Limitation: no
customizable widgets, no export.

## `/admin/cases`, `/new`, `/[caseId]` — PARTIAL

List with search/status filters; manual create via `ManualCaseForm`
(`createManualCase/updateManualCore`); detail with sessions/appointments/
tasks/documents/notes tabs, status/priority/core edit, session logging.
Backend: `case-operations-service.ts`. Tests: case service + batch specs.
Limitation: no case merge, no duplicate-case guard beyond unique
`internalFileNumber`, no bulk actions.

## `/admin/clients`, `/[clientId]` — PARTIAL

List/detail (cases/consultations/appointments/docs/payments), assign
lawyer, archive (`LEAD|ACTIVE|INACTIVE|ARCHIVED|DELETED`), portal account
link/create, password reset. Backend: `client-crm-service.ts`
(scope-checked reads/writes).
Limitation: create-client UI reports "add unavailable" while
`createAdminClient` exists → UI/service mismatch (P2).

## `/admin/consultations`, `/[consultationId]` — PARTIAL

Review queue views (`current|overdue_unbooked|awaiting_result|missed|
successful|no_show|cancelled|all`); actions assign/review/reject/schedule/
convert/outcome/reopen with zod schemas, serializable TX, `outcomeVersion`
optimistic locking. Tests: outcome/policy specs.
Limitation: no bulk review, no SLA timers visible, no auto-escalation.

## `/admin/consultation-availability` — PARTIAL

Slot grid editor (`slotDuration 15–240`, lead hours, window days, per-day
windows, Africa/Cairo) feeding public slot list. No per-lawyer calendars,
no blackout dates, no holiday handling.

## `/admin/calendar` — PARTIAL

Window filters, types (`CONSULTATION|COURT_SESSION|INTERNAL_MEETING|CALL|
ONLINE_MEETING`), modes, statuses; create + reschedule with overlap guard
(`excludeAppointmentId`); consultation appointments gated by outcome
state (reopen-required). No explicit cancel/delete UI; no drag-drop; no
reminders.

## `/admin/tasks` — WORKING (static) — MEDIUM

Status/priority/assignee/case/due filters, overdue view, board/list,
optimistic `updatedAt` CAS (409 on stale). Assignee allowlist
(Lawyer/Secretary/Office Admin/Super Admin). No recurring tasks, no
assignment notifications.

## `/admin/documents` — PARTIAL

Status (`NEW|UNDER_REVIEW|NEEDS_CLARIFICATION|ACCEPTED|REJECTED`),
visibility, category; upload via shared API; soft-delete with
`confirmDelete literal(true)` + dialog (bytes retained).
Limitation: no bulk review, no version history, no retention policy UI.

## `/admin/finance` — PARTIAL

Tabs: invoices (manual CRUD + CSV export), gateway attempts, pricing rules
(versioned), gateway settings, webhook inbox + replay. Gateway-paid
methods blocked from manual PAID (must flow through webhook).
Limitation: no taxes/line-items/discounts, no refund execution, no
reconciliation dashboard beyond `moneyStatus`.

## `/admin/messages`, `/[threadId]` — PARTIAL

Search/status/assignee filters, reply, assign (Secretary/Office
Admin/Super Admin only), close/archive. 5s polling both sides.
Limitation: no internal staff-only notes in thread, no attachments, no
canned replies, no SLA.

## `/admin/contact-messages` — PARTIAL

`NEW→REVIEWED→ARCHIVED` forward-only inbox. No reply-from-inbox (must use
messages thread or external mail — and SMTP is disabled).

## `/admin/notifications` — PARTIAL

Generic + consultation-review merged feed, cursor pagination, manual
`readAt`. Bell polls 30s. Only 3 trigger families wired (consultation
review/outcome, contact). No digest, no per-user preferences.

## `/admin/reports` — PARTIAL

Counts by status with date scope. Read-only; no CSV export (finance has
its own), no charts persistence, no scheduled reports.

## `/admin/settings` — ADMIN ONLY — MEDIUM

Generic `SystemSetting` KV editor. Risk: opaque keys editable without
per-key validation UI (server schemas vary); misconfiguration possible →
P2 guard recommendation.

## `/admin/users`, `/[userId]` — ADMIN ONLY — MEDIUM

Invite/status/role/password (exact Super Admin only + live session
revalidation in TX)/2FA-reset/link-client. Dangerous actions gated +
audited.

## `/admin/roles` — ADMIN ONLY — HIGH

Role/permission matrix editor; requires `role.manage.any` +
`permission.manage.any` AND exact Super Admin, server-side. Strongest
governance control in the panel.

## `/admin/content`, `/articles`, `/case-studies`, `/social` — ADMIN ONLY — MEDIUM

Hub with tabs + pending queue; article/case-study/social CRUD + AI draft;
publish gates (`content.approve.any`, anonymization checks). No delete
APIs; social `PUBLISHED` means "internal", no auto-poster.

## `/admin/audit-log` — ADMIN ONLY — MEDIUM

Action/resource/actor/date filters over append-heavy log. No export, no
tamper-evidence beyond DB discipline.

## Admin strengths

Server-side permission enforcement (no UI-only holes found in samples);
scope-aware listings; audited dangerous actions; optimistic locking on
hot paths (tasks, consultation outcome); webhook replay for ops recovery.

## Admin weaknesses / bottlenecks

Client-create UI gap; calendar cancel/delete missing; reports without
export; settings KV opacity; no bulk operations anywhere; polling instead
of realtime; contact inbox cannot reply in place.
