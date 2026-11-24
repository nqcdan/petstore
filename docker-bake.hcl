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

group "default" { targets = ["app", "web"] }

target "_common" {
  platforms = ["linux/amd64", "linux/arm64"]
  args = { VERSION = VERSION, GIT_SHA = TAG, SOURCE = SOURCE, SOURCE_DATE_EPOCH = SOURCE_DATE_EPOCH }
  output = ["type=image,rewrite-timestamp=true"]
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
  args     = { VITE_KEYCLOAK_URL = VITE_KEYCLOAK_URL, VITE_SHOW_DEMO_ACCOUNTS = VITE_SHOW_DEMO_ACCOUNTS }
  tags     = ["${REGISTRY}petstore-web:${TAG}", "${REGISTRY}petstore-web:latest"]
}
