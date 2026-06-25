# PLAN-27 Live Site QA Remediation

Date: 2026-06-25

## Purpose

PLAN-27 converts the live QA pass on `https://kmtlegal.saeeddev.com/` into release-blocking remediation work. The goal is to make the deployed public site internally consistent, free of broken public journeys, and clean enough for repeatable release smoke tests.

This plan does not add new product scope. It fixes defects found by real browser navigation, form submission, console/network review, and mobile scrolling.

## Evidence

Live QA artifacts:

- `test-results/live-site-qa-2026-06-24T21-35-31-776Z/`
- Booking success screenshot: `booking-04-after-submit.png`
- Mobile homepage screenshot: `mobile-home.png`
- 404 evidence screenshots:
  - `desktop-articles-contract-risk-basics.png`
  - `desktop-case-studies-anonymous-commercial-dispute.png`

Observed successful flows:

- Public booking submitted successfully and returned reference `CONS-14BB65ED`.
- Contact form submitted successfully with `POST /api/public/contact => 202`.
- Services filters/search worked.
- `/admin` and `/portal` redirected anonymous users to `/login?next=...`.

Observed defects:

| ID | Severity | Defect | Evidence | Owner area |
| --- | --- | --- | --- | --- |
| P27-F01 | P1 | Homepage links to article detail pages that return 404. | `/articles/contract-risk-basics => 404` | Public content |
| P27-F02 | P1 | Homepage links to case study detail pages that return 404. | `/case-studies/anonymous-commercial-dispute => 404` | Public content |
| P27-F03 | P1 | `/articles` and `/case-studies` are DB-backed and empty while homepage still renders static linked cards. | `src/app/page.tsx`, `src/server/public/content-service.ts` | Public content/data |
| P27-F04 | P1/P2 | Protected-route redirect to login produced a `ChunkLoadError` for a stale or missing login page chunk during live navigation. | `_next/static/chunks/app/login/page-*.js => 404` | Deploy/cache/static assets |
| P27-F05 | P2 | Cloudflare Insights beacon is injected but blocked by the production CSP. | `static.cloudflareinsights.com/beacon.min.js` blocked by `script-src` | Security headers/observability |
| P27-F06 | P2 | `/favicon.ico` returns 404. | Browser console/network | App metadata/assets |
| P27-F07 | P2 | Production login page shows development seed instructions. | `/login` visible copy | Auth UI/content |
| P27-F08 | P2 | Login failure copy is English inside the Arabic UI. | `Invalid email or password.` | Auth API/UI |
| P27-F09 | P2 | Booking success leaks internal/mock wording and raw enum labels to public users. | `Structured intake summary placeholder...`, `corporate` | AI/booking UX |
| P27-F10 | P3 | Contact form keeps the submit button active after success, allowing avoidable duplicate submits. | `/contact` success state | Contact UX |

Additional authenticated admin QA on `https://kmtlegal.saeeddev.com/admin` found these live blockers:

| ID | Severity | Defect | Evidence | Owner area |
| --- | --- | --- | --- | --- |
| P27-F11 | P1 | Several authenticated admin routes serve HTML for missing route chunks, causing `ChunkLoadError`. | `/admin/consultations`, `/admin/cases`, `/admin/reports`, `/admin/audit-log` route chunks returned `400 text/html` | Deploy/cache/static assets |
| P27-F12 | P2 | Admin settings and shell still expose English operational copy. | `Management`, `Admin`, `Staff 2FA is deferred` | Admin UI copy |
| P27-F13 | P2 | Old production consultation records can expose English mock AI classification text in admin review. | `aiClassification` / `intakeSummary` values from older mock provider output | Admin consultation review |
| P27-F14 | P2 | `/admin` can create page-level horizontal overflow on desktop/mobile. | Dashboard cards/tables in authenticated browser QA | Admin responsive layout |
| P27-F15 | P3 | Production content APIs are empty, so first real article/case-study must be created through approved content workflow. | `/api/admin/content` returned empty collections | Content operations |

## Scope

### In Scope

- Align public homepage featured content with DB-backed articles and case studies.
- Ensure public links rendered in production resolve to non-404 pages.
- Add or document a production-safe content bootstrap path for first published articles/case studies without demo data leakage.
- Harden deploy/static asset release checks for Next.js chunks and protected-route redirects.
- Resolve CSP mismatch for Cloudflare Insights by either allowing the required current domains after verification or disabling the injected beacon.
- Add favicon/app icon assets and metadata so `/favicon.ico` returns 200.
- Remove development-only login instructions from production UX.
- Localize login validation and unauthenticated failure copy while keeping security-generic wording.
- Make booking success public-safe: Arabic labels, no internal placeholder text, no raw enum labels, no internal review-only text.
- Improve contact success state to prevent accidental duplicate sends.
- Add automated and manual QA gates covering the live defects.
- Update release docs/checklists with the new smoke requirements.

### Out Of Scope

- Redesigning the public website.
- Adding a payment gateway, real SMTP, social publishing, or real AI provider activation.
- Changing the auth strategy or reintroducing staff 2FA.
- Publishing real legal articles/case studies without approved business/legal content.
- Changing Stitch clone routes.

## Connected Impact Map

| Layer | Current surfaces | Required remediation |
| --- | --- | --- |
| Public UI | `src/app/page.tsx`, `src/app/articles/page.tsx`, `src/app/articles/[slug]/page.tsx`, `src/app/case-studies/page.tsx`, `src/app/case-studies/[slug]/page.tsx` | Homepage featured cards must use the same published-content source as list/detail pages or render no linked cards when none exist. |
| Content data | `src/content/public-content.ts`, `src/server/public/content-service.ts`, `prisma/seed.mjs`, admin content services | Remove the split-brain behavior between static homepage content and DB-backed published content. |
| Public APIs | `src/app/api/public/articles/*`, `src/app/api/public/case-studies/*` | Ensure API detail routes and pages agree on existence, status, anonymization, and cache headers. |
| Auth UI/API | `src/app/login/page.tsx`, `src/features/auth/login-form.tsx`, `src/app/api/auth/login/route.ts` | Production copy must not mention local seed commands; failure messages should be Arabic and security-generic. |
| Booking/AI | `src/features/public-site/booking-stepper.tsx`, `src/server/ai/providers/mock.ts`, AI schemas/copy | Public success state must map internal categories/review notes to user-safe Arabic copy. |
| Contact | `src/features/public-site/contact-form.tsx`, `src/app/api/public/contact/route.ts` | Success state should not invite duplicate submission. |
| Security headers | `security-headers.cjs`, `next.config.mjs`, middleware | CSP must match deployed observability scripts or scripts must be disabled. |
| Static assets/deploy | Next build output, Nginx/systemd/runbook, release QA | Release smoke must assert `_next/static/*` chunks and CSS load after route redirects. |
| Admin UI | `src/components/layout/dashboard-shell.tsx`, `src/app/admin/*`, `src/features/admin/*` | Admin copy should be Arabic, old mock AI text should not render raw, and admin layout should avoid page-level horizontal overflow. |
| Tests | `tests/e2e/*`, `tests/server/*`, release scripts | Add link-crawl, favicon, CSP/console, auth redirect, and public booking success assertions. |
| Docs | Spec Kit, release checklist, deployment runbook | Add PLAN-27 gates and evidence expectations. |

## Remediation Slices

### Slice A - Public Content Source Of Truth

Decision: public articles and case studies that link to detail pages must be DB-backed published records. Homepage cards must not use `src/content/public-content.ts` static article/case-study arrays unless those same records are guaranteed to exist through the DB-backed public service.

Tasks:

1. Replace homepage featured article/case-study rendering with `listPublishedArticles()` and `listPublishedCaseStudies()` or a small featured-content service wrapping those functions.
2. If no published DB content exists, render an empty-safe public section with no detail links instead of static cards.
3. Keep static `legalServices` and `lawyers` only where their detail routes are static and already resolve.
4. Add a content bootstrap/runbook for production: marketing/admin publishes first article and case study through `/admin/content`, or a dedicated approved production content import is run. Do not use local demo seed for production.
5. Add tests that every homepage content link returns status `< 400` against a seeded DB target.

Acceptance:

- `/`, `/articles`, `/articles/[slug]`, `/case-studies`, and `/case-studies/[slug]` agree on the same published dataset.
- No homepage article or case-study card links to a 404.
- Empty article/case-study states do not contradict homepage content.

### Slice B - Release Static Assets And Chunk Integrity

Decision: ChunkLoadError is a release/deploy blocker. The release process must prove that the deployed HTML references existing CSS/JS assets after redirects and route transitions.

Tasks:

1. Add a release smoke that opens `/login`, `/admin`, `/portal`, then verifies all requested `_next/static/*.js` and `_next/static/*.css` responses are `< 400` and have executable/stylesheet MIME types.
2. Update deploy docs to require atomic deployment of `.next` output and process restart without serving mixed old/new build assets.
3. Add a Cloudflare/proxy cache purge step for `_next/static` only when the chosen hosting/proxy caches build artifacts incorrectly.
4. Add a recovery note: hard refresh or deploy rollback is not enough if the server points at a new HTML build while static assets are stale/missing.

Acceptance:

- Anonymous `/admin` and `/portal` redirects to login do not emit `ChunkLoadError`.
- No `_next/static` request returns 404 or `text/html` for CSS/JS during release smoke.

### Slice C - CSP, Observability, And Favicon

Decision: a blocked third-party beacon is either intentionally disabled or explicitly allowed by a reviewed CSP rule. A production site must also ship a favicon.

Tasks:

1. Identify whether Cloudflare Insights/RUM is intentionally enabled by the hosting layer.
2. If it is not required, disable the injected beacon at the Cloudflare/hosting layer.
3. If it is required, verify the current official Cloudflare RUM domains before adding CSP directives; do not add broad wildcards.
4. Add a test that production CSP contains only reviewed external script/connect origins.
5. Add favicon/app icon assets under `src/app` or `public` using the project metadata convention.
6. Add a smoke assertion that `/favicon.ico` returns status `< 400`.

Acceptance:

- No CSP console error on public pages.
- `/favicon.ico` returns 200 or another successful static asset response.
- Security headers remain strict: no broad `*`, no unnecessary third-party script allowance.

### Slice D - Auth Production Copy And Login Errors

Decision: development setup instructions must not render in production. Auth errors should be Arabic, generic, and safe.

Tasks:

1. Remove or environment-gate the login page development seed guidance.
2. Replace production visible login helper copy with operational support guidance that does not reveal local commands or demo assumptions.
3. Localize login API validation and `401` copy to Arabic while keeping the same generic security meaning.
4. Add form-level Arabic validation for required email/password rather than relying only on native browser bubbles.
5. Keep the exact status behavior: bad credentials still return `401`, protected route redirects still preserve `next`.

Acceptance:

- `/login` in production does not mention `npm run db:seed`, local PostgreSQL, demo data, or local setup.
- Bad credentials show Arabic generic copy.
- Empty form errors are visible and accessible inside the UI.

### Slice E - Booking And Contact Public UX Cleanup

Decision: successful public submissions should show user-safe confirmation only. Internal AI/mock output and raw enum labels belong in staff review screens or API metadata, not public success panels.

Tasks:

1. Map `serviceCategory`, `urgency`, and preferred mode values to Arabic labels in booking review/success.
2. Replace mock AI output strings with Arabic user-safe wording, or hide internal organizer summary from the public success state.
3. Keep lawyer-review disclaimer visible.
4. Ensure public success panel shows only: reference, next steps, and a safe "staff will review" message.
5. Disable or change contact form submit action after success to prevent accidental duplicate sends; provide a clear "new message" reset only if needed.
6. Add tests for booking success copy: no `Structured intake`, no raw enum labels, no English internal review placeholder.

Acceptance:

- Booking success does not expose internal placeholders or raw enums.
- Contact success cannot be accidentally re-submitted without deliberate reset.
- Validation, loading, error, and success states remain accessible.

### Slice F - Release QA Automation And Handoff

Decision: PLAN-27 closes only after automated local/staging checks and a live smoke pass prove the same defects are gone.

Tasks:

1. Add a public link-crawl Playwright test for homepage, nav, service cards, article links, case-study links, footer links, and protected redirects.
2. Add mobile viewport smoke for `/`, `/services`, `/contact`, and `/book-consultation`.
3. Add console/network failure capture to the release smoke and fail on:
   - 404 public page links
   - missing favicon
   - CSP blocked scripts
   - `_next/static` JS/CSS 404 or wrong MIME
   - `ChunkLoadError`
4. Add DB-backed public content smoke after migrate/seed or approved production content import.
5. Add release checklist rows for PLAN-27 evidence.
6. Archive live screenshots/logs after remediation under `test-results/` or documented release evidence storage.

Acceptance:

- `npm run qa:local` remains green.
- DB-backed public content smoke passes in staging.
- Live deployed smoke passes against `https://kmtlegal.saeeddev.com/` or the active release URL.

### Slice G - Authenticated Admin Live Remediation

Decision: the admin site cannot be considered stable until authenticated routes prove that the deployed HTML, route chunks, CSP, and admin copy are aligned.

Tasks:

1. Redeploy the latest production build atomically so route HTML and `_next/static` chunks are switched together.
2. Purge incorrect proxy/CDN cache for `/_next/static/*` if any route chunk returns `400`, `404`, or `text/html`.
3. Localize admin shell/settings copy without changing the disabled staff 2FA behavior.
4. Replace raw admin AI JSON display with safe structured Arabic labels and hide legacy mock/placeholder notes.
5. Constrain admin dashboard layout so only tables may scroll internally; the page itself must not create horizontal scroll at 1440px or 390px.
6. Add an opt-in live admin Playwright smoke that uses environment variables for credentials and checks admin routes, API responses, static asset MIME, CSP, and mobile overflow.

Acceptance:

- `/admin`, `/admin/consultations`, `/admin/cases`, `/admin/reports`, `/admin/audit-log`, and `/admin/settings` load after login without `ChunkLoadError`.
- `_next/static` JS/CSS responses are successful and never return `text/html`.
- No Cloudflare Insights CSP error remains.
- `/login` has no development seed/local PostgreSQL copy.
- Admin shell/settings copy is Arabic, and staff 2FA remains disabled/deferred.
- Old mock AI notes are hidden or normalized in admin consultation review.
- `/admin`, `/admin/clients`, and `/admin/content` pass the 390px mobile smoke.

## Task Breakdown

| Task | Status | Dependencies | Deliverable |
| --- | --- | --- | --- |
| P27-01 Freeze live QA evidence and exact defect list. | Done | Live QA pass | This PLAN-27 document plus `test-results/live-site-qa-*`. |
| P27-02 Decide and document public content source of truth. | Done | PLAN-10, PLAN-20 | Homepage article/case-study detail cards use DB-backed published content only; static public content remains for static services/team. |
| P27-03 Refactor homepage featured content to DB-backed published content or empty-safe rendering. | Done | P27-02 | `src/app/page.tsx` loads published content when DB is configured and otherwise renders list-page fallback cards with no detail links. |
| P27-04 Add production content bootstrap/runbook without local demo seed. | Planned | P27-02 | Release/content handoff docs. |
| P27-05 Add public link-crawl tests for rendered internal links. | Partial | P27-03 | `tests/e2e/mvp-smoke.spec.ts` now follows rendered homepage article/case-study detail links; full nav/footer crawl remains open. |
| P27-06 Add release static asset integrity smoke for auth redirects and `_next/static`. | Partial | PLAN-23/26 | Smoke now verifies anonymous `/admin` and `/portal` redirects without console `ChunkLoadError`; full `_next/static` MIME crawl remains open. |
| P27-07 Resolve Cloudflare Insights CSP mismatch by disabling beacon or adding reviewed allowlist. | Done | Security decision | `security-headers.cjs` permits Cloudflare Insights script/connect origins only in production CSP. |
| P27-08 Add favicon/app icon and `/favicon.ico` smoke. | Done | App metadata decision | `src/app/favicon.ico/route.ts`, layout metadata, and Playwright smoke. |
| P27-09 Remove/gate development login copy in production. | Done | Auth UI | `/login` visible support copy no longer mentions seed or local PostgreSQL setup. |
| P27-10 Localize login errors and add visible form validation. | Done | Auth API/UI | API bad-credential/validation copy and client required-field validation are Arabic and generic. |
| P27-11 Clean booking success copy and hide internal/mock AI placeholders. | Done | AI/booking | Public success panel uses safe Arabic copy and labels; mock AI strings are Arabic and non-placeholder. |
| P27-12 Prevent accidental duplicate contact submission after success. | Done | Contact UI | Contact form locks after success and exposes an intentional "new message" reset. |
| P27-13 Add mobile smoke for public critical pages. | Done locally | P27-03, P27-11, P27-12 | `tests/e2e/mvp-smoke.spec.ts` checks `/`, `/services`, `/team`, `/articles`, `/case-studies`, `/media`, `/contact`, and `/book-consultation` at 390px without page-level horizontal scroll. |
| P27-14 Run local verification: typecheck, tests, build, relevant E2E. | Done | Implementation complete | `typecheck`, full `test`, `build`, and `test:e2e:smoke` passed locally. |
| P27-15 Run staging/live verification and archive evidence. | Planned | Deploy complete | Live smoke report and screenshots. |
| P27-16 Update release checklist and implementation status after evidence. | Partial | P27-15 | Local implementation docs updated; deployed evidence still pending. |
| P27-17 Audit authenticated live admin routes and APIs. | Done | Admin credentials / read-only QA | Live findings P27-F11 through P27-F15 documented; API checks returned 200 for authenticated core admin endpoints. |
| P27-18 Localize admin shell and staff 2FA settings copy. | Done | P27-17 | `DashboardShell` and `SecurityStaff2faSettingForm` no longer render `Management`, `Admin`, or `Staff 2FA is deferred`. |
| P27-19 Hide legacy mock AI notes in admin consultation review. | Done | P27-17 | Admin consultation detail renders structured Arabic labels and hides old mock/placeholder AI text instead of raw JSON. |
| P27-20 Fix admin page-level overflow and add responsive constraints. | Done locally | P27-17 | Shared dashboard/card/table/filter containers and admin dashboard/detail grids now use responsive constraints; admin/portal tables use `DataRecordCard` mobile cards where wired, admin nav is grouped on desktop, and `/admin/clients` keeps the mobile create-client jump link. |
| P27-21 Add opt-in live admin smoke test. | Done | P27-17 | `tests/e2e/live-admin-smoke.spec.ts` checks admin pages, APIs, `_next/static` MIME/status, CSP errors, dev login copy, and 390px overflow for key admin list pages when env credentials are provided. |
| P27-22 Atomically redeploy and rerun authenticated live admin smoke. | Planned | P27-18 through P27-21 | Requires VPS/CI deployment access; archive evidence under `test-results/live-admin-qa-<date>`. |

## Verification Matrix

| Check | Command or method | Required result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Pass |
| Unit/server tests | `npm run test` | Pass |
| Build | `npm run build` | Pass |
| Public smoke | `npm run test:e2e:smoke` or updated release smoke | Pass with zero console errors |
| DB content smoke | `npm run qa:db` or targeted DB-backed Playwright test | Published content list/detail links resolve |
| Security headers | Existing security hardening tests plus CSP smoke | No unintended broad script/connect origins |
| Live smoke | Playwright against deployed URL with network/console capture | No public 404, no favicon 404, no CSP beacon error, no ChunkLoadError |
| Authenticated admin smoke | `KMT_LIVE_BASE_URL=... KMT_LIVE_ADMIN_EMAIL=... KMT_LIVE_ADMIN_PASSWORD=... npx playwright test tests/e2e/live-admin-smoke.spec.ts` | Admin pages and APIs return successfully, `_next/static` MIME/status is valid, no CSP/ChunkLoadError/Application error, and 390px admin pages have no page-level horizontal scroll |

## Local Implementation Notes

Implemented locally on 2026-06-25:

- Homepage article/case-study detail cards now use DB-backed published content when `DATABASE_URL` or production runtime is configured; otherwise the homepage renders safe list-page fallback cards without DB detail links.
- Login page copy is production-safe, and login required-field/bad-credential errors are Arabic and generic.
- Booking success hides internal organizer summary text and maps internal categories/urgency to Arabic labels.
- Contact success disables accidental resubmission until the user deliberately starts a new message.
- Production CSP now allowlists `https://static.cloudflareinsights.com` for scripts and `https://cloudflareinsights.com` for beacon connections.
- `/favicon.ico` resolves through an App Router route and is declared in app metadata.
- Admin shell/settings copy is localized, admin consultation AI output is rendered through safe structured labels instead of raw JSON, and dashboard containers have responsive overflow constraints.
- An opt-in authenticated live admin Playwright smoke was added for route chunk integrity, CSP, API status, login copy, mobile overflow, and `/admin/clients` mobile surface verification.
- Local verification passed for `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e:smoke`; the opt-in live admin smoke also passed syntax/skip behavior with required env vars absent.
- Responsive CRM follow-up verification passed for `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npx playwright test tests/e2e/live-admin-smoke.spec.ts` with required env vars absent/skipped, and `git diff --check`.
- Full design responsive pass added shared `DataRecordCard` mobile table rendering across admin and portal list surfaces, grouped admin navigation, KMT-token active/hover states, compact public `PageHero` variants, improved public directory filters, and safer no-DB fallbacks for article/case-study list pages.
- Full design responsive pass verification passed for `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e:smoke`, `npx playwright test tests/e2e/live-admin-smoke.spec.ts` with required env vars absent/skipped, and `git diff --check`.
- aaPanel PM2 deploy script now loads the production env file before build/migrations and preserves previous `.next/static` assets across builds so open tabs and cached HTML do not request deleted route chunks after deployment.
- Public `PageHero` image treatment was lightened by raising image opacity and reducing the navy gradient overlay while preserving text contrast on Arabic hero copy.

## Release Gate

PLAN-27 is complete only when all of these are true:

- Homepage, articles, and case studies use one consistent published-content source.
- All public links rendered from `/` and public lists resolve.
- The deployed login redirect flow does not throw `ChunkLoadError`.
- CSP behavior matches the chosen Cloudflare Insights decision.
- `/favicon.ico` is present.
- Production login copy contains no development setup instructions.
- Booking/contact success states are user-safe.
- Authenticated admin pages do not expose English shell/settings copy, raw legacy mock AI text, or page-level horizontal overflow.
- Automated smoke covers the defects and passes locally/staging/live as applicable.

## Open Decisions

- Should the first production content be created manually through `/admin/content`, imported from an approved content file, or temporarily hidden until marketing publishes it?
- Which URL is the canonical staging/live smoke target after remediation: `https://kmtlegal.saeeddev.com/` or a separate staging domain?
