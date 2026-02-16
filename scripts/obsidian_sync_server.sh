#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${OBSIDIAN_SYNC_SERVER_ENV_FILE:-/etc/openingcloud/obsidian-sync.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

WORKSPACE="${WORKSPACE:-/srv/openingcloud-blog}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-/srv/openingcloud-vault/GardenOfOpeningClouds}"
VAULT_REPO_URL="${OBSIDIAN_VAULT_REPO_URL:-https://github.com/hqy2020/GardenOfOpeningClouds.git}"
VAULT_BRANCH="${OBSIDIAN_VAULT_REPO_BRANCH:-main}"
LOG_FILE="${OBSIDIAN_SYNC_SERVER_LOG_FILE:-/var/log/openingcloud/obsidian-sync-server.log}"

mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$VAULT_DIR")"

{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] start server obsidian sync"

  if [[ -d "$VAULT_DIR/.git" ]]; then
    git -C "$VAULT_DIR" fetch origin "$VAULT_BRANCH"
    git -C "$VAULT_DIR" checkout "$VAULT_BRANCH"
    git -C "$VAULT_DIR" pull --ff-only origin "$VAULT_BRANCH"
  else
    git clone --depth 1 --branch "$VAULT_BRANCH" "$VAULT_REPO_URL" "$VAULT_DIR"
  fi

  REPO_COMMIT="$(git -C "$VAULT_DIR" rev-parse HEAD)"

  cd "$WORKSPACE"
  CONTAINER_VAULT_DIR="/tmp/obsidian-vault-sync"
  docker exec openingclouds-backend sh -lc "rm -rf '$CONTAINER_VAULT_DIR' && mkdir -p '$CONTAINER_VAULT_DIR'"
  docker cp "$VAULT_DIR/." "openingclouds-backend:$CONTAINER_VAULT_DIR"

  docker exec openingclouds-backend python manage.py sync_obsidian_documents "$CONTAINER_VAULT_DIR" \
    --trigger scheduled \
    --auto-update-published \
    --missing-behavior draft \
    --publish-tag "${OBSIDIAN_DOC_SYNC_PUBLISH_TAG:-publish}" \
    --repo-url "$VAULT_REPO_URL" \
    --repo-branch "$VAULT_BRANCH" \
    --repo-commit "$REPO_COMMIT"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] finished server obsidian sync"
} >>"$LOG_FILE" 2>&1
