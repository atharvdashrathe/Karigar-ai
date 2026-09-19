from __future__ import annotations

from fastapi import APIRouter
from app.core.logging import get_logger
from app.schemas.marketing import MarketingGenerateRequest, MarketingGenerateResponse
from app.services import gemini_service

router = APIRouter(prefix="/api/marketing", tags=["marketing"])
logger = get_logger(__name__)


@router.post("/generate", response_model=MarketingGenerateResponse)
async def generate_marketing(req: MarketingGenerateRequest) -> MarketingGenerateResponse:
    """
    AI Marketing Generator: produces Instagram Caption, WhatsApp broadcast message,
    and 30-second Video/Reel script for any artisan product.
    """
    res = await gemini_service.generate_marketing_kit(
        product_name=req.product_name,
        category=req.category,
        materials=req.materials,
        description=req.description,
        price=req.price,
        language=req.language,
    )
    return MarketingGenerateResponse(
        instagram_caption=res.get("instagram_caption", ""),
        hashtags=res.get("hashtags", []),
        whatsapp_message=res.get("whatsapp_message", ""),
        video_script_30s=res.get("video_script_30s", ""),
        short_ad=res.get("short_ad", ""),
    )
