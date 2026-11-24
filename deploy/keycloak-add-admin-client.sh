#!/bin/sh
# Adds (or updates) the public client `petstore-admin` and its petstore-api audience mapper in the RUNNING realm
# `petstore`. A realm import never overwrites an existing realm, so an already deployed Keycloak needs this script.
# Safe to run repeatedly: existing client and mapper are updated or left as they are.
# Usage: ./keycloak-add-admin-client.sh [path/to/.env]
#   PETSTORE_ADMIN_ORIGIN      default https://petstore-admin.nqcdan.com
#   PETSTORE_ADMIN_DEV_ORIGIN  default http://localhost:3001 (empty: no dev origin)
#   KEYCLOAK_CONTAINER         run in this container (docker exec) instead of the compose service `keycloak`
# Admin credentials are the ones the container already has (KC_BOOTSTRAP_ADMIN_USERNAME / _PASSWORD); nothing is printed.
set -eu
cd "$(dirname "$0")"
ENV_FILE="${1:-.env}"
ORIGIN="${PETSTORE_ADMIN_ORIGIN:-https://petstore-admin.nqcdan.com}"
DEV_ORIGIN="${PETSTORE_ADMIN_DEV_ORIGIN-http://localhost:3001}"

if [ -n "${KEYCLOAK_CONTAINER:-}" ]; then
  run() { docker exec -i -e ORIGIN="$ORIGIN" -e DEV_ORIGIN="$DEV_ORIGIN" "$KEYCLOAK_CONTAINER" "$@"; }
else
  run() { docker compose -f compose.prod.yml --env-file "$ENV_FILE" exec -T -e ORIGIN="$ORIGIN" -e DEV_ORIGIN="$DEV_ORIGIN" keycloak "$@"; }
fi

run sh -eu -s <<'EOF'
KCADM="/opt/keycloak/bin/kcadm.sh --config /tmp/kcadm.config"
trap 'rm -f /tmp/kcadm.config' EXIT
$KCADM config credentials --server http://localhost:8080 --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null

REDIRECTS="\"$ORIGIN/*\""
ORIGINS="\"$ORIGIN\""
LOGOUT="$ORIGIN/*"
if [ -n "$DEV_ORIGIN" ]; then
  REDIRECTS="$REDIRECTS, \"$DEV_ORIGIN/*\""
  ORIGINS="$ORIGINS, \"$DEV_ORIGIN\""
  LOGOUT="$LOGOUT##$DEV_ORIGIN/*"
fi
BODY="{\"clientId\":\"petstore-admin\",\"name\":\"PetStore admin site (React)\",\"enabled\":true,\"publicClient\":true,
\"protocol\":\"openid-connect\",\"standardFlowEnabled\":true,\"implicitFlowEnabled\":false,\"directAccessGrantsEnabled\":false,
\"serviceAccountsEnabled\":false,\"redirectUris\":[$REDIRECTS],\"webOrigins\":[$ORIGINS],
\"attributes\":{\"pkce.code.challenge.method\":\"S256\",\"post.logout.redirect.uris\":\"$LOGOUT\"}}"

ID=$($KCADM get clients -r petstore -q clientId=petstore-admin --fields id --format csv --noquotes)
if [ -z "$ID" ]; then
  echo "$BODY" | $KCADM create clients -r petstore -f - >/dev/null
  ID=$($KCADM get clients -r petstore -q clientId=petstore-admin --fields id --format csv --noquotes)
  echo "client petstore-admin: created ($ID)"
else
  echo "$BODY" | $KCADM update "clients/$ID" -r petstore -f -
  echo "client petstore-admin: updated ($ID)"
fi

if $KCADM get "clients/$ID/protocol-mappers/models" -r petstore --fields name --format csv --noquotes | grep -qx petstore-api-audience; then
  echo "mapper petstore-api-audience: already there"
else
  $KCADM create "clients/$ID/protocol-mappers/models" -r petstore \
    -s name=petstore-api-audience -s protocol=openid-connect -s protocolMapper=oidc-audience-mapper \
    -s consentRequired=false -s 'config."included.client.audience"=petstore-api' \
    -s 'config."access.token.claim"=true' -s 'config."id.token.claim"=false' >/dev/null
  echo "mapper petstore-api-audience: created"
fi
EOF
