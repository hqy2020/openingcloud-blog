#!/usr/bin/env sh
set -eu

DB_PATH=${1:-./data/blog.sqlite3}
BACKUP_DIR=${2:-./data/backups}

mkdir -p "$BACKUP_DIR"
DATE_TAG=$(date +%Y%m%d_%H%M%S)
TARGET="$BACKUP_DIR/blog_${DATE_TAG}.sqlite3"

sqlite3 "$DB_PATH" ".backup '$TARGET'"

echo "Backup created: $TARGET"
