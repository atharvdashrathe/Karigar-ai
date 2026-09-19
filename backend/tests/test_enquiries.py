import pytest


def test_enquiry_lifecycle(client):
    # 1. Create product first
    prod_resp = client.post(
        "/api/products",
        json={"artisan_id": "default", "product_name": "Artisan Silk Shawl", "price": 1499},
    )
    assert prod_resp.status_code == 201
    prod = prod_resp.json()

    # 2. Buyer submits enquiry
    enq_payload = {
        "productId": prod["id"],
        "productName": "Artisan Silk Shawl",
        "name": "Ananya Sharma",
        "contact": "+91-9822011223",
        "message": "Can I order 5 pieces with custom gift packaging?",
    }
    create_resp = client.post("/api/enquiries", json=enq_payload)
    assert create_resp.status_code == 201
    enq = create_resp.json()
    assert enq["id"]
    assert enq["buyer_name"] == "Ananya Sharma"
    assert enq["productName"] == "Artisan Silk Shawl"
    assert enq["status"] == "new"

    # 3. List enquiries
    list_resp = client.get("/api/enquiries")
    assert list_resp.status_code == 200
    all_enqs = list_resp.json()
    assert any(e["id"] == enq["id"] for e in all_enqs)

    # 4. Update enquiry status / reply
    update_resp = client.patch(
        f"/api/enquiries/{enq['id']}",
        json={"status": "replied", "response_message": "Yes, custom gift packaging is available!"},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["status"] == "replied"
    assert updated["response_message"] == "Yes, custom gift packaging is available!"

    # 5. Delete enquiry
    del_resp = client.delete(f"/api/enquiries/{enq['id']}")
    assert del_resp.status_code == 204
