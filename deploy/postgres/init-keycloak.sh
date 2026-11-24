#!/bin/sh
# Runs once, when the postgres volume is first created.
set -e
# The password goes through a psql variable, so quotes in it cannot break or inject into the SQL.
psql -v ON_ERROR_STOP=1 -v kcpw="$KEYCLOAK_DB_PASSWORD" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE ROLE keycloak LOGIN PASSWORD :'kcpw';
CREATE DATABASE keycloak OWNER keycloak;
SQL
