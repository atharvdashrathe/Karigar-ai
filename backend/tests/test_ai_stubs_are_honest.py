import pytest


def test_catalogue_generate_endpoint(client):
    response = client.post(
        "/api/catalogue/generate",
        json={"transcript": "ही बांबूची टोपली आम्ही हाताने विणतो.", "source_language": "mr"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "category" in data
    assert "description" in data
    assert "en" in data["description"]


def test_pricing_predict_endpoint(client):
    response = client.post(
        "/api/pricing/predict",
        json={
            "product_name": "Handcrafted Bamboo Basket",
            "category": "Traditional Handicrafts",
            "materials": ["Bamboo"],
            "hours_to_make": 6.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["suggested_price"] > 0
    assert data["minimum_price"] > 0
    assert data["maximum_price"] >= data["suggested_price"]
    assert "explanation" in data


def test_listing_score_endpoint(client):
    response = client.post(
        "/api/listing/score",
        json={"description": "High quality bamboo basket crafted by master artisan."},
    )
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["total"] <= 100
    assert "image" in data
    assert "pricing" in data


def test_buyers_match_endpoint(client):
    response = client.post("/api/buyers/match")
    assert response.status_code == 200
    data = response.json()
    assert "opportunities" in data
    assert len(data["opportunities"]) > 0


def test_enquiries_endpoint(client):
    response = client.get("/api/enquiries")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    post_resp = client.post(
        "/api/enquiries",
        json={
            "productId": "p1",
            "productName": "Handcrafted Bamboo Basket",
            "name": "Rohan Gupta",
            "contact": "rohan@example.com",
            "message": "Interested in purchasing 10 baskets.",
        },
    )
    assert post_resp.status_code in (200, 201)
    new_enq = post_resp.json()
    assert new_enq["productName"] == "Handcrafted Bamboo Basket"
