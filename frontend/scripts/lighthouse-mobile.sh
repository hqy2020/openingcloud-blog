#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
FRONTEND_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ROOT_DIR=$(cd "$FRONTEND_DIR/.." && pwd)
REPORT_JSON="$ROOT_DIR/reports/lighthouse-mobile.json"
REPORT_MD="$ROOT_DIR/reports/lighthouse-mobile.md"

mkdir -p "$ROOT_DIR/reports"

cd "$FRONTEND_DIR"
npm run build >/tmp/openingcloud-lh-build.log 2>&1

npm run preview -- --host 127.0.0.1 --port 4173 >/tmp/openingcloud-lh-preview.log 2>&1 &
PREVIEW_PID=$!
cleanup() {
  kill "$PREVIEW_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in {1..30}; do
  if curl -fsS "http://127.0.0.1:4173" >/dev/null; then
    break
  fi
  sleep 1
done

npx lighthouse "http://127.0.0.1:4173/" \
  --only-categories=performance,accessibility,best-practices,seo \
  --emulated-form-factor=mobile \
  --throttling-method=simulate \
  --quiet \
  --output=json \
  --output-path="$REPORT_JSON" \
  --chrome-flags="--headless --no-sandbox"

node "$FRONTEND_DIR/scripts/lighthouse-report.mjs" "$REPORT_JSON" "$REPORT_MD"

echo "Lighthouse reports generated:"
echo "  $REPORT_JSON"
echo "  $REPORT_MD"
