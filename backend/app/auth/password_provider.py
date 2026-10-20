from typing import Optional, Type
from uuid import uuid4

import bcrypt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.protocol import AuthError, User
from app.repositories.user_repo import UserRepository


class PasswordAuthProvider:
    """Authentication provider for email and password using bcrypt."""

    def __init__(self, user_repo: Type[UserRepository] = UserRepository):
        self._user_repo = user_repo

    def register(self, db: Session, email: str, password: str) -> User:
        clean_email = email.strip().lower()
        if len(password) < 6:
            raise AuthError("Password must be at least 6 characters", status_code=400)

        existing = self._user_repo.get_by_email(db, clean_email)
        if existing:
            raise AuthError("Email already registered", status_code=409)

        user_id = str(uuid4())
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        try:
            created = self._user_repo.create(db, user_id, clean_email, password_hash)
        except IntegrityError:
            db.rollback()
            raise AuthError("Email already registered", status_code=409)
        return User(id=created["id"], email=created["email"], role=created["role"], created_at=created["created_at"])

    def authenticate(self, db: Session, email: str, password: str) -> User:
        clean_email = email.strip().lower()
        user_row = self._user_repo.get_by_email(db, clean_email)
        if not user_row:
            raise AuthError("Invalid email or password", status_code=401)

        if not bcrypt.checkpw(password.encode(), user_row["password_hash"].encode()):
            raise AuthError("Invalid email or password", status_code=401)

        return User(id=user_row["id"], email=user_row["email"], role=user_row["role"], created_at=user_row["created_at"])

    def get_user_by_id(self, db: Session, user_id: str) -> Optional[User]:
        row = self._user_repo.get_by_id(db, user_id)
        if not row:
            return None
        return User(id=row["id"], email=row["email"], role=row["role"], created_at=row["created_at"])
