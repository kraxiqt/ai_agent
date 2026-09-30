from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


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


class RegisterDto(BaseModel):
    name: str | None = None
    email: str
    password: str


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



            

