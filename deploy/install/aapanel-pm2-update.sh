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
PUBLIC_VERIFY_ENABLED="${PUBLIC_VERIFY_ENABLED:-true}"
PUBLIC_VERIFY_PATHS="${PUBLIC_VERIFY_PATHS:-/ /articles /case-studies /media /contact}"
NEXT_BIN="${NEXT_BIN:-${APP_DIR}/node_modules/next/dist/bin/next}"

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

print_port_diagnostics() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :${PORT}" || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN || true
  fi
}

stop_stale_port_listener() {
  if command -v fuser >/dev/null 2>&1 && fuser "${PORT}/tcp" >/dev/null 2>&1; then
    log "Stopping stale process still listening on port ${PORT}"
    fuser -k "${PORT}/tcp" || true
    sleep 2
  fi
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

verify_public_origin_matches_local() {
  if [[ "${PUBLIC_VERIFY_ENABLED}" != "true" || -z "${APP_ORIGIN:-}" ]]; then
    return 0
  fi

  log "Checking public origin matches local app"
  APP_ORIGIN="${APP_ORIGIN}" PORT="${PORT}" PUBLIC_VERIFY_PATHS="${PUBLIC_VERIFY_PATHS}" node <<'NODE'
const origin = process.env.APP_ORIGIN.replace(/\/+$/, "");
const port = process.env.PORT || "3000";
const paths = (process.env.PUBLIC_VERIFY_PATHS || "/media /contact").split(/\s+/).filter(Boolean);

function extractBuildId(html) {
  return html.match(/\\"buildId\\":\\"([^\\"]+)/)?.[1] || html.match(/"buildId":"([^"]+)/)?.[1] || null;
}

function staticAssetUrls(html) {
  return [...new Set([...html.matchAll(/["'](\/_next\/static\/[^"']+\.(?:js|css))["']/g)].map((match) => match[1]))];
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function assertSamePageAssets(path, localHtml, publicHtml) {
  const localAssets = sortedUnique(staticAssetUrls(localHtml));
  const publicAssets = sortedUnique(staticAssetUrls(publicHtml));

  if (localAssets.length === 0 || publicAssets.length === 0) {
    return;
  }

  const localKey = localAssets.join("\n");
  const publicKey = publicAssets.join("\n");
  if (localKey !== publicKey) {
    throw new Error(`${path}: public HTML references a different Next.js asset set than the local app. This usually means stale HTML/cache is being served.`);
  }
}

function assertNoStalePublicContentLinks(path, localHtml, publicHtml) {
  const staleDetailLinks = [
    "/articles/contract-risk-basics",
    "/articles/prepare-consultation-file",
    "/case-studies/anonymous-commercial-dispute"
  ];
  const staleContentMarkers = [
    "أساسيات تقليل مخاطر العقود",
    "كيف تجهز ملف استشارة قانونية",
    "تنظيم نزاع تجاري مجهول الأطراف"
  ];

  for (const link of staleDetailLinks) {
    if (!localHtml.includes(link) && publicHtml.includes(link)) {
      throw new Error(`${path}: public HTML still contains stale content link ${link}, but the local app no longer renders it.`);
    }
  }

  for (const marker of staleContentMarkers) {
    if (!localHtml.includes(marker) && publicHtml.includes(marker)) {
      throw new Error(`${path}: public HTML still contains stale content marker "${marker}", but the local app no longer renders it.`);
    }
  }
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function getText(url) {
  const response = await fetch(url, { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.text();
}

async function assertStaticAsset(url) {
  const response = await fetch(url, { method: "HEAD", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } });
  const contentType = response.headers.get("content-type") || "";
  const isJavaScript = url.endsWith(".js");
  const isCss = url.endsWith(".css");

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  if (isJavaScript && !/javascript|ecmascript/.test(contentType)) {
    throw new Error(`${url} returned non-JavaScript content-type: ${contentType || "(missing)"}`);
  }

  if (isCss && !/text\/css/.test(contentType)) {
    throw new Error(`${url} returned non-CSS content-type: ${contentType || "(missing)"}`);
  }
}

(async () => {
  const expectedRelease = process.env.APP_RELEASE || null;
  if (expectedRelease) {
    const localHealthUrl = `http://127.0.0.1:${port}/api/health`;
    const publicHealthUrl = `${origin}/api/health`;
    const [localHealth, publicHealth] = await Promise.all([getJson(localHealthUrl), getJson(publicHealthUrl)]);
    const localRelease = localHealth?.data?.deployment?.release || null;
    const publicRelease = publicHealth?.data?.deployment?.release || null;

    if (localRelease !== expectedRelease) {
      throw new Error(`${localHealthUrl} is serving release ${localRelease || "(missing)"}, expected ${expectedRelease}`);
    }

    if (publicRelease !== expectedRelease) {
      throw new Error(`${publicHealthUrl} is serving release ${publicRelease || "(missing)"}, expected ${expectedRelease}`);
    }

    console.log(`/api/health: public origin and local app are serving release ${expectedRelease}`);
  }

  for (const path of paths) {
    const localUrl = `http://127.0.0.1:${port}${path}`;
    const publicUrl = `${origin}${path}`;
    const [localHtml, publicHtml] = await Promise.all([getText(localUrl), getText(publicUrl)]);
    const localBuildId = extractBuildId(localHtml);
    const publicBuildId = extractBuildId(publicHtml);

    if (localBuildId && publicBuildId && localBuildId !== publicBuildId) {
      throw new Error(`${publicUrl} is serving build ${publicBuildId}, but local ${localUrl} is serving build ${localBuildId}`);
    }

    assertSamePageAssets(path, localHtml, publicHtml);
    assertNoStalePublicContentLinks(path, localHtml, publicHtml);

    const publicAssets = staticAssetUrls(publicHtml);
    await Promise.all(publicAssets.map((assetUrl) => assertStaticAsset(`${origin}${assetUrl}`)));
    console.log(`${path}: public origin matches local build ${localBuildId || publicBuildId || "(build id unavailable)"}`);
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
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

deployed_commit="$(git rev-parse HEAD)"
export APP_RELEASE="${deployed_commit}"
log "Deploying release ${APP_RELEASE}"

log "Installing dependencies including build-time packages"
npm ci --include=dev

if [[ ! -f "${NEXT_BIN}" ]]; then
  fail "Next.js CLI was not found at ${NEXT_BIN}"
fi

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

stop_stale_port_listener
print_port_diagnostics
PORT="${PORT}" pm2 start "${NEXT_BIN}" --name "${PM2_APP}" --cwd "${APP_DIR}" -- start --hostname 127.0.0.1 --port "${PORT}"

log "Waiting for PM2 process ${PM2_APP} to stay online"
wait_for_pm2_online

log "Checking local app response"
wait_for_local_response

log "Confirming process stability"
sleep "${PM2_STABILITY_SECONDS}"
wait_for_pm2_online
wait_for_local_response

verify_public_origin_matches_local

pm2 save

log "Deploy finished"
git log -1 --oneline
pm2 list
