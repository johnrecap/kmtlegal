# 13 — Public Team (list + detail)

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URLs | Source |
|---|---|---|
| EN | `/team`, `/team/[slug]` | `team/page.tsx`, `team/[slug]/page.tsx` → `TeamPageView`, `TeamDetailPageView` |
| AR | `/ar/team`, `/ar/team/[slug]` | catch-all → same views |

## Components

PageHero, DirectoryFilter, lawyer cards (photo, name, title, specialties badges, booking meta), detail: portrait panel + specialties/languages badges + booking-notice + disclaimer + Request Consultation ButtonLink.

## Issues (audit)

- [P0] Specialty badges render white pills (`public-pages.tsx:458`).
- [P1] No `<h1>` on team detail (`public-pages.tsx:449`).
- [P2] Arbitrary `h-[460px]` portrait (`public-pages.tsx:451`); photo treatment inconsistent with home (`:452` vs `:289`).
- [P2] No credentials (education, admissions, experience) — trust gap for a law firm.
- [P3] No breadcrumbs.

## Tasks

- [ ] T13.1 List: card grid on new radius ramp; photo hover treatment unified (grayscale→color, scale token); badges verified both themes.
- [ ] T13.2 Detail: `<h1>` name; breadcrumbs (Team › name); portrait `aspect-[4/5]` responsive (replace `h-[460px]`), same hover treatment.
- [ ] T13.3 Add credentials section (education, admissions, years of experience) — content entries in `public-content.en.ts` / `.ar.ts` + `public-services.ts` lawyer data; AR copy reviewed by native reviewer.
- [ ] T13.4 Booking CTA → `ButtonLink` (next/link) with `?lawyer=` prefill kept; amber booking-notice retokenized to `kmt-warning` state tokens.
- [ ] T13.5 Verify AR: name/credentials RTL layout, badges, `dir="ltr"` isolation for emails.

## Verify

- [ ] Screenshots 375/1440 × EN/AR × themes.
- [ ] Booking prefill e2e: CTA from team detail carries `?lawyer=` into chat.
