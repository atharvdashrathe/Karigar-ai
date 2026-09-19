from __future__ import annotations

import io

import numpy as np
from PIL import Image

from app.services import vision_service as vs


def _to_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    return buf.getvalue()


def test_quality_breakdown_is_json_serializable():
    """
    Regression test: numpy comparisons upstream can produce numpy.bool_
    instead of a native bool, which json.dumps() rejects even though it
    prints identically to a real bool. This caught a real bug during
    development (framing_ok leaking a numpy.bool_ into the API response).
    """
    import json

    rng = np.random.default_rng(2)
    image = Image.fromarray((rng.random((300, 300, 3)) * 255).astype("uint8"))
    _, breakdown, _ = vs.analyze_quality(image, background_was_removed=False)

    as_dict = breakdown.as_dict()
    json.dumps(as_dict)  # must not raise
    for value in as_dict.values():
        assert type(value) is bool


def test_analyze_quality_flags_dark_photo():
    dark = Image.new("RGB", (500, 500), (20, 20, 20))
    score, breakdown, suggestions = vs.analyze_quality(dark, background_was_removed=False)
    assert breakdown.lighting is False
    assert any("dark" in s.lower() for s in suggestions)


def test_analyze_quality_flags_overexposed_photo():
    bright = Image.new("RGB", (500, 500), (250, 250, 250))
    score, breakdown, suggestions = vs.analyze_quality(bright, background_was_removed=False)
    assert breakdown.lighting is False
    assert any("overexposed" in s.lower() for s in suggestions)


def test_analyze_quality_background_passes_when_flagged_as_removed():
    # A noisy/cluttered image would normally fail the background check, but
    # if we already know we composited it onto a clean canvas, it should pass.
    rng = np.random.default_rng(0)
    noisy = Image.fromarray((rng.random((300, 300, 3)) * 255).astype("uint8"))
    _, breakdown, _ = vs.analyze_quality(noisy, background_was_removed=True)
    assert breakdown.background is True


def test_analyze_quality_flags_cluttered_background_when_not_removed():
    rng = np.random.default_rng(1)
    noisy = Image.fromarray((rng.random((300, 300, 3)) * 255).astype("uint8"))
    _, breakdown, suggestions = vs.analyze_quality(noisy, background_was_removed=False)
    assert breakdown.background is False
    assert any("background" in s.lower() for s in suggestions)


def test_enhance_image_end_to_end_on_real_sample_photo():
    """
    Runs the actual pipeline (real rembg background removal, real scoring) on
    the repo's sample artisan photo, not a mock. This is intentionally slower
    than a unit test but is the only way to know the real pipeline works.
    """
    from pathlib import Path

    sample_path = Path(__file__).resolve().parents[2] / "data" / "demo" / "Threeidiots.jpg"
    if not sample_path.exists():
        import pytest
        pytest.skip("Sample demo photo not present in this checkout.")

    raw_bytes = sample_path.read_bytes()
    result = vs.enhance_image(raw_bytes)

    # The enhanced output must be a valid, loadable square e-commerce image.
    enhanced = Image.open(io.BytesIO(result.enhanced_bytes))
    assert enhanced.size == (vs.CANVAS_SIZE, vs.CANVAS_SIZE)

    assert 0 <= result.quality_score <= 100
    assert 0 <= result.original_quality_score <= 100
    # The real sample photo has a cluttered, dim background — enhancement
    # should measurably improve on it, not make it worse.
    assert result.quality_score >= result.original_quality_score
    assert isinstance(result.suggestions, list)
