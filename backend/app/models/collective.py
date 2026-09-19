from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class ArtisanCollective(Base, UUIDPKMixin, TimestampMixin):
    """
    Village / Artisan Collectives and Craft Producer Organizations (CPOs).
    Allows grouping artisans and products under authentic regional clusters.
    """

    __tablename__ = "artisan_collectives"

    name: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    location: Mapped[str] = mapped_column(String(200))
    state: Mapped[str] = mapped_column(String(100))
    craft_type: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    artisan_count: Mapped[int] = mapped_column(Integer, default=1)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)

    artisans: Mapped[list["ArtisanProfile"]] = relationship("ArtisanProfile", back_populates="collective")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="collective")
