# PLAN-30: KMT Signature Motion System

## Summary
- Goal: add a restrained public-only motion layer for the English-first public website and optional Arabic `/ar` pages.
- Direction: Judicial Precision, using the Gold Legal Thread pattern across nav underlines, CTAs, cards, icons, filters, and forms.
- Scope: public website only. Admin, portal, install, product-system, login, and Stitch clone surfaces must not inherit public motion styling.
- Technical decision: CSS/Tailwind-first motion utilities only. No Framer Motion, GSAP, Lottie, Rive, or new runtime dependency.

## Implementation Contract
- Motion helpers live under `src/features/public-site/` and are opt-in through `kmt-motion-*` classes.
- Public motion uses short durations: 160-220ms for hover/focus/state, 420-560ms only for one-time hero/image settle.
- The Gold Legal Thread must be visible as a static brand accent after animation completes, not only as an invisible hover behavior.
- Directional arrows keep semantic RTL mirroring and move inline-forward only when motion is allowed.
- Reduced motion disables reveal, lift, zoom, and shift motion while preserving static RTL direction.
- Interactions use `opacity`, `transform`, `border-color`, `background-color`, `color`, and controlled shadow only.

## In-Scope Surfaces
- `PublicShell`: nav underline reveal, footer link underline, consultation CTA lift, brand/contact icon glow.
- Public components: hero reveal/settle, visible Gold Legal Thread accents under hero/section labels, clickable card lift, image-card zoom, practice-area icon/arrow motion, final CTA motion.
- Directory filters: focus-within glow, category button state transitions, result/empty-state fade.
- Public forms: contact and booking focus glow, status fade, booking step panel transition, success check reveal.

## Guardrails
- No scroll-jacking, typewriter effects, particles, counters, looping ambient motion, confetti, or exaggerated bounce.
- No animation of layout properties such as `height`, `width`, `top`, or `left`.
- Disabled/loading controls must not lift on hover.
- No public motion class may be applied to protected shells or `/stitch-clone/*`.

## Verification
- Static gates: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- E2E gates: `npm run test:e2e:smoke` and focused `tests/e2e/public-luxury-visual.spec.ts`.
- Visual QA: desktop/mobile screenshots for `/`, `/services`, `/contact`, `/book-consultation`, plus `/ar` equivalents.
- Accessibility QA: `prefers-reduced-motion: reduce`, keyboard focus, RTL arrow direction, and no horizontal overflow after hover/focus.
