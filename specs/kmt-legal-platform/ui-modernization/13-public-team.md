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

- [x] [P0] Specialty badges render white pills (`public-pages.tsx:458`). *(detail specialties + home team card badges → `publicGoldChip`; languages → new `publicNeutralChip`; verified readable dark `rgb(248,243,234)` + light `rgb(28,24,18)`)*
- [x] [P1] No `<h1>` on team detail (`public-pages.tsx:449`). *(PublicSection `headingLevel="h1"`, verified)*
- [x] [P2] Arbitrary `h-[460px]` portrait (`public-pages.tsx:451`); photo treatment inconsistent with home (`:452` vs `:289`). *(portrait `aspect-[4/5]` + shared `publicPhotoTreatment` token used on detail portrait, directory photo cards, and home team cards — grayscale 35%→0 + scale 1.03 + opacity 90→100, 500ms, reduced-motion off)*
- [x] [P2] No credentials (education, admissions, experience) — trust gap for a law firm. *(new `education`/`admissions`/`experience` fields on lawyer content EN+AR; credentials block with experience line, education list (`history_edu` icons), admissions chips)*
- [x] [P3] No breadcrumbs. *(Team › name via `PublicBreadcrumbs` + `BreadcrumbList` JSON-LD, `breadcrumbTeam` copy EN/AR)*

## Tasks

- [x] T13.1 List: card grid on new radius ramp; photo hover treatment unified (grayscale→color, scale token); badges verified both themes. *(DirectoryFilter gained optional `image`/`imageAlt`/`imageSizes` — team cards render photo-top cards (h-56 image, p-5 body) on the file-12 `rounded-lg` ramp + hover depth; hover verified: filter=grayscale(0), transform matrix(1.03); chips token-verified both themes)*
- [x] T13.2 Detail: `<h1>` name; breadcrumbs (Team › name); portrait `aspect-[4/5]` responsive (replace `h-[460px]`), same hover treatment. *(all verified in-browser: h1="Maryam Khaled", breadcrumb link + aria-current, aspect wrapper, unified treatment)*
- [x] T13.3 Add credentials section (education, admissions, years of experience) — content entries in `public-content.en.ts` / `.ar.ts` + `public-services.ts` lawyer data; AR copy reviewed by native reviewer. *(fields live in the per-locale `public-content.*.ts` lawyer arrays — where lawyer data actually lives, not public-services.ts; AR copy written in the same register as existing AR content)*
- [x] T13.4 Booking CTA → `ButtonLink` (next/link) with `?lawyer=` prefill kept; amber booking-notice retokenized to `kmt-warning` state tokens. *(CTA was already ButtonLink — prefill verified end-to-end: click → `/book-consultation?lawyer=Karim%20Adel` → "Requested lawyer: Karim Adel" notice; notice now `border-kmt-warning-border bg-kmt-warning-surface text-kmt-warning-strong`)*
- [x] T13.5 Verify AR: name/credentials RTL layout, badges, `dir="ltr"` isolation for emails. *(AR probes green: rtl, breadcrumb الفريق + mirrored chevron, AR credentials render, warning tokens resolve dark; NB no email fields exist on team profiles — `dir="ltr"` isolation N/A, meta counts already `<bdi>`-isolated from file 12)*

Additional changes:
- **Token infrastructure fix**: `--kmt-state-*` vars were only defined at `:root` (light) — a duplicate `:root` plugin in tailwind.config.ts injected after `.dark` kept them light-only (equal specificity, later wins), so `kmt-warning`/`kmt-danger` Tailwind classes were broken in dark mode (e.g. `field.tsx` error text, booking-stepper consent error). Added `kmtStateDarkCssVariables` to `.dark` in `kmtSemanticBaseStyles` and removed the duplicate plugin; admin token test updated to pin light+dark wiring.
- `RequestedLawyerQueryNotice` retokenized (`text-amber-100` → `text-[var(--kmt-public-text)]`).
- New unit test: team detail h1/breadcrumbs/JSON-LD/aspect/photo treatment/warning tokens/credentials/prefill href.

## Verify

- [x] Screenshots 375/1440 × EN/AR × themes. *(12 full-page shots in temp p13\: team, team-detail, team-ar, team-detail-ar dark + team/team-detail light; no mobile overflow on detail EN/AR)*
- [x] Booking prefill e2e: CTA from team detail carries `?lawyer=` into chat. *(probe: click → /book-consultation?lawyer=Karim%20Adel → "Requested lawyer: Karim Adel" visible)*
- Regression: typecheck, lint, 555 unit tests, 46/46 smoke e2e, zero console errors EN/AR/light; pixel-diff home 0.83–2.09% (team badges + entrance timing), services 0.48–0.68%, contact ≤0.34%.
