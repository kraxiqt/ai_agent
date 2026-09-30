import hashlib
import hmac
import os
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.exceptions import HTTPException as StarletteHTTPException

from models import (
    AuthResponse,
    LoginDto,
    RefreshDto,
    RegisterDto,
    AuthTokens,
    User,
)

# ---------- настройки ----------
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
ACCESS_TTL_SECONDS = int(os.getenv("ACCESS_TTL_SECONDS", "900"))
# В проде задай JWT_SECRET в .env. Без него ключ генерируется при каждом запуске.
JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(32)
JWT_ALGORITHM = "HS256"

app = FastAPI(title="ai_agent backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- формат ошибок: фронт ждёт {"message": "..."} ----------
@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    if first.get("type") == "value_error":
        # наше сообщение из валидатора, например "Некорректный email"
        message = str(first.get("ctx", {}).get("error", "Некорректные данные запроса"))
    elif first.get("type") == "missing":
        message = "Email и пароль обязательны"
    else:
        message = "Некорректные данные запроса"
    return JSONResponse(status_code=400, content={"message": message})


# ---------- временное хранилище (данные пропадут при перезапуске) ----------
@dataclass
class StoredUser:
    id: str
    email: str
    name: str | None
    password_hash: str


users_by_email: dict[str, StoredUser] = {}
refresh_token_to_user_id: dict[str, str] = {}


# ---------- пароли и токены ----------
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(":")
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), 200_000
    )
    return hmac.compare_digest(digest.hex(), digest_hex)


def issue_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(seconds=ACCESS_TTL_SECONDS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def issue_tokens(user_id: str) -> AuthTokens:
    refresh_token = secrets.token_hex(24)
    refresh_token_to_user_id[refresh_token] = user_id
    return AuthTokens(accessToken=issue_access_token(user_id), refreshToken=refresh_token)


def to_public_user(user: StoredUser) -> User:
    return User(id=user.id, email=user.email, name=user.name)


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> StoredUser:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Не авторизован")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user = next((u for u in users_by_email.values() if u.id == payload.get("sub")), None)
    if user is None:
        raise HTTPException(status_code=401, detail="Не авторизован")
    return user


# ---------- эндпоинты авторизации ----------
auth = APIRouter(prefix="/api/auth", tags=["auth"])


@auth.post("/register", response_model=AuthResponse)
def register(data: RegisterDto):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email и пароль обязательны")
    if data.email in users_by_email:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким email уже существует"
        )
    user = StoredUser(
        id=str(uuid.uuid4()),
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
    )
    users_by_email[user.email] = user
    return AuthResponse(user=to_public_user(user), tokens=issue_tokens(user.id))


@auth.post("/login", response_model=AuthResponse)
def login(data: LoginDto):
    user = users_by_email.get(data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return AuthResponse(user=to_public_user(user), tokens=issue_tokens(user.id))


@auth.post("/refresh", response_model=AuthTokens)
def refresh(data: RefreshDto):
    user_id = refresh_token_to_user_id.pop(data.refreshToken, None)  # ротация
    if user_id is None:
        raise HTTPException(status_code=401, detail="Сессия истекла, войдите заново")
    return issue_tokens(user_id)


@auth.post("/logout", status_code=204)
def logout():
    return Response(status_code=204)


@auth.get("/me", response_model=User)
def me(user: StoredUser = Depends(get_current_user)):
    return to_public_user(user)


app.include_router(auth)