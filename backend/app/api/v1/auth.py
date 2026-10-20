from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.dependencies import get_current_user
from app.auth.protocol import AuthError, LoginRequest, RegisterRequest, TokenResponse, User
from app.auth.service import auth_service
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer_scheme = HTTPBearer()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest):
    try:
        with get_db() as db:
            _, token = auth_service.register(db, request.email, request.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    try:
        with get_db() as db:
            _, token = auth_service.login(db, request.email, request.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme)):
    with get_db() as db:
        auth_service.logout(db, credentials.credentials)
    return {"status": "ok"}


@router.get("/me", response_model=User)
def get_me(user: User = Depends(get_current_user)):
    return user
