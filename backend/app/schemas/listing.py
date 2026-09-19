from __future__ import annotations

from pydantic import BaseModel


class ListingScoreBreakdown(BaseModel):
    image: int = 90
    catalogue: int = 92
    description: int = 88
    pricing: int = 90
    completeness: int = 89


class ListingScoreRequest(BaseModel):
    product_id: str | None = None
    name: str = ""
    description: str = ""
    image_url: str | None = None
    price: float | None = None


class ListingScoreResponse(BaseModel):
    total: int
    image: int
    catalogue: int
    description: int
    pricing: int
    completeness: int
    recommendations: list[str]
