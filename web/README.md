# PETS Store web

Vite + React + TypeScript + Tailwind 4 + shadcn/ui storefront and admin, replacing the JSP views.
Router: react-router. Data: TanStack Query. Forms: react-hook-form + zod. i18n: vi (default) / en. Theme: light / dark / system.

## Run

```bash
pnpm install
pnpm dev            # http://localhost:5173, VITE_MOCK=true: MSW answers /api/v1, login is a stub
pnpm build          # tsc -b && vite build
pnpm lint
pnpm test           # vitest (jsdom + MSW node server)
pnpm test:e2e       # Playwright against the real stack, regenerates docs/*.png (see below)
pnpm gen:api        # regenerate src/api/schema.d.ts from the backend OpenAPI
```

Mock mode (`.env.development`, MSW): the header login menu offers "customer" and "admin" demo users.
Real mode: `pnpm exec vite --mode e2e` uses `.env.e2e` (local Keycloak :8180, proxy to the app :8081), or copy `.env.example` to `.env.local` and set `VITE_MOCK=false` plus the Keycloak values.

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

- `src/api/schema.d.ts` is generated from the live OpenAPI (`pnpm gen:api`, needs the backend on :8081; a copy of the
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
- The compose stack runs the `prod` profile, so OpenAPI is off: add `PETSTORE_API_DOCS=true` to the app (compose override) before `pnpm gen:api`.
- Tokens must carry `aud=petstore-api` (the realm import adds the audience mapper to `petstore-web`).

## Real-stack e2e (Playwright, MSW off)

```bash
cd <phase A worktree> && docker compose -p petstore-web up --build -d   # app :8081, Keycloak :8180 (realm import), Postgres
cd web && pnpm exec playwright install chromium && pnpm test:e2e         # Vite in --mode e2e (.env.e2e) proxies /api to :8081
# cleanup:  docker compose -p petstore-web down -v --remove-orphans
```

`e2e/1-storefront.spec.ts` (demo-user: login, buy, checkout, history; blocked from `/admin`) runs before `e2e/2-admin.spec.ts`
(demo-admin: product CRUD with image, order state, customers and employees CRUD, dashboard). Both write `docs/*.png`
from real data. Files are named so the storefront order exists before the admin dashboard screenshot.

Blog is static sample content (`src/data/blog.ts`), as in the JSP; there is no blog API.
Images are copied from `src/main/resources/static/img` into `public/img`.
