from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.collective import ArtisanCollective
from app.models.product import Product

router = APIRouter(prefix="/api/collectives", tags=["collectives"])


@router.get("")
def list_collectives(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """List all registered artisan craft collectives & village clusters."""
    collectives = db.scalars(select(ArtisanCollective).order_by(ArtisanCollective.name)).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "location": c.location,
            "state": c.state,
            "craft_type": c.craft_type,
            "description": c.description,
            "image_url": c.image_url,
            "artisan_count": c.artisan_count,
            "is_verified": c.is_verified,
        }
        for c in collectives
    ]


@router.get("/{id_or_slug}")
def get_collective(id_or_slug: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Get single collective details with products and artisans."""
    c = db.scalar(
        select(ArtisanCollective).where(
            (ArtisanCollective.id == id_or_slug) | (ArtisanCollective.slug == id_or_slug)
        )
    )
    if not c:
        raise HTTPException(status_code=404, detail="Artisan collective not found")

    prods = db.scalars(
        select(Product).where(Product.collective_id == c.id, Product.status == "published")
    ).all()

    return {
        "id": c.id,
        "name": c.name,
        "slug": c.slug,
        "location": c.location,
        "state": c.state,
        "craft_type": c.craft_type,
        "description": c.description,
        "image_url": c.image_url,
        "artisan_count": c.artisan_count,
        "is_verified": c.is_verified,
        "products": [
            {
                "id": p.id,
                "product_name": p.product_name,
                "price": p.price,
                "image": p.enhanced_image_url or p.original_image_url,
                "category": p.category,
            }
            for p in prods
        ],
    }
