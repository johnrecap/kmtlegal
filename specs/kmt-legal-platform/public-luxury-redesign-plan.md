# PLAN-28 Public Luxury Redesign

## Status
Planned. Implementation has not started.

## Goal
Redesign the public KMT Legal website to match the uploaded dark luxury legal reference direction while keeping the dashboard, admin, portal, product system, and Stitch clone untouched.

## Reference Direction
The reference image establishes the desired public-site mood:
- Dark executive legal environment.
- Restrained gold accents.
- Cinematic hero image.
- Premium law-firm navigation.
- Practice-area card grid.
- Focus-area legal expertise panel.
- Process steps.
- Representative matters and insights.
- Strong consultation CTA and rich footer.

This is a direction and hierarchy reference, not a logo or layout copy target.

## Existing System Checked
- `src/app/page.tsx`: current homepage composition.
- `src/components/layout/public-shell.tsx`: public header, mobile nav, footer.
- `src/features/public-site/public-components.tsx`: `PageHero`, `PublicSection`, `TrustStrip`, `DetailCta`.
- `src/features/public-site/directory-filter.tsx`: public listing search/filter/cards.
- `src/features/public-site/contact-form.tsx`: public contact form states.
- `src/features/public-site/booking-stepper.tsx`: booking flow, validation, analytics, API submission.
- `src/content/public-content.ts`: public nav, service, lawyer, branch, article, case-study, media seed content.
- `tailwind.config.ts` and `src/app/globals.css`: existing tokens, fonts, RTL, focus behavior.
- `src/components/ui/*`: shared UI primitives that must not be globally restyled for this plan.
- `tests/ui/public-pages.test.tsx` and `tests/e2e/mvp-smoke.spec.ts`: existing public smoke coverage.

## Scope
### In Scope
- Public routes:
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
- Public-only visual system and components.
- Arabic-first public navigation and copy.
- Public SEO metadata and public empty states.
- Public mobile and desktop visual QA.

### Out Of Scope
- Admin dashboard redesign.
- Client portal redesign.
- Product system redesign.
- Shared `src/components/ui/*` default restyling.
- Global body/theme changes that affect protected routes.
- Stitch clone changes.
- Full English localization toggle.
- Backend schema/API contract changes unless a public UI bug requires a safe adapter.

## Key Decisions
- Keep Arabic as the primary public experience.
- Do not show `EN` until full English content, metadata, routes, form labels, emails, and errors exist.
- Public label should use `مجالات الخبرة` while keeping `/services` as the route.
- Redesign is public-scoped. Add public-specific wrappers/classes or additive tokens only.
- Do not mutate existing `kmt` token meanings if admin/portal/product-system depend on them.
- Keep booking/contact API behavior, validation, analytics, disabled/loading/success/error states, and request IDs intact.

## Feature Slice Map
| Layer | Current Surface | PLAN-28 Decision | Impact |
| --- | --- | --- | --- |
| Public UI shell | `PublicShell` | Extend to dark luxury header/footer | Public pages gain the new brand frame; protected shells stay unchanged. |
| Public components | `PageHero`, `PublicSection`, `TrustStrip`, `DetailCta` | Redesign as public-only cinematic sections | Most public pages inherit the new style with minimal route edits. |
| Homepage | `src/app/page.tsx` | Recompose into hero, practice areas, focus area, process, matters, insights, CTA | Biggest conversion and visual trust improvement. |
| Public content | `public-content.ts` | Add display labels, practice-area grouping, representative matters, office/footer data | Better IA and reusable Arabic copy; avoid scattered hardcoded strings. |
| Listings | `DirectoryFilter` | Dark search/filter/listing treatment | Services/team/articles/case studies become visually coherent. |
| Forms | `BookingStepper`, `ContactForm` | Keep readable form surfaces inside dark public theme | Preserves conversion while matching brand. |
| Data/API | Public route handlers and server services | Reuse existing contracts | No backend scope creep. |
| Auth/permissions | Public-only pages | No protected behavior changes | No admin/portal regression. |
| Analytics | Existing public booking/contact events | Preserve event names/properties | Measurement continuity. |
| QA | Existing tests and Playwright | Add mobile/desktop visual smoke for public routes | Prevent RTL overflow and broken public navigation. |
| Docs | Spec Kit and status docs | Track PLAN-28 tasks and gates | Future agents can execute without guessing. |

## Change And Impact Ledger
| ID | Change | Files Likely Touched | User Impact | System Impact | Required Verification |
| --- | --- | --- | --- | --- | --- |
| P28-C01 | Freeze redesign boundary and reference rules | `public-luxury-redesign-plan.md`, `tasks.md` | Clear expectation: public site only. | Prevents dashboard/admin drift. | Review scope against route list. |
| P28-C02 | Add public-only visual contract | `public-components.tsx`, optional additive Tailwind tokens or scoped CSS variables | Dark premium legal look. | Avoids global token mutations. | Typecheck, visual screenshots. |
| P28-C03 | Redesign public header | `public-shell.tsx`, `public-content.ts` | Clearer nav, stronger consultation CTA. | Public nav labels update; routes remain stable. | Desktop/mobile nav smoke, keyboard focus. |
| P28-C04 | Redesign public footer | `public-shell.tsx`, `public-content.ts` | More credible offices/contact/practice-area footer. | Requires stable branch/contact content. | Link crawl, responsive footer screenshot. |
| P28-C05 | Redesign hero component | `public-components.tsx` | Cinematic first impression. | Every route using `PageHero` changes visually. | Hero text contrast and mobile crop. |
| P28-C06 | Rebuild homepage structure | `src/app/page.tsx`, `public-components.tsx`, `public-content.ts` | Homepage matches reference hierarchy. | Uses existing DB-backed featured content safely. | Homepage screenshot, no broken links. |
| P28-C07 | Expand practice areas to full matrix | `public-content.ts`, `page.tsx`, services pages | Users see breadth like the reference. | Slugs and booking category mapping must stay stable. | Service links, booking prefill check. |
| P28-C08 | Add focus-area panel | `page.tsx`, `public-components.tsx` | Explains a priority legal area in depth. | Pure public UI/content. | Mobile/desktop layout check. |
| P28-C09 | Add process section | `page.tsx`, `public-components.tsx` | Users understand consultation flow. | Copy must avoid outcome guarantees. | Legal copy review, RTL icon direction. |
| P28-C10 | Add representative matters section | `page.tsx`, `public-content.ts` | Adds proof without exposing clients. | Must remain anonymized and disclaimer-safe. | Link/status check, privacy review. |
| P28-C11 | Redesign services index/detail | `src/app/services/*`, `DirectoryFilter`, `DetailCta` | Premium service discovery. | Existing route slugs stay stable. | Search/filter, detail CTA, not-found. |
| P28-C12 | Redesign team pages | `src/app/team/*`, `DirectoryFilter` | More credible lawyer browsing. | Uses existing lawyer content. | Image alt text, mobile cards. |
| P28-C13 | Redesign articles/case studies/media | `src/app/articles/*`, `src/app/case-studies/*`, `src/app/media/page.tsx` | Editorial legal publication feel. | DB-backed empty states must not create dead links. | DB-empty render and link crawl. |
| P28-C14 | Redesign booking page shell | `book-consultation/page.tsx`, `BookingStepper` | Booking feels premium but still readable. | API payload and analytics preserved. | Form validation, success/error, request ID. |
| P28-C15 | Redesign contact page shell | `contact/page.tsx`, `ContactForm` | General inquiry flow becomes consistent. | API payload and duplicate-submit guard preserved. | Success reset, error state, branch cards. |
| P28-C16 | Restyle privacy/terms public pages | `privacy/page.tsx`, `terms/page.tsx` | Legal pages no longer look detached. | Content unchanged unless approved. | Heading hierarchy and readability. |
| P28-C17 | Public imagery pass | `public/stitch-assets` usage or new approved assets | Better mood and trust. | No real client data in images/alt text. | Asset status, alt text, crop checks. |
| P28-C18 | Public metadata/copy pass | route metadata, `public-content.ts` | Better SEO and Arabic consistency. | No EN toggle until full localization. | Metadata smoke, hardcoded-text review. |
| P28-C19 | Public visual regression evidence | `tests/e2e`, screenshot scripts or artifact paths | Proof the redesign works. | Adds repeatable QA coverage. | Desktop 1440px, mobile 390px, console/network. |
| P28-C20 | Update docs and release handoff | Spec Kit docs, implementation status | Execution is trackable. | Keeps PLAN-28 visible after handoff. | Diff review and final checklist. |

## Implementation Phases
### Phase 0 - Plan And Boundary
Deliverables:
- PLAN-28 plan artifact.
- `tasks.md` milestone.
- Quality gate.
- Status doc update.

Acceptance:
- Every public route and excluded protected route is named.
- Every planned change has an impact and verification note.

### Phase 1 - Public Visual Contract
Deliverables:
- Public-only dark/gold token contract.
- Header/footer layout direction.
- Shared public section variants.
- Asset inventory and selected hero/section imagery.

Acceptance:
- No admin, portal, product-system, Stitch, or global UI primitive visual regression.
- Focus state, contrast, and RTL rules are defined before route work.

### Phase 2 - Public Shell And Homepage
Deliverables:
- Dark premium `PublicShell`.
- New `PageHero`, `PublicSection`, `TrustStrip`, `DetailCta` variants.
- Homepage built in this order:
  1. Hero.
  2. Trust strip.
  3. Practice-area matrix.
  4. Featured focus area.
  5. Process.
  6. Industries.
  7. Representative matters.
  8. Insights.
  9. Final CTA.

Acceptance:
- Homepage visually matches the reference direction.
- Public CTA is visible above the fold.
- No public homepage link returns 404.
- No legal outcome promise appears in copy.

### Phase 3 - Public Route Rollout
Deliverables:
- `/services` and `/services/[slug]`.
- `/team` and `/team/[slug]`.
- `/articles`, `/articles/[slug]`, `/case-studies`, `/case-studies/[slug]`, `/media`.
- `/contact`, `/book-consultation`, `/privacy`, `/terms`.

Acceptance:
- Each route has the new public shell.
- Listing pages have dark themed search/filter/cards.
- Detail pages have premium CTA blocks.
- DB-empty content pages render an empty-safe state.
- Forms remain readable and usable.

### Phase 4 - Content, Localization, SEO
Deliverables:
- Arabic-first nav labels and public labels.
- Stable display labels for categories.
- Representative matters with anonymized, non-identifying details.
- Public SEO metadata aligned with updated labels.
- No visible `EN` toggle.

Acceptance:
- User-facing Arabic copy is natural and consistent.
- Mixed Arabic/English values, phones, emails, and references are readable.
- Public content does not expose client data or guarantee legal outcomes.

### Phase 5 - Verification And Evidence
Deliverables:
- Typecheck, lint, tests, build.
- Playwright smoke for `/`, `/services`, `/contact`, `/book-consultation`.
- Link crawl for public internal links.
- Screenshot evidence at desktop `1440x900` and mobile `390x844`.
- Console/network review.
- Design polish pass.

Acceptance:
- No horizontal page overflow at 390px.
- No console errors from public routes.
- No broken public internal links.
- Keyboard focus is visible on dark surfaces.
- CTA, forms, filters, empty states, success states, and errors are verified.

### Phase 6 - Commit, Push, Server Handoff
Deliverables:
- Final docs updated.
- Commit on `main`.
- Push to `origin/main`.
- Server handoff commands after push.

Acceptance:
- Repository is clean except intentionally untracked local artifacts.
- Required verification status is documented.
- Deployment handoff names:
  - `cd /www/wwwroot/kmtlegal`
  - `bash deploy/install/aapanel-pm2-update.sh`

## Public Design Contract
### Colors
- Canvas: near black charcoal.
- Surface: slightly lifted dark charcoal.
- Border: low-opacity gold and low-opacity white.
- Accent: warm legal gold.
- Text primary: warm off-white.
- Text secondary: muted warm gray.
- Status colors stay semantic, not gold.

### Typography
- Keep `IBM Plex Sans Arabic` for Arabic body/UI.
- Use stronger editorial scale for public hero and section headings.
- Avoid viewport-scaled font sizes.
- Avoid negative letter spacing for Arabic headings.

### Shapes And Depth
- Radius remains sharp to moderate: 4px to 8px.
- Use thin borders and subtle depth, not heavy shadows.
- Avoid nested UI cards.
- Use cards for repeated items only.

### Imagery
- Use dark legal-office, boardroom, library, contract, court, or executive city-view imagery.
- Do not use real client documents or identifiable client data.
- Meaningful images require Arabic alt text.
- Decorative hero overlays can remain empty alt text.

### Motion
- Keep animation minimal.
- Respect `prefers-reduced-motion`.
- Do not add a new animation library for PLAN-28.

## Risks And Controls
| Risk | Control |
| --- | --- |
| Protected dashboards accidentally inherit dark public styling | Keep all changes inside public shell/components or additive scoped tokens. |
| Arabic text clips or overflows | Mobile screenshots, line-height review, no fixed narrow text containers. |
| Gold-on-dark contrast is too low | Contrast review and focus-state checks. |
| Public copy implies guaranteed results | Legal copy pass and no-outcome wording. |
| DB-empty article/case pages create broken cards | Empty-safe rendering and link crawl. |
| Booking/contact regressions | Preserve API payloads, validation, analytics, success/error states. |
| EN toggle becomes misleading | Hide until full localization exists. |
| New assets feel generic or expose data | Asset inventory and privacy review. |

## Verification Matrix
| Check | Command / Method | Required Before Done |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Yes |
| Lint | `npm run lint` | Yes |
| Unit/component tests | `npm run test` | Yes |
| Production build | `npm run build` | Yes |
| Public smoke | `npm run test:e2e:smoke` plus focused public routes if needed | Yes |
| Public link crawl | Playwright public internal link crawl | Yes |
| Desktop screenshots | 1440x900 `/`, `/services`, `/contact`, `/book-consultation` | Yes |
| Mobile screenshots | 390x844 `/`, `/services`, `/contact`, `/book-consultation` | Yes |
| Form states | Booking/contact validation, success, error, disabled/loading | Yes |
| Accessibility/RTL | Keyboard focus, headings, labels, icons, overflow | Yes |
| Protected-route drift | Spot-check `/admin`, `/portal`, `/product-system` visual boundary | Yes |

## Definition Of Done
PLAN-28 is done only when:
- Every in-scope public route uses the new public visual language.
- Public pages match the dark luxury legal direction without copying the reference logo.
- Dashboard/admin/portal/product-system/Stitch routes are unchanged except for unrelated existing behavior.
- Booking and contact flows still submit through existing APIs.
- Public Arabic copy is consistent, readable, and does not promise legal outcomes.
- No visible `EN` toggle exists before complete English localization.
- All verification checks in the matrix pass or are explicitly documented as blocked.
- Screenshot/link-crawl evidence is archived.
- Docs, tasks, status, commit, push, and aaPanel PM2 handoff are complete.

