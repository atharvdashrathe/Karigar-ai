from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.services import translation_service


def test_to_nllb_code_valid_and_invalid():
    assert translation_service._to_nllb_code("hi") == "hin_Deva"
    assert translation_service._to_nllb_code("EN") == "eng_Latn"
    with pytest.raises(translation_service.UnsupportedLanguageError):
        translation_service._to_nllb_code("klingon")


def test_same_language_is_a_fast_noop():
    result = translation_service.translate("Hello world", "en", "en")
    assert result.translated_text == "Hello world"
    assert result.degraded is False
    assert result.provider == "no-op-same-language"


def test_translate_degrades_gracefully_when_model_unavailable():
    """
    Real behavior in this sandbox: transformers/NLLB weights aren't available
    (see README). Confirms the degraded path actually returns the original
    text with degraded=True rather than crashing or fabricating output.
    """
    translation_service._get_nllb.cache_clear()
    result = translation_service.translate("नमस्ते, यह एक हस्तनिर्मित उत्पाद है।", "hi", "en")
    assert result.degraded is True
    assert result.translated_text == "नमस्ते, यह एक हस्तनिर्मित उत्पाद है।"
    assert result.provider == "unavailable-original-text-returned"


def test_invalid_language_code_raises():
    with pytest.raises(translation_service.UnsupportedLanguageError):
        translation_service.translate("hello", "en", "klingon")


# ---------------------------------------------------------------------------
# Mocked model-success-path test: proves the tokenizer/generate/decode wiring
# is correct even though a real NLLB model can't be downloaded here.
# ---------------------------------------------------------------------------

def test_uses_model_output_when_available(monkeypatch):
    fake_tokenizer = MagicMock()
    fake_tokenizer.return_value = {"input_ids": MagicMock(), "attention_mask": MagicMock()}
    fake_tokenizer.convert_tokens_to_ids.return_value = 42
    fake_tokenizer.batch_decode.return_value = ["This is a handmade product."]

    fake_model = MagicMock()
    fake_model.generate.return_value = MagicMock()

    monkeypatch.setattr(translation_service, "_get_nllb", lambda: (fake_tokenizer, fake_model))

    result = translation_service.translate("यह एक हस्तनिर्मित उत्पाद है।", "hi", "en")
    assert result.translated_text == "This is a handmade product."
    assert result.degraded is False
    fake_model.generate.assert_called_once()
