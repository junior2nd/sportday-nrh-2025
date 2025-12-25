#!/bin/bash

# DigitalOcean Deployment Script for NRSport
# This script helps deploy the application to a DigitalOcean Droplet

set -e

echo "=========================================="
echo "NRSport - DigitalOcean Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on server
if [ ! -f "/etc/os-release" ]; then
    echo -e "${RED}Error: This script should be run on the server (DigitalOcean Droplet)${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose is not installed. Installing Docker Compose...${NC}"
    apt update
    apt install docker-compose-plugin -y
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}.env file not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}.env file created. Please edit it with your production values!${NC}"
        echo -e "${RED}IMPORTANT: Edit .env file before continuing!${NC}"
        exit 1
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Verify Docker and Docker Compose
echo -e "${GREEN}Checking Docker installation...${NC}"
docker --version
docker compose version
echo ""

# Build and start services
echo -e "${YELLOW}Building production images...${NC}"
docker compose -f docker-compose.prod.yml build

echo -e "${YELLOW}Starting services...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}Waiting for services to be ready...${NC}"
sleep 10

# Check service status
echo -e "${GREEN}Service status:${NC}"
docker compose -f docker-compose.prod.yml ps

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 20

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

# Collect static files
echo -e "${YELLOW}Collecting static files...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Create superuser: docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser"
echo "2. Check logs: docker compose -f docker-compose.prod.yml logs -f"
echo "3. Check service status: docker compose -f docker-compose.prod.yml ps"
echo ""
echo "Backend API: http://your-server-ip:8000"
echo "Frontend: http://your-server-ip:3000"
echo ""

