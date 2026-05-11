#!/usr/bin/env bash
# Start the full stack with one command.
#
# Default: Docker Compose (Postgres, Redis, API, worker, Next.js web).
#   ./start-all.sh              # foreground logs
#   ./start-all.sh -d           # detached
#
# Local Node dev (Docker only for Postgres + Redis):
#   ./start-all.sh --local
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

usage() {
  cat <<'EOF'
Usage: ./start-all.sh [OPTIONS] [-- EXTRA_COMPOSE_ARGS]

  (default)   Runs Docker Compose: Postgres, Redis, API, worker, Next.js.
              Extra args are passed to: docker compose up --build
              Examples:
                ./start-all.sh
                ./start-all.sh -d

  --local     Starts only Postgres + Redis in Docker, then runs API, worker,
              and Next.js on the host (npm run dev). Uses DATABASE_URL /
              REDIS_URL defaults for localhost unless already exported.

  -h, --help  Show this message.
EOF
}

LOCAL_PID_BACKEND=""
LOCAL_PID_WORKER=""

cleanup_local() {
  if [[ -n "$LOCAL_PID_WORKER" ]]; then
    kill "$LOCAL_PID_WORKER" 2>/dev/null || true
  fi
  if [[ -n "$LOCAL_PID_BACKEND" ]]; then
    kill "$LOCAL_PID_BACKEND" 2>/dev/null || true
  fi
}

wait_for_postgres() {
  echo "Waiting for Postgres to accept connections..."
  local i
  for i in $(seq 1 60); do
    if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
      echo "Postgres is ready."
      return 0
    fi
    sleep 1
  done
  echo "Postgres did not become ready in time." >&2
  return 1
}

start_local() {
  trap cleanup_local EXIT INT TERM

  docker compose up -d postgres redis
  wait_for_postgres

  export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/report_mgmt}"
  # Compose publishes Redis on 6380 by default (see docker-compose.yml).
  export REDIS_URL="${REDIS_URL:-redis://localhost:6380}"
  export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:3000}"
  export UPLOADS_DIR="${UPLOADS_DIR:-$ROOT/backend/uploads}"
  export PORT="${PORT:-4000}"
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:4000}"

  mkdir -p "$UPLOADS_DIR"

  (
    cd "$ROOT/backend"
    npx prisma migrate deploy
    npm run dev
  ) &
  LOCAL_PID_BACKEND=$!

  (
    cd "$ROOT/backend"
    npm run worker:dev
  ) &
  LOCAL_PID_WORKER=$!

  cd "$ROOT/frontend"
  NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm run dev
}

case "${1:-}" in
  --help | -h)
    usage
    exit 0
    ;;
  --local)
    shift
    start_local "$@"
    ;;
  *)
    docker compose up --build "$@"
    ;;
esac
