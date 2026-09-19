from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class User(Base, UUIDPKMixin, TimestampMixin):
    """
    Login/identity record. Supports roles: artisan | buyer | admin.
    """

    __tablename__ = "users"

    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    role: Mapped[str] = mapped_column(String(30), default="artisan")  # artisan | buyer | admin

    artisan_profile: Mapped["ArtisanProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class ArtisanProfile(Base, UUIDPKMixin, TimestampMixin):
    """Section 16: artisan-facing business profile. One per user; owns many products."""

    __tablename__ = "artisan_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)

    name: Mapped[str] = mapped_column(String(120))
    preferred_language: Mapped[str] = mapped_column(String(20), default="hi")
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    craft_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    business_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    collective_id: Mapped[str | None] = mapped_column(ForeignKey("artisan_collectives.id", ondelete="SET NULL"), nullable=True, index=True)

    # Payment reference
    payment_reference: Mapped[str | None] = mapped_column(String(160), nullable=True)

    user: Mapped["User"] = relationship(back_populates="artisan_profile")
    collective: Mapped["ArtisanCollective | None"] = relationship("ArtisanCollective", back_populates="artisans")
    products: Mapped[list["Product"]] = relationship(back_populates="artisan", cascade="all, delete-orphan")
    stories: Mapped[list["ArtisanStory"]] = relationship("ArtisanStory", back_populates="artisan", cascade="all, delete-orphan")
    appreciations: Mapped[list["Appreciation"]] = relationship("Appreciation", back_populates="artisan", cascade="all, delete-orphan")
