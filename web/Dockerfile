# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Keycloak settings are baked in at build time (Vite), override with --build-arg
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM=petstore
ARG VITE_KEYCLOAK_CLIENT_ID=petstore-web
ARG VITE_API_BASE=/api/v1
ARG VITE_MOCK=false
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID VITE_API_BASE=$VITE_API_BASE VITE_MOCK=$VITE_MOCK
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
