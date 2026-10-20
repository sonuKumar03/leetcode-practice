from typing import Generator

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.protocol import User
from app.db.session import get_db


def get_db_session() -> Generator[Session, None, None]:
    with get_db() as db:
        yield db


def get_current_user(request: Request) -> User:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
