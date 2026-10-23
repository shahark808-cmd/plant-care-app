#!/usr/bin/env bash
# מריץ בדיקות RLS מול Postgres זמני (נדרש Postgres מותקן). אפשר גם להגדיר TEST_DATABASE_URL.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${TEST_DATABASE_URL:-}" ]]; then
  npx vitest run tests/rls
  exit $?
fi

PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)
DIR=$(mktemp -d)
PORT=54329
chmod 755 "$DIR"
RUN=""
if [[ $(id -u) -eq 0 ]]; then RUN="su postgres -c"; chown postgres "$DIR"; fi
exec_pg() { if [[ -n "$RUN" ]]; then $RUN "$*"; else bash -c "$*"; fi; }

exec_pg "$PGBIN/initdb -D $DIR/data -A trust -U postgres >/dev/null"
exec_pg "$PGBIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR -c listen_addresses=127.0.0.1' -l $DIR/log -w start >/dev/null"
trap 'exec_pg "$PGBIN/pg_ctl -D $DIR/data -m immediate stop >/dev/null" || true; rm -rf "$DIR"' EXIT

export TEST_DATABASE_URL="postgres://postgres@127.0.0.1:$PORT/postgres"
npx vitest run tests/rls
