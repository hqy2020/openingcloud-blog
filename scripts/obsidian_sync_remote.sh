#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/Users/openingcloud/openingcloud-blog"
VAULT_PATH="/Users/openingcloud/Documents/GardenOfOpeningClouds"
TOKEN_ENV="${OBSIDIAN_SYNC_TOKEN_ENV:-OBSIDIAN_SYNC_TOKEN}"
LOG_DIR="${OBSIDIAN_SYNC_LOG_DIR:-$HOME/Library/Logs}"
LOG_FILE="${LOG_DIR}/obsidian-sync.log"
ENV_FILE="${OBSIDIAN_SYNC_ENV_FILE:-$HOME/.config/openingcloud/obsidian-sync.env}"

mkdir -p "$LOG_DIR"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

BASE_URL="${OBSIDIAN_SYNC_BASE_URL:-https://blog.oc.slgneon.cn/api}"

if [[ -n "${!TOKEN_ENV:-}" ]]; then
  export "${TOKEN_ENV}=${!TOKEN_ENV}"
fi

if [[ -z "${!TOKEN_ENV:-}" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] missing token env: ${TOKEN_ENV}" | tee -a "$LOG_FILE"
  exit 1
fi

{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] start obsidian remote sync"
  "$WORKSPACE/backend/.venv/bin/python" "$WORKSPACE/backend/manage.py" sync_obsidian "$VAULT_PATH" \
    --target remote \
    --remote-base-url "$BASE_URL" \
    --remote-token-env "$TOKEN_ENV" \
    --mode overwrite \
    --include-root "3-Knowledge（知识库）" \
    --include-root "2-Resource（参考资源）" \
    --unpublish-behavior draft
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] finished obsidian remote sync"
} >>"$LOG_FILE" 2>&1
