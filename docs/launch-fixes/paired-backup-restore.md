# Paired Backup + Restore Runbook (TASK 03)

One backup set = PostgreSQL custom-format dump + private-uploads archive +
manifest + checksums, published atomically under `DATABASE_BACKUP_DIR/<setId>/`.

## Backup

```bash
DATABASE_URL=... DATABASE_BACKUP_DIR=... UPLOADS_DIR=... APP_RELEASE=... \
  node scripts/paired-backup.mjs [--require-quiet]
```

- `--require-quiet` refuses capture while other DB writers are connected.
- Set publishes ONLY after dump + `pg_restore --list` + archive + manifest +
  checksums verify. Failures exit non-zero, clean their own tmp dir, and
  never touch previous sets. A concurrent run is refused via lock file.
- Layout: `database.dump`, `uploads.tar.gz`, `manifest.json`,
  `manifest.sha256`. Dirs `0700`, files `0600` (Linux).
- Env names only: `DATABASE_URL`, `DATABASE_BACKUP_DIR`, `UPLOADS_DIR`,
  `APP_RELEASE`, `POSTGRES_BACKUP_BIN_DIR`, `PAIRED_BACKUP_REQUIRE_QUIET`.

## Consistency boundary

`pg_dump` runs in a single-transaction snapshot; the uploads archive is
captured immediately after the dump verifies. Residual skew: files newer
than the dump without a DB row are harmless orphans; DB rows newer than
the archive surface as missing-file 404s (re-upload recovery). For
maintenance windows, run with `--require-quiet` after quiescing writers
(payment worker, app instances) under separate owner authorization.

## Restore (dry-run by default)

```bash
node scripts/paired-restore.mjs --set=<setId>                       # inspect only
node scripts/paired-restore.mjs --apply --set=<setId> \
  --target-uploads=/path/to/empty/restore-uploads \
  --confirm=<setId>                                                 # writes
# target DB via PAIRED_RESTORE_DATABASE_URL (must differ from source)
```

Apply requires: checksum + manifest + archive-path validation, a NEW EMPTY
target database (refused otherwise), an empty separate target uploads dir,
and `--confirm=<setId>`. No `--create`: the archive's DB name never
overrides the target. Objects restore with `--no-owner` (owned by the
restore role); application grants follow existing conventions afterwards
(DB-object ownership ≠ application user permissions).

## Verification / failure recovery

- Backup: non-zero exit names the stage (`config|lock|quiesce|
  database-dump|database-verify|uploads-source|uploads-scan|
  uploads-archive|destination|publish|tools`). Re-run after fixing the cause.
- Restore: `integrity|incomplete|manifest|archive|restore-target|
  restore-database|restore-files|verify`. Never restores into source/prod,
  never drops shared databases, never extracts outside the target.
- Post-restore drill (disposable env): synthetic Client A downloads with
  matching checksum; Client B/anonymous denied; source intact. NOT RUN yet —
  see EXECUTION.md TASK 03 blocker.

## Off-server copies

Backups live on the same server (`DATABASE_BACKUP_DIR`). This is NOT
protection against total server loss. No external destination is
configured; adding one needs owner approval.
