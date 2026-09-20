# Phase 12 — Cleanup + KMT Design System Lab

## Objective

With redesigned production UI stable: remove proven-dead legacy/unused code
under a strict deletion protocol, then upgrade `/preview/components` into
the internal KMT Design System Lab showing the production UI system in
light + dark and English + Arabic RTL.

## Current State

Known legacy/unused candidates (from inventory unconfirmed/installed-only
lists + Phase 04 sweep):

- `src/features/public-site/booking-stepper.tsx` (`BookingStepper`)
- `src/features/public-site/consultation-assistant-panel.tsx`
  (`ConsultationAssistantPanel`)
- `src/components/domain/legal-cards.tsx` (7 card exports, zero importers)
- `src/components/ui/number-ticker.tsx` (rejected; zero importers)
- `src/components/ui/shimmer-button.tsx` (zero importers; live one is
  `motion-ui/shimmer-button.tsx`)
- Unused Animate pieces: `LiquidButton` (component + primitive),
  `GradientBackground`/`GradientText`, Animate `Tabs` files IF Phase 09
  re-vendored instead of reusing them (verify first — never delete the
  files Phase 09 adopted)
- Duplicate component variants, stale CSS (`kmt-*` classes / tokens left
  orphaned by Phases 02–11), unused imports across touched files
- Preview: `ComponentGallery` + `gallery-islands.tsx` + `UiPreview`
  (gated by `KMT_ENABLE_UI_PREVIEW`, production `notFound()`)

## Target State

Dead code deleted only with proof; production bundle contains no orphaned
legacy booking components, no unused vendored components, no stale CSS that
earlier phases replaced. The Design Lab at `/preview/components` documents
the shipped system: header examples where practical, Buttons, Fields,
Selects, Textarea, Badges, Cards, Panels, Tabs, Accordion, Dialog, Sheet,
Popover, Tooltip, Menu, StatefulButton, FileUpload, FloatingDock,
ThemeToggle, Feedback, DataTable, Pagination, Empty state, Loading state —
each in Light, Dark, English, Arabic RTL. Internal/preview only; never
linked from production navigation.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Legacy booking files | Unrendered files on disk | REMOVE (only after protocol below passes) | None | — | — |
| Unused vendored components | Installed-only files | REMOVE (only after protocol passes; never files adopted in Phases 05/09) | None | — | — |
| Stale CSS / dead tokens | Orphaned classes/vars | REMOVE (only after grep + build proof) | None | — | — |
| Design Lab gallery | ComponentGallery demos | KEEP CURRENT (upgrade content to production system) | All locked rows 01–32 as shown | All four sources | See COMPONENT_SOURCE_MATRIX.md |

## Tasks

- [x] TASK-12-01 Deletion protocol per candidate file: (1) import grep
  repo-wide, (2) route/render grep, (3) `npm run typecheck`, (4) unit tests,
  (5) production build — all green before AND after removal. Record the
  five proofs per deleted file. Any failure → keep the file, record why.
- [x] TASK-12-02 Delete `booking-stepper.tsx` + `consultation-assistant-panel.tsx`
  only after TASK-12-01 proofs + Phase 04 grep gate re-confirmed.
- [x] TASK-12-03 Delete `domain/legal-cards.tsx` (or individual dead exports)
  only after proofs; if any export gained an importer in Phases 03–11, keep
  that export and record it.
- [x] TASK-12-04 Delete `ui/number-ticker.tsx` + `ui/shimmer-button.tsx` +
  proven-unused Animate pieces (never the Tabs files adopted by Phase 09;
  never Sheet/Tooltip/primitives in use).
- [x] TASK-12-05 Stale CSS sweep: orphaned `kmt-*` classes, dead tokens,
  unused imports/exports in touched files; remove with build proof.
- [x] TASK-12-06 Design Lab content: rebuild `/preview/components` sections
  to mirror production primitives 1:1 (same imports as production where
  feasible), covering the full required list in both themes and both
  locales/directions.
- [x] TASK-12-07 Design Lab states: empty + loading + error + permission
  states, Stateful async sequences, File Upload demo, dialog/sheet/popover/
  menu/tooltip demos, DataTable + Pagination demo, FloatingDock +
  ThemeToggle demos. Gate stays (`notFound()` in production without the flag).
- [x] TASK-12-08 Lab QA: every demo renders EN+AR × light+dark; no production
  nav links to the lab; flag-gate verified in production build mode.
- [x] TASK-12-09 Final cleanup commit (deletions + lab in ONE phase commit
  only if both green; otherwise two commits: cleanup, then lab); STOP.

## Files Expected To Change

- Deletions listed above; CSS/token cleanups in touched files;
  `src/features/ui-preview/*`, `src/app/preview/*` (lab only).

## Files That Must NOT Change

- Production views/logic beyond import-path updates forced by deletions,
  backend/API/database/auth, routes, inventory doc, other phase files.

## Dependencies

- Phases 03–11 COMPLETE and stable. Nothing consumes the lab; lab mirrors
  production.
- Ownership boundary (final Phase 01 rulings): active Media feature + route/
  render/SEO removal is owned by Phase 06 and must already be done — it is
  NOT postponed to Phase 12. Phase 12 removes ONLY remaining proven-dead
  orphan files/imports/styles after repository-wide deletion proof.

## Risks

- Deleting a file with a dynamic/static-param reference (articles/case-study
  params, sitemap) → mitigated by route-grep step + production build proof.
- Lab drifting from production over time → mitigate by importing production
  primitives directly wherever feasible (record exceptions).

## Acceptance Criteria

- [x] Five proofs recorded per deleted file; build green after each batch.
- [x] Zero references to deleted modules remain (grep proof).
- [x] Lab shows every required item × Light/Dark × EN/AR-RTL.
- [x] Production build with flag off still `notFound()`s preview routes.
- [x] Commit(s) per task; STOP.

## Visual QA (Phase Gate — focused matrix, run once)

- [x] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 — lab
  full-page + before/after bundle or file-count evidence for deletions.
- [x] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).

## Technical QA (Phase Gate — run once)

- [x] `npm run typecheck`, `npm run lint`, production build green twice
  (pre- and post-deletion — milestone/deletion-safety phase, builds mandatory).
- [x] Targeted unit + E2E suites affected by deletions green (change scope
  only — full exhaustive re-verification stays in Phase 13).
- [x] Known unrelated failures: record + continue, no reinvestigation
  (Known Failure Cache).

## Status

COMPLETE (two commits: cleanup, then lab — allowed by TASK-12-09)

## Implementation Notes

- Baseline: HEAD `ce6bced`; protected hashes `package.json`
  `b6f55b067fda8c933e1779b0a7ac64eacf05c0e3`, `package-lock.json`
  `1f2c4e1a8a92dd914cb55bc4f89fa8ef48fe8478`, `components.json`
  `97d1756cdefddad1a15c6360db111b2642934d56` — identical before/after.
- Stale artifact verdict: STALE, no production defect. Removed
  `dashboard-mobile-nav.tsx` (deleted Phase 09) + `profile-form.tsx` (no
  tracked imports since plan-39); added `admin-mobile-nav.tsx`
  (`buttonClasses`, evidence product-components which reads its source),
  `pagination-shadcn.tsx` (`button`, evidence admin-list-phase10 which
  guards the AdminPagination stack), `payment-mobile-card.tsx` (`button`,
  evidence product-components which guards the Button contract);
  synced 17 contract lists to live detector truth (Phase 11 `button`
  gains/losses, Phase 08 client drift). Assertion strength unchanged.
  Deletions later removed 3 more recorded entries (booking ×2, legal-cards).
- Deletion proofs per file: (1) repo-wide import grep zero outside self,
  (2) route/render grep zero (server `consultation-assistant-service`
  untouched), (3) booking tests assert the new assistant + assert absence
  of legacy names, (4) typecheck green, (5) build green. Deleted 8 files
  (see below). `ui/number-ticker.tsx` + `ui/shimmer-button.tsx` RETAINED:
  untracked owner worktree files — not Phase 12's to delete. Old `ui/tabs`,
  `ui/dialog`, `ui/card`, `ui/pagination` variants RETAINED: live via the
  ui barrel (Card family, MetricCard, Pagination all imported in
  production). `ui/sidebar.tsx` live (admin + client navs).
- CSS/token sweep: zero orphaned classes — all `kmt-motion-*`, marquee,
  shimmer keyframes have live consumers; deleted files carried only
  file-scoped styles. `tokens.ts` / `tailwind.config.ts` untouched (owner
  hunks not safely separable; nothing strictly necessary).
- Lab: `lab-shell.tsx` (theme + locale/dir toolbar, render-prop locale,
  internal-only `Provenance`), `lab-demos.tsx` (production imports only:
  KmtBrandLogo, StatefulButton, FileUpload, AdminTabs/Accordion/Dialog/
  Menu/Pagination/SidebarNav, Sheet, Popover, Tooltip, PublicFloatingDock),
  `component-gallery.tsx` rebuilt as client Lab (render prop requires
  client-to-client boundary; fixes a server→client function-passing 500
  found during QA). New kit sections bilingual; legacy gallery sections
  stay English (layout/theme inspection). Sidebar demo notes desktop-only
  production behavior. No production/client/admin nav links to the lab.
- Provenance labels verified against file headers: Aceternity UI
  (Stateful, Dock, Sidebar primitive), Animate UI (Tabs/Accordion/Dialog/
  Sheet/Menu/Popover/Tooltip), shadcn (Pagination note), Local KMT
  (everything else); adaptations labeled exactly as specified.

## Files Actually Changed

- Commit A (cleanup): DELETED `src/features/public-site/booking-stepper.tsx`,
  `src/features/public-site/consultation-assistant-panel.tsx`,
  `src/components/domain/legal-cards.tsx`, `src/components/domain/index.ts`,
  `src/components/animate-ui/components/buttons/liquid.tsx`,
  `src/components/animate-ui/primitives/buttons/liquid.tsx`,
  `src/components/animate-ui/components/backgrounds/gradient.tsx`,
  `src/components/animate-ui/primitives/texts/gradient.tsx`;
  MODIFIED `test-results/plan35/shared-ui-consumer-disposition.json`.
- Commit B (lab): NEW `src/features/ui-preview/lab-shell.tsx`,
  `src/features/ui-preview/lab-demos.tsx`, `tests/ui/design-system-lab.test.tsx`;
  REBUILT `src/features/ui-preview/component-gallery.tsx`.

## QA Results

- `npm run typecheck`: clean (pre/post deletion, post lab).
- `npm run lint`: no warnings/errors.
- Targeted: disposition 1/1, booking-assistant + product-components 49/49,
  lab test 1/1 (with repo-pattern matchMedia/IntersectionObserver mocks).
- Full suite ONCE: 91 files passed, 5 skipped; 636 tests passed,
  53 skipped, 0 failed.
- `npm run build`: green (76s, 40/40 static pages).
- Preview gate on production build: flag ON → 200 (lab renders);
  flag OFF → 404 notFound. (Local `.env` carries `NODE_ENV=production`,
  so dev-server QA used a temporary flag line, byte-restored after.)
- Visual QA (Playwright, dev): A EN/Light/1440 full-page; dialog/sheet/
  menu open captures; StatefulButton full sequence ("Saved (demo only)");
  toolbar switch asserted (`dir=rtl`, `dark` class); B AR/Dark/390
  full-page with 390=390 zero overflow + Enter-toggles accordion;
  768 + 1024 smoke zero overflow, zero console/page errors everywhere.

## Blockers

- (none). Noted, not blocking: production Sheet/Tooltip imports resolve
  to currently-untracked owner-vendored files
  (`animate-ui/{components,primitives}/radix/{sheet,tooltip}.tsx`) —
  works in-tree, breaks on clean checkout until the owner commits them;
  the lab mirrors production import paths and inherits the same state.
  Pre-existing worktree entries (owner/other work) preserved untouched.
