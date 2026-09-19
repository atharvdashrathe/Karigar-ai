from __future__ import annotations

import json
import time
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.session import get_db
from app.models.operations import AIProcessingLog
from app.models.product import Product, ProductImage
from app.schemas.image import ImageEnhanceResponse, QualityBreakdownOut
from app.services import gemini_service, vision_service

router = APIRouter(prefix="/api", tags=["image"])
logger = get_logger(__name__)


def _validate_upload(file: UploadFile, raw_bytes: bytes) -> None:
    settings = get_settings()

    if file.content_type not in settings.allowed_image_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type '{file.content_type}'. Allowed: {', '.join(settings.allowed_image_types)}.",
        )

    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(raw_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image is too large. Maximum allowed size is {settings.max_upload_mb}MB.",
        )

    if len(raw_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")


@router.post(
    "/image/enhance",
    response_model=ImageEnhanceResponse,
    summary="Enhance a product image",
    description=(
        "Remove background and score image quality. "
        "`product_id` is optional — if omitted or invalid the image is still processed "
        "but results won't be linked to a product. "
        "To link to a product, first fetch a valid ID from `GET /api/products`."
    ),
)
async def enhance_image(
    product_id: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ImageEnhanceResponse:
    # Resolve product — if product_id was supplied, verify it exists.
    product = None
    if product_id:
        product = db.get(Product, product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    raw_bytes = await file.read()
    _validate_upload(file, raw_bytes)

    settings = get_settings()
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)

    # Only write an audit log row when we have a real linked product.
    log = None
    if product is not None:
        log = AIProcessingLog(product_id=product_id, stage="image_enhance", status="started", is_demo_data=settings.demo_mode)
        db.add(log)
        db.commit()

    start = time.perf_counter()
    try:
        result = vision_service.enhance_image(raw_bytes)
    except Exception as exc:
        # Section 19: never crash — surface a friendly, specific error and log it.
        logger.exception("Image enhancement failed for product %s", product_id)
        if log is not None:
            log.status = "failed"
            log.duration_ms = int((time.perf_counter() - start) * 1000)
            log.error_message = str(exc)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We couldn't process that photo. Please try a different photo or try again.",
        ) from exc

    # Persist both the original and the enhanced image to disk.
    file_stem = f"{product_id}_{uuid.uuid4().hex[:8]}"
    original_ext = (file.content_type or "image/jpeg").split("/")[-1]
    original_filename = f"{file_stem}_original.{original_ext}"
    enhanced_filename = f"{file_stem}_enhanced.jpg"

    (settings.uploads_dir / original_filename).write_bytes(raw_bytes)
    (settings.uploads_dir / enhanced_filename).write_bytes(result.enhanced_bytes)

    original_url = f"/uploads/{original_filename}"
    enhanced_url = f"/uploads/{enhanced_filename}"

    if product is not None:
        db.add(ProductImage(
            product_id=product_id, url=original_url, kind="original",
            quality_score=result.original_quality_score,
            quality_breakdown_json=json.dumps(result.original_quality_breakdown.as_dict()),
        ))
        db.add(ProductImage(
            product_id=product_id, url=enhanced_url, kind="enhanced",
            quality_score=result.quality_score,
            quality_breakdown_json=json.dumps(result.quality_breakdown.as_dict()),
        ))
        product.original_image_url = original_url
        product.enhanced_image_url = enhanced_url

    if log is not None:
        log.status = "success"
        log.duration_ms = result.duration_ms
        log.model_used = result.provider
    db.commit()

    # Optionally enrich with Gemini Vision analysis if available
    gemini_details = await gemini_service.analyze_image_gemini(raw_bytes, mime_type=file.content_type or "image/jpeg")
    combined_suggestions = list(result.suggestions)
    category_val = None
    materials_val = None
    craft_type_val = None
    tags_val = None

    if gemini_details:
        for s in gemini_details.suggestions:
            if s not in combined_suggestions:
                combined_suggestions.append(s)
        category_val = gemini_details.category
        materials_val = gemini_details.materials
        craft_type_val = gemini_details.craft_type
        tags_val = gemini_details.tags
        if product is not None:
            if not product.category and category_val:
                product.category = category_val
            if not product.materials and materials_val:
                product.materials = ", ".join(materials_val)
            if not product.craft_type and craft_type_val:
                product.craft_type = craft_type_val
            if not product.tags and tags_val:
                product.tags = ", ".join(tags_val)
            db.commit()

    logger.info("Enhanced image (product=%s): score %d -> %d", product_id or "unlinked", result.original_quality_score, result.quality_score)

    return ImageEnhanceResponse(
        product_id=product_id or "unlinked",
        original_image_url=original_url,
        enhanced_image_url=enhanced_url,
        quality_score=result.quality_score,
        quality_breakdown=QualityBreakdownOut(**result.quality_breakdown.as_dict()),
        original_quality_score=result.original_quality_score,
        original_quality_breakdown=QualityBreakdownOut(**result.original_quality_breakdown.as_dict()),
        suggestions=combined_suggestions,
        background_removed=result.background_removed,
        provider=f"{result.provider} + gemini-vision" if gemini_details else result.provider,
        duration_ms=result.duration_ms,
        category=category_val,
        materials=materials_val,
        craft_type=craft_type_val,
        tags=tags_val,
    )
