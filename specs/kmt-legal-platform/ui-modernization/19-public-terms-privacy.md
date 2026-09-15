# 19 — Public Terms + Privacy

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URLs | Source |
|---|---|---|
| EN | `/terms`, `/privacy` | → `TermsPageView`, `PrivacyPageView` |
| AR | `/ar/terms`, `/ar/privacy` | catch-all → same views |

## Components

PublicSection panels, PolicyBlocks; privacy has sticky TOC + "Key information" card + 13 sections; terms is a single 4-block panel.

## Issues (audit)

- [P1] Terms: no `<h1>`, no TOC, no last-updated (`public-pages.tsx:811-828`). *(fixed — T19.1)*
- [P3] Privacy TOC has no active-section indication (`public-pages.tsx:728-744`). *(fixed — T19.2)*

## Tasks

- [x] T19.1 Terms parity with privacy: `<h1>`, sticky TOC, last-updated `<time>`, numbered sections with `scroll-mt`. *(termsPage content reshaped EN+AR from `blocks[]` to `sections[]` with stable ids + numbered titles + `lastUpdated`/`contentsLabel`; TermsPageView rebuilt on the privacy layout — `headingLevel="h1"`, sticky `PolicyToc` aside, last-updated `<time dateTime>` chip, `scroll-mt-28` sections; `PolicyBlock` deleted)*
- [x] T19.2 TOC active-section highlight via IntersectionObserver (gold indicator, token motion; reduced-motion: instant switch); works RTL. *(new client component `src/features/public-site/policy-toc.tsx` — renders plain anchor links server-side (no-JS safe), observer watches a 4px detector band at the 118px anchor landing line, last section in document order wins the band, bottom-of-page fallback activates the last entry; active link gets `aria-current="location"` + gold `start-1.5` indicator (`scale-y-0→100`, `duration-kmt-normal ease-kmt-out`, `motion-reduce:transition-none`); `start` edge flips to the right in RTL; used by both pages)*
- [x] T19.3 Both pages: tokenized surfaces, both themes, reading width `max-w-[65ch]`. *(all `text-white`/`text-slate-300`/`text-amber-100`/`hover:bg-white/5`/`border-white/10`/`marker:text-kmt-gold` replaced with `--kmt-public-*` tokens; section body wrapped in `max-w-[65ch]` (resolves 574px at 16px base — verified capped); link buttons on token motion)*
- [x] T19.4 Verify AR: TOC anchors, section numbering, mixed Latin terms isolation. *(AR terms sections numbered ١-style titles "1. …"–"4. …" with matching anchors; privacy AR summary values now `<bdi>`-isolated alongside the existing link `<bdi>`s — 10 bdi nodes, `unicode-bidi: isolate` verified; RTL indicator edge verified at 6px from right)*

## Verify

- [x] Anchor navigation works in both directions/locales; screenshots 375/1440 × themes. *(77/77 DOM probes: EN/AR × both pages anchor jumps land at the `scroll-mt-28` line and activate the matching TOC entry, back-up navigation, direct hash entry, page-bottom fallback, RTL indicator edge, light/dark token flip (ink `rgb(28,24,18)` + gold `rgb(117,90,38)` light / `rgb(199,154,82)` dark), reduced-motion instant switch (`transitionProperty: none`), 65ch cap, zero horizontal overflow at 375/1440, zero console errors; 16 full-page screenshots EN/AR × 375/1440 × dark/light saved under the probe temp dir — note: agent model could not visually inspect images, verification is DOM-based; typecheck, warning-free lint, 566 unit tests (+3 new terms-page tests), e2e smoke 45/46 — the 1 failure (`/client` 500) is the documented local Postgres auth noise, reproduced on clean main before these changes)*

### Notes

- Playwright `locator.boundingBox()` has no `.top` property (`x/y/width/height` only) — cost an hour of phantom "scroll failed" debugging; use `getBoundingClientRect().top` in page evals.
- The active-section observer uses a thin band (~118–122px from viewport top, just below the 112px anchor landing position) instead of a "top third" zone: with tall sections a top-third zone lets the *next* section light up while the clicked one is still at the reading line (seen on the short 4-section terms page).
- `window.scrollTo` during an in-flight Lenis anchor animation cancels Lenis's programmatic target (Lenis re-emits its own scroll from the interrupted position); real user input goes through Lenis retargeting, so this only affects synthetic probes — wait for the animation to settle before programmatic jumps in tests.
- Lenis `anchors: true` reads `scroll-margin-top` from the target (lenis.mjs:783) so anchor landings honor `scroll-mt-28` exactly.
