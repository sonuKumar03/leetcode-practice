"""Seed Postgres from the bundled leetcode.db SQLite file.

Copies: tags, problems, problem_tags, problem_source_freq.
Skips if the problems table already has data.
Never touches users, sessions, or user_tracking.
"""

import logging
import sqlite3
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text

from app.config import DATABASE_URL, SEED_DB_PATH
from app.db.engine import engine
from app.db.models import Base
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def seed(sqlite_path: str = str(SEED_DB_PATH)) -> None:
    redacted = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "(local)"
    logger.info(f"Seed check: SQLite={sqlite_path}, Postgres=@{redacted}")

    if not Path(sqlite_path).exists():
        logger.warning(f"No seed file at {sqlite_path} — skipping.")
        return

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        count = db.execute(text("SELECT COUNT(*) FROM problems")).scalar()
        if count and count > 0:
            logger.info(f"Problems table already has {count} rows — skipping seed.")
            return

        s_conn = sqlite3.connect(sqlite_path)
        s_conn.row_factory = sqlite3.Row

        # 1. Tags
        tags = s_conn.execute("SELECT id, name, slug, type FROM tags").fetchall()
        if tags:
            db.execute(
                text("INSERT INTO tags (id, name, slug, type) VALUES (:id, :name, :slug, :type) ON CONFLICT (id) DO NOTHING"),
                [dict(t) for t in tags],
            )
            max_id = max(t["id"] for t in tags)
            db.execute(text(f"SELECT setval('tags_id_seq', {max_id})"))
            logger.info(f"Seeded {len(tags)} tags.")

        # 2. Problems
        probs = s_conn.execute(
            "SELECT id, title, slug, difficulty, paid_only, leetcode_url, doocs_url, source, frequency, created_at, updated_at FROM problems"
        ).fetchall()
        if probs:
            db.execute(
                text("""
                    INSERT INTO problems (id, title, slug, difficulty, paid_only, leetcode_url, doocs_url, source, frequency, created_at, updated_at)
                    VALUES (:id, :title, :slug, :difficulty, :paid_only, :leetcode_url, :doocs_url, :source, :frequency, :created_at, :updated_at)
                    ON CONFLICT (id) DO NOTHING
                """),
                [dict(p) for p in probs],
            )
            logger.info(f"Seeded {len(probs)} problems.")

        # 3. Problem tags
        ptags = s_conn.execute("SELECT problem_id, tag_id FROM problem_tags").fetchall()
        if ptags:
            db.execute(
                text("INSERT INTO problem_tags (problem_id, tag_id) VALUES (:problem_id, :tag_id) ON CONFLICT DO NOTHING"),
                [dict(pt) for pt in ptags],
            )
            logger.info(f"Seeded {len(ptags)} problem-tag associations.")

        # 4. Source frequencies
        freqs = s_conn.execute("SELECT problem_id, source, frequency FROM problem_source_freq").fetchall()
        if freqs:
            db.execute(
                text("""
                    INSERT INTO problem_source_freq (problem_id, source, frequency)
                    VALUES (:problem_id, :source, :frequency)
                    ON CONFLICT (problem_id, source) DO UPDATE SET frequency = excluded.frequency
                """),
                [dict(f) for f in freqs],
            )
            logger.info(f"Seeded {len(freqs)} source frequencies.")

        db.commit()
        s_conn.close()
        logger.info("Seed complete.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
