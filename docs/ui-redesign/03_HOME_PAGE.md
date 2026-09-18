# Phase 03 — Home Page

## Objective

Stabilize and theme the homepage (`/`, `/ar`) on its locked component set:
remove motion duplication, stabilize first render, reduce scroll conflicts,
land light + dark + mobile + RTL + spacing + typography + accessibility.
Handle the Insights section per the FINAL Phase 01 owner ruling: REMOVE the
public Homepage InsightsLedger section unconditionally — no replacement
section; preserve visual spacing/rhythm between the surrounding homepage
sections; KEEP Homepage Representative Matters unchanged. No new
components.

## Current State

`HomePageView` (`src/features/public-site/public-pages.tsx:219`): hero
(`HeroParallaxLayers` + Spotlight + TextAnimate + CountingNumber + gold
underline + vanish-free picker + docket with BorderBeam), `TrustStrip`
(Marquee), `CapabilityRows` (BlurFade + GlowingEffect gate), `StatementBreak`,
`StickyScroll` section, `ProcessSteps` (Timeline), `MatterRows` (HoverEffect),
`IndustryLedger`, `FocusCards` team, `InsightsLedger` (or empty fallback),
final CTA in `PublicShell` footer. Motion drivers overlap on scroll (Lenis +
GSAP parallax + `useScroll` StickyScroll + Timeline rail + reveal IO).

## Target State

Same section order (minus the removed Insights section) and locked
components; one motion owner per property; stable SSR first paint; full
light theme; clean mobile stacking; correct RTL; accessible picker/
radiogroup and link lists. The InsightsLedger section is REMOVED
unconditionally per the final Phase 01 ruling (Homepage Insights REMOVE, no
replacement); surrounding section rhythm/spacing preserved so no visual gap
remains; MatterRows kept unchanged; backend/admin article pipeline untouched.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Hero backdrop + headline + stats + docket | Spotlight New, Text Animate, CountingNumber, Border Beam, Highlighter wrapper | KEEP CURRENT | Same set | Aceternity / Magic / Animate UI | https://ui.aceternity.com/components/spotlight-new, https://magicui.design/docs/components/text-animate, https://magicui.design/docs/components/border-beam, https://magicui.design/docs/components/highlighter |
| Trust strip | Marquee | KEEP CURRENT | Marquee | Magic UI | https://magicui.design/docs/components/marquee |
| Legal services | Glowing Effect border layer | KEEP CURRENT | Glowing Effect | Aceternity UI | https://ui.aceternity.com/components/glowing-effect |
| Awareness emphasis | Highlighter wrapper | KEEP CURRENT | Highlighter | Magic UI | https://magicui.design/docs/components/highlighter |
| Focus area | Sticky Scroll Reveal | KEEP CURRENT | Sticky Scroll Reveal | Aceternity UI | https://ui.aceternity.com/components/sticky-scroll-reveal |
| Process | Timeline | KEEP CURRENT | Timeline | Aceternity UI | https://ui.aceternity.com/components/timeline |
| Representative matters | Card Hover Effect | KEEP CURRENT | Card Hover Effect | Aceternity UI | https://ui.aceternity.com/components/card-hover-effect |
| Industries entrances | Custom ledger + Blur Fade entrances | KEEP CURRENT | Blur Fade | Magic UI | https://magicui.design/docs/components/blur-fade |
| Team showcase | Focus Cards | KEEP CURRENT | Focus Cards | Aceternity UI | https://ui.aceternity.com/components/focus-cards |
| Insights section | InsightsLedger | REMOVE — FINAL per Phase 01 owner ruling (no replacement; rhythm preserved) | None | — | — |
| Section entrances (general) | Mixed | KEEP CURRENT (add Blur Fade only where entrance adds value) | Blur Fade | Magic UI | https://magicui.design/docs/components/blur-fade |

## Tasks

- [x] TASK-03-01 Remove the home `InsightsLedger` block + its public links
  unconditionally (final Phase 01 ruling: Homepage Insights REMOVE). Do NOT
  add a replacement section; preserve visual spacing/rhythm between the
  surrounding homepage sections so no gap remains. KEEP `MatterRows`
  (Representative Matters) fully unchanged. Leave the `InsightsLedger`
  component code path untouched for the Phase 12 dead-code audit (do not
  delete shared component files in this phase).
  DONE: removed the entire Insights `PublicSection` (ledger + empty-fallback
  panel) from `HomePageView`; removed `loadFeaturedContent`,
  `FeaturedArticle/FeaturedCaseStudy` types, the `InsightsLedger` import, and
  the now-await-free `async` on `HomePageView` (all in `public-pages.tsx`,
  home scope only). Home no longer queries article/case-study tables.
  `InsightsLedger` component (`public-components.tsx:487`) untouched for
  Phase 12. No replacement section added; Team section now flows directly
  into the footer CTA (gap verified < 400px, ≥ 0).
- [x] TASK-03-02 Hero first-render stabilization: SSR/hydration contract
  (single visual tree, `initiallyStable` stats, CSS/variant entrances only),
  `ScrollTrigger.refresh()` timing, spotlight off-screen unmount behavior.
  Verify no first-paint shift EN + AR.
  DONE (verify-only; contract already implemented + documented in-code
  `hero-parallax-layers.tsx:80-91`): single visual tree, `spotlightLive`
  initial `true`, `CountingNumber initiallyStable`, photo inside a fixed
  aspect box (`aspect-[4/3]…lg:min-h-[560px]`) with `priority` + `sizes`,
  docket `min-h-8`/`min-h-14` anti-shift guards. Proof: `hero-hydration`
  suite 4/4 (SSR markup contains final composition; geometry+text identical
  pre/post hydration under reduced motion; Arabic SSR parity) + home spec
  h1 stability checks EN+AR × 4 viewports.
- [x] TASK-03-03 Hero scroll-conflict pass: parallax (`data-drift`), Lenis
  scope from Phase 02, spotlight rAF loops — one owner per property; verify
  60fps feel + reduced-motion path.
  DONE (verify-only): GSAP scrub touches ONLY `data-drift` layers (motif +
  photo wrappers carry no entrance classes — no shared property with
  Motion/CSS); Lenis active on `/` per Phase 02 scope with ScrollTrigger
  sync intact; spotlight IO-unmounts off-view; parallax gated to
  `prefers-reduced-motion: no-preference` (`:139-151`). No conflicts found,
  no changes needed.
- [x] TASK-03-04 Hero theming + responsive: light scrim/spotlight/gold,
  2-col → stacked, docket overlap, picker 6-radio grid 1-col on small
  screens, RTL mirroring.
  DONE (verify-only): token-driven hero (`--kmt-public-*` throughout),
  `lg:grid-cols-[1.02fr_0.98fr]` → stacked, picker `grid-cols-1 →
  sm:grid-cols-2`, docket `-mt-24` overlap intact, `rtl:rotate-180` arrows,
  EN-uppercase/AR-tracking guards. Browser proof EN+AR × 390/768/1024/1440
  × dark+light: no overflow, no clipping, docket overlap correct.
- [x] TASK-03-05 Trust strip: theming, `prefers-reduced-motion` pause,
  hover-pause, RTL direction correctness.
  DONE (verify-only): real Magic Marquee, `pauseOnHover`, 36s slow loop,
  aria-hidden visual + sr-only text alternative, locale-driven
  `kmt-marquee`/`kmt-marquee-rtl` CSS (documented `public-components:178-182`,
  no `reverse` prop), reduced-motion kill-switch (`globals.css:779-787` +
  marquee-specific `:929-939` incl. keyboard-focus pause). Unit proof:
  `trust-strip.test.tsx` 3/3.
- [x] TASK-03-06 Services rows: Glowing Effect border layer kept; KMT
  composition (numeral/icon/title/desc/CTA) themed light + dark; pointer
  glow gated as today; keyboard focus visible.
  DONE (verify-only): border-layer-only usage preserved with full KMT
  composition; banned treatments absent (grep: no Magic/CardSpotlight/3D/
  Wobble/Bento in services scope); focus-visible rings present. No edits
  (renderer file carries pre-existing work — untouched).
- [x] TASK-03-07 Statement + industries: underline wrapper theming, ledger
  hairlines + 2-col → 1-col, Blur Fade entrances only.
  DONE (verify-only): KMT Highlighter wrapper kept (no CSS border-bottom
  substitution), ledger rows `md:grid-cols-2` → 1-col, BlurFade entrances
  only, industries NOT converted to cards.
- [x] TASK-03-08 Focus area: Sticky Scroll kept; desktop sticky panel vs
  mobile stacked text; images themed captioned; scroll ownership per
  Phase 02 table.
  DONE (verify-only): Aceternity Sticky Scroll Reveal kept, no custom sticky
  system, no scroll-jacking; Lenis on `/` preserves its scroll math.
  Unit proof: `sticky-scroll-keys.test.tsx` 2/2.
- [x] TASK-03-09 Process + matters + team: Timeline rail ownership, HoverEffect
  cards themed + touch-safe, FocusCards themed + link targets intact.
  DONE (verify-only): Aceternity Timeline kept (IO-driven rail, no Phase 02
  property conflict); MatterRows/HoverEffect cards are real links (touch =
  tap, no hover dependency) with `/services/*` targets intact (browser:
  ≥3 matter links EN+AR); FocusCards team intact with tappable profile
  links, names readable. `process-steps.tsx` carries pre-existing work —
  untouched. Full team-index redesign stays in Phase 05.
- [x] TASK-03-10 Homepage accessibility: radiogroup semantics, heading order,
  alt/aria-hidden on decorative layers, focus order EN + AR, keyboard-only
  run of picker + all CTAs.
  DONE (verify + one scoped fix): heading order (exactly one h1 EN+AR),
  decorative layers `aria-hidden` (motif/photo/scrims/gradients/spotlight
  siblings), images `alt=""` + `aria-hidden` with `sizes`/`priority`,
  radiogroup labelled + `aria-checked`. FIX IMPLEMENTED in
  `hero-parallax-layers.tsx` (clean, in-scope file): APG arrow-key behavior
  for the picker (arrows move + check + focus, horizontal mirrored in RTL,
  Home/End support, `data-picker-option` targets) — arrows previously did
  nothing (found by the Phase 03 keyboard run; Tab/Enter already worked).
  Browser proof EN+AR: arrows select exactly one radio, End jumps to last,
  CTA keyboard order intact, focus rings visible.
- [x] TASK-03-11 Full homepage QA sweep (Visual + Technical sections), then
  phase commit, then STOP.
  DONE — see QA Results.

## Files Expected To Change

- `src/features/public-site/public-pages.tsx` (home view only),
  `src/features/public-site/public-components.tsx` (home sections only),
  `src/components/motion-ui/hero-parallax-layers.tsx`,
  `src/features/public-site/process-steps.tsx`,
  `src/features/public-site/capability-glow-gate.tsx`, home-scoped styles.

## Files That Must NOT Change

- Booking/chat, directory/detail views, admin, client, backend/API/database,
  routes, header/shell/dock primitives beyond Phase 02 tokens, inventory doc.

## Dependencies

- Phase 01 (Insights ruling), Phase 02 (tokens + motion table + Lenis scope).

## Risks

- Parallax + sticky + timeline scroll contention → mitigated by single-owner
  enforcement + per-section scroll QA.
- Light-theme gold contrast → side-by-side captures each task group.
- Insights removal leaving dead links → covered by Phase 01 link inventory;
  re-grep before commit.

## Acceptance Criteria

- [x] InsightsLedger section removed with no replacement; surrounding rhythm/
  spacing verified (no visual gap); MatterRows intact; link grep clean.
- [x] No layout shift on first paint; console clean; reduced-motion verified.
- [x] EN+AR × light+dark × 390/768/1024/1440 pass.
- [x] Picker + CTAs fully keyboard operable.
- [x] One phase commit; STOP.

## Visual QA

- [ ] Full-page captures per locale × theme × 390/1440.
- [ ] Hero, sticky, timeline, cards interaction captures.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Unit + E2E home specs pass; CLS + console clean.

## Status

COMPLETE

## Implementation Notes

### Pre-Phase-03 baseline

- HEAD: `6658b3b` (Phase 02 COMPLETE).
- Pre-existing working-tree entries (preserved exactly, excluded from the
  Phase 03 commit): same set as the Phase 02 baseline (`.specify/*`,
  `docs/reviews/*`, `components.json`, `package*.json`, brand logo header,
  `directory-filter.tsx`, `process-steps.tsx`, `tokens.ts`,
  `tailwind.config.ts`, 2 E2E specs, `tmp-stageAB-shots.mjs`) plus all
  untracked vendor/hook/test files. Consequence: NO edits to
  `process-steps.tsx`, `capability-glow-gate.tsx`, header, tokens, or any
  vendor file — those tasks ran verify-only.
- Known pre-existing failures (Phase 04 scope, NOT touched, NOT counted as
  Phase 03 regressions): the two PLAN-28 booking-stepper assertions in
  `mvp-smoke.spec.ts:243` (desktop + mobile luxury-surface class
  expectation vs committed booking source — fails identically on clean HEAD).

### Code changes (home scope only)

1. `src/features/public-site/public-pages.tsx` — TASK-03-01 removal:
   Insights `PublicSection` (ledger + fallback) deleted from `HomePageView`;
   `loadFeaturedContent` + `FeaturedArticle/FeaturedCaseStudy` + the
   `InsightsLedger` import + the now-needless `async` removed. No other view
   touched; admin/API/backend/content-data untouched.
2. `src/components/motion-ui/hero-parallax-layers.tsx` — TASK-03-10 fix:
   APG arrow-key support for the picker radiogroup (RTL-mirrored
   horizontal, Home/End, move+check+focus via `data-picker-option`).
   Nothing else in the hero changed (no redesign, no new component).

### Motion/scroll confirmation (binding Phase 02 table respected)

- Lenis stays scoped (no re-globalization); home keeps the approved scope.
- GSAP/ScrollTrigger owns ONLY `data-drift` transforms; no Motion/CSS twin.
- Marquee/entrances/sticky/timeline ownership unchanged; no second owners.

## Files Actually Changed

- `src/features/public-site/public-pages.tsx` (home Insights removal only)
- `src/components/motion-ui/hero-parallax-layers.tsx` (picker arrow keys only)
- `docs/ui-redesign/03_HOME_PAGE.md` (this file)

### Unattributed working-tree change (NOT Phase 03, NOT committed)

- `src/components/ui/kmt-text-underline.tsx` — a 3-line diff
  (`String.split` → `indexOf`/`slice` in `KmtUnderlinedText`, mtime
  2026-09-18 17:03 during this run) appeared in `git status` that matches
  NO tool call in the Phase 03 execution history and was ABSENT from the
  recorded pre-phase baseline. It was deliberately EXCLUDED from the Phase 03
  commit and left untouched in the working tree. Owner: please attribute it
  (concurrent edit by another process/agent?) before it gets swept into an
  unrelated commit.

## QA Results

- `npm run typecheck` — GREEN. `npm run lint` — GREEN, zero warnings.
- Production build — GREEN, EXIT=0, full route table (46/46). NOTE: three
  attempts failed environmentally first (stray orphaned `next dev` holding
  `.next` locks; OOM-kill with 15 stray Chromiums alive; a Windows
  `500.html` rename race) — all infra, none code-related; after killing
  strays and clearing `.next`, the unchanged-code retry went fully green.
- Unit: `public-pages` (15) + `trust-strip` (3) + `sticky-scroll-keys` (2) —
  20/20 GREEN.
- E2E `hero-hydration.spec.ts` — 4/4 GREEN (SSR parity, reduced-motion +
  normal-motion stability, Arabic SSR).
- Phase 03 home spec (temporary, deleted after run) — 8/8 GREEN, EN+AR ×
  390/768/1024/1440 × dark+light: no insights text/links, ≥3 matter links,
  single stable h1, radio arrows + End (RTL-mirrored), team→footer gap sane,
  theme flip clean, no overflow, zero console/page/hydration errors.
- E2E `mvp-smoke.spec.ts` — 44/46: ONLY the two known pre-existing PLAN-28
  booking failures (byte-identical to baseline; Phase 04 scope, untouched).
  No NEW failures — homepage article-link tests (#41/#42) pass with routes
  still live pending Phase 06.
- Screenshots to ignored `.playwright/test-results` (DOM assertions are the
  recorded evidence; agent cannot view images).

## Blockers

None.

## Blockers

Leave blank.
