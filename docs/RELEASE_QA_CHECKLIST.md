# Release QA Checklist

Date: 2026-06-24

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
- [ ] Resolve current npm audit blockers before production release.

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
- [ ] Upload directory backup exists before release.
- [ ] Rollback target is known.
- [ ] Post-deploy smoke passes.
- [ ] `npm run qa:release` result is archived with this checklist.

## Current Workspace Notes

- Docker CLI is not installed in this workspace, so local PostgreSQL via `docker compose up -d db` could not be executed here.
- DB-backed E2E must be run after PostgreSQL and seed data are available.
- `npm run security:audit` currently fails and blocks release clearance.
- PLAN-24 remains open until `qa:db`, `qa:release`, dependency audit remediation, and VPS smoke are complete.
