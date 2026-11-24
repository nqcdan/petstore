# syntax=docker/dockerfile:1
# Multi-arch: every base image below ships linux/amd64 and linux/arm64.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -DskipTests package && mv target/petstore-*.war /petstore.war

FROM eclipse-temurin:21-jre
RUN useradd --system --create-home --uid 10001 petstore
WORKDIR /app
COPY --from=build /petstore.war app.war
RUN mkdir -p user-photos && chown -R petstore:petstore /app
USER petstore
ENV SPRING_PROFILES_ACTIVE=prod \
    SERVER_PORT=8081 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
VOLUME /app/user-photos
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${SERVER_PORT}/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.war"]
