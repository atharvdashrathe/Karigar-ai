from __future__ import annotations

import io
import uuid
from pathlib import Path

from PIL import Image

SAMPLE_PHOTO = Path(__file__).resolve().parents[2] / "data" / "demo" / "Threeidiots.jpg"


def _create_product(client) -> str:
    # Unique phone number per call: tests in this module share one session-
    # scoped DB (see conftest.py), so a fixed number would collide across tests.
    phone = f"+91-9{uuid.uuid4().int % 10**9:09d}"
    artisan_resp = client.post("/api/artisans", json={"phone_number": phone, "name": "Vision Test Artisan"})
    assert artisan_resp.status_code == 201
    artisan_id = artisan_resp.json()["id"]

    product_resp = client.post("/api/products", json={"artisan_id": artisan_id, "product_name": "Untitled"})
    assert product_resp.status_code == 201
    return product_resp.json()["id"]


def test_enhance_image_requires_existing_product(client):
    fake_image = io.BytesIO()
    Image.new("RGB", (100, 100), "white").save(fake_image, format="JPEG")
    fake_image.seek(0)

    resp = client.post(
        "/api/image/enhance",
        data={"product_id": "does-not-exist"},
        files={"file": ("test.jpg", fake_image, "image/jpeg")},
    )
    assert resp.status_code == 404


def test_enhance_image_rejects_unsupported_type(client):
    product_id = _create_product(client)
    resp = client.post(
        "/api/image/enhance",
        data={"product_id": product_id},
        files={"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")},
    )
    assert resp.status_code == 415


def test_enhance_image_end_to_end_via_api(client):
    """
    Full round trip through the real API: upload the actual sample photo,
    run the real vision pipeline, confirm the response shape, confirm the
    files were actually written and are servable, and confirm the product
    row was updated.
    """
    if not SAMPLE_PHOTO.exists():
        import pytest
        pytest.skip("Sample demo photo not present in this checkout.")

    product_id = _create_product(client)

    with open(SAMPLE_PHOTO, "rb") as f:
        resp = client.post(
            "/api/image/enhance",
            data={"product_id": product_id},
            files={"file": ("sample.jpg", f, "image/jpeg")},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["product_id"] == product_id
    assert 0 <= body["quality_score"] <= 100
    assert set(body["quality_breakdown"].keys()) == {"background", "lighting", "sharpness", "framing"}
    assert body["original_image_url"].startswith("/uploads/")
    assert body["enhanced_image_url"].startswith("/uploads/")
    assert body["duration_ms"] > 0

    # The enhanced image should actually be fetchable back through the API.
    image_resp = client.get(body["enhanced_image_url"])
    assert image_resp.status_code == 200
    assert image_resp.headers["content-type"].startswith("image/")

    # The product row should now point at both images.
    product_resp = client.get(f"/api/products/{product_id}")
    assert product_resp.status_code == 200
    product = product_resp.json()
    assert product["original_image_url"] == body["original_image_url"]
    assert product["enhanced_image_url"] == body["enhanced_image_url"]
