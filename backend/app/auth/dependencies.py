from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.protocol import User
from app.auth.service import auth_service
from app.auth.session_utils import get_user_id_by_session
from app.db.session import get_db_connection

_bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> User:
    token = credentials.credentials
    with get_db_connection() as conn:
        user_id = get_user_id_by_session(conn, token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        user = auth_service.get_user_by_id(conn, user_id)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
