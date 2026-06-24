#!/usr/bin/env bash
set -euo pipefail

PANEL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --panel=*)
      PANEL="${1#*=}"
      shift
      ;;
    --panel)
      PANEL="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

case "${PANEL}" in
  aapanel|cpanel)
    ;;
  terminal-vps)
    echo "Use deploy/install/install.sh for Terminal VPS mode."
    exit 0
    ;;
  *)
    echo "Usage: bash deploy/install/panel-install.sh --panel=aapanel|cpanel"
    exit 1
    ;;
esac

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env.production.local}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

prompt_required() {
  local name="$1"
  local prompt="$2"
  local current="${!name:-}"
  if [[ -z "${current}" ]]; then
    read -rp "${prompt}: " current
  fi
  if [[ -z "${current}" ]]; then
    echo "${name} is required."
    exit 1
  fi
  printf -v "${name}" '%s' "${current}"
}

prompt_default() {
  local name="$1"
  local prompt="$2"
  local default="$3"
  local current="${!name:-}"
  if [[ -z "${current}" ]]; then
    read -rp "${prompt} [${default}]: " current
  fi
  if [[ -z "${current}" ]]; then
    current="${default}"
  fi
  printf -v "${name}" '%s' "${current}"
}

confirm_required() {
  local prompt="$1"
  local answer=""
  read -rp "${prompt} [yes/no]: " answer
  if [[ "${answer}" != "yes" ]]; then
    echo "Unsupported hosting for this setup mode."
    exit 1
  fi
}

random_hex() {
  node -e "process.stdout.write(require('crypto').randomBytes(Number(process.argv[1])).toString('hex'))" "$1"
}

url_encode() {
  node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$1"
}

validate_node() {
  local major
  major="$(node -p "Number(process.versions.node.split('.')[0])")"
  if [[ "${major}" -lt 20 ]]; then
    echo "Node.js >= 20 is required. Current: $(node -v)"
    exit 1
  fi
}

validate_postgres_url() {
  case "${DATABASE_URL}" in
    postgresql://*|postgres://*)
      ;;
    *)
      echo "DATABASE_URL must point to PostgreSQL."
      exit 1
      ;;
  esac
}

validate_pg_identifier() {
  local name="$1"
  local value="$2"
  if [[ ! "${value}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
    echo "${name} must contain only letters, numbers, and underscores, and must not start with a number."
    exit 1
  fi
}

sql_literal() {
  node -e "process.stdout.write(String(process.argv[1]).replace(/'/g, \"''\"))" "$1"
}

choose_database_mode() {
  DB_SETUP_MODE="${DB_SETUP_MODE:-}"
  if [[ -z "${DB_SETUP_MODE}" ]]; then
    echo ""
    echo "Database setup mode:"
    echo "  existing  - Recommended for aaPanel/cPanel. Create database in the panel first so it appears in the panel UI."
    echo "  auto      - Script creates PostgreSQL database/user using an admin connection. It may not appear in the panel UI."
    read -rp "Choose database setup mode [existing/auto]: " DB_SETUP_MODE
  fi
  if [[ -z "${DB_SETUP_MODE}" ]]; then
    DB_SETUP_MODE="existing"
  fi
  case "${DB_SETUP_MODE}" in
    existing|auto)
      ;;
    *)
      echo "DB_SETUP_MODE must be existing or auto."
      exit 1
      ;;
  esac
}

configure_database() {
  choose_database_mode

  if [[ "${DB_SETUP_MODE}" == "existing" ]]; then
    prompt_required DATABASE_URL "PostgreSQL DATABASE_URL from the panel-created database"
    validate_postgres_url
    return
  fi

  echo ""
  echo "WARNING: auto database creation can create a real PostgreSQL database, but aaPanel/cPanel may not list it in their database UI."
  echo "Use existing mode if you need panel UI management."
  confirm_required "Continue with automatic database creation"

  require_command psql
  prompt_required DB_ADMIN_URL "PostgreSQL admin URL, for example postgresql://postgres:password@127.0.0.1:5432/postgres"
  prompt_default DB_HOST "Database host for app connection" "127.0.0.1"
  prompt_default DB_PORT "Database port for app connection" "5432"
  prompt_default DB_NAME "Application database name" "kmt_legal"
  prompt_default DB_USER "Application database user" "kmt_legal"
  DB_PASSWORD="${DB_PASSWORD:-$(random_hex 24)}"

  validate_pg_identifier DB_NAME "${DB_NAME}"
  validate_pg_identifier DB_USER "${DB_USER}"

  local db_password_sql
  db_password_sql="$(sql_literal "${DB_PASSWORD}")"

  psql "${DB_ADMIN_URL}" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE "${DB_USER}" LOGIN PASSWORD '${db_password_sql}';
  ELSE
    ALTER ROLE "${DB_USER}" WITH PASSWORD '${db_password_sql}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE "${DB_NAME}" TO "${DB_USER}";
SQL

  local encoded_user encoded_password
  encoded_user="$(url_encode "${DB_USER}")"
  encoded_password="$(url_encode "${DB_PASSWORD}")"
  DATABASE_URL="postgresql://${encoded_user}:${encoded_password}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

validate_uploads_dir() {
  local normalized
  normalized="$(node -e "const path=require('path'); process.stdout.write(path.resolve(process.argv[1]).replace(/\\\\/g,'/').toLowerCase())" "${UPLOADS_DIR}")"
  case "${normalized}" in
    *"/public_html" | *"/public_html/"* | *"/public" | *"/public/"*)
      echo "UPLOADS_DIR must be outside public webroot and public_html."
      exit 1
      ;;
  esac
  mkdir -p "${UPLOADS_DIR}"
  if [[ ! -w "${UPLOADS_DIR}" ]]; then
    echo "UPLOADS_DIR is not writable by the current user: ${UPLOADS_DIR}"
    exit 1
  fi
}

require_command node
require_command npm
validate_node

if [[ "${PANEL}" == "aapanel" ]]; then
  confirm_required "Confirm aaPanel domain, SSL, database, and reverse proxy are already configured"
fi

if [[ "${PANEL}" == "cpanel" ]]; then
  confirm_required "Confirm cPanel Node.js App is available"
  confirm_required "Confirm cPanel PostgreSQL is available"
  confirm_required "Confirm cPanel Terminal or command runner is available"
  confirm_required "Confirm cPanel environment variables can be configured"
  confirm_required "Confirm uploads can be stored outside public_html"
fi

prompt_required APP_ORIGIN "Application origin, for example https://example.com"
configure_database
prompt_required UPLOADS_DIR "Private uploads directory outside the public webroot"
prompt_required APP_PORT "Node app port, for example 3000"

AUTH_SECRET="${AUTH_SECRET:-$(random_hex 48)}"
INSTALLER_SETUP_TOKEN="${INSTALLER_SETUP_TOKEN:-$(random_hex 32)}"
INSTALLER_LOCK_PATH="${INSTALLER_LOCK_PATH:-${APP_DIR}/storage/install.lock}"

validate_postgres_url
validate_uploads_dir

cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
APP_ENV=production
APP_RELEASE=panel-${PANEL}
APP_ORIGIN=${APP_ORIGIN}
DATABASE_URL=${DATABASE_URL}
DB_SETUP_MODE=${DB_SETUP_MODE}
PRISMA_POOL_MAX=${PRISMA_POOL_MAX:-5}
AUTH_SECRET=${AUTH_SECRET}
SESSION_COOKIE_SECURE=true
CSRF_STRICT_ORIGIN=true
KMT_DEMO_PASSWORD=
KMT_DEMO_TOTP_SECRET=
STAFF_2FA_MODE=disabled
INSTALLER_ENABLED=true
INSTALLER_SETUP_TOKEN=${INSTALLER_SETUP_TOKEN}
INSTALLER_LOCK_PATH=${INSTALLER_LOCK_PATH}
HOSTING_MODE=${PANEL}
PORT=${APP_PORT}
APP_PORT=${APP_PORT}
PANEL_REVERSE_PROXY_READY=true
CPANEL_NODE_APP_READY=$([[ "${PANEL}" == "cpanel" ]] && echo "true" || echo "false")
CPANEL_COMMAND_RUNNER_READY=$([[ "${PANEL}" == "cpanel" ]] && echo "true" || echo "false")

STORAGE_DRIVER=vps-filesystem
UPLOADS_DIR=${UPLOADS_DIR}
MAX_UPLOAD_MB=5
ALLOWED_UPLOAD_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png

SMTP_ENABLED=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_SECURE=false

AI_PROVIDER=mock
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
AI_TIMEOUT_MS=30000
AI_MAX_TOKENS=1200
AI_TEMPERATURE=0.2

ANALYTICS_ENABLED=true
ENABLE_STITCH_CLONE=false
EOF

chmod 600 "${ENV_FILE}"

set -a
. "${ENV_FILE}"
set +a

npm ci
npm run db:generate
npm run build
npm run db:migrate
npm run db:seed

echo ""
echo "Panel-assisted setup finished for ${PANEL}."
echo "Configure the panel Node app startup command:"
echo "npm run start -- --hostname 127.0.0.1 --port ${APP_PORT}"
echo ""
echo "Open this one-time installer URL:"
echo "${APP_ORIGIN}/install?token=${INSTALLER_SETUP_TOKEN}"
echo ""
echo "After locking the installer, set INSTALLER_ENABLED=false in the panel environment and restart the Node app."
