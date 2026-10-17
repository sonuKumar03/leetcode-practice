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
        # Auto-migration if problems table already exists without frequency column
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='problems';")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(problems);")
            columns = [row[1] for row in cursor.fetchall()]
            if "frequency" not in columns:
                cursor.execute("ALTER TABLE problems ADD COLUMN frequency INTEGER DEFAULT 0;")

        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema = f.read()
        conn.executescript(schema)

        # Ensure index exists and auto-migration is complete
        cursor.execute("PRAGMA table_info(problems);")
        columns = [row[1] for row in cursor.fetchall()]
        if "frequency" not in columns:
            cursor.execute("ALTER TABLE problems ADD COLUMN frequency INTEGER DEFAULT 0;")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_problems_frequency ON problems(frequency DESC);")
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
