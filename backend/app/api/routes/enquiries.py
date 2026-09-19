from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.db.session import get_db
from app.models.enquiry import Enquiry
from app.models.product import Product
from app.models.user import ArtisanProfile
from app.schemas.enquiry import EnquiryCreate, EnquiryOut, EnquiryUpdate

router = APIRouter(prefix="/api", tags=["enquiries"])
logger = get_logger(__name__)


def _to_enquiry_out(e: Enquiry) -> EnquiryOut:
    buyer_str = f"{e.buyer_name} · {e.buyer_contact}" if e.buyer_contact else e.buyer_name
    date_str = e.created_at.strftime("%d %b %Y") if e.created_at else datetime.now().strftime("%d %b %Y")
    return EnquiryOut(
        id=e.id,
        buyer=buyer_str,
        buyer_name=e.buyer_name,
        buyer_contact=e.buyer_contact,
        productId=e.product_id,
        productName=e.product_name,
        message=e.message,
        response_message=e.response_message,
        date=date_str,
        status=e.status,
        isDemo=bool(e.is_demo_data),
        created_at=e.created_at,
    )


@router.get("/enquiries", response_model=list[EnquiryOut])
def list_enquiries(
    artisan_id: str | None = None,
    product_id: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
) -> list[EnquiryOut]:
    query = db.query(Enquiry)
    if artisan_id:
        query = query.filter(Enquiry.artisan_id == artisan_id)
    if product_id:
        query = query.filter(Enquiry.product_id == product_id)
    if status_filter and status_filter != "all":
        query = query.filter(Enquiry.status == status_filter)

    enquiries = query.order_by(Enquiry.created_at.desc()).all()
    return [_to_enquiry_out(e) for e in enquiries]


@router.post("/enquiries", response_model=EnquiryOut, status_code=status.HTTP_201_CREATED)
def create_enquiry(req: EnquiryCreate, db: Session = Depends(get_db)) -> EnquiryOut:
    product = None
    artisan_id = None
    product_name = req.productName or "Handmade Product"

    if req.productId:
        product = db.get(Product, req.productId)
        if product:
            artisan_id = product.artisan_id
            product_name = product.product_name or product_name

    if not artisan_id:
        # Fallback to the first registered artisan if any
        first_artisan = db.query(ArtisanProfile).first()
        if first_artisan:
            artisan_id = first_artisan.id

    new_enquiry = Enquiry(
        product_id=req.productId if product else None,
        artisan_id=artisan_id,
        buyer_name=req.name.strip() if req.name else "Buyer",
        buyer_contact=req.contact.strip() if req.contact else "",
        product_name=product_name,
        message=req.message.strip(),
        status="new",
        is_demo_data=False,
    )
    db.add(new_enquiry)
    db.commit()
    db.refresh(new_enquiry)

    logger.info("Created real enquiry %s for product %s (buyer=%s)", new_enquiry.id, req.productId, req.name)
    return _to_enquiry_out(new_enquiry)


@router.patch("/enquiries/{enquiry_id}", response_model=EnquiryOut)
@router.put("/enquiries/{enquiry_id}", response_model=EnquiryOut)
def update_enquiry(
    enquiry_id: str,
    payload: EnquiryUpdate,
    db: Session = Depends(get_db),
) -> EnquiryOut:
    enquiry = db.get(Enquiry, enquiry_id)
    if enquiry is None:
        raise HTTPException(status_code=404, detail="Enquiry not found.")

    if payload.status is not None:
        enquiry.status = payload.status
    if payload.response_message is not None:
        enquiry.response_message = payload.response_message
        if enquiry.status == "new":
            enquiry.status = "responded"

    db.commit()
    db.refresh(enquiry)
    logger.info("Updated enquiry %s to status %s", enquiry.id, enquiry.status)
    return _to_enquiry_out(enquiry)


@router.delete("/enquiries/{enquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enquiry(enquiry_id: str, db: Session = Depends(get_db)) -> None:
    enquiry = db.get(Enquiry, enquiry_id)
    if enquiry is None:
        raise HTTPException(status_code=404, detail="Enquiry not found.")

    db.delete(enquiry)
    db.commit()
    logger.info("Deleted enquiry %s", enquiry_id)
