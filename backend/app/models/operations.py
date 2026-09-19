from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class Order(Base, UUIDPKMixin, TimestampMixin):
    """
    Order record for Earnings, Orders and Doorstep Pickup logistics.
    Tracks lifecycle: pending -> confirmed -> packed -> pickup_scheduled -> shipped -> delivered.
    """

    __tablename__ = "orders"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)
    artisan_id: Mapped[str] = mapped_column(ForeignKey("artisan_profiles.id"), index=True)

    buyer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    buyer_contact: Mapped[str | None] = mapped_column(String(160), nullable=True)
    shipping_address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float)
    total_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending | fulfilled | cancelled
    delivery_status: Mapped[str] = mapped_column(String(40), default="pending")  # pending | confirmed | packed | pickup_scheduled | shipped | delivered

    # Doorstep pickup logistics
    pickup_address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    pickup_agent: Mapped[str | None] = mapped_column(String(120), nullable=True)
    pickup_date: Mapped[str | None] = mapped_column(String(60), nullable=True)
    tracking_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)

    product: Mapped["Product"] = relationship()


class Inventory(Base, UUIDPKMixin, TimestampMixin):
    """Stock-level history per product. Kept separate from Product.inventory_count
    so quantity changes (restock, sale) are auditable."""

    __tablename__ = "inventory"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)
    change: Mapped[int] = mapped_column(Integer)  # positive = restock, negative = sale
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    resulting_count: Mapped[int] = mapped_column(Integer)

    product: Mapped["Product"] = relationship(back_populates="inventory_records")


class Translation(Base, UUIDPKMixin, TimestampMixin):
    """
    Generic translation record. Used both for catalogue-field translations and
    for standalone ad-hoc translations (e.g. voice-assistant replies), so it's
    kept independent of any single product.
    """

    __tablename__ = "translations"

    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id"), nullable=True, index=True)
    source_text: Mapped[str] = mapped_column(Text)
    source_lang: Mapped[str] = mapped_column(String(20))
    target_lang: Mapped[str] = mapped_column(String(20))
    translated_text: Mapped[str] = mapped_column(Text)
    model_used: Mapped[str | None] = mapped_column(String(120), nullable=True)


class AIProcessingLog(Base, UUIDPKMixin, TimestampMixin):
    """
    Section 14/21: one row per AI pipeline stage invocation. Powers the staged
    progress UI, performance benchmarking (Section 15/27), and lets QA verify a
    feature was actually exercised rather than just "looks done."
    """

    __tablename__ = "ai_processing_logs"

    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id"), nullable=True, index=True)
    stage: Mapped[str] = mapped_column(String(50))  # image_enhance | speech_transcribe | translate | ...
    status: Mapped[str] = mapped_column(String(20))  # started | success | failed
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(120), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo_data: Mapped[bool] = mapped_column(default=False)
