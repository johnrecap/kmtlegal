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

- [x] [P0] Category badges render white pills (`public-pages.tsx:592`, `directory-filter.tsx:144`). *(resolved by the file-12 DirectoryFilter retokenization — category badges are `publicGoldChip` on the token card ramp; readability re-verified in light + dark this file)*
- [x] [P1] No `<h1>` on detail (`public-pages.tsx:589`). *(PublicSection `headingLevel="h1"`, verified in-browser)*
- [x] [P2] List hero image identical to home Focus Area image (`public-pages.tsx:555` vs `:251`). *(list hero → previously-unused `/stitch-assets/927e808522dfd86d.png` — scales-of-justice architectural abstract from the Stitch export; home Focus Area keeps `2484f68d86633ca8.png`; luxury-visual e2e object-position expectation updated 60% → 50%)*
- [x] [P3] No breadcrumbs; "Anonymous" meta on every card is repetitive. *(detail: Case Studies › title breadcrumbs + JSON-LD; cards: meta is now a locale-formatted year (`2026` / `٢٠٢٦`, bdi-isolated) beside the category badge — `anonymousMeta` copy key removed EN+AR; the anonymization note stays once in the section intro)*

## Tasks

- [x] T14.1 List: distinct hero image; card grid on radius ramp; badges verified both themes; meta line refined (category + year instead of repeated "Anonymous", keep anonymization note once in section intro). *(card row = category gold chip + year meta; chips verified dark `rgb(248,243,234)` and light `rgb(28,24,18)`; cards ride the file-12 DirectoryFilter token ramp)*
- [x] T14.2 Detail: `<h1>`; breadcrumbs; Challenge/Approach/Outcome/Lessons as numbered scroll-reveal blocks (stagger 60ms, reduced-motion: static); cross-locale alternate links kept. *(numbered `01`–`04` gold `tabular-nums` markers, hairline-separated blocks in `Reveal` wrappers — delay 0/60/120/180ms verified on block 04 (`transition-delay: 180ms`), below-fold block starts `opacity-0 translate-y-6` and reveals on scroll, reduced-motion keeps everything visible; language-switch href `/ar/case-studies/anonymous-commercial-dispute` verified both directions + click-through)*
- [x] T14.3 DetailCta + back button migrated to new Button/ButtonLink. *(DetailCta already the shared modern component; back button was already ButtonLink — hardcoded amber overrides retokenized to `!text-[var(--kmt-public-text)] hover:!bg-kmt-gold hover:!text-primary-foreground`)*
- [x] T14.4 Verify AR direction, badge tokens, disclaimer styling in both themes. *(AR: rtl, breadcrumb دراسات الحالة, AR block titles, Arabic date chip `٢٠٢٦`; disclaimer `kmt-warning` tokens dark `rgb(47,37,9)`/`rgb(247,226,171)` + light `rgb(255,251,235)`/`rgb(120,53,15)`; zero console errors EN/AR/light)*

Additional changes:
- Detail gained a published-date chip (`publicNeutralChip`, `formatPublicPolicyDate` per locale) and the disclaimer moved from hardcoded amber to `kmt-warning` state tokens (theme-aware via the file-13 `--kmt-state-*` dark swap).
- `formatPublicYear` helper (Intl, `ar-EG`/`en-US`, UTC) for list card year meta.
- New unit test file `tests/ui/public-case-studies.test.tsx` (3 tests) mocking `@/server/public/content-service` + setting `DATABASE_URL` so the DB-backed views render fixtures.
- Verification methodology for the DB-backed pages: local 5432 Postgres rejects the `.env` credentials (the known dev-server auth noise), so a scratch Postgres 18 was initialized on port 5433 (trust auth, temp data dir), migrations + full seed applied, an EN twin of the seeded AR case study inserted (same slug → alternate links both ways), dev server pointed there via gitignored `.env.local`, then everything torn down before the no-DB-content smoke run.

## Verify

- [x] Screenshots 375/1440 × EN/AR × themes. *(12 full-page shots with DB-backed content: case-studies + case-study-detail, EN/AR dark + EN light; zero horizontal overflow on every page/viewport)*
- [x] Locale switch on detail keeps slug mapping. *(probe click-through `/case-studies/anonymous-commercial-dispute` → `/ar/case-studies/anonymous-commercial-dispute`, AR h1 renders)*
- [x] Smoke e2e green. *(46/46; plus typecheck, lint, 558 unit tests, 34/34 browser probes, pixel-diff home 0.75–2.41% entrance-animation timing / services 0.44–0.69% / contact ≤0.27%)*
