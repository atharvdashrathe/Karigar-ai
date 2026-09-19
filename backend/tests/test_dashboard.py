def test_dashboard_reflects_seeded_demo_data(client):
    # Demo mode auto-seeds on app startup (see main.py lifespan), so without
    # creating anything ourselves, the dashboard should already show the
    # 5 seeded demo products and 3 seeded demo orders.
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_products"] >= 5
    assert body["total_orders"] >= 3
    assert body["is_demo_data"] is True


def test_orders_and_earnings_are_consistent(client):
    orders_resp = client.get("/api/orders")
    assert orders_resp.status_code == 200
    orders = orders_resp.json()
    assert len(orders) >= 3

    earnings_resp = client.get("/api/earnings")
    assert earnings_resp.status_code == 200
    earnings = earnings_resp.json()

    expected_total = sum(o["total_amount"] for o in orders)
    assert earnings["total_earnings"] == expected_total
    assert earnings["total_orders"] == len(orders)
