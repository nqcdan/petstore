#!/bin/sh
# Restores the shared public demo to its seed state: wipes the petstore database and uploaded
# images, then restarts the app so Liquibase recreates the schema and the demo data is seeded again.
# Keycloak is left alone (demo accounts and any registered users stay).
# Usage: ./reset-demo.sh [path/to/.env]   (COMPOSE_PROJECT_NAME overrides the project name)
set -eu
cd "$(dirname "$0")"
ENV_FILE="${1:-.env}"
dc() { docker compose -f compose.prod.yml --env-file "$ENV_FILE" "$@"; }

dc stop app
dc exec -T postgres psql -v ON_ERROR_STOP=1 -U petstore -d petstore \
  -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
dc run --rm --no-deps --entrypoint sh app -c 'rm -rf /app/user-photos/* /app/user-photos/.[!.]*' || true
export PETSTORE_SEED_DEMO=true
dc up -d app
echo "Demo reset: the app is restarting, check with: docker compose -f compose.prod.yml ps"
