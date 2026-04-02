#!/usr/bin/env sh
set -eu

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SCRIPT_PATH="$REPO_ROOT/scripts/check_domain_health.sh"
LOG_DIR="${LOG_DIR:-$REPO_ROOT/logs}"
LOG_FILE="${LOG_FILE:-$LOG_DIR/domain_health.log}"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 */3 * * *}"
DOMAIN="${DOMAIN:-blog.openingclouds.xyz}"
EXPECTED_IP="${EXPECTED_IP:-47.99.42.71}"

mkdir -p "$LOG_DIR"

entry="$CRON_SCHEDULE DOMAIN=$DOMAIN EXPECTED_IP=$EXPECTED_IP $SCRIPT_PATH >> $LOG_FILE 2>&1"

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

if crontab -l >"$tmp_file" 2>/dev/null; then
  :
else
  : >"$tmp_file"
fi

if grep -F "$SCRIPT_PATH" "$tmp_file" >/dev/null 2>&1; then
  grep -Fv "$SCRIPT_PATH" "$tmp_file" >"$tmp_file.new" || true
  mv "$tmp_file.new" "$tmp_file"
fi

printf '%s\n' "$entry" >>"$tmp_file"
crontab "$tmp_file"

printf 'Installed cron entry:\n%s\n' "$entry"
