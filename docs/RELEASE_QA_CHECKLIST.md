# Release QA Checklist

Date: 2026-06-25

## Local Gates

- [ ] `npm ci`
- [ ] `npm run db:validate`
- [ ] `npm run db:generate`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:e2e:smoke`
- [ ] `npm run security:secrets`

If local build runs without a real `DATABASE_URL`, use `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build` for local-only validation. Production/server builds must load the real production `DATABASE_URL` instead.

Equivalent local shortcut:

```bash
npm run qa:local:e2e
```

Local release-candidate shortcut only:

```bash
npm run qa:local:release
```

This is not a production-ready gate by itself.

## Network-Dependent Gates

- [x] `npm run security:audit` was executed in this workspace.
- [x] Resolve current npm audit blockers before production release.
- [x] `npm run security:audit:all` passes with no vulnerabilities.

This requires npm registry/advisory access.

Current result is documented in `docs/SECURITY_AUDIT_FINDINGS.md`.

## Database Gates

- [ ] PostgreSQL is running.
- [ ] `DATABASE_URL` points to the intended database.
- [ ] `npm run qa:db` passes against real PostgreSQL.
- [ ] Demo seeded document has a backing file under private `UPLOADS_DIR`.
- [ ] Production bootstrap seed does not create demo users.

## Critical E2E Gates

- [ ] Guest booking -> admin queue.
- [ ] Admin assign/reject/convert consultation.
- [ ] Converted consultation creates linked client/case/appointment.
- [ ] Staff login reaches `/admin` without 2FA while `STAFF_2FA_MODE=disabled`.
- [ ] Client login does not require 2FA and reaches `/portal`.
- [ ] Client sees own cases, appointments, payments, documents, and profile only.
- [ ] Lawyer sees assigned cases only.
- [ ] Admin document upload and status/delete workflow.
- [ ] Client upload valid PDF/DOC/DOCX/JPG/PNG under 5MB.
- [ ] Invalid type and oversize upload fail.
- [ ] Authorized download streams with attachment headers.
- [ ] TOTP/Email OTP/staff 2FA reset routes return `FEATURE_DISABLED`.
- [ ] Installer preflight/bootstrap/finish require setup token and lock after first Super Admin.
- [ ] Finance invoice/payment basics create/update and client own payment view.
- [ ] Content/case-study approval gate prevents premature publishing.
- [ ] Public contact submission persists a `ContactMessage`, returns a safe reference, and can be read/marked reviewed through admin API.

## PLAN-27 Live Site QA Gates

- [ ] Homepage rendered article and case-study links resolve with status `< 400`.
- [ ] `/articles` and `/case-studies` do not contradict homepage featured content.
- [ ] `/articles/[slug]` and `/case-studies/[slug]` pass for every rendered public link.
- [ ] Public link-crawl smoke covers homepage, nav, footer, services, team, articles, case studies, privacy, terms, contact, and booking.
- [ ] Anonymous `/admin` and `/portal` redirects to `/login?next=...` without `ChunkLoadError`.
- [ ] `_next/static` JavaScript and CSS requested during smoke return status `< 400` and correct MIME types.
- [ ] Cloudflare Insights is either disabled or permitted by reviewed CSP; no blocked beacon console error remains.
- [ ] `/favicon.ico` returns a successful static response.
- [ ] `/login` in production does not mention local seed, demo data, `npm run db:seed`, or local PostgreSQL setup.
- [ ] Login required-field and invalid-credential errors are visible, accessible, Arabic, and generic.
- [ ] Booking success shows reference and safe next steps only; no internal AI/mock placeholder or raw enum labels render publicly.
- [ ] Contact success cannot be accidentally submitted again without a deliberate reset/new-message action.
- [ ] Contact form still succeeds while `SMTP_ENABLED=false`; no raw message, email, or phone appears in audit metadata.
- [ ] Mobile smoke passes for `/`, `/services`, `/contact`, and `/book-consultation`.
- [ ] PLAN-27 live screenshots, console logs, and network evidence are archived.

Authenticated admin live smoke:

```bash
KMT_LIVE_BASE_URL=https://kmtlegal.saeeddev.com \
KMT_LIVE_ADMIN_EMAIL=... \
KMT_LIVE_ADMIN_PASSWORD=... \
npx playwright test tests/e2e/live-admin-smoke.spec.ts
```

- [ ] `/admin`, `/admin/consultations`, `/admin/cases`, `/admin/reports`, `/admin/audit-log`, and `/admin/settings` load after admin login without `ChunkLoadError` or `Application error`.
- [ ] `_next/static` admin JS/CSS requests return status `< 400` and correct MIME; no JS/CSS response returns `text/html`.
- [ ] `/api/auth/me`, `/api/admin/dashboard`, `/api/admin/consultations`, and `/api/admin/content` return `200` after login.
- [ ] Admin shell/settings copy is Arabic and does not render `Management`, `Admin`, or `Staff 2FA is deferred`.
- [ ] Admin consultation review hides legacy English mock AI placeholders/raw JSON and uses Arabic labels.
- [ ] Mobile smoke passes for `/admin`, `/admin/clients`, and `/admin/content` at `390x844` without page-level horizontal scroll.
- [ ] Fresh admin evidence is archived under `test-results/live-admin-qa-<date>`.

## Accessibility Gates

- [ ] Public, login, booking, portal, and admin pages have meaningful headings.
- [ ] Forms have labels and visible errors.
- [ ] Keyboard can reach primary actions.
- [ ] Dashboard tables expose column headers.
- [ ] Focus states are visible.
- [ ] Mobile target sizes are usable on 390px viewport.

## Security And Privacy Gates

- [ ] Production env matches `deploy/env.production.example`.
- [ ] `KMT_DEMO_PASSWORD` and `KMT_DEMO_TOTP_SECRET` are empty in production.
- [ ] `STAFF_2FA_MODE=disabled`; TOTP is not enabled in this release.
- [ ] `INSTALLER_ENABLED=false` after first setup and installer lock.
- [ ] `SMTP_ENABLED=false`; SMTP UI/backend sending remains disabled for this release.
- [ ] `SESSION_COOKIE_SECURE=true`.
- [ ] `CSRF_STRICT_ORIGIN=true` or unset with production strict mode active.
- [ ] Uploads are outside `public/`.
- [ ] Nginx does not serve uploads directly.
- [ ] Logs do not contain passwords, OTPs, tokens, raw prompts, provider raw responses, legal summaries, document contents, emails, or phone numbers.
- [ ] Analytics events use allowlisted properties only.
- [ ] AI output is review-required and not legal advice.
- [ ] `/stitch-clone/*` returns 404 in production unless `ENABLE_STITCH_CLONE=true`.
- [ ] Nginx passes `X-Real-IP $remote_addr`; app does not trust client-supplied `X-Forwarded-For` in production.
- [ ] Upload oversize `Content-Length` is rejected before multipart parsing.

## Deployment Gates

- [ ] `GET /api/health` returns 200 after migrations, seed, first Super Admin setup, installer lock, and `INSTALLER_ENABLED=false`.
- [ ] VPS service runs in production mode, not `next dev`.
- [ ] Nginx proxies to the app and TLS works.
- [ ] PostgreSQL backup exists before migration.
- [ ] Backup is taken before applying the `ContactMessage` and `phoneCanonical` migration.
- [ ] Upload directory backup exists before release.
- [ ] Rollback target is known.
- [ ] Post-deploy smoke passes.
- [ ] `npm run qa:release` result is archived with this checklist.

## Current Workspace Notes

- Docker CLI is not installed in this workspace, so local PostgreSQL via `docker compose up -d db` could not be executed here.
- DB-backed E2E must be run after PostgreSQL and seed data are available.
- `npm run security:audit` and `npm run security:audit:all` pass after the controlled dependency remediation.
- PLAN-24 remains open until `qa:db`, `qa:release`, and VPS smoke are complete.
- PLAN-27 local remediation has passed `typecheck`, full `test`, `build`, and non-DB smoke E2E in this workspace.
- PLAN-27 remains open until full public/static/mobile smoke, DB-backed staging checks, and deployed-site evidence pass.
