#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/kmtlegal}"
BRANCH="${BRANCH:-main}"
PM2_APP="${PM2_APP:-kmtlegal}"
PORT="${PORT:-3000}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env.production.local}"

log() {
  printf "\n==> %s\n" "$*"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1"
  fi
}

require_command git
require_command node
require_command npm
require_command pm2

if [[ ! -d "${APP_DIR}/.git" ]]; then
  fail "APP_DIR must point to the Git checkout. Current APP_DIR=${APP_DIR}"
fi

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  fail "Production env file was not found: ${ENV_FILE}"
fi

log "Loading production environment from ${ENV_FILE}"
set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  fail "DATABASE_URL is missing after loading ${ENV_FILE}"
fi

node -e '
  const url = new URL(process.env.DATABASE_URL);
  console.log(`Database target: ${url.username}@${url.hostname}:${url.port || "5432"}${url.pathname}`);
'

log "Fetching ${BRANCH} from GitHub"
git fetch origin "${BRANCH}"

local_commit="$(git rev-parse HEAD)"
remote_commit="$(git rev-parse "origin/${BRANCH}")"

if [[ "${local_commit}" != "${remote_commit}" ]]; then
  log "Updating source to ${remote_commit}"
  git pull --ff-only origin "${BRANCH}"
else
  log "Source is already at ${local_commit}"
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  git status --short --untracked-files=no
  fail "Tracked files are modified. Commit, stash, or reset them before deploying."
fi

log "Installing dependencies including build-time packages"
export NPM_CONFIG_PRODUCTION=false
npm install --include=dev

log "Building a fresh Next.js release"
rm -rf .next
npm run build

log "Applying database migrations"
npm run db:migrate

if pm2 describe "${PM2_APP}" >/dev/null 2>&1; then
  log "Restarting PM2 process ${PM2_APP}"
  PORT="${PORT}" pm2 restart "${PM2_APP}" --update-env
else
  log "Starting PM2 process ${PM2_APP} on port ${PORT}"
  PORT="${PORT}" pm2 start npm --name "${PM2_APP}" -- start
fi

pm2 save

log "Checking local app response"
if ! curl -fsSI "http://127.0.0.1:${PORT}${HEALTH_PATH}" >/dev/null 2>&1; then
  curl -fsSI "http://127.0.0.1:${PORT}/" >/dev/null
fi

log "Deploy finished"
git log -1 --oneline
pm2 list
