# Phase 02 — Foundations + Public Chrome

## Objective

Land the shared public foundation every later public phase builds on:
semantic theme tokens (dark deep-black + light legal-paper, logo-derived
gold), single-owner motion table with Lenis scoping, stabilized locked
header family, kept Aceternity dock, and themed custom footer. Verify the
Magic Animated Theme Toggler against the real `next-themes` setup; on
failure mark BLOCKED and keep the current toggle.

## Current State

- Theme: `ThemeProvider` (`src/components/theme/theme-provider.tsx`,
  `next-themes` wrapper, per-area defaults/storage keys) + `ThemeToggle`
  (`theme-toggle.tsx`); public vars `--kmt-public-*` in
  `src/app/globals.css:69-130`; Tailwind token mapping in
  `tailwind.config.ts:22-83` + `src/lib/design-system/tokens.ts`;
  motion-speed tokens `duration-kmt-*/ease-kmt-*`; `kmt-motion-*` classes via
  `public-motion.ts`. Hard-coded dark surfaces in client shell (not this
  phase) and `bg-black` brand plaque (`public-shell.tsx:108`).
- Motion owners today: Lenis + GSAP ticker + ScrollTrigger in
  `smooth-scroll-provider.tsx` (both public roots, global); GSAP parallax in
  `hero-parallax-layers.tsx`; Motion in header/nav/dock/hero/cards/chat;
  CSS `kmt-*` keyframes/transitions; IO in `Reveal`/`PolicyToc`/spotlight
  unmount; raw scroll listeners (`ReadingProgress`, header conceal,
  chat auto-scroll).
- Header: `PublicHeader` (`public-header.tsx`) — `NavBody`/`MobileNav`
  (resizable-navbar) + `Menu`/`MenuItem` (navbar-menu) + Animate `Sheet`
  drawer + Animate `Tooltip`s + `RippleLink` + `ConsultationLink`
  (`ShimmerCtaLink`) + `ClientLoginLink`; scroll conceal past 320px.
- Dock: `PublicFloatingDock` + Aceternity `FloatingDock`, 2 actions, hidden
  on booking routes (`public-shell.tsx:56,191`).
- Footer: custom layout in `PublicShell` (`:70-186`) — CTA card
  (`BorderBeam` + underlines + `ShimmerCtaLink`), 4-col grid, legal bar.

## Target State

- Semantic tokens cover every public surface; no page-level arbitrary hex
  where a token applies; logo-derived gold ramp landed for both themes.
- Motion-ownership table complete; Lenis scoped to pages that genuinely need
  smooth-scroll effects; one interaction/property = one owner; no duplicate
  drivers on the same property.
- Header family unchanged (locked), with fixed performance/scroll/themes/RTL/
  logo/active-state behavior; dock unchanged (2 actions, booking-hide kept);
  footer layout kept with improved theme/brand-plaque/spacing/typography/CTA/
  hover states.
- Theme toggler: Magic Animated Theme Toggler replaces the internals of the
  SHARED `ThemeToggle` component ONLY on verified `next-themes`
  compatibility; otherwise BLOCKED, current toggle kept. Phase 02 VERIFIES
  the shared component renders in Public, Client, and Admin, but does NOT
  redesign Client/Admin theme surfaces (Client theming is Phase 07; Admin
  surfaces are Phase 09). If changing the shared `ThemeToggle` alone is
  sufficient, client/admin shell files stay untouched.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Public header shell + flyout | Resizable Navbar + Navbar Menu | KEEP CURRENT | Resizable Navbar, Navbar Menu | Aceternity UI | https://ui.aceternity.com/components/resizable-navbar, https://ui.aceternity.com/components/navbar-menu |
| Mobile drawer | Animate Sheet | KEEP CURRENT | Sheet | Animate UI | https://animate-ui.com/docs/components/radix/sheet |
| Header tips | Animate Tooltip | KEEP CURRENT | Tooltip | Animate UI | https://animate-ui.com/docs/components/radix/tooltip |
| Flyout CTA press | RippleLink | KEEP CURRENT | RippleLink (vendored pattern) | Animate UI | — (vendored) |
| Floating actions | Floating Dock (2 actions) | KEEP CURRENT | Floating Dock | Aceternity UI | https://ui.aceternity.com/components/floating-dock |
| Theme toggle control | `ThemeToggle` | REPLACE WITH: Magic UI Animated Theme Toggler (conditional, see tasks) | Animated Theme Toggler | Magic UI | https://magicui.design/docs/components/animated-theme-toggler |
| Footer chrome + CTA | Custom footer + Border Beam + Highlighter wrapper | KEEP CURRENT | Border Beam, Highlighter | Magic UI | https://magicui.design/docs/components/border-beam, https://magicui.design/docs/components/highlighter |
| Smooth scroll | Global Lenis provider | KEEP CURRENT (scope narrowed per motion table) | None (no new component) | — | — |

## Tasks

- [ ] TASK-02-01 Token audit: list every arbitrary hex / literal color in
  public-shell/header/hero/footer/public-components files; map each to an
  existing or new semantic token. Record the map in Implementation Notes.
- [ ] TASK-02-02 Land tokens: extend `--kmt-public-*` vars (light + dark),
  gold ramp derived from the KMT logo source, and Tailwind mappings; keep
  `duration-kmt-*`/`ease-kmt-*` as the only motion-speed source.
- [ ] TASK-02-03 Repoint public chrome + shared public components to tokens;
  keep the deliberate `bg-black` brand plaque only with an in-code comment.
  Verify EN + AR, light + dark, at 390/768/1024/1440.
- [ ] TASK-02-04 Build the Motion Ownership table (Area × Animation × Current
  Owner × Final Owner × Remove Conflict?) covering Lenis, GSAP,
  ScrollTrigger, Motion, CSS keyframes, IntersectionObserver, raw scroll
  listeners. One interaction/property = one owner.
- [ ] TASK-02-05 Scope Lenis: restrict `SmoothScrollProvider` to pages with
  genuine smooth-scroll effects per the ownership table; keep reduced-motion
  disablement; verify anchor links + `ScrollTrigger.update()` still work on
  every public route.
- [ ] TASK-02-06 Remove duplicate drivers found in TASK-02-04 (same property
  animated by two owners), keeping the Final Owner column as built.
- [ ] TASK-02-07 Header hardening (family unchanged): scroll-conceal vs drawer
  interplay, `glassed` pill readability with flyout open, logo scale constant
  across scroll states, active-link indicator, RTL drawer side, keyboard +
  focus handling, reduced-motion. Test EN + AR.
- [ ] TASK-02-08 Dock check: 2 actions only, booking-route hiding intact,
  safe-area + composer overlap re-verified, light + dark, RTL.
- [ ] TASK-02-09 Footer pass (layout kept): theme vars, brand-plaque treatment,
  spacing rhythm, typography scale, CTA hover, link focus states, legal bar.
- [ ] TASK-02-10 Theme-toggler verification: install the official Magic
  Animated Theme Toggler in isolation; replace the internals of the SHARED
  `ThemeToggle` component with it under controlled `theme` + `onThemeChange`
  wiring to the existing `next-themes` setup; VERIFY the shared component
  renders correctly in Public, Client, and Admin shells without redesigning
  any Client/Admin theme surface (those belong to Phases 07/09). Verify
  persistence keys, SSR first paint, and reduced-motion. Client/admin shell
  files stay untouched unless the shared change strictly requires it
  (record justification). On ANY incompatibility: mark
  BLOCKED — OWNER DECISION REQUIRED with evidence and STOP this task,
  keeping the current `ThemeToggle`.
- [ ] TASK-02-11 Regression sweep: home + one directory + booking + contact in
  EN + AR, light + dark, mobile + desktop; console clean; no hydration
  warnings.
- [ ] TASK-02-12 Phase commit (foundation scope only) per 00_MASTER_PLAN, then STOP.

## Files Expected To Change

- `src/app/globals.css`, `tailwind.config.ts`,
  `src/lib/design-system/tokens.ts`,
  `src/features/public-site/public-motion.ts`,
  `src/components/motion-ui/smooth-scroll-provider.tsx`,
  `src/components/layout/public-header.tsx`,
  `src/components/layout/public-shell.tsx`,
  `src/components/layout/public-floating-dock.tsx`,
  `src/components/theme/theme-toggle.tsx` (only if TASK-02-10 verifies),
  new vendor file for the toggler (only if TASK-02-10 verifies).

## Files That Must NOT Change

- Page views and booking/chat logic (`public-pages.tsx`,
  `consultation-booking-chat.tsx`, forms), backend/API/database/auth,
  client portal files, admin files, routes/sitemap,
  `docs/KMT_COMPLETE_UI_INVENTORY.md`.

## Dependencies

- Phase 01 (deferred-content link inventory informs footer/nav link handling).
  Blocks Phases 03–06.

## Risks

- Token repointing shifts gold contrast in one theme → mitigate with
  side-by-side light/dark capture per task group.
- Lenis scoping breaks anchor smooth-scroll on a route → mitigated by
  TASK-02-05 per-route verification.
- Toggler incompatibility with custom storage keys → contained by the
  BLOCKED rule in TASK-02-10; nothing else waits on it.

## Acceptance Criteria

- [ ] Zero arbitrary hex in public chrome/shared files where a token applies.
- [ ] Motion-ownership table complete; no property has two drivers.
- [ ] Header/dock/footer pass EN+AR × light+dark × 390/1440 with clean console.
- [ ] Toggler either integrated + verified or marked BLOCKED with evidence.
- [ ] One phase commit; STOP.

## Visual QA

- [ ] Header pill/flyout/drawer captures EN+AR, light+dark, top+scrolled.
- [ ] Footer CTA + grid + legal bar captures, both themes.
- [ ] Dock visible on home, hidden on `/book-consultation` (+ AR).

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] No hydration warnings on traversed routes; reduced-motion path checked.
- [ ] E2E smoke for header nav + language switch + theme switch passes.

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
