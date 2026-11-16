#!/usr/bin/env bash
# One-shot VPS setup for texongo-web (Ubuntu 22.04/24.04, run as root).
#
# Usage:
#   DOMAIN=example.com ENV_B64='<base64 of .env>' \
#     bash <(curl -fsSL https://raw.githubusercontent.com/techgohypemedia/texongo-web/main/deploy/setup.sh)
#
# Re-running is safe: it pulls the latest code, rebuilds and restarts.
# After setup, redeploy any time with:  texongo-deploy
set -euo pipefail

: "${DOMAIN:?Set DOMAIN, e.g. DOMAIN=texongo.com}"
REPO_URL="${REPO_URL:-https://github.com/techgohypemedia/texongo-web.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/var/www/texongo-web}"
APP_PORT="${APP_PORT:-3000}"
APP_USER="texongo"
NODE_MAJOR=22

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo -i)"; exit 1; }
export DEBIAN_FRONTEND=noninteractive

log "Installing system packages"
apt-get update -y
apt-get install -y curl git ca-certificates gnupg ufw debian-keyring debian-archive-keyring apt-transport-https

log "Swap (for Next.js build on small VPS)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

log "Node.js ${NODE_MAJOR}"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

log "Caddy (reverse proxy + automatic HTTPS)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi
# Hostinger templates sometimes ship apache/nginx on :80 — free the ports for Caddy
for s in apache2 nginx; do systemctl disable --now "$s" 2>/dev/null || true; done

log "Firewall"
ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

log "App user + code"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
git config --global --add safe.directory "$APP_DIR" || true
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

log "Environment file"
if [ -n "${ENV_B64:-}" ]; then
  echo "$ENV_B64" | base64 -d > "$APP_DIR/.env"
fi
[ -f "$APP_DIR/.env" ] || { echo "No .env found and ENV_B64 not given"; exit 1; }
# Point the public app URL at the real domain (drop any old/duplicate entries)
sed -i '/^NEXT_PUBLIC_APP_URL=/d' "$APP_DIR/.env"
echo "NEXT_PUBLIC_APP_URL=https://${DOMAIN}" >> "$APP_DIR/.env"
grep -q '^NODE_ENV=' "$APP_DIR/.env" || echo "NODE_ENV=production" >> "$APP_DIR/.env"
cp "$APP_DIR/.env" /root/texongo.env.backup && chmod 600 /root/texongo.env.backup
chmod 600 "$APP_DIR/.env"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

log "Install deps + build (takes a few minutes)"
sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && npm ci --no-audit --no-fund && NODE_OPTIONS=--max-old-space-size=3072 npm run build"

log "systemd service"
cat > /etc/systemd/system/texongo.service <<EOF
[Unit]
Description=Texongo Next.js
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
Environment=NODE_ENV=production PORT=${APP_PORT} HOSTNAME=127.0.0.1
ExecStart=/usr/bin/npm run start -- -p ${APP_PORT} -H 127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable texongo >/dev/null
systemctl restart texongo

log "Caddy site config for ${DOMAIN}"
cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    encode zstd gzip
    reverse_proxy 127.0.0.1:${APP_PORT}
}

www.${DOMAIN} {
    redir https://${DOMAIN}{uri} permanent
}
EOF
systemctl enable caddy >/dev/null
systemctl restart caddy

log "Installing 'texongo-deploy' update command"
cat > /usr/local/bin/texongo-deploy <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd ${APP_DIR}
sudo -u ${APP_USER} -H git fetch --depth 1 origin ${BRANCH}
sudo -u ${APP_USER} -H git reset --hard origin/${BRANCH}
sudo -u ${APP_USER} -H bash -c "npm ci --no-audit --no-fund && NODE_OPTIONS=--max-old-space-size=3072 npm run build"
systemctl restart texongo
echo "Deployed \$(git rev-parse --short HEAD)"
EOF
chmod +x /usr/local/bin/texongo-deploy

sleep 5
IP=$(curl -fsS4 https://ifconfig.me || hostname -I | awk '{print $1}')
if curl -fsS -o /dev/null "http://127.0.0.1:${APP_PORT}"; then STATUS="running"; else STATUS="NOT responding — check: journalctl -u texongo -n 100"; fi
cat <<EOF

=====================================================================
 App status : ${STATUS}
 Server IP  : ${IP}

 DNS (at your domain registrar):
   A   @     -> ${IP}
   A   www   -> ${IP}

 HTTPS is issued automatically by Caddy as soon as DNS points here.
 Site: https://${DOMAIN}

 Useful:
   texongo-deploy               # pull latest from GitHub + rebuild + restart
   journalctl -u texongo -f     # app logs
   journalctl -u caddy -f       # proxy / SSL logs
   nano ${APP_DIR}/.env && systemctl restart texongo   (rebuild if NEXT_PUBLIC_* changes)
=====================================================================
EOF
