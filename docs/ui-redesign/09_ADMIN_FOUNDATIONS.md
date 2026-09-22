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
| File upload | Native file inputs | REUSE Phase 08 owner-approved adaptation (`src/components/ui/file-upload.tsx`); no second implementation | File Upload | Aceternity UI | https://ui.aceternity.com/components/file-upload |
| Pagination | Hand-rolled links | REPLACE WITH: shadcn Pagination | Pagination | shadcn/ui | https://ui.shadcn.com/docs/components/pagination |
| Tables + feedback | DataTable/DataRecordCard/FilterBar/InlineFeedback/StateBlock | KEEP CURRENT | None (local, kept) | — | — |

## Tasks

- [x] TASK-09-01 Kit home + conventions doc: `src/components/admin/` (kit
  `index.ts` + `CONVENTIONS.md`); filter conventions (primary always
  visible / advanced-in-Popover pending blocker / mobile-in-Sheet / active
  summary + reset / count) and row-action conventions (primary visible /
  secondary Menu / destructive Menu+Dialog Phase 11) written; kit-only rule.
- [x] TASK-09-02 Official sources (URL + version recorded per file):
  Dialog components+primitives verbatim from
  `animate-ui.com/r/{components,primitives}-radix-dialog.json` (deps motion
  + radix-ui, both declared); Pagination adapted from
  `ui.shadcn.com/r/styles/default/pagination.json` (buttonClasses alias +
  icon→sm/default→md sizes, documented in-file; react+lucide+cn only).
  Accordion reused Phase 05 verbatim; Tabs verified-then-reused (structure
  + imports resolve, zero prior importers — NOT overwritten); Sidebar/Sheet/
  Tooltip/StatefulButton/File Upload reused, zero duplication.
- [x] TASK-09-03 Sidebar primitive: `admin-sidebar-nav.tsx` on the SAME
  Phase 07 Sidebar; grouped `admin-navigation.ts` items (permission filter
  flows from `DashboardShell`, active matching preserved); collapse + focus
  keyboard bridge + RTL + both themes (the historical forced-light rail was
  superseded by the semantic light/dark admin shell); brand lockup rides the collapse; tooltips
  on collapsed icons.
- [x] TASK-09-04 Sheet shells: `admin-mobile-nav.tsx` (navigation shell:
  trigger/focus-trap/close-on-navigate, RTL side, grouped items, testids +
  copy preserved). Filter/form shells follow the same Sheet pattern in
  Phase 10 (no invented filters now).
- [x] TASK-09-05 Tabs primitive: `admin-tabs.tsx` URL-param contract
  (server-read `active` + `router.push(href)` navigation, same `?tab=` URLs;
  `activationMode="manual"` so arrows move focus without firing a server
  navigation per keypress — found by keyboard QA; Enter navigates).
- [x] TASK-09-06 Accordion: no new wrapper required — Phase 05 primitive
  reused directly; single+multiple+keyboard+RTL from primitive; error-group
  auto-open via `value`/`defaultValue` documented in CONVENTIONS.md.
- [x] TASK-09-07 Dialog primitive + `admin-dialog.tsx` variants
  (confirm/destructive/form/preview; Radix trap + Esc; Arabic copy via
  props; danger-toned destructive confirm). Page actions untouched.
- [x] TASK-09-08 Menu + Popover primitives: COMPLETE (owner namespace
  ruling applied — see Implementation Notes 09b). `AdminRowActions`
  (`admin-menu.tsx`) row-action contract: secondary actions only,
  item/link-item behavior via uniform MenuItem-level activation (`href` →
  app-router push, `onSelect` → callback), separators, shortcuts,
  destructive variant, keyboard/RTL/focus from the primitive. No
  content-page row-action wiring (Phase 10/11 scope).
- [x] TASK-09-09 Stateful Button (reuse, no new file) + File Upload (reuse
  SAME Phase 08 owner-approved adaptation, no second file, no
  `react-dropzone`) + Pagination (`pagination-shadcn.tsx` vendor +
  `admin-pagination.tsx` adapter mirroring the hand-rolled page contract:
  filter-preserving `hrefForPage`, conditional prev/next, reset link, count
  summary, Arabic defaults, mirrored chevrons, ellipsis window). No page
  migration (Phase 10).
- [x] TASK-09-10 Notification bell: COMPLETE — native `details/summary`
  migrated to Animate UI Base Popover (`Popover` + `PopoverTrigger` +
  `PopoverPanel`, `align="end"` reproducing the old physical `left-0`
  placement in the RTL shell, open-reload via `onOpenChange`). 30s poll +
  unread + mark-read + notification links + permissions/data behavior
  verified preserved; `AdminNotificationCenter` untouched; Notifications
  page NOT redesigned.
- [x] TASK-09-11 Shell swap (chrome only): Sidebar + Sheet-mobile-nav in
  `DashboardShellView`; old `aside` + `dashboard-mobile-nav.tsx` (deleted)
  + `DashboardNavigationLinks` (pruned, group helper kept and reused);
  testids preserved; header/controls/bell slot/user/logout/actions
  untouched. Popover-bell excluded (blocked).
- [x] TASK-09-12 Kit QA + gallery-ready design (props per primitive demoable
  in Phase 12; usage contracts in CONVENTIONS.md; no example files added);
  partial commit (NOT phase-complete — blocker open); STOP.

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

## Visual QA (Phase Gate — focused matrix, run once)

- [ ] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 —
  sidebar expanded/collapsed, Sheet/Dialog/Menu/Popover/Tabs/Accordion
  variants + full admin shell before/after.
- [ ] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).
- [ ] Admin shell scope only (no public/client crawl).

## Technical QA (Phase Gate — run once)

- [ ] `npm run typecheck`, `npm run lint` green.
- [ ] Targeted keyboard-only run (tabs, accordion, dialog trap, menu, sheet)
  passes; console clean. No unrelated suites.
- [ ] No full production build by default (non-milestone) — run only if
  module/import, dependency, or route/build behavior changed significantly
  (record why).
- [ ] Known unrelated failures: record + continue, no reinvestigation
  (Known Failure Cache).

## Status

COMPLETE (follow-up commit closes TASK-09-08 + TASK-09-10; blocker resolved
by owner namespace ruling — see 09b notes below)

## Implementation Notes (09b — Menu/Popover completion)

Owner ruling applied: KEEP the locked Animate UI Base Menu / Base Popover;
ONE allowed adaptation — `@base-ui-components/react/*` →
`@base-ui/react/*` (installed `@base-ui/react@1.8.0` exposes `./menu` +
`./popover` subpaths, verified in `node_modules`). Classification:
OWNER-APPROVED ANIMATE UI DEPENDENCY-NAMESPACE ADAPTATION. No Radix
substitution, no custom Menu/Popover, no emulation, no install; package
hashes re-verified before (identical to partial-commit baseline) and
after (identical — see QA Results).

Vendored (official registry, fetched 2026-09-19):
- `primitives/base/menu.tsx` + `components/base/menu.tsx` (namespace
  adaptation only, documented in-file).
- `primitives/base/popover.tsx` + `components/base/popover.tsx`
  (namespace adaptation only, documented in-file).
- Registry deps of the menu, both dependency-clean: `hooks/use-data-state`
  (`src/hooks/use-data-state.tsx`, verbatim — react only) and
  `primitives-effects-highlight`
  (`primitives/effects/highlight.tsx`, verbatim — motion + `@/lib/utils`
  only, both resolve).

Additional API incompatibilities found by immediate typecheck (recorded
per the implementation rule — both judged trivial + mechanical, no
behavior/architecture effect, documented in-file):
1. React 18 types: `useDataState` returns `RefObject<T | null>` (readonly)
   vs Base UI `LegacyRef<HTMLElement>` — 4 call-site casts
   (`highlightedRef as React.Ref<HTMLElement>` in SubmenuTrigger/Item/
   CheckboxItem/RadioItem), zero runtime effect.
2. React 18 types: `localRef.current = node` assignment in highlight
   `refCallback` — `MutableRefObject` cast following the established
   `primitives/animate/slot.tsx` precedent, zero runtime effect.
3. Repo ESLint has no `no-explicit-any` rule (same note as local
   `use-controlled-state`): official disable comment replaced with a KMT
   note; `any` itself is registry-verbatim.

Findings that are NOT defects (recorded, no action):
- Base UI v1.8 mounts popups only after open (probed: even `defaultOpen`
  renders closed in SSR static markup) — panel content is therefore
  covered by browser keyboard QA + captures, unit tests honestly assert
  trigger + source wiring.
- Official `bg-popover`/`text-popover-foreground` utilities are DEAD in
  this repo (no popover tokens in the theme; nothing else uses them, so
  zero existing pixels affected). Kit binds the designed `className`
  extension points were later migrated to semantic `popover`/`surface`
  tokens. The deferred token work was completed in the 2026-09-22 admin
  workspace modernization.
- Temp-harness discipline: the auto-scaffolded bare temp layout shipped
  no `globals.css` (all real layouts import it) → first captures were
  unstyled; fixed with a globals-importing temp layout, panels
  re-captured correctly. All temp files deleted before commit.

## Implementation Notes (09a — partial commit 4276fdb)

Pre-phase baseline: HEAD `a349da6`. Package-file hashes recorded before
and after (identical — see QA Results): package-lock
`1f2c4e1a8a92dd914cb55bc4f89fa8ef48fe8478`, package.json
`b6f55b067fda8c933e1779b0a7ac64eacf05c0e3`, components.json
`97d1756cdefddad1a15c6360db111b2642934d56`. No installs, no lockfile
regeneration, no shadcn CLI, no package/config mutation of any kind.

Component inventory (tracked + untracked inspected before any write):
- A CURRENT VERIFIED: Sidebar (`ui/sidebar.tsx`, Phase 07), Accordion
  (Phase 05), Stateful Button (Phase 06), File Upload (Phase 08
  owner-approved adaptation — reused untouched).
- B VERIFIED-REUSE (untracked, provenance established, NOT overwritten):
  Sheet components+primitives (production use: public header + client
  Phase 07), Tooltip components+primitives (same), Tabs
  components+primitives (genuine Animate UI radix tabs: motion indicator,
  controlled state, `radix-ui` + `use-controlled-state` +
  `get-strict-context` imports all resolve; zero prior importers).
- C MISSING, vendored clean: Dialog components+primitives (official
  registry, byte-verbatim, deps already declared), shadcn Pagination
  (official source with documented button/size adaptations; new file
  `ui/pagination-shadcn.tsx` — gallery-only local `ui/pagination.tsx`
  untouched).
- C BLOCKED: Menu (base/menu) + Popover (base/popover) — see Blockers.
- Local hand-rolled `ui/dialog.tsx` (native `<dialog>`, tracked) left
  untouched (gallery-only; Animate Dialog is the locked admin primitive).

Bell decision: `AdminNotificationBell`/`AdminNotificationPopover` (polling +
mark-read logic) verified and left 100% untouched — only the `<details>`
chrome swap is blocked, not the logic.

Test updates (tracked-clean file, required by the chrome swap): two stale
Phase-07 assertions in `product-components.test.tsx` realigned to shipped
token classes (test-only), mobile-nav source test rewritten to the Sheet
contract, static-markup assertions updated (`<dialog` absence asserted,
`max-lg:hidden`, link `aria-label`s). `plan35-admin-operations` E2E keeps
its `dashboard-desktop-navigation` testid (preserved).

FAST QA: inspection-only per group; one targeted gate at end. Temp harness
route + spec deleted before commit. Build skipped (non-milestone; vendors
add no new modules beyond declared deps — typecheck+lint+E2E cover the
integration risk).

## Files Actually Changed

09a partial (commit `4276fdb`) plus 09b completion (this commit):

- `src/components/animate-ui/primitives/base/menu.tsx` (NEW, official +
  documented namespace adaptation + ref-type casts)
- `src/components/animate-ui/primitives/base/popover.tsx` (NEW, official +
  documented namespace adaptation)
- `src/components/animate-ui/components/base/menu.tsx` (NEW, official
  verbatim)
- `src/components/animate-ui/components/base/popover.tsx` (NEW, official
  verbatim)
- `src/components/animate-ui/primitives/effects/highlight.tsx` (NEW,
  official verbatim + lint-compat note)
- `src/hooks/use-data-state.tsx` (NEW, official verbatim)

- `src/components/animate-ui/primitives/radix/dialog.tsx` (NEW, official
  verbatim)
- `src/components/animate-ui/components/radix/dialog.tsx` (NEW, official
  verbatim)
- `src/components/ui/pagination-shadcn.tsx` (NEW, official + documented
  adaptations)
- `src/components/admin/admin-sidebar-nav.tsx` (NEW)
- `src/components/admin/admin-mobile-nav.tsx` (NEW)
- `src/components/admin/admin-tabs.tsx` (NEW)
- `src/components/admin/admin-dialog.tsx` (NEW)
- `src/components/admin/admin-menu.tsx` (NEW — `AdminRowActions`
  row-action Menu contract)
- `src/components/admin/admin-pagination.tsx` (NEW)
- `src/components/admin/CONVENTIONS.md` (NEW: filter/pagination/row-action/
  tabs/dialog/accordion/shell/gallery conventions)
- `src/components/admin/index.ts` (NEW kit barrel)
- `src/components/layout/dashboard-shell-view.tsx` (chrome swap only)
- `src/components/layout/dashboard-navigation.tsx` (pruned replaced links
  component; type + group helper kept and reused)
- `src/components/layout/index.ts` (barrel: removed deleted module)
- `src/components/layout/dashboard-mobile-nav.tsx` (DELETED, replaced)
- `tests/ui/product-components.test.tsx` (stale assertions realigned,
  mobile-nav contract test rewritten)
- `src/features/admin/notifications/admin-notification-popover.tsx`
  (bell `details/summary` → Animate Popover; logic preserved)
- `tests/ui/admin-menu.test.tsx` (NEW — trigger-lazy + source-wiring
  contract)
- `tests/ui/admin-notification-center.test.tsx` (bell assertions realigned
  to the Popover contract: `onToggle` → `onOpenChange`, closed-trigger +
  Center/shared-list assertions, `<details` absence)
- `docs/ui-redesign/09_ADMIN_FOUNDATIONS.md` (this file)
- `docs/ui-redesign/COMPONENT_SOURCE_MATRIX.md` (rows 29–30: namespace
  adaptation)
- `docs/ui-redesign/DECISIONS.md` (Menu/Popover adaptation status)
- `src/components/admin/CONVENTIONS.md` (blocker box removed; Menu bell +
  row-action + filter contracts current)

## QA Results (09b — Menu/Popover completion)

- `npx tsc --noEmit`: clean (immediately after vendoring per the
  implementation rule — surfaced the two mechanical ref issues above —
  and again at gate).
- `npm run lint`: clean (after replacing the registry disable-comment
  with a KMT note; repo has no such rule).
- Targeted unit: `admin-menu` 3/3 + `admin-notification-center` 3/3 green;
  regression sanity `product-components` + `portal-access` +
  `arabic-route-preservation` green (44/44 across the 5 gate files).
- Targeted browser run (temp harness with globals layout, mock data,
  deleted after): menu open → arrows move highlight → Enter activates
  (`activated:edit`, menu closes) → focus returns to trigger → Esc keeps
  focus; bell open → panel content (title/count/link/item/mark-read) →
  Esc → focus returns to bell; zero page/JS errors (one 401 console entry
  from the preserved poll in the unauthenticated harness identified and
  filtered with cause documented in-spec).
- Captures (exactly the two allowed): `p09b-menu-open` (white bordered
  panel, items عرض/تعديل+E/حذف, gold highlight slab on focused item, RTL
  correct) + `p09b-bell-open` (white panel, title + count + center link +
  unread item + mark-read, RTL aligned) — reviewed, correct.
- `npm run build`: SKIPPED (non-milestone; no new deps/routes/modules —
  vendors resolve to declared deps only).

## QA Results (09a — partial commit 4276fdb)

Technical gate (run once):
- `npm run typecheck`: clean (×3: after kit, after test updates, after
  temp-file deletion + `.next` clear for the stale temp-route cache).
- `npm run lint`: no warnings/errors.
- Targeted tests: `product-components` 29/29 green (incl. 2 realigned
  Phase-07 assertions + rewritten Sheet contract test); `portal-access`
  7/7 + `arabic-route-preservation` 2/2 green (Phase 09 touched neither —
  regression sanity).
- Targeted keyboard run (temp spec, deleted after): sidebar Tab-reach +
  focus-expand; Sheet Enter/Esc + focus return; Tabs arrows (manual
  activation: focus moves, no navigation) + Enter navigates to `href`;
  Accordion Enter toggle; Dialog open/Esc; zero console/page errors.
- `npm run build`: SKIPPED (non-milestone; no new deps/routes/modules —
  registry vendors resolve to declared deps only).

Visual gate (temp harness with REAL shell + kit, mock data, deleted after):
- A AR/Light/1440: collapsed rail (brand mark + active tint) → hover
  expands to brand lockup + badge + groups + labels with tooltip; Tabs
  (light pill styling fixed mid-gate); destructive Dialog open state;
  Pagination with Arabic labels + mirrored chevrons + ellipsis (Previous/
  Next composition fixed mid-gate — official subcomponents discard
  children); Accordion groups.
- B AR/Light/390: Sheet opens from the correct RTL side with grouped
  links; no overflow (390≤390).
- C dark-once was historical evidence for the earlier single-theme admin.
  The current shell and page surfaces now use semantic tokens in both themes.
- Mid-gate fixes (all re-captured): Tabs light styling, Pagination
  prev/next composition, rail dark coherence. Stale-capture discipline:
  C-dark/B-sheet re-run after fixes.
- 24-page smoke: deferred — admin routes are auth-gated (no disposable DB
  here); zero page-content diffs by construction (`git diff` shows no
  admin page files touched).

Package-file hashes (before == after):
- package-lock.json `1f2c4e1a8a92dd914cb55bc4f89fa8ef48fe8478`
- package.json `b6f55b067fda8c933e1779b0a7ac64eacf05c0e3`
- components.json `97d1756cdefddad1a15c6360db111b2642934d56`

Recorded (Known Failure Cache, no reinvestigation):
- Stale `.next` type cache for deleted temp routes (Phases 06–08 pattern).
- Dev-server first background start never listening (Phases 07–08 pattern).
- `next-themes` re-applies stored theme after manual class removal
  (Phase 07–08 pattern).
- Radix roving-tabs RTL order in this stack: ArrowLeft from the first
  trigger wraps to the LAST (probed empirically, asserted as such).

## Blockers (09b — resolved)

RESOLVED by owner namespace ruling (applied above). Prior Menu/Popover
evidence retained for the record: locked sources
`https://animate-ui.com/r/primitives-base-menu.json` and
`.../primitives-base-popover.json` (fetched twice 2026-09-19) declare
deps `['motion', '@base-ui-components/react']`; repo provides
`@base-ui/react@1.8.0`; `@base-ui-components/react` absent. No installs
were run; no package files changed (hashes identical before/after).

## Blockers (09a — superseded; retained for the record)

BLOCKED — Menu + Popover only (OWNER DECISION REQUIRED, reported):
- Locked: Animate UI Base Menu + Base Popover. CURRENT official registry
  (fetched twice 2026-09-19) requires `@base-ui-components/react`:
  - `https://animate-ui.com/r/primitives-base-menu.json` → deps
    `['motion', '@base-ui-components/react']`; file
    `registry/primitives/base/menu/index.tsx`; import line
    `import { Menu as MenuPrimitive } from
    '@base-ui-components/react/menu';`
  - `https://animate-ui.com/r/primitives-base-popover.json` → deps
    `['motion', '@base-ui-components/react']`; file
    `registry/primitives/base/popover/index.tsx`; import line
    `import { Popover as PopoverPrimitive } from
    '@base-ui-components/react/popover';`
  (components wrappers `components-base-menu.json` /
  `components-base-popover.json` same family.)
- Repo provides `@base-ui/react@1.8.0` (declared `package.json:46`,
  installed) — a DIFFERENT package name; `@base-ui-components/react` is
  absent. Using the installed package would require rewriting official
  imports + vendoring extra registry deps (highlight effect,
  `use-data-state`) + betting on cross-package API compat — a modification
  of the official implementation, which was explicitly forbidden, as were
  radix substitution, emulation wrappers, installs, and deferring the
  choice.
- Impact: TASK-09-08 (Menu pattern) + TASK-09-10 (notification bell
  `<details>`→Popover) cannot proceed; row actions stay per-row buttons,
  advanced filters stay inline/GET, bell stays native. Everything else in
  Phase 09 is complete. Do NOT mark Phase 09 COMPLETE until resolved.
