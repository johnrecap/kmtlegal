# Phase 10 — Admin List Pages

## Objective

Move every admin list surface onto the standard list architecture using only
Phase 09 shared primitives: header, primary filters, more-filters Popover,
active filters, count, table, mobile representation, Pagination, row-action
Menu. Covers Cases, Clients, Consultations, Calendar, Tasks, Documents,
Finance, Messages, Contact Messages, Notifications, Reports, Users, Content,
Audit Log.

## Current State

Per inventory 3.8: hand-rolled filter GET forms (`FilterBar` + `SearchInput` +
`Select`s), `DataTable` desktop + `DataRecordCard`/stacked-card mobile,
hand-rolled prev/next pagination, per-row inline buttons, native
`details/summary` disclosures (documents, contact-messages, audit-log),
hand-rolled tab navs (consultations outcome nav, content tabs), static
`StatusBars` (reports), bell `details` popover (rebuilt on Popover in
Phase 09), finance mixed long page (tabs land here per lock: Invoices,
Gateway, Pricing, Attempts, Webhooks).

## Target State

Uniform lists: same header/filter/count/table/mobile/pagination/row-action
rhythm on every page; advanced filters live in Popover on desktop and Sheet
on mobile; delete/destructive actions remain operational in their current
presentation — Phase 10 does NOT migrate destructive actions into Dialog
(destructive Menu + Dialog migration occurs in Phase 11 where the action
lives); finance sections navigate via Tabs with the five locked tabs;
consultations outcome views via Tabs; content types via Tabs. Data,
endpoints, and permissions unchanged.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Advanced desktop filters | Inline overflow rows | REPLACE WITH: Animate UI Popover | Popover | Animate UI | https://animate-ui.com/docs/components/base/popover |
| Mobile filters | Full inline form | REPLACE WITH: Animate UI Sheet | Sheet | Animate UI | https://animate-ui.com/docs/components/radix/sheet |
| Row actions | Inline per-row buttons | REPLACE WITH: Animate UI Menu | Menu | Animate UI | https://animate-ui.com/docs/components/base/menu |
| Pagination links | Hand-rolled prev/next | REPLACE WITH: shadcn Pagination | Pagination | shadcn/ui | https://ui.shadcn.com/docs/components/pagination |
| Consultations outcome nav | Hand-rolled button nav | REPLACE WITH: Animate UI Tabs | Tabs | Animate UI | https://animate-ui.com/docs/components/radix/tabs |
| Content type nav | Hand-rolled tab nav | REPLACE WITH: Animate UI Tabs | Tabs | Animate UI | https://animate-ui.com/docs/components/radix/tabs |
| Finance sections | Long mixed page | REPLACE WITH: Animate UI Tabs (Invoices, Gateway, Pricing, Attempts, Webhooks) | Tabs | Animate UI | https://animate-ui.com/docs/components/radix/tabs |
| Tables + mobile cards | DataTable + DataRecordCard | KEEP CURRENT | None (local, kept) | — | — |
| Reports metrics + bars | MetricCard + StatusBars | KEEP CURRENT (USE CountingNumber on primary numeric MetricCard values; USE Tooltip only where an existing help/info control and existing explanatory copy already exist) | None | — | — |
| Dashboard structure | AdminCommandCenter | KEEP CURRENT (no MagicCard, no decor) | None | — | — |

## Tasks

- [ ] TASK-10-01 Standard list scaffold: apply header/primary-filters/
  more-filters/active-filters/count/table/mobile/pagination/row-actions to
  Cases list; keep all 7 status + 4 priority + type/lawyer/sort options and
  GET-param behavior identical. This page is the reference implementation.
- [ ] TASK-10-02 Replicate the scaffold to Clients, Consultations (outcome
  views as Tabs with counts preserved), Messages, Contact Messages
  (message-body disclosure → Accordion in Phase 11; list keeps excerpt),
  Notifications (list variant), Users, Audit Log lists.
- [ ] TASK-10-03 Calendar list: day-grouped cards kept; filters into
  Popover/Sheet; per-appointment reschedule entry points preserved (dialog
  wiring in Phase 11).
- [ ] TASK-10-04 Tasks list: kanban columns kept (no draggable UI); filter +
  pagination scaffold; edit/details entry points preserved (Accordion wiring
  in Phase 11).
- [ ] TASK-10-05 Documents list: table + stacked cards kept; upload entry
  preserved (File Upload wiring in Phase 11). Delete/destructive actions
  remain operational in their current presentation; Menu + Dialog migration
  occurs in Phase 11.
- [ ] TASK-10-06 Finance: section Tabs (Invoices, Gateway, Pricing, Attempts,
  Webhooks) with existing query state preserved; invoice table + attempt +
  webhook cards paginated via shared Pagination; webhook replay → Stateful
  Button (kept behavior).
- [ ] TASK-10-07 Content hub: type Tabs (articles/case-studies/social/pending)
  with counts; filter + table + mobile card scaffold; editor/preview entry
  points preserved (Sheet/Dialog wiring in Phase 11).
- [ ] TASK-10-08 Reports: metrics + StatusBars kept; USE CountingNumber on
  primary numeric MetricCard values; USE Tooltip only where an existing
  help/info control and existing explanatory copy already exist. Do NOT
  invent help icons, explanations, tooltips, or metric descriptions for
  decorative purposes. No chart library; recent table scaffolded.
- [ ] TASK-10-09 Row-action Menus: migrate fully functional non-destructive
  secondary row actions to Animate UI Menu where behavior is complete, keeping
  existing hrefs and handlers. Keep existing destructive actions operational
  in their current presentation during Phase 10 — never move a working
  destructive action into a disabled Menu item. Phase 11 adds the locked
  Animate UI Dialog confirmation and then migrates destructive actions into
  the Menu + Dialog flow. Record the per-page action map (Menu vs kept
  presentation) in Implementation Notes.
- [ ] TASK-10-10 Dashboard + notifications bell list: structure kept; search
  intact; no decorative components added (grep gate for MagicCard/decor in
  admin before commit).
- [ ] TASK-10-11 All-list sweep: filters round-trip via URL, counts correct,
  empty/permission states (`StateBlock`) intact, mobile cards + pagination on
  390px, RTL; phase commit; STOP.

## Files Expected To Change

- Admin list page files under `src/app/(app-ar)/admin/` (cases, clients,
  consultations, calendar, tasks, documents, finance, messages,
  contact-messages, notifications, reports, users, content, audit-log),
  `contact-message-inbox.tsx` (list half), shared kit imports only.

## Files That Must NOT Change

- Detail/form logic and destructive handlers (Phase 11), backend/API/
  database/auth/permissions, public site, client portal, routes (no new
  params beyond existing), inventory doc.

## Dependencies

- Phase 09 COMPLETE (kit). Finance Tabs contract + Tabs URL-param behavior
  from TASK-09-05. Blocks nothing; Phase 11 completes dialogs/forms.

## Risks

- URL-param drift on Tabs adoption (outcome `?view=`, content `?tab=`,
  finance params) → preserve exact param names/values; test shared links.
- Row-action Menu hiding a previously one-click action behind two clicks →
  keep primary open/edit actions as visible buttons where they are today;
  Menu holds fully functional non-destructive secondary items only in
  Phase 10 (destructive items stay in their current presentation; record
  the per-page map; Menu + Dialog migration in Phase 11).
- Finance long-page anchors breaking under Tabs → preserve anchor targets
  per tab panel.

## Acceptance Criteria

- [ ] Every listed page follows the standard architecture visibly.
- [ ] Zero hand-rolled admin pagination links remain (grep proof).
- [ ] Filter GET behavior identical (param-level before/after checks).
- [ ] Param names for tabs/views unchanged; shared links keep working.
- [ ] One phase commit; STOP.

## Visual QA

- [ ] Per-page list captures desktop + 390px × theme.
- [ ] Popover/Sheet/Menu/Tabs interaction captures.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Admin list E2E (filters, tabs, pagination, row menus) green.

## Status

NOT STARTED

## Implementation Notes

Leave blank.

## Files Actually Changed

Leave blank.

## QA Results

Leave blank.

## Blockers

Leave blank.
