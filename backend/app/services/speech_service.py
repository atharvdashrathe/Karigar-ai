"""
Speech-to-text (Section 2 of the spec, ASR half of the pipeline).

Architecture decision recorded in the build prompt: IndicConformer is the
primary ASR model (genuine multi-Indic-language coverage), Whisper is the
fast/CPU fallback. Ported from experiments/indic_conformer.py (model call
shape, WAV handling logic) and experiments/voice_to_text.py (Whisper usage).

IMPORTANT — development environment note (not a product limitation):
Both models are fetched from Hugging Face Hub / OpenAI's model host at
first use. The sandbox this was built in has neither host on its network
allowlist (confirmed: both return HTTP 403 directly), so true model
inference could not be exercised end-to-end here the way vision_service's
rembg download was. Everything in this file *not* dependent on reaching
those hosts — audio decoding, language validation, the graceful-fallback
behavior when a model is unavailable, and the API contract — was tested
for real. The actual transcription path needs verification by whoever runs
this with normal internet access (see tests/test_speech_service.py for
which tests are marked as requiring that).
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.audio_utils import AudioDecodeError, decode_audio_to_mono_16k

logger = get_logger(__name__)

# IndicConformer's supported languages (ai4bharat/indic-conformer-600m-multilingual
# model card) plus English, since artisans may describe products in English too.
# Whisper supports a superset of these, so the same codes work for both backends.
SUPPORTED_LANGUAGES: dict[str, str] = {
    "as": "Assamese", "bn": "Bengali", "brx": "Bodo", "doi": "Dogri", "en": "English",
    "gu": "Gujarati", "hi": "Hindi", "kn": "Kannada", "kok": "Konkani", "ks": "Kashmiri",
    "mai": "Maithili", "ml": "Malayalam", "mni": "Manipuri", "mr": "Marathi", "ne": "Nepali",
    "or": "Odia", "pa": "Punjabi", "sa": "Sanskrit", "sat": "Santali", "sd": "Sindhi",
    "ta": "Tamil", "te": "Telugu", "ur": "Urdu",
}


class SpeechServiceUnavailable(Exception):
    """Raised when neither ASR backend could be loaded. Caller should show a
    friendly message and offer the text-input fallback (Section 8)."""


@dataclass
class TranscriptionResult:
    text: str
    detected_language: str
    provider: str
    is_fallback: bool
    audio_duration_sec: float
    duration_ms: int
    english_translation: str | None = None


def normalize_language(language: str | None) -> str | None:
    """Validates/normalizes a language code. Returns None if unspecified (caller decides the default)."""
    if language is None:
        return None
    code = language.strip().lower()
    if code not in SUPPORTED_LANGUAGES:
        raise ValueError(
            f"Unsupported language code '{language}'. Supported: {', '.join(sorted(SUPPORTED_LANGUAGES))}."
        )
    return code


@lru_cache
def _get_indic_conformer():
    """
    Lazy-loaded, cached singleton (Section 13: load once, never per-request).
    Returns None if the model can't be loaded (no network, disk, or the
    ai4bharat model's custom code isn't available) — always a soft failure.
    """
    try:
        from transformers import AutoModel
        settings = get_settings()
        model = AutoModel.from_pretrained(settings.asr_primary_model, trust_remote_code=True)
        model.eval()
        logger.info("Loaded IndicConformer (%s)", settings.asr_primary_model)
        return model
    except Exception:
        logger.warning("IndicConformer unavailable; will try Whisper fallback.", exc_info=True)
        return None


@lru_cache
def _get_whisper_model():
    """Lazy-loaded, cached Whisper fallback model."""
    try:
        import whisper
        settings = get_settings()
        model = whisper.load_model(settings.asr_fallback_model)
        logger.info("Loaded Whisper fallback model (%s)", settings.asr_fallback_model)
        return model
    except Exception:
        logger.warning("Whisper fallback also unavailable.", exc_info=True)
        return None


def _transcribe_with_indic_conformer(model, samples, language: str) -> str:
    import torch
    wav = torch.from_numpy(samples).unsqueeze(0)
    with torch.no_grad():
        result = model(wav, language, "ctc")
    # The model's return shape varies by version; normalize to a plain string.
    return result if isinstance(result, str) else str(result)


def _transcribe_with_whisper(model, samples, language: str | None) -> tuple[str, str]:
    result = model.transcribe(samples, language=language, fp16=False, condition_on_previous_text=False)
    return result["text"].strip(), result.get("language", language or "unknown")


def transcribe(raw_bytes: bytes, language: str | None = None) -> TranscriptionResult:
    """
    Main entry point for POST /api/speech/transcribe.

    `language` should usually be the artisan's preferred_language (known from
    their profile) since IndicConformer needs an explicit target language
    rather than auto-detecting it. If omitted, Whisper's auto-detection is
    used as a best-effort default when IndicConformer isn't available or a
    language wasn't supplied.
    """
    start = time.perf_counter()
    normalized_language = normalize_language(language)

    try:
        samples, audio_duration_sec = decode_audio_to_mono_16k(raw_bytes)
    except AudioDecodeError:
        raise  # already a friendly, specific message — let the route surface it directly

    # --- Primary: IndicConformer (requires an explicit language) ---
    if normalized_language is not None:
        model = _get_indic_conformer()
        if model is not None:
            try:
                text = _transcribe_with_indic_conformer(model, samples, normalized_language)
                duration_ms = int((time.perf_counter() - start) * 1000)
                logger.info("Transcribed with IndicConformer in %dms", duration_ms)
                return TranscriptionResult(
                    text=text, detected_language=normalized_language, provider="indic-conformer",
                    is_fallback=False, audio_duration_sec=audio_duration_sec, duration_ms=duration_ms,
                )
            except Exception:
                logger.warning("IndicConformer inference failed; falling back to Whisper.", exc_info=True)

    # --- Fallback: Whisper (can auto-detect language if none was given) ---
    whisper_model = _get_whisper_model()
    if whisper_model is not None:
        try:
            text, detected_language = _transcribe_with_whisper(whisper_model, samples, normalized_language)
            duration_ms = int((time.perf_counter() - start) * 1000)
            logger.info("Transcribed with Whisper fallback in %dms", duration_ms)
            settings = get_settings()
            return TranscriptionResult(
                text=text, detected_language=detected_language,
                provider=f"whisper-{settings.asr_fallback_model}",
                is_fallback=True, audio_duration_sec=audio_duration_sec, duration_ms=duration_ms,
            )
        except Exception:
            logger.warning("Whisper fallback inference also failed.", exc_info=True)

    # --- Both unavailable: honest failure, never a fabricated transcript ---
    raise SpeechServiceUnavailable(
        "Speech recognition isn't available right now. Please type the product details instead."
    )
