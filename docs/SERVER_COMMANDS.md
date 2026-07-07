# Server Commands

This file is the project reference for local Git commands, server pull/deploy commands, and runtime commands. Use it when handing off a pushed change.

## Current Git Targets

- Branch: `main`
- Development remote: `origin` -> `https://gitlab.com/john-recap-group/kmtlegal.git`
- Server pull remote: GitHub -> `https://github.com/johnrecap/kmtlegal.git`

The current production server pulls from GitHub. When a change is pushed only to GitLab, also push the same `main` commit to GitHub before running the server deploy command.

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
git push github main
```

Default server handoff after push:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

Payment maintenance should run on the server after deploy and then on a recurring schedule:

```bash
cd /www/wwwroot/kmtlegal
npm run jobs:payments
```

The payment maintenance script loads `.env.production.local`, `.env.local`, then `.env` automatically from the current app directory. If it returns Prisma `P1010`, confirm that `.env.production.local` contains the same production `DATABASE_URL` used by the deploy script and that the database user can access the selected database.

For PM2-managed recurrence, run a separate process only after confirming `.env.production.local` is loaded for that process:

```bash
cd /www/wwwroot/kmtlegal
set -a
. ./.env.production.local
set +a
pm2 start npm --name kmtlegal-payment-maintenance -- run jobs:payments:watch
pm2 save
```

## Cloudflare Public HTML Cache Rule

Use this only for the public domain cache layer. It is separate from the aaPanel/PM2 deploy and should be run only with a Cloudflare API token that can edit Cache Rules/Zone Rulesets.

Required token permissions:

- `Zone: Read`
- `Cache Rules: Edit` or `Zone Rulesets: Edit`

The script manages only these two rules for `kmtlegal.saeeddev.com`:

- Bypass cache for `/api/*`, `/admin/*`, `/client/*`, `/portal/*`, `/login*`, `/install*`, `/product-system*`, and `/stitch-clone*`.
- Make public `GET/HEAD` pages eligible for Cloudflare edge cache with a 900 second edge TTL.

Preview the exact expressions without calling Cloudflare:

```bash
npm run cloudflare:cache-rules -- --print
```

Check the zone and current ruleset without mutating Cloudflare:

```bash
export CLOUDFLARE_API_TOKEN='...'
npm run cloudflare:cache-rules -- --dry-run
```

Apply the rule:

```bash
export CLOUDFLARE_API_TOKEN='...'
npm run cloudflare:cache-rules -- --apply
```

Override defaults only when needed:

```bash
CLOUDFLARE_API_TOKEN='...' \
npm run cloudflare:cache-rules -- --apply --zone=saeeddev.com --host=kmtlegal.saeeddev.com --edge-ttl=900
```

After applying, verify public HTML is not `no-store` and sensitive paths still are:

```bash
curl -I https://kmtlegal.saeeddev.com/
curl -I https://kmtlegal.saeeddev.com/
curl -I https://kmtlegal.saeeddev.com/api/health
curl -I https://kmtlegal.saeeddev.com/client
```

Expected results:

- `/` returns `Cache-Control: public, max-age=60, s-maxage=900, stale-while-revalidate=86400`.
- `/api/*`, `/client/*`, `/admin/*`, login, and install paths return `Cache-Control: no-store`.
- After Cloudflare has the rule, a repeated request to `/` should become cache-eligible and can return `CF-Cache-Status: HIT` after warm-up.

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
git push github main
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

The update script loads `/www/wwwroot/kmtlegal/.env.production.local` before build, migrations, and PM2 restart. This is required so Prisma uses the production PostgreSQL database from `DATABASE_URL` instead of the local development default.

The script:

- Fetches `origin/main`.
- Pulls with `git pull --ff-only origin main` when the server checkout is behind.
- Fails if tracked files on the server are modified.
- Loads the production environment file and fails if `DATABASE_URL` is missing.
- Sets `APP_RELEASE` to the exact deployed Git commit so `/api/health` can prove which release the PM2 process and public domain are serving.
- Installs dependencies with build-time packages using `npm ci --include=dev`.
- Preserves the previous `.next/static` assets for open browser tabs and cached HTML.
- Removes stale `.next` build output after the static backup.
- Runs `npm run build`.
- Verifies that Next.js static files referenced by the build manifest exist.
- Runs `npm run db:migrate`.
- Recreates the `kmtlegal` PM2 process with `--cwd /www/wwwroot/kmtlegal` and starts the Next.js CLI directly, not through `npm`, so PM2 does not leave an old child process serving port `3000`.
- Stops any stale process still listening on port `3000` before starting the new PM2 process.
- Waits for PM2 to stay `online`, checks the local app response, and prints recent PM2 logs if the process exits.
- Installs a guarded aaPanel/Nginx public cache policy include when `APP_ORIGIN` is set, so public HTML is cacheable while `/api/*`, `/admin/*`, `/client/*`, `/portal/*`, `/login*`, and `/install*` remain `no-store`.
- When `APP_ORIGIN` is set, verifies public `/api/health` reports the same `APP_RELEASE` as the local PM2 app, compares `/`, `/articles`, `/case-studies`, `/media`, and `/contact` against the local app build, verifies public `_next/static` assets return JavaScript/CSS instead of HTML errors, and fails if the public domain still serves stale homepage article/case-study detail links or stale demo content cards.
- Also verifies that public pages no longer return `Cache-Control: no-store` or `X-Kmt-Proxy: next-no-cache`, and that sensitive app/API/login/install paths still return `Cache-Control: no-store`.
- If public `/api/health` reaches the new release but public HTML still serves an old Next.js build, purges the aaPanel/Nginx proxy cache directory derived from `APP_ORIGIN` (`/www/wwwroot/<host>/proxy_cache_dir`), reloads Nginx when available, waits briefly, and retries public verification once.
- Saves PM2 state only after the process passes the stability checks.

Only override defaults when the server uses different names:

```bash
APP_DIR=/www/wwwroot/kmtlegal \
ENV_FILE=/www/wwwroot/kmtlegal/.env.production.local \
BRANCH=main \
PM2_APP=kmtlegal \
PORT=3000 \
bash deploy/install/aapanel-pm2-update.sh
```

For a non-standard aaPanel cache path, override the derived cache directory. Keep this limited to aaPanel/Nginx proxy cache directories:

```bash
PUBLIC_PROXY_CACHE_DIRS=/www/wwwroot/kmtlegal.saeeddev.com/proxy_cache_dir \
bash deploy/install/aapanel-pm2-update.sh
```

Set `PUBLIC_CACHE_PURGE_ENABLED=false` only when the public domain is not behind aaPanel/Nginx proxy cache and the deploy should fail immediately on public/local build mismatch.

If aaPanel uses a non-standard Nginx vhost file, pass it explicitly so the cache-policy include can be inserted safely:

```bash
PUBLIC_NGINX_VHOST_FILES=/www/server/panel/vhost/nginx/kmtlegal.saeeddev.com.conf \
bash deploy/install/aapanel-pm2-update.sh
```

Set `PUBLIC_CACHE_POLICY_ENABLED=false` only if you intentionally want to manage the public/sensitive `Cache-Control` split manually in aaPanel or Cloudflare.

## Manual aaPanel + PM2 Fallback

Use this only when the update script cannot be used and you intentionally want to run the same steps by hand.

```bash
cd /www/wwwroot/kmtlegal
set -a
. ./.env.production.local
set +a
git fetch origin main
git pull --ff-only origin main
npm ci --include=dev
STATIC_BACKUP_DIR=.next-static-previous
rm -rf "$STATIC_BACKUP_DIR"
if [ -d .next/static ]; then mkdir -p "$STATIC_BACKUP_DIR" && cp -a .next/static/. "$STATIC_BACKUP_DIR/"; fi
rm -rf .next
npm run build
if [ -d "$STATIC_BACKUP_DIR" ]; then mkdir -p .next/static && cp -a "$STATIC_BACKUP_DIR/." .next/static/ && rm -rf "$STATIC_BACKUP_DIR"; fi
node -e 'const fs=require("fs"),path=require("path"); const p=".next/app-build-manifest.json"; if(!fs.existsSync(p)) process.exit(0); const m=JSON.parse(fs.readFileSync(p,"utf8")); const missing=[]; for (const files of Object.values(m.pages||{})) for (const file of files) if (file.startsWith("static/") && !fs.existsSync(path.join(".next",file))) missing.push(file); if(missing.length){ console.error(missing.join("\n")); process.exit(1); }'
npm run db:migrate
pm2 delete kmtlegal || true
fuser -k 3000/tcp || true
PORT=3000 pm2 start /www/wwwroot/kmtlegal/node_modules/next/dist/bin/next --name kmtlegal --cwd /www/wwwroot/kmtlegal -- start --hostname 127.0.0.1 --port 3000
sleep 8
pm2 status kmtlegal
pm2 logs kmtlegal --lines 80 --nostream
curl -fsSI http://127.0.0.1:3000/api/health || curl -fsSI http://127.0.0.1:3000/
pm2 save
pm2 list
```

If `npm run db:migrate` fails with `P1010: User was denied access`, do not restart PM2 yet. First confirm the loaded `DATABASE_URL` points at the aaPanel PostgreSQL database and user:

```bash
cd /www/wwwroot/kmtlegal
set -a
. ./.env.production.local
set +a
node -e 'const u=new URL(process.env.DATABASE_URL); console.log(`${u.username}@${u.hostname}:${u.port || "5432"}${u.pathname}`)'
npm run db:migrate
```

For the current aaPanel database shown in the panel, the visible target should be the `kmtlegal` database/user, not the local development default `kmt_legal`.

If a deployed page shows `ChunkLoadError`, `Refused to execute script`, or a `_next/static/...js` request returns `400`, `404`, or `text/html`, it usually means the browser has old HTML/runtime state while the server has a newer build. Run the update script again after this static-preservation fix, then hard refresh the browser tab. If a CDN/proxy cached bad asset responses, purge `/_next/static/*` from the proxy.

If public HTML still shows old copy or stale detail links after a successful build, first compare the local PM2 response with the public domain. A public page returning `X-Nextjs-Cache: HIT` plus stale links usually means old HTML is still being served from the Next.js route cache or an upstream proxy/cache:

```bash
pm2 describe kmtlegal | grep -E 'cwd|script|args|status'
ss -ltnp 'sport = :3000'
curl -I -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' http://127.0.0.1:3000/
curl -I -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' https://kmtlegal.saeeddev.com/
curl -s -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' http://127.0.0.1:3000/api/health | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>console.log(JSON.parse(s).data.deployment))'
curl -s -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' https://kmtlegal.saeeddev.com/api/health | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>console.log(JSON.parse(s).data.deployment))'
curl -s -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' http://127.0.0.1:3000/ | grep -E 'contract-risk-basics|prepare-consultation-file|anonymous-commercial-dispute|أساسيات تقليل مخاطر العقود|كيف تجهز ملف استشارة قانونية|تنظيم نزاع تجاري مجهول الأطراف' || echo 'LOCAL OK'
curl -s -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' https://kmtlegal.saeeddev.com/ | grep -E 'contract-risk-basics|prepare-consultation-file|anonymous-commercial-dispute|أساسيات تقليل مخاطر العقود|كيف تجهز ملف استشارة قانونية|تنظيم نزاع تجاري مجهول الأطراف' || echo 'PUBLIC OK'
curl -s http://127.0.0.1:3000/media | grep -E 'read-only|للقراءة فقط'
curl -s https://kmtlegal.saeeddev.com/media | grep -E 'read-only|للقراءة فقط'
```

If local `/api/health` reports the new release but public `/api/health` reports a different or missing release, the public domain is not reaching the PM2 process that was just restarted. Check aaPanel/Nginx reverse proxy routing and stale listeners. If both health URLs report the new release but public HTML is old, the issue is an HTML cache outside the app process: aaPanel reverse proxy, Nginx cache, or Cloudflare cache/routing. The update script now purges the derived aaPanel/Nginx `proxy_cache_dir` and retries once automatically when this mismatch is detected. If the retry still fails, purge any external CDN/Cloudflare cache for the affected public HTML paths (`/`, `/articles`, `/case-studies`) and recheck aaPanel reverse proxy routing. If both local and public are old while the source is current, check for a stale orphan process on port `3000`; the update script now kills that listener and starts Next directly under PM2 so this mismatch is caught during deploy.

If PM2 shows `kmtlegal` as `stopped` after deployment, inspect the runtime crash before running another build:

```bash
cd /www/wwwroot/kmtlegal
pm2 describe kmtlegal
pm2 logs kmtlegal --lines 120 --nostream
set -a
. ./.env.production.local
set +a
PORT=3000 npm run start -- --hostname 127.0.0.1 --port 3000
```

Stop the foreground command with `Ctrl+C` after copying the error. Common causes are a missing production environment variable, a port conflict, or a runtime exception that only appears after `next start`.

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
