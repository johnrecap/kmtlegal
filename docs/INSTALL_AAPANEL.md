# Install: aaPanel

Use this path when the server is a VPS managed through aaPanel.

## Requirements

- aaPanel on a VPS.
- Node.js project/runtime support or PM2/process manager available.
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

The `/install` UI must render even when database/bootstrap values are incomplete. Missing server values should appear as installer preflight failures, not as a generic 500 page.

## Hard Rules

- Do not run the root Terminal VPS installer unless you intentionally bypass aaPanel service management.
- aaPanel mode must not run `apt-get`, `systemctl`, Certbot, or direct `/etc/nginx` edits.
- Uploads must never be inside the public website root.
