from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.appreciation import Appreciation
from app.models.user import ArtisanProfile

router = APIRouter(prefix="/api/appreciations", tags=["appreciations"])


class AppreciationCreateRequest(BaseModel):
    artisan_id: str
    product_id: str | None = None
    buyer_name: str = Field(..., min_length=1)
    buyer_location: str | None = None
    message: str = Field(..., min_length=2)
    rating_stars: int = Field(default=5, ge=1, le=5)


@router.get("/artisan/{artisan_id}")
def get_artisan_appreciations(artisan_id: str, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """List all customer appreciation notes sent to this artisan."""
    apps = db.scalars(
        select(Appreciation).where(Appreciation.artisan_id == artisan_id).order_by(Appreciation.created_at.desc())
    ).all()
    return [
        {
            "id": a.id,
            "artisan_id": a.artisan_id,
            "product_id": a.product_id,
            "buyer_name": a.buyer_name,
            "buyer_location": a.buyer_location,
            "message": a.message,
            "rating_stars": a.rating_stars,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in apps
    ]


@router.post("")
def post_appreciation(req: AppreciationCreateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Submit a 'Thank the Artisan ❤️' message."""
    artisan = db.get(ArtisanProfile, req.artisan_id)
    if not artisan:
        # If user is anonymous or demo, attach to default artisan
        default_artisan = db.scalars(select(ArtisanProfile)).first()
        artisan_id = default_artisan.id if default_artisan else req.artisan_id
    else:
        artisan_id = artisan.id

    app = Appreciation(
        artisan_id=artisan_id,
        product_id=req.product_id,
        buyer_name=req.buyer_name,
        buyer_location=req.buyer_location,
        message=req.message,
        rating_stars=req.rating_stars,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return {
        "id": app.id,
        "status": "success",
        "message": "Appreciation delivered with love to the artisan!",
    }
