import hashlib
import secrets
from typing import Optional

from sqlalchemy import delete, func, select, text, update
from sqlalchemy.orm import Session

from app.db.models import Session as DBSession

SESSION_MAX_AGE_DAYS = 7
MAX_SESSIONS_PER_USER = 10


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class SessionRepository:
    @staticmethod
    def create_session(db: Session, user_id: str) -> str:
        SessionRepository.cleanup_expired(db)

        session_token = secrets.token_urlsafe(32)
        db.add(DBSession(id=_hash_token(session_token), user_id=user_id))
        db.flush()

        # Evict oldest sessions beyond the per-user cap.
        oldest_to_keep = db.execute(
            select(DBSession.id)
            .where(DBSession.user_id == user_id)
            .order_by(DBSession.created_at.desc())
            .offset(MAX_SESSIONS_PER_USER)
        ).scalars().all()
        if oldest_to_keep:
            db.execute(
                delete(DBSession).where(DBSession.id.in_(oldest_to_keep))
            )

        return session_token

    @staticmethod
    def get_user_id(db: Session, session_token: str) -> Optional[str]:
        hashed = _hash_token(session_token)
        row = db.execute(
            select(DBSession.user_id).where(
                DBSession.id == hashed,
                DBSession.last_active > func.now() - text("INTERVAL '7 days'"),
            )
        ).scalar_one_or_none()
        if row:
            db.execute(
                update(DBSession)
                .where(DBSession.id == hashed)
                .values(last_active=func.now())
            )
        return row

    @staticmethod
    def delete_session(db: Session, session_token: str) -> None:
        db.execute(delete(DBSession).where(DBSession.id == _hash_token(session_token)))

    @staticmethod
    def delete_all_for_user(db: Session, user_id: str) -> None:
        db.execute(delete(DBSession).where(DBSession.user_id == user_id))

    @staticmethod
    def cleanup_expired(db: Session) -> None:
        db.execute(
            delete(DBSession).where(
                DBSession.last_active <= func.now() - text("INTERVAL '7 days'")
            )
        )
