def test_create_and_get_artisan(client):
    payload = {
        "phone_number": "+91-9000000001",
        "name": "Ramesh Kumar",
        "preferred_language": "hi",
        "location": "Jaipur, Rajasthan",
        "craft_type": "Blue pottery",
        "experience_years": 8,
        "business_name": "Ramesh Pottery Works",
    }
    create_resp = client.post("/api/artisans", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == "Ramesh Kumar"
    assert created["craft_type"] == "Blue pottery"

    get_resp = client.get(f"/api/artisans/{created['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == created["id"]


def test_duplicate_phone_number_rejected(client):
    payload = {"phone_number": "+91-9000000002", "name": "Test Artisan"}
    first = client.post("/api/artisans", json=payload)
    assert first.status_code == 201

    second = client.post("/api/artisans", json=payload)
    assert second.status_code == 409


def test_get_missing_artisan_returns_404(client):
    response = client.get("/api/artisans/does-not-exist")
    assert response.status_code == 404
