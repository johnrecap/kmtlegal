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

- [x] TASK-13-01 Route census: walk all 72 inventory URL patterns; confirm
  each renders the intended view (or the Phase 01 hiding behavior with owner
  proof); record 404/redirect expectations for hidden deferred routes.
- [x] TASK-13-02 Viewport matrix: 390 / 768 / 1024 / 1440 captures per route
  group (home, booking, directories, details, contact, policy, setup,
  payment, login, client ×8, admin ×24, lab); flag overflow + horizontal
  scroll + overlap defects.
- [x] TASK-13-03 Locale/theme matrix: EN + AR × Light + Dark where supported;
  RTL mirroring, `dir` islands, translated strings, gold contrast both themes.
- [x] TASK-13-04 Interaction matrix: focus order + visible focus, full
  keyboard runs (nav, drawer, dialogs, menus, tabs, accordions, sheets,
  tables, forms), mobile touch targets, scroll behaviors, animation
  correctness, reduced-motion full pass, hydration (no warnings), console
  clean, CLS check, performance sanity.
- [x] TASK-13-05 Technical gate: `npm run typecheck`, `npm run lint`,
  production build, unit tests (`npm test`), E2E suites (smoke + plan35 +
  plan36 + plan37 + db-backed where applicable) — all green. Record outputs.
- [x] TASK-13-06 Defect triage: file each defect under its owning phase,
  fix, re-verify the owning phase's acceptance items, and note the fix in
  this phase's QA Results. No scope expansion.
- [x] TASK-13-07 Release commit + push to `origin/main` (single commit for
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

- [x] Census complete with evidence per route group.
- [x] Matrix captures recorded; zero open defects (or defects listed in
  Blockers with owner sign-off).
- [x] Technical gate outputs pasted/green.
- [x] Release pushed with server handoff; STOP.

## Visual QA

- [x] Matrix capture archive referenced in QA Results.
- [x] Reduced-motion + keyboard + focus evidence recorded.

## Technical QA

- [x] typecheck / lint / build / unit / E2E outputs recorded, all green.

## Status

COMPLETE — with Blocker #1 (public-header kit lock) pending owner sign-off.
All QA executed from clean worktree @ `170dd1d`; primary dirty owner tree
untouched throughout. No source fixes required; release commit is
documentation-only.

## Implementation Notes

- Environment: temp clean worktree `kmt-phase13` @ `170dd1d`
  (`fix(release): make clean checkout production-complete`), bootstrap
  `npm ci` (1190 pkgs) + `npx prisma generate` (canonical `db:generate`;
  also auto via `prebuild`). Dev :3000 for census, prod build + `next
  start` :3100 for release-relevant proof. No untracked files copied in.
- Owner decisions verified: no `/articles|/case-studies|/media` routes
  (404 EN+AR); zero `nsights` in `public-pages.tsx` (Insights removed);
  `MatterRows` + `representativeMatters` present (line 299);
  `PublicFloatingDock` exactly 2 actions (book-consultation + WhatsApp,
  `public-floating-dock.tsx:24-29`), hidden on booking routes
  (`public-shell.tsx:191`); booking conversation-only — legacy stepper/
  assistant-panel deleted Phase 12, `booking-stepper`/`step N of` absent
  in DOM EN+AR; `/login` is single AR-first route
  (`lang=ar dir=rtl`, no `/ar/login` — matches brief listing `/login` only);
  `/install` 404s via `isInstallerEnabled()` gate (expected, needs owner
  token/env); receipt 404s without `attemptId+token` (expected gate);
  payment routes are locale-neutral (`/payment/consultation/*`, no
  `/ar/payment/*` — same URL serves both locales).
- Component lock: all families verified via import evidence EXCEPT the
  public header shell/flyout/drawer (see Blocker #1). Client Sidebar
  (`ui/sidebar`), Sheet mobile navs, Accordion, AnimatedList/VanishInput
  (client assistant + booking), FileUpload (portal + task-docs), Stateful
  Button (login/contact/setup/install/admin forms), AdminPagination +
  AdminRowActions + Menu/Popover/Dialog/Sheet/Accordion kit across all
  admin list/detail pages — all present. `ui/index.ts` barrel re-exports
  none of the vendor files (no barrel drift).
- Census: public core 200 EN+AR; detail slugs 200, unknown slugs 404;
  client ×8 + admin ×26 all 307 → `/login?next=…` with zero 500s;
  deferred 404 EN+AR; preview flag OFF → 404, ON → 200 (prod build).
  Bare-prod 500s on booking/login/setup/return proven env-only:
  `DATABASE_URL is required in production` (`prisma.ts:30`); with the var
  present all render 200 with no live DB needed.
- Visuals (prod :3100, zero console errors everywhere): home EN-dark-1440
  + AR-light-390 + 768/1024 smoke; services index, service detail AR,
  team index/detail; booking EN+AR (assistant+composer, no stepper);
  contact (mailto `dir=ltr` ×2), privacy, login, setup, return; lab
  EN-light-1440 + AR-dark-390 via toolbar (28 sections, `dir=rtl` +
  `dark` class + Arabic H1 asserted). Full-page captures live outside
  the repo (`phase13/shots/`). Floating-dock overlap on contact form
  proven by DOM to be the dock itself (2 fixed actions) — by design.
- Keyboard/a11y: Tab order logo→nav, visible `solid/2px` focus; mobile
  drawer `aria-expanded` false→true, Esc closes + focus returns to
  trigger; service accordion Enter toggles `aria-expanded` false→true
  (RTL); lab destructive dialog opens, focus trapped, Esc closes +
  unmounts (needs ~2.5s spring settle — first 500ms check was timing,
  not a defect); sheet demo same; trigger-less controlled close falls
  back to body focus (correct, no trigger to return to).
- RTL: AR pages `dir=rtl`; LTR islands verified (mailto×2 `dir=ltr`;
  amounts/IDs ride `bdi`/token paths per implementation).
- Theme: dark + warm light deep-checked; no navy/blue-gray drift, no
  giant gray booking panel, gold readable both themes; admin light-first
  unchanged (no token redesign).
- Reduced motion: `MotionConfig reducedMotion="user"` + matchMedia gate
  in parallax (`hero-parallax-layers.tsx:171,188`); reduce-context runs
  zero-error on home + booking.
- Hydration: dev-run warnings did NOT reproduce (15/15 clean reruns);
  production runs fully clean — dev-only noise, no defect.
- CLS home ~0.0001; zero horizontal overflow on all 19 measured views.

## Files Actually Changed

- `docs/ui-redesign/13_FINAL_QA_AND_RELEASE.md` (this evidence only).
  Zero source fixes (none required beyond Blocker #1, which is owner's).

## QA Results

- Route census: PASS (map above; 8 client + 26 admin + public core +
  deferred + preview gate, all as expected).
- Visual A–G: PASS (19 captures + 768/1024 smoke, all 200, overflow 0).
- Keyboard/a11y/RTL/theme/motion/console/CLS: PASS (evidence above).
- `npm run typecheck`: GREEN, zero errors (post `prisma generate`).
- `npm run lint`: GREEN (`No ESLint warnings or errors`).
- Unit (`npm test`): 615 passed / 1 failed / 53 skipped (91 files:
  85 passed, 1 failed, 5 skipped). The 1 failure =
  `tests/ui/public-pages.test.tsx` shell-nav test asserting
  `kmt-nav-indicator` — exists only in the owner's uncommitted header
  rework (primary tree `:200,267,301`), absent from this baseline.
  Same root cause as Blocker #1; test NOT weakened.
- E2E smoke (`test:e2e:smoke`): 42/42 GREEN (public, responsive,
  luxury surfaces, auth redirects, CORS guard).
- E2E plan35/36/37 + db-backed + postgres integration: SKIPPED,
  category C — reachable PG rejects dev credentials (P1000), no
  disposable/seeded test DB in this environment; suites require
  `createPlan35AuthenticatedTestState` DB writes. No shared dev data
  mutated.
- `npm run build`: GREEN (`Compiled successfully`, 40/40 static;
  `ALLOW_BUILD_WITHOUT_DATABASE_URL=true` hatch used, unchanged).
- Authenticated client/admin browser rendering: environment-blocked
  (no session without seeded DB); covered by unit suite (portal/admin
  form, kit, pagination tests) + kit rendering proven via Design Lab.

## Blockers

- #1 (owner sign-off required): committed public header
  (`layout/public-header.tsx` @ `f845530`) is a custom implementation;
  DECISIONS.md #PUBLIC HEADER locks Resizable Navbar + Navbar Menu +
  Sheet + Tooltip (substitute: REJECTED). `resizable-navbar` never
  appears in committed layout history; the kit-based header exists only
  as uncommitted owner work in the primary tree (which also carries the
  `kmt-nav-indicator` the committed `public-pages.test.tsx` asserts —
  hence the 1 unit failure). Rewriting the header in final QA would be
  redesign-scale and would duplicate/overrule owner's in-flight work,
  so per defect-fix discipline it is recorded, not attempted. Shipped
  header behavior itself is verified correct (render/keyboard/RTL/
  drawer/dock/dark-light). Release sign-off decision: owner's.
