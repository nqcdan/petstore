# Everything runs in containers: the only requirement is Docker (with buildx and compose v2).
PROJECT ?= petstore
export TAG        ?= $(shell git rev-parse --short=12 HEAD)$(shell git diff --quiet HEAD -- || echo -dirty)
export GIT_SHA    ?= $(TAG)
export VERSION    ?= $(TAG)
export SOURCE_DATE_EPOCH ?= $(shell git log -1 --format=%ct)
export REGISTRY   ?=
PUSH              ?=
PUSH_OPTS         = $(if $(PUSH),--set '*.output=type=image$(,)push=true$(,)rewrite-timestamp=true')
, := ,

DEV  = docker compose -p $(PROJECT)
TEST = docker compose -p $(PROJECT)-test -f docker-compose.test.yml
E2E  = docker compose -p $(PROJECT)-e2e -f docker-compose.yml -f docker-compose.e2e.yml

.PHONY: up down test test-backend test-web e2e gen-api images builder

up:            ## dev stack: web :3000, admin :3001, app :8081, Keycloak :8180, PostgreSQL
	$(DEV) up -d --build --wait

down:          ## stop the dev stack and delete its volumes
	$(DEV) down -v --remove-orphans

test: test-web test-backend

test-web:      ## lint + vitest
	docker buildx build --target check --progress plain --output type=cacheonly web

test-backend:  ## mvnw verify against a throwaway PostgreSQL
	$(TEST) run --build --rm test-backend; rc=$$?; $(TEST) down -v --remove-orphans; exit $$rc

e2e:           ## Playwright against the real stack (rewrites web/docs/*.png)
	$(E2E) up -d --build --wait postgres keycloak app
	$(E2E) run --build --rm e2e; rc=$$?; $(E2E) down -v --remove-orphans; exit $$rc

gen-api:       ## regenerate web/src/api/schema.d.ts from the running app (needs make up)
	$(DEV) run --build --rm gen-api

builder:       ## one-time: buildx builder that can build several architectures
	docker buildx inspect petstore >/dev/null 2>&1 || docker buildx create --name petstore --driver docker-container
	docker buildx use petstore

images:        ## app + web + admin (petstore-admin) for linux/amd64,linux/arm64; PUSH=1 REGISTRY=ghcr.io/nqcdan/ pushes (layer timestamps = commit time)
	docker buildx bake --progress plain $(PUSH_OPTS)
