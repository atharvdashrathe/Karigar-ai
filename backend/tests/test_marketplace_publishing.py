import pytest


def test_artisan_publish_product_appears_in_marketplace_and_detail(client):
    # Step 1: Create or identify artisan
    artisan_resp = client.post(
        "/api/artisans",
        json={
            "phone_number": "+91-9988776655",
            "name": "Kamala Bai",
            "location": "Chanderi, Madhya Pradesh",
            "craft_type": "Chanderi Silk Weaving",
            "business_name": "Kamala Handlooms",
        },
    )
    assert artisan_resp.status_code == 201
    artisan = artisan_resp.json()
    artisan_id = artisan["id"]

    # Step 2: Artisan creates and publishes product
    new_product_payload = {
        "artisan_id": artisan_id,
        "product_name": "Handcrafted Chanderi Silk Saree",
        "category": "Handloom Textiles",
        "materials": "Pure Silk, Gold Zari",
        "description": "Authentic handloom Chanderi saree woven with intricate floral motifs and gold border.",
        "english_description": "Authentic handloom Chanderi saree woven with intricate floral motifs.",
        "keywords": "chanderi, silk saree, handloom, authentic craft",
        "price": 3850.0,
        "status": "published",
        "inventory_count": 5,
        "enhanced_image_url": "https://example.com/chanderi.jpg",
    }

    create_resp = client.post("/api/products", json=new_product_payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    product_id = created["id"]
    assert created["product_name"] == "Handcrafted Chanderi Silk Saree"
    assert created["status"] == "published"
    assert created["price"] == 3850.0
    assert created["artisan_name"] == "Kamala Bai"
    assert created["artisan_location"] == "Chanderi, Madhya Pradesh"

    # Step 3: Marketplace API retrieves products (GET /api/products)
    marketplace_resp = client.get("/api/products")
    assert marketplace_resp.status_code == 200
    marketplace_products = marketplace_resp.json()
    assert isinstance(marketplace_products, list)

    # Verify the newly published product is in the marketplace list
    found = next((p for p in marketplace_products if p["id"] == product_id), None)
    assert found is not None, "Newly published product must appear in the marketplace list"
    assert found["product_name"] == "Handcrafted Chanderi Silk Saree"
    assert found["status"] == "published"
    assert found["price"] == 3850.0
    assert found["artisan_name"] == "Kamala Bai"

    # Step 4: Open Product Detail (GET /api/products/{id})
    detail_resp = client.get(f"/api/products/{product_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == product_id
    assert detail["product_name"] == "Handcrafted Chanderi Silk Saree"
    assert detail["materials"] == "Pure Silk, Gold Zari"
    assert detail["price"] == 3850.0
    assert detail["status"] == "published"
    assert detail["artisan_name"] == "Kamala Bai"
    assert detail["artisan_location"] == "Chanderi, Madhya Pradesh"
