import secrets
import sqlite3
from typing import Optional


class SessionRepository:
    @staticmethod
    def create_session(conn: sqlite3.Connection, user_id: str) -> str:
        session_token = secrets.token_urlsafe(32)
        conn.execute(
            "INSERT INTO sessions (id, user_id) VALUES (?, ?)",
            (session_token, user_id),
        )
        return session_token

    @staticmethod
    def get_user_id(conn: sqlite3.Connection, session_token: str) -> Optional[str]:
        row = conn.execute(
            "SELECT user_id FROM sessions WHERE id = ?", (session_token,)
        ).fetchone()
        return row["user_id"] if row else None

    @staticmethod
    def delete_session(conn: sqlite3.Connection, session_token: str) -> None:
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_token,))

    @staticmethod
    def delete_all_for_user(conn: sqlite3.Connection, user_id: str) -> None:
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
