# Phase 09 — Admin Foundations

## Objective

Build the shared admin primitives ONCE — Sidebar, Sheet, Tabs, Accordion,
Dialog, Menu, Popover, Tooltip, Stateful Button, File Upload, Pagination —
plus filter conventions and row-action conventions. No per-page duplication.
No admin content-page wiring occurs in Phase 09. Shared DashboardShell chrome
wiring IS included: Sidebar, mobile Sheet, notification Popover (TASK-09-11).
Individual page content wiring remains Phases 10–11. Productivity-first: no
marketing effects.

## Current State

- Shell: `DashboardShell` → `DashboardShellView` (fixed `aside w-72` +
  `DashboardNavigationLinks`, white header, `DashboardMobileNav` native
  `<dialog>`, `AdminNotificationBell` with native `details` popover).
- Overlays today: native `<dialog>` (mobile nav), native `details/summary`
  disclosures (case detail, tasks, documents, audit, contact messages),
  hand-rolled tab navs (`CaseTabs`, outcome-view nav, content tabs),
  hand-rolled pagination links, plain async buttons, native file inputs.
- Zero `motion/react` importers under admin; local Animate-UI Tabs primitive
  files exist but render nowhere; local `Dialog`/`Pagination`/`Tabs` are
  gallery-only.
- Conventions to unify: `FilterBar` + `SearchInput` + `Select` GET forms;
  `DataTable` + mobile cards; `InlineFeedback` + `StateBlock`.

## Target State

One shared admin UI kit (new `src/components/admin/*` or equivalent single
home — decided in TASK-09-01) exporting: Sidebar nav, Sheet shells (nav +
filters + forms), Tabs, Accordion, Dialog (confirm/destructive + form +
preview variants), Menu (row actions), Popover (advanced filters +
notification), Tooltip, Stateful Button, File Upload, Pagination, plus
documented filter conventions and row-action conventions. Every primitive
shown in the Design Lab (Phase 12 wires the gallery; primitives ship with
gallery-ready examples here). No NEW one-off overlay is introduced. Shared
shell overlays use the Phase 09 kit. Existing content-page disclosures
remain until their locked Phase 10/11 migration.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Desktop sidebar | Fixed custom aside | REPLACE WITH: Aceternity UI Sidebar | Sidebar | Aceternity UI | https://ui.aceternity.com/components/sidebar |
| Mobile nav + sheets | Native dialog drawer | REPLACE WITH: Animate UI Sheet | Sheet | Animate UI | https://animate-ui.com/docs/components/radix/sheet |
| Tabs | Hand-rolled navs | REPLACE WITH: Animate UI Tabs | Tabs | Animate UI | https://animate-ui.com/docs/components/radix/tabs |
| Collapsible sections | Native details | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Confirmations / dialogs | None in prod | REPLACE WITH: Animate UI Dialog | Dialog | Animate UI | https://animate-ui.com/docs/components/radix/dialog |
| Row actions | Per-row buttons | REPLACE WITH: Animate UI Menu | Menu | Animate UI | https://animate-ui.com/docs/components/base/menu |
| Small overlays / extra filters | None / inline | REPLACE WITH: Animate UI Popover | Popover | Animate UI | https://animate-ui.com/docs/components/base/popover |
| Icon help | None/title attrs | REPLACE WITH: Animate UI Tooltip | Tooltip | Animate UI | https://animate-ui.com/docs/components/radix/tooltip |
| Async buttons | Plain buttons | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| File upload | Native file inputs | REPLACE WITH: Aceternity UI File Upload | File Upload | Aceternity UI | https://ui.aceternity.com/components/file-upload |
| Pagination | Hand-rolled links | REPLACE WITH: shadcn Pagination | Pagination | shadcn/ui | https://ui.shadcn.com/docs/components/pagination |
| Tables + feedback | DataTable/DataRecordCard/FilterBar/InlineFeedback/StateBlock | KEEP CURRENT | None (local, kept) | — | — |

## Tasks

- [ ] TASK-09-01 Kit home + conventions doc: single directory for shared admin
  primitives; written filter conventions (primary / more-in-popover / active /
  count) and row-action conventions (Menu items, destructive → Dialog).
- [ ] TASK-09-02 Vendor/install official sources verbatim (Accordion reuse from
  Phase 05 where identical; Tabs: verify-then-reuse the vendored-but-unused
  primitive files or re-vendor; rest fresh). Record URL + version per file.
- [ ] TASK-09-03 Sidebar primitive: nav-item shape mapping from
  `admin-navigation.ts` (labels, hrefs, icons, groups, active matching),
  collapse behavior, keyboard support, RTL (`dir=rtl` shell), both themes.
- [ ] TASK-09-04 Sheet primitive: three shells (navigation, filters, form)
  with trigger/focus-trap/close-on-navigate; mobile-first widths.
- [ ] TASK-09-05 Tabs primitive: list + panels with URL-param-friendly
  controlled state (to replace `CaseTabs`, outcome nav, content tabs, finance
  section tabs in later phases without behavior drift).
- [ ] TASK-09-06 Accordion primitive: single + multiple modes, chevron,
  keyboard, used later for details/disclosures/weekday/settings/roles/AI areas.
- [ ] TASK-09-07 Dialog primitive: confirmation/destructive, form, and preview
  variants with focus trap, Esc, backdrop rules; Arabic copy slots.
- [ ] TASK-09-08 Menu primitive: row-action menus (view/edit/delete items,
  separators, shortcuts, destructive item styling) + Popover primitive for
  advanced filters and small overlays; Tooltip for icon help.
- [ ] TASK-09-09 Stateful Button + File Upload + Pagination wired to admin
  conventions (async states, accept lists, page-state mapping); reuse client
  Phase 07 pagination helper pattern where identical, no duplication.
- [ ] TASK-09-10 Notification bell: rebuild the native `details` popover on
  the Popover primitive (30s poll + mark-read behavior preserved); full
  center page keeps its list (rewired in Phase 10).
- [ ] TASK-09-11 Shell swap (chrome only): Sidebar + Sheet-mobile-nav +
  Popover-bell replace aside/dialog/details in `DashboardShellView` with
  zero page-content changes; all 24 admin pages smoke-rendered.
- [ ] TASK-09-12 Kit QA + gallery-ready examples per primitive; phase commit; STOP.

## Files Expected To Change

- New shared admin kit directory + vendor files; `dashboard-shell-view.tsx`,
  `dashboard-navigation.tsx`, `dashboard-mobile-nav.tsx` (chrome swap only),
  `admin-notification-bell.tsx` + `admin-notification-popover.tsx`.

## Files That Must NOT Change

- Admin page views and form logic (wiring is Phases 10–11), backend/API/
  database/auth, public site, client portal, routes, inventory doc. No
  productivity-behavior changes.

## Dependencies

- Phase 02 (tokens, motion ownership). Blocks Phases 10–11. Accordion →
  reuse Phase 05; Stateful Button → reuse Phase 06; File Upload → reuse
  Phase 08; Pagination → reuse Phase 07 where applicable.

## Risks

- Sidebar active-matching vs `adminNavForPath` semantics → cover every admin
  route in TASK-09-11 smoke test.
- Tabs URL-param sync drift vs current `?tab=`/`?view=` links → specify the
  controlled-state contract in TASK-09-05 before any page adopts it.
- One-off overlays creeping back later → the conventions doc + Phase 10/11
  checklists enforce kit-only usage.

## Acceptance Criteria

- [ ] All 11 primitives exist once, documented, with gallery-ready examples.
- [ ] Shell chrome swapped with zero page-content diffs (before/after captures).
- [ ] No NEW one-off overlay implementation is introduced. Shared shell
  overlays use the Phase 09 kit. Existing content-page disclosures remain
  until their locked Phase 10/11 migration (grep inventory recorded, not
  eliminated, in this phase).
- [ ] One phase commit; STOP.

## Visual QA

- [ ] Sidebar expanded/collapsed, Sheet variants, Dialog variants, Menu,
  Popover, Tabs, Accordion captures × theme.
- [ ] Full admin shell before/after captures.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Keyboard-only run (tabs, accordion, dialog trap, menu, sheet) passes.

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
