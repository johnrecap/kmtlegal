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

- [ ] TASK-12-01 Deletion protocol per candidate file: (1) import grep
  repo-wide, (2) route/render grep, (3) `npm run typecheck`, (4) unit tests,
  (5) production build — all green before AND after removal. Record the
  five proofs per deleted file. Any failure → keep the file, record why.
- [ ] TASK-12-02 Delete `booking-stepper.tsx` + `consultation-assistant-panel.tsx`
  only after TASK-12-01 proofs + Phase 04 grep gate re-confirmed.
- [ ] TASK-12-03 Delete `domain/legal-cards.tsx` (or individual dead exports)
  only after proofs; if any export gained an importer in Phases 03–11, keep
  that export and record it.
- [ ] TASK-12-04 Delete `ui/number-ticker.tsx` + `ui/shimmer-button.tsx` +
  proven-unused Animate pieces (never the Tabs files adopted by Phase 09;
  never Sheet/Tooltip/primitives in use).
- [ ] TASK-12-05 Stale CSS sweep: orphaned `kmt-*` classes, dead tokens,
  unused imports/exports in touched files; remove with build proof.
- [ ] TASK-12-06 Design Lab content: rebuild `/preview/components` sections
  to mirror production primitives 1:1 (same imports as production where
  feasible), covering the full required list in both themes and both
  locales/directions.
- [ ] TASK-12-07 Design Lab states: empty + loading + error + permission
  states, Stateful async sequences, File Upload demo, dialog/sheet/popover/
  menu/tooltip demos, DataTable + Pagination demo, FloatingDock +
  ThemeToggle demos. Gate stays (`notFound()` in production without the flag).
- [ ] TASK-12-08 Lab QA: every demo renders EN+AR × light+dark; no production
  nav links to the lab; flag-gate verified in production build mode.
- [ ] TASK-12-09 Final cleanup commit (deletions + lab in ONE phase commit
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

## Risks

- Deleting a file with a dynamic/static-param reference (articles/case-study
  params, sitemap) → mitigated by route-grep step + production build proof.
- Lab drifting from production over time → mitigate by importing production
  primitives directly wherever feasible (record exceptions).

## Acceptance Criteria

- [ ] Five proofs recorded per deleted file; build green after each batch.
- [ ] Zero references to deleted modules remain (grep proof).
- [ ] Lab shows every required item × Light/Dark × EN/AR-RTL.
- [ ] Production build with flag off still `notFound()`s preview routes.
- [ ] Commit(s) per task; STOP.

## Visual QA

- [ ] Lab full-page captures × theme × locale.
- [ ] Before/after bundle or file-count evidence for deletions.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green twice
  (pre- and post-deletion).
- [ ] Unit + E2E suites green after deletions.

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
