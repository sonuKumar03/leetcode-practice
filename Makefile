.DEFAULT_GOAL := help

.PHONY: help install setup dev-backend dev-frontend build clean test db-init db-analyze docker-build docker-up docker-down docker-logs

help: ## Show this help message
	@echo "LeetCode Practice Tracker - Available Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Install both backend and frontend dependencies
	@echo "Installing backend dependencies..."
	python3 -m pip install -r backend/requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

setup: install db-init ## Full initial setup (install dependencies + initialize DB)
	@echo "✓ Setup complete! Run 'make dev-backend' & 'make dev-frontend', or 'make docker-up'."

dev-backend: ## Run backend server with live reload (port 8000)
	cd backend && python3 run.py

dev-frontend: ## Run frontend dev server with live reload (port 3000)
	cd frontend && npm run dev

build: ## Compile frontend production bundle (Vite)
	cd frontend && npm run build

test: ## Validate backend API health and routes
	python3 -c "import sys; sys.path.insert(0, 'backend'); from app.main import app; from fastapi.testclient import TestClient; c = TestClient(app); assert c.get('/health').status_code == 200; print('✓ Backend health check passed')"

db-init: ## Initialize SQLite database schema and performance indexes
	python3 -c "import sys; sys.path.insert(0, 'backend'); from app.db.session import init_db; init_db(); print('✓ Database and indexes initialized')"

db-analyze: ## Run SQLite ANALYZE for query planner optimization
	python3 -c "import sqlite3; conn = sqlite3.connect('backend/data/leetcode.db'); conn.execute('ANALYZE;'); conn.commit(); print('✓ SQLite ANALYZE complete')"

docker-build: ## Build multi-stage Docker image
	docker build -t leetcode-tracker .

docker-up: ## Start application in background via Docker Compose
	docker compose up --build -d

docker-down: ## Stop Docker Compose containers
	docker compose down

docker-logs: ## View and follow Docker container logs
	docker compose logs -f

clean: ## Clean build artifacts and python cache
	rm -rf frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.py[cod]" -delete
	@echo "✓ Cleanup complete"
