# PLAN-26 Panel-Aware Installer

Date: 2026-06-24

## Purpose

Make KMT Legal installation choose the hosting path before any setup command runs:

- Terminal VPS
- aaPanel
- cPanel

This plan does not claim every shared-hosting account can run the app. KMT Legal is a Next.js server application with Prisma/PostgreSQL, private upload storage, migrations, and a persistent Node.js process. Any hosting path that cannot provide those requirements must fail preflight before build, migration, or first-admin bootstrap.

## Supported Modes

### `terminal-vps`

Use for a fresh Ubuntu/Debian VPS with root or sudo.

Allowed behavior:

- Install OS packages.
- Install/configure Node.js, PostgreSQL, Nginx, Certbot, and systemd.
- Write `/etc/kmt-legal/kmt-legal.env`.
- Create `/var/lib/kmt-legal/uploads`.
- Run build, migrations, production seed, start service.
- Print `/install?token=...`.

Primary artifact:

- `deploy/install/install.sh`

### `aapanel`

Use when aaPanel owns the VPS services.

Required operator setup before app install:

- PostgreSQL database and user.
- Domain and SSL in aaPanel.
- Reverse proxy to the app's local Node port.
- Private uploads directory outside the website root.

Installer rules:

- Must not run `apt-get`.
- Must not run `systemctl`.
- Must not edit `/etc/nginx` directly.
- Must not request Certbot directly unless aaPanel explicitly delegates that path.
- Must collect `DATABASE_URL`, `APP_ORIGIN`, `UPLOADS_DIR`, app port, and env values.
- Must run Node/Prisma build steps only after preflight passes.

### `cpanel`

Use only for cPanel accounts with all hard requirements.

Hard requirements:

- Node.js App or equivalent persistent Node process.
- PostgreSQL database access.
- SSH/Terminal or equivalent command runner for `npm` and Prisma commands.
- Environment variable support.
- Private writable uploads path outside `public_html`.
- Ability to set application root/startup command and app URL.

Unsupported cPanel cases:

- Static-only hosting.
- MySQL-only hosting.
- No SSH/Terminal or command runner.
- No persistent Node process.
- Uploads forced under `public_html`.
- No way to set secrets as environment variables.

If any hard requirement is missing, the installer must stop with a clear unsupported-hosting message.

## Preflight Contract

Every mode must verify:

- Node.js version is `20.19+`, `22.12+`, or `24+`.
- `npm` is available.
- `DATABASE_URL` points to PostgreSQL.
- `DB_SETUP_MODE` is `existing` or `auto`.
- `APP_ORIGIN` is configured.
- `AUTH_SECRET` is present.
- `STORAGE_DRIVER=vps-filesystem`.
- `UPLOADS_DIR` exists or can be created and is outside public webroot.
- `MAX_UPLOAD_MB=5`.
- `SMTP_ENABLED=false`.
- `STAFF_2FA_MODE=disabled`.
- `INSTALLER_ENABLED=true` during setup.
- `INSTALLER_SETUP_TOKEN` exists.
- `HOSTING_MODE` is one of `terminal-vps`, `aapanel`, or `cpanel`.
- `APP_PORT` or `PORT` is configured for panel modes.
- `PANEL_REVERSE_PROXY_READY=true` is set for aaPanel mode after the panel proxy is configured.
- `CPANEL_NODE_APP_READY=true` and `CPANEL_COMMAND_RUNNER_READY=true` are set for cPanel mode after hard requirements are confirmed.
- No active Super Admin already exists before bootstrap.
- Installer lock is absent before setup and present after finish.

## Implementation Plan

1. Add a setup mode selector contract with values `terminal-vps`, `aapanel`, and `cpanel`.
2. Add a panel preflight script or service that runs read-only compatibility checks before install.
3. Keep `deploy/install/install.sh` as Terminal VPS mode.
4. Add `deploy/install/panel-install.sh` for aaPanel/cPanel assisted installation without root-only commands.
5. Let the operator choose `existing` database mode, recommended for panel visibility, or `auto` database mode, which requires `psql` and a PostgreSQL admin URL and may not appear in panel UI.
6. Add `/install` copy/state that reflects the selected hosting mode after infrastructure preflight passes.
7. Add panel docs with screenshots or field names for aaPanel/cPanel once tested on real panels.
8. Add static tests ensuring panel mode never contains root-only command paths.
9. Run smoke on each supported hosting class before closing PLAN-26.

## Acceptance Criteria

- User chooses hosting mode before setup begins.
- Terminal VPS mode can keep the current one-command installer.
- aaPanel mode gives panel-specific instructions and avoids direct service mutation.
- cPanel mode works only when all hard requirements pass and rejects unsupported shared hosting early.
- First Super Admin bootstrap remains token-protected and no-TOTP.
- SMTP stays disabled in all modes.
- Installer locks after setup and production requires `INSTALLER_ENABLED=false`.

## Deferred

- Docker packaging.
- Windows hosting.
- Shared hosting without Node.js/PostgreSQL.
- MySQL support.
- SMTP activation.
- Staff TOTP reactivation.
