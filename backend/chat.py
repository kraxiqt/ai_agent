import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from db_models import ConversationDB, MessageDB, UserDB
from llm import MAX_HISTORY_MESSAGES, LLMUnavailable, stream_llm
from models import Conversation, Message, PaginatedResponse
from news import build_news_context
from security import get_current_user

logger = logging.getLogger(__name__)

MAX_MESSAGE_CHARS = 4000  # защита лимита токенов на бесплатном тарифе

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    conversationId: str = Field(min_length=1, max_length=36)
    content: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)


def to_conversation(c: ConversationDB) -> Conversation:
    return Conversation(id=c.id, title=c.title, createdAt=c.created_at.isoformat())


def to_message(m: MessageDB) -> Message:
    return Message(
        id=m.id,
        role=m.role,
        content=m.content,
        status=m.status,
        createdAt=m.created_at.isoformat(),
    )


def get_owned_conversation(db: Session, conversation_id: str, user: UserDB) -> ConversationDB:
    conversation = db.get(ConversationDB, conversation_id)
    # чужой диалог выглядит так же, как несуществующий
    if conversation is None or conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Диалог не найден")
    return conversation


def make_title(text: str) -> str:
    one_line = " ".join(text.split())
    return one_line[:60] or "Новый чат"


def save_assistant_message(conversation_id: str, text: str) -> None:
    # отдельная сессия: сессия запроса к этому моменту может быть уже закрыта
    with SessionLocal() as db:
        db.add(
            MessageDB(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="assistant",
                content=text,
                status="sent",
            )
        )
        db.commit()


@router.post("/stream")
def stream_chat(
    data: ChatRequest,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.get(ConversationDB, data.conversationId)
    if conversation is not None and conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Диалог не найден")

    # история диалога для модели (последние сообщения) + новое сообщение пользователя
    history: list[dict] = []
    if conversation is not None:
        rows = db.scalars(
            select(MessageDB)
            .where(MessageDB.conversation_id == conversation.id)
            .order_by(MessageDB.created_at.desc())
            .limit(MAX_HISTORY_MESSAGES)
        ).all()
        history = [{"role": r.role, "content": r.content} for r in reversed(rows)]
    history.append({"role": "user", "content": data.content})

    news_context = build_news_context(data.content)
    stream = stream_llm(history, extra_system=news_context)
    try:
        first = next(stream)
    except StopIteration:
        first = ""
    except LLMUnavailable as err:
        raise HTTPException(status_code=503, detail=str(err))

    if conversation is None:
        conversation = ConversationDB(
            id=data.conversationId, user_id=user.id, title=make_title(data.content)
        )
        db.add(conversation)
    db.add(
        MessageDB(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role="user",
            content=data.content,
            status="sent",
        )
    )
    db.commit()
    conversation_id = conversation.id

    def body():
        parts: list[str] = []
        try:
            if first:
                parts.append(first)
                yield first
            for chunk in stream:
                parts.append(chunk)
                yield chunk
        except LLMUnavailable:
            logger.exception("Ошибка модели во время ответа")
        finally:
            # сюда попадаем и при обрыве (кнопка «Отмена»): частичный ответ тоже сохраняем
            try:
                stream.close()
            except Exception:
                pass
            text = "".join(parts)
            if text:
                save_assistant_message(conversation_id, text)

    return StreamingResponse(
        body(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/conversations", response_model=PaginatedResponse[Conversation])
def list_conversations(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    where = ConversationDB.user_id == user.id
    total = db.scalar(select(func.count()).select_from(ConversationDB).where(where)) or 0
    rows = db.scalars(
        select(ConversationDB)
        .where(where)
        .order_by(ConversationDB.created_at.desc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
    ).all()
    return PaginatedResponse[Conversation](
        items=[to_conversation(c) for c in rows], total=total, page=page, pageSize=pageSize
    )


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=PaginatedResponse[Message],
)
def list_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = get_owned_conversation(db, conversation_id, user)
    where = MessageDB.conversation_id == conversation.id
    total = db.scalar(select(func.count()).select_from(MessageDB).where(where)) or 0
    rows = db.scalars(
        select(MessageDB)
        .where(where)
        .order_by(MessageDB.created_at.asc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
    ).all()
    return PaginatedResponse[Message](
        items=[to_message(m) for m in rows], total=total, page=page, pageSize=pageSize
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str,
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = get_owned_conversation(db, conversation_id, user)
    db.delete(conversation)  # сообщения удаляются каскадно на уровне базы
    db.commit()
    return Response(status_code=204)