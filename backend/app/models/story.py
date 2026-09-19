from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import TimestampMixin, UUIDPKMixin


class ArtisanStory(Base, UUIDPKMixin, TimestampMixin):
    """
    Meet the Maker & Artisan Heritage story.
    Stores biographical context, multi-generation heritage, and optional audio narration URL.
    """

    __tablename__ = "artisan_stories"

    artisan_id: Mapped[str] = mapped_column(ForeignKey("artisan_profiles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    story_text: Mapped[str] = mapped_column(Text)
    craft_tradition: Mapped[str | None] = mapped_column(String(150), nullable=True)
    generations_in_craft: Mapped[int] = mapped_column(Integer, default=1)
    audio_story_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    quote: Mapped[str | None] = mapped_column(String(300), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)

    artisan: Mapped["ArtisanProfile"] = relationship("ArtisanProfile", back_populates="stories")
