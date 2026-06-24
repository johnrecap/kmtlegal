# devops-plan.md

## Environments

### local
- Developer machine.
- Local PostgreSQL via Docker or installed service.
- Private uploads directory outside `public/`.
- AI provider defaults to `mock`.
- SMTP/email sending is disabled; template helper returns safe disabled metadata.
- No production secrets.

### dev
- Shared development environment.
- Disposable database/data.
- Optional shared dev deployments on VPS-like config.
- Debug logging with privacy redaction.

### staging
- Production-like config.
- Separate database and private uploads directory.
- Seed/demo data only.
- Runs migrations and E2E smoke.
- Used for release verification.

### production
- Real users and legal data.
- Production secrets only in secret store.
- Backups, monitoring, alerts, audit retention.
- No dev tools or seed/demo data; `AI_PROVIDER` must be explicitly configured.
- Runs on VPS-class hosting. Terminal VPS is the default supported path; aaPanel is supported as a VPS control-panel adapter; cPanel is supported only if it provides persistent Node.js, PostgreSQL, env vars, command execution, and private storage outside the public webroot.

## Environment Variables
Names only; never commit real values.

| Name | Scope | Secret? | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | server | no | runtime mode |
| `APP_ENV` | server/client public enum | no | local/dev/staging/production |
| `APP_ORIGIN` | server | no | canonical absolute origin |
| `DATABASE_URL` | server | yes | PostgreSQL connection |
| `DB_SETUP_MODE` | server | no | `existing` for panel-created DB or `auto` for script-created DB |
| `AUTH_SECRET` | server | yes | session/auth signing |
| `SESSION_COOKIE_SECURE` | server | no | production secure cookie switch |
| `STAFF_2FA_MODE` | server | no | must stay `disabled`; TOTP is deferred |
| `INSTALLER_ENABLED` | server | no | true only during first VPS setup; false after installer lock |
| `INSTALLER_SETUP_TOKEN` | server | yes | one-time setup token for `/install` |
| `INSTALLER_LOCK_PATH` | server | no | installer lock file path, e.g. `/var/lib/kmt-legal/install.lock` |
| `HOSTING_MODE` | server | no | `terminal-vps`, `aapanel`, or `cpanel` setup mode |
| `APP_PORT` | server | no | panel-managed Node app port |
| `PANEL_REVERSE_PROXY_READY` | server | no | panel reverse proxy confirmation for assisted modes |
| `CPANEL_NODE_APP_READY` | server | no | cPanel Node.js App hard-requirement confirmation |
| `CPANEL_COMMAND_RUNNER_READY` | server | no | cPanel SSH/Terminal or command-runner confirmation |
| `STORAGE_DRIVER` | server | no | `vps-filesystem` |
| `UPLOADS_DIR` | server | no | private upload root, e.g. `/var/lib/kmt-legal/uploads` |
| `MAX_UPLOAD_MB` | server/public safe | no | `5` |
| `ALLOWED_UPLOAD_TYPES` | server | no | PDF/DOC/DOCX/JPG/JPEG/PNG MIME allowlist |
| `SMTP_ENABLED` | server | no | must stay `false`; SMTP is deferred |
| `SMTP_HOST` | server | no | future SMTP hostname placeholder |
| `SMTP_PORT` | server | no | future SMTP port placeholder |
| `SMTP_USER` | server | yes | future SMTP username placeholder |
| `SMTP_PASSWORD` | server | yes | future SMTP password placeholder |
| `SMTP_FROM` | server | no | future sender address placeholder |
| `SMTP_SECURE` | server | no | future TLS mode placeholder |
| `AI_PROVIDER` | server | no | `mock`, `openrouter`, `openai-compatible`, `local`, `custom` |
| `AI_BASE_URL` | server | no/secret depends | provider base URL |
| `AI_API_KEY` | server | yes | provider API key when needed |
| `AI_MODEL` | server | no | provider model name |
| `AI_TIMEOUT_MS` | server | no | provider timeout |
| `AI_MAX_TOKENS` | server | no | provider output cap |
| `AI_TEMPERATURE` | server | no | provider sampling value |
| `SENTRY_DSN` | server/client if used | public-ish | error reporting DSN |
| `SENTRY_AUTH_TOKEN` | CI | yes | source map upload if used |
| `LOG_LEVEL` | server | no | logging level |
| `RATE_LIMIT_DRIVER` | server | no | memory/redis later |
| `ENABLE_STITCH_CLONE` | server | no | enable `/stitch-clone/*` only for non-production visual QA |
| `PLAYWRIGHT_BASE_URL` | tests | no | base URL override used by Playwright runner |
| `KMT_PORT` | tests/dev | no | local app port used by Playwright/dev server runner |

## CI/CD Pipeline
1. Checkout.
2. Install with lockfile (`npm ci` or package-manager equivalent).
3. Secret scan.
4. Lint.
5. Typecheck.
6. Unit tests.
7. Component tests.
8. Prisma validate.
9. Migration check against clean test DB.
10. Integration tests.
11. Build.
12. Dependency audit.
13. Secret scan and route-manifest contract.
14. Deploy to staging VPS target.
15. E2E smoke on staging.
16. Manual approval for production.
17. Production deploy.
18. Post-deploy smoke.
19. Rollback if smoke fails.

## Hosting Plan
- Production target is VPS-class hosting with explicit setup modes.
- Supported setup modes:
  - `terminal-vps`: fresh Ubuntu/Debian VPS with root or sudo, systemd, Nginx, Certbot, PostgreSQL, and private uploads.
  - `aapanel`: aaPanel-managed VPS where domain, SSL, database, and reverse proxy are configured through the panel; installer must not run root-only OS package or Nginx/systemd commands.
  - `cpanel`: conditional cPanel mode only when Node.js App, PostgreSQL, SSH/Terminal or an equivalent command runner, environment variables, and private non-`public_html` storage are available.
- Unsupported setup modes:
  - shared cPanel without persistent Node.js process.
  - cPanel/MySQL-only hosting without PostgreSQL.
  - hosting that exposes uploads only inside public webroot.
  - hosting that cannot run `npm ci`, `npm run build`, Prisma generate, migrations, and seed commands.
- Run the Next.js production build through Docker or a systemd-managed Node process.
- PLAN-25 provides `deploy/install/install.sh` for one-command VPS setup, first Super Admin bootstrap through `/install`, and post-setup installer disable helper.
- PLAN-26 adds a panel-aware installer contract so the operator selects `terminal-vps`, `aapanel`, or `cpanel` before setup begins.
- Place Nginx in front for TLS, reverse proxying, request body limits, rate limiting, compression, and security headers.
- Nginx must not serve the uploads directory directly.
- Nginx must pass `X-Real-IP $remote_addr`; the app ignores client-supplied `X-Forwarded-For` in production.
- Configure Nginx/body limits to align with the 5MB upload contract; app-level `Content-Length`, MIME, extension, and magic-byte validation still applies.
- `/stitch-clone/*` is disabled in production unless `ENABLE_STITCH_CLONE=true` is explicitly set for a controlled visual-QA build.
- Production must run build/start mode, not dev mode.
- PostgreSQL runs on the VPS or a VPS-managed database path with private network/firewall rules.
- After `/install` is locked, run `sudo kmt-legal-disable-installer`; production readiness fails while `INSTALLER_ENABLED=true`.

## Panel-Aware Installer Plan
- Terminal VPS mode may install OS packages and write systemd/Nginx files.
- aaPanel/cPanel modes must be non-root assisted flows. They collect existing panel values, write app env files, run Node/Prisma commands, and print panel-specific reverse proxy/startup instructions.
- Panel preflight must verify Node, npm, PostgreSQL, writable private uploads, app origin, disabled SMTP, disabled TOTP, installer token, and process-manager availability before build/migration/bootstrap.
- aaPanel/cPanel database setup supports two modes: `existing` asks the operator to create the database in the panel first, while `auto` creates it through `psql` and an admin PostgreSQL URL with the warning that it may not appear in the panel UI.
- cPanel mode must fail fast with a clear message when any hard requirement is missing. Do not silently downgrade to an insecure public-upload or SQLite/MySQL path.
- The `/install` web wizard remains shared across all modes after infrastructure preflight succeeds.

## Database Plan
- PostgreSQL primary.
- Prisma migrations committed.
- Migration procedure:
  - backup before production migration.
  - run migration in staging.
  - run smoke tests.
  - deploy app compatible with migration.
- Avoid destructive migrations without backfill and rollback/forward-fix plan.

## Storage Plan
- Production: private VPS filesystem directory such as `/var/lib/kmt-legal/uploads`.
- Local/dev/staging: private directory outside public webroot with the same app authorization rules.
- Store only metadata in DB.
- Download through authorized server route.
- Use generated keys, not client filenames.
- Validate PDF/DOC/DOCX/JPG/JPEG/PNG only and enforce 5MB max.
- Set filesystem ownership/permissions so only the app process and backup user can read files.
- Future: malware scanning and retention jobs.

## Monitoring Plan
- Application health endpoint.
- Error capture with environment and release tags.
- Structured logs with requestId.
- Key operational metrics:
  - login failures
  - consultation submissions
  - conversion failures
  - upload failures by reason
  - permission denied counts
  - email delivery failures
  - installer bootstrap/lock events
  - future staff 2FA failures/resets after reactivation
  - AI provider failures/timeouts/schema-invalid output
  - background job failures later

## Logging Plan
- JSON structured server logs.
- Redact tokens, cookies, passwords, 2FA secrets, OTPs, SMTP credentials, private case summaries, document names/content, raw AI prompts, provider raw responses, and API keys.
- Log requestId, route/action, actorId when safe, status, duration.
- Do not log request/response bodies by default.

## Alerting Plan
- High 500 rate.
- Login abuse/rate-limit spike.
- Upload failure spike.
- Permission denied spike on sensitive resources.
- Email delivery failure spike.
- Installer access attempts and future staff 2FA failure/reset spike after reactivation.
- AI provider timeout/error spike.
- Migration failure.
- Storage errors.
- Queue/job failures later.

## Backup and Restore
- PostgreSQL automated backups.
- Upload directory backup for `/var/lib/kmt-legal/uploads` or configured `UPLOADS_DIR`.
- Backup jobs must cover both database and uploads on the same schedule or document consistency windows.
- Restore runbook:
  - identify restore point.
  - restore database to staging first.
  - restore uploads to staging private directory.
  - verify integrity and app smoke.
  - restore production only with approval.
- Test restore before production launch.

## Release Strategy
- Feature branches or Spec Kit plan branches.
- Staging VPS release candidate before production.
- Release notes include migrations, env changes, deferred items, known risks.
- `qa:local` is not enough for release. Release candidates must also run `qa:db`, `qa:release`, `security:secrets`, and `security:audit`.
- `qa:db` requires a real `DATABASE_URL` and runs migrate + seed + seed + DB-backed E2E.

## Rollback Strategy
- App rollback to previous build.
- Database rollback only for reversible migrations; otherwise forward-fix.
- Storage changes are not rolled back automatically; document manual remediation.
- Keep previous env config available.

## Incident Response
- Triage severity.
- Freeze deployments if data/security incident.
- Capture requestId, release, timeframe, affected role/resource.
- Rotate secrets if exposure suspected.
- Review audit logs.
- Prepare client/legal notification process if required by policy.

## Runbooks
- Local setup.
- Migration.
- Seed reset.
- Upload/storage verification.
- Permission incident.
- Production deploy.
- Rollback.
- Backup restore.
- Secret rotation.
- Error spike triage.
