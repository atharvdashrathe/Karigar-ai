def _create_artisan(client, phone="+91-9111111111"):
    resp = client.post("/api/artisans", json={"phone_number": phone, "name": "Test Artisan"})
    assert resp.status_code == 201
    return resp.json()["id"]


def test_create_product_requires_existing_artisan(client):
    resp = client.post("/api/products", json={"artisan_id": "not-a-real-id"})
    assert resp.status_code == 404


def test_create_list_get_update_delete_product(client):
    artisan_id = _create_artisan(client)

    create_resp = client.post(
        "/api/products",
        json={"artisan_id": artisan_id, "product_name": "Draft Product", "category": "Home Décor"},
    )
    assert create_resp.status_code == 201
    product = create_resp.json()
    assert product["status"] == "draft"
    assert product["product_name"] == "Draft Product"

    list_resp = client.get("/api/products", params={"artisan_id": artisan_id})
    assert list_resp.status_code == 200
    assert any(p["id"] == product["id"] for p in list_resp.json())

    get_resp = client.get(f"/api/products/{product['id']}")
    assert get_resp.status_code == 200

    # Every AI/artisan field must remain editable (Section 2/28).
    update_resp = client.put(
        f"/api/products/{product['id']}",
        json={"product_name": "Corrected Name", "price": 499, "status": "ready"},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["product_name"] == "Corrected Name"
    assert updated["price"] == 499
    assert updated["status"] == "ready"

    delete_resp = client.delete(f"/api/products/{product['id']}")
    assert delete_resp.status_code == 204

    missing_resp = client.get(f"/api/products/{product['id']}")
    assert missing_resp.status_code == 404


def test_update_missing_product_returns_404(client):
    resp = client.put("/api/products/does-not-exist", json={"product_name": "x"})
    assert resp.status_code == 404
