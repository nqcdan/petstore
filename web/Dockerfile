# syntax=docker/dockerfile:1.7
# The only way to build the web: docker buildx bake web (see ../docker-bake.hcl, ../Makefile).
# Targets: tools (codegen), check (lint + vitest), e2e (Playwright runner), web = nginx image serving the shop SPA,
# admin = nginx image serving the admin-only SPA (same sources, VITE_APP=admin).
ARG NODE=node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5
ARG PLAYWRIGHT=mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579
ARG NGINX=nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10

FROM ${NODE} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store

# Sources + dependencies: base of the dev tooling (codegen) and of check/build
FROM deps AS tools
COPY . .

# Lint + unit tests (vitest with MSW, no backend needed)
FROM tools AS check
RUN pnpm lint && pnpm test

# Real-stack Playwright runner; `make e2e` starts it through compose next to the backend
FROM ${PLAYWRIGHT} AS e2e
WORKDIR /app
# This image ships no corepack; keep in step with "packageManager" in package.json
RUN npm install -g pnpm@10.34.9
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store
COPY . .
CMD ["pnpm", "test:e2e"]

FROM tools AS build
# Keycloak settings are baked in at build time (Vite), override with --build-arg
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM=petstore
ARG VITE_KEYCLOAK_CLIENT_ID=petstore-web
ARG VITE_API_BASE=/api/v1
ARG VITE_MOCK=false
ARG VITE_SHOW_DEMO_ACCOUNTS=false
# VITE_APP=admin builds the admin-only site; VITE_ADMIN_URL (shop) and VITE_SHOP_URL (admin) link the two
ARG VITE_APP=
ARG VITE_ADMIN_URL=
ARG VITE_SHOP_URL=
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID VITE_API_BASE=$VITE_API_BASE VITE_MOCK=$VITE_MOCK \
    VITE_SHOW_DEMO_ACCOUNTS=$VITE_SHOW_DEMO_ACCOUNTS VITE_APP=$VITE_APP VITE_ADMIN_URL=$VITE_ADMIN_URL VITE_SHOP_URL=$VITE_SHOP_URL
RUN pnpm build

FROM ${NGINX} AS web
ARG VERSION=dev
ARG GIT_SHA=unknown
ARG SOURCE=https://github.com/nqcdan/petstore
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Non-root: nginx user owns only what it writes (cache, pid). Port 80 works through the default
# net.ipv4.ip_unprivileged_port_start=0 of containers (the Helm chart sets the same sysctl).
RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/cache/nginx /var/run/nginx.pid
USER nginx
LABEL org.opencontainers.image.title="petstore-web" \
      org.opencontainers.image.source="${SOURCE}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${VERSION}"
EXPOSE 80

# Admin site: build with VITE_APP=admin and VITE_KEYCLOAK_CLIENT_ID=petstore-admin (see ../docker-bake.hcl).
# Strict CSP; the Keycloak and (if absolute) API origins come from the same build args as the bundle.
FROM ${NGINX} AS admin
ARG VERSION=dev
ARG GIT_SHA=unknown
ARG SOURCE=https://github.com/nqcdan/petstore
ARG VITE_KEYCLOAK_URL
ARG VITE_API_BASE=/api/v1
COPY nginx.admin.conf /etc/nginx/conf.d/default.conf
COPY admin-headers.conf /etc/nginx/admin-headers.conf
RUN origin() { echo "$1" | sed -nE 's#^(https?://[^/]+).*#\1#p'; } \
    && sed -i "s#__KEYCLOAK_ORIGIN__#$(origin "$VITE_KEYCLOAK_URL")#g; s#__API_ORIGIN__#$(origin "$VITE_API_BASE")#g" /etc/nginx/admin-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/cache/nginx /var/run/nginx.pid
USER nginx
LABEL org.opencontainers.image.title="petstore-admin" \
      org.opencontainers.image.source="${SOURCE}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${VERSION}"
EXPOSE 80
