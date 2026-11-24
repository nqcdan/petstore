# PETS Store web

Vite + React + TypeScript + Tailwind 4 + shadcn/ui storefront and admin, replacing the JSP views.
Router: react-router. Data: TanStack Query. Forms: react-hook-form + zod. i18n: vi (default) / en. Theme: light / dark / system.

## Run

Everything runs in containers, from the repository root (only Docker is needed, see the root README):

```bash
make up             # whole stack with this web built into an nginx image: http://localhost:3000
make test           # lint + vitest (target `check` of web/Dockerfile) and the backend tests
make e2e            # Playwright against the real stack in containers, regenerates docs/*.png (see below)
make gen-api        # regenerate src/api/schema.d.ts from the running backend OpenAPI
make images         # petstore-web image for linux/amd64 and linux/arm64
```

The scripts in `package.json` (`dev`, `build`, `lint`, `test`, `test:e2e`) are what the containers run; `pnpm` is not
needed on the host. In mock mode (`VITE_MOCK=true`, MSW) the header login menu offers "customer" and "admin" demo users;
real mode talks to Keycloak and the app through the compose stack.

## Demo accounts box

With `VITE_SHOW_DEMO_ACCOUNTS=true` the landing page (signed-out) and the "please sign in" prompt show a small
"Tài khoản demo" box: `demo-user` and `demo-admin`, both with password `Demo@123`, each value with a copy button.
Default is off (`false` in the Dockerfile, `true` in `.env.development`). The accounts must exist in the Keycloak
realm (`demo-admin` with role `admin`); the box only displays them.

## Keycloak

Public client `petstore-web` in realm `petstore`: Standard flow on, PKCE `S256`, no secret.
Valid redirect URIs and web origins: the site origin (`http://127.0.0.1:8483` on the VM) plus `/*`.
`/admin` requires the realm role `admin` (`realm_access.roles` in the access token); the API must enforce it too.
`public/silent-check-sso.html` is used for the silent SSO check.

## Docker

```bash
docker build -t petstore-web --build-arg VITE_KEYCLOAK_URL=https://sso.example.com \
  --build-arg VITE_SHOW_DEMO_ACCOUNTS=true .
docker run -p 8483:80 petstore-web
```

nginx inside listens on 80 and only serves the SPA (history fallback). `/api` (REST, uploaded photos under `/api/v1/photos/**` and the contact form `POST /api/v1/contact`) and `/rest` must be proxied by the host nginx
to the Spring app (`127.0.0.1:8481` on the VM); the web container is published as `127.0.0.1:8483`.

## API integration (matched with phase A, branch dan-petstore-modernize)

- `src/api/schema.d.ts` is generated from the live OpenAPI (`make gen-api` after `make up`; a copy of the
  document is in `openapi/petstore-v1.json`). `src/api/types.ts` holds the UI types and `src/api/contract.ts` makes `tsc`
  fail if the two drift apart. `src/api/shop.ts` is the thin typed client, `src/mocks/handlers.ts` mirrors the same contract
  for MSW (dev without backend, vitest).
- Lists are `{items,page,size,totalItems,totalPages}` with zero-based `page`; errors are RFC 7807 (`detail` is shown in toasts).
- Catalog items carry `imageUrl` (`/img/product/x.jpg` bundled, `/user-photos/...` uploaded). Admin image upload is
  `POST /admin/{products|foods}/{id}/image`, so the form uploads after saving.
- Cart stays client side; `POST /orders {items:[{type:FOOD|PRODUCT,id,quantity}],note}`; customer orders are read by `code`.
- `/me` returns only the token identity. The profile page is read-only with a link to the Keycloak account console;
  address, phone and avatar editing from the old JSP are gone.
- Dashboard totals are derived client side from `GET /admin/stats` (30-day revenue, state counts, `totalCustomers`).

Backend contract (regenerated against dan-petstore-modernize ed5a50bc):
- `POST /orders` takes `paymentMethod` (COD|ATM, default COD); orders return it and the order pages show it.
- Contact form: `POST /api/v1/contact` (JSON `{name,email,message}`, 204) through `CONTACT_PATH`; uploaded images are served from
  `/api/v1/photos/catalog/**`. Both live in `src/api/urls.ts`.
- Errors: 400/401/403/404/409/413/415 map to Vietnamese/English toasts in `src/api/errors.ts`. Limits mirrored in the UI (`src/lib/limits.ts`):
  quantity 1..100, 50 lines per order, price <= 100 million, images <= 2 MB checked by content before upload (`src/lib/image.ts`).
  Order states follow DUE -> PAID|CANCEL, PAID -> CANCEL (`src/lib/orderState.ts`), anything else is a 409.
- Orders belong to the token `sub`; another user's order code answers 404.
- The dev compose stack runs the default profile, so the OpenAPI document is on for `make gen-api`; a deployed `prod` profile has it off.
- Tokens must carry `aud=petstore-api` (the realm import adds the audience mapper to `petstore-web`).

## Real-stack e2e (Playwright, MSW off)

```bash
make e2e   # postgres + keycloak + app + a Playwright container (image mcr.microsoft.com/playwright, Vite in --mode e2e); cleans up after itself
```

In the container Keycloak's public URL is `http://keycloak:8080` (see `docker-compose.e2e.yml`) and Vite proxies `/api` to `http://app:8081`; `.env.e2e` is the same setup for a host-side run.

`e2e/1-storefront.spec.ts` (demo-user: login, buy, checkout, history; blocked from `/admin`) runs before `e2e/2-admin.spec.ts`
(demo-admin: product CRUD with image, order state, customers and employees CRUD, dashboard). Both write `docs/*.png`
from real data. Files are named so the storefront order exists before the admin dashboard screenshot.

Blog is static sample content (`src/data/blog.ts`), as in the JSP; there is no blog API.
Images are copied from `src/main/resources/static/img` into `public/img`.
