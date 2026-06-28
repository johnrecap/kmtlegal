# test-plan.md

## Test Pyramid
- Static checks: TypeScript, lint, dependency audit, secret scan.
- Unit tests: validators, permission helpers, services, mappers, telemetry sanitizers, AI provider adapters, disabled email helper.
- Component tests: forms, tables, dialogs, upload dropzone, permission states.
- Integration tests: API/server actions, repositories, auth, Prisma with test DB.
- E2E tests: critical public/admin/portal workflows.
- Manual/UAT: legal content, Arabic RTL, anonymization, release smoke.

## Static Checks
- `typecheck`: strict TypeScript.
- `lint`: code style and common React/Next pitfalls.
- `prisma validate`: schema validity.
- `prisma generate`: regenerate Prisma client after schema/migration changes.
- `format:check` if formatter is configured.
- dependency audit.
- secret scanning for `.env`, tokens, keys, credentials.

## Unit Tests
- Zod schemas for consultation, login, installer bootstrap, client, case, appointment, document, task, content, invoice/payment basics, settings.
- Permission helper for role/permission/object scope.
- Auth/session utilities.
- Disabled TOTP/Email OTP route behavior and staff password-login session behavior.
- AI Gateway mock/OpenAI-compatible output validators and provider timeout handling.
- SMTP disabled-mode behavior and future config placeholder validation.
- Upload type/size/key generation for PDF/DOC/DOCX/JPG/JPEG/PNG under 5MB.
- Audit metadata redaction.
- Telemetry event schema and PII rejection.

## Component Tests
- Button, Input, Select, Textarea, Dialog, Toast.
- BookingStepper validation and navigation.
- AIOrganizerPanel review-required messaging.
- DocumentUploadDropzone success/error states.
- DataTable sort/filter/pagination rendering.
- TaskKanbanBoard keyboard-accessible status update controls.
- PermissionBlocked state.
- Content approval controls.

## Integration Tests
- Auth login/logout/current user.
- Staff login reaches admin without 2FA while `STAFF_2FA_MODE=disabled`; client login opens portal.
- TOTP, Email OTP, and staff 2FA reset routes return `FEATURE_DISABLED`.
- Installer status/preflight/bootstrap/finish contracts require setup token and lock after first Super Admin.
- Panel-aware installer preflight validates `terminal-vps`, `aapanel`, and `cpanel` requirements before build/migration/bootstrap.
- Consultation create/review/assign/reject/convert.
- Client own cases/documents/appointments/payments.
- Admin clients/cases/sessions/tasks/documents.
- Content/case study approval workflow.
- Users/roles/settings/audit log.
- Manual invoice/payment basics and reports.
- Upload metadata + private VPS download authorization.
- Email template helper returns disabled metadata; no real send records are required in this release.
- AI Gateway provider registry, normalized responses, schema-invalid output, and no raw prompt/provider-response logging.

## Contract Tests
- Shared error shape.
- Validation error details.
- 401/403/404/409/429 behavior.
- Pagination/filter/sort allowlists.
- DTOs do not expose passwordHash, fileKey to unauthorized users, internal notes to clients, raw metadata secrets, OTP values, AI raw prompts, provider raw responses, or API keys.

## E2E Tests
- Public visitor submits consultation request.
- Admin reviews and assigns consultation request.
- Admin converts consultation to case.
- Client logs in and sees only own data.
- Client uploads valid document.
- Invalid upload fails by size/type; files over 5MB fail.
- Staff login opens admin without TOTP in PLAN-25.
- Lawyer sees assigned case only.
- Unauthorized user gets permission denied.
- Marketing creates anonymous case study draft.
- Case study cannot publish before approval.
- Super admin changes role and audit log records it.
- Super Admin creates users and changes passwords; staff 2FA reset stays disabled.
- AI Gateway mock/provider output is review-required and schema-valid.
- SMTP remains disabled; helper returns safe disabled metadata without sending.

## PLAN-24 Remediation Tests
- `/api/auth/me` source/route contract sets `Cache-Control: no-store`.
- Staff 2FA reset route returns `FEATURE_DISABLED` in PLAN-25.
- Trusted IP helper uses `X-Real-IP` in production and ignores client-supplied `X-Forwarded-For`.
- Dormant Staff 2FA helpers retain future lockout tests, but active login does not require 2FA.
- Upload rejects oversize `Content-Length` before `request.formData()`.
- Public consultation AI organizer uses AI-specific limiter before provider calls.
- Stitch screenshot tests assert route status and visible body before screenshot capture.
- Route manifest contract checks implemented finance/calendar/files/portal route families against `contracts/openapi-plan.md`.
- DB-backed E2E entrypoint covers staff login -> admin without TOTP and client login -> portal.

## PLAN-28 Public Luxury Redesign Tests
- Public scope guard: verify `/admin`, `/portal`, `/product-system`, and `/stitch-clone/*` do not inherit PLAN-28 public-only dark styling through global token/body/shared primitive mutations.
- Public route render smoke: `/`, `/services`, `/services/[slug]`, `/team`, `/team/[slug]`, `/articles`, `/articles/[slug]`, `/case-studies`, `/case-studies/[slug]`, `/media`, `/contact`, `/book-consultation`, `/privacy`, and `/terms`.
- Public internal link crawl: homepage cards, nav links, footer links, service detail links, team detail links, article links, case-study links, CTA links, privacy, and terms all return status `< 400`.
- Public visual screenshots: `/`, `/services`, `/contact`, and `/book-consultation` at desktop `1440x900` and mobile `390x844`.
- RTL/mobile overflow: public pages must have no page-level horizontal scroll at `390px`; internal scroll is allowed only for explicit controls where documented.
- Dark surface accessibility: focus states, contrast, touch targets, button labels, filter `aria-pressed`, form labels, error text, and status messages remain visible.
- Booking flow regression: required-field validation, step navigation, service/category prefill, analytics event preservation, API submission, error state, loading state, disabled state, and success reference output.
- Contact form regression: validation, API submission, duplicate-submit protection after success, reset/new-message action, error state, and requestId display.
- DB-empty content behavior: homepage insights, articles, and case studies render empty-safe content without dead links when no published DB content exists.
- Legal-copy guard: public copy, representative matters, case studies, and CTAs do not promise legal outcomes or expose client-identifying details.
- Localization guard: PLAN-29 makes English the default public locale, Arabic lives under `/ar`, and both locale switches must point to existing routes with stable slugs.

## PLAN-29 Public English-Primary Localization Tests
- Public document direction: `/`, `/services`, `/contact`, and `/book-consultation` render `lang="en"` and `dir="ltr"`.
- Arabic public document direction: `/ar`, `/ar/services`, `/ar/contact`, and `/ar/book-consultation` render `lang="ar"` and `dir="rtl"`.
- Protected-surface guard: `/admin`, `/portal`, `/install`, `/login`, `/product-system`, and `/stitch-clone/*` remain Arabic/RTL for this stage.
- Route and slug stability: English and Arabic public links keep the same slugs and only add/remove the `/ar` prefix.
- Public copy guard: nav, footer, CTAs, form labels, validation, errors, success states, empty states, metadata, and image alt text match the active public locale.
- Public API locale guard: public list/detail APIs accept `?locale=en|ar`, default to English, and keep response shape stable.
- DB locale guard: Article and CaseStudy allow the same slug once per locale and public queries never leak Arabic DB records into English pages or English records into Arabic pages.
- SEO guard: public metadata includes canonical and alternate language URLs for `en`, `ar`, and `x-default`.
- No framework creep: no `next-intl` dependency, config, or import appears in package, source, tests, or Prisma files.
- Form flow guard: contact and booking validation/error/success states work in both English default and Arabic `/ar` pages, including the booking AI review disclaimer.

## PLAN-30 KMT Signature Motion Tests
- Public scope guard: verify public motion helpers are applied only to public website surfaces and do not restyle `/admin`, `/portal`, `/install`, `/login`, `/product-system`, or `/stitch-clone/*`.
- Dependency guard: verify no new animation runtime dependency is added.
- Reduced-motion guard: with `prefers-reduced-motion: reduce`, hero reveal, card lift, button lift, image zoom, result fade, status fade, and arrow shift do not animate.
- RTL direction guard: public arrows keep correct static direction in Arabic and hover movement is inline-forward when motion is allowed.
- Interaction overflow guard: hover/focus states for public buttons and cards do not create page-level horizontal overflow at `390px`.
- Form state guard: contact and booking success/error/validation states remain readable and accessible after motion classes are applied.
- Visual smoke: `/`, `/services`, `/contact`, `/book-consultation`, `/ar`, `/ar/services`, `/ar/contact`, and `/ar/book-consultation` render with expected direction and screenshot evidence.

## PLAN-31 Public Motion V2 Tests
- Removed-thread guard: no `kmt-motion-thread`, `kmt-motion-trust-strip`, `publicMotionThread`, or `publicMotionTrustStrip` remains in runtime source, CSS, or public DOM.
- V2 class guard: public pages include `kmt-motion-cta`, `kmt-motion-card-beam`, `kmt-motion-icon-halo`, `kmt-motion-arrow-trail`, `kmt-motion-panel-enter`, and `kmt-motion-hero-spotlight` where relevant.
- Dependency guard: `package.json` does not add the `motion` package or another animation runtime.
- Reduced-motion guard: `prefers-reduced-motion: reduce` disables reveal, CTA shine, border beam, icon tilt, image zoom, spotlight, panel enter, status fade, and arrow shift.
- RTL direction guard: English arrow trail shifts inline-forward to the right, Arabic arrow trail shifts inline-forward to the left.
- Interaction overflow guard: hover/focus states for V2 CTAs and card beams do not create page-level horizontal overflow at `390px`.
- Visual smoke: `/`, `/services`, `/contact`, `/book-consultation`, `/ar`, `/ar/services`, `/ar/contact`, and `/ar/book-consultation` show visibly stronger cinematic public motion hooks without decorative lines under headings.

## Visual Regression Tests
- Stitch clone at `390x844` and `1440x900` where references exist.
- Stitch clone requires `_workspace/stitch-clone/{screen-name}/04_visual-diff-report.md` and `06_acceptance.md` for each screen.
- Product public shell mobile/desktop.
- PLAN-28 public luxury screenshots for `/`, `/services`, `/contact`, and `/book-consultation`.
- PLAN-30/31 public motion screenshots and reduced-motion checks for English and Arabic public pages.
- Portal dashboard mobile/desktop.
- Admin dashboard desktop.
- Critical forms/dialogs.

## Accessibility Tests
- Public pages headings/landmarks.
- Booking, login, contact forms labels/errors.
- Dialog focus trap.
- Keyboard navigation for dashboard/sidebar/tabs.
- Tables have headers.
- Status badges are text-readable.
- 44px mobile targets.

## Performance Tests
- Public page build/render budgets.
- Admin tables paginate rather than loading unbounded rows.
- Upload size limits enforced.
- No private data cached publicly.
- Search/filter queries use indexed fields.

## Security Tests
- Auth and object-scope negative tests.
- CSRF/origin checks for cookie-auth mutations.
- Open redirect rejection.
- XSS-safe content rendering.
- Upload private storage and safe download headers.
- Upload rejects path traversal and direct private path access is impossible through Nginx/app routes.
- Installer setup token, lock behavior, and Super Admin bootstrap.
- Panel mode security: aaPanel/cPanel flows never run root-only VPS commands and reject unsupported cPanel/shared hosting early.
- AI Gateway timeout/schema-invalid output/no PII logging.
- SMTP disabled-state handling and disabled TOTP route behavior.
- No PII in analytics/logs.
- Dependency/secret scan.

## Database Tests
- Clean migration.
- Seed idempotency.
- Production seed bootstrap creates roles/permissions/settings only and never demo users.
- Demo seed creates backing files for seeded documents under private uploads storage.
- Unique constraints for email, slugs, internal file number.
- Index-backed list/search queries.
- Soft delete/archive behavior.

## Deployment Tests
- Build succeeds in production mode.
- Required env vars validated.
- Migrations run in staging.
- VPS Nginx proxy smoke passes.
- aaPanel reverse proxy smoke passes when aaPanel mode is selected.
- cPanel Node.js App smoke passes only on cPanel accounts that meet the required capability preflight.
- Private uploads directory exists, is writable by app, and is not directly web-served.
- PostgreSQL and uploads backup/restore smoke is documented and tested in staging.
- Smoke test after deploy.
- Rollback procedure documented.

## Required Command Gates
```bash
npm run qa:local
npm run qa:db
npm run qa:release
npm run security:secrets
npm run security:audit
```

`qa:db` requires `DATABASE_URL` and runs migrate + seed + seed + DB-backed E2E. `qa:release` adds E2E smoke, DB gate, dependency audit, and secret scan.

## UAT Checklist
- English public site reads naturally on default routes.
- Arabic public site reads naturally under `/ar`.
- Booking copy does not promise outcomes.
- AI organizer output is clearly preliminary and review-required.
- Client portal hides internal notes.
- Admin workflows match law-office operations.
- Anonymous case study contains no identifying data.
- Audit log is understandable to super admin.

## Critical Flows to Test
1. Guest booking -> admin queue.
2. Admin conversion -> client/case/appointment.
3. Client own-data portal.
4. Client upload -> admin document review.
5. Lawyer assigned case/session update.
6. Content draft -> legal approval -> public case study.
7. Super admin role/settings/audit governance.
8. Denied access for every protected role boundary.
9. Staff login -> final admin session without 2FA.
10. Valid upload under 5MB -> authorized download; invalid type/oversize/path traversal rejected.
11. AI Gateway mock/provider -> normalized output -> schema validation -> no raw prompt/provider logs.
12. Invoice basics create/update -> client own payment view -> admin finance permission enforced.
13. Hosting selector -> compatible panel preflight -> `/install` bootstrap -> installer lock for the selected setup mode.
14. PLAN-28/29 English public visitor flow: homepage -> `Practice Areas` -> service detail -> book consultation -> validation/success.
15. PLAN-28/29 Arabic public visitor flow: `/ar` homepage -> `مجالات الخبرة` -> Arabic service detail -> Arabic booking validation.
16. PLAN-28/29 public inquiry flow: homepage/contact CTA -> contact form -> success -> deliberate new-message reset in the active locale.
17. PLAN-28/29 public editorial flow: homepage insights -> article/case-study detail -> final consultation CTA without broken links or cross-locale DB leakage.

## Test Matrix
| Test type | Scope | Tool | Runs on PR? | Runs on merge? | Runs before release? | Blocking release? | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Typecheck | TS project | tsc | Yes | Yes | Yes | Yes | Engineering |
| Lint | Source code | ESLint | Yes | Yes | Yes | Yes | Engineering |
| Unit | validators/services/helpers | Vitest/Jest | Yes | Yes | Yes | Yes | Engineering |
| Component | critical UI | Testing Library | Yes | Yes | Yes | Yes | Frontend |
| Integration | API/actions/db/auth | Vitest/Jest + test DB | Yes | Yes | Yes | Yes | Backend |
| Contract | DTO/error/auth scopes | test suite | Yes | Yes | Yes | Yes | Backend |
| E2E | critical journeys | Playwright | Optional fast subset | Yes | Yes | Yes | QA/Engineering |
| Visual | Stitch/product shells | Playwright screenshots | No/full optional | Optional | Yes | Yes for clone | Frontend |
| Accessibility | forms/tables/dialogs | axe/manual | Optional | Yes | Yes | Yes | Frontend/QA |
| Security | authz/upload/secrets/deps | tests + scanners | Yes | Yes | Yes | Yes | Engineering |
| Deployment smoke | deployed app | Playwright/manual | No | Staging | Production | Yes | DevOps |
