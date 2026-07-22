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
- [ ] `npm run jobs:payments` completes once against the intended database.
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
- [ ] Paid consultation webhook with matching amount and currency confirms the appointment.
- [ ] Paid consultation webhook with a lower amount or different currency does not confirm the appointment and is visible for manual review.
- [ ] Public payment status without a status token does not return client name, phone, account setup links, checkout URL, or receipt URL.
- [ ] Public payment status without a status token does not return legal request summary, city, urgency, preferred mode, or service category.
- [ ] Public payment status with a valid status token returns the allowed full result for the returning payer.
- [ ] Expired payment attempt releases the temporary reserved appointment through `npm run jobs:payments`.
- [ ] Admin finance CSV export respects current date/status/currency filters.
- [ ] Admin finance payment operations filters work for payment attempts and webhook events.
- [ ] Admin finance webhook money reconciliation shows requested client amount/currency, provider webhook amount/currency, provider status, and the reconciliation result; Paymob-only filtering works.
- [ ] Admin finance shows amount/currency mismatch, invalid signature, failed webhook, and expired attempt issues as manual-review items.
- [ ] Manual paid records reject gateway-managed payment method names and duplicate client receipt numbers.
- [ ] `npm run predeploy:payments` reports `ok:true` before `npm run db:migrate` on the deployment database.
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
- [ ] Mobile payment smoke at 390px covers booking review, payment return pending/paid/failed/expired, receipt link, client payments, and admin finance filters.
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

## PLAN-35 Admin Operations Gates

Canonical evidence index: `docs/evidence/PLAN_35_ADMIN_OPERATIONS.md`.

Local contract and implementation evidence:

- [x] All 23 PLAN-35 affected method/path/permission/error/consumer rows pass the bidirectional
  route/OpenAPI inventory.
- [x] `npm run db:validate` and `npm run db:generate` pass without connecting to PostgreSQL.
- [x] `npm run typecheck`, `npm run lint`, and full `npm run test` pass.
- [x] `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build` passes and is labeled local-only.
- [x] `npm run test:e2e:plan35` passes its local shared-shell checks; authenticated skips are recorded
  and do not count toward Browser-Verified.
- [x] `git diff --check` passes.

Disposable database and authenticated acceptance (remain open without the required environment):

- [ ] `DATABASE_URL` identifies a disposable nonproduction PostgreSQL target; production is excluded.
- [ ] `npm run qa:db` runs migration, double seed, legacy DB E2E, and
  `tests/e2e/plan35-db-backed.spec.ts` with no required skip.
- [ ] Five disposable staff personas execute all nineteen navigation/page/API route rows (95 cells).
- [ ] Authenticated command-center, contact, notification, manual-case, role/session, accessibility,
  RTL, console/network, and deterministic screenshot scenarios pass at all five required viewports.
- [ ] Read-only `npm run test:e2e:live-admin` runs with external `KMT_LIVE_*` credentials and every
  protected document/API probe returns its exact documented outcome.

Evidence rules:

- [x] `PASS`, `FAIL`, `BLOCKED`, and `SKIPPED` are distinct; skip/collection/missing infrastructure
  never advances the release state.
- [x] Allowed progression is contiguous:
  `Local-Verified -> DB-Verified -> Browser-Verified -> Live-Accepted`.
- [x] No production migration, seed, fixture mutation, concurrency run, credential, or client/legal
  data is used for PLAN-35 acceptance.

## Accessibility Gates

- [ ] Public, login, booking, portal, and admin pages have meaningful headings.
- [ ] Forms have labels and visible errors.
- [ ] Keyboard can reach primary actions.
- [ ] Dashboard tables expose column headers.
- [ ] Focus states are visible.
- [ ] Mobile target sizes are usable on 390px viewport.

## Security And Privacy Gates

- [ ] Production env matches `deploy/env.production.example`.
- [ ] `PAYMENT_STATUS_SIGNING_SECRET` or `PAYMENT_RECEIPT_SIGNING_SECRET`/`AUTH_SECRET` is set before enabling paid booking.
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
- [ ] `MALWARE_SCAN_MODE=required`, ClamAV answers `clamdscan --ping`, and `/api/health` reports `storage.malware_scan` healthy.
- [ ] Controlled EICAR upload returns `MALWARE_DETECTED`, writes no private file, and creates no `Document` row.
- [ ] `PAYMENT_PROVIDER=paymob`, `PAYTABS_ENABLED=false`, and admin shows PayTabs as disabled standby.
- [ ] `consultation.booking` remains free during PLAN-34 deploy; `AI_CHAT_PAID` is not enabled.
- [ ] Sentry remains disabled unless DSN/auth token/org/project are configured together; a controlled enabled test sends no request body, cookies, headers, email, phone, or client identity.
- [ ] Payment webhook and checkout audit metadata do not include client phone, email, raw provider payloads, or account setup tokens.
- [ ] Payment webhook routes accept trusted provider POST callbacks without browser `Origin/Referer`, while admin/API mutations still reject missing or cross-origin mutation headers.
- [ ] Signed payment-status links expire and fall back to safe public status without client details, receipt links, checkout links, or account setup links.
- [ ] Duplicate provider transaction ids cannot move a transaction to a different payment attempt, and duplicate webhook event ids with different payload hashes are flagged for review without overwriting the original event.
- [ ] Payment webhook event rows include only redacted provider payload snapshots; raw phone/email/name values are not stored in audit payload snapshots.
- [ ] Manual paid payment receipt/reference numbers cannot be duplicated after the payment audit follow-up migration.
- [ ] `kmtlegal-payment-maintenance` stays online under PM2 after deploy, and its restart counter does not increase across two checks about one minute apart.
- [ ] Payment maintenance alert payloads, if enabled, do not include stack traces, database URLs, raw webhook payloads, legal summaries, emails, phones, tokens, or secrets.

## Deployment Gates

- [ ] `GET /api/health` returns 200 after migrations, seed, first Super Admin setup, installer lock, and `INSTALLER_ENABLED=false`.
- [ ] VPS service runs in production mode, not `next dev`.
- [ ] Payment maintenance runs as a recurring cron/PM2 process using `npm run jobs:payments` or `npm run jobs:payments:watch`.
- [ ] If `PAYMENT_MAINTENANCE_ALERT_WEBHOOK_URL` is configured, a safe test failure reaches the internal alert destination.
- [ ] Nginx proxies to the app and TLS works.
- [ ] PostgreSQL backup exists before migration.
- [ ] Backup is taken before applying the `ContactMessage` and `phoneCanonical` migration.
- [ ] Upload directory backup exists before release.
- [ ] Rollback target is known.
- [ ] Post-deploy smoke passes.
- [ ] Unknown `/admin/*` and `/portal/*` paths return the localized not-found recovery state instead of a placeholder or redirect to `/client`.
- [ ] Public mobile language switch is visible at 390px and article/case-study alternates never link to a missing localized detail.
- [ ] `npm run qa:release` result is archived with this checklist.

## Current Workspace Notes

- Docker CLI is not installed in this workspace, so local PostgreSQL via `docker compose up -d db` could not be executed here.
- DB-backed E2E must be run after PostgreSQL and seed data are available.
- `npm run security:audit` and `npm run security:audit:all` pass after the controlled dependency remediation.
- PLAN-34's Sentry integration resolves to `@sentry/nextjs@10.64.0`; the controlled update removed the inherited OpenTelemetry advisory and both dependency audit commands report zero vulnerabilities.
- PLAN-24 remains open until `qa:db`, `qa:release`, and VPS smoke are complete.
- PLAN-27 local remediation has passed `typecheck`, full `test`, `build`, and non-DB smoke E2E in this workspace.
- PLAN-27 remains open until full public/static/mobile smoke, DB-backed staging checks, and deployed-site evidence pass.
