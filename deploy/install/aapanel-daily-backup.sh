#!/usr/bin/env bash
set -euo pipefail
umask 077
APP_DIR="${APP_DIR:-/www/wwwroot/kmtlegal}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env.production.local}"
[[ -d "${APP_DIR}/.git" && -f "${ENV_FILE}" ]] || { echo "Missing application or protected environment file." >&2; exit 1; }
cd "${APP_DIR}"
set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a
export APP_DIR ENV_FILE
command -v flock >/dev/null
OPERATIONS_LOCK="${KMT_OPERATIONS_LOCK:-/www/backup/kmtlegal-operations.lock}"
mkdir -p "$(dirname "${OPERATIONS_LOCK}")"
exec 9>"${OPERATIONS_LOCK}"
flock -n 9 || { echo "Another KMT deployment or backup is running." >&2; exit 75; }
export KMT_DAILY_LOCK_HELD=1
node scripts/daily-paired-backup.mjs "$@"
