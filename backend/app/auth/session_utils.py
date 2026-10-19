import secrets
import sqlite3
from typing import Optional


def create_session(conn: sqlite3.Connection, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions (id, user_id) VALUES (?, ?)",
        (token, user_id),
    )
    return token


def delete_session(conn: sqlite3.Connection, token: str) -> None:
    conn.execute("DELETE FROM sessions WHERE id = ?", (token,))


def get_user_id_by_session(conn: sqlite3.Connection, token: str) -> Optional[str]:
    row = conn.execute(
        "SELECT user_id FROM sessions WHERE id = ?", (token,)
    ).fetchone()
    return row["user_id"] if row else None
