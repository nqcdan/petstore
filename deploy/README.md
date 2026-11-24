# Deployment (single VM, Docker Compose)

`compose.prod.yml` runs the app, PostgreSQL and Keycloak on one VM (arm64 or amd64). Every port binds to
`127.0.0.1`; a reverse proxy (nginx behind Cloudflare) is the only public entry point.

| Service | Local port | Memory limit |
|---|---|---|
| app (API + legacy JSP) | 127.0.0.1:8481 | 768 MB |
| keycloak | 127.0.0.1:8482 | 1 GB |
| postgres (app and keycloak databases) | not published | 512 MB |
| web front end | 8483, deployed separately | n/a |

## Environment

Copy `.env.example` to `.env` (git-ignored) and fill it in.

| Variable | Required | Meaning |
|---|---|---|
| `PETSTORE_DB_PASSWORD` | yes | Password of the `petstore` database user |
| `KEYCLOAK_DB_PASSWORD` | yes | Password of the `keycloak` database user, created on the first start of the postgres volume |
| `KEYCLOAK_ADMIN_USER` | no (`admin`) | Keycloak bootstrap admin, only used on the first start |
| `KEYCLOAK_ADMIN_PASSWORD` | yes | Password of that admin; keep the real admin password out of the repo |
| `KEYCLOAK_ISSUER_URI` | yes | Public URL of the realm, for example `https://auth.example.com/realms/petstore`; must equal the token issuer |
| `PETSTORE_WEB_ORIGIN` | yes | Public origin of the web front end, no trailing slash; used for CORS and the Keycloak redirect URIs |
| `PETSTORE_SEED_DEMO` | no (`true`) | Keep demo customers and orders (shared public demo); set `false` for a real store |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | no | SMTP login for the legacy JSP mail features |
| `PETSTORE_VERSION` | no (`latest`) | Image tag |

## Start

```sh
cd deploy
cp .env.example .env   # edit
docker compose -f compose.prod.yml --env-file .env up -d --build
docker compose -f compose.prod.yml ps
```

The image builds natively for the VM architecture (all base images are multi-arch). CI also builds `linux/amd64` and `linux/arm64`.

## Reverse proxy

- The web host only needs to proxy `/api` (REST API, product photos and the contact form) to `127.0.0.1:8481`; the SPA container serves the rest.
- Forward `app.example.com` to `127.0.0.1:8481` and `auth.example.com` to `127.0.0.1:8482`.
- Keycloak runs with `--proxy-headers xforwarded --hostname-strict=false`, so nginx must send `X-Forwarded-For`, `X-Forwarded-Proto` and `X-Forwarded-Host` (and `Host`) unchanged.
- The app validates tokens against `KEYCLOAK_ISSUER_URI` but fetches signing keys over the compose network
  (`http://keycloak:8080/...`), so it needs no outbound round trip through Cloudflare.
- Expose only `/realms/` and `/resources/` of Keycloak publicly if you can; keep `/admin/` restricted.

## Keycloak realm and demo accounts

On the first start Keycloak imports `../keycloak/petstore-realm.json`. It creates the realm `petstore`, the clients
`petstore-web` (public, PKCE) and `petstore-api`, the roles `customer` and `admin`, and two **shared public demo** accounts:

| Username | Password | Role |
|---|---|---|
| `demo-user` | `Demo@123` | customer |
| `demo-admin` | `Demo@123` | admin |

Imports run only when the realm does not exist yet. Change realm settings afterwards in the Keycloak admin console.
Create the real administrator there too; its password never goes into this repository.

## Reset the demo data

```sh
./reset-demo.sh            # uses .env
./reset-demo.sh /path/.env
```

The script stops the app, drops and recreates the `petstore` schema, clears uploaded images and restarts the app, so Liquibase
recreates the schema and catalog and the demo customers, employees and orders are loaded again, with order dates spread over the 30 days before the reset. Keycloak users are not touched.
The app answers its health check a few seconds before the demo seeding finishes.

## Operations

- Logs: `docker compose -f compose.prod.yml logs -f app`
- Update: `git pull && docker compose -f compose.prod.yml --env-file .env up -d --build`
- Backup: `docker compose -f compose.prod.yml exec -T postgres pg_dump -U petstore petstore > petstore.sql` (and the same for `-U keycloak keycloak`)
- Volumes: `pgdata` (databases), `uploads` (product images)
