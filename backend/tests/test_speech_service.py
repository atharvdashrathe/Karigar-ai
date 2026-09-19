from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import numpy as np
import pytest

from app.services import speech_service

DEMO_AUDIO = Path(__file__).resolve().parents[2] / "data" / "demo" / "audio" / "product_description.wav"


def test_normalize_language_accepts_known_codes():
    assert speech_service.normalize_language("hi") == "hi"
    assert speech_service.normalize_language("MR") == "mr"  # case-insensitive
    assert speech_service.normalize_language(None) is None


def test_normalize_language_rejects_unknown_codes():
    with pytest.raises(ValueError, match="Unsupported language"):
        speech_service.normalize_language("klingon")


def test_transcribe_raises_honest_unavailable_error_when_no_backend_installed():
    """
    Real behavior in this environment: torch/transformers/whisper are not
    installed here (see README for why — network + disk constraints in the
    dev sandbox), so both backends genuinely fail to load. This confirms the
    honest-failure path actually fires end-to-end — decode succeeds, then
    both backends are tried and both fail gracefully — rather than crashing.
    """
    if not DEMO_AUDIO.exists():
        pytest.skip("Sample demo audio not present in this checkout.")

    speech_service._get_indic_conformer.cache_clear()
    speech_service._get_whisper_model.cache_clear()

    raw_bytes = DEMO_AUDIO.read_bytes()
    with pytest.raises(speech_service.SpeechServiceUnavailable, match="type the product details"):
        speech_service.transcribe(raw_bytes, language="hi")


def test_transcribe_propagates_audio_decode_errors():
    with pytest.raises(Exception):  # AudioDecodeError, re-raised as-is
        speech_service.transcribe(b"not audio", language="hi")


# ---------------------------------------------------------------------------
# Mocked model-routing tests: since real IndicConformer/Whisper weights can't
# be fetched in this sandbox, these verify the *selection logic* (primary vs
# fallback, language handling) is correct using fake model objects, so the
# branching behavior is proven even though live inference isn't.
# ---------------------------------------------------------------------------

def test_prefers_indic_conformer_when_available(monkeypatch):
    fake_model = MagicMock()
    monkeypatch.setattr(speech_service, "_get_indic_conformer", lambda: fake_model)
    monkeypatch.setattr(speech_service, "_get_whisper_model", lambda: MagicMock())
    monkeypatch.setattr(speech_service, "_transcribe_with_indic_conformer", lambda model, samples, lang: "नमस्ते")

    samples = np.zeros(16000, dtype=np.float32)
    monkeypatch.setattr(
        speech_service, "decode_audio_to_mono_16k", lambda raw: (samples, 1.0)
    )

    result = speech_service.transcribe(b"fake-audio-bytes", language="hi")
    assert result.text == "नमस्ते"
    assert result.provider == "indic-conformer"
    assert result.is_fallback is False


def test_falls_back_to_whisper_when_indic_conformer_unavailable(monkeypatch):
    monkeypatch.setattr(speech_service, "_get_indic_conformer", lambda: None)
    fake_whisper = MagicMock()
    monkeypatch.setattr(speech_service, "_get_whisper_model", lambda: fake_whisper)
    monkeypatch.setattr(
        speech_service, "_transcribe_with_whisper", lambda model, samples, lang: ("hello there", "en")
    )
    samples = np.zeros(16000, dtype=np.float32)
    monkeypatch.setattr(speech_service, "decode_audio_to_mono_16k", lambda raw: (samples, 1.0))

    result = speech_service.transcribe(b"fake-audio-bytes", language=None)
    assert result.text == "hello there"
    assert result.is_fallback is True
    assert result.provider.startswith("whisper-")


def test_falls_back_to_whisper_when_indic_conformer_inference_fails(monkeypatch):
    fake_indic = MagicMock()
    monkeypatch.setattr(speech_service, "_get_indic_conformer", lambda: fake_indic)

    def _boom(*args, **kwargs):
        raise RuntimeError("simulated inference crash")

    monkeypatch.setattr(speech_service, "_transcribe_with_indic_conformer", _boom)

    fake_whisper = MagicMock()
    monkeypatch.setattr(speech_service, "_get_whisper_model", lambda: fake_whisper)
    monkeypatch.setattr(
        speech_service, "_transcribe_with_whisper", lambda model, samples, lang: ("fallback text", "hi")
    )
    samples = np.zeros(16000, dtype=np.float32)
    monkeypatch.setattr(speech_service, "decode_audio_to_mono_16k", lambda raw: (samples, 1.0))

    result = speech_service.transcribe(b"fake-audio-bytes", language="hi")
    assert result.text == "fallback text"
    assert result.is_fallback is True


def test_raises_unavailable_when_both_backends_fail(monkeypatch):
    monkeypatch.setattr(speech_service, "_get_indic_conformer", lambda: None)
    monkeypatch.setattr(speech_service, "_get_whisper_model", lambda: None)
    samples = np.zeros(16000, dtype=np.float32)
    monkeypatch.setattr(speech_service, "decode_audio_to_mono_16k", lambda raw: (samples, 1.0))

    with pytest.raises(speech_service.SpeechServiceUnavailable):
        speech_service.transcribe(b"fake-audio-bytes", language="hi")
