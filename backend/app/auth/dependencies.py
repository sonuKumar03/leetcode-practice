from typing import Generator

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.protocol import User
from app.auth.service import auth_service
from app.db.session import get_db

_bearer_scheme = HTTPBearer()


def get_db_session() -> Generator[Session, None, None]:
    with get_db() as db:
        yield db


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db_session),
) -> User:
    user = auth_service.authenticate_session(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user
