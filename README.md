# PetStore

Online pet shop: a catalog of pet food and supplies, a cart, orders and an admin back office.
Started as a graduation project (Spring MVC + JSP), now being modernized into a product with a
REST API for a React front end. The original JSP site still runs next to the API until React replaces it.

## Stack

- Java 21, Spring Boot 3.5 (Spring MVC, Spring Data JPA, Spring Security)
- Auth: Keycloak (OIDC). The API is an OAuth2 resource server and never issues tokens
- Database: PostgreSQL in production, H2 (in memory) for local development and tests, schema managed by Liquibase
- API docs: springdoc OpenAPI
- Packaging: executable WAR (the legacy JSP views need it), Docker image for linux/amd64 and linux/arm64

## Quick start

Requires JDK 21. The Maven wrapper downloads Maven on first use.

```sh
./mvnw spring-boot:run          # H2 in memory, http://localhost:8081
./mvnw verify                   # compile, tests, package
```

With Docker (app + PostgreSQL + Keycloak):

```sh
docker compose up --build
```

| Service | URL |
|---|---|
| Legacy JSP site | http://localhost:8081 |
| OpenAPI UI | http://localhost:8081/swagger-ui.html |
| OpenAPI JSON | http://localhost:8081/v3/api-docs |
| Keycloak (dev mode) | http://localhost:8180 |

When running with `./mvnw spring-boot:run` start a Keycloak separately, or only call the public catalog endpoints.

## Shared public demo accounts

The Keycloak realm `petstore` (`keycloak/petstore-realm.json`) ships two accounts for a shared public demo.
Anyone can use them, so never treat them as private.

| Username | Password | Role |
|---|---|---|
| `demo-user` | `Demo@123` | customer |
| `demo-admin` | `Demo@123` | admin |

## Configuration

All settings are environment variables.

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | none (H2) | `prod` switches to PostgreSQL |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | local PostgreSQL | Used by the `prod` profile |
| `KEYCLOAK_ISSUER_URI` | `http://localhost:8180/realms/petstore` | Token issuer, must equal the `iss` claim |
| `KEYCLOAK_JWK_SET_URI` | derived from the issuer | Optional internal URL for the signing keys |
| `KEYCLOAK_API_CLIENT_ID` | `petstore-api` | Client whose roles are also read from the token |
| `PETSTORE_CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed front-end origins |
| `PETSTORE_SEED_DEMO` | `true` (H2), `false` (`prod`) | Load demo customers, employees and orders on an empty database |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | empty | SMTP login for the legacy JSP mail features (for Gmail use an app password) |
| `SERVER_PORT` | `8081` | HTTP port |

The product and food catalog is always seeded by Liquibase (`src/main/resources/db/changelog`).

## REST API

Base path `/api/v1`, JSON, paginated lists take `page`, `size` and `sort`.

| Area | Endpoints | Access |
|---|---|---|
| Catalog | `GET /products`, `/products/{id}`, `/foods`, `/foods/{id}` (filters `q`, `type`) | public |
| Shop | `GET /me`, `POST /cart/quote`, `POST /orders`, `GET /orders`, `GET /orders/{code}` | role `customer` or `admin` |
| Admin | `/admin/products`, `/admin/foods`, `/admin/customers`, `/admin/employees` (CRUD, search, product images via multipart `POST .../{id}/image`), `/admin/orders` (list by state, detail, `PATCH .../state`), `GET /admin/stats` | role `admin` |

Keycloak realm roles `customer` and `admin` (and client roles of `petstore-api`) map to `ROLE_CUSTOMER` and `ROLE_ADMIN`.
The cart lives in the client; `POST /cart/quote` prices it with catalog prices and `POST /orders` always re-prices server side.

The React front end signs in with the public client `petstore-web` (authorization code flow with PKCE, for example with
`keycloak-js` or `oidc-client-ts`) and sends the access token as `Authorization: Bearer <token>`.

### Pointing at a real Keycloak

1. Import `keycloak/petstore-realm.json` into your Keycloak (or recreate the realm `petstore`, clients `petstore-web` and `petstore-api`, realm roles `customer` and `admin`). The file contains `${PETSTORE_WEB_ORIGIN}` and `${PETSTORE_WEB_ORIGIN_ALT}` placeholders that Keycloak fills from environment variables when started with `--import-realm`.
2. Set `KEYCLOAK_ISSUER_URI` to `https://<keycloak-host>/realms/petstore`.
3. Remove the two demo users if the instance is not a public demo.

## Tests

`./mvnw verify` starts the full application on H2 and covers the Liquibase seed, public catalog, token handling
(JWT test fixtures, no Keycloak needed), 401/403 rules, admin CRUD, image upload and statistics.

## Deployment

See [deploy/README.md](deploy/README.md) for the single-VM Docker Compose setup behind a reverse proxy.

## Project layout

```
src/main/java/com/fpt/petstore
  api/          REST API (controllers, services, DTOs, resource server config)
  controller/   legacy JSP controllers
  entities/ repository/ services/   domain model and persistence
src/main/resources/db/changelog     Liquibase changelog and catalog seed data
src/main/webapp/WEB-INF/jsp         legacy JSP views
keycloak/       realm import
deploy/         production compose file and runbook
```

## Notes

- The legacy JSP site keeps its own session login and plain-text demo passwords; it is temporary and is not exposed by the API.
- If an older commit of this repository contained a Gmail password, rotate it; removing it from the current files does not remove it from git history.
