import sqlite3
from typing import Optional, Type
from uuid import uuid4

import bcrypt
from fastapi import HTTPException

from app.auth.protocol import User
from app.repositories.user_repo import UserRepository


class PasswordAuthProvider:
    """Authentication provider for email and password using bcrypt."""

    def __init__(self, user_repo: Type[UserRepository] = UserRepository):
        self._user_repo = user_repo

    def register(self, conn: sqlite3.Connection, email: str, password: str) -> User:
        clean_email = email.strip().lower()
        existing = self._user_repo.get_by_email(conn, clean_email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = str(uuid4())
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        created = self._user_repo.create(conn, user_id, clean_email, password_hash)
        return User(id=created["id"], email=created["email"], created_at=created["created_at"])

    def authenticate(self, conn: sqlite3.Connection, email: str, password: str) -> User:
        clean_email = email.strip().lower()
        user_row = self._user_repo.get_by_email(conn, clean_email)
        if not user_row:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not bcrypt.checkpw(password.encode(), user_row["password_hash"].encode()):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return User(id=user_row["id"], email=user_row["email"], created_at=user_row["created_at"])

    def get_user_by_id(self, conn: sqlite3.Connection, user_id: str) -> Optional[User]:
        row = self._user_repo.get_by_id(conn, user_id)
        if not row:
            return None
        return User(id=row["id"], email=row["email"], created_at=row["created_at"])
