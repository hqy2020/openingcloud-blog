#!/usr/bin/env sh
set -eu

BASE_URL=${1:-http://127.0.0.1}

curl -fsS "$BASE_URL/api/health" | sed 's/.*/Health OK: &/'
