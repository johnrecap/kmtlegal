# 05 — Auth, Users, Roles, Permissions

## End-to-end trace

1. User sees: `/login` (email + password; `?next=` sanitized, `?locale=`).
2. Frontend posts to `POST /api/auth/login` (`src/app/api/auth/login/route.ts:17-47`).
3. Backend: zod validates → per-`email:ip` rate limit (10/15m) →
   `loginWithPassword` (lowercases email, `verifyPassword`, audits
   `auth.login_failed/success|pending_2fa`) → `setSessionCookie`.
4. Session: `randomBytes(32).base64url`, only `sha256` stored
   (`src/server/auth/session.ts:7-13`); cookie `kmt_session`, httpOnly,
   lax, secure in prod, 8h TTL (`constants.ts`, `session.ts:29-37`).
5. Resolve per request: `getAuthContextFromCookieHeader()` rejects
   revoked/expired/inactive-role/`PENDING_2FA` unless 2FA-finalize path
   (`session-store.ts:151-189`). Principal = `{id, roleName, permissions[],
   clientId}`.
6. Logout: `POST /api/auth/logout` revokes by `tokenHash` + clears cookie
   (HTML accept → 303 login).

## Individual verdicts

| Item | Status | Confidence | Evidence |
|---|---|---|---|
| Login | WORKING | HIGH | Route + service + rate limit + audit; Phase 13 login-redirect gates green |
| Logout | WORKING | HIGH | Revoke + clear + redirect |
| Sessions (DB, hashed) | WORKING | HIGH | `session.ts`, `session-store.ts` |
| Client auth (portal guard) | WORKING | HIGH | `requirePortalPage` + `clientPortalGuardIssue` + `own*Where` scoping |
| Admin auth (staff guard) | WORKING | HIGH | `requireAdminPage` + `canAccessAdminPath` + per-service asserts |
| Setup-account flow | PARTIAL | MEDIUM | HMAC token (v1/v2, 30min) → creates/links user; needs live consultation |
| Password hashing (scrypt) | WORKING | HIGH | `password.ts:1-46`, N=16384, timing-safe verify |
| Password reset (self-service) | DEFERRED | HIGH | No forgot/reset flow; admin-driven resets only |
| 2FA | DISABLED | HIGH | `STAFF_2FA_MODE=disabled`; routes `503`; `/login/2fa` notFound |
| Role guards (pages) | WORKING | HIGH | `page-guards.tsx:26-78` |
| Permission guards (API) | WORKING | HIGH | Sampled users/password, cases, clients, roles — all server-side |
| Route protection (middleware) | PARTIAL | HIGH | Cookie-presence redirect only; roles enforced deeper (by design) |
| CSRF | PARTIAL | MEDIUM | Origin/Referer mutation guard, no token; webhooks exempt (HMAC instead) |
| Brute-force protection | WORKING | MEDIUM | DB+memory rate limits on login/2FA/upload/AI/contact |

## Roles (7) — `policy-data.json:2-10`

`Guest, Client, Lawyer, Secretary, Office Admin, Marketing Staff, Super Admin`.
Staff = all but Guest/Client. Defaults: Guest = public reads; Client = own
data; Lawyer = assigned scope; Secretary ≈ Office Admin = office-wide ops +
`client.account.manage`; Marketing = content create; Super Admin = `["*"]`
+ hardcoded bypass (`policy.ts:26-28`).

## Permission groups (~64 keys)

`audit, appointment, case, caseStudy, client, contact, content, conversation,
consultation, document, finance, report, role, permission, user, settings,
service, session, task, note, notification, payment, lawyer, socialDraft,
twoFactor` — pattern `resource.action.scope` (`any|assigned|own|self`).

## WHO CAN DO IT (high-risk actions)

- Change staff password: exact Super Admin only, live session revalidated
  inside TX (`governance-service.ts:306-398`). Server-enforced.
- Edit roles/permissions: `role.manage.any` + `permission.manage.any` +
  exact Super Admin (`role-permission-service.ts:44-74`). Server-enforced.
- Reset client portal password: `client.account.manage`
  (`client-crm-service.ts:701-749`), audited, optional session revoke.
- Refund execution: NOBODY (no API) — reversals are record-only.
- Content publish: `content.approve.any`; case-study publish additionally
  requires anonymization proof.

## Mismatches / risks

- No UI-only holes found in sampled paths (nav filtering is defense-in-depth;
  services re-check). Full-matrix UI/API parity not exhaustively proven →
  residual MEDIUM confidence, P2 recommendation (automated guard-matrix test).
- 2FA disabled weakens staff-account security → P1 (enable TOTP).
- No self-service reset → users depend on admins (operational, P2).
- scrypt (not argon2/bcrypt) — acceptable, LOW.
