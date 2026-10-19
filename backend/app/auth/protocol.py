from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import Optional, Protocol

from pydantic import BaseModel, EmailStr


class User(BaseModel):
    id: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthProvider(Protocol):
    def register(self, conn: sqlite3.Connection, email: str, password: str) -> User: ...
    def authenticate(self, conn: sqlite3.Connection, email: str, password: str) -> User: ...
    def get_user_by_id(self, conn: sqlite3.Connection, user_id: str) -> Optional[User]: ...
