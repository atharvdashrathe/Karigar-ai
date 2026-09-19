"""
Translation (Section 2's EN/HI generation step, and standalone /api/translate).

Ported from experiments/translator.py. Same network caveat as speech_service.py:
NLLB weights live on Hugging Face Hub, which this sandbox can't reach — the
model-loading and inference code is real, but only the graceful-degradation
path (model unavailable -> return original text, flagged) could be verified
end-to-end here. See tests/test_translation_service.py.

Degradation policy: if NLLB can't be loaded or fails, we return the original
text unchanged with `degraded=True` rather than crashing or fabricating a
translation. Section 28 is explicit that uncertain AI output must be flagged,
not silently wrong — a fake translation would be worse than an honest "we
couldn't translate this, please add it yourself" signal to the artisan.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# NLLB (FLORES-200) language codes for the languages this product supports.
# Keys match the simple codes used elsewhere in the app (speech_service,
# ArtisanProfile.preferred_language) so callers don't need to know NLLB's
# internal naming.
NLLB_LANGUAGE_CODES: dict[str, str] = {
    "as": "asm_Beng", "bn": "ben_Beng", "en": "eng_Latn", "gu": "guj_Gujr",
    "hi": "hin_Deva", "kn": "kan_Knda", "ml": "mal_Mlym", "mr": "mar_Deva",
    "ne": "npi_Deva", "or": "ory_Orya", "pa": "pan_Guru", "sa": "san_Deva",
    "sd": "snd_Arab", "ta": "tam_Taml", "te": "tel_Telu", "ur": "urd_Arab",
}


class UnsupportedLanguageError(ValueError):
    pass


@dataclass
class TranslationResult:
    translated_text: str
    provider: str
    degraded: bool
    duration_ms: int


def _to_nllb_code(simple_code: str) -> str:
    code = simple_code.strip().lower()
    if code not in NLLB_LANGUAGE_CODES:
        raise UnsupportedLanguageError(
            f"'{simple_code}' isn't a supported translation language. Supported: {', '.join(sorted(NLLB_LANGUAGE_CODES))}."
        )
    return NLLB_LANGUAGE_CODES[code]


@lru_cache
def _get_nllb():
    """Lazy-loaded, cached (tokenizer, model) pair. Returns (None, None) if unavailable."""
    try:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        settings = get_settings()
        tokenizer = AutoTokenizer.from_pretrained(settings.translation_model)
        model = AutoModelForSeq2SeqLM.from_pretrained(settings.translation_model)
        logger.info("Loaded NLLB translation model (%s)", settings.translation_model)
        return tokenizer, model
    except Exception:
        logger.warning("Translation model unavailable; will return original text on request.", exc_info=True)
        return None, None


def translate(text: str, source_lang: str, target_lang: str) -> TranslationResult:
    """Main entry point for POST /api/translate and internal catalogue-generation use."""
    start = time.perf_counter()

    source_nllb = _to_nllb_code(source_lang)
    target_nllb = _to_nllb_code(target_lang)

    if source_lang.strip().lower() == target_lang.strip().lower():
        return TranslationResult(
            translated_text=text, provider="no-op-same-language", degraded=False,
            duration_ms=int((time.perf_counter() - start) * 1000),
        )

    tokenizer, model = _get_nllb()
    if tokenizer is not None and model is not None:
        try:
            tokenizer.src_lang = source_nllb
            inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
            forced_bos_token_id = tokenizer.convert_tokens_to_ids(target_nllb)
            tokens = model.generate(**inputs, forced_bos_token_id=forced_bos_token_id, max_new_tokens=512)
            translated = tokenizer.batch_decode(tokens, skip_special_tokens=True)[0]
            settings = get_settings()
            return TranslationResult(
                translated_text=translated, provider=settings.translation_model, degraded=False,
                duration_ms=int((time.perf_counter() - start) * 1000),
            )
        except Exception:
            logger.warning("Translation inference failed; returning original text.", exc_info=True)

    # Model unavailable or inference failed: never fabricate a translation.
    return TranslationResult(
        translated_text=text, provider="unavailable-original-text-returned", degraded=True,
        duration_ms=int((time.perf_counter() - start) * 1000),
    )
