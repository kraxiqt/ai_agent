import os
from collections.abc import Iterator
from datetime import datetime, timezone

import openai
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
# "low" / "medium" / "high"; пусто = параметр не отправляется
LLM_REASONING_EFFORT = os.getenv("LLM_REASONING_EFFORT", "")

MAX_HISTORY_MESSAGES = 10  # сколько последних сообщений отправлять модели
MAX_OUTPUT_TOKENS = int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "1500"))  # включает «рассуждения» модели

SYSTEM_PROMPT = (
    "Ты помощник по информационным технологиям и информационной безопасности. "
    "Отвечай на русском языке, понятно и по делу. "
    "Если вопрос не относится к ИТ и ИБ, вежливо скажи, что помогаешь только по этим темам. "
    "Если не уверен в ответе, так и скажи, не выдумывай факты."
)


class LLMUnavailable(Exception):
    """Модель не ответила; текст можно показать пользователю."""


_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        if not LLM_API_KEY:
            raise LLMUnavailable("ИИ не настроен: задай LLM_API_KEY в файле .env")
        _client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
    return _client


def build_system_prompt(extra_system: str | None = None) -> str:
    today = datetime.now(timezone.utc).strftime("%d.%m.%Y")
    prompt = (
        f"{SYSTEM_PROMPT}\n"
        f"Сегодняшняя дата: {today} (UTC). Ты не знаешь событий после окончания своего обучения "
        "и не должен выдумывать свежие новости, даты и ссылки."
    )
    if extra_system:
        prompt += "\n\n" + extra_system
    return prompt


def build_messages(history: list[dict], extra_system: str | None = None) -> list[dict]:
    """history: [{"role": "user" | "assistant", "content": "..."}, ...]"""
    system = {"role": "system", "content": build_system_prompt(extra_system)}
    return [system, *history[-MAX_HISTORY_MESSAGES:]]


def _params(history: list[dict], stream: bool, extra_system: str | None = None) -> dict:
    params = {
        "model": LLM_MODEL,
        "messages": build_messages(history, extra_system),
        "max_tokens": MAX_OUTPUT_TOKENS,
        "stream": stream,
    }
    if LLM_REASONING_EFFORT:
        params["extra_body"] = {"reasoning_effort": LLM_REASONING_EFFORT}
    return params


def _to_unavailable(err: Exception) -> LLMUnavailable:
    if isinstance(err, openai.RateLimitError):
        return LLMUnavailable("Слишком много запросов к ИИ, подождите минуту и повторите")
    if isinstance(err, openai.AuthenticationError):
        return LLMUnavailable("Неверный ключ API для ИИ (проверь LLM_API_KEY)")
    return LLMUnavailable("Сервис ИИ временно недоступен")


def ask_llm(history: list[dict], extra_system: str | None = None) -> str:
    """Ответ целиком."""
    try:
        resp = get_client().chat.completions.create(**_params(history, False, extra_system))
    except openai.OpenAIError as err:
        raise _to_unavailable(err) from err
    return resp.choices[0].message.content or ""


def stream_llm(history: list[dict], extra_system: str | None = None) -> Iterator[str]:
    """Ответ по частям (для потоковой выдачи во фронт)."""
    try:
        stream = get_client().chat.completions.create(**_params(history, True, extra_system))
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except openai.OpenAIError as err:
        raise _to_unavailable(err) from err