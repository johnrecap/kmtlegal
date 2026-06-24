# Install: cPanel

Use this path only for cPanel hosting accounts that can run a real Next.js server application.

## Hard Requirements

The account must provide all of these:

- Node.js App or equivalent persistent Node process.
- PostgreSQL database.
- SSH/Terminal or equivalent command runner.
- Environment variable configuration.
- Private writable directory outside `public_html`.
- Ability to set application root, startup command, app URL, and app port.

If any requirement is missing, this cPanel account is unsupported for KMT Legal.

## Planned Flow

1. Confirm the hard requirements above.
2. Choose database setup mode:
   - `existing` recommended: create PostgreSQL database/user in cPanel or from the host dashboard so the database appears in the panel UI.
   - `auto`: let the script create database/user through `psql` and an admin PostgreSQL URL. This often fails on shared cPanel accounts and may not appear in the panel UI.
3. Create a private uploads folder outside `public_html`.
4. Configure Node.js App with the application root and production environment variables.
5. Run the cPanel-assisted installer:

```bash
bash deploy/install/panel-install.sh --panel=cpanel
```

6. Let preflight verify Node, npm, PostgreSQL, database setup mode, env vars, private uploads, process manager, disabled SMTP, disabled TOTP, and installer token.
7. Run build/migrations/seed only after preflight passes.
8. Open `/install?token=...`, create the first Super Admin, lock the installer, and disable installer mode.

## Unsupported cPanel Cases

- Shared hosting with no Node.js App.
- MySQL-only hosting.
- No SSH/Terminal or equivalent command runner.
- No persistent process manager.
- Uploads can only be stored under `public_html`.
- Secrets cannot be configured as environment variables.

## Security Notes

- Do not move uploads to `public_html` to make setup easier.
- Do not use MySQL as a substitute for PostgreSQL.
- Do not enable SMTP or TOTP in this release.
