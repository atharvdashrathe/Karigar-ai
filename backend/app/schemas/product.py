from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    """
    Fields an artisan can set/edit directly. Deliberately all-optional: Section 2
    requires every AI-generated field to remain editable, and a product may exist
    in a partially-filled draft state at any point in the pipeline.
    """

    product_name: str | None = None
    category: str | None = None
    description: str | None = None
    materials: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    craft_type: str | None = None
    language: str | None = None
    english_description: str | None = None
    hindi_description: str | None = None
    keywords: str | None = None
    tags: str | None = None

    price: float | None = None
    minimum_price: float | None = None
    maximum_price: float | None = None
    production_cost: float | None = None
    estimated_margin: float | None = None
    confidence: float | None = None

    inventory_count: int = Field(default=1, ge=0)
    status: str | None = "draft"
    original_image_url: str | None = None
    enhanced_image_url: str | None = None
    listing_score: int | None = None


class ProductCreate(ProductBase):
    artisan_id: str


class ProductUpdate(ProductBase):
    """All fields optional for PATCH-style partial updates."""

    status: str | None = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    artisan_id: str
    artisan_name: str | None = None
    artisan_location: str | None = None
    original_image_url: str | None = None
    enhanced_image_url: str | None = None
    listing_score: int | None = None
    status: str
    created_at: datetime
    updated_at: datetime
