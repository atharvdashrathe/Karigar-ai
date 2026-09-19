from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class SaathiChatRequest(BaseModel):
    message: str
    context: dict[str, Any] | None = None
    language: str = "en"


class SaathiChatResponse(BaseModel):
    reply: str
    suggested_actions: list[str] = Field(default_factory=list)
    category: str = "general"


class VoiceProductExtractRequest(BaseModel):
    transcript: str
    language: str = "auto"


class VoiceProductExtractResponse(BaseModel):
    product_name: str
    category: str
    quantity: int
    price: float
    materials: list[str] = Field(default_factory=list)
    description: str
    language: str = "en"
    confidence: float = 0.90


class ScamCheckRequest(BaseModel):
    message_text: str


class ScamCheckResponse(BaseModel):
    is_suspicious: bool
    risk_score: int
    warning_flags: list[str] = Field(default_factory=list)
    advice: str
