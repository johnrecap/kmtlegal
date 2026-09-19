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

- [x] TASK-07-01 Client token pass: `--kmt-client-*` tokens added in
  `globals.css` (`:root` light = warm ivory/paper, `.dark` = obsidian
  near-black preserving pre-phase `#060504` family); shell/panel hex mapped
  to tokens; title-band gradient re-expressed in tokens (dark drops the
  blue-gray `#111827` stop for warm obsidian).
- [x] TASK-07-02 Shell theming: `ClientSiteShell` renders light + dark via
  tokens (header, title band, content, footer); brand `surface="theme"`;
  user chip, back-to-site link, logout, `ClientLanguageSwitch` themed; RTL +
  LTR. Old desktop/mobile nav rows deleted.
- [x] TASK-07-03 Shared pieces theming: Panel/Metric/Row/DetailItem/Empty/
  Select themed both ways with identical structure + copy; icon set
  unchanged. Pre-existing `globals.css` dark theme-bridge converted to
  light-default + `.dark` overrides (dark values byte-preserved).
- [x] TASK-07-04 Official Aceternity Sidebar vendored to
  `src/components/ui/sidebar.tsx` (source verbatim; single documented
  deviation: `@tabler/icons-react` menu icons aliased to the already-declared
  `lucide-react` dep — no package install, no `package.json` touch); 7
  `client-navigation.ts` items wired with collapse/expand (official hover
  animation + focus/blur keyboard bridge via official `setOpen`), RTL
  mirroring, both themes. Links are Next Links (not `SidebarLink`) because
  the phase contract requires per-item `aria-current`, which the official
  helper cannot carry; label animation mirrors the helper exactly.
- [x] TASK-07-05 Desktop nav row replaced with the Sidebar (sticky rail,
  300px ↔ 60px official animation); compact mobile row replaced with an
  Animate Sheet menu (trigger in header, `side` right for AR / left for EN,
  Radix focus trap, close on navigate); `aria-current` on both.
- [ ] TASK-07-06 Mobile filters: NOT APPLICABLE (owner ruling 2026-09-19).
  No client page has list filters — the files-page case/category selects are
  `DocumentUploadForm` upload fields, kept exactly in place. No filter Sheet,
  trigger, count, or apply/clear system built; nothing invented. Animate
  Sheet stays locked for mobile nav (and any future real filter
  requirement).
- [x] TASK-07-07 Icon help via Animate Tooltip on header/row icon-only
  controls with translated labels: desktop sidebar links (RTL-aware side),
  header theme toggle (span-wrapper precedent from `public-header.tsx`),
  header logout button. No new copy, no decorative icons.
- [ ] TASK-07-08 Pagination: NOT APPLICABLE (owner ruling 2026-09-19).
  Cases/court-dates/files/payments render full lists; no hand-rolled client
  pagination links exist (prev/next links live only in admin pages = Phase
  10 scope). Full-list behavior kept; no `?page=` state, no adapter, no
  page wiring, no data-fetching changes. shadcn Pagination stays locked for
  admin Phase 09/10. Matrix row 32 + Phase 08 doc updated accordingly.
- [x] TASK-07-09 DataTable/DataRecordCard: zero code changes (already
  semantic-token based); themed borders/text/badges verified under both
  themes via the preview harness (desktop table EN-dark + mobile cards
  AR-light).
- [x] TASK-07-10 Foundation sweep: representative pages smoke-rendered via
  temp harness (deleted after) EN+AR × light+dark × 390/1024/1440; shell
  captures reviewed; phase commit; STOP.

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

## Visual QA (Phase Gate — focused matrix, run once)

- [ ] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 — shell,
  sidebar, mobile sheet, before/after dark identity check.
- [ ] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark
  (1024 already covered for the 7-item nav risk; expand ONLY a failing
  dimension per 00_MASTER_PLAN.md Verification Policy).
- [ ] Representative client pages only (full 8-page census stays in Phase 13).

## Technical QA (Phase Gate — run once)

- [ ] `npm run typecheck`, `npm run lint` green.
- [ ] Targeted client E2E (nav, filters, pagination on affected pages) green;
  console clean. No unrelated suites.
- [ ] No full production build by default (non-milestone) — run only if
  module/import, dependency, or route/build behavior changed significantly
  (record why).
- [ ] Known unrelated failures: record + continue, no reinvestigation
  (Known Failure Cache).

## Status

COMPLETE

## Implementation Notes

Pre-phase baseline: HEAD `1620631`. All OWNER/PRE-EXISTING working-tree
entries preserved exactly; none staged or included (verified by
`git diff --name-only` before commit). `package.json` / `package-lock.json` /
`components.json` untouched — no new dependency was needed (`motion`,
`lucide-react`, `clsx`, `tailwind-merge`, Radix Sheet/Tooltip all already
declared/installed).

Provenance:
- Sidebar: `https://ui.aceternity.com/registry/sidebar.json` (fetched
  2026-09-19; declares deps `@tabler/icons-react` + `motion`). File body is
  byte-identical to official; ONLY the import line maps
  `IconMenu2`/`IconX` to `lucide-react` `Menu`/`X` aliases (tabler is not a
  declared dep; installing it would rewrite the lockfile over pre-existing
  hunks). Behavior, props, animation values unchanged.
- Sheet/Tooltip: existing approved Animate UI implementations reused
  (`components/radix/sheet.tsx`, `components/radix/tooltip.tsx`);
  `side = locale === "ar" ? "right" : "left"` precedent copied from
  `public-header.tsx` (read-only reference, untouched).
- ThemeToggle: shared Phase 02 component used as-is (span-wrapper tooltip
  precedent from `public-header.tsx`).

Findings that changed the plan (owner rulings 2026-09-19, applied):
- No client pagination exists (full lists; hand-rolled links are admin-only)
  → TASK-07-08 NOT APPLICABLE, no code touched.
- No client list filters exist (files selects are upload-form fields) →
  TASK-07-06 NOT APPLICABLE, no code touched.
- Pre-existing `globals.css` `@layer components` dark theme-bridge
  (`.client-portal-shell …`) hard-coded dark with (0,2,0) specificity that
  beats utilities in BOTH themes → converted to light-default + `.dark`
  overrides (dark declarations byte-preserved). Without this, the light
  theme could not render (found via gray-card investigation; no component
  bug).

Layout: sticky header (brand + mobile trigger + controls) → flex row
(sidebar rail `contents max-lg:hidden` + `main flex-1`) → full-width footer.
Sidebar sticky `top-[69px] h-[calc(100vh-69px)]`. Mobile header tightened on
xs (`gap-1.5`, `px-3`, compact trigger) after the 390 capture showed
crowding; brand size/prop unchanged.

FAST QA: inspection-only per group; one targeted gate at end. No build
(non-milestone; no module/dependency/route risk — temp preview route
deleted before commit).

## Files Actually Changed

- `src/components/ui/sidebar.tsx` (NEW, official vendor + documented
  import-line deviation)
- `src/components/layout/client-sidebar-nav.tsx` (NEW: Sidebar wiring,
  Next Links + `aria-current` + tooltips + focus bridge)
- `src/components/layout/client-mobile-nav.tsx` (NEW: Sheet menu)
- `src/components/layout/client-header-tip.tsx` (NEW: tooltip island)
- `src/components/layout/client-site-shell.tsx` (tokenize + Sidebar/Sheet
  layout, old nav rows deleted, tooltips on theme/logout)
- `src/components/layout/client-portal-components.tsx` (tokenize only)
- `src/components/layout/client-portal-select.tsx` (tokenize only)
- `src/features/client/client-language-switch.tsx` (theming only)
- `src/app/globals.css` (`--kmt-client-*` tokens + theme-bridge light/dark)
- `docs/ui-redesign/07_CLIENT_FOUNDATIONS.md` (this file)
- `docs/ui-redesign/08_CLIENT_PAGES.md` (pagination N/A ruling)
- `docs/ui-redesign/COMPONENT_SOURCE_MATRIX.md` (rows 12/26/32)

## QA Results

Technical gate (run once):
- `npm run typecheck`: clean (run twice: after edits + after temp files
  added/removed).
- `npm run lint`: no warnings/errors.
- Targeted unit: `portal-access` 7/7 + `arabic-route-preservation` 2/2 green.
- Targeted E2E: authenticated client suites require the disposable-DB gate
  (unavailable) — covered instead by a temp no-auth preview harness
  (shell + panels + metrics + select + table + mobile cards) with 4 passing
  checks, zero console/page errors; harness + spec deleted after.
- `npm run build`: SKIPPED (non-milestone; no new deps/routes/modules).

Visual gate (temp harness, screenshots reviewed, then deleted):
- A EN/Dark/1440: obsidian identity preserved, gold accents, collapsed rail
  with active Cases indicator, themed metrics/table/select.
- B AR/Light/390: warm ivory paper, deep readable text, Sheet opens from
  the correct RTL side via trigger, keyboard-visible links, `aria-current`
  intact, no overflow (390≤390).
- C 1024: collapsed rail → hover expands to all 7 labels; tooltip fires;
  no layout breakage.
- D EN toggle: shared ThemeToggle flips the tokenized portal dark→light
  (EN-light capture verified).
- DataRecordCard mobile cards verified under AR-light (full-page capture).

Recorded (no reinvestigation, Known Failure Cache):
- Dev-server flake: first `npm run dev` background start never listened
  (orphan node processes); restarted with log file, ready in ~21s.
- `next-themes` re-applies the stored/default theme after manual
  `classList.remove("dark")` → light E2E must preset `kmt-theme=light` in
  localStorage via `addInitScript`, not strip the class post-load.

## Blockers

None. Phase 08 not started.
