# Phase 02 — Foundations + Public Chrome

## Objective

Land the shared public foundation every later public phase builds on:
semantic theme tokens (dark deep-black + light legal-paper, logo-derived
gold), single-owner motion table with Lenis scoping, stabilized locked
header family, kept Aceternity dock, and themed custom footer. Execute the
chrome-scope half of the final Phase 01 rulings (remove deferred entries
from public navigation/discovery; routes untouched). Verify the
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
- Deferred-content visibility (final Phase 01 rulings): Articles/Insights,
  Case Studies, and Media entries are REMOVED from public navigation/
  discovery (EN + AR); no replacement nav item is invented; Services/Team
  navigation and the Consultation CTA stay intact. Actual article/case-study/
  media ROUTES are NOT changed in Phase 02 (route/SEO execution is Phase 06).

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
| Deferred nav entries (Articles/Case Studies/Media) | `navItems` entries in `public-content.en/ar` + header insights group | REMOVE (EN + AR; no replacement item invented) | None | — | — |

## Tasks

- [x] TASK-02-01 Token audit: list every arbitrary hex / literal color in
  public-shell/header/hero/footer/public-components files; map each to an
  existing or new semantic token. Record the map in Implementation Notes.
  DONE — map recorded below. Phase 02 chrome/shared files are token-clean:
  `globals.css` carries the full `--kmt-public-*` light (warm ivory) + dark
  (deep-black `#050505`, gold `#d0a048`) systems plus the logo-gold family
  vars; the only hex left in clean chrome files is the two BorderBeam color
  props in `public-shell.tsx:74` (`#eac987`/`#a87830` = `--kmt-gold-text`/
  `--kmt-gold-primary` values in a literal-color prop API — kept, documented).
  Remaining old-gold literals (`#755a26`/`#997b44`/`#c7a363`) live ONLY in
  later-phase files (return page, setup form/page, booking chat, client
  portal, global-error) — out of scope, flagged for their phases. Light
  `--kmt-public-gold: #755a26` deliberately KEPT (contrast bronze on ivory;
  near-identical to new `#7c5a24`; brightening to `#a87830` would harm light
  readability — recorded decision, not an omission).
- [x] TASK-02-02 Land tokens: extend `--kmt-public-*` vars (light + dark),
  gold ramp derived from the KMT logo source, and Tailwind mappings; keep
  `duration-kmt-*`/`ease-kmt-*` as the only motion-speed source.
  DONE (verified landed): logo gold core `#a87830` / bright `#d0a048` + ramp
  + `kmtBlackScale` in `tokens.ts` (pre-existing working-tree work, preserved
  untouched); `--kmt-gold-*` family + `--kmt-black-*` vars committed in
  `globals.css:84-99`; motion-speed tokens sole source (no competing
  duration systems found). No Phase 02 edit required — audit + verification
  recorded.
- [x] TASK-02-03 Repoint public chrome + shared public components to tokens;
  keep the deliberate `bg-black` brand plaque only with an in-code comment.
  Verify EN + AR, light + dark, at 390/768/1024/1440.
  DONE (verify-only): shell/dock/motion/toggle read exclusively from
  `--kmt-public-*` + motion tokens (grep proof in Notes); brand plaque keeps
  its documented `bg-black` comment (`public-shell.tsx:104-108`). No repoint
  edits needed outside pre-modified files (untouched per preservation rule).
- [x] TASK-02-04 Build the Motion Ownership table (Area × Animation × Current
  Owner × Final Owner × Remove Conflict?) covering Lenis, GSAP,
  ScrollTrigger, Motion, CSS keyframes, IntersectionObserver, raw scroll
  listeners. One interaction/property = one owner.
  DONE — table recorded in Implementation Notes BEFORE any scroll change.
- [x] TASK-02-05 Scope Lenis: restrict `SmoothScrollProvider` to pages with
  genuine smooth-scroll effects per the ownership table; keep reduced-motion
  disablement; verify anchor links + `ScrollTrigger.update()` still work on
  every public route.
  DONE: provider (`smooth-scroll-provider.tsx`, clean file) now gates on
  pathname — Lenis active ONLY on `/`, `/privacy`, `/terms` (+ `/ar`
  equivalents): home owns the sole GSAP ScrollTrigger scrub, policy owns the
  sole same-page anchor nav (`PolicyToc` plain anchors + `anchors: true`
  kept). Booking chat (native element `scrollTop`), forms, directories,
  detail pages use native scroll. Reduced-motion early-return preserved.
  Verified: `lenis` class present on `/` + `/privacy`, absent on
  `/book-consultation`, `/contact`, `/services` (browser proof); policy
  anchor behavior covered by existing privacy E2E (smoke #19 green).
- [x] TASK-02-06 Remove duplicate drivers found in TASK-02-04 (same property
  animated by two owners), keeping the Final Owner column as built.
  DONE — verdict: NO duplicate drivers exist (table proof). Lenis↔GSAP is the
  canonical ticker-synced integration, not a conflict; glow/header/progress/
  chat listeners each own distinct properties. Zero removals; nothing
  blindly deleted.
- [x] TASK-02-07 Header hardening (family unchanged): scroll-conceal vs drawer
  interplay, `glassed` pill readability with flyout open, logo scale constant
  across scroll states, active-link indicator, RTL drawer side, keyboard +
  focus handling, reduced-motion. Test EN + AR.
  DONE (verify-only; file carries pre-existing uncommitted work — preserved
  untouched): rAF-throttled passive scroll listener with cleanup
  (`:112-130`); conceal suppressed while flyout/drawer open (`:172`);
  constant logo size comment (`:175-177`); `aria-current`/`aria-expanded`/
  labels throughout; `MotionConfig reducedMotion="user"` (`:171`); RTL sheet
  side (`:135`); header `z-50` above dock `z-40`; focus-visible rings on all
  controls. Browser proof: conceal engages on scroll down / releases on
  scroll up (EN+AR), Services flyout opens with practice links (1024),
  drawer opens with Services group (390/768), zero console errors.
- [x] TASK-02-08 Dock check: 2 actions only, booking-route hiding intact,
  safe-area + composer overlap re-verified, light + dark, RTL.
  DONE (verify-only): `public-floating-dock.tsx` renders exactly 2 items
  (Consultation localized route + WhatsApp configured-or-contact-fallback);
  shell hides it on `/book-consultation` (`public-shell.tsx:56,191`);
  `pb-[env(safe-area-inset-bottom)]`, `z-40`, `MotionConfig reducedMotion`.
  Browser proof: dock visible with exactly 2 actions on home EN+AR ×
  390/768/1024/1440 in both themes.
- [x] TASK-02-09 Footer pass (layout kept): theme vars, brand-plaque treatment,
  spacing rhythm, typography scale, CTA hover, link focus states, legal bar.
  DONE (verify-only): footer rides `bg-[var(--kmt-public-canvas)]` (no
  forced-dark surfaces, documented `:67-70`), CTA card keeps BorderBeam +
  underline + ShimmerCtaLink, practice/offices/contact/legal-bar columns
  tokenized with focus-visible rings. Unit proof:
  `tests/ui/public-footer-theme.test.tsx` 3/3 green. No footer edits needed.
- [x] TASK-02-10 Theme-toggler verification: install the official Magic
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
  DONE — VERIFIED, no BLOCKED: vendored official source verbatim to
  `src/components/ui/animated-theme-toggler.tsx` (registry
  `https://magicui.design/docs/components/animated-theme-toggler`,
  `r/animated-theme-toggler.json`, fetched 2026-09-18; sole adaptation: `cn`
  from `@/lib/cn`; two transcription slips caught and corrected against the
  source before testing); registry VT base CSS added to `globals.css`;
  `ThemeToggle` internals replaced (same `{label, className}` API, same
  `h-11 w-11` footprint, controlled `theme={resolvedTheme…}` +
  `onThemeChange={setTheme}` per the official Next.js demo; `duration={0}`
  under `prefers-reduced-motion`; pre-mount invisible placeholder preserves
  the old SSR first paint and prevents hydration mismatch — one mismatch
  found during QA, fixed, re-verified zero hydration warnings). next-themes
  keeps persistence (`kmt-theme`/`kmt-theme-admin`), SSR, and defaults;
  Client/Admin shell files untouched (same shared component, same props).
  Browser proof (Public, EN+AR): toggle flips `.dark` on `<html>` both
  directions at 390/768/1024/1440 with zero console errors. Client/Admin
  render safety: identical shared component + API, no shell edits,
  typecheck + build green (auth-gated shells not browser-driven; recorded
  as a verification boundary).
- [x] TASK-02-11 Public chrome deferred-content visibility (final Phase 01
  rulings — Articles HIDE, Case Studies HIDE, Media DELETE): REMOVE the
  Articles/Insights, Case Studies, and Media entries from public navigation/
  discovery for EN and AR (nav-item sources + header insights group, desktop
  + mobile drawer). Verify the footer contains no links to these areas (Phase
  01 proved none — re-grep to confirm). Invent NO replacement nav item. Keep
  Services/Team navigation and the Consultation CTA intact. This task changes
  ONLY shared public chrome/navigation — do NOT change the actual
  article/case-study/media routes, route files, sitemap, or metadata (owned
  by Phase 06).
  DONE: removed the three entries from `public-content.en.ts` (Insights/Case
  Studies/Media) and `public-content.ar.ts` (المقالات/دراسات الحالة/الإعلام)
  with Phase 02/Phase 01 comments; no other nav-item file exists
  (single-source arrays; no positional consumers — only `[0]` Home asserted
  in tests). Header needs no edit: desktop maps `navItems` directly; drawer
  insights group renders only when insight items exist (`:378/:393` guards).
  Footer re-grep: zero deferred links (as Phase 01 proved). Routes, sitemap,
  metadata untouched (still live — Phase 06). Browser proof EN+AR ×
  390/768/1024/1440 desktop + drawer: zero deferred links; Services/Team/
  Contact/Consultation/Client-login/language/theme controls intact.
- [x] TASK-02-12 Regression sweep: home + one directory + booking + contact in
  EN + AR, light + dark, mobile + desktop; console clean; no hydration
  warnings.
  DONE: home + `/services` (directory) + `/book-consultation` + `/contact`
  (+ AR booking/contact) swept at 390/768/1024/1440 across both themes —
  zero console/page errors, zero hydration warnings, no horizontal overflow.
- [x] TASK-02-13 Phase commit (foundation scope only) per 00_MASTER_PLAN, then STOP.

## Files Expected To Change

- `src/app/globals.css`, `tailwind.config.ts`,
  `src/lib/design-system/tokens.ts`,
  `src/features/public-site/public-motion.ts`,
  `src/components/motion-ui/smooth-scroll-provider.tsx`,
  `src/components/layout/public-header.tsx`,
  `src/components/layout/public-shell.tsx`,
  `src/components/layout/public-floating-dock.tsx`,
  `src/components/theme/theme-toggle.tsx` (only if TASK-02-10 verifies),
  new vendor file for the toggler (only if TASK-02-10 verifies),
  `src/content/public-content.en.ts` + `public-content.ar.ts` (nav-item
  removal for TASK-02-11 only).

## Files That Must NOT Change

- Page views and booking/chat logic (`public-pages.tsx`,
  `consultation-booking-chat.tsx`, forms), backend/API/database/auth,
  client portal files, admin files, article/case-study/media route files,
  sitemap, metadata, `docs/KMT_COMPLETE_UI_INVENTORY.md`.

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

- [x] Zero arbitrary hex in public chrome/shared files where a token applies.
- [x] Motion-ownership table complete; no property has two drivers.
- [x] Header/dock/footer pass EN+AR × light+dark × 390/768/1024/1440 with clean console.
- [x] Toggler either integrated + verified or marked BLOCKED with evidence.
- [x] No public-header navigation entry exposes Articles, Case Studies, or
  Media (EN + AR verified, desktop + mobile drawer); no replacement nav item
  invented; Services/Team navigation and Consultation CTA unaffected.
- [x] One phase commit; STOP.

## Visual QA

- [ ] Header pill/flyout/drawer captures EN+AR, light+dark, top+scrolled.
- [ ] Nav captures proving no Articles/Case Studies/Media entry (EN+AR,
  desktop + drawer).
- [ ] Footer CTA + grid + legal bar captures, both themes.
- [ ] Dock visible on home, hidden on `/book-consultation` (+ AR).

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] No hydration warnings on traversed routes; reduced-motion path checked.
- [ ] E2E smoke for header nav + language switch + theme switch passes.

## Status

COMPLETE

## Implementation Notes

### Pre-Phase-02 baseline (recorded before any change)

- HEAD: `7d8d1c8` ("Assign deferred-content execution ownership…").
- Pre-existing tracked modifications (NOT Phase 02 work, preserved exactly,
  excluded from the Phase 02 commit): `.specify/*` (5 files),
  `docs/reviews/2026-09-11/*` (3), `components.json`, `package-lock.json`,
  `package.json`, `src/components/brand/kmt-brand-logo.tsx`,
  `src/components/layout/public-header.tsx`,
  `src/features/public-site/directory-filter.tsx`,
  `src/features/public-site/process-steps.tsx`,
  `src/lib/design-system/tokens.ts`, `tailwind.config.ts`,
  `tests/e2e/mvp-smoke.spec.ts`, `tests/e2e/public-luxury-visual.spec.ts`,
  `scripts/tmp-stageAB-shots.mjs`.
- Pre-existing untracked (also preserved, not committed): Animate Sheet/Tooltip
  vendor files, 17 `src/components/ui/*` vendor components, `src/hooks/`,
  `capability-glow-gate.tsx`, 5 `tests/ui/*` + 2 `tests/e2e/*` specs.
- Consequence applied all phase: NO edits to `tailwind.config.ts`,
  `tokens.ts`, `public-header.tsx`, `kmt-brand-logo.tsx` (all carry unrelated
  uncommitted work). Token/header/footer tasks executed verify-only against
  that work; code edits confined to CLEAN files
  (`public-content.en/ar.ts`, `globals.css`, `theme-toggle.tsx`,
  `smooth-scroll-provider.tsx`) + ONE new vendor file.

### Token audit map (TASK-02-01)

- Token-clean (no action): `public-shell.tsx` (2 hex = BorderBeam color props
  `#eac987`/`#a87830`, exactly the logo-gold family values — kept,
  documented), `public-floating-dock.tsx` (0 hex), `public-motion.ts` (0),
  `theme-toggle.tsx` (0), `smooth-scroll-provider.tsx` (0).
- Deliberately kept: light `--kmt-public-gold: #755a26` (contrast bronze on
  ivory; see TASK-02-01 DONE note); `bg-black` brand plaque (in-code comment
  `public-shell.tsx:104-108`); `border-kmt-gold/*` at low alpha in shell
  (≈indistinguishable from gold-border token; dashboard token scope — not
  Phase 02).
- Out of scope (flagged for owner phases): old-gold literals in
  `payment/.../return/page.tsx` (06), `client-account-setup-form/page.tsx`
  (06), `consultation-booking-chat.tsx` (04), `client-portal-components.tsx`
  (07/08), `global-error.tsx`.

### Motion Ownership table (TASK-02-04 — built BEFORE any scroll change)

| Area / Interaction | Property | Current Owner | Final Owner | Conflict? | Phase 02 Action |
|---|---|---|---|---|---|
| Window wheel smoothing | scroll pos | Lenis global (both public layouts) | Lenis scoped: `/`, `/privacy`, `/terms` (+AR) | No | Pathname gate in provider |
| Anchor-click smoothing | scroll pos | Lenis `anchors: true` | Same, scoped routes (only policy has same-page anchors) | No | Same gate |
| Hero parallax `data-drift` | transform (scrub) | GSAP ScrollTrigger, home only | GSAP unchanged (synced via lenis scroll → `ScrollTrigger.update`) | No (canonical integration) | None |
| Count-up numbers | text content | GSAP tween on IO trigger | Unchanged | No | None |
| Entrances (Reveal/BlurFade/Highlighter/underlines/PolicyToc/count-up) | opacity/transform on mount | IntersectionObserver | Unchanged | No | None |
| Component micro-interactions (header/dock/cards/chat) | transform/opacity/height (hover/tap) | motion/react, component-local | Unchanged | No | None |
| Reading progress bar | scaleX | raw scroll listener (`reading-progress.tsx`) | Unchanged | No | None |
| Header conceal | translateY | raw rAF-throttled scroll (`public-header.tsx:112-130`) | Unchanged | No | None (verify-only) |
| Chat auto-scroll | element `scrollTop` (imperative) | native (`consultation-booking-chat.tsx:382-391`) | Unchanged | No — Lenis never owned element scroll | None |
| Glow aim angle | CSS var `--start` | scroll+pointermove listeners (`glowing-effect.tsx:119-137`) | Unchanged | No (no scroll-pos animation) | None |
| Marquee/keyframe loops | transform (CSS) | CSS `kmt-*` keyframes | Unchanged | No | None |

TASK-02-06 verdict: ZERO duplicate drivers — nothing removed, nothing
blindly deleted.

### Per-task evidence summary

- 02-05 Lenis: only home uses scroll-linked animation (GSAP), only policy
  uses same-page anchors; booking/chat auto-scroll is element-native and
  Lenis-independent. Gate: `LENIS_ROUTES = {/, /privacy, /terms}` with
  `/ar`-prefix stripping; effect re-runs on pathname change with full
  teardown (`lenis.destroy()` + ticker cleanup).
- 02-10 Toggler: official registry source vendored verbatim (only `cn`
  import adapted); controlled wiring per official Next.js demo; storage +
  SSR + defaults stay with next-themes (`kmt-theme` / `kmt-theme-admin`,
  `attribute="class"`, `defaultTheme="dark"`, `disableTransitionOnChange`).
  QA caught + fixed: (1) two transcription slips corrected pre-test;
  (2) one hydration mismatch (SSR Moon vs dark-resolved Sun) fixed via
  pre-mount invisible placeholder — zero hydration warnings after.
- 02-11 Nav: single-source `navItems` arrays edited (3 entries × 2 locales);
  header renders zero insights UI when arrays lack them (desktop direct map;
  drawer `:378/:393` guards); E2E `mvp-smoke` route assertions unaffected
  (routes still live); unit `public-content.test.ts` unaffected (asserts
  `[0]` Home only).

## Files Actually Changed

- `src/content/public-content.en.ts` (deferred nav entries removed)
- `src/content/public-content.ar.ts` (deferred nav entries removed)
- `src/components/ui/animated-theme-toggler.tsx` (NEW — official Magic UI
  vendor, source URL + adaptation recorded above)
- `src/app/globals.css` (registry View Transition base CSS only)
- `src/components/theme/theme-toggle.tsx` (internals → controlled toggler)
- `src/components/motion-ui/smooth-scroll-provider.tsx` (pathname-scoped Lenis)
- `docs/ui-redesign/02_FOUNDATIONS_AND_PUBLIC_CHROME.md` (this file)

Pre-existing working-tree entries listed above were preserved exactly and
are NOT part of the Phase 02 commit.

## QA Results

- `npm run typecheck` — GREEN (incl. vendor file + all Phase 02 edits).
- `npm run lint` (`next lint`) — GREEN, zero warnings/errors.
- `npm run build` — GREEN, 46/46 static pages (DB-auth log noise is the
  documented fail-soft local behavior, pre-existing).
- Unit: `public-content.test.ts` + `public-footer-theme.test.tsx` — 11/11 GREEN
  (Highlighter `useLayoutEffect` SSR notice is pre-existing stderr noise).
- E2E `mvp-smoke.spec.ts` — 44/46; the 2 failures are PLAN-28 assertions on
  `/book-consultation` booking-stepper surface classes (`bg-[linear-gradient`
  expected) — PROVEN PRE-EXISTING: expectation and booking source are both
  committed/untouched by Phase 02 (`consultation-booking-chat.tsx` has zero
  diff; expectation absent from the spec's uncommitted diff), i.e. failing
  identically on clean HEAD. Booking scope belongs to Phase 04; untouched.
- Phase 02 browser verification (temporary specs, deleted after run):
  EN+AR × 390/768/1024/1440 — nav/footer/drawer contain ZERO deferred links;
  Services/Team/Contact/Consultation/Client-login/language/theme intact;
  dock exactly 2 actions; toggler flips `.dark` both ways; `lenis` class on
  `/`+`/privacy`, absent on booking/contact/services; header conceal
  engages/releases; Services flyout (1024) + drawer Services group (390/768)
  verified; zero console/page errors, zero hydration warnings, no overflow.
  6/6 + 2/2 + (supplemental) 2/2 + 2/2 green.
- Screenshots captured to ignored `.playwright/test-results` (agent cannot
  view images; DOM assertions above are the verification evidence).

## Blockers

None. Client/Admin shell browser verification boundary recorded under
TASK-02-10 (same shared component + API, no shell edits, typecheck/build
green); auth-gated shells were not browser-driven.

## Blockers

Leave blank.
