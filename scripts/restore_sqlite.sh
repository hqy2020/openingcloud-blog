#!/usr/bin/env sh
set -eu

BACKUP_FILE=${1:-}
DB_PATH=${2:-./data/blog.sqlite3}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file> [db-path]"
  exit 1
fi

cp "$BACKUP_FILE" "$DB_PATH"
echo "Restored $BACKUP_FILE -> $DB_PATH"
