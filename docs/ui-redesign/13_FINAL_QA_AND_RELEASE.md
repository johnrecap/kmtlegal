# Phase 13 — Final QA + Release

## Objective

Test the entire remaining product across the full viewport/locale/theme
matrix, verify layout/theme/RTL/focus/keyboard/mobile/scroll/animations/
reduced-motion/hydration/console/overflow/CLS/performance, run the full
technical gate (typecheck, lint, production build, unit, E2E), and release
with a single release commit plus server handoff.

## Current State

Input: all Phases 01–12 marked COMPLETE with per-phase QA evidence. Public
surface = Phase 01 ruling applied (deferred content hidden or kept per owner).
Booking is conversation-only. Client + admin run on locked shared primitives.
Design Lab is internal-only. Inventory doc remains the frozen pre-redesign
record.

## Target State

A release-ready `main`: every route in the Step 1 inventory (minus
owner-removed deferred public routes, if any) verified across 390 / 768 /
1024 / 1440 × EN / AR × Light / Dark where supported; zero console errors;
technical gate fully green; release commit pushed with the standard server
pull/deploy handoff.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Entire product UI | Post-redesign state | KEEP CURRENT (verify only; no component changes in this phase) | None | — | — |

Any defect found here is fixed in the owning phase's file context and
re-verified; no new components are introduced in Phase 13.

## Tasks

- [ ] TASK-13-01 Route census: walk all 72 inventory URL patterns; confirm
  each renders the intended view (or the Phase 01 hiding behavior with owner
  proof); record 404/redirect expectations for hidden deferred routes.
- [ ] TASK-13-02 Viewport matrix: 390 / 768 / 1024 / 1440 captures per route
  group (home, booking, directories, details, contact, policy, setup,
  payment, login, client ×8, admin ×24, lab); flag overflow + horizontal
  scroll + overlap defects.
- [ ] TASK-13-03 Locale/theme matrix: EN + AR × Light + Dark where supported;
  RTL mirroring, `dir` islands, translated strings, gold contrast both themes.
- [ ] TASK-13-04 Interaction matrix: focus order + visible focus, full
  keyboard runs (nav, drawer, dialogs, menus, tabs, accordions, sheets,
  tables, forms), mobile touch targets, scroll behaviors, animation
  correctness, reduced-motion full pass, hydration (no warnings), console
  clean, CLS check, performance sanity.
- [ ] TASK-13-05 Technical gate: `npm run typecheck`, `npm run lint`,
  production build, unit tests (`npm test`), E2E suites (smoke + plan35 +
  plan36 + plan37 + db-backed where applicable) — all green. Record outputs.
- [ ] TASK-13-06 Defect triage: file each defect under its owning phase,
  fix, re-verify the owning phase's acceptance items, and note the fix in
  this phase's QA Results. No scope expansion.
- [ ] TASK-13-07 Release commit + push to `origin/main` (single commit for
  Phase 13 QA evidence + fixes), then server handoff commands
  (`cd /www/wwwroot/kmtlegal` + `bash deploy/install/aapanel-pm2-update.sh`
  — or the explicitly requested target). STOP.

## Files Expected To Change

- `docs/ui-redesign/13_FINAL_QA_AND_RELEASE.md` (evidence only) + defect
  fixes in owning-phase files (recorded here and in the owning phase file).

## Files That Must NOT Change

- Anything outside defect fixes; no component swaps, no route changes, no
  backend/API/database changes, inventory doc frozen.

## Dependencies

- Phases 01–12 COMPLETE. Owner availability for any last-minute ruling.

## Risks

- Late discovery of a structural defect → handled by owning-phase fix +
  re-verification, never by a Phase 13 redesign.
- Matrix size (72 patterns × 4 viewports × 2 locales × 2 themes) → group by
  route family with representative full coverage + smoke coverage for the
  rest (record the sampling map).

## Acceptance Criteria

- [ ] Census complete with evidence per route group.
- [ ] Matrix captures recorded; zero open defects (or defects listed in
  Blockers with owner sign-off).
- [ ] Technical gate outputs pasted/green.
- [ ] Release pushed with server handoff; STOP.

## Visual QA

- [ ] Matrix capture archive referenced in QA Results.
- [ ] Reduced-motion + keyboard + focus evidence recorded.

## Technical QA

- [ ] typecheck / lint / build / unit / E2E outputs recorded, all green.

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
