from __future__ import annotations

import time

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.session import get_db
from app.models.operations import AIProcessingLog
from app.models.product import Product
from app.schemas.speech import TranscribeResponse
from app.services import gemini_service, speech_service
from app.services.audio_utils import AudioDecodeError

router = APIRouter(prefix="/api", tags=["speech"])
logger = get_logger(__name__)


@router.post("/speech/transcribe", response_model=TranscribeResponse)
async def transcribe_speech(
    file: UploadFile = File(...),
    language: str | None = Form(None),
    product_id: str | None = Form(None),
    db: Session = Depends(get_db),
) -> TranscribeResponse:
    if product_id is not None:
        product = db.get(Product, product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found.")

    settings = get_settings()
    raw_bytes = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(raw_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio is too large. Maximum allowed size is {settings.max_upload_mb}MB.",
        )

    log = AIProcessingLog(product_id=product_id, stage="speech_transcribe", status="started", is_demo_data=settings.demo_mode)
    db.add(log)
    db.commit()

    start = time.perf_counter()
    try:
        language = speech_service.normalize_language(language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # 1. Try Gemini Multimodal Audio transcription first if configured
    gemini_result = None
    if gemini_service.is_gemini_available():
        try:
            gemini_result = await gemini_service.transcribe_audio_gemini(
                raw_bytes,
                mime_type=file.content_type or "audio/wav",
                target_language=language,
            )
        except Exception as exc:
            logger.warning("Gemini audio transcription attempt failed: %s", exc)

    if gemini_result and gemini_result.transcript:
        duration_ms = int((time.perf_counter() - start) * 1000)
        log.status = "success"
        log.duration_ms = duration_ms
        log.model_used = gemini_result.provider
        db.commit()

        if product_id and product is not None:
            product.description = gemini_result.transcript
            if gemini_result.english_translation:
                product.english_description = gemini_result.english_translation
            db.commit()

        logger.info("Transcribed audio via Gemini in %dms", duration_ms)
        return TranscribeResponse(
            transcript=gemini_result.transcript,
            detected_language=gemini_result.detected_language,
            provider=gemini_result.provider,
            is_fallback=False,
            audio_duration_sec=0.0,
            duration_ms=duration_ms,
            english_translation=gemini_result.english_translation,
        )

    # 2. Fallback to local speech service (IndicConformer / Whisper)
    try:
        result = speech_service.transcribe(raw_bytes, language=language)
    except AudioDecodeError as exc:
        log.status = "failed"
        log.duration_ms = int((time.perf_counter() - start) * 1000)
        log.error_message = str(exc)
        db.commit()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except speech_service.SpeechServiceUnavailable as exc:
        log.status = "failed"
        log.duration_ms = int((time.perf_counter() - start) * 1000)
        log.error_message = str(exc)
        db.commit()
        # 503: this is specifically "the model isn't available right now", not
        # a bad request — the client should offer the text-input fallback.
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during speech transcription.")
        log.status = "failed"
        log.duration_ms = int((time.perf_counter() - start) * 1000)
        log.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We couldn't process that recording. Please try again or type the details instead.",
        ) from exc

    log.status = "success"
    log.duration_ms = result.duration_ms
    log.model_used = result.provider
    db.commit()

    logger.info(
        "Transcribed audio (%.1fs) via %s%s",
        result.audio_duration_sec, result.provider, " [fallback]" if result.is_fallback else "",
    )

    return TranscribeResponse(
        transcript=result.text,
        detected_language=result.detected_language,
        provider=result.provider,
        is_fallback=result.is_fallback,
        audio_duration_sec=result.audio_duration_sec,
        duration_ms=result.duration_ms,
        english_translation=result.english_translation,
    )
