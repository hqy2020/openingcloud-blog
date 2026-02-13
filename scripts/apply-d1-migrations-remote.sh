#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-openingcloud_blog_prod}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ -f .dev.vars ]]; then
  # shellcheck disable=SC1091
  set -a
  source .dev.vars
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" && -n "${CF_API_TOKEN:-}" ]]; then
  export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  WRANGLER_CONFIG="$HOME/Library/Preferences/.wrangler/config/default.toml"
  if [[ -f "$WRANGLER_CONFIG" ]]; then
    OAUTH_TOKEN="$(sed -n 's/^oauth_token = "\(.*\)"/\1/p' "$WRANGLER_CONFIG" | head -n 1)"
    if [[ -n "$OAUTH_TOKEN" ]]; then
      export CLOUDFLARE_API_TOKEN="$OAUTH_TOKEN"
    fi
  fi
fi

unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
export NO_PROXY="${NO_PROXY:-*}"
export no_proxy="${no_proxy:-*}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  cat <<'EOF' >&2
[apply-d1] 缺少 CLOUDFLARE_API_TOKEN。
请先执行：
  export CLOUDFLARE_API_TOKEN="<your-token>"
然后重试：
  ./scripts/apply-d1-migrations-remote.sh
EOF
  exit 1
fi

echo "[apply-d1] applying migrations to $DB_NAME"
npx wrangler d1 migrations apply "$DB_NAME" --remote
