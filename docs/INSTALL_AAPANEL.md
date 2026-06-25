# Install: aaPanel

Use this path when the server is a VPS managed through aaPanel.

## Requirements

- aaPanel on a VPS.
- Node.js `20.19+`, `22.12+`, or `24+` through aaPanel project/runtime support or PM2/process manager.
- PostgreSQL installed or reachable.
- Domain and SSL configured in aaPanel.
- Reverse proxy from the domain to the app port.
- Private uploads path outside the website root.

## Planned Flow

1. Choose database setup mode:
   - `existing` recommended: create a PostgreSQL database and user in aaPanel so the database appears in aaPanel UI.
   - `auto`: let the script create the database through `psql` and an admin PostgreSQL URL. This database may not appear in aaPanel UI.
2. In aaPanel, configure the website/domain and SSL.
3. Choose an internal app port, for example `3000`, and configure reverse proxy to `127.0.0.1:3000`.
4. Create a private uploads directory outside the website root.
5. Run the panel-assisted installer:

```bash
bash deploy/install/panel-install.sh --panel=aapanel
```

6. Provide `DATABASE_URL` if using `existing`, or PostgreSQL admin connection details if using `auto`.
7. Provide `APP_ORIGIN`, `UPLOADS_DIR`, app port, and setup token values when prompted.
8. Let the script run Node/Prisma build, migrations, and seed only after preflight passes.
9. Open `/install?token=...`, create the first Super Admin, lock the installer, and disable installer mode.
10. Verify `GET /api/health` returns `200` before sending users to the app.

The `/install` UI must render even when database/bootstrap values are incomplete. Missing server values should appear as installer preflight failures, not as a generic 500 page.

## Updating An Existing aaPanel + PM2 Site

Use this path for the current `kmtlegal.saeeddev.com` style deployment, where aaPanel owns the domain/reverse proxy and PM2 runs the Node app.

From the server checkout:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The update script loads `/www/wwwroot/kmtlegal/.env.production.local` before running the build, Prisma migrations, and PM2 restart. Keep the production `DATABASE_URL` in that file pointed at the aaPanel PostgreSQL database.

Defaults:

- App directory: `/www/wwwroot/kmtlegal`
- Environment file: `/www/wwwroot/kmtlegal/.env.production.local`
- Git branch: `main`
- PM2 process name: `kmtlegal`
- Internal port: `3000`

Override them only if the server uses different names:

```bash
APP_DIR=/www/wwwroot/kmtlegal \
ENV_FILE=/www/wwwroot/kmtlegal/.env.production.local \
BRANCH=main \
PM2_APP=kmtlegal \
PORT=3000 \
bash deploy/install/aapanel-pm2-update.sh
```

This script pulls the latest GitHub commit, installs dependencies with build-time packages included, preserves the previous `.next/static` assets for open browser tabs and cached HTML, builds a fresh Next.js release, runs production migrations, restarts or starts the PM2 process, saves PM2 state, and checks the local app response.

If a browser tab was open during deployment, it may still hold HTML or runtime state from the previous build. Preserving old static assets prevents most `ChunkLoadError` failures while the user refreshes into the new build.

Do not stop the install/build with `Ctrl+C`. If `npm` is interrupted, the source code may be up to date while the live app still serves the old compiled build.

## Hard Rules

- Do not run the root Terminal VPS installer unless you intentionally bypass aaPanel service management.
- aaPanel mode must not run `apt-get`, `systemctl`, Certbot, or direct `/etc/nginx` edits.
- Uploads must never be inside the public website root.
