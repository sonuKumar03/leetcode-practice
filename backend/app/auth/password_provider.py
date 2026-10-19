import sqlite3
from typing import Optional
from uuid import uuid4

import bcrypt
from fastapi import HTTPException

from app.auth.protocol import User


class PasswordAuthProvider:
    def register(self, conn: sqlite3.Connection, email: str, password: str) -> User:
        clean_email = email.strip().lower()
        existing = conn.execute("SELECT 1 FROM users WHERE LOWER(email) = ?", (clean_email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = str(uuid4())
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        conn.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
            (user_id, clean_email, password_hash),
        )
        row = conn.execute("SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
        return User(id=row["id"], email=row["email"], created_at=row["created_at"])

    def authenticate(self, conn: sqlite3.Connection, email: str, password: str) -> User:
        clean_email = email.strip().lower()
        row = conn.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE LOWER(email) = ?",
            (clean_email,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return User(id=row["id"], email=row["email"], created_at=row["created_at"])

    def get_user_by_id(self, conn: sqlite3.Connection, user_id: str) -> Optional[User]:
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if not row:
            return None
        return User(id=row["id"], email=row["email"], created_at=row["created_at"])
