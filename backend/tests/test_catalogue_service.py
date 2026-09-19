import pytest
from app.services import catalogue_service
from app.services.catalogue_service import _rule_based_catalogue


def test_rule_based_catalogue_bamboo_direct():
    name, cat, mats, kws, d_en, d_hi, d_mr = _rule_based_catalogue(
        "बांबूची टोपली फळांसाठी", "बांबू बास्केट"
    )
    assert "Bamboo" in name
    assert cat == "Traditional Handicrafts"
    assert "Bamboo" in mats
    assert len(d_en) > 20
    assert len(d_hi) > 0
    assert len(d_mr) > 0


def test_rule_based_catalogue_textile_direct():
    name, cat, mats, kws, d_en, d_hi, d_mr = _rule_based_catalogue(
        "Handloom cotton saree with indigo dye"
    )
    assert cat == "Handloom Textiles"
    assert any("cotton" in m.lower() for m in mats)
    assert len(kws) >= 3


def test_rule_based_catalogue_pottery_direct():
    name, cat, mats, kws, d_en, d_hi, d_mr = _rule_based_catalogue(
        "Terracotta clay flower vase shaped on wheel"
    )
    assert cat == "Pottery"
    assert any("terracotta" in m.lower() or "clay" in m.lower() for m in mats)


@pytest.mark.anyio
async def test_catalogue_service_async():
    res = await catalogue_service.generate_catalogue(
        transcript="Handcrafted sheesham wood bowl with natural oil finish",
        source_language="en",
    )
    assert res.name
    assert res.category in ("Wooden Crafts", "Traditional Handicrafts")
    assert len(res.materials) > 0
    assert len(res.keywords) > 0
    assert res.description_en
    assert res.description_hi
    assert res.description_mr


def test_catalogue_endpoint_generates_multilingual(client):
    req_data = {
        "transcript": "Handcrafted sheesham wood bowl with natural oil finish",
        "source_language": "en",
        "category": "Wooden Crafts",
        "materials": ["Sheesham Wood"],
    }
    resp = client.post("/api/catalogue/generate", json=req_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"]
    assert data["category"] == "Wooden Crafts"
    assert "Sheesham Wood" in data["materials"]
    assert data["description"]["en"]
    assert data["description"]["hi"]
    assert data["description"]["mr"]
