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

Live checks are read-only:

- ready `/api/health`;
- branded 404 for retired/unknown paths with no login redirect;
- `/client` still redirects anonymous users to login;
- representative public `/stitch-assets` images return successfully;
- no console, CSP, chunk, or static MIME errors.
