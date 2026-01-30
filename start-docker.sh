#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🐳 Inventory Management System - Docker Setup    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está instalado${NC}"
    echo "Por favor instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose no está instalado${NC}"
    echo "Por favor instala Docker Compose desde: https://docs.docker.com/compose/install/"
    exit 1
fi

# Verificar que Docker esté corriendo
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Error: Docker daemon no está corriendo${NC}"
    echo "Por favor inicia Docker Desktop o el servicio Docker"
    exit 1
fi

echo -e "${GREEN}✅ Docker está instalado y corriendo${NC}"
echo ""

# Detener contenedores existentes
echo -e "${YELLOW}⏸️  Deteniendo contenedores existentes...${NC}"
docker-compose down 2>/dev/null || true

# Limpiar volúmenes si se solicita
if [ "$1" == "--clean" ]; then
    echo -e "${YELLOW}🧹 Limpiando volúmenes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✅ Volúmenes eliminados${NC}"
fi

# Construir imágenes
echo ""
echo -e "${BLUE}🔨 Construyendo imágenes Docker...${NC}"
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al construir las imágenes${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Imágenes construidas correctamente${NC}"

# Iniciar servicios
echo ""
echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al iniciar los servicios${NC}"
    exit 1
fi

# Esperar a que los servicios estén listos
echo ""
echo -e "${YELLOW}⏳ Esperando a que los servicios estén listos...${NC}"
echo ""

# Función para esperar un servicio
wait_for_service() {
    local service=$1
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep "$service" | grep "healthy" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service está listo${NC}"
            return 0
        fi
        
        if docker-compose ps | grep "$service" | grep "Up" > /dev/null 2>&1; then
            echo -ne "${YELLOW}⏳ Esperando $service ($attempt/$max_attempts)...\r${NC}"
        else
            echo -e "${RED}❌ Error: $service no está corriendo${NC}"
            return 1
        fi
        
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ Timeout esperando a $service${NC}"
    return 1
}

# Esperar servicios en orden
wait_for_service "inventory-postgres"
wait_for_service "inventory-redis"
wait_for_service "inventory-zookeeper"
wait_for_service "inventory-kafka"

# Esperar extra para el backend (tarda más en arrancar)
echo ""
echo -e "${YELLOW}⏳ Esperando a que el backend esté listo (puede tardar 1-2 minutos)...${NC}"
sleep 10

attempt=1
max_attempts=60
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend está listo${NC}"
        break
    fi
    echo -ne "${YELLOW}⏳ Esperando backend ($attempt/$max_attempts)...\r${NC}"
    sleep 3
    ((attempt++))
done

echo ""
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🎉 ¡Sistema iniciado correctamente! 🎉      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Servicios disponibles:${NC}"
echo ""
echo -e "  ${GREEN}🔹 Backend API:${NC}          http://localhost:8081"
echo -e "  ${GREEN}🔹 Swagger UI:${NC}           http://localhost:8081/swagger-ui.html"
echo -e "  ${GREEN}🔹 Actuator Health:${NC}      http://localhost:8081/actuator/health"
echo -e "  ${GREEN}🔹 Redis Commander:${NC}      http://localhost:8091"
echo -e "  ${GREEN}🔹 Kafka UI:${NC}             http://localhost:8090"
echo -e "  ${GREEN}🔹 PostgreSQL:${NC}           localhost:5432 (user: inventory_user, db: inventory)"
echo ""
echo -e "${BLUE}📊 Ver logs:${NC}"
echo -e "  ${YELLOW}docker-compose logs -f${NC}                    # Todos los servicios"
echo -e "  ${YELLOW}docker-compose logs -f backend${NC}            # Solo backend"
echo ""
echo -e "${BLUE}🛑 Detener servicios:${NC}"
echo -e "  ${YELLOW}docker-compose down${NC}                       # Detener sin borrar datos"
echo -e "  ${YELLOW}docker-compose down -v${NC}                    # Detener y borrar datos"
echo ""
echo -e "${BLUE}🔄 Reconstruir:${NC}"
echo -e "  ${YELLOW}./start-docker.sh --clean${NC}                 # Limpiar y reconstruir todo"
echo ""
echo -e "${GREEN}¡Listo para usar! 🚀${NC}"
echo ""
