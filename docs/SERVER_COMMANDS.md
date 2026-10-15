# Server Commands

## Assistant retry rollback — 2026-10-15

The owner requested reverting `29a6f27` through a new commit on `main`, restoring application behavior from `9f345f142de46e9badece6c8b66ad20936cf9ece`. Deploy the new revert commit using the normal update path:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

Keep Gemini configuration, credentials and billing unchanged; no database rollback is required. Verify `/api/health` reports the new revert commit after deployment. This restores prior behavior, but does not remove the provider's 429 quota limit. Retry redesign remains deferred.

## Content, formation and sourced knowledge — 2026-10-11

Apply the three additive migrations beginning `20261011120000`, `20261011130000`, and `20261011140000` through the existing update script after the normal paired backup and a disposable native PostgreSQL upgrade trial. The local PGlite upgrade/backup test is not a production restore receipt. Existing request kinds and article records are preserved.

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The update adds Nginx cache bypass checks for `/business-ai` and `/legal-intelligence` in both languages. If the Cloudflare cache rule is managed separately, regenerate/apply the existing rule with the same four bypass paths before exposing the library; no cloud account was changed locally. Private report APIs remain `no-store`.

Verify saved formation intake, verified-account submission, private PDF access, staff assignment/information requests/fee proposals, and reference publication in staging. The existing AI gateway accepts the `formation_review` task; the provider only prioritizes bounded follow-up field keys. A deterministic summary remains available on provider failure. Legal-form comparison stays disabled until reviewed rules exist. Validate real provider output in Arabic, Egyptian Arabic and English, SMTP, file scanning, native database concurrency and server restoration separately. Do not seed the synthetic test references into production.

## Published lawyer booking — 2026-10-09

Take the existing paired backup and test additive migration `20261010010000_published_lawyer_booking` on a disposable PostgreSQL copy before rollout. The current update script applies migrations; it does not publish the booking schedule.

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

In `/admin/consultation-availability`, select active lawyers per day, enable PHONE in weekly hours, set duration/lead/window and closures, then publish explicitly. Publication is advance office approval; default is unpublished. Confirm a synthetic guest PHONE/WhatsApp booking without email and verify the assigned lawyer’s consultation and inbox. Test a competing confirmation on native PostgreSQL before public launch. Disabling publication leaves existing bookings intact and accepts unconfirmed callback requests; no automatic conversion of legacy pending requests occurs.

Confirm/cancel/reschedule actions are idempotent and session-protected. If the browser loses a response, retry the same action rather than starting another conversation. Keep the seven-day guest capability private; a reference alone is insufficient. Existing signed-in users can attach this new booking; historical clients are never matched by phone/email. Account verification still needs working SMTP, but booking does not. General notifications and fees remain separate. Review AR/Egyptian/EN conversation quality with the configured provider and physical mobile keyboard behavior before claiming live readiness.

## Company-assistant scope and consent update — 2026-10-09

The update script applies the extra additive migration `20261009240000_company_assistant_policy`. Test it on a disposable copy and take the existing paired backup before deploying. Old conversations and drafts remain, but old drafts do not grant booking consent. Existing unconsumed activation links require renewed booking consent before a new account can be created; existing sign-in/recovery remains available independently.

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

Use the already protected AI settings below. Each message has one shared deadline and at most six model calls including scope and output checks; ordinary answers typically use three calls. No local real provider was configured during verification. Before claiming production readiness, run real AR/Egyptian/EN conversations for office questions, unknown facts, mixed/off-topic requests, prompt injection, greetings, one offer, refusal, ambiguous/clear acceptance, corrections, withdrawal and human takeover. Verify no premature contact panel, draft write or submission. Check provider failure/retry and a rejected answer. Legal explanations beyond the existing sourced services remain unpublished until the office supplies approved text and references in `assistant-approved-knowledge.ts`.

This update does not confirm appointments, alter fees, enable general notifications or schedule backups.

## Phase five — account, assistant, services, ledger and daily backup

Update after testing all five additive migrations on a disposable copy and taking a paired DB/uploads backup. Existing client history is preserved; unresolved legacy invoice conflicts are marked for manual reconciliation.

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The user authorized the maintenance window and this implementation; no additional conceptual approval is needed. Actual production access and operational receipts are not supplied by local tests. Keep the existing payment reconciliation/maintenance worker for historical transactions. Do not enable general notifications or modify the contact form as part of this update.

Configure through the protected server environment, never Git or chat: `AI_PROVIDER`, `AI_BASE_URL` if needed, `AI_MODEL`, `AI_API_KEY`, existing timeout/token budgets; `CLIENT_ACCOUNT_EMAIL_ENABLED=true`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and the provider's SMTP authentication/TLS settings. Keep `SMTP_ENABLED=false`: the account purpose gate enables only verification/recovery email. Select a provider/model that supports tool calling; the adapter uses the existing [OpenRouter tool protocol](https://openrouter.ai/docs/guides/features/tool-calling). No live model or mailbox test was possible in the local environment (credentials absent).

The generated Nginx policy and Next headers now bypass caching for `/account/*`. Reapply the existing Cloudflare cache rules (commands below) if that integration is in use, then verify `Cache-Control: no-store` on the actual account-verification page.

After restart, verify both languages: public chat → actual delivered mailbox link → password creation → own pending request → staff approval → own appointment. Check expiry, resend, recovery, two simultaneous appointment approvals and staff takeover. Account activation must not create an appointment. Test real ClamAV clean-file/EICAR/unavailable cases and cross-client downloads. Run contract quote/acceptance/delivery, Health Check approved questionnaire/report, and the 10,000/3,000/2,000 ledger example with designated test accounts. Delete test data through appropriate application workflows; never erase ledger history. Approve actual questionnaire/content in the office before publication.

### Daily paired backup at 03:00 Cairo

Use aaPanel **Cron → Add Task → Shell Script → Daily → 03:00**, execute as the same Unix user that owns the application's PM2 processes. This follows [aaPanel's Cron documentation](https://www.aapanel.com/docs/Function/Cron.html). Use a shell task for the paired PostgreSQL/private-uploads snapshot, not the site's files-only backup task.

Before scheduling:

1. Verify `timedatectl show --property=Timezone --value` returns `Africa/Cairo`. Use the IANA zone, not a fixed UTC offset, so Egypt's daylight-saving changes are handled. Check other server schedules before changing its timezone.
2. In protected `.env.production.local`, set `DATABASE_BACKUP_DIR=/www/backup/kmtlegal`, `DAILY_BACKUP_RESTORE_RECEIPT=/www/backup/kmtlegal-restore-receipt.json`, and a matching PostgreSQL client directory through `POSTGRES_BACKUP_BIN_DIR`. `KMT_OPERATIONS_LOCK` defaults to `/www/backup/kmtlegal-operations.lock`; deploy and backup must use the same value. List any other PM2 writers in `KMT_ADDITIONAL_WRITER_APPS`, comma-separated. No unmanaged writer may run during capture.
3. Verify the Cron user's Node/PM2/PostgreSQL/PATH and `PM2_HOME`; use the actual paths returned on your server. Run the non-disruptive preflight:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-daily-backup.sh --preflight
```

4. Perform the isolated restore drill in the linked runbook. Only after it succeeds, write a mode-600 JSON receipt at `DAILY_BACKUP_RESTORE_RECEIPT` containing `restoreDrillVerified: true`, `clientAndDocumentCheckVerified: true`, and the actual ISO `verifiedAt` timestamp. Include the tested set ID, release and evidence paths for traceability. Do not create a success receipt merely to bypass the gate. Repeat at least every 30 days; the coordinator refuses downtime if the receipt is older than 31 days.
5. Run one supervised backup, verify restart/health and the new set, then enable the Daily task with this script content:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-daily-backup.sh
```

The wrapper locks against deployment, checks free space/tools, stops the declared PM2 writers, captures DB+uploads, includes `recovery.env` with mode 600/checksum, restarts services and checks health. SIGINT/SIGTERM and ordinary errors enter recovery; power loss/SIGKILL still require operator recovery. It retains the newest 15 successful managed daily sets only; failures never prune old sets or unrelated aaPanel backups. Daily status files are `daily-last-attempt.json` and `daily-last-success.json` under the backup root (time, bytes, duration, set ID, recovery result). Inspect aaPanel's Cron log and PM2 after failure. Local copies do not cover total server loss; off-server storage remains deferred.

Retention was reduced from 30 to 15 by owner instruction on 2026-10-11. The first successful daily run after updating removes any older managed successes above that limit. This is a count, not a 15-day age cutoff, and it does not clean manual backups or incomplete attempts.

No daily job, production backup or restoration has been executed by this local delivery. The deployment script shares the lock but its existing automatic backup remains DB-only; the separate daily paired task covers private uploads.

## Public website phase two — 2026-10-09

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The update script now expects `/our-firm`, `/industries`, `/articles`, their Arabic equivalents, `/robots.txt` and `/sitemap.xml` to respond successfully. Articles are no longer in retired-route probes; Case Studies and Media remain retired. Keep `APP_ORIGIN` set to the actual canonical HTTPS domain in the server environment: public metadata, robots and sitemap share that origin (fallback `https://kmtlegal.org`, never localhost by default).

The generated Nginx cache policy now marks article routes, sitemap and private payment/account routes `no-store`. If Cloudflare's managed rules were previously applied, update them using the **actual** host/zone and the existing securely configured token, then purge stale article HTML (including earlier 404s):

```bash
node scripts/cloudflare-public-cache-rule.mjs --host=YOUR_ACTUAL_HOST --zone=YOUR_ZONE --dry-run
node scripts/cloudflare-public-cache-rule.mjs --host=YOUR_ACTUAL_HOST --zone=YOUR_ZONE --apply
```

Do not copy the script's historical demo hostname as the production hostname. These commands require the existing Cloudflare permissions and are not run by the local implementation. Test publication and withdrawal on the actual deployed origin/CDN; a withdrawn article must stop appearing in the list, detail and sitemap. Normal Next data-cache invalidation remains in the existing CMS pipeline. No schema migration, demo-content publication, SMTP configuration, contact-form or notification change is part of phase two.

Enable internal measurement only through the existing `ANALYTICS_ENABLED` setting. Check the new section at `/admin/reports` with `report.read.any`; use its date filters. Click totals do not represent received messages or unique people. Review pending official firm statements/team data and phase-one input blockers in the implementation register before declaring full content completion.

## PostgreSQL backup client compatibility

The protected deploy command now queries the database server major version before backup and
selects one matching `pg_dump`/`pg_restore` pair. It prefers the exact server major and may use a
newer pair, but it rejects any pair older than the server. The selected `pg_restore` verifies the
custom-format archive before any migration starts.

This handles the observed PostgreSQL 18.0 server with a PostgreSQL 16.14 default client. Pull the
fixed script and retry the normal deployment:

```bash
cd /www/wwwroot/kmtlegal
git pull --ff-only origin main
bash deploy/install/aapanel-pm2-update.sh
```

The script searches common Debian/Ubuntu, RHEL-like, local PostgreSQL, and aaPanel installation
paths. If a compatible pair is installed in a different directory, add its directory to the
untracked `/www/wwwroot/kmtlegal/.env.production.local` file:

```bash
POSTGRES_BACKUP_BIN_DIR=/usr/lib/postgresql/18/bin
```

Both executables in that directory must exist, have the same major version, and be at least as new
as the server. Check the pair before retrying:

```bash
/usr/lib/postgresql/18/bin/pg_dump --version
/usr/lib/postgresql/18/bin/pg_restore --version
```

If PostgreSQL client 18 is not installed, configure the official PostgreSQL Apt repository for the
server's Ubuntu release, then install only the client package:

```bash
apt-get update
apt-get install -y postgresql-client-18
```

The deploy script does not install operating-system packages and never continues to migrations
without a non-empty, readable backup. It logs only selected versions and executable paths, never
the database connection string.

## PLAN-37 overdue-unbooked consultation deployment

PLAN-37 adds no Prisma migration and no new PM2 process. Use the existing protected aaPanel/PM2
update command; it already creates and validates the database backup, applies any still-pending
earlier migrations, runs `npm run jobs:payments` once, and then restarts and observes the existing
Next.js and `kmtlegal-payment-maintenance` processes:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

That one-shot maintenance run now also performs the PLAN-37 work before restart:

1. Keeps active no-primary requests `PENDING`; once they are at least 72 hours old, it upserts the
   overdue alert without classifying them as missed.
2. Reconciles legacy `CONVERTED + PENDING` no-primary rows to `AWAITING_RESULT` and equivalent
   rejected rows to `CANCELLED`, once and with nullable appointment audit context.
3. Leaves the recurring 60-second cycle in the existing maintenance process; never create a second
   consultation worker.

After deployment, inspect representative existing records and compare the consultation list,
dashboard, and notification counts at one captured time. Do not create production fixtures. Confirm
both PM2 processes remain `online`, pass local health, and keep stable restart counters for longer
than one full worker cycle. Local PLAN-37 validation intentionally runs without `DATABASE_URL`.

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

## Cloudflare navigation cache bypass

Use this only for the public domain cache layer. It is separate from the aaPanel/PM2 deploy and should be run only with a Cloudflare API token that can edit Cache Rules/Zone Rulesets.

Required token permissions:

- `Zone: Read`
- `Cache Rules: Edit` or `Zone Rulesets: Edit`

The script replaces its two old managed rules with one bypass rule for `kmtlegal.org`: navigation HTML, Next.js RSC responses, API calls and replaceable brand/office assets bypass Cloudflare's shared cache. Fingerprinted `/_next/static/*` remains eligible for long-lived caching. Inspect other rules in the same zone before applying; the script preserves unrelated rules.

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
npm run cloudflare:cache-rules -- --apply --zone=kmtlegal.org --host=kmtlegal.org
```

After applying, verify public HTML and sensitive paths are `no-store` on normal requests:

```bash
curl -I https://kmtlegal.org/
curl -I https://kmtlegal.org/services
curl -I https://kmtlegal.org/api/health
curl -I https://kmtlegal.org/client
```

Expected results:

- All HTML and RSC navigation, plus `/api/*`, `/client/*`, `/admin/*`, login and install paths, return `Cache-Control: no-store`.
- Fingerprinted `/_next/static/*` retains `public, max-age=31536000, immutable`; the mutable `/brand/*` and `/site-assets/*` use one-hour revalidation.
- A repeated public HTML request must display the same `kmt-release` meta as the local PM2 response. `CF-Cache-Status: DYNAMIC` alone is not proof that origin HTML is fresh.

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

Use this for the current `kmtlegal.org` deployment, where aaPanel owns the domain/reverse proxy and PM2 runs the Node app.

Run on the server:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

If the deploy script itself changed since the server's current checkout, pull it **before** launching it. A script already running continues with its loaded functions even after its own `git pull` updates the file:

```bash
cd /www/wwwroot/kmtlegal
git pull --ff-only origin main
bash deploy/install/aapanel-pm2-update.sh
```

On the aaPanel target, the deploy selects `/www/server/nginx/sbin/nginx` before a different `nginx` found on `PATH`. It prints the selected executable, requires that executable's `-t` check to pass, and then reloads it. If validation or reload fails, deployment stops and restores the backed-up Nginx files. Do not treat a current `/api/health` release as a completed deployment until the ordinary public HTML routes and `Cache-Control: no-store` pass too.

The update script loads `/www/wwwroot/kmtlegal/.env.production.local` before build, migrations, and PM2 restart. This is required so Prisma uses the production PostgreSQL database from `DATABASE_URL` instead of the local development default.

The script:

- Fetches `origin/main`.
- Pulls with `git pull --ff-only origin main` when the server checkout is behind.
- Fails if tracked files on the server are modified.
- Loads the production environment file and fails if `DATABASE_URL` is missing.
- Resolves a matching or newer `pg_dump`/`pg_restore` pair for the live PostgreSQL server and stops
  before backup or migration when no safe pair exists.
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
- Installs a backed-up aaPanel/Nginx include that prevents both shared-cache reads and writes for HTML/RSC, validates with `nginx -t`, and restores previous files if activation fails.
- When `APP_ORIGIN` is set, verifies `/api/health` and the HTML `kmt-release` meta against the same commit, expands the full current sitemap, checks every page twice using ordinary requests, compares the public and local asset sets, and checks retired routes and static asset responses.
- Fails if public HTML is still cacheable. A stale page fails the deployment even if `/api/health` reports the new release.
- On mismatch, purges only an explicitly configured and inspected KMT proxy cache directory, then retries once; a hostname is never used to guess a deletion path.
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

If origin verification finds a stale Nginx cache, inspect the loaded configuration first. Only set the confirmed KMT-specific directory; do not point to a shared cache zone:

```bash
/www/server/nginx/sbin/nginx -T 2>&1 | grep -E 'proxy_cache_path|proxy_cache|server_name|include'
PUBLIC_PROXY_CACHE_DIRS=/www/wwwroot/kmtlegal.org/proxy_cache_dir \
bash deploy/install/aapanel-pm2-update.sh
```

Set `PUBLIC_CACHE_PURGE_ENABLED=false` only when the public domain is not behind aaPanel/Nginx proxy cache and the deploy should fail immediately on public/local build mismatch.

If aaPanel uses a non-standard Nginx vhost file, pass it explicitly so the cache-policy include can be inserted safely:

```bash
PUBLIC_NGINX_VHOST_FILES=/www/server/panel/vhost/nginx/kmtlegal.org.conf \
bash deploy/install/aapanel-pm2-update.sh
```

Set `PUBLIC_CACHE_POLICY_ENABLED=false` only if you have independently configured and verified the same HTML/RSC bypass in the active Nginx vhost.

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

If public HTML still shows old copy after a successful build, compare ordinary requests to local PM2 and the public domain. `X-Nextjs-Cache: HIT` alone does not identify which layer served the old response:

```bash
pm2 describe kmtlegal | grep -E 'cwd|script|args|status'
ss -ltnp 'sport = :3000'
curl -I http://127.0.0.1:3000/services
curl -I https://kmtlegal.org/services
curl -s http://127.0.0.1:3000/api/health | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>console.log(JSON.parse(s).data.deployment))'
curl -s https://kmtlegal.org/api/health | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>console.log(JSON.parse(s).data.deployment))'
curl -s http://127.0.0.1:3000/services | grep -o 'name="kmt-release" content="[^"]*"' | head -1
curl -s https://kmtlegal.org/services | grep -o 'name="kmt-release" content="[^"]*"' | head -1
curl -s https://kmtlegal.org/contact | grep -o 'name="kmt-release" content="[^"]*"' | head -1
curl -s https://kmtlegal.org/team | grep -o 'name="kmt-release" content="[^"]*"' | head -1
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/media
curl -s -o /dev/null -w '%{http_code}\n' https://kmtlegal.org/media
```

If local `/api/health` reports the new release but public `/api/health` does not, check aaPanel/Nginx reverse proxy routing and stale listeners. If both health URLs match but public HTML is old, inspect the active Nginx vhost and `proxy_cache_path` with `nginx -T`, then the actual Cloudflare rule for `kmtlegal.org`. Supply `PUBLIC_PROXY_CACHE_DIRS` only after confirming a KMT-specific cache directory. The update script will retry verification once and fail if any sitemap page remains old. If both local and public are old while source is current, check for a stale orphan process on port `3000`.

For this website-only repair, the update script prints the previous checkout commit before pulling and saves timestamped copies of the Nginx vhost/include before editing. Keep that commit and the backup paths in the deploy log. If the new runtime fails, use the previous commit with the manual build/PM2 steps above under supervision, then restore the recorded Nginx files and run `nginx -t` before reload. The automatic update script always targets `origin/main`, so it is not a rollback command. Check database compatibility before any rollback after releases that contain migrations; this repair adds no migration.

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
KMT_LIVE_BASE_URL=https://kmtlegal.org \
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
