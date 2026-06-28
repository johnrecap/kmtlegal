# PLAN-31: Public Motion V2 - Cinematic Legal

## Summary
- Goal: replace the weak public Gold Legal Thread accent with a clearer Cinematic Legal motion system.
- Scope: public website only, including English default routes and optional Arabic `/ar` routes.
- Technical decision: CSS-only public motion utilities, no new runtime dependency, and full `prefers-reduced-motion` support.

## Implementation Contract
- Remove `kmt-motion-thread`, `kmt-motion-trust-strip`, `publicMotionThread`, and `publicMotionTrustStrip` from runtime source and CSS.
- Reuse public motion helpers from `src/features/public-site/public-motion.ts`; do not create a parallel animation system.
- Use V2 classes:
  - `kmt-motion-cta` for CTA shine, inner glow, hover lift, and active press.
  - `kmt-motion-card-beam` for animated masked border beams on card hover/focus.
  - `kmt-motion-icon-halo` for gold halo/orbit-style icon emphasis on interactive groups.
  - `kmt-motion-arrow-trail` for inline-forward arrow movement and trail.
  - `kmt-motion-panel-enter` for short panel/status entrance.
  - `kmt-motion-hero-spotlight` for CTA-area hero depth.
- Keep movement premium/legal: no bounce, confetti, particles, typewriter, counters, scroll-jacking, or new animation package.

## Public Surface Application
- `PublicShell`: consultation CTA shine, language switch CTA treatment, brand/contact icon halos, faster active nav underline.
- `PageHero`: stronger image settle and CTA spotlight, with no decorative line under text.
- `PracticeAreaCard`, directory cards, representative cards, focus panels, contact branch cards, and booking side panels: border beam and controlled lift.
- Trust icons and practice icons: halo on hover/focus through interactive group wrappers.
- `BookingStepper`, `ContactForm`, and `DirectoryFilter`: richer focus/status/step transitions while preserving API contracts.

## Accessibility And RTL
- Reduced motion disables reveal, lift, zoom, shine sweep, beam spin, icon tilt, and arrow shift.
- RTL keeps static arrow mirroring and moves the arrow inline-forward to the left.
- Disabled/loading buttons do not lift or shine.
- Hover/focus states must not create page-level horizontal overflow at 390px.

## Verification
- Static: no removed thread class appears in runtime source or CSS.
- Unit/UI tests: motion contract validates V2 class availability and no `motion` dependency.
- Playwright: English and Arabic public pages render with V2 hooks, no thread DOM, reduced-motion disabled movement, RTL arrow direction, and no overflow after hover/focus.
- Standard gates: `npm run typecheck`, `npm run lint`, `npm run test`, `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build`, and focused public visual smoke.
