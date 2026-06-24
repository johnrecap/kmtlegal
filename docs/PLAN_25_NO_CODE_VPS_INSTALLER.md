# PLAN-25 No-Code VPS Installer & First Admin Bootstrap

Date: 2026-06-24

## Goal

Provide a CodeCanyon-style VPS setup path for KMT Legal:

- Run one VPS script.
- Open `/install?token=...`.
- Run preflight.
- Create the first Super Admin.
- Lock the installer.
- Disable installer mode before release-ready status.

## Locked Decisions

- PLAN-25 target was Terminal VPS. PLAN-26 extends setup planning to aaPanel and conditional cPanel through panel-aware preflight.
- Staff TOTP is deferred and disabled.
- `STAFF_2FA_MODE=disabled` is the supported release mode.
- Staff and Super Admin login is email/password only until a future Staff 2FA Rework plan.
- SMTP remains disabled: `SMTP_ENABLED=false`.
- First Super Admin bootstrap must not create TOTP credentials.
- Super Admin only can create user email accounts and change user passwords.
- Installer must be protected by setup token and locked after setup.

## Implementation Surfaces

- Auth:
  - Staff sessions become `ACTIVE` after password login while 2FA is disabled.
  - `/login/2fa` is hidden/404.
  - `/api/auth/2fa/totp/verify`, `/api/auth/2fa/email/*`, and `/api/admin/users/{id}/2fa/reset` return `FEATURE_DISABLED`.

- Installer:
  - `/api/install/status`
  - `/api/install/preflight`
  - `/api/install/bootstrap-super-admin`
  - `/api/install/finish`
  - `/install` wizard.

- VPS:
  - `deploy/install/install.sh`
  - `/etc/kmt-legal/kmt-legal.env`
  - `/var/lib/kmt-legal/uploads`
  - `/var/lib/kmt-legal/install.lock`
  - `sudo kmt-legal-disable-installer` after wizard lock.

## Production Rules

- `INSTALLER_ENABLED=true` is allowed only during first setup.
- Production readiness fails if `INSTALLER_ENABLED=true`.
- Production readiness fails if `STAFF_2FA_MODE=totp`.
- Nginx must not serve uploads directly.
- Demo credentials must remain empty in production.

## Verification

- Unit/contract:
  - installer token validation
  - installer bootstrap schema
  - disabled TOTP route behavior
  - staff login without 2FA
  - production readiness catches enabled TOTP/installer

- Browser/VPS:
  - open installer URL with token
  - preflight succeeds
  - first Super Admin created
  - installer lock written
  - `/install` unavailable after disabling installer env
  - Super Admin login reaches `/admin` without `/login/2fa`

## Deferred

- TOTP enrollment UX.
- TOTP recovery/reset policy.
- Email OTP fallback.
- SMTP activation and delivery UI.
