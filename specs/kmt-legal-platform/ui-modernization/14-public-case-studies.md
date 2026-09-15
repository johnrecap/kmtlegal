# 14 — Public Case Studies (list + detail)

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URLs | Source |
|---|---|---|
| EN | `/case-studies`, `/case-studies/[slug]` | → `CaseStudiesPageView`, `CaseStudyDetailPageView` |
| AR | `/ar/case-studies`, `/ar/case-studies/[slug]` | catch-all → same views (DB-backed, locale-aware alternates) |

## Components

PageHero, DirectoryFilter, case study cards (category badge, meta "Anonymous"), detail: Challenge/Approach/Outcome/Lessons blocks + disclaimer + DetailCta.

## Issues (audit)

- [P0] Category badges render white pills (`public-pages.tsx:592`, `directory-filter.tsx:144`).
- [P1] No `<h1>` on detail (`public-pages.tsx:589`).
- [P2] List hero image identical to home Focus Area image (`public-pages.tsx:555` vs `:251`).
- [P3] No breadcrumbs; "Anonymous" meta on every card is repetitive.

## Tasks

- [ ] T14.1 List: distinct hero image; card grid on radius ramp; badges verified both themes; meta line refined (category + year instead of repeated "Anonymous", keep anonymization note once in section intro).
- [ ] T14.2 Detail: `<h1>`; breadcrumbs; Challenge/Approach/Outcome/Lessons as numbered scroll-reveal blocks (stagger 60ms, reduced-motion: static); cross-locale alternate links kept.
- [ ] T14.3 DetailCta + back button migrated to new Button/ButtonLink.
- [ ] T14.4 Verify AR direction, badge tokens, disclaimer styling in both themes.

## Verify

- [ ] Screenshots 375/1440 × EN/AR × themes; locale switch on detail keeps slug mapping.
- [ ] Smoke e2e green.
