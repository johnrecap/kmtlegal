# PLAN-18 Admin Users, Settings & Audit Log

Last updated: 2026-07-22

Status: Done

## PLAN-25 Superseding Note

User creation and password changes are Super Admin-only. Staff 2FA reset UI/API is disabled in the current release, and admin user screens must not show 2FA columns, filters, or reset actions. TOTP returns in a future Staff 2FA Rework only.

## PLAN-35 Storage Superseding Note

`storage.policy` is no longer an editable or authoritative system setting. Effective upload and
scanner behavior comes from the server environment. `/admin/settings` shows a safe, read-only,
one-shot runtime diagnostic and rejects legacy `storage.policy` updates.

## Scope Delivered

PLAN-18 adds the Super Admin governance surfaces for staff/user administration, allowlisted system settings, and searchable audit review.

### Admin UI

- `/admin/users`
  - User list with search, role filter, status filter, 2FA state filter, sorting, pagination, and empty-state recovery.
  - Shows role, account status, 2FA recovery state, session count, assigned work counts, and last update time.
  - Shows a create-account form only to exact `Super Admin`.
- `/admin/users/[userId]`
  - User detail summary, role-derived permission badges, recent sessions, recent audit entries, client/lawyer profile links where present.
  - Edit panel for name, phone, role, account status, and locale.
  - Password change panel only for exact `Super Admin`.
  - Staff 2FA reset action using the existing Super Admin reset contract.
- `/admin/settings`
  - Three generic setting groups only:
    - `office.profile`
    - `security.staff2fa`
    - `email.policy`
  - A separate read-only storage diagnostic reports effective driver, upload limit/type allowlist,
    configured-path presence, root writability class, scanner mode/reachability, and check time
    without exposing the path, host, secrets, or legacy setting metadata.
  - `email.policy` is read-only/disabled for this release. It documents the deferred SMTP state but has no save UI.
  - Settings are non-secret operational policy values. Production secrets remain environment variables.
- `/admin/audit-log`
  - Audit search and filters for actor, action, resource type, date range, sort order, and pagination.
  - Audit rows are shown through a client-friendly DTO with Arabic event labels, summaries, categories, severity badges, and allowlisted detail fields.
  - Raw action/resource identifiers remain available only inside a small technical disclosure for governance review; raw metadata JSON is not the default display.

### Server Contracts

- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/admin/users/{userId}`
- `PATCH /api/admin/users/{userId}`
- `POST /api/admin/users/{userId}/password`
- `POST /api/admin/users/{userId}/2fa/reset`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings/{key}`
- `GET /api/admin/audit-log`

The settings read contract is now `{ settings, storageRuntimeDiagnostic }`. The generic settings
array excludes `storage.policy`, and its dynamic PATCH route returns `409 SETTING_READ_ONLY` after
the normal settings-management authorization check.

All new PLAN-18 contracts use the existing request validation, error response, request id, session, RBAC, and audit primitives.
The audit log read contract maps stored `AuditLog` records to a presentation DTO instead of returning raw Prisma rows.

### Permissions

- User list/edit governance requires `user.manage.any`.
- Creating user email accounts requires exact `Super Admin` plus `user.manage.any`.
- Changing any user password requires exact `Super Admin` plus `user.manage.any`.
- Settings governance requires `settings.manage.any`.
- Audit review requires `audit.read.any`.
- Staff 2FA reset keeps the existing `twoFactor.reset.staff`/Super Admin reset path.

The current seed policy gives these broad governance capabilities to `Super Admin` through `*`. `Office Admin` remains operational, not governance-level.

### Data Model

No new Prisma migration was required. PLAN-18 reuses existing tables:

- `User`
- `Role`
- `Permission`
- `RolePermission`
- `Session`
- `StaffTwoFactorCredential`
- `SystemSetting`
- `AuditLog`

### Audit Events

- User creation appends `user.create`.
- User updates append `user.update`.
- Super Admin password changes append `user.password.update`.
- Setting updates append `settings.update`.
- Staff 2FA reset uses the existing reset audit event from the auth service.
- Audit read DTOs translate these event codes for non-technical administrators while preserving the raw database audit trail.

## Guardrails

- The actor cannot change their own active Super Admin access by changing their own role or disabling their own account.
- Role assignment is limited to active non-Guest roles.
- Staff users get a `RESET_REQUIRED` 2FA credential when moved into a staff role and no staff 2FA credential exists.
- Super Admin-created staff accounts also get `RESET_REQUIRED` 2FA so they must finish TOTP setup before normal staff access.
- Legacy `storage.policy` rows are ignored by reads and writes are rejected; VPS storage policy,
  upload limit/type allowlist, root, and scanner behavior are derived from environment/runtime state.
- `SystemSetting` is not used for SMTP passwords, API keys, or other production secrets.
- SMTP configuration UI/backend is disabled in this release; env placeholders remain documented for a future activation plan.

## Deferred

- Invite email flow for new staff accounts.
- Email password reset workflow.
- Per-permission editing on a user; MVP uses role assignment with read-only permission visibility.
- Production secret editing in settings.
- Full audit export.
- SMTP activation and Email OTP fallback.

## Verification

- `npm run typecheck`
- `npm run test`
- `npm run lint`
- `npm run build`

Focused tests:

- `tests/server/admin-governance.test.ts`

Browser smoke must use `superadmin@kmt.local` because `office.admin@kmt.local` is intentionally blocked from PLAN-18 governance pages.
