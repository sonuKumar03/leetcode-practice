import sqlite3
from typing import Optional, Tuple

from app.auth.password_provider import PasswordAuthProvider
from app.auth.protocol import AuthProvider, SessionStore, User
from app.repositories.session_repo import SessionRepository


class AuthService:
    """Domain service orchestrating authentication providers and session persistence."""

    def __init__(
        self,
        provider: Optional[AuthProvider] = None,
        session_store: Optional[SessionStore] = None,
    ):
        self._provider: AuthProvider = provider or PasswordAuthProvider()
        self._session_store: SessionStore = session_store or SessionRepository()

    def register(
        self, conn: sqlite3.Connection, email: str, password: str
    ) -> Tuple[User, str]:
        user = self._provider.register(conn, email, password)
        session_token = self._session_store.create_session(conn, user.id)
        return user, session_token

    def login(
        self, conn: sqlite3.Connection, email: str, password: str
    ) -> Tuple[User, str]:
        user = self._provider.authenticate(conn, email, password)
        session_token = self._session_store.create_session(conn, user.id)
        return user, session_token

    def logout(self, conn: sqlite3.Connection, session_token: str) -> None:
        self._session_store.delete_session(conn, session_token)

    def authenticate_session(
        self, conn: sqlite3.Connection, session_token: str
    ) -> Optional[User]:
        user_id = self._session_store.get_user_id(conn, session_token)
        if not user_id:
            return None
        return self._provider.get_user_by_id(conn, user_id)


auth_service = AuthService()
