# Phase 07 — Client Foundations

## Objective

Fix the shared client foundation BEFORE any individual client page is
redesigned: theme tokens, shell, navigation, light/dark, shared panels,
rows, metrics, selects, pagination, filters, and mobile nav. No page-level
redesigns in this phase; Phase 08 consumes this stable foundation.

## Current State

- Shell: `ClientSiteShell` (`client-site-shell.tsx`, hard dark:
  `bg-[#060504]` etc., no light styling) + dual `ClientPortalNav` rows
  (desktop inline + compact scroll) + gradient title band + minimal footer.
- Shared pieces: `ClientPortalPanel/Metric/Row/DetailItem/Empty`
  (`client-portal-components.tsx`), `ClientPortalSelect`, `ClientLanguageSwitch`,
  `ThemeToggle`, logout POST form, user chip.
- Lists: `DataTable` + `DataRecordCard` mobile cards (cases, court-dates,
  files, payments). Pagination: hand-rolled links (no shared component).
  Filters: files page has case/category selects; other lists are static.
- Nav source: `src/app/(client)/client/client-navigation.ts` (7 items).

## Target State

Token-driven client shell with real light + dark themes; Aceternity Sidebar
driving desktop navigation; Animate Sheet driving mobile navigation and
mobile filters; Animate Tooltip on icon help; DataTable/DataRecordCard kept
as-is; shadcn Pagination replacing hand-rolled links via one shared client
pagination helper; shared panels/rows/metrics/selects themed and stable.
All 8 pages render identically in content, renewed in chrome.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Client desktop navigation | Inline tab rows | REPLACE WITH: Aceternity UI Sidebar | Sidebar | Aceternity UI | https://ui.aceternity.com/components/sidebar |
| Client mobile navigation | Compact scroll row | REPLACE WITH: Animate UI Sheet | Sheet | Animate UI | https://animate-ui.com/docs/components/radix/sheet |
| Icon help | None/title attrs | REPLACE WITH: Animate UI Tooltip | Tooltip | Animate UI | https://animate-ui.com/docs/components/radix/tooltip |
| Data tables | DataTable + DataRecordCard | KEEP CURRENT | None (local, kept) | — | — |
| Mobile filters | Inline selects | REPLACE WITH: Animate UI Sheet | Sheet | Animate UI | https://animate-ui.com/docs/components/radix/sheet |
| Pagination | Hand-rolled links | REPLACE WITH: shadcn Pagination | Pagination | shadcn/ui | https://ui.shadcn.com/docs/components/pagination |
| Shell/panels/rows/metrics/selects | Hard-dark custom | KEEP CURRENT (re-tokenize + theme, same structure) | None | — | — |

## Tasks

- [ ] TASK-07-01 Client token pass: map hard-coded shell/panel hex
  (`#060504`, `#070604`, `#07090b`, `white/10` borders, gold literals) to
  semantic tokens with light + dark values; title-band gradient re-expressed
  in tokens.
- [ ] TASK-07-02 Shell theming: `ClientSiteShell` renders light + dark via
  tokens (header, nav rows, title band, content section, footer); user chip,
  back-to-site link, logout, `ClientLanguageSwitch` all themed; RTL + LTR.
- [ ] TASK-07-03 Shared pieces theming: Panel/Metric/Row/DetailItem/Empty/
  Select themed both ways with identical structure + copy; icon set unchanged.
- [ ] TASK-07-04 Vendor/install the official Aceternity Sidebar; wire the 7
  `client-navigation.ts` items (icons + labels + active states) with
  collapse/expand, keyboard support, RTL mirroring, both themes.
- [ ] TASK-07-05 Replace desktop nav row with the Sidebar; replace the compact
  mobile row with an Animate Sheet menu (trigger, focus trap, close on
  navigate); keep `aria-current` semantics on both.
- [ ] TASK-07-06 Mobile filters via Animate Sheet: build one shared
  client filter-sheet pattern (trigger + count + apply/clear) and wire the
  files-page selects through it without changing filter outcomes.
- [ ] TASK-07-07 Icon help via Animate Tooltip on header/row icon-only
  controls with translated labels.
- [ ] TASK-07-08 Pagination: install the official shadcn Pagination; build one
  shared client pagination helper mapping existing page state to it; swap all
  hand-rolled client pagination links (cases, court-dates, files, payments).
- [ ] TASK-07-09 DataTable/DataRecordCard: keep byte-identical rendering;
  re-verify themed borders/text/badges under both themes only.
- [ ] TASK-07-10 Foundation sweep: all 8 pages smoke-rendered (content
  unchanged) EN+AR × light+dark × 390/1024/1440; shell captures; phase
  commit; STOP.

## Files Expected To Change

- `src/components/layout/client-site-shell.tsx`,
  `src/components/layout/client-portal-components.tsx`,
  `src/components/layout/client-portal-select.tsx`,
  `src/app/(client)/client/client-navigation.ts` (only if item shape must
  extend for Sidebar; labels/hrefs unchanged),
  `src/features/client/client-language-switch.tsx` (theming only),
  client list pages (pagination + filter-sheet wiring only),
  new vendor files (Sidebar, shadcn Pagination helper).

## Files That Must NOT Change

- Page content/logic (metrics figures, chat logic, upload/profile handlers,
  payment flows), backend/API/database/auth, public site, admin, routes,
  inventory doc. No individual page redesigns.

## Dependencies

- Phase 02 (global tokens, motion ownership, toggler outcome). Blocks
  Phase 08.

## Risks

- Sidebar collapse behavior vs 7-item nav on small desktop → verify 1024px.
- Token pass washing out dark-portal identity → keep gold accents, verify
  against pre-phase captures.
- Pagination helper mismatching existing page-state shapes → cover all four
  list pages in TASK-07-08 QA.

## Acceptance Criteria

- [ ] Light theme renders fully; dark theme matches pre-phase identity.
- [ ] Sidebar (desktop) + Sheet (mobile nav + mobile filters) wired, RTL-safe.
- [ ] Zero hand-rolled client pagination links remain (grep proof).
- [ ] Tables render identically apart from theming.
- [ ] One phase commit; STOP.

## Visual QA

- [ ] Shell + sidebar + mobile sheet captures × locale × theme × viewport.
- [ ] Before/after dark captures for identity check.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Client portal E2E (nav, filters, pagination) green; console clean.

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
