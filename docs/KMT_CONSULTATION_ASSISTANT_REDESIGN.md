# KMT Consultation Assistant — Final Correction Pass

Scope: booking assistant density/theme + public Floating Dock. No other
pages redesigned. Prior passes (unified console, in-chat journey, token
system) remain the base; this pass corrects density, compactness, and
adds the dock.

## Phase 0 — Current visual/theme audit

- **Current problem:** production screenshots show a dark-hardcoded
  assistant (white text on ivory, black shell in light mode, trust-chip
  strip, oversized composer). Local code already fixed the system, but
  density is still off: 944px shell, 428px viewport, 74px composer,
  56px send, 44px message avatars, chunky tab pills.
- **Root cause:** (a) production serves pre-correction code — pushes
  `21db4c8`/`9d139c2` were never deployed via the aaPanel update script,
  so review happened against the old implementation; (b) local density
  targets were never applied (width/height/composer/avatar scale).
- **Tasks:** measure all 12 combos (AR/EN × dark/light × 1440/768/390):
  computed shell/log/title colors + contrast, shell/viewport/composer/
  send geometry, placeholder centering, console errors; grep every
  hard-coded visual in the chat.
- **Component/source used:** none (audit only).
- **Files changed:** `scripts/tmp-final-audit.mjs` (temporary, removed).
- **Acceptance criteria:** quantitative baseline + hardcoded inventory.
- **Screenshots reviewed:** `test-results/final-audit/` (24 captures).
- **Status:** COMPLETE.
- **Findings:**
  - Theme system CORRECT locally: title/shell contrast 16.5–17.8:1 both
    themes; shell dark `#0a0908` / light `#faf7f0`; log dark `#050505` /
    light `#fffdf8`; zero console errors, all 12 combos.
  - Hardcoded inventory in chat: only intentional KMT golds
    (`#120d07` on-gold text, `#eac987`/`#a87830` beam, `#c7a363` hover,
    `#2f7a3d`/`#7ad36a` status greens) + one decorative hairline
    gradient. No `bg-black/white`, `text-white`, `slate/gray/stone`,
    `rgba()`, shadows.
  - Density baseline: shell 944×686, log 428px, composer 74px, send
    56px, input 48px, placeholder offset 0.0px (already centered),
    title 24px/20px, message avatars 44px.
  - Trust-chip strip: already removed in a prior pass (verified absent).

## Phase 1 — Theme token correction

- **Current problem:** light theme must read as premium warm legal
  stationery; every surface needs an intentional token, contrast ≥4.5:1.
- **Root cause:** prior pass created the tokens; this pass verifies the
  mapping against the brief's palettes and closes residuals (user-bubble
  gold border → line token; muted-text contrast proof).
- **Tasks:** keep/verify `--kmt-assistant-*` mapping; soften user-bubble
  border; prove muted contrast ≥4.5:1 both themes in QA.
- **Component/source used:** KMT theme tokens (`src/app/globals.css`).
- **Files changed:** `src/app/globals.css` (verify only),
  `src/features/public-site/consultation-booking-chat.tsx` (bubble border).
- **Acceptance criteria:** token table below holds live; no white text on
  light; no gray block; logo plaque stays dark in both themes.
- **Screenshots reviewed:** `test-results/final-qa/` + `final-audit/` —
  shell dark `#0a0908` / light `#faf7f0` confirmed live; log dark
  `#050505` / light `#fffdf8`.
- **Status:** COMPLETE.
- **Contrast proof (computed):** title/shell 17.37 dark / 16.51 light;
  muted/log 7.88 dark / 5.91 light; user text/bubble 15.76 dark / 14.54
  light — all ≥ 4.5:1. User-bubble border softened to the line token;
  gold now signals only send/action/active-tab/selected.
- **Tokens (light / dark):** shell `#faf7f0` / `#0a0908`; log `#fffdf8` /
  `#050505`; bubble `#ffffff` / `#14110c`; user `#f3e8d2` / `#1d150a`;
  input `#ffffff` / `#100e0c`; text `#1c1812` / `#f5efe3`; muted
  `#6b6252` / `#a8a094`; line `117 90 38/25%` / `208 160 72/18%`; chip
  `#ffffff` / `236 220 190/5%`.

## Phase 2 — Assistant density and shell cleanup

- **Current problem:** oversized shell, empty viewport, giant avatars,
  loose header (targets: ~800–900px width, 280–360px viewport, 65–75%
  bubbles, 15–16px text, 10–14px vertical padding, small avatars).
- **Root cause:** first-pass sizing favored presence over density.
- **Tasks:** page console `max-w-[64rem]`→`max-w-[56rem]`; shell
  `h-[min(72vh,38rem)] min-h-[30rem]`; header logo lg→md, title
  24px→18/20px, tighter padding; bubbles 72% / 15.2px / 12px×16px /
  leading-7; message avatars md→sm (44→36px), tone dots 40→32px;
  info card + slot/payment panels narrowed to `36rem`.
- **Component/source used:** spacing/composition only.
- **Files changed:** `consultation-booking-chat.tsx`, `public-pages.tsx`.
- **Acceptance criteria:** measured shell ≈896px cap, viewport ≈300px,
  no empty cavern on first paint, input never moves.
- **Screenshots reviewed:** `test-results/final-qa/` (all widths).
- **Status:** COMPLETE.
- **Measured:** shell 832px wide (896 cap minus padding), fixed heights
  hold (518–610px by viewport), log ≈300px, bubbles 72%, 15.2px text,
  12px×16px padding, avatars 36px, header logo 44px + 18/20px title.

## Phase 3 — Conversation architecture

- **Current problem:** none structural — journey already lives inside the
  chat (language → intent → matter → details → slot → review → payment →
  confirmation + new-request). Keep and re-verify after density edits.
- **Root cause:** n/a (verification phase).
- **Tasks:** re-run journey e2e + scripted QA after edits.
- **Component/source used:** Magic Animated List (existing wiring).
- **Files changed:** none expected.
- **Acceptance criteria:** full journey in-chat; options collapse
  contextually; booking logic byte-identical.
- **Screenshots reviewed:** `test-results/final-qa/` states 01–05
  (initial → confirmation) in 4 desktop combos.
- **Status:** COMPLETE (re-verified after density edits; e2e below).

## Phase 4 — Real component verification

- **Current problem:** prove the four chat components are imported AND
  rendered (plus the dock — Phase 8).
- **Root cause:** n/a (verification phase).
- **Tasks:** unit source contracts for vanish input, animated list, tabs,
  beam; computed-style proof that tab overrides win (twMerge).
- **Component/source used:** Aceternity vanish input, Magic animated
  list, Animate UI tabs, Magic border beam.
- **Files changed:** `tests/ui/booking-assistant-stage.test.tsx`.
- **Acceptance criteria:** per-component table in the final report with
  import path, render site, RTL/light/dark/RM status.
- **Screenshots reviewed:** `test-results/final-qa/`.
- **Status:** COMPLETE.
- **Verification table:**
  - Aceternity Placeholders And Vanish Input — source
    `ui.aceternity.com/components/placeholders-and-vanish-input`,
    installed `src/components/ui/placeholders-and-vanish-input.tsx`,
    rendered in the composer zone of `consultation-booking-chat.tsx`
    (`formTestId="booking-chat-composer"`), purpose staged composer,
    RTL/Light/Dark/RM tested.
  - Magic Animated List — source
    `magicui.design/docs/components/animated-list`, installed
    `src/components/ui/animated-list.tsx`, rendered around the whole
    conversation (`delay={160}`), purpose sequenced turns, RTL/Light/
    Dark/RM tested (RM renders settled).
  - Animate UI Tabs — source `animate-ui.com/docs/components/radix/tabs`,
    installed `components/radix/tabs.tsx` + primitive, rendered as
    `BookingStageTabs` in the assistant header, purpose stage motion,
    RTL/Light/Dark/RM tested.
  - Magic Border Beam — source
    `magicui.design/docs/components/border-beam`, installed
    `src/components/ui/border-beam.tsx`, rendered on the assistant shell
    ONLY (`size={90} duration={9}` gold), purpose finishing detail,
    Light/Dark/RM tested (RM keeps a static hairline).
  - Aceternity Floating Dock — source
    `ui.aceternity.com/components/floating-dock`, installed
    `src/components/ui/floating-dock.tsx`, rendered by
    `PublicFloatingDock` in `PublicShell`, purpose public shortcuts,
    RTL/Light/Dark/RM tested (RM via `MotionConfig reducedMotion`).

## Phase 5 — Input/composer

- **Current problem:** 74px pill, 56px send; targets 50–56px pill,
  40–44px send, centered placeholder, aligned icon, sticky bottom.
- **Root cause:** first-pass composer padding/scale.
- **Tasks:** form `py-1.5 pe-1.5 ps-5`; input `min-h-10 text-[0.95rem]`;
  send `h-11 w-11` (44px) + `text-lg` icon (RTL-mirrored); placeholder
  `text-[0.95rem] pe-20`; privacy note `text-xs`; composer stays
  sticky bottom, log scrolls above (native).
- **Component/source used:** Aceternity Placeholders And Vanish Input
  (real component, styling owned by caller per its contract).
- **Files changed:** `consultation-booking-chat.tsx`.
- **Acceptance criteria:** measured pill 50–56px, send 40–44px,
  placeholder offset ≈0px, no page scroll on submit (e2e ≤2px).
- **Screenshots reviewed:** `test-results/final-qa/`.
- **Status:** COMPLETE.
- **Measured:** pill 54px, send 44px, placeholder offset 0.0px all
  combos; submit scroll e2e passes (fixed shell + stabilized viewport).
- **Geometry correction (follow-up):** root causes found in the caller
  classes, not the component — (a) the placeholder overlay spans the
  form's full padding box while the placeholder text had no inset-start,
  so glyphs touched the border (fixed with logical `ps-4` on the
  placeholder, matching the input's 16px start); (b) the send Button's
  default `min-h-11` beat `h-10` (different TW groups), holding the pill
  at 54px (fixed with `!min-h-0` → send 40px, pill 50px). Original
  Aceternity alignment (`inset-0` + `items-center`) preserved — no top /
  translate hacks.   Final measured: pill 50px, send 40×40, breathing 4px,
  glyph inset 17px LTR+RTL symmetric, shared 24px line box, submit +
  vanish intact. Close-ups: `test-results/composer-fix/`.
- **Text-origin correction (follow-up):** placeholder glyphs sat at 17px
  while typed text started at ~29px — a 12px (≈1.5-char) jump. Root
  cause: `@tailwindcss/forms` injects unlayered 12px/8px input padding
  (measured live; same plugin family as the earlier focus-ring fight),
  so the fix is `!p-0` on the input (important is required — unlayered
  beats layered utilities). Shared origin is now the form's logical
  `ps-4` (16px + 1px border = 17px) for input text, animated/static/
  returned placeholder alike. Proof: `test-results/placeholder-origin/`
  (5 states × EN/AR, glyph ranges + close-ups).

## Phase 6 — Booking stages inside chat

- **Current problem:** stage Tabs work but look like a giant segmented
  control; must become compact (small labels + animated indicator).
- **Root cause:** first-pass tab sizing.
- **Tasks:** compact overrides — list `p-1`, triggers `min-h-8`
  `text-[0.72rem]` `px-2.5 py-1.5`, keep disabled-status semantics +
  animated indicator + hint line; verify RTL order + keyboard order.
- **Component/source used:** Animate UI Radix Tabs (real component).
- **Files changed:** `consultation-booking-chat.tsx`.
- **Acceptance criteria:** slim stage row; active pill animates; completed
  checks; future muted; AR reads 01→04 right-to-left.
- **Screenshots reviewed:** `test-results/final-qa/` (stage states incl.
  contact✓ details✓ slot-active).
- **Status:** COMPLETE (triggers `min-h-8 text-[0.72rem]`, list `p-1`,
  animated indicator + hint retained, triggers stay disabled-status).

## Phase 7 — RTL / Arabic

- **Current problem:** none known — verify after density edits.
- **Root cause:** n/a (verification phase).
- **Tasks:** AR screenshots all widths; tab order = visual order;
  send mirrored; digits/bidi intact.
- **Component/source used:** logical `dir` + rect-math indicator.
- **Files changed:** none expected.
- **Acceptance criteria:** no CSS-order fakes; keyboard matches visual.
- **Screenshots reviewed:** `test-results/final-qa/` AR combos all widths.
- **Status:** COMPLETE (`dir` from locale, rect-math indicator,
  `rtl:-scale-x-100` send, bidi intact in shots).

## Phase 8 — Floating Dock

- **Current problem:** no public dock exists.
- **Root cause:** never implemented.
- **Tasks:** vendor the REAL Aceternity Floating Dock architecture
  (`FloatingDock` desktop magnification + `FloatingDockMobile`) under
  `src/components/ui/floating-dock.tsx` using `motion/react` +
  caller-provided KMT icons; wrap as `PublicFloatingDock` (client) with
  EXACTLY two actions — Consultation (localized internal route) and
  WhatsApp (`NEXT_PUBLIC_KMT_WHATSAPP_URL` or `/contact` fallback,
  `target=_blank rel=noopener noreferrer`); render once in
  `PublicShell`; theme-adapted (deep black/gold dark, warm light);
  `MotionConfig reducedMotion="user"`; fixed bottom-center with
  safe-area, compact by default.
- **Component/source used:** Aceternity Floating Dock
  (https://ui.aceternity.com/components/floating-dock).
- **Files changed:** new `floating-dock.tsx` + dock wrapper,
  `public-shell.tsx`, tests.
- **Acceptance criteria:** real dock behaviors (magnification, tooltips,
  mobile menu); 2 actions only; public routes only (never Admin/Client);
  no overlap with composer/footer/CTA; EN+AR; light+dark.
- **Screenshots reviewed:** `test-results/final-qa/dock-*` (collapsed,
  hover with tooltip+magnification, mobile open) + EN-light confirmation
  (this shot PROVED the dock covered the composer on the booking route).
- **Status:** COMPLETE.
- **Precedence decision:** the shell hides the dock on
  `/book-consultation` (both locales). The dock's primary action IS that
  page, and a fixed overlay must never cover a persistent focused input —
  functional no-overlap wins over ubiquity. All other public routes keep
  it; footer/legal-bar overlap while scrolled to the very bottom is the
  standard transient overlay (compact, click-through surroundings).

## Phase 9 — Responsive QA

- **Current problem:** verify 390/768/1024/1440 after density + dock.
- **Root cause:** n/a (verification phase).
- **Tasks:** assistant near-full-width mobile; compact progress;
  composer thumb-comfortable; options wrap; dock mobile behavior.
- **Component/source used:** none.
- **Files changed:** none expected.
- **Acceptance criteria:** no overflow anywhere; no hover dependency.
- **Screenshots reviewed:** `test-results/final-qa/` +
  `test-results/final-audit/` (390/768/1024/1440 × AR/EN × dark/light).
- **Status:** COMPLETE (tabs scroll reachably on 390, chips wrap,
  composer thumb-usable, dock mobile menu verified).

## Phase 10 — Technical + visual QA

- **Tasks:** typecheck, lint, build, unit, relevant e2e, muted-contrast
  proof, console/hydration/RTL/keyboard/focus/RM checks, final report.
- **Acceptance criteria:** the brief's 26-box list, all true.
- **Screenshots reviewed:** all rounds above.
- **Status:** COMPLETE.
- **Gates:** `typecheck` clean · `lint` clean · production `next build`
  green · unit 86 files / 619 tests pass · e2e validation 6/6 (incl.
  dock + matter-journey) · recovery 31/31 · smoke booking 1/1 ·
  `batch5` unchanged (pre-existing header duplicate-switch, out of
  scope) · zero console errors in scripted journeys · production probe
  (SSR+hydration, 4 combos incl. revisits) clean.
- **Hydration note:** an intermittent dev-only hydration console warning
  appeared in the 16-page screenshot marathon (never twice on the same
  combo, never with a component stack captured in 15+ targeted probes:
  isolated loads, full journeys, revisits, cold/warm server all clean;
  e2e zero-console-error assertion passes). Root cause: dev-server
  compile/HMR race under rapid sequential marathon load — production
  SSR+hydration is deterministic and clean. No product change indicated.
