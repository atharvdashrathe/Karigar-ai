from __future__ import annotations

from fastapi import APIRouter
from app.core.logging import get_logger
from app.schemas.saathi import (
    SaathiChatRequest,
    SaathiChatResponse,
    ScamCheckRequest,
    ScamCheckResponse,
    VoiceProductExtractRequest,
    VoiceProductExtractResponse,
)
from app.services import gemini_service

router = APIRouter(prefix="/api/saathi", tags=["saathi"])
logger = get_logger(__name__)


@router.post("/chat", response_model=SaathiChatResponse)
async def chat_with_saathi(req: SaathiChatRequest) -> SaathiChatResponse:
    """
    AI Saathi conversational assistant endpoint.
    Handles pricing advice, packaging, marketing generation, translations,
    account inquiries, and scam detection advice.
    """
    res = await gemini_service.chat_ai_saathi(
        message=req.message,
        context=req.context,
        language=req.language,
    )
    return SaathiChatResponse(
        reply=res.get("reply", "Namaste! How can I help you with your craft business today?"),
        suggested_actions=res.get("suggested_actions", []),
        category=res.get("category", "general"),
    )


@router.post("/extract-voice-product", response_model=VoiceProductExtractResponse)
async def extract_voice_product(req: VoiceProductExtractRequest) -> VoiceProductExtractResponse:
    """
    Voice-First "Sell Something" extraction endpoint.
    Extracts name, category, quantity, price, materials, description from raw spoken voice.
    """
    res = await gemini_service.extract_product_from_voice(
        transcript=req.transcript,
        language=req.language,
    )
    return VoiceProductExtractResponse(
        product_name=res.get("product_name", "Handcrafted Artisan Product"),
        category=res.get("category", "Traditional Handicrafts"),
        quantity=res.get("quantity", 1),
        price=res.get("price", 699.0),
        materials=res.get("materials", ["Handmade materials"]),
        description=res.get("description", req.transcript),
        language=res.get("language", "en"),
        confidence=res.get("confidence", 0.90),
    )


@router.post("/check-scam", response_model=ScamCheckResponse)
async def check_scam(req: ScamCheckRequest) -> ScamCheckResponse:
    """
    Artisan Scam & Phishing Protection evaluator.
    Evaluates buyer messages and payment demands for fraud red flags.
    """
    res = await gemini_service.evaluate_scam_risk(req.message_text)
    return ScamCheckResponse(
        is_suspicious=res.get("is_suspicious", False),
        risk_score=res.get("risk_score", 0),
        warning_flags=res.get("warning_flags", []),
        advice=res.get("advice", ""),
    )
