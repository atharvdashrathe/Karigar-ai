from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    buyer_name: str | None
    quantity: int
    unit_price: float
    total_amount: float
    status: str
    created_at: datetime


class MonthlySeriesPoint(BaseModel):
    month: str
    earnings: float
    orders: int


class EarningsSummary(BaseModel):
    total_earnings: float
    total_orders: int
    total_products: int = 0
    pending_orders: int
    fulfilled_orders: int
    pending_enquiries: int = 0
    monthly_series: list[MonthlySeriesPoint] = []
    is_demo_data: bool = False


class DashboardSummary(BaseModel):
    """
    Powers the Home screen and impact metrics.
    """

    total_products: int
    published_products: int
    draft_products: int
    total_orders: int
    total_earnings: float
    pending_enquiries: int = 0
    average_listing_score: float | None = None
    is_demo_data: bool = False
