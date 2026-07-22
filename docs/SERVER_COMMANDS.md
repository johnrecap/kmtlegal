# Server Commands

## PLAN-36 consultation outcome deployment

The aaPanel/PM2 update script now performs the PLAN-36 database and worker steps in this order:

1. Build and predeploy validation.
2. Create a timestamped PostgreSQL custom-format backup under `DATABASE_BACKUP_DIR` (default `/www/backup/kmtlegal`), verify that it is non-empty, and verify it with `pg_restore --list`.
3. Apply the additive Prisma migration.
4. Run `npm run jobs:payments` once so historical consultation outcomes are reconciled before either PM2 process restarts.
5. Restart the existing Next.js and `kmtlegal-payment-maintenance` process identities.
6. Wait at least 65 seconds and fail deployment if either the Next.js application or maintenance process leaves `online` state, fails local health, or its restart counter increases after the intentional start/restart baseline.

The backup directory must remain outside `/www/wwwroot/kmtlegal`. The recurring process uses a 60-second interval by default; do not create a second consultation worker.

Local development does not require a database for focused tests, typecheck, lint, Prisma validation/generation, or the permitted no-DB build. Database migration and reconciliation acceptance must run against staging or a disposable PostgreSQL database. Do not create test fixtures in production without separate approval.

### Manual npm `init.module` warning repair

The deploy script intentionally does not edit user or global npm configuration. If npm prints an unknown `init.module` configuration warning, identify the owning file and back it up before changing it:

```bash
npm config get userconfig
npm config get globalconfig
grep -n '^init\.module' "$(npm config get userconfig)" 2>/dev/null || true
grep -n '^init\.module' "$(npm config get globalconfig)" 2>/dev/null || true
```

After confirming which file contains the obsolete key, copy that exact file to a timestamped backup, then remove only `init.module` with the matching npm configuration scope:

```bash
cp --preserve=all "$(npm config get userconfig)" "$(npm config get userconfig).backup-$(date -u +%Y%m%dT%H%M%SZ)"
npm config delete init.module --location=user
```

For a global config, use the same backup discipline and `npm config delete init.module --location=global` with the privileges required by that file. Re-run `npm config list` and the affected npm command to confirm the warning is gone.

### Manual Nginx HTTP/2 syntax repair

The deploy script does not rewrite deprecated `listen ... http2` directives. In aaPanel, first identify the exact vhost file, make a timestamped backup outside the Git checkout, then manually replace each relevant TLS listener such as `listen 443 ssl http2;` with `listen 443 ssl;` and add `http2 on;` once in the same server block. Apply the equivalent change to the IPv6 listener when present.

Always validate before reload:

```bash
nginx -t
systemctl reload nginx
```

If `nginx -t` fails, restore the saved vhost backup and validate again before any reload. Do not let application deployment automation make this server-wide syntax change.

This file is the project reference for local Git commands, server pull/deploy commands, and runtime commands. Use it when handing off a pushed change.

## Current Git Targets

- Branch: `main`
- Development and production remote: `origin` -> `https://github.com/johnrecap/kmtlegal.git`

GitHub is the single source of truth for local pushes and production server pulls.

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

PLAN-34 requires ClamAV before that deploy can become healthy. On Debian/Ubuntu aaPanel hosts, install/start it once and confirm the socket path before deploying:

```bash
sudo apt-get update
sudo apt-get install -y clamav clamav-daemon
sudo systemctl enable --now clamav-daemon
sudo clamdscan --ping
sudo ls -l /run/clamav/clamd.ctl
```

In `.env.production.local`, keep paid booking disabled and stage the providers as follows:

```dotenv
PAYMENT_PROVIDER=paymob
PAYTABS_ENABLED=false
PAYMOB_REQUEST_TIMEOUT_MS=10000
MALWARE_SCAN_MODE=required
CLAMAV_SOCKET_PATH=/run/clamav/clamd.ctl
SENTRY_ENABLED=false
NEXT_PUBLIC_SENTRY_ENABLED=false
```

Do not set `consultation.booking` to `AI_CHAT_PAID` during this deploy. Sentry must remain disabled until its DSN, auth token, org, and project are configured together.

The aaPanel deploy script now runs payment maintenance once and starts or restarts the recurring PM2 process `kmtlegal-payment-maintenance` before `pm2 save`. Use the manual commands below only when you intentionally need to inspect or repair the maintenance process outside the deploy script.

Payment maintenance can still be run manually on the server after deploy:

```bash
cd /www/wwwroot/kmtlegal
npm run jobs:payments
```

The payment maintenance script loads `.env.production.local`, `.env.local`, then `.env` automatically from the current app directory. If it returns Prisma `P1010`, confirm that `.env.production.local` contains the same production `DATABASE_URL` used by the deploy script and that the database user can access the selected database.

Optional failure alerting can be enabled with `PAYMENT_MAINTENANCE_ALERT_WEBHOOK_URL` in `.env.production.local`. The alert payload is intentionally compact and excludes stack traces, database URLs, raw webhook payloads, legal summaries, emails, phone numbers, tokens, and secrets.

Payment predeploy checks run automatically before `npm run db:migrate` inside `deploy/install/aapanel-pm2-update.sh`. They currently block deployment if duplicate paid manual receipt numbers exist before the database unique index is applied:

```bash
cd /www/wwwroot/kmtlegal
npm run predeploy:payments
```

If a non-production emergency deploy needs to bypass only this preflight, set `PAYMENT_PREDEPLOY_CHECK_ENABLED=false` for that deploy. Do not bypass it for a paid production launch without first resolving the duplicate receipt numbers it reports.

For PM2-managed recurrence repair, run a separate process only after confirming `.env.production.local` is loaded for that process:

```bash
cd /www/wwwroot/kmtlegal
set -a
. ./.env.production.local
set +a
pm2 start npm --name kmtlegal-payment-maintenance -- run jobs:payments:watch
pm2 save
pm2 status kmtlegal-payment-maintenance
pm2 logs kmtlegal-payment-maintenance --lines 80 --nostream
```

After restart, check `pm2 status kmtlegal-payment-maintenance` twice around one minute apart. The process should stay `online` and the restart counter should not keep increasing. If the counter increases every few seconds, the watch process is exiting and PM2 is only relaunching it.

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
- Runs production readiness with Paymob-first settings and requires a reachable ClamAV daemon before `/api/health` can become ready.
- Requires `/api/health` itself to return success after restart; `REQUIRE_HEALTH_READY=false` is reserved for controlled first-bootstrap work and must not be used for a normal production update.
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
- Runs `npm run jobs:payments`, then starts or restarts `kmtlegal-payment-maintenance` with `npm run jobs:payments:watch` so reservation expiry and cleanup fixes are active after deploy.
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

Set `PAYMENT_MAINTENANCE_PM2_ENABLED=false` only if another supervisor already owns the payment maintenance process.

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

After deploy, verify ClamAV and the application health together. Use the official EICAR test string only in a controlled test upload and delete the rejected local test file afterward; the app must return `MALWARE_DETECTED` and must not create a `Document` row.

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
