#!/usr/bin/env sh
set -eu

NGINX_CONF_FILE=./nginx/nginx.https.conf docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
