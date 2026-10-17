# LeetCode Practice Tracker & Scraper 🚀

A modern, modular LeetCode problem tracking web application built with **React, Vite, Tailwind CSS, FastAPI, and SQLite**.

Curated directly from [leetcode.doocs.org/en/tags/](https://leetcode.doocs.org/en/tags/) and enriched with LeetCode's official metadata.

---

## ✨ Features

- **k-Shortest Paths Spotlight**: Directly features the `#tag:k-shortest-paths` tag (including **#2045: Second Minimum Time to Reach Destination**) as a 1-click spotlight filter.
- **Full Catalog (178 Tags, 4,000+ Problems)**: Browse, search, and filter problems across all algorithm categories (Shortest Path, Dijkstra, 0-1 BFS, Graph, Dynamic Programming, and more).
- **SQLite Database Persistence**: All questions, tags, problem-tag mappings, and user progress (Status, Stars, Notes) are stored in `backend/data/leetcode.db` with WAL mode enabled.
- **+ Add Custom Questions**: Easily add custom interview questions, company-specific problems, or newly released LeetCode questions via the interactive UI modal or REST API.
- **Progress Tracking & Dashboard**:
  - Interactive status toggle: **⚪ To Do** → **🟡 In Progress** → **🟢 Solved** (with celebratory confetti!).
  - Star / bookmark problems for quick revision.
  - Category / tag completion gauge (e.g. tracks % completed in `k-Shortest Paths`).
  - Easy / Medium / Hard difficulty distribution breakdown.
- **Personal Notes & Hints**: Write markdown/text intuition, time/space complexity, and code snippets per problem.
- **Backup & Restore**: Export your progress as a timestamped JSON file and restore anytime.
- **Dark & Light Mode**: Seamless theme toggle with system preference detection.

---

## 🏗️ Architecture

```
leetcode-practice/
├── backend/
│   ├── app/
│   │   ├── api/             # Versioned REST API routers (/problems, /tags, /tracking, /stats)
│   │   ├── db/              # SQLite connection session & schema.sql
│   │   ├── models/          # Pydantic schemas (typed request/response validation)
│   │   ├── repositories/    # Data Access Layer (DAL) isolating raw SQL queries
│   │   ├── services/        # Scraper service & business domain logic
│   │   └── main.py          # FastAPI application entry point
│   ├── data/
│   │   └── leetcode.db      # SQLite database
│   ├── requirements.txt
│   └── run.py               # Starts backend server on http://localhost:8000
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Modular API clients (problemsApi, tagsApi)
│   │   ├── components/
│   │   │   ├── dashboard/   # StatsCards & Progress gauges
│   │   │   ├── filters/     # TagFilterBar (spotlight chips), FilterControls
│   │   │   ├── layout/      # Header, theme switcher
│   │   │   ├── modals/      # AddQuestionModal, NotesModal, ExportImportModal
│   │   │   └── problems/    # ProblemTable, StatusPill
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Main application orchestrator
│   │   └── index.css        # Tailwind CSS entrypoint
│   └── vite.config.ts       # Vite configuration with API proxy
│
└── package.json
```

---

## 🚀 Quick Start

### 1. Start the Backend API (FastAPI + SQLite)

```bash
cd backend
python3 run.py
```
Backend runs at: `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

### 2. Start the Frontend (React + Vite)

In another terminal:
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🔄 Re-scraping or Updating Questions

To refresh or re-run the scraper against `leetcode.doocs.org`:
```bash
cd backend
python3 -m app.services.scraper_service
```
Or click the **Refresh** button directly in the web app header!
