# Release images: linux/amd64 + linux/arm64, tagged with the git sha and latest, OCI labels from the same sha.
# make images builds them (add PUSH=1 to push); CI and dev machines run the same command.
variable "REGISTRY" { default = "" }            # e.g. ghcr.io/nqcdan/ (trailing slash)
variable "TAG" { default = "dev" }              # git sha, set by the Makefile
variable "VERSION" { default = "dev" }
variable "SOURCE" { default = "https://github.com/nqcdan/petstore" }
variable "SOURCE_DATE_EPOCH" { default = "0" }  # commit time: same commit, same layer timestamps
# Baked into the SPA at build time; set them for the environment the web image is built for
variable "VITE_KEYCLOAK_URL" { default = "" }
variable "VITE_SHOW_DEMO_ACCOUNTS" { default = "false" }
variable "VITE_ADMIN_URL" { default = "" }      # shop: where the Admin menu points, e.g. https://petstore-admin.nqcdan.com (empty: /admin)
variable "VITE_SHOP_URL" { default = "" }       # admin site: "back to shop" link
variable "VITE_API_BASE" { default = "/api/v1" } # admin site: absolute URL when the API is on another origin (needs CORS)

group "default" { targets = ["app", "web", "admin"] }

target "_common" {
  platforms = ["linux/amd64", "linux/arm64"]
  args = { VERSION = VERSION, GIT_SHA = TAG, SOURCE = SOURCE, SOURCE_DATE_EPOCH = SOURCE_DATE_EPOCH }
}

target "app" {
  inherits = ["_common"]
  context  = "."
  target   = "app"
  tags     = ["${REGISTRY}petstore:${TAG}", "${REGISTRY}petstore:latest"]
}

target "web" {
  inherits = ["_common"]
  context  = "./web"
  target   = "web"
  args     = { VITE_KEYCLOAK_URL = VITE_KEYCLOAK_URL, VITE_SHOW_DEMO_ACCOUNTS = VITE_SHOW_DEMO_ACCOUNTS, VITE_ADMIN_URL = VITE_ADMIN_URL }
  tags     = ["${REGISTRY}petstore-web:${TAG}", "${REGISTRY}petstore-web:latest"]
}

# Admin-only site, same sources as web (VITE_APP=admin), Keycloak client petstore-admin
target "admin" {
  inherits = ["_common"]
  context  = "./web"
  target   = "admin"
  args = {
    VITE_APP = "admin", VITE_KEYCLOAK_CLIENT_ID = "petstore-admin", VITE_KEYCLOAK_URL = VITE_KEYCLOAK_URL,
    VITE_API_BASE = VITE_API_BASE, VITE_SHOP_URL = VITE_SHOP_URL, VITE_SHOW_DEMO_ACCOUNTS = VITE_SHOW_DEMO_ACCOUNTS,
  }
  tags     = ["${REGISTRY}petstore-admin:${TAG}", "${REGISTRY}petstore-admin:latest"]
}
