from __future__ import annotations

from pydantic import BaseModel, Field


class MarketingGenerateRequest(BaseModel):
    product_name: str
    category: str
    materials: list[str] = Field(default_factory=list)
    description: str = ""
    price: float | None = None
    language: str = "en"


class MarketingGenerateResponse(BaseModel):
    instagram_caption: str
    hashtags: list[str] = Field(default_factory=list)
    whatsapp_message: str
    video_script_30s: str
    short_ad: str
