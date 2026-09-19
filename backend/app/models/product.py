from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class Product(Base, UUIDPKMixin, TimestampMixin):
    """
    Section 17's product data model. This table holds the *current* state of a
    listing — the fields an artisan sees and edits. Full generation history
    (each AI attempt) lives in Catalogue / PriceRecommendation / AIProcessingLog
    so nothing here is ever silently overwritten without a trace.
    """

    __tablename__ = "products"

    artisan_id: Mapped[str] = mapped_column(ForeignKey("artisan_profiles.id"), index=True)

    # --- Catalogue fields (artisan-editable) ---
    product_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    materials: Mapped[str | None] = mapped_column(String(300), nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String(120), nullable=True)
    colour: Mapped[str | None] = mapped_column(String(80), nullable=True)
    craft_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    language: Mapped[str | None] = mapped_column(String(20), nullable=True)  # original spoken language
    english_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    hindi_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[str | None] = mapped_column(String(400), nullable=True)
    tags: Mapped[str | None] = mapped_column(String(400), nullable=True)

    # --- Pricing fields ---
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    minimum_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    maximum_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    production_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # --- Images (denormalized pointers to the ProductImage rows for convenience) ---
    original_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    enhanced_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # --- Status ---
    inventory_count: Mapped[int] = mapped_column(Integer, default=1)
    listing_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")  # draft | ready | published

    # --- Authenticity Badges (DB-backed) ---
    is_gi_tagged: Mapped[bool] = mapped_column(default=False)
    is_handmade_verified: Mapped[bool] = mapped_column(default=True)
    is_women_led: Mapped[bool] = mapped_column(default=False)
    is_sustainable: Mapped[bool] = mapped_column(default=False)

    # --- Collective & Logistics ---
    collective_id: Mapped[str | None] = mapped_column(ForeignKey("artisan_collectives.id", ondelete="SET NULL"), nullable=True, index=True)
    doorstep_pickup_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    artisan: Mapped["ArtisanProfile"] = relationship(back_populates="products")
    collective: Mapped["ArtisanCollective | None"] = relationship("ArtisanCollective", back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    catalogues: Mapped[list["Catalogue"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    price_recommendations: Mapped[list["PriceRecommendation"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    buyer_opportunities: Mapped[list["BuyerOpportunity"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    inventory_records: Mapped[list["Inventory"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductImage(Base, UUIDPKMixin, TimestampMixin):
    """Every image version (original + each enhancement attempt) for a product."""

    __tablename__ = "product_images"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)
    url: Mapped[str] = mapped_column(String(500))
    kind: Mapped[str] = mapped_column(String(20), default="original")  # original | enhanced
    quality_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quality_breakdown_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: {background, lighting, sharpness, framing}

    product: Mapped["Product"] = relationship(back_populates="images")
