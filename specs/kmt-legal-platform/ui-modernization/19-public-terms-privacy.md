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

- [P1] Terms: no `<h1>`, no TOC, no last-updated (`public-pages.tsx:811-828`).
- [P3] Privacy TOC has no active-section indication (`public-pages.tsx:728-744`).

## Tasks

- [ ] T19.1 Terms parity with privacy: `<h1>`, sticky TOC, last-updated `<time>`, numbered sections with `scroll-mt`.
- [ ] T19.2 TOC active-section highlight via IntersectionObserver (gold indicator, token motion; reduced-motion: instant switch); works RTL.
- [ ] T19.3 Both pages: tokenized surfaces, both themes, reading width `max-w-[65ch]`.
- [ ] T19.4 Verify AR: TOC anchors, section numbering, mixed Latin terms isolation.

## Verify

- [ ] Anchor navigation works in both directions/locales; screenshots 375/1440 × themes.
