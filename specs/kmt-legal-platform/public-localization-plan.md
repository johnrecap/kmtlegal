# PLAN-29 Public Localization

## Status
Implemented on 2026-06-27.

PLAN-29 now changes public runtime behavior: existing public routes are English/LTR by default, Arabic public routes live under `/ar`, protected routes remain Arabic/RTL, and Article/CaseStudy public content is locale-aware.

## Goal
Make the public website English-primary while keeping Arabic available as an optional `/ar` public experience. PLAN-29 is public-only: it must not localize or redesign admin, portal, install, login, product-system, Stitch clone, or internal staff workflows.

## Existing System Changed
- `src/lib/public-locale.ts`: defines the public locale contract, `/ar` prefix handling, localized links, alternates, and protected-route RTL behavior.
- `src/app/layout.tsx`: sets document `lang`/`dir` from the request path.
- `src/app/globals.css`: removes forced global RTL and scopes direction/font rules to `html[dir]`.
- `src/content/public-content.en.ts` and `src/content/public-content.ar.ts`: hold typed public dictionaries behind `public-content.ts`.
- `src/features/public-site/public-pages.tsx`: centralizes public route renderers and metadata for both locales.
- `src/app/ar/[[...path]]/page.tsx`: provides Arabic route wrappers for the supported public pages.
- `prisma/schema.prisma` and migration `20260627090000_plan_29_public_localization`: add Article/CaseStudy locale storage, indexes, and `(locale, slug)` uniqueness.
- `src/server/public/content-service.ts`: filters published Article/CaseStudy list/detail queries by locale and keeps anonymization safety rules.
- Public APIs, contact/booking forms, booking AI disclaimer, and API errors now accept/use the active public locale.
- Admin content forms expose Article/CaseStudy locale fields without translating the admin UI.
- `src/app/sitemap.ts`: emits English and Arabic public entries with language alternates.

## Scope
### In Scope
- Public website routes:
  - `/`
  - `/services`
  - `/services/[slug]`
  - `/team`
  - `/team/[slug]`
  - `/articles`
  - `/articles/[slug]`
  - `/case-studies`
  - `/case-studies/[slug]`
  - `/media`
  - `/contact`
  - `/book-consultation`
  - `/privacy`
  - `/terms`
- Arabic equivalents under `/ar`.
- Public navigation, footer, CTAs, labels, metadata, empty/error/success states, and accessible text.
- Public Article and CaseStudy locale storage, filtering, and slug lookup.
- Public SEO alternates, canonical URLs, and link crawl coverage.

### Out Of Scope
- Admin, portal, install, login, product-system, and Stitch clone localization.
- A new i18n framework or `next-intl`.
- Translated or locale-specific slugs.
- Machine translation or automatic legal copy rewriting.
- Email, notification, AI, invoice, PDF, or protected workflow localization.
- Service/lawyer DB localization unless a later plan moves those currently static public surfaces into localized content storage.

## Key Decisions
- English is the default public locale. Existing public routes without a locale prefix serve English.
- Arabic is optional and lives under `/ar`.
- Slugs remain unchanged across locales. Do not translate path segments or content slugs.
- Do not add `next-intl`; use the existing lightweight public locale helper pattern or a narrow extension of it.
- `Article` and `CaseStudy` need an explicit required locale of `en` or `ar`.
- Allow the same slug value in different locales by moving Article/CaseStudy uniqueness to `(locale, slug)`.
- Backfill existing Arabic Article/CaseStudy rows as `ar`; add English content explicitly. Do not label Arabic content as English.
- Public list/detail queries must filter by locale, publication status, and existing safety rules.
- Public APIs should keep response shape stable; locale may be inferred from route context or an explicit public-safe query parameter.

## Feature Slice Map
| Layer | PLAN-29 Decision | Impact |
| --- | --- | --- |
| Public routing | English default routes plus `/ar` Arabic prefix | Public visitors land on English by default; Arabic remains reachable. |
| Public locale helper | Reuse/extend lightweight helpers; no `next-intl` | Avoids package churn and broad app-router rewrites. |
| Public UI copy | Localize public labels, CTAs, states, metadata, alt text | User-facing public text becomes locale-aware. |
| Article data | Add `locale`, filter list/detail by locale and slug | Prevents Arabic content from appearing on English pages. |
| CaseStudy data | Add `locale`, filter by locale, slug, anonymization, status | Keeps case-study safety rules while supporting localized content. |
| Slugs | Preserve existing lowercase kebab-case values | Existing links and SEO paths remain stable. |
| Protected surfaces | No localization changes | Admin/portal behavior and Arabic-first internal surfaces remain stable. |
| Tests | Add public locale, slug, DB locale, and no-framework guards | Prevents route drift, mixed-language leakage, and dependency creep. |
| Docs/status | Track PLAN-29 in Spec Kit and implementation status | Future agents can implement without expanding scope. |

## Implementation Outcome
- Public default: `/`, `/services`, `/contact`, `/book-consultation`, and the rest of the supported public routes render English/LTR.
- Arabic optional: `/ar`, `/ar/services`, `/ar/contact`, `/ar/book-consultation`, and supported detail/list routes render Arabic/RTL.
- Protected surfaces: `/admin`, `/portal`, `/install`, `/login`, `/product-system`, and `/stitch-clone/*` remain Arabic/RTL.
- Static public content is localized through typed dictionaries instead of ad hoc hardcoded route copy.
- Public route files reuse shared locale-aware renderers rather than duplicating page logic.
- Article and CaseStudy use explicit locale storage and public queries never intentionally fall back to the wrong locale.
- Slugs and route segments remain stable; Arabic uses the same slug strings with only the `/ar` prefix.
- `next-intl` was not added.

## Implementation Phases
### Phase 0 - Spec Kit Docs
Deliverables:
- `public-localization-plan.md`.
- PLAN-29 tasks, quality gate, frontend notes, test plan, and status row.

Acceptance:
- PLAN-29 is visible without touching production code.
- Scope states public-only, English-primary, optional `/ar`, DB locale for Article/CaseStudy, no `next-intl`, and unchanged slugs.

### Phase 1 - Public Locale Routing
Deliverables:
- English default public route handling.
- `/ar` route handling for the same public route set.
- Locale-aware `lang`, `dir`, canonical, and alternate URLs.

Acceptance:
- `/services/corporate-law` and `/ar/services/corporate-law` use the same slug string.
- Protected routes are not prefixed, redirected, or localized by PLAN-29.

### Phase 2 - Public Text And Metadata
Deliverables:
- English public navigation, footer, labels, CTAs, states, SEO metadata, and accessibility text.
- Arabic `/ar` equivalents where approved content exists.
- Locale-aware language links that do not point to missing detail content.

Acceptance:
- English default pages do not show Arabic public UI text except brand names, legal references, or intentionally untranslated values.
- Arabic `/ar` pages render RTL and do not clip or overflow.

### Phase 3 - Article And CaseStudy Locale Data
Deliverables:
- Article/CaseStudy required locale field.
- Migration/backfill that marks existing Arabic rows as `ar`.
- Composite uniqueness for `(locale, slug)` and locale-aware indexes.
- Public list/detail services filter by locale and existing published/anonymized rules.

Acceptance:
- English and Arabic content can share the same slug string in different locale rows.
- Missing localized Article/CaseStudy detail content returns the normal not-found/empty-safe behavior, not fallback content in the wrong language.

### Phase 4 - Verification And Handoff
Deliverables:
- Typecheck, lint, tests, build.
- Public English and `/ar` smoke.
- Public link crawl and slug stability checks.
- Protected-surface drift spot checks.
- Status docs updated after implementation.

Acceptance:
- No `next-intl` dependency/config/import appears.
- Slugs are unchanged.
- Public-only scope is preserved.
- Verification status is documented before PLAN-29 is marked done.

## Verification Matrix
| Check | Method | Required Before Done |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Yes |
| Lint | `npm run lint` | Yes |
| Unit/component tests | `npm run test` | Yes |
| Production build | `npm run build` | Yes |
| Public locale smoke | English default and `/ar` public route render tests | Yes |
| Public link crawl | Existing public slugs plus `/ar` equivalents | Yes |
| DB locale filters | Article/CaseStudy list/detail tests for `en` and `ar` | Yes |
| No framework creep | Search for `next-intl` dependency/config/import | Yes |
| Protected drift | Spot-check admin, portal, install, login, product-system, Stitch clone | Yes |
| Accessibility/RTL | `lang`, `dir`, focus, labels, mobile overflow | Yes |

## Verification Evidence
- Passed: `cmd /c npm run typecheck`.
- Passed: `cmd /c npm run lint`.
- Passed: `cmd /c npm run test` (`29` files, `143` tests).
- Passed: `$env:ALLOW_BUILD_WITHOUT_DATABASE_URL='true'; cmd /c npm run build`.
- Passed: `cmd /c npm run test:e2e:smoke` (`41` Playwright tests).
- Passed: `cmd /c node scripts/run-playwright-with-server.mjs tests/e2e/public-luxury-visual.spec.ts` (`13` Playwright tests).
- Passed: `cmd /c node scripts/run-playwright-with-server.mjs tests/e2e/booking-stepper-validation.spec.ts` (`1` Playwright test).
- Passed: `rg -n "next-intl" package.json package-lock.json src tests prisma` returned no matches.
- Note: plain `cmd /c npm run build` without `DATABASE_URL` still hits the project-wide production database guard; the documented local build override is required when no DB URL is configured.

## Definition Of Done
PLAN-29 is done only when:
- Public English is the default experience on existing public routes.
- Arabic is available only through `/ar` public routes where approved content exists.
- Admin, portal, install, login, product-system, Stitch clone, and internal staff workflows are unchanged.
- Article and CaseStudy store and query locale explicitly.
- Existing slug strings remain stable and are not translated.
- `next-intl` is not added.
- Public text, metadata, accessible labels, and route alternates are verified.
- All verification checks pass or blocked checks are documented.
