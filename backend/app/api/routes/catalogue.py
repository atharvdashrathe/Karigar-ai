from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.session import get_db
from app.models.catalogue import Catalogue
from app.models.product import Product
from app.schemas.catalogue import CatalogueDescription, CatalogueGenerateRequest, CatalogueGenerateResponse
from app.services import catalogue_service

router = APIRouter(prefix="/api", tags=["catalogue"])
logger = get_logger(__name__)


@router.post("/catalogue/generate", response_model=CatalogueGenerateResponse)
async def generate_catalogue(
    req: CatalogueGenerateRequest,
    db: Session = Depends(get_db),
) -> CatalogueGenerateResponse:
    settings = get_settings()

    extra = req.extra_details or ""
    if req.category and req.category not in extra:
        extra = f"Category: {req.category}. {extra}"
    if req.materials and len(req.materials) > 0:
        mats_str = ", ".join(req.materials)
        if mats_str not in extra:
            extra = f"{extra} Materials: {mats_str}."

    res = await catalogue_service.generate_catalogue(
        transcript=req.transcript,
        source_language=req.source_language,
        extra_details=extra.strip(),
    )

    if req.product_id:
        product = db.get(Product, req.product_id)
        if product:
            product.product_name = res.name
            product.category = res.category
            product.materials = ", ".join(res.materials)
            product.keywords = ", ".join(res.keywords)
            product.english_description = res.description_en
            product.hindi_description = res.description_hi
            product.description = (
                res.description_mr if req.source_language == "mr" else (
                    res.description_hi if req.source_language == "hi" else res.description_en
                )
            )

            db.add(
                Catalogue(
                    product_id=req.product_id,
                    source_transcript=req.transcript,
                    source_language=req.source_language,
                    generated_name=res.name,
                    generated_category=res.category,
                    generated_description=product.description,
                    generated_materials=", ".join(res.materials),
                    generated_keywords=", ".join(res.keywords),
                    generated_english=res.description_en,
                    generated_hindi=res.description_hi,
                    generation_method=res.provider,
                    is_demo_data=settings.demo_mode,
                    accepted=False,
                )
            )
            db.commit()

    return CatalogueGenerateResponse(
        product_id=req.product_id,
        name=res.name,
        category=res.category,
        materials=res.materials,
        keywords=res.keywords,
        description=CatalogueDescription(
            en=res.description_en,
            hi=res.description_hi,
            mr=res.description_mr,
        ),
        provider=res.provider,
    )
