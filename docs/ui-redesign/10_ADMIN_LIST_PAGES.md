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

- [x] TASK-10-01 Standard list scaffold on Cases (reference): primary
  filters (q/status/priority + apply) inline on desktop, secondary
  (caseType/assignedLawyerId/sortBy/sortDirection) in Popover (desktop) +
  Sheet (mobile, full set); hidden inputs carry current secondary values
  in the main form and current primary values in the panel forms, so each
  of the 3 sibling GET forms submits complete state with identical param
  names/values; pagination → AdminPagination (reset مسح الفلاتر).
- [x] TASK-10-02 Scaffold replicated to Clients, Consultations (outcome
  views → AdminTabs, 8 views, per-tab Badge counts + definition banner +
  operational shortcuts kept), Messages, Contact Messages (actions +
  details-disclosure untouched), Notifications (list + cursor load-more
  kept, no filters/pagination to migrate), Users, Audit Log lists.
- [x] TASK-10-03 Calendar: day-grouped cards kept; primary (from/to/
  status) inline, secondary (mode/lawyerId) in Popover/Sheet; pagination
  → AdminPagination behind the existing `total > pageSize` gate with the
  existing summary; create/reschedule entry points byte-identical.
- [x] TASK-10-04 Tasks: kanban columns kept (no drag-and-drop); primary
  (q/view/status) inline, secondary (priority/assignedToId/sortBy/
  sortDirection) in Popover/Sheet (`caseId` has no list UI — preserved
  as-is, pagination still carries it); create/edit entry points kept.
- [x] TASK-10-05 Documents: table + desktop cards + mobile details-card
  kept; primary (q/status/category) inline, secondary (visibility/
  ownerClientId/sortBy/sortDirection) in Popover/Sheet; upload entry,
  download links, per-card edit form and operational delete form kept
  (Menu + Dialog migration is Phase 11).
- [x] TASK-10-06 Finance: section Tabs (Invoices, Gateway, Pricing,
  Attempts, Webhooks — new `tab` param, default `invoices`, full query
  preserved in tab hrefs); invoice table + PaymentForm side kept with
  split filters + AdminPagination + CSV/export; gateway settings and
  pricing rules/forms split into their tabs; attempts (2-field inline
  form) + webhooks (primary inline + secondary Popover/Sheet) each with
  cross-group hidden state + AdminPagination behind existing `> 1` gates;
  WebhookReplayButton kept as-is (fully functional; Stateful swap would
  disturb its message + refresh states — recorded, not drifted).
- [x] TASK-10-07 Content hub: type Tabs → AdminTabs (articles/
  case-studies/social/pending with Badge counts; MetricCards kept —
  mediaEntries has no tab); per-tab platform/category conditionals
  preserved in all three forms; editor/preview entry points + edit query
  semantics kept (Sheet/Dialog is Phase 11).
- [x] TASK-10-08 Reports: 8 count MetricCards now render the existing
  Animate UI CountingNumber (`initiallyStable`, SSR-final, no drift;
  money metas untouched); NO Tooltip added (no existing help control +
  copy exists — inventing either is forbidden); StatusBars + recent
  table kept; 3 inline filters kept (nothing secondary — no Popover/
  Sheet needed); no pagination exists → none invented.
- [x] TASK-10-09 Row-action Menus: after per-page inspection, NO list
  page qualifies in Phase 10 — every multi-action row pairs a
  non-destructive action with a destructive sibling that must stay in
  its current presentation until Phase 11 (documents edit/delete,
  contact-messages review/archive), and every other row exposes primary
  links only. Zero menus shipped deliberately (no invented items, no
  split pairs, no hidden primaries); per-page map below; Menu + Dialog
  migration is Phase 11.
- [x] TASK-10-10 Dashboard + bell list: structure kept, ClientSearch
  intact, decor grep gate clean (no MagicCard/Spotlight/Marquee/Glowing
  in command center or admin root); bell already Phase 09 Popover.
- [x] TASK-10-11 All-list sweep: URL round-trip, counts, StateBlocks,
  mobile cards, pagination, RTL verified via contracts + harness (real
  admin pages are auth-gated; no disposable auth state in this
  environment — recorded); phase commit; STOP.

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

- [x] Every listed page follows the standard architecture visibly.
- [x] Zero hand-rolled admin pagination links remain (grep proof).
- [x] Filter GET behavior identical (param-level before/after checks).
- [x] Param names for tabs/views unchanged; shared links keep working.
- [x] One phase commit; STOP.

## Visual QA (Phase Gate — focused matrix, run once)

- [ ] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 —
  per-list captures + Popover/Sheet/Menu/Tabs interaction states.
- [ ] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).
- [ ] Representative admin list pages + affected families only (full admin
  census stays in Phase 13).

## Technical QA (Phase Gate — run once)

- [ ] `npm run typecheck`, `npm run lint` green.
- [ ] Targeted admin list E2E (filters, tabs, pagination, row menus on
  affected pages) green; console clean. No unrelated suites.
- [ ] No full production build by default (non-milestone) — run only if
  module/import, dependency, or route/build behavior changed significantly
  (record why).
- [ ] Known unrelated failures: record + continue, no reinvestigation
  (Known Failure Cache).

## Status

COMPLETE

## Implementation Notes

Baseline: HEAD `686f1d7`; package hashes before = after (see QA Results).
All pre-existing working-tree entries preserved; only Phase 10 files/hunks
staged. No installs, no lockfile/config touches, no backend/auth/permission
changes, no new routes or params except finance `tab` (navigation-only).

Kit surface bridge (first task): KEEP `bg-white text-kmt-ink
border-kmt-border` on MenuPanel/PopoverPanel. The kmt hex tokens are
static (identical in both modes), so panels stay readable in Admin Light
AND Admin Dark — consistent with the light-first admin content and the
forced-light rail (Phase 09 precedent). The mode-flipping alternative
(`bg-surface text-foreground`) exists but would turn panels dark while
all surrounding admin content stays light — worse. Full dark-theme panel
completion needs popover tokens in `tokens.ts`/`tailwind.config.ts`,
which carry foreign pre-existing hunks — deferred, needs owner
coordination. Verified by dark capture (E).

Kit additions (all backward-compatible, no architecture changes):
- `src/components/admin/admin-list-filters.tsx` (NEW): `MoreFiltersPopover`
  (desktop-only trigger, `align="end"`, kit panel surface) +
  `MobileFiltersSheet` (mobile-only trigger, `side="right"`, globals-styled
  sheet). Portal content mounts outside any outer `<form>` and unmounts
  when closed, so each surface owns a COMPLETE sibling GET form (primary
  hiddens in panel forms, secondary hiddens in the main form) — zero JS
  state, zero duplication conflicts, identical param names/values.
- `AdminTabs` badge slot (`badge?: ReactNode`; numbers auto-wrap in
  neutral Badge, elements pass through) — preserves per-tab counts
  without inventing labels.
- `AdminPagination` mobile rule: non-current numbers + ellipsis hide
  below `sm` (probe-proven 51px overflow of the full window at 390px).
- `MetricCard value` widened `string` → `ReactNode` (all existing string
  callers still compile) for CountingNumber.

Per-page action map (Menu vs kept presentation):
- Cases/Clients/Consultations/Messages/Users/Content/Audit/Reports/
  Calendar/Tasks/Notifications/Dashboard: primary links/buttons only —
  no menu (nothing qualifies; primaries stay visible).
- Documents: download link visible; per-card edit form + operational
  delete form kept (Phase 11 migrates pair to Menu + Dialog).
- Contact Messages: mark-REVIEWED + ARCHIVE kept as paired buttons
  (Phase 11 migrates pair; splitting them now would orphan the
  destructive sibling).
- Finance: invoice تعديل links, pricing تعديل links, webhook replay
  button kept visible (Phase 11).
- Destructive actions: zero moved, zero disabled, zero placeholders.

## Files Actually Changed

- `src/components/admin/admin-list-filters.tsx` (NEW kit chrome)
- `src/components/admin/admin-tabs.tsx` (badge slot)
- `src/components/admin/admin-pagination.tsx` (sub-`sm` number hiding)
- `src/components/admin/index.ts` (kit barrel)
- `src/components/ui/card.tsx` (MetricCard value ReactNode)
- `src/app/(app-ar)/admin/cases/page.tsx` (reference scaffold)
- `src/app/(app-ar)/admin/clients/page.tsx`
- `src/app/(app-ar)/admin/consultations/page.tsx` (outcome Tabs)
- `src/app/(app-ar)/admin/users/page.tsx`
- `src/app/(app-ar)/admin/messages/page.tsx`
- `src/app/(app-ar)/admin/calendar/page.tsx`
- `src/app/(app-ar)/admin/tasks/page.tsx`
- `src/app/(app-ar)/admin/documents/page.tsx`
- `src/app/(app-ar)/admin/finance/page.tsx` (5 Tabs + panel splits;
  unused `GatewayOperationsPanel` preview deleted)
- `src/app/(app-ar)/admin/content/page.tsx` (type Tabs)
- `src/app/(app-ar)/admin/reports/page.tsx` (CountingNumber ×8)
- `src/features/admin/contact-messages/contact-message-inbox.tsx`
- `src/features/admin/finance/finance-page-helpers.ts`
  (`financeTabHref` + `FinanceTab` + `financeTabValues`)
- `src/features/admin/finance/finance-forms.tsx` (untouched — verified;
  replay stays as-is, see notes)
- `tests/ui/admin-list-phase10.test.tsx` (NEW: zero-hand-rolled-
  pagination grep proof, per-surface param-name locks, Tabs wiring,
  destructive-preservation proof)
- `docs/ui-redesign/10_ADMIN_LIST_PAGES.md` (this file)

## QA Results

Technical gate (run once):
- `npm run typecheck`: clean (also mid-phase after finance).
- `npm run lint`: clean.
- Targeted tests: 67/67 across 10 files — NEW `admin-list-phase10`
  (4/4: pagination grep proof, 12-surface param-name equality, Tabs
  wiring, destructive preservation), convergence/inbox/menu/bell/
  command-center/accessibility/product-components/portal/arabic all
  green (convergence scans the touched pages directly).
- Targeted E2E: mock-data harness (auth-gated real pages have no
  disposable auth state here — recorded limitation): 5/5 green
  (filters/Popover/Menu keyboard + Esc, Sheet open + ≤1px overflow at
  390, Tabs render + counts, dark open states, zero page/JS errors;
  one 401 from the preserved bell poll does not apply — no bell in
  harness).
- `npm run build`: SKIPPED (non-milestone; no new deps/routes/modules —
  kit + page-level JSX only).

Visual gate (temp harness, mock data, deleted after):
- A AR/Light/1440: filter row + open Popover panel + pagination
  (mirrored chevrons, 1–4…10 window, reset) + outcome Tabs (gold active
  + count badges) + finance 5 Tabs + open Menu — correct, RTL correct.
- B AR/Light/390: Sheet opens from RTL side, white panel, compact
  pagination (prev + current + next only after overflow fix), tabs
  scroll, zero overflow — correct.
- C AR/Light/1440 finance Tabs: 5 tabs, gold active — correct.
- D AR/Light/1440 outcome Tabs with counts — correct.
- E dark smoke: Menu + Popover panels white and readable on dark —
  bridge decision verified.
- Mid-gate fixes (re-captured): pagination sub-`sm` compaction;
  harness layout globals import (auto-scaffolded bare layout dropped
  all Tailwind — same lesson as 09b, fixed immediately).

Protected-file hashes (before == after):
- package.json `b6f55b067fda8c933e1779b0a7ac64eacf05c0e3`
- package-lock.json `1f2c4e1a8a92dd914cb55bc4f89fa8ef48fe8478`
- components.json `97d1756cdefddad1a15c6360db111b2642934d56`

Recorded (Known Failure Cache, no reinvestigation):
- Base UI popups mount on open only (SSR-closed) — unit tests assert
  trigger + source wiring honestly; browser covers open states.
- Bare temp-route layouts ship no globals.css (all real layouts import
  it) — harness needs its own globals layout.
- Stale `.next`/dev-server cache after route Surgery — restart + clear.
- 30s bell poll 401s in unauthenticated harnesses — preserved behavior,
  filtered with cause in-spec.

## Blockers

None. Real admin-page browser QA (authenticated list round-trips) is not
possible in this environment (no disposable auth state / DB fixtures);
coverage is via param-name contract tests (12 surfaces, exact-name
equality), convergence scans, mock harness visuals + keyboard, and
construction fidelity (same helpers, same names, same defaults). No
uncertain failures remain — all known behaviors classified.
