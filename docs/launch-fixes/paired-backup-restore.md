# Paired Backup + Restore Runbook (TASK 03, corrected)

One backup set = PostgreSQL custom-format dump + private-uploads archive +
manifest + checksums, published atomically under `DATABASE_BACKUP_DIR/<setId>/`.

## How backups get run (manual command — NOT wired into deploy)

This is a **manually invoked** paired-backup command. The deployment script
does NOT call it: `deploy/install/aapanel-pm2-update.sh` still runs only its
DB-only `create_verified_database_backup` (line ~783, called ~909). Before
operational use, the owner must: pass the real restore drill (blockers A+B
in EXECUTION.md), decide scheduling (cron/PM2/timer), and sign off — none
of which is wired here. Do not claim deploy coverage of uploads.

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

Requires separate owner authorization (downtime). No in-app maintenance or
drain mode exists — this is the missing operational prerequisite if a
non-disruptive quiesce is ever required.

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
failure. Missing `Document` table → explicit `skipped-no-document-table`.

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
server loss; no external destination configured (needs approval).
