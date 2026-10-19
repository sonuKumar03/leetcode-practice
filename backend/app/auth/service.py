import sqlite3
from typing import Optional

from app.auth.password_provider import PasswordAuthProvider
from app.auth.protocol import AuthProvider, User


class AuthService:
    def __init__(self, provider: Optional[AuthProvider] = None):
        self._provider: AuthProvider = provider or PasswordAuthProvider()

    def register(self, conn: sqlite3.Connection, email: str, password: str) -> User:
        return self._provider.register(conn, email, password)

    def authenticate(self, conn: sqlite3.Connection, email: str, password: str) -> User:
        return self._provider.authenticate(conn, email, password)

    def get_user_by_id(self, conn: sqlite3.Connection, user_id: str) -> Optional[User]:
        return self._provider.get_user_by_id(conn, user_id)


auth_service = AuthService()
