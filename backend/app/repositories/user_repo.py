from typing import Any, Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import User


class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional[Dict[str, Any]]:
        user = db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one_or_none()
        if not user:
            return None
        return {"id": user.id, "email": user.email, "role": user.role, "created_at": user.created_at}

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        user = db.execute(
            select(User).where(func.lower(User.email) == clean_email)
        ).scalar_one_or_none()
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "password_hash": user.password_hash,
            "created_at": user.created_at,
        }

    @staticmethod
    def create(db: Session, user_id: str, email: str, password_hash: str) -> Dict[str, Any]:
        clean_email = email.strip().lower()
        user = User(id=user_id, email=clean_email, password_hash=password_hash)
        db.add(user)
        db.flush()
        return {"id": user.id, "email": user.email, "role": user.role, "created_at": user.created_at}
