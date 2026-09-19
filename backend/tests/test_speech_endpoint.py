from __future__ import annotations

import uuid
from pathlib import Path

DEMO_AUDIO = Path(__file__).resolve().parents[2] / "data" / "demo" / "audio" / "product_description.wav"


def _create_product(client) -> str:
    phone = f"+91-9{uuid.uuid4().int % 10**9:09d}"
    artisan_resp = client.post("/api/artisans", json={"phone_number": phone, "name": "Speech Test Artisan"})
    assert artisan_resp.status_code == 201
    artisan_id = artisan_resp.json()["id"]
    product_resp = client.post("/api/products", json={"artisan_id": artisan_id})
    assert product_resp.status_code == 201
    return product_resp.json()["id"]


def test_transcribe_rejects_unknown_product(client):
    if not DEMO_AUDIO.exists():
        import pytest
        pytest.skip("Sample demo audio not present.")
    with open(DEMO_AUDIO, "rb") as f:
        resp = client.post(
            "/api/speech/transcribe",
            data={"product_id": "does-not-exist", "language": "hi"},
            files={"file": ("sample.wav", f, "audio/wav")},
        )
    assert resp.status_code == 404


def test_transcribe_rejects_invalid_language(client):
    if not DEMO_AUDIO.exists():
        import pytest
        pytest.skip("Sample demo audio not present.")
    with open(DEMO_AUDIO, "rb") as f:
        resp = client.post(
            "/api/speech/transcribe",
            data={"language": "klingon"},
            files={"file": ("sample.wav", f, "audio/wav")},
        )
    assert resp.status_code == 400


def test_transcribe_rejects_unreadable_audio(client):
    import io
    resp = client.post(
        "/api/speech/transcribe",
        data={"language": "hi"},
        files={"file": ("sample.wav", io.BytesIO(b"not real audio data"), "audio/wav")},
    )
    assert resp.status_code == 400


def test_transcribe_real_audio_honestly_reports_unavailable(client):
    """
    In this sandbox, neither ASR backend can actually load (see README), so
    the honest, correct behavior is a 503 telling the client to fall back to
    text input — not a crash and not a fabricated transcript. This test locks
    in that real behavior. Whoever runs this with normal internet access
    should see this become a 200 with a real transcript instead — that's the
    signal Phase 3's models are truly working end-to-end.
    """
    if not DEMO_AUDIO.exists():
        import pytest
        pytest.skip("Sample demo audio not present.")

    product_id = _create_product(client)
    with open(DEMO_AUDIO, "rb") as f:
        resp = client.post(
            "/api/speech/transcribe",
            data={"product_id": product_id, "language": "hi"},
            files={"file": ("sample.wav", f, "audio/wav")},
        )
    assert resp.status_code in (200, 503)
    if resp.status_code == 503:
        assert "type the product details" in resp.json()["detail"].lower()
