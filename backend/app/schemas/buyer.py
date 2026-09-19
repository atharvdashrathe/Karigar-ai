from __future__ import annotations

from pydantic import BaseModel


class BuyerMatchOpportunity(BaseModel):
    buyer_type: str
    match_score: int
    reason: str
    potential_requirement: str


class BuyerMatchResponse(BaseModel):
    product_id: str | None = None
    opportunities: list[BuyerMatchOpportunity]
