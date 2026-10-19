import sqlite3
from typing import Any, Dict, Optional


class UserRepository:
    @staticmethod
    def get_by_id(conn: sqlite3.Connection, user_id: str) -> Optional[Dict[str, Any]]:
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_by_email(conn: sqlite3.Connection, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        row = conn.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE LOWER(email) = ?",
            (clean_email,),
        ).fetchone()
        return dict(row) if row else None

    @staticmethod
    def create(
        conn: sqlite3.Connection,
        user_id: str,
        email: str,
        password_hash: str,
    ) -> Dict[str, Any]:
        clean_email = email.strip().lower()
        conn.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
            (user_id, clean_email, password_hash),
        )
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return dict(row)
