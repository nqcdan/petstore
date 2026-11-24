# syntax=docker/dockerfile:1.7
# The only way to build the backend: docker buildx bake app (see docker-bake.hcl, Makefile).
# Multi-arch: every base image below ships linux/amd64 and linux/arm64. Bases are pinned by digest.
ARG JDK=eclipse-temurin:21-jdk@sha256:8ad118b146aa92da815b576441acd6b42b38236797ad0b6edc8c200b85bb0734
ARG JRE=eclipse-temurin:21-jre@sha256:d77e090ae1f6970c047b443c6f0a6c1358b0426d44432bb5a7753408cd43de0d

# Sources + wrapper. `make test` runs this stage through compose (service test-backend), which provides PostgreSQL.
FROM ${JDK} AS test
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY src src
CMD ["./mvnw", "-B", "verify"]

FROM test AS build
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -q -DskipTests package && mv target/petstore-*.war /petstore.war

FROM ${JRE} AS app
ARG VERSION=dev
ARG GIT_SHA=unknown
ARG SOURCE=https://github.com/nqcdan/petstore
RUN useradd --system --create-home --uid 10001 petstore
WORKDIR /app
COPY --from=build /petstore.war app.war
RUN mkdir -p user-photos && chown -R petstore:petstore /app
USER petstore
ENV SPRING_PROFILES_ACTIVE=prod \
    SERVER_PORT=8081 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
LABEL org.opencontainers.image.title="petstore" \
      org.opencontainers.image.source="${SOURCE}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${VERSION}"
VOLUME /app/user-photos
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${SERVER_PORT}/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.war"]
