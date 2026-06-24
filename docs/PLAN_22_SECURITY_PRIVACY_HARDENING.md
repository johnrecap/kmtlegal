# PLAN-22 Security, Privacy, Upload & Observability Hardening

Date: 2026-06-24

## Scope

PLAN-22 hardens the already implemented MVP slices before release. It does not add product features or redesign UI.

## Implemented

- Global browser security headers are configured through `security-headers.cjs` and imported by `next.config.mjs`.
- CSP now blocks framing, object embeds, cross-origin defaults, and unsafe resource classes while keeping current Next/Stitch rendering compatible.
- `/api/*` state-changing requests now pass through an Origin/Referer guard in `src/middleware.ts`.
- Production mode rejects missing Origin/Referer for API mutations by default. Local/dev may allow missing headers unless `CSRF_STRICT_ORIGIN=true`.
- Audit and safe-log redaction now masks sensitive keys plus email and phone values inside free text.
- Production readiness checks now cover VPS-class deployment assumptions: HTTPS origin, secure cookies, private upload directory outside public webroot, 5MB upload contract, exact MIME allowlist, disabled SMTP state, demo credential ban, and AI provider completeness.
- Package scripts now define dependency audit commands:
  - `npm run security:audit`
  - `npm run security:audit:all`
- Security hardening tests cover headers, Origin guard, redaction, and production readiness.

## Decisions

- HSTS is not emitted by the app yet. It should be enabled at Nginx/VPS after HTTPS is verified to avoid breaking local or first production cutover.
- CSP still permits inline script/style because the current Next/Stitch output is not nonce-wired. A stricter nonce/hash CSP is deferred until the app shell is ready for that migration.
- Middleware Origin/Referer protection is the MVP CSRF defense for cookie-authenticated Route Handlers. SameSite=Lax cookies remain defense in depth.
- Uploads remain private VPS filesystem storage under a non-public directory; Nginx must not serve the upload directory directly.
- Observability remains internal/privacy-safe. No external Sentry or analytics provider is wired until a no-PII configuration is approved.

## VPS Release Checks

Before release, production env must satisfy:

- `NODE_ENV=production`
- `APP_ENV=production`
- `APP_ORIGIN=https://...`
- `AUTH_SECRET` is production-only and at least 32 characters.
- `SESSION_COOKIE_SECURE=true`
- `CSRF_STRICT_ORIGIN=true` or unset so production strict mode remains active.
- `STORAGE_DRIVER=vps-filesystem`
- `UPLOADS_DIR=/var/lib/kmt-legal/uploads` or another private non-webroot directory.
- `MAX_UPLOAD_MB=5`
- `ALLOWED_UPLOAD_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png`
- `SMTP_ENABLED=false` is configured because SMTP sending is deferred and disabled in this release.
- Demo login env values are empty.
- Nginx proxies to Next.js and does not expose `/var/lib/kmt-legal/uploads`.
- PostgreSQL and upload directory backups are scheduled and restore-tested.

## Remaining For PLAN-23

- Run DB-backed browser smoke once PostgreSQL and uploads are available.
- Add VPS Nginx/systemd/Docker handoff commands.
- Run dependency audit against the live npm advisory service.
- Run Playwright E2E for booking -> admin convert -> client portal -> upload/download.
- Decide whether to add HSTS at Nginx after HTTPS validation.
