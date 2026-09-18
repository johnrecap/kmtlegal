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

- [ ] TASK-03-01 Remove the home `InsightsLedger` block + its public links
  unconditionally (final Phase 01 ruling: Homepage Insights REMOVE). Do NOT
  add a replacement section; preserve visual spacing/rhythm between the
  surrounding homepage sections so no gap remains. KEEP `MatterRows`
  (Representative Matters) fully unchanged. Leave the `InsightsLedger`
  component code path untouched for the Phase 12 dead-code audit (do not
  delete shared component files in this phase).
- [ ] TASK-03-02 Hero first-render stabilization: SSR/hydration contract
  (single visual tree, `initiallyStable` stats, CSS/variant entrances only),
  `ScrollTrigger.refresh()` timing, spotlight off-screen unmount behavior.
  Verify no first-paint shift EN + AR.
- [ ] TASK-03-03 Hero scroll-conflict pass: parallax (`data-drift`), Lenis
  scope from Phase 02, spotlight rAF loops — one owner per property; verify
  60fps feel + reduced-motion path.
- [ ] TASK-03-04 Hero theming + responsive: light scrim/spotlight/gold,
  2-col → stacked, docket overlap, picker 6-radio grid 1-col on small
  screens, RTL mirroring.
- [ ] TASK-03-05 Trust strip: theming, `prefers-reduced-motion` pause,
  hover-pause, RTL direction correctness.
- [ ] TASK-03-06 Services rows: Glowing Effect border layer kept; KMT
  composition (numeral/icon/title/desc/CTA) themed light + dark; pointer
  glow gated as today; keyboard focus visible.
- [ ] TASK-03-07 Statement + industries: underline wrapper theming, ledger
  hairlines + 2-col → 1-col, Blur Fade entrances only.
- [ ] TASK-03-08 Focus area: Sticky Scroll kept; desktop sticky panel vs
  mobile stacked text; images themed captioned; scroll ownership per
  Phase 02 table.
- [ ] TASK-03-09 Process + matters + team: Timeline rail ownership, HoverEffect
  cards themed + touch-safe, FocusCards themed + link targets intact.
- [ ] TASK-03-10 Homepage accessibility: radiogroup semantics, heading order,
  alt/aria-hidden on decorative layers, focus order EN + AR, keyboard-only
  run of picker + all CTAs.
- [ ] TASK-03-11 Full homepage QA sweep (Visual + Technical sections), then
  phase commit, then STOP.

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

- [ ] InsightsLedger section removed with no replacement; surrounding rhythm/
  spacing verified (no visual gap); MatterRows intact; link grep clean.
- [ ] No layout shift on first paint; console clean; reduced-motion verified.
- [ ] EN+AR × light+dark × 390/768/1024/1440 pass.
- [ ] Picker + CTAs fully keyboard operable.
- [ ] One phase commit; STOP.

## Visual QA

- [ ] Full-page captures per locale × theme × 390/1440.
- [ ] Hero, sticky, timeline, cards interaction captures.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Unit + E2E home specs pass; CLS + console clean.

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
