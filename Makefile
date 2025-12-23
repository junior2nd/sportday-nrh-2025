.PHONY: help up down restart logs shell migrate makemigrations createsuperuser build clean ps status

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  NRSport - Event Platform System$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)Available Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ============================================
# Docker Commands (Main)
# ============================================

up: ## Start all services with Docker
	@echo "$(BLUE)Starting NRSport System...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env from template...$(NC)"; \
		cp .env.example .env 2>/dev/null || echo "$(YELLOW)Please create .env file$(NC)"; \
	fi
	@docker-compose up -d
	@echo ""
	@echo "$(GREEN)✓ System started!$(NC)"
	@echo ""
	@echo "$(GREEN)Frontend:$(NC)  http://localhost:3000"
	@echo "$(GREEN)Backend:$(NC)   http://localhost:8000"
	@echo "$(GREEN)Admin:$(NC)     http://localhost:8000/admin"
	@echo "$(GREEN)MySQL:$(NC)     localhost:3310"
	@echo ""
	@echo "$(YELLOW)Useful commands:$(NC)"
	@echo "  make logs           - View logs"
	@echo "  make shell          - Open backend shell"
	@echo "  make createsuperuser - Create admin user"
	@echo "  make down           - Stop system"

down: ## Stop all services
	@echo "$(BLUE)Stopping system...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ System stopped$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting system...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✓ System restarted$(NC)"

logs: ## Show logs (all services)
	@docker-compose logs -f

shell: ## Open backend shell
	@docker-compose exec backend bash

ps: ## Show running containers
	@docker-compose ps

status: ## Show system status
	@echo "$(BLUE)System Status:$(NC)"
	@echo ""
	@docker-compose ps

# ============================================
# Database Management
# ============================================

migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	@docker-compose exec backend python manage.py migrate
	@echo "$(GREEN)✓ Migrations complete$(NC)"

makemigrations: ## Create new migrations
	@echo "$(BLUE)Creating migrations...$(NC)"
	@docker-compose exec backend python manage.py makemigrations
	@echo "$(GREEN)✓ Migrations created$(NC)"

createsuperuser: ## Create admin user
	@echo "$(BLUE)Creating superuser...$(NC)"
	@docker-compose exec backend python manage.py createsuperuser

# ============================================
# Build & Maintenance
# ============================================

build: ## Build Docker images
	@echo "$(BLUE)Building images...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✓ Build complete$(NC)"

rebuild: ## Rebuild and restart
	@echo "$(BLUE)Rebuilding system...$(NC)"
	@docker-compose down
	@docker-compose build --no-cache
	@docker-compose up -d
	@echo "$(GREEN)✓ System rebuilt$(NC)"

clean: ## Clean Docker system
	@echo "$(YELLOW)Cleaning Docker system...$(NC)"
	@docker system prune -f
	@echo "$(GREEN)✓ Cleaned$(NC)"

clean-all: ## Remove everything (including volumes)
	@echo "$(RED)Removing all containers and volumes...$(NC)"
	@docker-compose down -v
	@echo "$(GREEN)✓ Everything removed$(NC)"

