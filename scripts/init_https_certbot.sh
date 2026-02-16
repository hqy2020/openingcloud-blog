#!/usr/bin/env sh
set -eu

DOMAIN=${1:-openingclouds.ccwu.cc}
EMAIL=${2:-}

if [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email>"
  exit 1
fi

mkdir -p ./certbot/conf ./certbot/www

# Start HTTP stack first (for ACME challenge). Use https compose overlay
# so nginx mounts ./certbot/www and can serve ACME challenge files.
NGINX_CONF_FILE=./nginx/nginx.conf docker compose -f docker-compose.yml -f docker-compose.https.yml up -d backend nginx certbot

# Request certificate

docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot:latest certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos --no-eff-email --non-interactive

# Restart with HTTPS config + renew service
NGINX_CONF_FILE=./nginx/nginx.https.conf docker compose -f docker-compose.yml -f docker-compose.https.yml up -d

echo "HTTPS bootstrap completed for $DOMAIN"
