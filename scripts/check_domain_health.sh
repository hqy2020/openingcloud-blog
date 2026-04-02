#!/usr/bin/env sh
set -eu

DOMAIN="${DOMAIN:-blog.openingclouds.xyz}"
EXPECTED_IP="${EXPECTED_IP:-47.99.42.71}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
HTTPS_PATH="${HTTPS_PATH:-/}"
RESOLVERS="${RESOLVERS:-1.1.1.1 8.8.8.8}"
CURL_MAX_TIME="${CURL_MAX_TIME:-20}"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S %Z'
}

log() {
  printf '[%s] %s\n' "$(timestamp)" "$*"
}

require_bin() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR missing required binary: $1"
    exit 2
  fi
}

trim_lines() {
  tr '\n' ' ' | sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//'
}

require_bin curl
require_bin dig

resolved_ok=0
resolver_errors=0

for resolver in $RESOLVERS; do
  answers="$(dig @"$resolver" +short "$DOMAIN" A 2>/dev/null | trim_lines || true)"
  if [ -n "$answers" ]; then
    log "DNS @$resolver => $answers"
  else
    log "DNS @$resolver => <empty>"
  fi

  case " $answers " in
    *" $EXPECTED_IP "*)
      resolved_ok=1
      ;;
    *)
      resolver_errors=$((resolver_errors + 1))
      ;;
  esac
done

public_http_code="$(curl --noproxy '*' -o /dev/null -sS -L -w '%{http_code}' --max-time "$CURL_MAX_TIME" "https://$DOMAIN$HTTPS_PATH" || true)"
if [ -n "$public_http_code" ] && [ "$public_http_code" != "000" ]; then
  log "Public HTTPS => HTTP $public_http_code"
else
  log "Public HTTPS => request failed"
fi

forced_http_code="$(curl --noproxy '*' --resolve "$DOMAIN:443:$EXPECTED_IP" -o /dev/null -sS -L -w '%{http_code}' --max-time "$CURL_MAX_TIME" "https://$DOMAIN$HTTPS_PATH" || true)"
if [ -n "$forced_http_code" ] && [ "$forced_http_code" != "000" ]; then
  log "Forced HTTPS via $EXPECTED_IP => HTTP $forced_http_code"
else
  log "Forced HTTPS via $EXPECTED_IP => request failed"
fi

forced_health_code="$(curl --noproxy '*' --resolve "$DOMAIN:443:$EXPECTED_IP" -o /dev/null -sS -L -w '%{http_code}' --max-time "$CURL_MAX_TIME" "https://$DOMAIN$HEALTH_PATH" || true)"
if [ -n "$forced_health_code" ] && [ "$forced_health_code" != "000" ]; then
  log "Forced API health via $EXPECTED_IP => HTTP $forced_health_code"
else
  log "Forced API health via $EXPECTED_IP => request failed"
fi

if [ "$resolved_ok" -eq 1 ] && [ "${public_http_code:-000}" -ge 200 ] 2>/dev/null && [ "${public_http_code:-000}" -lt 400 ] 2>/dev/null; then
  log "OK domain resolution and public HTTPS look healthy"
  exit 0
fi

if [ "$resolved_ok" -ne 1 ]; then
  log "ERROR public DNS does not resolve $DOMAIN to expected IP $EXPECTED_IP"
fi

if [ "${forced_http_code:-000}" -ge 200 ] 2>/dev/null && [ "${forced_http_code:-000}" -lt 400 ] 2>/dev/null; then
  log "DIAG service behind $EXPECTED_IP is reachable, issue is likely DNS / public routing"
  exit 1
fi

log "ERROR service check through expected IP also failed, issue is likely application / reverse proxy / network"
exit 1
