#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/kmtlegal}"
BRANCH="${BRANCH:-main}"
PM2_APP="${PM2_APP:-kmtlegal}"
PORT="${PORT:-3000}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env.production.local}"
STATIC_BACKUP_DIR="${STATIC_BACKUP_DIR:-${APP_DIR}/.next-static-previous}"
PM2_START_TIMEOUT_SECONDS="${PM2_START_TIMEOUT_SECONDS:-30}"
PM2_STABILITY_SECONDS="${PM2_STABILITY_SECONDS:-8}"

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
require_command curl

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

pm2_app_status() {
  pm2 jlist | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => {
      const appName = process.argv[1];
      const apps = JSON.parse(input || "[]");
      const app = apps.find((entry) => entry.name === appName);
      process.stdout.write(app?.pm2_env?.status || "missing");
    });
  ' "${PM2_APP}"
}

print_pm2_diagnostics() {
  pm2 describe "${PM2_APP}" || true
  pm2 logs "${PM2_APP}" --lines 80 --nostream || true
}

wait_for_pm2_online() {
  local waited=0
  local status=""

  while (( waited < PM2_START_TIMEOUT_SECONDS )); do
    status="$(pm2_app_status)"
    if [[ "${status}" == "online" ]]; then
      return 0
    fi

    sleep 2
    waited=$((waited + 2))
  done

  print_pm2_diagnostics
  fail "PM2 process ${PM2_APP} did not stay online. Last status: ${status:-unknown}"
}

check_local_response() {
  curl -fsSI "http://127.0.0.1:${PORT}${HEALTH_PATH}" >/dev/null 2>&1 ||
    curl -fsSI "http://127.0.0.1:${PORT}/" >/dev/null 2>&1
}

wait_for_local_response() {
  local waited=0

  while (( waited < PM2_START_TIMEOUT_SECONDS )); do
    if check_local_response; then
      return 0
    fi

    sleep 2
    waited=$((waited + 2))
  done

  print_pm2_diagnostics
  fail "Local app did not respond on http://127.0.0.1:${PORT}${HEALTH_PATH} or /"
}

verify_next_static_manifest() {
  node <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const manifestPath = path.join(".next", "app-build-manifest.json");
if (!fs.existsSync(manifestPath)) {
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const missing = new Set();

for (const files of Object.values(manifest.pages || {})) {
  for (const file of files) {
    if (file.startsWith("static/") && !fs.existsSync(path.join(".next", file))) {
      missing.add(file);
    }
  }
}

if (missing.size > 0) {
  console.error("Missing Next.js static files referenced by app-build-manifest.json:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("Next.js static manifest references are present.");
NODE
}

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
npm ci --include=dev

log "Backing up existing Next.js static assets"
rm -rf "${STATIC_BACKUP_DIR}"
if [[ -d ".next/static" ]]; then
  mkdir -p "${STATIC_BACKUP_DIR}"
  cp -a .next/static/. "${STATIC_BACKUP_DIR}/"
fi

log "Removing stale Next.js build output"
rm -rf .next

log "Building a fresh Next.js release"
npm run build

if [[ -d "${STATIC_BACKUP_DIR}" ]]; then
  log "Restoring previous static assets for open browser tabs and cached HTML"
  mkdir -p .next/static
  cp -a "${STATIC_BACKUP_DIR}/." .next/static/
  rm -rf "${STATIC_BACKUP_DIR}"
fi

log "Verifying Next.js static assets"
verify_next_static_manifest

log "Applying database migrations"
npm run db:migrate

if pm2 describe "${PM2_APP}" >/dev/null 2>&1; then
  log "Recreating PM2 process ${PM2_APP} from ${APP_DIR}"
  pm2 delete "${PM2_APP}"
else
  log "Starting PM2 process ${PM2_APP} from ${APP_DIR}"
fi
PORT="${PORT}" pm2 start npm --name "${PM2_APP}" --cwd "${APP_DIR}" -- start

log "Waiting for PM2 process ${PM2_APP} to stay online"
wait_for_pm2_online

log "Checking local app response"
wait_for_local_response

log "Confirming process stability"
sleep "${PM2_STABILITY_SECONDS}"
wait_for_pm2_online
wait_for_local_response

pm2 save

log "Deploy finished"
git log -1 --oneline
pm2 list
