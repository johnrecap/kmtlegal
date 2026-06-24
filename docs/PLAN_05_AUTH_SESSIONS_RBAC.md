# PLAN-05 Auth, Sessions, Roles & Permissions

Last updated: 2026-06-24

Status: implemented for MVP auth foundation and protected route entry points; DB-backed runtime smoke remains dependent on PLAN-04 PostgreSQL availability.

## PLAN-25 Superseding Note

Staff 2FA/TOTP is deferred and disabled for the current installer release. The active login flow is email/password -> active session for staff and clients while `STAFF_2FA_MODE=disabled`. `/login/2fa`, TOTP verify, Email OTP, and staff 2FA reset routes are disabled placeholders. Keep the older TOTP notes below only as historical context for a future Staff 2FA Rework.

## Scope Completed

- Secure server-side session model added through Prisma `Session`.
- Password hashing/verification added with Node `scrypt`.
- Central role/permission policy added in `src/server/auth/policy-data.json`.
- RBAC helpers added in `src/server/auth/policy.ts`.
- Object-scope helpers added for client-owned and lawyer-assigned resources.
- Cookie policy added:
  - `HttpOnly`
  - `SameSite=Lax`
  - production-only secure cookie unless `SESSION_COOKIE_SECURE` overrides
- Staff 2FA rules added:
  - Lawyer, Office Admin, Marketing Staff, Super Admin require 2FA.
  - Client sessions do not require 2FA in MVP.
  - Password success creates `PENDING_2FA` for staff and `ACTIVE` for clients.
- TOTP implementation added with RFC-compatible verification.
- Email OTP helper primitives remain in code for a future activation plan, but Email OTP UI and routes are disabled in this release.
- Staff 2FA reset path added with audit log.
- Login UI added at `/login`.
- Staff 2FA UI added at `/login/2fa`; it accepts TOTP only.
- Staff 2FA page validates a pending 2FA session before rendering; stale or expired challenges redirect back to `/login?reason=2fa_expired`.
- Dashboard shell exposes a same-origin logout form for staff and client protected areas.
- Protected admin entry route added at `/admin`.
- Protected client portal entry route added at `/portal`.
- Middleware redirects unauthenticated `/admin/*` and `/portal/*` requests to `/login?next=...`.
- Server page guards still verify the active session and role after middleware.

## Route Handlers

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/2fa/totp/verify`
- `POST /api/auth/2fa/email/send` returns `FEATURE_DISABLED`
- `POST /api/auth/2fa/email/verify` returns `FEATURE_DISABLED`
- `POST /api/admin/users/{userId}/2fa/reset`

## Security Notes

- No tokens are stored in localStorage.
- Session cookies carry only opaque random tokens.
- Database stores only `tokenHash`.
- TOTP secrets are sealed with `AUTH_SECRET`; production requires a real `AUTH_SECRET`.
- Email OTP is not a valid login fallback in this release because SMTP is deferred and disabled.
- Audit rows are created for login failures, pending 2FA login, TOTP verification, and staff 2FA reset.
- `next` redirects are sanitized so clients cannot be redirected to `/admin`, staff cannot be redirected to `/portal`, and external URLs are rejected.
- Authenticated redirects treat `/` and `/login` as neutral entry points and send users to their role default (`/admin` for staff, `/portal` for clients).
- Local non-strict mutation origin checks treat `localhost` and `127.0.0.1` on the same port as equivalent for browser testing; production strict origin checks still require the configured canonical origin.
- UI route guards are convenience only; protected APIs and server pages enforce auth server-side.

## Production Follow-Up

- Keep `SMTP_ENABLED=false` for this release.
- Do not expose Email OTP UI or rely on Email OTP routes for staff login.
- Production auth must use a real `AUTH_SECRET`; do not reuse local demo secrets or seeded demo credentials.
- Re-run browser smoke before release: staff login -> TOTP -> `/admin`; client login -> `/portal`.
- The local PGlite/socket fallback used during development is not a production database path. Production remains VPS PostgreSQL per PLAN-04 and deployment planning.

## Verification

- `npm run test` covers password hashing, role policy, required staff 2FA, client no-2FA path, wrong TOTP, email OTP hash helper behavior, redirect boundaries, protected path detection, session cookie extraction, and the 2FA reset audit contract.
- DB-backed E2E uses TOTP for staff login.

## Remaining Runtime Smoke

- Run login -> staff TOTP -> `/api/auth/me` against a migrated PostgreSQL database.
- Run client login -> `/portal` and staff login -> `/admin` in browser after `npm run db:seed`.
