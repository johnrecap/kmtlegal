# 18 — Deployment & Operations Audit

## Normal production flow (aaPanel + PM2, default target)

1. Push to `origin/main`.
2. Server: `cd /www/wwwroot/kmtlegal` → `bash deploy/install/aapanel-pm2-update.sh`.
3. Script: env preflight (incl. ClamAV `zPING` + `MALWARE_SCAN_MODE=required`
   hard fail) → `pg_dump --format=custom` to `DATABASE_BACKUP_DIR`
   (`/www/backup/kmtlegal`, `umask 077`, `pg_restore --list` verify) →
   `.next/static` backup → `git ff-only` (dirty-tree guard) → `npm ci` →
   `prisma generate` → `prisma migrate deploy` → `jobs:payments` once →
   `npm run build` → PM2 reload `kmtlegal` (`next start 127.0.0.1:3000`) +
   `kmtlegal-payment-maintenance` (`jobs:payments:watch`) → `pm2 save` →
   health-gated verify (`/api/health`, release, cache, retired assets).
4. Rollback (no script): `pg_restore <dump>` + redeploy prior SHA.

## Component verdicts

| Item | Status | Notes |
|---|---|---|
| Deploy script | PARTIAL/MEDIUM | Comprehensive but monolithic (948 lines); no rollback script |
| PM2 (no ecosystem file, CLI-managed) | PARTIAL/MEDIUM | Works; stability waits tuned; config lives in script |
| Nginx example | PARTIAL/LOW | `client_max_body_size 6m`, `/uploads/ → 404`; CSP/headers not reviewed |
| Migration flow | WORKING/MEDIUM | `migrate deploy` + generate + seed paths; `prisma.config.ts` DB-gated |
| Env handling | PARTIAL/MEDIUM | Examples complete; installer `openssl rand`; file perms `640 root:kmt-legal` |
| Health checks | WORKING/MEDIUM | Readiness covers env/DB/schema/seed/ClamAV/Paymob/bootstrap; `no-store` |
| Logging | PARTIAL/LOW | Safe-log + redaction; Sentry flag-gated (off by default) |
| Restart behavior | PARTIAL/LOW | PM2 save; no systemd unit in active path (example only) |
| Rollback | GAP (manual) | Dumps verified; no tested restore drill |
| Backup | PARTIAL/MEDIUM | `pg_dump` custom + verify; uploads dir NOT in dump (files need fs backup — GAP) |
| Installation | WORKING/MEDIUM | Token installer + lock file; readiness blocks until done |

## Dangerous assumptions

1. Uploads live outside the DB dump — a DB-only restore orphans file
   rows. Fix: fs backup of `UPLOADS_DIR` in the same script (P1).
2. Payment worker liveness assumed — no alerting if `kmtlegal-payment-
   maintenance` dies (P2).
3. Single-node disk assumed everywhere (sessions in DB ✓ portable;
   files ✗). Scale-out needs shared storage (P2 note).
4. `ALLOW_BUILD_WITHOUT_DATABASE_URL` hatch must never be set in prod
   build env (P2 checklist).
5. Fresh-install path (`install.sh` root VPS) vs panel path diverge;
   only panel path is exercised regularly (P3).

## Required production env (names only)

`NODE_ENV/APP_ENV/APP_ORIGIN/DATABASE_URL/AUTH_SECRET/
CLIENT_ACCOUNT_SETUP_SIGNING_SECRET/PAYMENT_RECEIPT_SIGNING_SECRET/
STATUS_SIGNING_SECRET/PAYMOB_SECRET_KEY/PAYMOB_PUBLIC_KEY/PAYMOB_HMAC_SECRET/
PAYMOB_PAYMENT_METHOD_IDS/PAYTABS_* (if enabled)/STORAGE_DRIVER=vps-filesystem/
UPLOADS_DIR/MALWARE_SCAN_MODE=required/CLAMAV_*/SMTP_* (if enabled)/
AI_PROVIDER/BASE_URL/API_KEY/MODEL (if live)/NEXT_PUBLIC_KMT_WHATSAPP_URL/
INSTALLER_ENABLED=false/SENTRY_* (optional)/DATABASE_BACKUP_DIR/
RATE_LIMIT_STORAGE=postgres`. Full catalog: `.env.example`,
`deploy/env.production.example`.
