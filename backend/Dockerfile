# --- Build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# --- Runtime stage ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
# Create the uploads directory and hand /app to the non-root user BEFORE
# switching to it — without this, the container runs as `spring` but /app
# is still owned by root, so LocalFileStorageService can never create or
# write to /app/uploads. This is the actual cause of every document upload
# failing with "Failed to store file: /app/./uploads" in production.
RUN mkdir -p /app/uploads && chown -R spring:spring /app
USER spring:spring
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
