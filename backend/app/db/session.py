import sqlite3
from contextlib import contextmanager
from typing import Generator
from app.config import DATABASE_PATH, SCHEMA_PATH

def init_db() -> None:
    """Initialize the SQLite database with tables and indexes."""
    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        conn.commit()

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
