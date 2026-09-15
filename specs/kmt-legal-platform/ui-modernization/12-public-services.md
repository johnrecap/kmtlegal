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

- [x] [P0] Badge chips render white pills on the detail page (`public-pages.tsx:382,390`; `directory-filter.tsx:144`) — fixed by T1.3, verify here.
- [x] [P1] No `<h1>` on service detail (`public-pages.tsx:370-374` — `PublicSection` defaults h2).
- [x] [P1] Active filter chip `border-kmt-gold bg-kmt-gold text-white` fails AA (`directory-filter.tsx:81`). *(already fixed to `text-primary-foreground` in the glow pass; verified live: gold `#997b44` bg + `rgb(26,20,9)` text)*
- [x] [P2] LCP: compact PageHero images lazy-loaded (`public-components.tsx:104`, all list pages).
- [x] [P2] 4px corners vs 28px booking-flow corners (two-skins). *(cards use `rounded-lg` = Phase-0 ramp tier; booking-flow skins are reconciled in file 18)*
- [x] [P3] No breadcrumbs; back nav is bottom-of-page button only (`public-pages.tsx:404`).

## Tasks

- [x] T12.1 List page: PageHero `priority` on compact heroes (or `fetchPriority="high"`); card grid on new radius ramp; active filter chip = gold bg + dark text (AA). *(PageHero now `priority` + `fetchPriority="high"` — Next auto-lowercases for React 18.2; hero img verified `fetchpriority="high"`, eager, no lazy. Cards on `rounded-lg` ramp tier. Active chip gold + `text-primary-foreground` verified in-browser)*
- [x] T12.2 Detail page: add `headingLevel="h1"`; breadcrumbs (Services › category › title) with structured data; DetailCta becomes sticky glass card with token styling. *(new `PublicBreadcrumbs` component + `breadcrumbs` slot on `PublicSection`; JSON-LD `BreadcrumbList` script; DetailCta `lg:sticky lg:top-24 lg:self-start` + `backdrop-blur-md` + panel tokens — sticks at 96px mid-scroll, verified)*
- [x] T12.3 Detail content: "Services included / Documents / Expected outputs" as tokenized chip groups (Badge T1.3) — verify dark + light. *(shared `publicGoldChip` token class on detail Badges + directory card chips; light theme verified: dark text `rgb(28,24,18)` on light surfaces)*
- [x] T12.4 Card hover: interactive depth (translateY + shadow token, 150ms); icon halo kept; reduced-motion: no transform. *(hover = `translateY(-3px)` via kmt-motion-card-beam + `hover:[box-shadow:var(--kmt-public-panel-shadow)]` — NB `hover:shadow-[var(...)]` compiles as shadow-COLOR, must use arbitrary-property syntax; 150ms transition; reduced-motion verified transform:none + shadow:none. Halo = transform jiggle only since the site-wide glow removal, see file 11 addendum)*
- [x] T12.5 Migrate CTAs to `ButtonLink` (next/link) — kills full-page reload from cards and DetailCta. *(already ButtonLink; card + back-button hover text fixed to AA `text-primary-foreground` instead of white-on-gold)*
- [x] T12.6 Verify AR: category chips, search normalization (see T18.6 shared helper), `dir` isolation on counts. *(new shared `src/lib/normalize-text.ts` — T18.6's helper created early; Arabic folding: alef variants, ة→ه, ى/ئ→ي, ؤ→و, diacritics, tatweel, zero-width marks; verified live: "قانونيه" matches قانونية content; card meta counts wrapped in `<bdi>`)*

Additional changes:
- DirectoryFilter fully retokenized (was hardcoded dark gradient + amber text): filter bar / control / inactive chips / clear buttons / cards / empty state all use `--kmt-public-*` tokens + `--state-danger` for errors — works in both themes (light verified). Benefits team/articles/case-studies/media lists too.
- `chevron_left`/`chevron_right` icons added to the MaterialSymbol set (breadcrumb separator; mirrored `rtl:rotate-180` in AR — verified).
- e2e `expectDarkLuxurySurface` gained a `public-tokens` style branch for directory surfaces (legacy-gradient assertions kept for contact/booking until files 17/18).
- Unit tests: +5 normalizeText, +1 service-detail (h1/breadcrumb/JSON-LD/sticky); compact-hero test now asserts eager loading.

## Verify

- [x] Screenshots 375/1440 × EN/AR × themes; Lighthouse LCP check on `/services`. *(375+1440 EN/AR dark + light captured; LCP: hero img `fetchpriority="high"`, eager, preload link present; pixel-diff: services 0.44–0.69%, home 0.77–5.68% = entrance-animation timing, contact ≤0.34%, no blank pages)*
- [x] Keyboard: chip filter cycle, card link focus, breadcrumb navigation. *(chip buttons focus-visible gold outline; breadcrumb link focus ring; keyboard cycle covered by DOM probes + focus styles)*
- [x] Smoke e2e green. *(46/46 after dev-server restart — earlier failures were recompile contention; unit 554 passed; zero console errors EN/AR/light)*
