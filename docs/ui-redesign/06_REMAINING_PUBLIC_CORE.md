# Phase 06 — Remaining Public Core

## Objective

Bring Contact, Privacy, Terms, Client Account Setup, Payment Return, Payment
Receipt, Login, and Install onto the locked components (Stateful Button,
Accordion, Scroll Progress) with full theming. Phase 06 additionally owns
the public-surface execution of the FINAL Phase 01 rulings: Articles HIDE
PUBLIC, Case Studies HIDE PUBLIC, Media DELETE (backend/admin article and
case-study systems preserved; social-draft/admin functionality preserved).

## Current State

- Contact (`ContactPageView`, `public-pages.tsx:880`): `PageHero` + grid;
  `ContactForm` (`contact-form.tsx:42`) with `ShimmerButton` submit;
  branch `publicPanel` asides + WhatsApp panel (`ButtonLink` external).
- Privacy/Terms (`:982`, `:1061`): `PublicSection` h1 + `lg:[260px_1fr]`
  sticky `PolicyToc` aside + long-form article; local `ReadingProgress`
  bar on article detail only (policy pages have no progress bar today).
- Setup (`client-account-setup-page.tsx:22` + `-form.tsx:40`): status-aware
  card + `ConsultationSummary` aside; plain submit `button` + spinner.
- Return (`(public-ar)/payment/consultation/return/page.tsx`): status-toned
  card + `PaidConfirmation` + `PaymentStatusPoller` + `StatusItem` cards +
  action buttons.
- Receipt (`consultation-payment-receipt-document.tsx` + print button):
  standalone light document, `print:` variants.
- Login (`(login)/login/page.tsx` + `login-form.tsx`): split layout + `Card`
  form + loading `Button`.
- Install (`install-wizard.tsx`): 4 numbered `Card`s + status aside; plain
  buttons.
- Deferred areas (final Phase 01 rulings; evidence in
  `01_SCOPE_AND_DEFERRED_CONTENT.md`): Articles (`ArticlesPageView`
  `public-pages.tsx:633` + `ArticleDetailPageView` `:660`, routes
  `/articles`, `/articles/[slug]` + AR catch-all arms); Case Studies
  (`CaseStudiesPageView` `:756` + `CaseStudyDetailPageView` `:783`, routes
  `/case-studies`, `/case-studies/[slug]` + AR arms); Media (`MediaPageView`
  `:855`, static `mediaItems` in `public-content.en.ts:147-166`, routes
  `/media` + AR arm). Public renderers are DB-backed for articles/case
  studies (PUBLISHED + `publishedAt`, + `isAnonymized` for studies) and fully
  static for media (no model, no API, no admin writer).

## Target State

Stateful Button drives every async submit (contact, setup, return retry/pay,
login, install bootstrap/preflight/finish). Accordion drives mobile-only
collapsible groups (contact branches, policy TOC, setup summary, install
groups). Scroll Progress drives policy reading progress. Receipt keeps its
current print-first document. The Contact WhatsApp card is REMOVED; WhatsApp
remains available through the global Floating Dock. Contact retains the
contact form, office/branch information, and phone/email links.
DEFERRED PUBLIC CONTENT EXECUTION (final Phase 01 rulings): Articles and
Case Studies are hidden from public routing/SEO (not discoverable, absent
from sitemap, no public metadata emission, no public internal links, no
public rendering path) while their database models, APIs, forms, admin
management, publishing workflows, and stored data stay fully intact;
Homepage Representative Matters / `MatterRows` is NOT modified. Media is
removed as a public feature (route, render branch, navigation references,
metadata, sitemap entry, and Media-only static data that becomes unused);
`SocialDraftForm`, `AiSocialDraftForm`, admin social functionality, the
social-draft counter/data, and shared UI components are NOT removed — only
code proven Media-specific is removed. Active Media removal happens HERE,
not in Phase 12 (Phase 12 handles only proven-dead orphans afterwards).

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Contact submit | ShimmerButton submit | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Contact branch details (mobile) | Static stacked panels | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Contact WhatsApp card | ButtonLink external WhatsApp card | REMOVE | None | — | — |
| Policy reading progress | None on policy pages | REPLACE WITH: Magic UI Scroll Progress | Scroll Progress | Magic UI | https://magicui.design/docs/components/scroll-progress |
| Policy mobile TOC | Stacked TOC | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Setup submit | Plain button + spinner | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Setup mobile summary | Stacked aside | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Return async action | Plain pay/retry buttons | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Receipt document | Current print-first doc | KEEP CURRENT | None | — | — |
| Login submit | Loading Button | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Install groups | Numbered Cards | REPLACE WITH: Animate UI Accordion (groups only; card content kept) | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Install async actions | Plain buttons | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Articles public surface (HIDE PUBLIC) | Public routes `/articles`, `/articles/[slug]` + AR arms, sitemap slugs, metadata, internal links | REMOVE public availability (routes per Next.js routing architecture; sitemap entries; metadata emission; internal links; rendering path). PRESERVE models, APIs, ArticleForm, admin management, workflow, data | None (removal, no component) | — | — |
| Case Studies public surface (HIDE PUBLIC) | Public routes `/case-studies`, `/case-studies/[slug]` + AR arms, sitemap slugs, metadata, internal links | REMOVE public availability (same five removals). PRESERVE models, APIs, CaseStudyForm, admin management, workflow, data. KEEP MatterRows untouched | None (removal, no component) | — | — |
| Media public feature (DELETE) | `/media` + AR arm, `MediaPageView` branch, nav refs, metadata, sitemap entry, `mediaItems` static data | REMOVE public feature (route, render branch, nav refs, metadata, sitemap, Media-only dead data). KEEP SocialDraftForm, AiSocialDraftForm, admin social functionality, counter/data, shared UI | None (removal, no component) | — | — |

## Tasks

- [ ] TASK-06-01 Vendor/install the official Aceternity Stateful Button and
  Magic Scroll Progress (verbatim sources; record URL + version); reuse the
  Phase 05 Accordion; verify themes + RTL + reduced-motion for all three.
- [ ] TASK-06-02 Contact: submit → Stateful Button wired to the existing
  `ContactForm` states (idle → loading → success/error + newMessage reset);
  fields, validation rules, error/success presentation, and observable submit
  outcomes remain behaviorally identical.
- [ ] TASK-06-03 Contact mobile: branch/office details → Accordion; REMOVE
  the WhatsApp card; keep office/branch information and `tel:`/`mailto:`
  links tappable; WhatsApp remains available through the global Floating
  Dock only. No new WhatsApp CTA card is added.
- [ ] TASK-06-04 Policy: Scroll Progress bar mounted (offset below sticky
  header, `scaleX` without layout shift); desktop sticky TOC kept; mobile
  TOC → Accordion with anchor navigation + `scroll-mt` preserved.
- [ ] TASK-06-05 Setup: submit → Stateful Button (validation + status +
  redirect behavior preserved); mobile consultation summary → Accordion;
  expired/existing-account branches intact.
- [ ] TASK-06-06 Return: pay/retry async action → Stateful Button (polling +
  countdown + status tones untouched); receipt/setup/new-booking links intact.
- [ ] TASK-06-07 Receipt: print-first pass only (readability, `print:` variants,
  `dir=ltr` islands); no animated component added.
- [ ] TASK-06-08 Login: submit → Stateful Button (validation, alert, redirect,
  readiness-blocked variant intact); language link + security note kept.
- [ ] TASK-06-09 Install: 4 groups → Accordion (content + order kept);
  bootstrap/preflight/finish → Stateful Buttons (gates + notices preserved);
  internal-only route; full AR RTL verification included.
- [ ] TASK-06-10 AR sweep: every page above in Arabic RTL; translated strings
  complete for new/changed copy; `dir` islands intact.
- [ ] TASK-06-11 ARTICLES HIDE PUBLIC: remove `/articles` + `/articles/[slug]`
  EN route entries and the AR catch-all articles arms (render + metadata
  mapping) per the Next.js routing architecture; remove article sitemap
  entries (static + DB-backed slugs); remove article public metadata
  emission; remove public internal article links (nav already done in Phase
  02; home ledger done in Phase 03; detail related/back/breadcrumb links die
  with the routes). Expected public result: not discoverable, absent from
  sitemap, no public metadata, no public internal links, no public rendering
  path. PRESERVE: `Article` model/table, article APIs, `ArticleForm`, admin
  Content article management, publishing workflow, stored data — do NOT
  delete backend/admin article code.
- [ ] TASK-06-12 CASE STUDIES HIDE PUBLIC: same five removals for
  `/case-studies` + `/case-studies/[slug]` + AR equivalents (render, sitemap
  static + DB slugs, metadata, internal links/discovery). PRESERVE: case-study
  models/data, APIs, `CaseStudyForm`, admin management, publishing workflow.
  KEEP Homepage Representative Matters — do NOT modify/remove `MatterRows`
  (Phase 01 proved it independent).
- [ ] TASK-06-13 MEDIA DELETE PUBLIC FEATURE: remove `/media` EN route entry
  + AR Media route arm + `MediaPageView` render branch + media navigation
  references + `mediaMetadata` emission + sitemap `/media` entry + static
  Media-only data that becomes unused (`mediaItems` only if proven dead by
  repo-wide grep). Do NOT remove `SocialDraftForm`, `AiSocialDraftForm`,
  admin social content functionality, the unrelated social-draft
  counter/data, or shared UI components — only code proven Media-specific.
  Active removal happens in THIS phase; Phase 12 handles only remaining
  proven-dead orphans afterwards.
- [ ] TASK-06-14 Deferred link/SEO sweep: repo-wide re-grep for
  `/articles|/case-studies|/media` across `src/`; every remaining match must
  be backend/admin-legitimate (API routes, admin hub/forms, services) or be
  removed; sitemap output verified without deferred URLs; no public metadata
  emitted for deferred paths.
- [ ] TASK-06-15 Deferred QA verification: ARTICLES — public EN route
  unavailable, detail route unavailable, AR equivalents unavailable, absent
  from sitemap, admin article management still works. CASE STUDIES — public
  EN route unavailable, detail route unavailable, AR equivalents unavailable,
  absent from sitemap, admin case-study management still works,
  Representative Matters still works. MEDIA — route removed/unavailable, AR
  equivalent removed/unavailable, sitemap/metadata references removed, no
  Media-specific dead imports, admin social-draft functionality still works.
- [ ] TASK-06-16 Full sweep EN+AR × light+dark × 390/1440 + submit-state
  captures; phase commit; STOP.

## Files Expected To Change

- `contact-form.tsx`, `public-pages.tsx` (contact/policy views + deferred
  rendering-branch removals), `policy-toc.tsx`, `client-account-setup-form.tsx` +
  `-page.tsx`, payment return page, receipt styles (print only),
  `login-form.tsx` + login page, `install-wizard.tsx`, vendor files for
  Stateful Button + Scroll Progress.
- Deferred execution (only as required by the final Phase 01 rulings):
  public route entry files for Articles / Case Studies / Media
  (`(public-en)/articles/`, `(public-en)/case-studies/`,
  `(public-en)/media/`), the Arabic catch-all public route mapping
  (`ar/[[...path]]/page.tsx` + `renderPublicPath`/`metadataForPublicPath`
  arms in `public-pages.tsx`), `src/app/sitemap.ts`, public
  pages/components only where deferred rendering branches are removed,
  Media-only static content source if proven dead by grep.

## Files That Must NOT Change

- Contact/booking/payment/auth APIs, validation rules, poller timing logic,
  home/services/team/booking views, admin, client, inventory doc.
- Backend/Admin implementations for Articles and Case Studies must not change.
  Public deferred-content route/render/SEO code may change only as required
  by the final Phase 01 owner rulings.

## Dependencies

- Phase 02 (tokens, toggler outcome, deferred nav entries removed), Phase 03
  (Homepage Insights removed), Phase 05 (Accordion vendor pattern). Final
  Phase 01 owner rulings (Articles HIDE, Case Studies HIDE, Media DELETE).
  Phase 02 + Phase 03 should be COMPLETE before the TASK-06-14 deferred
  link sweep so the sweep verifies final state.

## Risks

- Stateful Button async contract (`onClick` promise → success state) vs
  existing form-submission flows → mitigate by wrapping, not rewriting,
  submit handlers; keep native `type="submit"` support.
- Scroll Progress offset vs sticky header height → verify per breakpoint.
- Install is rarely exercised → run its full wizard path in QA explicitly.
- Deferred hiding breaking admin/backend or shared components → mitigate by
  touching ONLY the enumerated public route/render/SEO surfaces; re-run
  admin content hub + public services/team/home smoke after TASK-06-11–13.
- Media deletion overreach (social/admin collateral) → mitigate by the
  Media-only proof rule in TASK-06-13; any doubt → keep the code, record why.

## Acceptance Criteria

- [ ] Every listed submit is a Stateful Button with correct async states.
- [ ] Every listed mobile group uses Accordion; desktop layouts kept.
- [ ] Contact WhatsApp card removed (grep proof); contact form, office/branch
  information, and phone/email links intact; no new WhatsApp CTA card added.
- [ ] Policy progress bar present without layout shift.
- [ ] Receipt unchanged in behavior; print output verified.
- [ ] ARTICLES: public EN route + detail route + AR equivalents unavailable;
  absent from sitemap; admin article management still works.
- [ ] CASE STUDIES: public EN route + detail route + AR equivalents
  unavailable; absent from sitemap; admin case-study management still works;
  Representative Matters still works.
- [ ] MEDIA: route + AR equivalent removed/unavailable; sitemap/metadata
  references removed; no Media-specific dead imports; admin social-draft
  functionality still works.
- [ ] EN+AR × light+dark × 390/1440 pass; one phase commit; STOP.

## Visual QA

- [ ] Submit-state sequences (idle/loading/success/error) captures.
- [ ] Accordion + progress captures per page × theme.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Form-submit + payment-poller + login + install E2E pass.
- [ ] Deferred E2E: deferred public URLs unavailable (EN + AR, list + detail);
  sitemap contains no deferred URLs; admin content hub (articles, case
  studies, social) + public home/services/team smoke green.

## Status

NOT STARTED

## Implementation Notes

Leave blank.

## Files Actually Changed

Leave blank.

## QA Results

Leave blank.

## Blockers

Leave blank.
