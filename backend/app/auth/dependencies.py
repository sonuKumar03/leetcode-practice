import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt_utils import decode_access_token
from app.auth.protocol import User
from app.auth.service import auth_service
from app.db.session import get_db_connection

_bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    with get_db_connection() as conn:
        user = auth_service.get_user_by_id(conn, payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
