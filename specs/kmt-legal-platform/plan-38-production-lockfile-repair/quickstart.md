# Quickstart: Production Lockfile Repair

## Prerequisites

- Node.js satisfying the range in `package.json`
- npm 11.6.2
- Clean review of unrelated worktree changes

## Local validation (Windows)

```powershell
npm.cmd --version
npm.cmd install --package-lock-only
git diff -- package.json package-lock.json
npm.cmd ci
git diff --exit-code -- package-lock.json
npm.cmd run typecheck
$env:ALLOW_BUILD_WITHOUT_DATABASE_URL='true'
npm.cmd run build
```

Expected:

- npm reports `11.6.2`.
- `package.json` has no diff.
- The lockfile diff contains only npm-generated resolution metadata.
- `npm ci`, typecheck, and build exit 0.
- `npm ci` does not further modify the lockfile.

## Production deployment

After the verified commit is pushed to `origin/main`:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

Do not replace this with `npm run dev` or an uncommitted production-side lockfile edit.

## Live acceptance

```bash
curl -fsS https://kmtlegal.org/api/health
curl -fsS https://kmtlegal.org/sitemap.xml | grep 'https://kmtlegal.org'
! curl -fsS https://kmtlegal.org/sitemap.xml | grep -q 'kmtlegal.saeeddev.com'
```

Expected:

- Health reports `ready` and the new pushed release.
- Sitemap URLs use only `https://kmtlegal.org`.
- The former domain remains available until these checks pass.
