import re
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, field_validator

T = TypeVar("T")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_RE.match(value):
        raise ValueError("Некорректный email")
    return value


class User(BaseModel):
    id: str
    email: str
    name: str | None = None


class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: str


class LoginDto(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return validate_email(value)


class RegisterDto(BaseModel):
    name: str | None = None
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return validate_email(value)


class RefreshDto(BaseModel):
    refreshToken: str


class AuthResponse(BaseModel):
    user: User
    tokens: AuthTokens


class JwtPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None
    iat: int | None = None


class Message(BaseModel):
    id: str
    role: str
    content: str
    status: str
    createdAt: str
    error: str | None = None


class Conversation(BaseModel):
    id: str
    title: str
    createdAt: str


class ApiErrorPayload(BaseModel):
    message: str | None = None
    detail: str | None = None
    code: str | None = None
    errors: Any | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    pageSize: int