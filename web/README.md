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
pnpm shots          # Playwright, regenerates docs/*.png
```

Mock mode (`.env.development`): the header login menu offers "customer" and "admin" demo users.
Real mode: copy `.env.example` to `.env.local`, set `VITE_MOCK=false` and the Keycloak values.

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

nginx inside listens on 80 and only serves the SPA (history fallback). `/api` and `/rest` are proxied by the host nginx
to the Spring app (`127.0.0.1:8481` on the VM); the web container is published as `127.0.0.1:8483`.

## API contract to re-check when phase A merges

The client in `src/api` (`types.ts`, `shop.ts`) and the MSW handlers in `src/mocks/handlers.ts` were written from the JSP
controllers and JPA entities, before `/api/v1` exists. Every place to re-check is marked `MATCH` in `src/api/types.ts`. Open points:

- Base path `/api/v1`, Spring `Page` flattened as `{content,totalElements,totalPages,page,size}` with zero-based `page`.
- Products and foods stay two resources (`/products`, `/foods`, `/admin/products`, `/admin/foods`) with the same shape
  (`id,name,sortName,price,pic,description,type`); the old `sortName` URL key is no longer used by the UI.
- Cart is client side (localStorage) and sent once as `POST /orders {items:[{kind,id,quantity}],paymentMethod,note}`;
  the server must price from the catalog, not trust the client. Old session cart + cookie are gone.
- Customer: `GET/PUT /me`, `POST /me/avatar` (multipart `file`), `GET /orders`, `GET /orders/{id}`, `POST /contacts`.
  Password change and password reset move to Keycloak (old `/updatePassword`, `/quen-mat-khau/{token}` mail flow dropped).
- Admin (`/admin/**`, role admin): `GET /admin/stats` (`totals`, `revenueByDay` 30 days, `ordersByState`, `topItems`),
  CRUD + `?page&size&q` on products/foods, `POST /admin/uploads` (returns `{filename}`; the UI shows it under `/img/product/`),
  `GET /admin/orders?state&q`, `GET /admin/orders/{id}`, `PATCH /admin/orders/{id}/state {state}`,
  `GET /admin/customers`, `GET /admin/employees` (read only).
- Order `state` enum `DUE|PAID|CANCEL`, `paymentMethod` `COD|ATM`, `transactionDate` ISO-8601.
- Once an OpenAPI document exists, replace `src/api/types.ts` + `shop.ts` with a generated client and keep the MSW handlers as test doubles.

Blog is static sample content (`src/data/blog.ts`), as in the JSP; there is no blog API.
Images are copied from `src/main/resources/static/img` into `public/img`.
