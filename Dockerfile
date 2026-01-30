# ===================================
# Stage 1: Build con Maven
# ===================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copiar solo pom.xml primero para aprovechar cache de capas de Docker
COPY pom.xml .

# Descargar dependencias (se cachea si pom.xml no cambia)
RUN mvn dependency:go-offline -B

# Copiar el código fuente
COPY src ./src

# Compilar y empaquetar (sin tests para ser más rápido)
RUN mvn clean package -DskipTests -B

# ===================================
# Stage 2: Runtime con JRE ligero
# ===================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -S spring && adduser -S spring -G spring

# Copiar el JAR desde el stage de build
COPY --from=builder /build/target/*.jar app.jar

# Cambiar ownership del JAR
RUN chown spring:spring app.jar

# Cambiar a usuario no-root
USER spring:spring

# Exponer el puerto de la aplicación
EXPOSE 8081

# Variables de entorno por defecto (se pueden sobreescribir en docker-compose)
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
