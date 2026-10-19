from datetime import datetime, timedelta, timezone

import jwt

from app.config import JWT_EXPIRY_DAYS, JWT_SECRET


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
