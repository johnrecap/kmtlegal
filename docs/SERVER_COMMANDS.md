# Server Commands

This file is the project reference for local Git commands, server pull/deploy commands, and runtime commands. Use it when handing off a pushed change.

## Current Git Target

- Branch: `main`
- Remote: `origin`
- Repository: `https://github.com/johnrecap/kmtlegal.git`

## Mandatory Workflow For Every Change

After every completed repository modification:

1. Run the relevant verification for the change.
2. Commit the change.
3. Push to `origin/main`.
4. Give the user the matching server pull/deploy commands.

Do not leave completed work only on the local machine unless the user explicitly says not to push, the request is review-only, or verification failed and the user has not accepted that risk.

Default command sequence:

```bash
git status
git add -A
git commit -m "describe the change"
git push origin main
```

Default server handoff after push:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

## Local Push

Use these commands from the project checkout on the development machine:

```bash
git status
git add -A
git commit -m "describe the change"
git push origin main
```

If the commit already exists locally and only needs to be uploaded:

```bash
git push origin main
```

## Local Pull

```bash
git pull --ff-only origin main
```

## Current Server Pull And Deploy: aaPanel + PM2

Use this for the current `kmtlegal.saeeddev.com` style deployment, where aaPanel owns the domain/reverse proxy and PM2 runs the Node app.

Run on the server:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The script:

- Fetches `origin/main`.
- Pulls with `git pull --ff-only origin main` when the server checkout is behind.
- Fails if tracked files on the server are modified.
- Installs dependencies with build-time packages.
- Removes the old `.next` build output.
- Runs `npm run build`.
- Runs `npm run db:migrate`.
- Restarts or starts the `kmtlegal` PM2 process.
- Saves PM2 state and checks the local app response.

Only override defaults when the server uses different names:

```bash
APP_DIR=/www/wwwroot/kmtlegal \
BRANCH=main \
PM2_APP=kmtlegal \
PORT=3000 \
bash deploy/install/aapanel-pm2-update.sh
```

## Manual aaPanel + PM2 Fallback

Use this only when the update script cannot be used and you intentionally want to run the same steps by hand.

```bash
cd /www/wwwroot/kmtlegal
git fetch origin main
git pull --ff-only origin main
npm install --include=dev
rm -rf .next
npm run build
npm run db:migrate
PORT=3000 pm2 restart kmtlegal --update-env
pm2 save
curl -fsSI http://127.0.0.1:3000/api/health || curl -fsSI http://127.0.0.1:3000/
pm2 list
```

If the PM2 process does not exist yet:

```bash
PORT=3000 pm2 start npm --name kmtlegal -- start
pm2 save
```

## Terminal VPS/systemd Path

Use this only for the Terminal VPS/systemd deployment path, not for aaPanel-managed deployments.

Fresh install:

```bash
sudo bash deploy/install/install.sh
```

Update from a release directory:

```bash
npm ci
npm run build
npm run db:migrate
sudo systemctl restart kmt-legal
```

See `docs/VPS_DEPLOYMENT_RUNBOOK.md` for the full atomic release flow.

## Local Development

Install:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build and run a production build locally:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Local production helper:

```bash
npm run start:local
```

## Verification Commands

Run the relevant checks before pushing:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Optional smoke test:

```bash
npm run test:e2e:smoke
```

Live admin smoke test, when credentials are available:

```bash
KMT_LIVE_BASE_URL=https://kmtlegal.saeeddev.com \
KMT_LIVE_ADMIN_EMAIL=... \
KMT_LIVE_ADMIN_PASSWORD=... \
npx playwright test tests/e2e/live-admin-smoke.spec.ts
```

## Required Handoff After Push

After a successful `git push origin main`, include the server-side pull/deploy command in the final handoff.

Default current server handoff:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

If a different deployment target is used, choose the matching section from this file and state the target assumption clearly.
