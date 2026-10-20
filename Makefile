.DEFAULT_GOAL := help

.PHONY: help install up down logs backend frontend test db-init clean

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

backend: ## Run backend locally (requires Postgres via docker compose)
	cd backend && python3 run.py

frontend: ## Run frontend locally with live reload (port 3000)
	cd frontend && npm run dev

test: ## Run backend test suite
	python3 -m unittest discover -s backend/tests -p "test_*.py"

db-init: ## Initialize Postgres schema via SQLAlchemy
	PYTHONPATH=backend python3 -c "from app.db.session import init_db; init_db(); print('Done')"

clean: ## Clean build artifacts and python cache
	rm -rf frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.py[cod]" -delete
