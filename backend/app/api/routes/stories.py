from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.story import ArtisanStory
from app.models.user import ArtisanProfile

router = APIRouter(prefix="/api/stories", tags=["stories"])


class StoryCreateRequest(BaseModel):
    artisan_id: str
    title: str
    story_text: str
    craft_tradition: str | None = None
    generations_in_craft: int = 1
    audio_story_url: str | None = None
    audio_duration_seconds: int | None = None
    cover_image_url: str | None = None
    quote: str | None = None


@router.get("/artisan/{artisan_id}")
def get_artisan_stories(artisan_id: str, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """Get all published stories for an artisan."""
    stories = db.scalars(
        select(ArtisanStory).where(ArtisanStory.artisan_id == artisan_id, ArtisanStory.is_published.is_(True))
    ).all()
    return [
        {
            "id": s.id,
            "artisan_id": s.artisan_id,
            "title": s.title,
            "story_text": s.story_text,
            "craft_tradition": s.craft_tradition,
            "generations_in_craft": s.generations_in_craft,
            "audio_story_url": s.audio_story_url,
            "audio_duration_seconds": s.audio_duration_seconds,
            "cover_image_url": s.cover_image_url,
            "quote": s.quote,
        }
        for s in stories
    ]


@router.post("")
def create_story(req: StoryCreateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Create a new artisan heritage story."""
    artisan = db.get(ArtisanProfile, req.artisan_id)
    if not artisan:
        raise HTTPException(status_code=404, detail="Artisan profile not found")

    story = ArtisanStory(
        artisan_id=req.artisan_id,
        title=req.title,
        story_text=req.story_text,
        craft_tradition=req.craft_tradition,
        generations_in_craft=req.generations_in_craft,
        audio_story_url=req.audio_story_url,
        audio_duration_seconds=req.audio_duration_seconds,
        cover_image_url=req.cover_image_url,
        quote=req.quote,
        is_published=True,
    )
    db.add(story)
    db.commit()
    db.refresh(story)

    return {
        "id": story.id,
        "title": story.title,
        "story_text": story.story_text,
        "audio_story_url": story.audio_story_url,
    }
