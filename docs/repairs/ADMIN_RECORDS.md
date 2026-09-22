# FIX-10–17,19,20,22,23: admin records and shared UI

Finance lookup uses finance permissions and minimal paginated client/case options. The
current selection survives page/search changes; unavailable associations are not silently
cleared. Case lookup follows the selected client. Invoice forms remount by record, retain
failed-save input, and use server-calculated canUpdate; gateway entries are read-only.
Financial summaries display decimal balances per currency.

Tasks and documents have independent loaders/rights. A task reader need not read cases,
and hidden case details are redacted. Board lanes honor status filters; distribution totals
ignore only status. Each lane tracks its own page, loads12, deduplicates and rejects stale
responses, including StrictMode remounts.

Client detail has upcoming/history sections, scoped previews/totals and complete-list links.
clientId persists through list filters/tabs/pagination. Account management is independent
from profile management. Ordinary updates reject ARCHIVED; the dedicated action requires
confirmation. Calendar switches preserve filters and selected Cairo anchor; Today moves it.

Content/finance drafts live only in the persistent admin shell, keyed by user and record
(and content language where applicable). Save/discard/logout remove them. Actual page
unload warns; no localStorage/server persistence is implied. Existing semantic tokens fix
quick-action contrast and warning surfaces; responsive/keyboard visual checks remain open.

Evidence: repair-finance, repair-finance-select, repair-form-drafts, admin-task-documents,
fix-task-board, admin-client-crm, repair-client-actions, repair-calendar-navigation and
admin-list-phase10 tests. See `../REPAIR_23_TRACKER.md` for combined results and limitations.
