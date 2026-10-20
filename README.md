# LeetCode Practice Tracker

A LeetCode problem tracking web application built with **React 19, Vite, Tailwind CSS 4, FastAPI, SQLAlchemy, and PostgreSQL**.

Curated directly from [leetcode.doocs.org/en/tags/](https://leetcode.doocs.org/en/tags/) and enriched with LeetCode's official metadata.

---

## Features

- **Full Catalog (178 Tags, 4,000+ Problems)**: Browse, search, and filter problems across all algorithm categories.
- **Multi-User Auth**: Register / login with email and password (bcrypt + server-side sessions).
- **Progress Tracking & Dashboard**: Status toggle (To Do / In Progress / Solved), star/bookmark, difficulty breakdown.
- **Personal Notes**: Write intuition, complexity, and code snippets per problem.
- **Dark & Light Mode**: Seamless theme toggle with system preference detection.

---

## Architecture

```
leetcode-practice/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Versioned REST API routers
│   │   ├── auth/            # Auth provider, session store, dependencies
│   │   ├── db/              # SQLAlchemy models, engine, session
│   │   ├── models/          # Pydantic schemas
│   │   ├── repositories/    # Data Access Layer (SQLAlchemy ORM)
│   │   ├── services/        # Metadata service
│   │   └── main.py          # FastAPI entry point
│   ├── data/
│   │   └── leetcode.db      # Bundled seed data (read-only SQLite)
│   ├── scripts/
│   │   └── seed_catalog.py  # Seeds Postgres from leetcode.db on first boot
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API clients
│   │   ├── components/      # React components
│   │   ├── contexts/        # AuthContext
│   │   └── App.tsx
│   └── vite.config.ts
│
├── docker-compose.yml       # Postgres 16 + app (dev)
├── Dockerfile               # Multi-stage: frontend build + Python runner
├── entrypoint.sh            # Schema init + seed + uvicorn
└── fly.toml                 # Fly.io deployment config
```

---

## Quick Start (Docker)

```bash
make up        # Starts Postgres + app with hot reload
make logs      # Follow container logs
```

App runs at `http://localhost:8000` (API docs at `/docs`).

### Local Development (without Docker)

Requires a running Postgres instance. Set `DATABASE_URL` if not using the default (`postgresql://postgres:postgres@localhost:5432/leetcode`).

```bash
# Terminal 1: Backend
make backend

# Terminal 2: Frontend
make frontend
```

---

## Useful Commands

```bash
make install   # Install backend + frontend dependencies
make test      # Run backend test suite
make db-init   # Initialize Postgres schema
make clean     # Clean build artifacts
```
