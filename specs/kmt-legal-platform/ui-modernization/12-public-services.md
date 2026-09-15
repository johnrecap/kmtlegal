# 12 — Public Services (list + detail)

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URLs | Source |
|---|---|---|
| EN | `/services`, `/services/[slug]` | `services/page.tsx`, `services/[slug]/page.tsx` → `ServicesPageView`, `ServiceDetailPageView` |
| AR | `/ar/services`, `/ar/services/[slug]` | catch-all → same views |

## Components

PageHero, DirectoryFilter (search + category chips + card grid), ServiceCard content, DetailCta sidebar (sticky booking CTA), Badge chips (services included / documents / outputs).

## Issues (audit)

- [P0] Badge chips render white pills on the detail page (`public-pages.tsx:382,390`; `directory-filter.tsx:144`) — fixed by T1.3, verify here.
- [P1] No `<h1>` on service detail (`public-pages.tsx:370-374` — `PublicSection` defaults h2).
- [P1] Active filter chip `border-kmt-gold bg-kmt-gold text-white` fails AA (`directory-filter.tsx:81`).
- [P2] LCP: compact PageHero images lazy-loaded (`public-components.tsx:104`, all list pages).
- [P2] 4px corners vs 28px booking-flow corners (two-skins).
- [P3] No breadcrumbs; back nav is bottom-of-page button only (`public-pages.tsx:404`).

## Tasks

- [ ] T12.1 List page: PageHero `priority` on compact heroes (or `fetchPriority="high"`); card grid on new radius ramp; active filter chip = gold bg + dark text (AA).
- [ ] T12.2 Detail page: add `headingLevel="h1"`; breadcrumbs (Services › category › title) with structured data; DetailCta becomes sticky glass card with token styling.
- [ ] T12.3 Detail content: "Services included / Documents / Expected outputs" as tokenized chip groups (Badge T1.3) — verify dark + light.
- [ ] T12.4 Card hover: interactive depth (translateY + shadow token, 150ms); icon halo kept; reduced-motion: no transform.
- [ ] T12.5 Migrate CTAs to `ButtonLink` (next/link) — kills full-page reload from cards and DetailCta.
- [ ] T12.6 Verify AR: category chips, search normalization (see T18.6 shared helper), `dir` isolation on counts.

## Verify

- [ ] Screenshots 375/1440 × EN/AR × themes; Lighthouse LCP check on `/services`.
- [ ] Keyboard: chip filter cycle, card link focus, breadcrumb navigation.
- [ ] Smoke e2e green.
