import hashlib
import hmac
import os
import secrets
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException as StarletteHTTPException

from database import Base, engine, get_db
from db_models import RefreshTokenDB, UserDB
from models import (
    AuthResponse,
    AuthTokens,
    LoginDto,
    RefreshDto,
    RegisterDto,
    User,
)

load_dotenv()

# ---------- настройки ----------
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
ACCESS_TTL_SECONDS = int(os.getenv("ACCESS_TTL_SECONDS", "900"))
REFRESH_TTL_DAYS = int(os.getenv("REFRESH_TTL_DAYS", "30"))
# JWT_SECRET в .env
JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(32)
JWT_ALGORITHM = "HS256"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # создаёт таблицы, если их ещё нет (существующие не меняет)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="ai_agent backend", lifespan=lifespan)

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
        message = str(first.get("ctx", {}).get("error", "Некорректные данные запроса"))
    elif first.get("type") == "missing":
        message = "Email и пароль обязательны"
    else:
        message = "Некорректные данные запроса"
    return JSONResponse(status_code=400, content={"message": message})


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


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def issue_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(seconds=ACCESS_TTL_SECONDS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def issue_tokens(db: Session, user_id: str) -> AuthTokens:
    refresh_token = secrets.token_hex(24)
    db.add(
        RefreshTokenDB(
            token_hash=hash_refresh_token(refresh_token),
            user_id=user_id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
        )
    )
    db.commit()
    return AuthTokens(accessToken=issue_access_token(user_id), refreshToken=refresh_token)


def to_public_user(user: UserDB) -> User:
    return User(id=user.id, email=user.email, name=user.name)


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserDB:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Не авторизован")
    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user = db.get(UserDB, payload.get("sub"))
    if user is None:
        raise HTTPException(status_code=401, detail="Не авторизован")
    return user


# ---------- эндпоинты авторизации ----------
auth = APIRouter(prefix="/api/auth", tags=["auth"])


@auth.post("/register", response_model=AuthResponse)
def register(data: RegisterDto, db: Session = Depends(get_db)):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email и пароль обязательны")
    if db.scalar(select(UserDB).where(UserDB.email == data.email)):
        raise HTTPException(
            status_code=409, detail="Пользователь с таким email уже существует"
        )
    user = UserDB(
        id=str(uuid.uuid4()),
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # одновременная регистрация с той же почтой
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Пользователь с таким email уже существует"
        )
    return AuthResponse(user=to_public_user(user), tokens=issue_tokens(db, user.id))


@auth.post("/login", response_model=AuthResponse)
def login(data: LoginDto, db: Session = Depends(get_db)):
    user = db.scalar(select(UserDB).where(UserDB.email == data.email))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return AuthResponse(user=to_public_user(user), tokens=issue_tokens(db, user.id))


@auth.post("/refresh", response_model=AuthTokens)
def refresh(data: RefreshDto, db: Session = Depends(get_db)):
    row = db.get(RefreshTokenDB, hash_refresh_token(data.refreshToken))
    if row is None:
        raise HTTPException(status_code=401, detail="Сессия истекла, войдите заново")
    user_id = row.user_id
    expired = row.expires_at < datetime.now(timezone.utc)
    db.delete(row)  
    db.commit()
    if expired:
        raise HTTPException(status_code=401, detail="Сессия истекла, войдите заново")
    return issue_tokens(db, user_id)


@auth.post("/logout", status_code=204)
def logout():
    return Response(status_code=204)


@auth.get("/me", response_model=User)
def me(user: UserDB = Depends(get_current_user)):
    return to_public_user(user)


app.include_router(auth)