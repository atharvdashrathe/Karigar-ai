from __future__ import annotations

from pydantic import BaseModel


class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str
    product_id: str | None = None


class TranslateResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str
    provider: str
    degraded: bool
    duration_ms: int
