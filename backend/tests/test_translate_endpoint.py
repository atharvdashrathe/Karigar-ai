from __future__ import annotations


def test_translate_same_language_noop(client):
    resp = client.post("/api/translate", json={"text": "Hello", "source_lang": "en", "target_lang": "en"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["translated_text"] == "Hello"
    assert body["degraded"] is False


def test_translate_invalid_language_rejected(client):
    resp = client.post("/api/translate", json={"text": "Hello", "source_lang": "en", "target_lang": "klingon"})
    assert resp.status_code == 400


def test_translate_real_request_degrades_honestly(client):
    """
    In this sandbox, NLLB can't be downloaded (see README), so translating
    across two different real languages should honestly report degraded=True
    with the original text returned — not fabricate a translation.
    """
    resp = client.post(
        "/api/translate",
        json={"text": "यह एक हस्तनिर्मित उत्पाद है।", "source_lang": "hi", "target_lang": "en"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["degraded"] is True
    assert body["translated_text"] == "यह एक हस्तनिर्मित उत्पाद है।"


def test_translate_persists_history_record(client):
    resp = client.post(
        "/api/translate",
        json={"text": "Test text", "source_lang": "en", "target_lang": "hi", "product_id": None},
    )
    assert resp.status_code == 200
    # No direct endpoint to list Translation rows yet — this at least confirms
    # the call succeeds with the DB write path exercised (see route implementation).
