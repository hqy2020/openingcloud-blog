#!/usr/bin/env bash
set -euo pipefail

HOST="${ALIYUN_HOST:-aliyun-blog}"
REMOTE_PATH="${ALIYUN_PROJECT_PATH:-/opt/openingclouds-blog}"
SKIP_DB=0
SKIP_STASH=0

usage() {
  cat <<'EOF'
Usage:
  scripts/sync_from_aliyun.sh [--skip-db] [--skip-stash]

Description:
  Sync remote Aliyun project state to local workspace:
  1) Capture remote git snapshot
  2) Export remote stash patches/files to reports/aliyun-sync-<timestamp>/stashes
  3) Backup local SQLite and rsync remote SQLite to local data/blog.sqlite3

Options:
  --skip-db      Skip SQLite sync
  --skip-stash   Skip remote stash export
  -h, --help     Show help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-db)
      SKIP_DB=1
      shift
      ;;
    --skip-stash)
      SKIP_STASH=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
SYNC_TS="$(date +%Y%m%d_%H%M%S)"
SYNC_DIR="$REPO_ROOT/reports/aliyun-sync-$SYNC_TS"
mkdir -p "$SYNC_DIR/stashes"

SSH_OPTS=(
  -o BatchMode=yes
  -o ConnectTimeout=10
  -o ConnectionAttempts=1
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=3
  -o TCPKeepAlive=yes
)

remote() {
  ssh "${SSH_OPTS[@]}" "$HOST" "cd '$REMOTE_PATH' && $*"
}

echo "[1/4] Capture remote snapshot"
remote "set -eu; echo commit=\$(git rev-parse HEAD); echo branch=\$(git branch --show-current); echo status:; git status --short; echo stash:; git stash list" \
  > "$SYNC_DIR/remote_snapshot.txt"

STASH_COUNT="$(awk '/^stash@\{[0-9]+\}:/{n++} END{print n+0}' "$SYNC_DIR/remote_snapshot.txt")"

if [ "$SKIP_STASH" -eq 0 ]; then
  echo "[2/4] Export remote stashes ($STASH_COUNT found)"
  if [ "$STASH_COUNT" -gt 0 ]; then
    for i in $(seq 0 $((STASH_COUNT - 1))); do
      remote "git stash show --name-only stash@{$i}" > "$SYNC_DIR/stashes/stash_${i}.files.txt" || true
      remote "git stash show -p stash@{$i}" > "$SYNC_DIR/stashes/stash_${i}.patch" || true
      if [ ! -s "$SYNC_DIR/stashes/stash_${i}.patch" ]; then
        echo "# empty patch for stash@{$i}" > "$SYNC_DIR/stashes/stash_${i}.patch"
      fi
    done
  fi
else
  echo "[2/4] Skip stash export"
fi

LOCAL_DB="$REPO_ROOT/data/blog.sqlite3"
if [ "$SKIP_DB" -eq 0 ]; then
  echo "[3/4] Sync SQLite from remote"
  mkdir -p "$REPO_ROOT/data/backups"
  if [ -f "$LOCAL_DB" ]; then
    cp "$LOCAL_DB" "$REPO_ROOT/data/backups/blog.local.before_aliyun_sync_${SYNC_TS}.sqlite3"
  fi
  rsync -az --progress "$HOST:$REMOTE_PATH/data/blog.sqlite3" "$LOCAL_DB"
else
  echo "[3/4] Skip SQLite sync"
fi

echo "[4/4] Write summary"
if [ -f "$LOCAL_DB" ]; then
  DB_COUNTS="$(sqlite3 "$LOCAL_DB" "SELECT (SELECT COUNT(*) FROM blog_post), (SELECT COUNT(*) FROM blog_timelinenode), (SELECT COUNT(*) FROM blog_highlightstage), (SELECT COUNT(*) FROM blog_socialfriend), (SELECT COUNT(*) FROM blog_photowallimage);" 2>/dev/null || echo 'n/a')"
else
  DB_COUNTS="missing"
fi

{
  echo "sync_dir=$SYNC_DIR"
  echo "remote_host=$HOST"
  echo "remote_path=$REMOTE_PATH"
  echo "stash_count=$STASH_COUNT"
  echo "local_db_counts=$DB_COUNTS"
} > "$SYNC_DIR/summary.txt"

cat "$SYNC_DIR/summary.txt"
echo "[OK] Sync completed."
