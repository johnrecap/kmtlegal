# Deployment Backup Tool Contract: PLAN-39

## Inputs

- `DATABASE_URL`: existing required authenticated PostgreSQL connection.
- `POSTGRES_BACKUP_BIN_DIR`: optional absolute directory containing both `pg_dump` and
  `pg_restore`.

## Selection

1. Query `SHOW server_version_num` without reading application rows.
2. Parse the PostgreSQL server major.
3. Build candidate directories from the explicit override, exact standard version directory,
   common aaPanel/local directories, installed versioned directories, and current `PATH`.
4. A candidate is valid only when both tools are executable, both report the same numeric major,
   and that major is greater than or equal to the server major.
5. Prefer the exact server major. Otherwise select the lowest compatible newer pair.
6. If an explicit directory is supplied, it must be valid and compatible; a bad override fails
   closed rather than being ignored.

## Backup

- Log the server major, selected tool major, and executable paths without logging credentials.
- Create the existing custom-format archive outside the Git checkout with the selected `pg_dump`.
- Validate the non-empty archive with the selected matching `pg_restore --list`.
- Do not begin Prisma migration, reconciliation, or process restart unless selection and backup
  validation succeed.

## Failure

- Missing or malformed server version fails before backup.
- An older-only client environment fails before migration with guidance to install the client
  package matching the server major or set `POSTGRES_BACKUP_BIN_DIR`.
- No fallback may skip the backup, use an older client, or expose `DATABASE_URL`.
