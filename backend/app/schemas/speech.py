from __future__ import annotations

from pydantic import BaseModel


class TranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    provider: str
    is_fallback: bool
    audio_duration_sec: float
    duration_ms: int
    english_translation: str | None = None
