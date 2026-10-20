from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.auth.dependencies import get_current_user
from app.auth.protocol import AuthError, LoginRequest, RegisterRequest, TokenResponse, User
from app.auth.service import auth_service
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest):
    try:
        with get_db() as db:
            _, token = auth_service.register(db, payload.email, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest):
    try:
        with get_db() as db:
            _, token = auth_service.login(db, payload.email, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(request: Request):
    token = request.headers.get("authorization", "")[7:]
    with get_db() as db:
        auth_service.logout(db, token)
    return {"status": "ok"}


@router.get("/me", response_model=User)
def get_me(user: User = Depends(get_current_user)):
    return user
