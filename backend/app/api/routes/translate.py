from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.db.session import get_db
from app.models.operations import Translation
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.services import translation_service

router = APIRouter(prefix="/api", tags=["translate"])
logger = get_logger(__name__)


@router.post("/translate", response_model=TranslateResponse)
def translate_text(payload: TranslateRequest, db: Session = Depends(get_db)) -> TranslateResponse:
    try:
        result = translation_service.translate(payload.text, payload.source_lang, payload.target_lang)
    except translation_service.UnsupportedLanguageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    db.add(Translation(
        product_id=payload.product_id,
        source_text=payload.text,
        source_lang=payload.source_lang,
        target_lang=payload.target_lang,
        translated_text=result.translated_text,
        model_used=result.provider,
    ))
    db.commit()

    if result.degraded:
        logger.warning(
            "Translation degraded (%s -> %s): model unavailable, original text returned.",
            payload.source_lang, payload.target_lang,
        )

    return TranslateResponse(
        translated_text=result.translated_text,
        source_lang=payload.source_lang,
        target_lang=payload.target_lang,
        provider=result.provider,
        degraded=result.degraded,
        duration_ms=result.duration_ms,
    )
