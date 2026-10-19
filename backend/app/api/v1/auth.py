from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.dependencies import get_current_user
from app.auth.protocol import LoginRequest, RegisterRequest, TokenResponse, User
from app.auth.service import auth_service
from app.auth.session_utils import create_session, delete_session
from app.db.session import get_db_connection

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer_scheme = HTTPBearer()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest):
    with get_db_connection() as conn:
        user = auth_service.register(conn, request.email, request.password)
        token = create_session(conn, user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    with get_db_connection() as conn:
        user = auth_service.authenticate(conn, request.email, request.password)
        token = create_session(conn, user.id)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme)):
    with get_db_connection() as conn:
        delete_session(conn, credentials.credentials)
    return {"status": "ok"}


@router.get("/me", response_model=User)
def get_me(user: User = Depends(get_current_user)):
    return user
