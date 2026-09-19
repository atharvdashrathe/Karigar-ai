from __future__ import annotations

from pydantic import BaseModel


class QualityBreakdownOut(BaseModel):
    background: bool
    lighting: bool
    sharpness: bool
    framing: bool


class ImageEnhanceResponse(BaseModel):
    product_id: str
    original_image_url: str
    enhanced_image_url: str
    quality_score: int
    quality_breakdown: QualityBreakdownOut
    original_quality_score: int
    original_quality_breakdown: QualityBreakdownOut
    suggestions: list[str]
    background_removed: bool
    provider: str
    duration_ms: int
    category: str | None = None
    materials: list[str] | None = None
    craft_type: str | None = None
    tags: list[str] | None = None
