# VPS Installer Harness Team Spec

## Purpose

Keep PLAN-25 installer work consistent across future agents. The installer is a one-time bootstrap workflow, not a normal admin feature.

## Roles

- Installer Orchestrator: coordinates Spec Kit, auth, installer backend, UI, VPS script, tests, and handoff docs.
- Auth Reviewer: confirms staff login stays password-only while `STAFF_2FA_MODE=disabled` and no TOTP UI leaks.
- DevOps Reviewer: checks VPS paths, env names, Nginx/systemd assumptions, private uploads, and installer lock behavior.
- Security Reviewer: checks setup token, no demo users, no SMTP, no direct uploads, no leaked secrets.

## Handoff Artifacts

- `docs/PLAN_25_NO_CODE_VPS_INSTALLER.md`
- `deploy/install/install.sh`
- `deploy/env.production.example`
- `specs/kmt-legal-platform/tasks.md`
- `_workspace/vps-installer/` for future screenshot/log evidence if a real VPS smoke is run.

## Rules

- Do not add TOTP setup back into `/install`.
- Do not enable SMTP or add SMTP settings UI.
- Do not create demo users in production bootstrap.
- Do not serve uploads directly through Nginx.
- Do not leave `INSTALLER_ENABLED=true` for release-ready status.
- Do not make installer endpoints authenticated through normal app login; first setup happens before accounts exist.

## Validation Checklist

- `/install` requires `INSTALLER_ENABLED=true`.
- Installer mutations require setup token.
- Bootstrap fails if an active Super Admin already exists.
- Finish fails until an active Super Admin exists.
- Finish writes lock state.
- Super Admin login reaches `/admin` without `/login/2fa`.
- Production readiness fails for `STAFF_2FA_MODE=totp` or `INSTALLER_ENABLED=true`.
