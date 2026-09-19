from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enquiry import Enquiry
from app.models.operations import Order
from app.models.product import Product
from app.models.user import ArtisanProfile, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


class VerifyArtisanRequest(BaseModel):
    is_verified: bool


class VerifyProductBadgesRequest(BaseModel):
    is_gi_tagged: bool | None = None
    is_handmade_verified: bool | None = None
    is_women_led: bool | None = None
    is_sustainable: bool | None = None
    status: str | None = None


@router.get("/metrics")
def get_admin_metrics(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Admin overview metrics."""
    total_artisans = db.scalar(select(func.count(ArtisanProfile.id))) or 0
    total_products = db.scalar(select(func.count(Product.id))) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0
    total_enquiries = db.scalar(select(func.count(Enquiry.id))) or 0
    total_sales = db.scalar(select(func.sum(Order.total_amount))) or 0.0

    pending_artisans = db.scalar(
        select(func.count(ArtisanProfile.id)).where(ArtisanProfile.is_verified.is_(False))
    ) or 0

    pending_products = db.scalar(
        select(func.count(Product.id)).where(Product.status == "draft")
    ) or 0

    return {
        "total_artisans": total_artisans,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_enquiries": total_enquiries,
        "total_sales": float(total_sales),
        "pending_artisan_verifications": pending_artisans,
        "pending_product_approvals": pending_products,
    }


@router.get("/artisans")
def list_admin_artisans(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """List all artisans with their verification status and product counts."""
    artisans = db.scalars(select(ArtisanProfile)).all()
    out = []
    for a in artisans:
        prod_count = len(a.products) if a.products else 0
        out.append({
            "id": a.id,
            "name": a.name,
            "location": a.location,
            "state": a.state,
            "craft_type": a.craft_type,
            "experience_years": a.experience_years,
            "is_verified": a.is_verified,
            "product_count": prod_count,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return out


@router.post("/artisans/{id}/verify")
def verify_artisan(id: str, req: VerifyArtisanRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Verify or revoke verification for an artisan."""
    artisan = db.get(ArtisanProfile, id)
    if not artisan:
        raise HTTPException(status_code=404, detail="Artisan not found")
    artisan.is_verified = req.is_verified
    db.commit()
    return {"id": artisan.id, "is_verified": artisan.is_verified, "message": "Artisan verification updated"}


@router.post("/products/{id}/verify-badges")
def verify_product_badges(id: str, req: VerifyProductBadgesRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Update authenticity badges & approval status for a product."""
    product = db.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if req.is_gi_tagged is not None:
        product.is_gi_tagged = req.is_gi_tagged
    if req.is_handmade_verified is not None:
        product.is_handmade_verified = req.is_handmade_verified
    if req.is_women_led is not None:
        product.is_women_led = req.is_women_led
    if req.is_sustainable is not None:
        product.is_sustainable = req.is_sustainable
    if req.status is not None:
        product.status = req.status

    db.commit()
    return {
        "id": product.id,
        "is_gi_tagged": product.is_gi_tagged,
        "is_handmade_verified": product.is_handmade_verified,
        "is_women_led": product.is_women_led,
        "is_sustainable": product.is_sustainable,
        "status": product.status,
    }
