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
PUBLIC_VERIFY_RETRY_DELAY_SECONDS="${PUBLIC_VERIFY_RETRY_DELAY_SECONDS:-3}"
PUBLIC_CACHE_PURGE_ENABLED="${PUBLIC_CACHE_PURGE_ENABLED:-true}"
PUBLIC_PROXY_CACHE_DIRS="${PUBLIC_PROXY_CACHE_DIRS:-}"
PUBLIC_CACHE_POLICY_ENABLED="${PUBLIC_CACHE_POLICY_ENABLED:-true}"
PUBLIC_CACHE_POLICY_INCLUDE="${PUBLIC_CACHE_POLICY_INCLUDE:-}"
PUBLIC_NGINX_VHOST_FILES="${PUBLIC_NGINX_VHOST_FILES:-}"
PUBLIC_CACHEABLE_VERIFY_PATHS="${PUBLIC_CACHEABLE_VERIFY_PATHS:-/ /services /team /book-consultation /ar /ar/services}"
SENSITIVE_CACHE_VERIFY_PATHS="${SENSITIVE_CACHE_VERIFY_PATHS:-/api/health /api/auth/me /admin /client /portal /login /install}"
NGINX_RELOAD_AFTER_CACHE_PURGE="${NGINX_RELOAD_AFTER_CACHE_PURGE:-true}"
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

public_origin_host() {
  APP_ORIGIN="${APP_ORIGIN:-}" node <<'NODE'
const origin = process.env.APP_ORIGIN || "";
try {
  process.stdout.write(new URL(origin).hostname);
} catch {
  process.exit(1);
}
NODE
}

public_proxy_cache_dirs() {
  if [[ -n "${PUBLIC_PROXY_CACHE_DIRS:-}" ]]; then
    local configured_dir=""
    for configured_dir in ${PUBLIC_PROXY_CACHE_DIRS}; do
      printf '%s\n' "${configured_dir}"
    done
    return 0
  fi

  if [[ -n "${APP_ORIGIN:-}" ]]; then
    local host=""
    if host="$(public_origin_host 2>/dev/null)" && [[ -n "${host}" ]]; then
      printf '/www/wwwroot/%s/proxy_cache_dir\n' "${host}"
    fi
  fi
}

is_safe_proxy_cache_dir() {
  local cache_dir="${1%/}"
  [[ "${cache_dir}" == /www/wwwroot/*/proxy_cache_dir ]]
}

purge_public_proxy_cache() {
  if [[ "${PUBLIC_CACHE_PURGE_ENABLED}" != "true" ]]; then
    log "Public proxy cache purge is disabled"
    return 0
  fi

  local cache_dir=""
  local purged=0

  while IFS= read -r cache_dir; do
    [[ -n "${cache_dir}" ]] || continue
    cache_dir="${cache_dir%/}"

    if ! is_safe_proxy_cache_dir "${cache_dir}"; then
      log "Skipping unsafe proxy cache path: ${cache_dir}"
      continue
    fi

    if [[ ! -d "${cache_dir}" ]]; then
      log "Proxy cache directory was not found: ${cache_dir}"
      continue
    fi

    if [[ -L "${cache_dir}" ]]; then
      log "Skipping symlinked proxy cache path: ${cache_dir}"
      continue
    fi

    log "Purging public proxy cache: ${cache_dir}"
    find "${cache_dir}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    purged=1
  done < <(public_proxy_cache_dirs)

  if [[ "${purged}" != "1" ]]; then
    log "No public proxy cache directory was purged"
  fi
}

reload_nginx_after_cache_purge() {
  if [[ "${NGINX_RELOAD_AFTER_CACHE_PURGE}" != "true" ]]; then
    return 0
  fi

  if command -v nginx >/dev/null 2>&1; then
    log "Reloading Nginx after proxy cache purge"
    nginx -t && nginx -s reload || true
    return 0
  fi

  if [[ -x "/www/server/nginx/sbin/nginx" ]]; then
    log "Reloading aaPanel Nginx after proxy cache purge"
    /www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload || true
  fi
}

public_cache_policy_include_path() {
  if [[ -n "${PUBLIC_CACHE_POLICY_INCLUDE:-}" ]]; then
    printf '%s\n' "${PUBLIC_CACHE_POLICY_INCLUDE}"
    return 0
  fi

  if [[ -n "${APP_ORIGIN:-}" ]]; then
    local host=""
    if host="$(public_origin_host 2>/dev/null)" && [[ -n "${host}" ]]; then
      printf '/www/wwwroot/%s/kmt-public-cache-policy.conf\n' "${host}"
    fi
  fi
}

public_nginx_vhost_files() {
  if [[ -n "${PUBLIC_NGINX_VHOST_FILES:-}" ]]; then
    local configured_file=""
    for configured_file in ${PUBLIC_NGINX_VHOST_FILES}; do
      printf '%s\n' "${configured_file}"
    done
    return 0
  fi

  if [[ -n "${APP_ORIGIN:-}" ]]; then
    local host=""
    if host="$(public_origin_host 2>/dev/null)" && [[ -n "${host}" ]]; then
      printf '/www/server/panel/vhost/nginx/%s.conf\n' "${host}"
      printf '/www/server/nginx/conf/vhost/%s.conf\n' "${host}"
      printf '/www/server/nginx/conf/conf.d/%s.conf\n' "${host}"
    fi
  fi
}

write_public_cache_policy_include() {
  local include_path="$1"
  local include_dir=""
  include_dir="$(dirname "${include_path}")"

  if [[ -z "${include_path}" ]]; then
    return 1
  fi

  mkdir -p "${include_dir}"
  cat > "${include_path}" <<'NGINX'
# Generated by KMT Legal deploy. Keep public HTML cacheable while protecting private routes.
proxy_hide_header Cache-Control;
proxy_hide_header Pragma;
proxy_hide_header Expires;

set $kmt_cache_control "public, max-age=60, s-maxage=900, stale-while-revalidate=86400";

if ($request_method !~ ^(GET|HEAD)$) {
  set $kmt_cache_control "no-store";
}

if ($request_uri ~* "^/(api|admin|client|portal|login|install)(/|$)") {
  set $kmt_cache_control "no-store";
}

if ($request_uri ~* "^/_next/static/") {
  set $kmt_cache_control "public, max-age=31536000, immutable";
}

if ($request_uri ~* "^/(brand|site-assets)/") {
  set $kmt_cache_control "public, max-age=31536000, immutable";
}

add_header Cache-Control $kmt_cache_control always;
add_header X-Kmt-Proxy "kmt-public-cache-policy" always;
NGINX
}

patch_public_nginx_vhost_configs() {
  local include_path="$1"
  local vhost_files=""
  local vhost_file=""

  while IFS= read -r vhost_file; do
    [[ -n "${vhost_file}" && -f "${vhost_file}" ]] || continue
    vhost_files+="${vhost_file}"$'\n'
  done < <(public_nginx_vhost_files)

  if [[ -z "${vhost_files}" ]]; then
    log "No aaPanel/Nginx vhost config was found for APP_ORIGIN; cache header verification will still run"
    return 0
  fi

  PUBLIC_CACHE_POLICY_INCLUDE_PATH="${include_path}" PUBLIC_NGINX_VHOST_FILES_LIST="${vhost_files}" PUBLIC_NGINX_HOST="$(public_origin_host 2>/dev/null || true)" node <<'NODE'
const fs = require("node:fs");

const includePath = process.env.PUBLIC_CACHE_POLICY_INCLUDE_PATH;
const host = process.env.PUBLIC_NGINX_HOST || "";
const files = (process.env.PUBLIC_NGINX_VHOST_FILES_LIST || "").split(/\n+/).filter(Boolean);
const includeBlock = [
  "  # KMT public cache policy start",
  `  include ${includePath};`,
  "  # KMT public cache policy end"
].join("\n");

function findServerBlocks(source) {
  const blocks = [];
  const re = /\bserver\s*\{/g;
  let match;

  while ((match = re.exec(source))) {
    const open = source.indexOf("{", match.index);
    let depth = 0;

    for (let index = open; index < source.length; index += 1) {
      const char = source[index];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) {
        blocks.push({ start: match.index, end: index + 1 });
        re.lastIndex = index + 1;
        break;
      }
    }
  }

  return blocks;
}

function blockMatches(block) {
  const hostPattern = host ? new RegExp(String.raw`server_name\s+[^;]*${host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i") : /server_name/i;
  return hostPattern.test(block) && (/proxy_pass/i.test(block) || /listen\s+443/i.test(block) || /ssl_certificate/i.test(block));
}

function patchBlock(block) {
  let next = block
    .replace(/^(\s*)(add_header\s+X-Kmt-Proxy\s+.*next-no-cache.*;)$/gim, "$1# $2 # disabled by KMT public cache policy")
    .replace(/^(\s*)(add_header\s+Cache-Control\s+.*(?:no-store|no-cache|max-age=0).*;)$/gim, "$1# $2 # disabled by KMT public cache policy");

  if (!next.includes("KMT public cache policy start")) {
    const closeIndex = next.lastIndexOf("}");
    if (closeIndex !== -1) {
      next = `${next.slice(0, closeIndex)}${includeBlock}\n${next.slice(closeIndex)}`;
    }
  }

  return next;
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const blocks = findServerBlocks(source);
  const selected = blocks.filter((block) => blockMatches(source.slice(block.start, block.end)));

  if (selected.length === 0) {
    console.log(`${file}: no matching server block for ${host || "(unknown host)"}`);
    continue;
  }

  let next = source;
  for (const block of [...selected].reverse()) {
    const current = next.slice(block.start, block.end);
    const patched = patchBlock(current);
    next = `${next.slice(0, block.start)}${patched}${next.slice(block.end)}`;
  }

  if (next !== source) {
    const backup = `${file}.kmt-cache-backup-${Date.now()}`;
    fs.copyFileSync(file, backup);
    fs.writeFileSync(file, next);
    console.log(`${file}: installed KMT public cache policy include; backup ${backup}`);
  } else {
    console.log(`${file}: KMT public cache policy already present`);
  }
}
NODE
}

install_public_cache_policy() {
  if [[ "${PUBLIC_CACHE_POLICY_ENABLED}" != "true" || -z "${APP_ORIGIN:-}" ]]; then
    return 0
  fi

  local include_path=""
  include_path="$(public_cache_policy_include_path || true)"
  if [[ -z "${include_path}" ]]; then
    log "Could not derive a public cache policy include path; cache header verification will still run"
    return 0
  fi

  log "Installing public cache policy include"
  write_public_cache_policy_include "${include_path}"
  patch_public_nginx_vhost_configs "${include_path}"
  reload_nginx_after_cache_purge
}

run_public_origin_verify_once() {
  APP_ORIGIN="${APP_ORIGIN}" PORT="${PORT}" PUBLIC_VERIFY_PATHS="${PUBLIC_VERIFY_PATHS}" PUBLIC_CACHEABLE_VERIFY_PATHS="${PUBLIC_CACHEABLE_VERIFY_PATHS}" SENSITIVE_CACHE_VERIFY_PATHS="${SENSITIVE_CACHE_VERIFY_PATHS}" node <<'NODE'
const origin = process.env.APP_ORIGIN.replace(/\/+$/, "");
const port = process.env.PORT || "3000";
const paths = (process.env.PUBLIC_VERIFY_PATHS || "/media /contact").split(/\s+/).filter(Boolean);
const publicCacheablePaths = (process.env.PUBLIC_CACHEABLE_VERIFY_PATHS || "/").split(/\s+/).filter(Boolean);
const sensitiveCachePaths = (process.env.SENSITIVE_CACHE_VERIFY_PATHS || "/api/health /admin /client /portal /login").split(/\s+/).filter(Boolean);

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

async function getHeaders(url) {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 500) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.headers;
}

function assertPublicCacheHeaders(path, headers) {
  const cacheControl = headers.get("cache-control") || "";
  const proxyMarker = headers.get("x-kmt-proxy") || "";

  if (/no-store|no-cache|private|max-age=0|proxy-revalidate/i.test(cacheControl)) {
    throw new Error(`${path}: public page is still not cacheable. Cache-Control=${cacheControl || "(missing)"}, X-Kmt-Proxy=${proxyMarker || "(missing)"}`);
  }

  if (/next-no-cache/i.test(proxyMarker)) {
    throw new Error(`${path}: public page still has the old next-no-cache proxy marker.`);
  }

  console.log(`${path}: public cache headers are cacheable (${cacheControl || "no explicit Cache-Control"}, CF=${headers.get("cf-cache-status") || "n/a"})`);
}

function assertSensitiveNoStoreHeaders(path, headers) {
  const cacheControl = headers.get("cache-control") || "";

  if (!/no-store/i.test(cacheControl)) {
    throw new Error(`${path}: sensitive path must keep Cache-Control no-store. Current Cache-Control=${cacheControl || "(missing)"}`);
  }

  console.log(`${path}: sensitive path keeps no-store`);
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

  for (const path of publicCacheablePaths) {
    const headers = await getHeaders(`${origin}${path}`);
    assertPublicCacheHeaders(path, headers);
  }

  for (const path of sensitiveCachePaths) {
    const headers = await getHeaders(`${origin}${path}`);
    assertSensitiveNoStoreHeaders(path, headers);
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
NODE
}

verify_public_origin_matches_local() {
  if [[ "${PUBLIC_VERIFY_ENABLED}" != "true" || -z "${APP_ORIGIN:-}" ]]; then
    return 0
  fi

  log "Checking public origin matches local app"
  if run_public_origin_verify_once; then
    return 0
  fi

  log "Public origin did not match local app. Purging public proxy cache and retrying once"
  purge_public_proxy_cache
  reload_nginx_after_cache_purge
  sleep "${PUBLIC_VERIFY_RETRY_DELAY_SECONDS}"

  log "Rechecking public origin after proxy cache purge"
  run_public_origin_verify_once
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

install_public_cache_policy
verify_public_origin_matches_local

pm2 save

log "Deploy finished"
git log -1 --oneline
pm2 list
