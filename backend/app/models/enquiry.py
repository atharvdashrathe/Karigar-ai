from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class Enquiry(Base, UUIDPKMixin, TimestampMixin):
    """
    Real buyer enquiry model. Persisted in SQLite/Postgres.
    Tracks enquiries submitted from the public marketplace for artisan products.
    """

    __tablename__ = "enquiries"

    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    artisan_id: Mapped[str | None] = mapped_column(ForeignKey("artisan_profiles.id", ondelete="SET NULL"), nullable=True, index=True)

    buyer_name: Mapped[str] = mapped_column(String(160))
    buyer_contact: Mapped[str] = mapped_column(String(160))  # Phone number, WhatsApp or Email
    product_name: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="new")  # new | responded | completed | archived
    response_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=False)

    product = relationship("Product", foreign_keys=[product_id])
    artisan = relationship("ArtisanProfile", foreign_keys=[artisan_id])
