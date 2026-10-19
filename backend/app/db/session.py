import sqlite3
from contextlib import contextmanager
from typing import Generator, Optional
from app.config import DATABASE_PATH, SCHEMA_PATH

def init_db(conn: Optional[sqlite3.Connection] = None) -> None:
    """Initialize the SQLite database with tables, indexes, and migrations."""
    close_at_end = False
    if conn is None:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        close_at_end = True

    try:
        # Migrate pre-frequency databases before the schema script (which indexes the column)
        cursor = conn.cursor()
        has_problems = cursor.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='problems'"
        ).fetchone()
        if has_problems:
            columns = [row[1] for row in cursor.execute("PRAGMA table_info(problems)")]
            if "frequency" not in columns:
                cursor.execute("ALTER TABLE problems ADD COLUMN frequency INTEGER DEFAULT 0")
            if "updated_at" not in columns:
                # SQLite cannot ADD COLUMN with a non-constant default; backfill instead
                cursor.execute("ALTER TABLE problems ADD COLUMN updated_at TIMESTAMP")
                cursor.execute("UPDATE problems SET updated_at = CURRENT_TIMESTAMP")

        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        conn.commit()
    finally:
        if close_at_end:
            conn.close()

@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Provide a transactional SQLite connection with dictionary row factory."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
