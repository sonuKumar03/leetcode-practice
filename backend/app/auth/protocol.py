from __future__ import annotations

from datetime import datetime
from typing import Optional, Protocol

from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session


class AuthError(Exception):
    """Domain exception for authentication failures."""

    def __init__(self, detail: str, status_code: int = 401):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class User(BaseModel):
    id: str
    email: str
    role: str = "user"
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=128)


class AuthProvider(Protocol):
    """Interface for credential verification and user provisioning."""

    def register(self, db: Session, email: str, password: str) -> User: ...
    def authenticate(self, db: Session, email: str, password: str) -> User: ...
    def get_user_by_id(self, db: Session, user_id: str) -> Optional[User]: ...


class SessionStore(Protocol):
    """Interface for session storage and verification."""

    def create_session(self, db: Session, user_id: str) -> str: ...
    def get_user_id(self, db: Session, session_token: str) -> Optional[str]: ...
    def delete_session(self, db: Session, session_token: str) -> None: ...
