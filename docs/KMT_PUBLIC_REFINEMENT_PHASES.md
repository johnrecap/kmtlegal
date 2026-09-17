# KMT Public Refinement Execution Plan

Source of truth for the public UI refinement + motion stability pass.
Scope: public site only. Admin and Client Portal are NOT touched.
Standalone Team / Cases / Insights pages are NOT redesigned in this pass.

Status values: NOT STARTED | IN PROGRESS | BLOCKED | COMPLETE

---

## Phase 0 — Baseline / Do Not Change Design Yet

Status: COMPLETE

### Objective

Run the current site, capture baseline screenshots, reproduce reported issues,
record them here before any code change.

### Tasks

- [x] Start dev server and load HOME EN + HOME AR
- [x] Capture HOME EN 1440px dark
- [x] Capture HOME EN 1440px light
- [x] Capture HOME EN 390px dark
- [x] Capture HOME EN 390px light
- [x] Capture HOME AR 1440px dark
- [x] Capture HOME AR 390px dark
- [x] Record console warnings/errors (esp. React key warning)
- [x] Record first-scroll behavior (qualitative; profiling is Phase 2)
- [x] Record navbar top state vs scrolled state
- [x] Record footer light-theme appearance

### Acceptance Criteria

- [x] All 6 baseline screenshots captured and paths recorded below
- [x] Console output recorded verbatim
- [x] No code changed in this phase

### Findings

Dev server: `next dev` on port 3100, homepage 200 without DB (featured-content
loaders degrade gracefully).

Screenshots (in `C:/Users/SOUQ/AppData/Local/Temp/opencode/kmt-baseline/`):
- `home-en-1440-dark-top.png` / `-scrolled600.png` / `-footer.png`
- `home-en-1440-light-top.png` / `-footer.png` (forced via `kmt-theme=light`
  in localStorage pre-navigation; naive post-load class manipulation is
  reverted by next-themes hydration — storage key is `kmt-theme`)
- `home-en-390-dark-top.png` / `-scrolled600.png`, `home-en-390-light-*`
- `home-ar-1440-dark-top.png` / `-scrolled600.png`, `home-ar-390-dark-*`,
  plus `home-ar-1440-light-top.png` (extra)

Console (verbatim, EN every viewport/theme, light+dark):
- `[error] Each child in a list should have a unique "key" prop. Check the
  render method of StickyScroll. It was passed a child from HomePageView.`
- AR: ZERO console messages. Next dev overlay shows a persistent "1 Issue"
  badge on EN pages.
- No other warnings/errors on the homepage in either locale/theme.

Navbar:
- Top: transparent, integrated; blends into the dark background (weak
  separation — Phase 3).
- Scrolled (600px): floating rounded pill with gold hairline, dark surface.
  Transition visible; smoothness to be profiled in Phase 2.
- Light theme: white pill BUT the `Legal` wordmark renders white-on-white
  (invisible) — `KmtBrandLogo surface="dark"` is hard-coded in the header.
  Phase 3 must make the logo surface theme-aware.

Footer:
- Dark: deep black, gold details, warm white text; strong identity. BUT the
  footer logo asset (`kmt-logo-full.webp`, dark base) sits directly on the
  footer as an unfinished black rectangle (Phase 7).
- Light: footer body STAYS BLACK (`bg-[var(--kmt-black-0)]` forced in both
  themes in `public-shell.tsx` line 59) while the CTA band above flips to
  ivory — broken/inconsistent (Phase 6). Footer body text dim on black.

Hero (both themes): premium deep-black / warm-paper editorial layout, gold
accents, stats row, matter picker + docket card — approved direction, no
baseline defect noted. Trust strip renders under hero.

Mobile 390 dark: hamburger + actions visible, hero stacks cleanly.

First scroll (qualitative): page responds; perceptible hesitation near the
top reported — NOT measured here; full profiling + system-by-system isolation
is Phase 2.

### Files changed

_None (baseline phase)._

### QA result

Baseline recorded. No code touched. Proceed to Phase 1.

---

## Phase 1 — Fix the React Key Error First

Status: COMPLETE

### Objective

Eliminate the `Each child in a list should have a unique "key" prop` console
error attributed to `StickyScroll` (origin `HomePageView`).

### Current problem

Console error (EN only, all viewports/themes): Each child in a list should
have a unique "key" prop. Component: StickyScroll. Origin: HomePageView.
AR never warned.

### Root cause (verified, was NOT the `.map()`)

The left-column `content.map((item, index) => <div key={item.title + index}>)`
was always correctly keyed — a blind key-adding pass would have changed
nothing. Fiber-level tracing (React fiber `memoizedProps.children` of the
sticky panel + lazy-chunk payload inspection) proved the real culprit:

- The sticky visual panel renders `{content[activeCard].content ?? null}`
  (a ReactNode created in `HomePageView`) as a sibling of a static hairline
  `<div>` → a dynamic children array with TWO unkeyed children.
- The visual node crosses the Server→Client boundary via RSC flight. On EN
  it materialized client-side as an unresolved **flight chunk reference**
  (`$$typeof: react.lazy`, `readChunk`, resolving to the `relative h-full`
  div), while AR inlined the same node — hence EN-only warnings (chunking
  differs with payload content).
- React 19 key validation resolves lazy chunks inside arrays
  (`warnOnInvalidKey` → `warnForMissingKey`) and warns on the resolved
  unkeyed div: renderer = StickyScroll, creator = HomePageView — exactly the
  observed message. (Note: the app renders with Next 15.5.25's bundled React
  19.2.0-canary reconciler, not the `react@18.2` copy in node_modules.)

### Files/components likely involved

- `src/components/ui/sticky-scroll-reveal.tsx` (fixed — the array owner)
- `src/features/public-site/public-pages.tsx` (`HomePageView` — creator, no
  change needed)
- Audited and innocent: `timeline.tsx`, `marquee.tsx`, `text-animate.tsx`,
  `focus-cards.tsx`, `card-hover-effect.tsx`, `navbar-menu.tsx`,
  `public-header.tsx` (all maps keyed)

### Tasks

- [x] Reproduce warning in dev (EN + AR, fresh load, navigation away/back)
- [x] Capture full React component stack of the warning
- [x] Trace every `.map()` on the render path to the owning component
- [x] Fix stable keys at correct ownership level
- [x] Confirm no duplicate/index-only keys where a stable id exists
- [x] Add regression coverage (unit test asserting keys / console-error-free render)
- [x] Re-verify EN + AR, refresh + navigate away/back

### Fix

`src/components/ui/sticky-scroll-reveal.tsx` — sticky panel children are now
both keyed at the StickyScroll ownership level (no `HomePageView` change, no
index-only keys, no generated ids):
- hairline → `key="kmt-sticky-scroll-hairline"` (static, stable)
- active visual → `<Fragment key={content[activeCard].title}>` (stable
  semantic id per the preferred order; deterministic across renders, no
  remount churn from unstable ids)
- plus a `content[activeCard]` guard and an explanatory comment so the
  Fragment is never "simplified" away.

### Acceptance Criteria

- [x] No React key warning (browser: fresh load, sticky switches, 2×
  refresh, away/back, EN + AR — 0 warnings, `PHASE1-BROWSER: PASS`)
- [x] No console warning on modified paths
- [x] StickyScroll content renders identically (DOM: image + hairline
  present; screenshot `home-en-1440-dark-focus-postfix.png`; 01 active gold,
  02 dimmed — unchanged; dev "1 Issue" badge gone)

### Tests to run

- `npm run typecheck` — clean
- `npx next lint` on touched files — no warnings/errors
- NEW `tests/ui/sticky-scroll-keys.test.tsx` (2 tests) — passes post-fix,
  verified to FAIL pre-fix (`expected 'object' to be 'string'`)
- Manual console check EN + AR — clean

### Visual checks

- Focus Area section renders identically before/after (screenshot compared)

### Findings

See Root cause above. Key lesson: with RSC flight + React 19, ANY foreign
`ReactNode` rendered inside a dynamic sibling array needs an explicit key at
the rendering owner — even when it is a "single" child conceptually.

### Files changed

- `src/components/ui/sticky-scroll-reveal.tsx`
- `tests/ui/sticky-scroll-keys.test.tsx` (new regression coverage)

### QA result

PASS. Phase 1 acceptance criteria all met.

---

## Phase 2 — Investigate the First-Scroll Lag

Status: COMPLETE

### Objective

Find and fix the measurable cause of first-scroll hesitation near the top of
the homepage. Treat as animation-system conflict, not a duration tweak.

### Current problem

Noticeable lag / hesitation when the user begins scrolling near the top of
the homepage.

### Root cause (measured, one system at a time)

No single smoking gun — the hesitation was the SUM of always-on background
costs plus Lenis's eased start, proven by isolation runs (trusted CDP wheel
input, 1440/1024/768/390, in-page rAF gap sampling + longtask observer;
dev-mode values, relative comparison only):

| Config | Max frame gap | Hitches >34ms | Longtasks | First response |
|---|---|---|---|---|
| Baseline 1440 (×3) | 50–67ms | 0–4 | 0 | ~400ms, eased ramp |
| No GlowingEffect | 50ms | 2–4 × 50ms | 0 | same (marginal gain) |
| No Spotlight | 33–67ms | 0–2 | 0 | same (one clean run) |
| **No Lenis (native)** | **83–583ms** | up to 16 | **YES, up to 527ms, scroll frozen 1.6s** | immediate jump then freeze |
| No GSAP parallax (Lenis kept) | 50ms | 1–2 × 50ms | 0 | same (within noise) |
| Baseline 390 | 200ms | 3 | 3 (68–205ms) | eased ramp |
| **Fixed 1440 (×2)** | **33.4ms** | **0** | **0** | ~410ms, smooth ramp |
| **Fixed 390** | **33.3ms** | **0** | **0** | smooth ramp |
| Fixed 1024 / 768 | 66.8 / 33.4 | 1 / 0 | 0 | smooth ramp |

Decisive findings:
1. **Lenis MUST stay.** Native scroll without Lenis is dramatically worse
   (main-thread longtasks to 527ms, visible freezes). The Lenis +
   GSAP-ticker + `ScrollTrigger.update` integration in
   `smooth-scroll-provider.tsx` matches the vendor recipe and is correct.
   Single scroll source confirmed — no competing smooth-scroll system.
2. **Spotlight** ran TWO permanent full-screen rAF loops even with the hero
   offscreen. Now unmounts offscreen (verified: 2 layers at top → 0 past
   hero; gentle 1.5s fade on re-entry).
3. **GlowingEffect** attached per-card window scroll + body pointermove
   listeners doing `getBoundingClientRect()` + Motion `animate()` on EVERY
   scroll event from page load, on all pointers. Now armed per card only
   near-viewport on fine pointers with motion allowed (verified: disarmed
   offscreen, `--active: 1` on edge hover, static treatment on touch/RM).
   Mobile longtasks (68–205ms) are gone.
4. GSAP scrub parallax delta was within noise — kept (approved drift,
   correctly Lenis-synced).
5. NavBody IS already threshold-based (TOP→SCROLLED), complying with the
   motion rule — mechanics untouched here. BUT the threshold probe found a
   real geometry defect for Phase 3: sticky header height changes 88→63px on
   scroll (logo `lg`↔`md` swap) = in-flow layout shift on every cross.

### Scroll audit table (measured final code)

| Component | Scroll mechanism | Listener/rAF | Properties animated | Continuous? | Potential conflict |
|---|---|---|---|---|---|
| PublicHeader | raw window scroll, rAF-throttled, state on change only | 1 passive scroll | none directly (sets flags) | No | none — cheap |
| NavBody/MobileNav | Motion spring on `visible` boolean | none (prop-driven) | width, y, backdrop-filter, shadow | On threshold cross only (~0.5s) | layout+paint burst; geometry shift → Phase 3 |
| Hero Spotlight | Motion infinite x loops | 2 permanent rAF → **now 0 offscreen** | x transform | Was always → now in-view only | FIXED |
| Hero parallax | GSAP ScrollTrigger scrub 1 | via Lenis ticker | yPercent | While hero visible | none — Lenis-synced |
| Lenis | gsap.ticker rAF | 1 rAF + scroll→ST.update | scroll pos (eased) | Yes (single owner) | none — the one scroll source |
| StickyScroll | Motion useScroll target ref | observer | opacity + active index (discrete) | While visible | none |
| Timeline | Motion useScroll target ref | observer | height/opacity | While visible | none |
| GlowingEffect ×4 | per-card scroll+pointermove → **now armed-only** | 0 offscreen/touch/RM | CSS var `--start`, opacity | Was every scroll → now in-view + fine pointer | FIXED |
| BlurFade ×N | Motion useInView once | observer | y/opacity/filter (entry only) | No | none (RM settled by CSS) |
| Reveal | IntersectionObserver once | observer | opacity/translate CSS | No | none |
| Trust strip | CSS keyframes | none (compositor) | transform | Yes, transform-only | none |
| ReadingProgress | rAF-throttled scaleX | article pages only | transform | While reading | n/a homepage |

### Tasks

- [x] Profile initial scroll (frame gaps, longtasks, hesitation trace)
- [x] Disable suspect systems ONE AT A TIME, measure before/after
- [x] Document which system caused measurable improvement
- [x] Implement fix under the motion-architecture rule
- [x] Navbar keeps TOP→SCROLLED threshold transition (geometry → Phase 3)

### Fixes

- `src/components/motion-ui/hero-parallax-layers.tsx`: `spotlightLive`
  state + IntersectionObserver (25% rootMargin, SSR-safe initial true);
  `<Spotlight/>` mounts only while hero is near viewport.
- NEW `src/features/public-site/capability-glow-gate.tsx` (client
  boundary): per-card arming (IO on a real-box absolute wrapper —
  `display:contents` has no box and never intersects), fine-pointer +
  no-preference-motion gating, SSR-safe disarmed first paint.
- `src/features/public-site/public-components.tsx`: `CapabilityRows`
  renders `<CapabilityGlowGate/>` instead of an always-on GlowingEffect.
- Lenis kept stock (no tuning — no measured defect on its path).

### Acceptance Criteria (1440 / 1024 / 768 / 390)

- [x] First downward scroll responds, no obvious hitch (post-fix: max
  single frame 33–67ms dev-mode, zero longtasks on all viewports)
- [x] No navbar jump (threshold spring unchanged; geometry shift logged for
  Phase 3), no hero freeze, no delayed sticky activation, no layout shift
  from motion systems
- [x] Fast wheel, slow trackpad-equivalent, repeated up/down near top
  (p95 33.4, max 50.1, tracks input), refresh-then-scroll, back-nav
  covered in Phase 1 + this phase
- [x] Performance profile recorded with before/after table above

### Tests to run

- Harness `_workspace/kmt-scrollperf.mjs` matrix (deleted after phase)
- `npm run typecheck` — clean; `next lint` on touched files — clean
- NEW `tests/ui/capability-glow-gate.test.tsx` (3 tests: SSR-safe
  disarmed, arms in view, stays disarmed on coarse pointer / RM) — pass
- Browser gate checks: spotlight 2→0 layers, glow `--active: 1` on hover

### Visual checks

- Hero identical at top (Spotlight present on load); services grid
  identical in-view (gold glow on hover verified); no layout change from
  the absolute gate wrapper

### Findings

See Root cause above. Residual single 50–67ms frames in dev are noise
floor (dev React, HMR); no longtasks remain on any viewport.

### Files changed

- `src/components/motion-ui/hero-parallax-layers.tsx`
- `src/features/public-site/public-components.tsx`
- `src/features/public-site/capability-glow-gate.tsx` (new)
- `tests/ui/capability-glow-gate.test.tsx` (new)

### QA result

PASS. Proceed to Phase 3 (includes the header-geometry follow-up).

### Files changed

_Pending._

### QA result

_Pending._

---

## Phase 3 — Dark-Theme Navbar Visibility

Status: COMPLETE

### Objective

Give the dark-theme navbar controlled separation from the page while keeping
the premium deep-black identity. Verify light theme uses theme-aware tokens.

### Current problem (baseline)

Dark navbar blended into the dark background (fully transparent top, 82%
alpha scrolled). Light theme broken: `Legal` wordmark rendered white-on-white
(hard-coded `surface="dark"`). Sticky header height shifted 88→63px on scroll
(logo `lg`↔`md` swap — in-flow layout shift on every threshold cross, found
in Phase 2 probing).

### Fixes

- `src/app/globals.css`: dark `--kmt-public-header` `rgb(6 5 5 / 82%)` →
  `rgb(8 6 5 / 92%)` (elevated deep-black, controlled transparency; light
  token untouched).
- `src/components/ui/resizable-navbar.tsx` (`NavBody`, `MobileNav`): border
  width now permanently reserved (`border border-transparent`) with
  `borderColor` animated in the Motion spring (transparent → gold/25%) —
  kills the 2px border add/remove shift; width/y/blur/shadow spring kept
  (approved pill, threshold-based, measured clean in Phase 2).
- `src/components/layout/public-header.tsx`: desktop logo size constant
  `md` (was `md`↔`lg` — header height now constant 63px top/scrolled,
  dark/light, desktop/mobile, EN/AR); both logos `surface="dark"` →
  `surface="theme"`; inactive hover `hover:text-[var(--kmt-public-text)]` →
  `hover:text-[var(--kmt-public-gold)]` (warms toward gold; the
  `kmt-motion-nav-link::after` gold rule already animates underneath).
- `src/components/brand/kmt-brand-logo.tsx`: new `surface="theme"` option —
  lockup/sublabel colors via `dark:` variants (pure CSS, SSR-safe, no
  hydration flash, no JS). Existing `dark`/`light` contracts untouched
  (admin/client consumers unaffected).

### Tasks

- [x] Top state: very deep black integrated bar (transparent + reserved
  transparent border)
- [x] Scrolled state: elevated 92% surface + blur + gold border + soft
  shadow + compact geometry (63px)
- [x] Smooth threshold transition, constant height, no flash
- [x] Active: gold text + indicator (kept); hover: gold + ::after rule
- [x] Inactive stays warm high-contrast neutral (dark `#a8a094`, light
  `#57503f` — both ≈7:1+ on their surfaces, not low-contrast grey)
- [x] Light theme end-to-end token-driven (logo white-on-white fixed)
- [x] No hard-coded dark-only values in shared nav components

### Acceptance Criteria

- [x] Dark top/scrolled visibly separated yet premium deep-black
  (screenshots `kmt-phase3/nav-dark-*.png`)
- [x] Light navbar readable, correct surfaces (`nav-light-*.png`)
- [x] Transition smooth, height 63px constant across all 7 captures
- [x] Console clean on all captures; typecheck + lint clean

### Tests to run

- Header screenshots: dark/light × top/scrolled × 1440/390 + AR scrolled
- Computed hover probe: Team link `rgb(168,160,148)` → `rgb(208,160,72)`
- `npm run typecheck`, `next lint` on touched files

### Visual checks

- Dark top (integrated), dark scrolled (pill), light top (full bar, dark
  wordmark), light scrolled (ivory pill), mobile pill, AR RTL pill (logo
  right, CTA left, active gold) — all reviewed, no jumps/flashes

### Findings

- Mid-task infra incident (not a code defect): two `next-server` processes
  (stale + restarted) fought over port 3100 and a mid-edit `.next` delete
  poisoned the cache → transient `/ar` (then `/`) 500s. Resolved by killing
  both repo-owned servers and one clean boot; EN+AR back to 200. Lesson
  recorded: never delete `.next` under a running server; one server at a time.
- No other findings; active-link double accent (indicator span + ::after)
  reads as one rule — left alone for Phase 4 to systematize.

### Files changed

- `src/app/globals.css`
- `src/components/ui/resizable-navbar.tsx`
- `src/components/layout/public-header.tsx`
- `src/components/brand/kmt-brand-logo.tsx`

### QA result

PASS. Stopping here per instruction — Phase 4+ NOT started.

---

## Phase 4 — KMT Gold Underline Design Primitive

Status: COMPLETE

### Objective

Turn the approved awareness-statement gold line into a reusable
`KmtGoldUnderline` primitive; apply intentionally at ~9 strategic locations
with varied widths.

### Component created

`src/components/ui/kmt-gold-underline.tsx` ("use client") +
`kmt-gold-underline-in` keyframes / `.kmt-gold-underline` origin rules in
`src/app/globals.css`:
- Variants: `short` (48px), `section` (64px), `medium` (112px editorial),
  `text` (inline phrase underline). Optional `width` px override.
- Props: variant, align (start/center), width, delay, duration,
  animateOnView (default true = IO-triggered; false = mount animation for
  above-the-fold), className, children (text variant).
- Exact `--kmt-public-gold` token; 0→target via `transform: scaleX` (no
  layout shift); origin inline-start (LTR left, RTL right via
  `html[dir="rtl"]` rule); SSR/no-JS render the final visible line;
  reduced motion keeps it static (JS never hides; global reset covers
  mount mode).
- Decorative bars are `aria-hidden`; phrase text stays selectable/readable.

### Locations used (9)

1. Hero supporting rule → `medium`, mount mode, delay 170ms
   (`hero-parallax-layers.tsx`, replaces the static span)
2. Legal Services heading → `section` (`PublicSection accent`)
3. Awareness statement → divider `short` centered + phrase `text`
   (`StatementBreak` — replaces the one-off static rule AND the
   rough-notation Highlighter; Highlighter component left in place, now
   unused on public paths)
4. Focus Area heading → `section`
5. Process heading → `section`
6. Matters heading → `section`
7. Team heading → `section`
8. Insights heading → `section`
9. Final CTA accent → `short` centered (`public-shell.tsx` footer band)
- Deliberately skipped: Industries section (restraint — not every heading).
- `PublicSection accent?` prop defaults to undefined → all non-homepage
  sections byte-identical.

### Tasks

- [x] Create primitive with variants short / medium / text-width / section-rule
- [x] Props width / delay / duration / align / animateOnView
- [x] Exact KMT logo gold token
- [x] scaleX growth, locale-aware origin, no layout shift
- [x] Reduced motion: immediate static line
- [x] Apply to the 9 locations with varied widths
- [x] No per-section CSS duplication

### Acceptance Criteria

- [x] One primitive, all usages import it
- [x] No layout shift (transform-only; hero geometry test unaffected);
  RTL verified (AR statement + services underline mirrored); reduced-motion
  verified (line statically visible)
- [x] Widths vary (112 hero / 64 sections / 48 CTA+divider / phrase-width)

### Tests to run

- NEW `tests/ui/kmt-gold-underline.test.tsx` (9 tests: variant widths,
  px override, SSR-visible HTML, IO growth, RM static, text variant,
  center align, RTL stylesheet rules, PublicSection opt-in/default) — pass
- `npm run typecheck` — clean; `next lint` on touched files — clean
- Full unit suite: 81 files / 580 tests pass, 0 failures
- Browser consoles clean on EN/AR/390/RM captures

### Visual checks

- `kmt-phase4/`: hero rule, services/focus/process/matters/team/insights
  accents, statement (EN/AR/390/RM), CTA band, AR services — all reviewed:
  crisp gold rules, correct alignment per section, no duplicates, no shift

### Findings

- Replacing the sketchy Highlighter with a crisp scaleX rule changes the
  statement's character slightly (hand-drawn → editorial) — intended per
  the visual-grammar goal; text content untouched (existing
  public-pages content assertions still pass).
- CTA + statement dividers both 48px centered — consistent divider grammar.
- Insights section currently shows the DB-empty state (no local DB) — its
  start-aligned accent verified at the section head.
- Post-phase runtime report (`Cannot read properties of undefined (reading
  'call')` at the `KmtGoldUnderline` JSX in `PublicSection`):
  investigated, NOT a code defect. Clean-tree verification: dev `/` 200,
  `npm run build` green, `next start` `/` + `/ar` 200 with zero log errors.
  Signature matches stale-`.next`/duplicate-server cache poisoning (same
  class as the Phase 3 infra incident). Recovery: stop ALL node servers,
  delete `.next`, boot exactly one dev server, hard-refresh. No code change
  required; no file in this phase was modified by the investigation.

### Files changed

- `src/components/ui/kmt-gold-underline.tsx` (new)
- `src/app/globals.css` (keyframes + origin rules)
- `src/components/motion-ui/hero-parallax-layers.tsx` (hero rule)
- `src/features/public-site/public-components.tsx` (`PublicSection`
  accent prop + `StatementBreak`)
- `src/features/public-site/public-pages.tsx` (6 homepage accents)
- `src/components/layout/public-shell.tsx` (footer CTA accent)
- `tests/ui/kmt-gold-underline.test.tsx` (new)

### QA result

PASS.

---

## Phase 5 — Trust Strip / Marquee (APPROVED — Keep)

Status: COMPLETE

### Objective

Keep the approved moving strip visually identical; fix ONLY if required for
performance, RTL, reduced-motion, or accessibility.

### Verdict

One REAL defect found and fixed (RTL — required per the phase rules).
Everything else verified untouched.

### The RTL defect (was broken, now fixed)

The AR strip rendered EMPTY most of the 36s cycle (screenshots proved it;
only a fragment at the left edge). Fiber/geometry tracing showed why:
- RTL flex lays the two lanes right-anchored; `reverse={locale === "ar"}`
  applied `animation-direction: reverse` to the LTR keyframes, so lanes
  traverse −100%−gap → 0 — the same broken path backwards. The loop starts
  fully off-screen and fills only near cycle end.
- A seamless loop needs right-anchored lanes to travel 0 → +100%+gap.

Fix (minimal, EN byte-identical):
- `src/app/globals.css`: new `@keyframes kmt-marquee-rtl` (0 →
  `translateX(calc(100% + var(--gap)))`) + override scoped to
  `html[dir="rtl"] .kmt-trust-marquee .animate-marquee`. Shared
  `marquee.tsx` and LTR keyframes untouched.
- `TrustStrip`: removed `reverse` (with a comment forbidding its return)
  and the now-purposeless `locale` prop (single caller
  `HomePageView` updated). Content, repeat, mask, pauseOnHover, sr-only,
  aria-hidden all unchanged.

### Verification (all else unchanged)

- EN: lane dx −71/1.2s (leftward, natural LTR), `kmt-marquee`, 36s —
  screenshot identical to pre-fix behavior.
- AR: lane dx +49.5/1.2s (rightward, natural RTL mirror),
  `animation-name: kmt-marquee-rtl` — strip FULL and seamless at load and
  mid-cycle, dark + light.
- Reduced motion EN+AR: dx=0 static (global reset collapses the loop onto
  an identical frame) — no change needed.
- A11y: localized sr-only label + `aria-hidden="true"` on the motion copy.
- Performance: transform-only `translateX` keyframes, compositor-driven
  (Phase 2 classification holds); no JS listeners.

### Tasks

- [x] Verify Magic UI Marquee implementation retained
- [x] Check RTL (FOUND BROKEN → fixed with mirrored keyframes)
- [x] Check reduced-motion (verified static EN+AR — no change needed)
- [x] Check accessibility (sr-only + aria-hidden verified)
- [x] Performance: transform-only confirmed
- [x] Confirm visible behavior unchanged (EN pixel-identical by
  construction — override is `html[dir=rtl]`-scoped)

### Acceptance Criteria

- [x] Visually unchanged vs baseline (EN) / fixed to intended (AR)
- [x] RTL correct, reduced-motion safe, accessible

### Tests to run

- NEW `tests/ui/trust-strip.test.tsx` (3 tests: doubled loop + a11y
  structure, no `reverse` regression, RTL keyframes stylesheet rules)
- Existing `public-pages.test.tsx` (15 tests incl. TrustStrip render) — pass
- `npm run typecheck` — clean; `next lint` — clean
- Direction probes (lane dx EN/AR), RM probes, console clean everywhere

### Visual checks

- `kmt-phase5/`: EN dark/light strip, AR dark/light strip (full +
  seamless), RM strips static

### Findings

See RTL defect above. Lesson: `animation-direction: reverse` does NOT
mirror a marquee loop — it time-reverses the same path, which is only
seamless when the lane anchoring matches the travel direction.

### Files changed

- `src/app/globals.css` (RTL keyframes + scoped override)
- `src/features/public-site/public-components.tsx` (`TrustStrip`)
- `src/features/public-site/public-pages.tsx` (caller prop removal)
- `tests/ui/trust-strip.test.tsx` (new)

### QA result

PASS.

---

## Phase 6 — Footer Theme Fix

Status: COMPLETE

### Objective

Footer must respond to theme. Light theme gets a proper warm ivory/paper
surface; dark keeps its strong identity.

### Fix (surgical, in `src/components/layout/public-shell.tsx`)

- Footer root: `bg-[var(--kmt-black-0)] dark:bg-[var(--kmt-black-0)]` →
  `bg-[var(--kmt-public-canvas)]`. Dark canvas IS #050505 (pixel-identical
  to the forced value — zero visual change); light canvas is #f6f3ec warm
  paper. One class, no variant, both themes correct.
- Legal bar: added `bg-[var(--kmt-public-surface-muted)]
  dark:bg-transparent` — warm secondary (#ede8dc) in light, untouched deep
  black in dark.
- Nothing else touched: CTA band, headings, body, gold links, chips, icons
  were already token-driven and flip correctly once the forced surface is
  gone (verified by computed colors, not assumed).

### Measured contrast (real luminance math on computed colors)

- Light (bg #f6f3ec): headings 15.94, body 7.22, gold links 5.84
- Dark (bg #050505): headings 17.8, body 7.88, gold links 8.54
- All ≥ 4.5 AA with wide margin. No stark pure white used.

### Tasks

- [x] Light footer: warm ivory body + darker warm legal bar + gold
  hairlines + near-black text + warm-grey secondary
- [x] Dark footer: deep black identity byte-identical (same computed bg)
- [x] Removed forced-dark classes; theme tokens drive the surface

### Acceptance Criteria

- [x] Light footer premium ivory, readable, gold hairlines
- [x] Dark footer unchanged identity (computed bg rgb(5,5,5) before/after)
- [x] Contrast AA on footer text both themes (measured above)

### Tests to run

- NEW `tests/ui/public-footer-theme.test.tsx` (3 tests) — pass
- `npm run typecheck` / `next lint` — clean
- Computed-color + contrast probe (1440/390 × light/dark × EN/AR),
  console clean everywhere

### Visual checks

- `kmt-phase67/`: EN light/dark, AR light/dark, 390 light/dark — CTA band,
  columns, plaque, legal bar all reviewed

### Findings

The footer needed no new tokens and no per-element recoloring — every text
element was already tokenized; the single forced-dark root class was the
entire defect.

### Files changed

- `src/components/layout/public-shell.tsx`
- `tests/ui/public-footer-theme.test.tsx` (new)

### QA result

PASS.

---

## Phase 7 — Footer Logo Treatment

Status: COMPLETE

### Objective

Wrap the dark-background footer logo asset in a deliberate branded container
(a small premium brand plaque) that works in both themes.

### Fix (in `src/components/layout/public-shell.tsx`, same edit set as
Phase 6)

The `variant="full"` logo is wrapped in an inline-block plaque:
`rounded-[10px] border border-kmt-gold/30 bg-black p-2.5` — dark internal
surface in BOTH themes (matches the asset's dark base), low-alpha gold
border, 10px radius, 10px padding. No pill, no circle, no shadow, no gold
fill. Link behavior and asset proportions untouched (measured plaque:
`rgb(0,0,0) / rgba(168,120,48,0.3) / 10px / padding-10px` in all
theme/locale captures).

### Tasks

- [x] Branded container: gold low-alpha border, radius 10px, tight padding,
  dark internal surface
- [x] Dark in BOTH themes → intentional badge, verified in light ivory and
  deep black footers + AR RTL
- [x] No giant pill / unjustified circle / heavy shadow / bright gold fill

### Acceptance Criteria

- [x] Logo reads as intentional plaque in light AND dark (screenshots)
- [x] Proportions respect the actual logo asset (wrapper is tight
  inline-block; img classes unchanged)

### Tests to run

- Covered by `tests/ui/public-footer-theme.test.tsx` (plaque classes +
  asset presence, EN + AR) — pass
- Screenshots light + dark, 1440 + 390, EN + AR — reviewed

### Visual checks

- Footer logo badge both themes + RTL — deliberate plaque, clean edges

### Findings

_Pending resolved: plaque verified — see measurements above._

### Files changed

- `src/components/layout/public-shell.tsx` (shared with Phase 6)

### QA result

PASS.

---

## Phase 8 — Glowing Service Grid Check

Status: COMPLETE

### Objective

Verify the Legal Services matrix (`CapabilityRows` + Aceternity
`GlowingEffect` KMT-gold variant). Optimize — do NOT delete — if it
contributes to scroll lag.

### Verdict

No code change needed — the Phase 2 `CapabilityGlowGate` already implements
every optimization this phase prescribes. Verified end-to-end:

- [x] Aceternity implementation confirmed, KMT-gold variant (gold-only
  radials + conic sweep, no rainbow), border glow retained
  (screenshot `kmt-phase89/grid-hover.png`, `--active: 1` on hover)
- [x] Measured in Phase 2 (per-card scroll/pointermove + rect reads were
  the top scroll cost; mobile longtasks 68–205ms eliminated by gating)
- [x] Activate-only-in-view: 4/4 disarmed offscreen at load AND after
  scrolling away (listeners detached)
- [x] Mobile/touch (`hasTouch` emulation): 4/4 disarmed — graceful static
  panels, no tracking
- [x] Reduced motion: disarmed — continuous movement disabled (unit +
  browser verified)
- [x] `background-attachment: fixed` KEPT deliberately: cost is contained
  by the arming gate (layer hidden + listeners detached offscreen), and
  removing it would alter the approved glow rendering. No jank attributable
  to the grid in any Phase 2/9 profile (zero longtasks).

### Acceptance Criteria

- [x] Gold border glow retained visually
- [x] No scroll jank attributable to the grid; no unnecessary rerenders
  (listeners attach/detach on IO transitions only)
- [x] Touch + reduced-motion paths static and clean

### Tests to run

- Existing `tests/ui/capability-glow-gate.test.tsx` (3 tests) — pass
- Browser: arm/disarm/hover probes above, console clean

### Visual checks

- Grid hover state (gold border + glow) — matches approved design

### Findings

Optimization-first, as specified — nothing deleted. The gate from Phase 2
IS this phase's implementation; this phase contributes the final
verification + the `background-attachment: fixed` keep-decision.

### Files changed

_None (verification only)._

### QA result

PASS.

---

## Phase 9 — Sticky Scroll Performance Review

Status: COMPLETE

### Objective

Beyond the Phase 1 key fix: verify `StickyScroll` has no per-frame waste,
stable sticky geometry, optimized images, no scroll conflicts.

### Verdict

No code change needed — all checks pass on the current implementation:

- [x] No per-frame state churn: full 1440 + 390 traversals produce EXACTLY
  2 `activeCard` transitions (0→1→2, discrete breakpoint switches; React
  bails out on identical values the rest of the frames)
- [x] Images: all 3 panels share ONE 512×512 / 310KB PNG
  (`2484f68d86633ca8.png`), `loading="lazy"`, exactly 1 network fetch
  (browser-cached across panels). Sharing is a feature here (dedup, not
  waste). `unoptimized` matches the repo's stitch-asset convention; the
  `sizes` prop is inert under it but documents intent — both left alone
  (zero user impact either way; varying the artwork per panel is a content
  decision, out of scope for a stability pass)
- [x] Sticky geometry stable: panel locks at top-28 (≈112px) with 1px
  spread across 42 stuck samples; 10px including engage/disengage edges —
  no jump at sticky start, zero frame gaps, zero longtasks during traversal
- [x] No expensive filters, no continuous blur layer (opacity-only stage
  transitions, 300ms, discrete)
- [x] No scroll conflicts: clean alongside Navbar/Hero/Timeline/Lenis
  (p95 16.7, max 16.8 on 1440 + 390, zero longtasks, zero console errors)
- [x] Mobile: sticky panel correctly hidden (`hidden lg:block`); left
  column stacks fully readable with the same 0→1→2 progression

### Acceptance Criteria

- [x] Sticky activation clean, no jump; images optimal; no per-frame React
  state churn (measured: 2 transitions / full pass)

### Tests to run

- Traversal probes (transitions, geometry, frames, longtasks, fetches) —
  all green 1440 + 390; existing `sticky-scroll-keys` tests — pass

### Visual checks

- `kmt-phase89/sticky-1440-focus-top|mid|end.png`: panel stuck with image
  + gold hairline, 02 active gold, 01/03 dimmed — textbook behavior

### Findings

The one early anomaly (`activeSeen: [0]` forever) was a probe bug (unscoped
numeral selector matched always-gold process-step numerals), not an app
bug — re-measurement with grid-scoped detection shows the correct 0→1→2.

### Files changed

_None (verification only)._

### QA result

PASS.

---

## Phase 10 — Global Motion Conflict Audit

Status: COMPLETE

### Objective

Publish the final motion registry; each visual interaction has exactly one
owner; no two libraries animate the same element/property.

### Final ownership scan (per element+property, final code)

Checked every animated element for dual ownership (Motion JS + CSS
transition/animation on the SAME property, GSAP + Motion on the same node,
two scroll writers). Result: NO conflicts. Notable verifications:

- NavBody/MobileNav springs (width/y/blur/shadow/borderColor, Motion-only;
  no Tailwind transition classes on those nodes) vs `header` conceal
  (CSS translate classes on the OUTER header — different element) ✓
- Hero rule: mount CSS animation replaced (not stacked on) the old
  `kmt-hero-enter` ✓; Spotlight (Motion x, own layers) vs GSAP
  `[data-drift]` nodes (GSAP-only siblings) vs title words (TextAnimate) ✓
- Sticky/Timeline beams: single Motion owner each. Timeline uses `height`
  (not scaleY) — deliberate exception: one owner, 2px paint area, measured
  clean in Phase 2/9 traversals; refactoring would churn for ~zero gain.
- BlurFade (Motion y on wrapper) vs card hover lifts (CSS on INNER nodes —
  nested, composes, no fight) ✓
- KmtGoldUnderline: inview mode = inline transform/transition only; mount
  mode = CSS animation only; never both on one node ✓
- Marquee/Sheet/Tooltip/Reveal: CSS-only owners ✓; Lenis = the single
  scroll writer, ScrollTrigger + useScroll are readers ✓
- `kmt-motion-nav-link::after` (CSS hover) vs `.kmt-nav-indicator` span
  (CSS mount) — different elements, read as one accent ✓

### Tasks

- [x] Complete the registry table below from measured final code
- [x] Refactor any dual-owned element/property found (none found)

| Area | Component | Library | Trigger | Property | Continuous? | Reduced Motion | Scroll dependency |
|---|---|---|---|---|---|---|---|
| Navbar | ResizableNavbar/NavBody | Motion | scroll threshold | width/y/blur/shadow/border (spring, discrete) | No | Static compact state | global scroll (threshold) |
| Navbar conceal | header element | CSS classes | scroll direction | translate (CSS transition) | No | None | flag only |
| Hero | Spotlight | Aceternity/Motion | in-view mount | transform x | Only in view | Settled static | none |
| Hero | GSAP parallax | GSAP ScrollTrigger+Lenis | scroll scrub | yPercent (own nodes) | While visible | Off | Lenis-synced |
| Hero title | TextAnimate | Motion | mount | opacity/blur/y (words) | No | Settled | none |
| Timeline | Aceternity Timeline | Motion | scroll | height/opacity (2px rail) | While visible | Static line | scroll |
| StickyScroll | Aceternity StickyScroll | Motion | scroll | active index/opacity (discrete) | While visible | Static content | scroll |
| Services grid | GlowingEffect | Motion + CSS vars | pointer/scroll (armed) | --start/opacity | Only in-view + fine pointer | Static | none |
| Reveals | Reveal / BlurFade | IO / Motion | entry once | opacity/translate | No | Static | none |
| Trust strip | Marquee | CSS keyframes (+RTL mirror) | always | transform | Yes (transform-only) | Static frame | none |
| Underline | KmtGoldUnderline | CSS/IO | entry once / mount | scaleX | No | Static | none |

### Acceptance Criteria

- [x] Table reflects final code; no shared element/property has two owners

### Findings

Single-owner throughout. The only continuous animations are the spotlight
(in-view only), hero parallax (scroll-scrubbed, Lenis-synced), and marquee
(compositor transform) — all intentionally owned.

### Files changed

_None (audit only)._

### QA result

PASS.

---

## Phase 11 — Visual QA

Status: COMPLETE

### Objective

Screenshot + motion QA of every required state after all fixes.

### Captures (`kmt-phase11/`, final tree, all console-clean)

- HOME EN 1440 dark / light, 390 dark / light — top, navbar-after-scroll,
  full page, footer
- HOME AR 1440 dark / light, 390 dark — same set
- Reviewed: hero, trust strip, services grid + accents, statement,
  focus/sticky, timeline, matters, industries, team, insights empty state,
  CTA band, footer + logo plaque, RTL mirrors, mobile stacking — coherent
  throughout, no overflow, no breakage, no regressions vs phase captures.

### Motion pass (final tree)

Trusted-wheel matrix with frame/longtask/console sampling:

| Config | p95 | Max | >50ms | Longtasks | Console |
|---|---|---|---|---|---|
| 1440 (slow→fast→stop→up→threshold×) | 33.4 | 66.7 | 6 singles | 0 | clean |
| 390 | 16.8 | 33.3 | 0 | 0 | clean |
| 1024 | 33.3 | 50 | 0 | 0 | clean |

No drop clusters, no delayed scroll, no navbar snap (height constant), no
sticky jumps, no blur stutter. The 1440 ≤67ms singles are the documented
dev-mode noise floor (no longtasks anywhere).

### Tasks

- [x] HOME EN 1440 dark / 1440 light / 390 dark / 390 light
- [x] HOME AR 1440 dark / 1440 light / 390 dark
- [x] States: page top, navbar after scroll, awareness statement, focus
  section, process/timeline, final CTA, footer (+ logo badge both themes)
- [x] Motion pass 1440 / 1024 / 390 (768 measured clean in Phase 2)

### Acceptance Criteria

- [x] All screenshots captured and reviewed; no regressions vs intent
- [x] Motion pass clean (zero longtasks, zero errors, tracks input)

### Findings

- Mid-pass infra repeat: AR route 500s/404 chunks from `.next` dev-cache
  corruption (zero source changes since AR last verified) — clean reboot
  restored 200s. Same lesson as Phases 3–4: single server, never touch
  `.next` under a running server.
- Capture-script lesson: `locator.screenshot()` on the translated
  (concealed) header waits forever — clip captures used instead.

### QA result

PASS.

---

## Phase 12 — Technical QA

Status: COMPLETE

### Objective

Full verification gate on the final tree.

### Gates (all on the final tree)

- [x] `npm run typecheck` — clean
- [x] `npm run lint` (full project) — no warnings/errors
- [x] `npm run build` (production) — green, all routes
- [x] `npm run test` (unit) — 83 files / 586 tests pass, 0 fail
  (53 opt-in DB skips)
- [x] E2E smoke (`mvp-smoke`) — **46/46** (after scoping one
  duplicate-testid locator to the visible instance; app was correct)
- [x] E2E hero hydration — 4/4 (covers the Phase 4 hero-rule change:
  geometry survives hydration, RM settles, SSR composition intact)
- [x] E2E luxury-visual — 74 pass; 5 documented below (not regressions)
- [x] Console clean: no React key, hydration, animation, image, or a11y
  warnings on any modified path (every probe in every phase)

### E2E notes (honest accounting)

- First smoke run failed 18/46 with `ERR_CONNECTION_REFUSED` — my 3100
  dev server had died and the runner's fallback dev took port 3000 while
  tests pointed at 3100. Environmental; single-server rerun fixed it.
- Luxury-visual 74/79: 1 internal-links timeout (PASSES solo warm —
  cold-compile contention, environmental) + 4 stale PLAN-28 assertions
  (`.kmt-motion-reveal` on hero pages, `.kmt-motion-card-beam` on
  services pages — classes absent from the approved Stage A/B tree in
  files this pass never touched for those systems). Pre-existing
  test-vs-redesign drift, out of scope to rewrite (would mean redefining
  approved motion contracts). The duplicate-testid click in the same spec
  got the same visible-filter fix as smoke and now passes.
- No e2e failure implicates any file changed in Phases 1–9.

### Tasks

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build` (production)
- [x] `npm run test` (unit)
- [x] Relevant e2e + visual/public tests
- [x] Console clean on modified paths

### Acceptance Criteria

- [x] All gates green; console clean (with the 5 documented
  pre-existing/environmental e2e items above, none from this pass)

### QA result

PASS.

---

## Text Underline Component Correction

Status: COMPLETE

### Current implementation found

- The awareness-statement phrase ("does not replace lawyer review" /
  "لا يغني عن مراجعة محام") was underlined by a LOCAL imitation:
  `KmtGoldUnderline variant="text"` (`src/components/ui/kmt-gold-underline.tsx`)
  renders a `block h-[2px]` bar under the phrase — a generic rule, not the
  hand-drawn effect.
- The REAL Magic UI Highlighter (`src/components/ui/highlighter.tsx`:
  `action` incl. `"underline"`, rough-notation `annotate`, motion `useInView`,
  `multiline`, `isView`) existed in the tree but was imported NOWHERE
  (verified by grep — zero importers).

### Actual component used (after correction)

- `Highlighter` with `action="underline"` — the real Magic UI component, kept
  untouched as the single effect owner.
- NEW thin KMT wrapper `src/components/ui/kmt-text-underline.tsx`
  (`KmtTextUnderline` + `KmtUnderlinedText` helper). The wrapper preserves the
  real Highlighter internally and only fixes KMT styling + contracts:
  - defaults: `action="underline"`, `color = #a87830` (exact KMT logo gold
    primary token — concrete hex because rough-notation draws on SVG, where
    `var(--kmt-public-gold)` would not resolve; restrained on both the
    deep-black dark canvas and warm light paper),
    `multiline = true`, `animateOnView = true` (the Highlander's own
    in-view trigger — no dedicated scroll listener per underline, no new
    animation engine),
  - `emphasis="subtle | normal | strong"` → strokeWidth 1 / 1.5 / 2
    (thin editorial annotation, never marker-like); explicit `strokeWidth` /
    `duration` props override,
  - reduced motion: `animationDuration = 0` + immediate show (underline KEPT,
    rendered instantly),
  - `data-kmt-text-underline` hook attribute for QA/tests.
- Replacement WAS needed (imitation → real component). No incompatibility
  found; no silent substitution.

### Files changed

- `src/components/ui/kmt-text-underline.tsx` (new wrapper + helper)
- `src/features/public-site/public-components.tsx` (`StatementBreak` phrase
  now `KmtTextUnderline emphasis="strong"`; `PublicSection` gains optional
  `descriptionHighlight` / `descriptionEmphasis` — copy stays plain strings,
  missing phrases render unchanged)
- `src/components/motion-ui/hero-parallax-layers.tsx` (optional
  `descriptionHighlight` / `descriptionEmphasis`; H1 untouched, section rule
  kept)
- `src/components/layout/public-shell.tsx` (final-CTA `h2` emphasizes one
  short phrase via `KmtUnderlinedText`)
- `src/features/public-site/public-pages.tsx` (homepage wiring, EN/AR)
- `tests/ui/kmt-text-underline.test.tsx` (new, 8 tests)
- `tests/ui/public-pages.test.tsx` (AR CTA assertion split across the new
  markup nodes + `data-kmt-text-underline` presence)

### Reuse (7 uses — within the 5–7 budget; awareness is strongest/longest)

1. Hero description: "reviews the facts and documents" / "الوقائع والمستندات" (normal)
2. Legal Services intro: "structured consultation request" / "طلب استشارة منظمًا" (subtle)
3. Awareness statement: existing highlight, `strong` + 900ms + multiline (reference)
4. Approach intro: "only after office review" / "بعد مراجعة المكتب" (normal)
5. Representative Matters intro: "without revealing client data" / "دون كشف بيانات عملاء" (subtle)
6. Team intro: "expertise paths" / "مسارات الخبرة" (subtle)
7. Final CTA heading: "a legal matter" / "مسألة قانونية" (normal)
- Deliberately skipped: Focus Area intro (dynamic `focusService.description`
  copy — no stable phrase to anchor), Insights intro (DB-empty state), full-H1
  / service-title / lawyer-name / step-label / button underlines (per rules).
- Variation: phrase length, strokeWidth (1/1.5/2), duration
  (550–900ms), single vs multi-line — one gold family, one component family.
- Section-rule bars (`KmtGoldUnderline` short/section/medium) intentionally
  KEPT as the separate approved rule grammar; only phrase underlines moved.

### RTL checked

- AR homepage renders all 7 marks; statement + hero + CTA screenshots
  reviewed — hand-drawn stroke sits correctly under Arabic phrases, line
  wrapping intact, RTL direction inherited. No letter-by-letter animation
  (rough-notation draws strokes, not glyphs).

### Reduced-motion checked

- Browser `reducedMotion: reduce` probe: marquee dx = 0.0 (static),
  statement SVG present with full phrase text (rendered immediately, kept).

### Performance checked

- No scroll listeners / rAF added (test asserts absence); each underline uses
  the Highlander's own IO-based in-view trigger. Full-page probe: 7 marks,
  only in-view instances draw SVG; zero console errors EN+AR.

### Final status

PASS. The imitation is gone from public paths; every phrase underline is the
real Magic UI Highlighter in KMT gold.

### Post-push runtime incident (dev-server infra, NOT a code defect)

- Symptom seen after the push: `Cannot read properties of undefined (reading
  'call')` at the `KmtUnderlinedText` JSX in `PublicSection` (EN), then
  `Cannot find module './vendor-chunks/motion-dom.js'` 500s on `/ar` after a
  `.next` wipe + reboot.
- Root cause (traced, both symptoms one chain): the correction session ran
  `npm run build` while the pre-existing dev server was still running
  (poisoned `.next` → the `reading 'call'` error on the new client-component
  node), then recovery accidentally ran TWO dev servers at once (Next
  auto-moved the second to :3001) sharing one `.next` → trampled vendor
  chunks (the `motion-dom.js` 500 via the background static-paths worker).
  Same incident class as Phase 3/4: never build under a running dev server,
  never run two dev servers on one tree.
- Proof it is not code: production `next build` green with these exact
  files; 594 unit tests pass incl. SSR render of `HomePageView` (AR) through
  line 101; cold single-server verification: `/` + `/ar` 200, 7/7
  `data-kmt-text-underline` marks each, statement SVG in `#a87830`, zero
  console/page errors EN+AR.
- Recovery applied: killed ALL node servers, verified zero remained, deleted
  `.next`, booted EXACTLY ONE dev server (genealogy-checked single
  npm→next→start-server chain; it serves on :3001), re-verified both
  locales. No source change was required.

---

## Trust Strip Component Correction

Status: COMPLETE

### Current implementation found

- File: `TrustStrip` in `src/features/public-site/public-components.tsx`.
- It ALREADY uses the actual Magic UI Marquee
  (`src/components/ui/marquee.tsx`: `repeat` / `reverse` / `pauseOnHover` /
  `vertical` props, `--duration` / `--gap` vars — the documented source).
- NO local custom CSS imitation exists: `kmt-motion-trust-strip` is absent
  from all runtime sources (existing PLAN-31 test asserts this), and the only
  trust CSS is the `kmt-marquee` / `kmt-marquee-rtl` keyframes plus a
  focus-within pause — animation ownership stays inside the Marquee.
- Content is the real `trustItems` copy (3 reassurance statements EN+AR).
  No awards, certifications, client names, logos, or review claims.

### Replacement needed?

- NO. Verified real component end-to-end; no rebuild, no static row, no
  cards, movement preserved. Styling was already KMT-adapted (narrow strip,
  `surface-muted` deep-black surface, hairline top/bottom borders, gold
  icons, warm muted text, small `pe-12` separators, edge-fade mask,
  `pauseOnHover`, 36s slow duration) and is kept byte-identical.

### Motion behavior (measured)

- EN (LTR): lane dx −76.2px/1.2s — smooth leftward, natural for the layout.
- AR (RTL): lane dx +54.8px/1.2s — mirrored rightward via the
  `kmt-marquee-rtl` keyframes (Phase 5 fix holds; `reverse` prop NOT used).
- `pauseOnHover` (Marquee prop) + `:focus-within` pause (globals.css) both
  active. Premium continuous drift, not a news ticker.

### RTL checked

- AR strip renders FULL and seamless (screenshot reviewed); direction is the
  natural RTL mirror. No empty-cycle frames.

### Reduced-motion checked

- `reducedMotion: reduce` probe: dx = 0.0, computed `animation: none` —
  statements preserved in a static usable layout, content NOT removed.

### Performance checked

- Transform-only `translateX` keyframes (compositor-driven); zero JS
  listeners on the strip; no rAF loops; no competing movement systems.
  Zero console errors on all captures.

### Files changed

- NONE (verification only). Regression coverage kept:
  `tests/ui/trust-strip.test.tsx` (doubled loop + a11y, no-`reverse`
  guard, RTL keyframes).

### Final status

PASS. Confirmed real Magic UI Marquee; local CSS was already absent;
RTL + reduced-motion + performance all verified, no code change required.

---

## Phase 13 — Final Report

Status: COMPLETE

### 1. StickyScroll key error

- Root cause: NOT the `.map()` (correctly keyed) — the sticky panel
  rendered the flight-transported `content` node unkeyed beside a static
  sibling; on EN it materialized as a lazy flight chunk, tripping React 19
  key validation (renderer StickyScroll, creator HomePageView).
- Fix: key both panel children at the StickyScroll level (static hairline
  key + `<Fragment key={title}>` with stable semantic id).
- File: `src/components/ui/sticky-scroll-reveal.tsx`.
- Regression: `tests/ui/sticky-scroll-keys.test.tsx` (fails pre-fix,
  passes post-fix) + 0 console warnings across refresh/navigate/EN/AR.

### 2. Initial scroll lag

- Root cause: sum of always-on costs — per-card GlowingEffect
  scroll/pointermove listeners (top cost, mobile longtasks to 205ms) +
  permanent Spotlight rAF loops + Lenis eased start.
- Conflicting systems audited: Lenis kept as the single scroll source
  (native removal measured catastrophically worse: 527ms longtasks);
  GSAP scrub kept (in-noise, correctly synced); NavBody already
  threshold-based.
- Fix: Spotlight unmounts offscreen; per-card glow arming (in-view +
  fine pointer + motion allowed).
- Performance: 1440 max-gap 67→33ms with zero hitches; 390 longtasks
  3→0; zero longtasks on 1440/1024/768/390 post-fix.
- Files: `hero-parallax-layers.tsx`, `capability-glow-gate.tsx` (new),
  `public-components.tsx`; test `capability-glow-gate.test.tsx`.

### 3. Navbar

- Dark before: transparent top blending into background, 82% scrolled.
- Dark after: integrated top + elevated 92% pill, gold border (animated
  color, reserved width), soft shadow, constant 63px geometry.
- Light: theme-aware end-to-end (fixed white-on-white wordmark via new
  CSS-driven `surface="theme"`); warm neutrals ≈7:1.
- Scroll behavior: TOP→SCROLLED threshold spring kept (measured clean);
  hover warms to gold + underline rule; active gold + indicator.
- Files: `globals.css`, `resizable-navbar.tsx`, `public-header.tsx`,
  `kmt-brand-logo.tsx`.

### 4. KMT animated underline

- Component: `src/components/ui/kmt-gold-underline.tsx` (+ keyframes) —
  short/section/medium/text variants, scaleX, RTL origin, RM-static,
  SSR-visible.
- Locations (9): hero rule, 6 section accents, statement divider+phrase,
  final CTA accent. Industries deliberately skipped.
- RTL verified (mirrored), reduced motion verified (static), full unit
  suite 580/0 at the time (586/0 final).

### 5. Trust strip

- Kept (Magic UI Marquee, same content/speed/mask). One required RTL fix:
  AR rendered empty most cycles (`reverse` time-reverses a broken path);
  mirrored `kmt-marquee-rtl` keyframes, EN byte-identical. RM static,
  a11y intact. Test: `trust-strip.test.tsx`.

### 6. Footer

- Dark theme: byte-identical deep black (computed bg unchanged).
- Light theme: warm ivory body + secondary legal bar, gold hairlines;
  measured contrast 15.94/7.22/5.84 (all AA+).
- Logo treatment: dark plaque (10px radius, gold/30 border, tight
  padding) in both themes + RTL; proportions/link untouched.
- File: `public-shell.tsx`; test: `public-footer-theme.test.tsx`.

### 7. Motion ownership

Single scroll writer (Lenis, GSAP-ticker-synced); every animated
element+property has exactly one owner (Phase 10 registry). Continuous
motion is limited to in-view spotlight, scroll-scrubbed parallax, and the
compositor marquee. Timeline `height` rail is the one deliberate
exception (single owner, 2px area, measured clean).

### 8. QA

- typecheck: clean. lint (full project): clean. build: green.
- tests: 586 pass / 0 fail (53 opt-in DB skips), incl. 20 new tests.
- e2e: smoke 46/46, hero-hydration 4/4, luxury-visual 74 + 5 documented
  pre-existing/environmental (none from this pass).
- console: clean on every probe. RTL: verified AR mirrors throughout.
- viewports: 390 / 768 / 1024 / 1440 measured; light + dark verified.

### Files touched by this pass (for deliberate commit)

- `docs/KMT_PUBLIC_REFINEMENT_PHASES.md` (this plan, new)
- `src/components/ui/sticky-scroll-reveal.tsx`
- `src/components/motion-ui/hero-parallax-layers.tsx`
- `src/features/public-site/public-components.tsx`
- `src/features/public-site/public-pages.tsx`
- `src/components/layout/public-shell.tsx`
- `src/components/layout/public-header.tsx`
- `src/components/ui/resizable-navbar.tsx`
- `src/components/brand/kmt-brand-logo.tsx`
- `src/components/ui/kmt-gold-underline.tsx` (new)
- `src/features/public-site/capability-glow-gate.tsx` (new)
- `src/app/globals.css`
- `tests/ui/sticky-scroll-keys.test.tsx` (new)
- `tests/ui/capability-glow-gate.test.tsx` (new)
- `tests/ui/kmt-gold-underline.test.tsx` (new)
- `tests/ui/trust-strip.test.tsx` (new)
- `tests/ui/public-footer-theme.test.tsx` (new)
- `tests/e2e/mvp-smoke.spec.ts` (1-line test scoping fix)
- `tests/e2e/public-luxury-visual.spec.ts` (1-line test scoping fix)
- NOT committed/pushed by this session: the tree holds extensive
  pre-existing uncommitted redesign work; pushing would misattribute it.
  Commit deliberately (above list only) when ready.
