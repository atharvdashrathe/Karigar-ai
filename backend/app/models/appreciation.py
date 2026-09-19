from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class Appreciation(Base, UUIDPKMixin, TimestampMixin):
    """
    "Thank the Artisan ❤️" customer appreciation message model.
    Enables buyers to express gratitude to artisans post-purchase or from marketplace.
    """

    __tablename__ = "appreciations"

    artisan_id: Mapped[str] = mapped_column(ForeignKey("artisan_profiles.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    buyer_name: Mapped[str] = mapped_column(String(160))
    buyer_location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    message: Mapped[str] = mapped_column(Text)
    rating_stars: Mapped[int] = mapped_column(Integer, default=5)

    artisan: Mapped["ArtisanProfile"] = relationship("ArtisanProfile", back_populates="appreciations")
    product: Mapped["Product"] = relationship("Product")
