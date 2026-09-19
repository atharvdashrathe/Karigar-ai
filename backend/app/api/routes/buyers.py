from __future__ import annotations

from fastapi import APIRouter
from app.schemas.buyer import BuyerMatchOpportunity, BuyerMatchResponse

router = APIRouter(prefix="/api", tags=["buyers"])


@router.post("/buyers/match", response_model=BuyerMatchResponse)
async def match_buyers(product_id: str | None = None) -> BuyerMatchResponse:
    return BuyerMatchResponse(
        product_id=product_id,
        opportunities=[
            BuyerMatchOpportunity(
                buyer_type="Retail Boutiques & Home Décor Stores",
                match_score=95,
                reason="High demand for authentic handmade eco-friendly artisanal items.",
                potential_requirement="20-50 units recurring monthly orders.",
            ),
            BuyerMatchOpportunity(
                buyer_type="Corporate & Festive Gifting Agencies",
                match_score=88,
                reason="Curated handicraft gift hampers for Diwali and seasonal celebrations.",
                potential_requirement="Bulk orders of 100+ units with custom branding.",
            ),
            BuyerMatchOpportunity(
                buyer_type="Export Craft Aggregators",
                match_score=82,
                reason="Authentic geographical craft heritage with fair-trade storytelling.",
                potential_requirement="Sample verification and export batch shipment.",
            ),
        ],
    )
