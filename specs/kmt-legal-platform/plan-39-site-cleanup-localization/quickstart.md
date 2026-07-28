# Quickstart: Validate PLAN-39

## Prerequisites

- Node.js and npm versions allowed by `package.json`.
- Dependencies installed from the committed lockfile.
- Synthetic local/staging PostgreSQL data for DB-backed permission and client-session checks.
- Writable synthetic upload directory for client file browser checks.
- No real client records or production mutations.

## Static and contract gates

```powershell
cmd /c npm run db:validate
cmd /c npm run db:generate
cmd /c npm run typecheck
cmd /c npm run lint
cmd /c npm run test
$env:ALLOW_BUILD_WITHOUT_DATABASE_URL='true'; cmd /c npm run build
git diff --check
```

Expected: all commands exit 0. The build contains no `/portal`, `/product-system`, or
`/stitch-clone` page; `/client` remains present.

## PostgreSQL backup-tool compatibility

Run the focused deployment contract test and shell syntax check:

```powershell
cmd /c npx vitest run tests/server/postgres-backup-tool-resolution.test.ts
& 'C:\Program Files\Git\bin\bash.exe' -n deploy/install/aapanel-pm2-update.sh
```

Expected:

- A simulated server major 18 selects a version-18 pair even if a version-16 pair is first on
  `PATH`.
- An older-only version-16 environment fails before backup or migration and names
  `postgresql-client-18` plus `POSTGRES_BACKUP_BIN_DIR` as remediation.
- A compatible explicit directory is selected; an incompatible explicit directory fails closed.
- The selected matching `pg_restore` validates the custom archive.

## Focused server and UI checks

- Contact submission saves the complete synthetic message.
- Eligible active contact readers receive exactly one generic non-sensitive alert.
- Unauthorized lawyer/marketing fixtures receive none.
- Injected notification failure preserves the accepted message and 201 response.
- Bell refreshes on open and on the visible-document 30-second interval.
- Client preference accepts `ar`/`en`, rejects other/additional values, and updates only self.
- Profile form uses `/api/client/profile`; old API returns 404.
- Arabic/English client catalog keys match and raw internal errors are not displayed.

## Browser checks

Run the focused Playwright file through the existing server runner at 1440×900 and 390×844.

Expected:

- `/portal`, `/portal/cases`, `/product-system/cases`, `/stitch-clone/home`, and an arbitrary
  unknown URL return status 404 with the branded page and no `/login` redirect.
- `/admin/*` remains protected; anonymous `/admin` still redirects to login.
- `/client` redirects anonymous users to `/login?next=/client`.
- Authenticated Arabic and English client sessions render every canonical client destination
  with correct `html[lang]`, direction, keyboard focus, no horizontal overflow, localized dates,
  amounts, states, assistant, chat, upload, profile, and recovery copy.
- Language switching persists after reload and a new session.
- Public pages using `/stitch-assets` still load their hero images.

## DB-backed staging acceptance

1. Submit one synthetic public contact message.
2. Confirm inbox detail and alerts for Secretary, Office Admin, and Super Admin defaults.
3. Confirm denied Lawyer and Marketing Staff fixtures.
4. Exercise Arabic and English client accounts with own-data-only cases, appointments, files,
   payments, assistant, team chat, profile, and preference mutation.
5. Archive screenshots, console/network output, and data effects without copying personal data.

## Deployment and live acceptance

After local and staging gates pass:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The server must have `psql` plus a compatible `pg_dump`/`pg_restore` pair. For a PostgreSQL 18
server on Ubuntu, install the `postgresql-client-18` package from the PostgreSQL Apt repository if
the versioned client directory is absent, or set `POSTGRES_BACKUP_BIN_DIR` to an existing
compatible pair. The deploy script never installs packages or skips the backup automatically.

Live checks are read-only:

- ready `/api/health`;
- branded 404 for retired/unknown paths with no login redirect;
- `/client` still redirects anonymous users to login;
- representative public `/stitch-assets` images return successfully;
- no console, CSP, chunk, or static MIME errors.
