#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/install/install.sh"
  exit 1
fi

APP_USER="${APP_USER:-kmt-legal}"
APP_DIR="${APP_DIR:-/opt/kmt-legal/current}"
ENV_DIR="${ENV_DIR:-/etc/kmt-legal}"
ENV_FILE="${ENV_FILE:-${ENV_DIR}/kmt-legal.env}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/lib/kmt-legal/uploads}"
LOCK_PATH="${LOCK_PATH:-/var/lib/kmt-legal/install.lock}"
SERVICE_FILE="/etc/systemd/system/kmt-legal.service"
NGINX_FILE="/etc/nginx/sites-available/kmt-legal.conf"

read -rp "Domain name, without https://: " DOMAIN
if [[ -z "${DOMAIN}" ]]; then
  echo "Domain is required."
  exit 1
fi

read -rp "Admin email for TLS notices: " TLS_EMAIL
if [[ -z "${TLS_EMAIL}" ]]; then
  echo "TLS email is required."
  exit 1
fi

DB_NAME="${DB_NAME:-kmt_legal}"
DB_USER="${DB_USER:-kmt_legal}"
if [[ ! "${DB_NAME}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ || ! "${DB_USER}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
  echo "DB_NAME and DB_USER must contain only letters, numbers, and underscores, and must not start with a number."
  exit 1
fi

DB_PASSWORD="$(openssl rand -hex 24)"
AUTH_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
INSTALLER_TOKEN="$(openssl rand -hex 32)"

echo "Installing OS packages..."
apt-get update
apt-get install -y ca-certificates curl gnupg nginx postgresql postgresql-contrib rsync openssl certbot python3-certbot-nginx clamav clamav-daemon

node_supported() {
  node -e '
    const [major, minor] = process.versions.node.split(".").map(Number);
    process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 24 ? 0 : 1);
  ' >/dev/null 2>&1
}

if ! command -v node >/dev/null 2>&1 || ! node_supported; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! node_supported; then
  echo "Node.js 20.19+, 22.12+, or 24+ is required for Prisma. Current: $(node -v)"
  exit 1
fi

if ! id "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /var/lib/kmt-legal --shell /usr/sbin/nologin "${APP_USER}"
fi

mkdir -p "${APP_DIR}" "${ENV_DIR}" "${UPLOADS_DIR}" "$(dirname "${LOCK_PATH}")"
chown -R "${APP_USER}:${APP_USER}" /var/lib/kmt-legal
chmod 750 /var/lib/kmt-legal "${UPLOADS_DIR}"

echo "Creating PostgreSQL database and user..."
DB_PASSWORD_SQL="${DB_PASSWORD//\'/\'\'}"
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD_SQL}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD_SQL}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

echo "Copying application files to ${APP_DIR}..."
rsync -a --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude ".next" \
  --exclude "_workspace" \
  ./ "${APP_DIR}/"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
usermod -a -G clamav "${APP_USER}"
systemctl enable --now clamav-daemon

cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
APP_ENV=production
APP_RELEASE=manual-vps
APP_ORIGIN=https://${DOMAIN}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}
PRISMA_POOL_MAX=10
AUTH_SECRET=${AUTH_SECRET}
SESSION_COOKIE_SECURE=true
CSRF_STRICT_ORIGIN=true
KMT_DEMO_PASSWORD=
KMT_DEMO_TOTP_SECRET=
STAFF_2FA_MODE=disabled
INSTALLER_ENABLED=true
INSTALLER_SETUP_TOKEN=${INSTALLER_TOKEN}
INSTALLER_LOCK_PATH=${LOCK_PATH}

STORAGE_DRIVER=vps-filesystem
UPLOADS_DIR=${UPLOADS_DIR}
MAX_UPLOAD_MB=5
ALLOWED_UPLOAD_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png
MALWARE_SCAN_MODE=required
CLAMAV_SOCKET_PATH=/run/clamav/clamd.ctl
CLAMAV_TIMEOUT_MS=10000

PAYMENT_PROVIDER=paymob
PAYTABS_ENABLED=false
PAYMOB_REQUEST_TIMEOUT_MS=10000
PAYMENT_RECEIPT_TOKEN_MAX_AGE_SECONDS=604800

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
SENTRY_ENABLED=false
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
NEXT_PUBLIC_SENTRY_ENABLED=false
NEXT_PUBLIC_SENTRY_DSN=
ENABLE_STITCH_CLONE=false
EOF
chmod 640 "${ENV_FILE}"
chown root:"${APP_USER}" "${ENV_FILE}"

cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=KMT Legal Next.js application
After=network.target postgresql.service clamav-daemon.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
SupplementaryGroups=clamav
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
Environment=NEXT_TELEMETRY_DISABLED=1
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=${UPLOADS_DIR} ${APP_DIR}/.next $(dirname "${LOCK_PATH}")

[Install]
WantedBy=multi-user.target
EOF

cat > "${NGINX_FILE}" <<EOF
upstream kmt_legal_next {
  server 127.0.0.1:3000;
  keepalive 32;
}

server {
  listen 80;
  server_name ${DOMAIN};

  client_max_body_size 6m;

  location ^~ /uploads/ {
    return 404;
  }

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass http://kmt_legal_next;
  }
}
EOF
ln -sf "${NGINX_FILE}" /etc/nginx/sites-enabled/kmt-legal.conf
nginx -t

cat > /usr/local/bin/kmt-legal-disable-installer <<EOF
#!/usr/bin/env bash
set -euo pipefail
sed -i 's/^INSTALLER_ENABLED=.*/INSTALLER_ENABLED=false/' "${ENV_FILE}"
systemctl restart kmt-legal
echo "Installer disabled and kmt-legal restarted."
EOF
chmod +x /usr/local/bin/kmt-legal-disable-installer

echo "Building application..."
cd "${APP_DIR}"
set -a
. "${ENV_FILE}"
set +a
sudo -E -u "${APP_USER}" npm ci
sudo -E -u "${APP_USER}" npm run db:generate
sudo -E -u "${APP_USER}" npm run build
sudo -E -u "${APP_USER}" npm run db:migrate
sudo -E -u "${APP_USER}" npm run db:seed

systemctl daemon-reload
systemctl enable kmt-legal
systemctl restart kmt-legal

echo "Requesting TLS certificate..."
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${TLS_EMAIL}" --redirect || true
systemctl reload nginx

echo ""
echo "KMT Legal is installed."
echo "Open this one-time URL:"
echo "https://${DOMAIN}/install?token=${INSTALLER_TOKEN}"
echo ""
echo "After the web installer says it is locked, run:"
echo "sudo kmt-legal-disable-installer"
