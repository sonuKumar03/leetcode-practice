.DEFAULT_GOAL := help

.PHONY: help install up down logs backend frontend test db-init sync clean

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install backend and frontend dependencies
	python3 -m pip install -r backend/requirements.txt
	cd frontend && npm install

up: ## Start app in dev mode with hot reloading
	docker compose up --build -d

down: ## Stop app containers
	docker compose down

logs: ## Follow container logs
	docker compose logs -f

backend: ## Run backend locally with live reload (port 8000)
	cd backend && python3 run.py

frontend: ## Run frontend locally with live reload (port 3000)
	cd frontend && npm run dev

test: ## Run backend test suite
	python3 -m unittest discover -s backend/tests -p "test_*.py"

db-init: ## Initialize SQLite database schema
	python3 -c "import sys; sys.path.insert(0, 'backend'); from app.db.session import init_db; init_db(); print('✓ Database initialized')"

sync: ## Fetch fresh data from external sources and sync into SQLite
	PYTHONPATH=backend python3 -m app.cli sync

clean: ## Clean build artifacts and python cache
	rm -rf frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.py[cod]" -delete
