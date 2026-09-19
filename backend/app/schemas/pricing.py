from __future__ import annotations

from pydantic import BaseModel, Field


class PricePredictRequest(BaseModel):
    product_id: str | None = None
    product_name: str = "Handcrafted Artisan Product"
    category: str = "Traditional Handicrafts"
    materials: list[str] = Field(default_factory=lambda: ["Handcrafted materials"])
    description: str = ""
    artisan_location: str = "Maharashtra, India"
    hours_to_make: float = 8.0


class PricePredictResponse(BaseModel):
    product_id: str | None = None
    suggested_price: float
    minimum_price: float
    maximum_price: float
    estimated_cost: float
    estimated_margin: float
    confidence: float
    explanation: str
    provider: str
    suggested: float  # alias for frontend compatibility
    min: float        # alias for frontend compatibility
    max: float        # alias for frontend compatibility
    cost: float       # alias for frontend compatibility
    margin: float     # alias for frontend compatibility


class PriceCalculateRequest(BaseModel):
    raw_material_cost: float = Field(..., ge=0, description="Cost of raw materials in INR")
    labour_hours: float = Field(..., ge=0, description="Hours spent making the product")
    hourly_wage: float = Field(default=80.0, ge=0, description="Fair hourly wage in INR")
    packaging_cost: float = Field(default=50.0, ge=0, description="Packaging materials cost in INR")
    shipping_cost: float = Field(default=80.0, ge=0, description="Estimated shipping/logistics cost in INR")
    platform_fee_percent: float = Field(default=0.0, ge=0, le=50, description="Platform or payment gateway fee percentage")


class PriceCalculateResponse(BaseModel):
    raw_material_cost: float
    labour_cost: float
    packaging_cost: float
    shipping_cost: float
    platform_fee: float
    total_cost: float
    minimum_price: float
    recommended_price: float
    estimated_profit: float
    artisan_earnings: float
    explanation: str

