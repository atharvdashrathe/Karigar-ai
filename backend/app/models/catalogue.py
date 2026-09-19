from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class Catalogue(Base, UUIDPKMixin, TimestampMixin):
    """
    One row per AI catalogue-generation attempt for a product (Section 2 pipeline
    output). Keeping history — rather than overwriting Product directly — means a
    bad generation can be inspected/rolled back, and Section 13's "never invent
    product facts" claim is auditable.
    """

    __tablename__ = "catalogues"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)

    source_transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_language: Mapped[str | None] = mapped_column(String(20), nullable=True)

    generated_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    generated_category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    generated_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    generated_materials: Mapped[str | None] = mapped_column(String(300), nullable=True)
    generated_keywords: Mapped[str | None] = mapped_column(String(400), nullable=True)
    generated_english: Mapped[str | None] = mapped_column(Text, nullable=True)
    generated_hindi: Mapped[str | None] = mapped_column(Text, nullable=True)

    generation_method: Mapped[str] = mapped_column(String(30), default="rules")  # rules | llm
    is_demo_data: Mapped[bool] = mapped_column(default=False)
    accepted: Mapped[bool] = mapped_column(default=False)  # artisan confirmed this version

    product: Mapped["Product"] = relationship(back_populates="catalogues")


class PriceRecommendation(Base, UUIDPKMixin, TimestampMixin):
    """Section 3: one row per pricing engine call, kept for explainability/audit."""

    __tablename__ = "price_recommendations"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)

    material_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    labour_cost: Mapped[float | None] = mapped_column(Float, nullable=True)

    recommended_price: Mapped[float] = mapped_column(Float)
    minimum_price: Mapped[float] = mapped_column(Float)
    maximum_price: Mapped[float] = mapped_column(Float)
    estimated_cost: Mapped[float] = mapped_column(Float)
    estimated_margin: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_demo_data: Mapped[bool] = mapped_column(default=False)

    product: Mapped["Product"] = relationship(back_populates="price_recommendations")


class BuyerOpportunity(Base, UUIDPKMixin, TimestampMixin):
    """Section 5: buyer-type match suggestions for a product."""

    __tablename__ = "buyer_opportunities"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)

    buyer_type: Mapped[str] = mapped_column(String(120))
    match_score: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    potential_requirement: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_demo_data: Mapped[bool] = mapped_column(default=True)

    product: Mapped["Product"] = relationship(back_populates="buyer_opportunities")
