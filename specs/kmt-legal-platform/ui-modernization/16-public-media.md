# 16 — Public Media

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URLs | Source |
|---|---|---|
| EN | `/media` | `media/page.tsx` → `MediaPageView` |
| AR | `/ar/media` | catch-all → same view |

## Components

PageHero + static 3-col grid of media cards (type badge, date, title, description).

## Issues (audit)

- [P0] Type badges render white pills (`public-pages.tsx:623`).
- [P2] Cards are dead text — no links to actual videos/posts/seminars (`public-pages.tsx:620-629`).
- [P3] Card titles use `h2` while all other card grids use `h3` (`public-pages.tsx:626`).

## Tasks

- [ ] T16.1 Make media items linkable: add optional `href` per item in `public-content.en.ts`/`.ar.ts`; card = link with external-icon affordance when off-site; items without links show "coming soon" muted state.
- [ ] T16.2 Cards on radius ramp with hover depth (150ms, reduced-motion: none); titles `h3`; badges verified both themes.
- [ ] T16.3 Verify AR direction + external link icon mirroring.

## Verify

- [ ] Every card either links or shows explicit unavailable state; external links open `rel="noopener"`.
- [ ] Screenshots 375/1440 × EN/AR × themes.
