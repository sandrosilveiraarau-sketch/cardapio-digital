from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from jose import jwt
from ..schemas import LoginRequest, TokenOut
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenOut)
def login(body: LoginRequest):
    if body.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Senha incorreta")
    token = create_token({"sub": "admin"})
    return TokenOut(access_token=token)
