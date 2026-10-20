import secrets
from typing import Optional

from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from app.db.models import Session as DBSession

SESSION_MAX_AGE_DAYS = 7


class SessionRepository:
    @staticmethod
    def create_session(db: Session, user_id: str) -> str:
        session_token = secrets.token_urlsafe(32)
        db.add(DBSession(id=session_token, user_id=user_id))
        db.flush()
        return session_token

    @staticmethod
    def get_user_id(db: Session, session_token: str) -> Optional[str]:
        row = db.execute(
            select(DBSession.user_id).where(
                DBSession.id == session_token,
                DBSession.created_at > func.now() - text("INTERVAL '7 days'"),
            )
        ).scalar_one_or_none()
        return row

    @staticmethod
    def delete_session(db: Session, session_token: str) -> None:
        db.execute(delete(DBSession).where(DBSession.id == session_token))

    @staticmethod
    def delete_all_for_user(db: Session, user_id: str) -> None:
        db.execute(delete(DBSession).where(DBSession.user_id == user_id))

    @staticmethod
    def cleanup_expired(db: Session) -> None:
        db.execute(
            delete(DBSession).where(
                DBSession.created_at <= func.now() - text("INTERVAL '7 days'")
            )
        )
