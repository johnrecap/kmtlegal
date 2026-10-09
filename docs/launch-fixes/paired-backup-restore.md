# Paired Backup + Restore Runbook (TASK 03, corrected)

One backup set = PostgreSQL custom-format dump + private-uploads archive +
manifest + checksums, published atomically under `DATABASE_BACKUP_DIR/<setId>/`.

## How backups get run (phase-five daily wrapper; scheduler activation pending)

The underlying paired-backup command remains manually callable. Phase five adds
`deploy/install/aapanel-daily-backup.sh` and `scripts/daily-paired-backup.mjs`,
with the user-approved daily 03:00 Africa/Cairo maintenance window, deployment
exclusion, protected recovery configuration and retention of 30 managed successful
sets. aaPanel Cron setup and the native restore drill are NOT_VERIFIED; see
`docs/SERVER_COMMANDS.md` for activation steps and the required current drill receipt.
The deployment script itself still performs a DB-only pre-migration backup.
Do not claim deploy coverage of uploads or that the daily job is already installed.

## Capture modes (different facts, reported separately)

Every completion reports four separate facts: `artifactsVerified`,
`checksumsVerified`, `verifiedConsistent`, `restoreDrillVerified`.

- `live` (default): artifacts + checksums verified; `verifiedConsistent:
  false`. An uncontrolled live capture is NEVER labeled verified-consistent.
- `maintenance-window`: additionally requires `--pause-record="<how writers
  were paused>"` plus zero-writer readings at capture-start AND pre-publish
  (two-point `pg_stat_activity` diagnostic). Only then
  `verifiedConsistent: true` — evidence-based, not a lock proof.
- `--require-consistent` fails the run unless `verifiedConsistent` is
  established. `--require-quiet` remains a point-in-time diagnostic/sanity
  check only; an empty reading does not prove future writes are prevented.

```bash
node scripts/paired-backup.mjs --capture-mode=maintenance-window \
  --require-quiet --pause-record="pm2 stop kmtlegal kmtlegal-payment-maintenance; drain wait" \
  --require-consistent
```

## Exact pause / verify / capture / resume (downtime window)

The current phase-five request authorizes a short daily downtime window. The
wrapper stops and restarts declared PM2 writers and checks application health.
There is no non-disruptive quiesce mode; inventory all writers before activation.

1. Pause: `pm2 stop kmtlegal kmtlegal-payment-maintenance` (existing process
   names from the deploy script). Drain: bounded wait, then verify no app
   backends remain (DB `pg_stat_activity`, `pm2 status` shows stopped).
2. Verify: capture-start reading must show zero other backends or the run
   refuses (`quiesce` stage).
3. Capture: the backup command above (dump → verify → archive → manifest →
   checksums → atomic publish).
4. Resume: `pm2 start kmtlegal` + `pm2 start kmtlegal-payment-maintenance`
   (or the deploy script's start commands), confirm `online`, confirm the
   manifest's two zero readings + `verifiedConsistent: true`.

## Restore (dry-run by default)

```bash
node scripts/paired-restore.mjs --set=<setId>                       # inspect only
node scripts/paired-restore.mjs --apply --set=<setId> \
  --target-uploads=/path/to/empty/restore-uploads --confirm=<setId> \
  [--verify-documents]                                              # writes
# target DB via PAIRED_RESTORE_DATABASE_URL (must differ from source)
```

Apply requires: checksum/manifest/archive validation, a NEW EMPTY target
database and empty target uploads dir, `--confirm=<setId>`. No `--create`.
`--no-owner` restore (ownership ≠ app permissions; grants follow existing
conventions afterwards).

`--verify-documents` checks the RESTORED database (never live source):
every non-deleted `Document.fileKey` must resolve to restored bytes matching
the manifest inventory. A required missing file or checksum mismatch FAILS
verification (`verify` stage, counts + up to 5 sample fileKeys — uuid paths,
safe), preserves the restored targets for diagnosis, and is never reported
as success. Extra archived files are a separate `extra` finding, not a
failure. The actual Prisma-mapped table is `documents`. A missing table or failed
query now FAILS verification; it is never silently reported as a skipped success.

## Verification / failure recovery

- Backup stages: `config|lock|consistency|quiesce|database-dump|
  database-verify|uploads-source|uploads-scan|uploads-archive|destination|
  publish|tools`. Failures exit non-zero, clean their own tmp dir, never
  touch previous sets.
- Restore stages: `incomplete|integrity|manifest|archive|restore-target|
  restore-database|restore-files|verify`.
- Post-restore drill (disposable env): synthetic Client A downloads with
  matching checksum; Client B/anonymous denied; source intact. NOT RUN yet.

## Env names / storage / off-server

Env names only: `DATABASE_URL`, `DATABASE_BACKUP_DIR`, `UPLOADS_DIR`,
`APP_RELEASE`, `POSTGRES_BACKUP_BIN_DIR`, `PAIRED_BACKUP_CAPTURE_MODE`,
`PAIRED_BACKUP_PAUSE_RECORD`, `PAIRED_BACKUP_REQUIRE_QUIET`,
`PAIRED_BACKUP_REQUIRE_CONSISTENT`, `PAIRED_RESTORE_DATABASE_URL`,
`PAIRED_RESTORE_VERIFY_DOCUMENTS`. Storage: same-server dirs `0700`, files
`0600` (Linux). Same-server backups are NOT protection against total
server loss; external storage is deferred by the owner's current decision.

Daily wrapper additions: `ENV_FILE`, `KMT_OPERATIONS_LOCK`,
`DAILY_BACKUP_RESTORE_RECEIPT`, `KMT_ADDITIONAL_WRITER_APPS`, and existing PM2
app/worker names. `recovery.env` is a checksummed mode-600 copy of the protected
application configuration; it is not printed or automatically sourced during
restore. Inspect and adapt it securely for the isolated target. Use the recorded
app release and restore its required role grants. Keep credentials outside Git.
Only a real isolated database/file restore plus successful owned download and
cross-client denial can justify a drill receipt. Mocked ops tests do not.
