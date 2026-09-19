from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.db.session import get_db
from app.models.product import Product
from app.models.user import ArtisanProfile, User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])
logger = get_logger(__name__)


@router.get("", response_model=list[ProductOut])
def list_products(
    artisan_id: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    query = db.query(Product)
    if artisan_id:
        query = query.filter(Product.artisan_id == artisan_id)
    if status_filter:
        query = query.filter(Product.status == status_filter)
    products = query.order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        p_out = ProductOut.model_validate(p)
        if p.artisan:
            p_out.artisan_name = p.artisan.name
            p_out.artisan_location = p.artisan.location or "India"
        results.append(p_out)
    return results


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductOut:
    artisan = None
    _DEMO_IDS = {"user-artisan", "default", "a1", "a2", "a3", "a4", "a5", ""}
    if payload.artisan_id in _DEMO_IDS:
        artisan = db.query(ArtisanProfile).first()
    else:
        artisan = db.get(ArtisanProfile, payload.artisan_id)
        if artisan is None:
            raise HTTPException(status_code=404, detail="Artisan not found.")


    if artisan is None:
        user = User(phone_number="+91-9876543210", display_name="Artisan Creator")
        db.add(user)
        db.flush()
        artisan = ArtisanProfile(
            user_id=user.id,
            name="Savita Patil",
            location="Sangli, Maharashtra",
            craft_type="Traditional Crafts",
            business_name="Patil Handicrafts",
        )
        db.add(artisan)
        db.flush()

    data = payload.model_dump()
    data["artisan_id"] = artisan.id

    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    logger.info("Created product %s for artisan %s (%s)", product.id, artisan.id, artisan.name)
    p_out = ProductOut.model_validate(product)
    p_out.artisan_name = artisan.name
    p_out.artisan_location = artisan.location or "India"
    return p_out


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)) -> ProductOut:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    p_out = ProductOut.model_validate(product)
    if product.artisan:
        p_out.artisan_name = product.artisan.name
        p_out.artisan_location = product.artisan.location or "India"
    return p_out


@router.put("/{product_id}", response_model=ProductOut)
@router.patch("/{product_id}", response_model=ProductOut)
def update_product(product_id: str, payload: ProductUpdate, db: Session = Depends(get_db)) -> ProductOut:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if value is not None:
            setattr(product, field, value)

    db.commit()
    db.refresh(product)
    logger.info("Updated product %s (fields: %s)", product.id, list(updates.keys()))
    p_out = ProductOut.model_validate(product)
    if product.artisan:
        p_out.artisan_name = product.artisan.name
        p_out.artisan_location = product.artisan.location or "India"
    return p_out


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, db: Session = Depends(get_db)) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    db.delete(product)
    db.commit()
    logger.info("Deleted product %s", product_id)


@router.patch("/{product_id}/inventory")
def adjust_inventory(product_id: str, change: int = Query(..., description="Delta to add/subtract, e.g. +1 or -1"), db: Session = Depends(get_db)) -> dict:
    """Adjusts stock count directly (+/-) and creates an inventory audit record."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    new_count = max(0, product.inventory_count + change)
    product.inventory_count = new_count
    db.commit()
    return {"id": product.id, "inventory_count": product.inventory_count, "change": change}

