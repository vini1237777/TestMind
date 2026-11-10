#!/usr/bin/env bash
# Starts what the Playwright tests talk to, with no live service: a throwaway mongod,
# the Upstash REST stand in on top of a local Redis, and the built app. The tests stub
# generation and review in the browser, so no worker or model runs. Needs
# `npm run build` first and Redis on 127.0.0.1:6379.
# Stop everything with: kill $(cat "$E2E_LOG_DIR/pids")
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${E2E_LOG_DIR:-${TMPDIR:-/tmp}/testmind-e2e-stack}"
MONGO_PORT=27090
REST_PORT=8079
mkdir -p "$LOG_DIR"
: > "$LOG_DIR/pids"

start() {
  local name="$1"; shift
  "$@" > "$LOG_DIR/$name.log" 2>&1 &
  echo $! >> "$LOG_DIR/pids"
}

wait_for() {
  for _ in $(seq 1 120); do
    if curl -sf "$1" > /dev/null; then return 0; fi
    sleep 0.5
  done
  echo "Timed out waiting for $1" >&2
  return 1
}

redis-cli -n 12 flushdb > /dev/null

DB_PATH="$(mktemp -d)"
start mongod mongod --dbpath "$DB_PATH" --port "$MONGO_PORT" --bind_ip 127.0.0.1 --quiet
start upstash env -i PATH="$PATH" PORT="$REST_PORT" LOCAL_REDIS_URL="redis://127.0.0.1:6379/12" \
  node "$ROOT/benchmarks/upstash-local.mjs"

# The standalone server needs the static files and public folder next to it, as in the Dockerfile.
rm -rf "$ROOT/.next/standalone/.next/static" "$ROOT/.next/standalone/public"
cp -r "$ROOT/.next/static" "$ROOT/.next/standalone/.next/static"
cp -r "$ROOT/public" "$ROOT/.next/standalone/public"

# Only what the app needs, so nothing from a developer's env files can point a test
# run at a live database or a paid API. The model URL is a closed local port.
start app env -i PATH="$PATH" HOME="$HOME" \
  NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1 \
  MONGODB_URI="mongodb://127.0.0.1:$MONGO_PORT/testmind_e2e" \
  UPSTASH_REDIS_REST_URL="http://127.0.0.1:$REST_PORT" UPSTASH_REDIS_REST_TOKEN=local \
  OPENAI_API_KEY=unused OPENAI_BASE_URL="http://127.0.0.1:9/v1" GEMINI_API_KEY= \
  SENTRY_DSN= NEXT_PUBLIC_SENTRY_DSN= RAG=off SEMANTIC_CACHE=off \
  node "$ROOT/.next/standalone/server.js"

wait_for "http://127.0.0.1:3000/api/health"
echo "Stack is up. Logs in $LOG_DIR"
