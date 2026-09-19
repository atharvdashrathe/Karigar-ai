import pytest
from app.services import pricing_service
from app.services.pricing_service import CATEGORY_BENCHMARKS


def test_category_benchmarks_exist():
    assert "Traditional Handicrafts" in CATEGORY_BENCHMARKS
    assert "Handloom Textiles" in CATEGORY_BENCHMARKS
    assert "Pottery" in CATEGORY_BENCHMARKS
    assert "Artisan Jewellery" in CATEGORY_BENCHMARKS


@pytest.mark.anyio
async def test_predict_price_service_fallback_pottery():
    res = await pricing_service.predict_price(
        product_name="Handcrafted Clay Pot",
        category="Pottery",
        materials=["Terracotta Clay"],
        description="Shaped by hand on traditional potter wheel",
        hours_to_make=4.0,
    )
    assert res.suggested_price > 0
    assert res.minimum_price > 0
    assert res.maximum_price >= res.suggested_price
    assert res.estimated_cost > 0
    assert res.confidence >= 80.0
    assert "Pottery" in res.explanation or "labor" in res.explanation.lower() or "materials" in res.explanation.lower()


def test_pricing_predict_endpoint_full(client):
    payload = {
        "product_name": "Authentic Silk Paithani Saree",
        "category": "Handloom Textiles",
        "materials": ["Pure Silk", "Zari Thread"],
        "description": "Handwoven over 14 days by master weaver",
        "artisan_location": "Yeola, Maharashtra",
        "hours_to_make": 24.0,
    }
    resp = client.post("/api/pricing/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["suggested_price"] > 0
    assert data["minimum_price"] > 0
    assert data["maximum_price"] >= data["suggested_price"]
    assert data["estimated_cost"] > 0
    assert data["estimated_margin"] > 0
    assert "explanation" in data


def test_pricing_calculate_endpoint(client):
    payload = {
        "raw_material_cost": 300.0,
        "labour_hours": 6.0,
        "hourly_wage": 100.0,
        "packaging_cost": 40.0,
        "shipping_cost": 60.0,
        "platform_fee_percent": 5.0,
    }
    resp = client.post("/api/pricing/calculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["labour_cost"] == 600.0
    assert data["total_cost"] == 1000.0
    assert data["minimum_price"] >= 1150.0
    assert data["recommended_price"] > data["total_cost"]
    assert data["estimated_profit"] > 0
    assert data["artisan_earnings"] >= 600.0
