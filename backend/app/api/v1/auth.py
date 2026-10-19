from fastapi import APIRouter, Depends, status

from app.auth.dependencies import get_current_user
from app.auth.jwt_utils import create_access_token
from app.auth.protocol import LoginRequest, RegisterRequest, TokenResponse, User
from app.auth.service import auth_service
from app.db.session import get_db_connection

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest):
    with get_db_connection() as conn:
        user = auth_service.register(conn, request.email, request.password)
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    with get_db_connection() as conn:
        user = auth_service.authenticate(conn, request.email, request.password)
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=User)
def get_me(user: User = Depends(get_current_user)):
    return user
