from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.session import get_db
from app.models.catalogue import PriceRecommendation
from app.models.product import Product
from app.schemas.pricing import (
    PriceCalculateRequest,
    PriceCalculateResponse,
    PricePredictRequest,
    PricePredictResponse,
)
from app.services import pricing_service

router = APIRouter(prefix="/api", tags=["pricing"])
logger = get_logger(__name__)


@router.post("/pricing/predict", response_model=PricePredictResponse)
async def predict_price(
    req: PricePredictRequest,
    db: Session = Depends(get_db),
) -> PricePredictResponse:
    settings = get_settings()

    res = await pricing_service.predict_price(
        product_name=req.product_name,
        category=req.category,
        materials=req.materials,
        description=req.description,
        artisan_location=req.artisan_location,
        hours_to_make=req.hours_to_make,
    )

    if req.product_id:
        product = db.get(Product, req.product_id)
        if product:
            product.price = res.suggested_price
            product.minimum_price = res.minimum_price
            product.maximum_price = res.maximum_price
            product.production_cost = res.estimated_cost
            product.estimated_margin = res.estimated_margin
            product.confidence = res.confidence

            db.add(
                PriceRecommendation(
                    product_id=req.product_id,
                    recommended_price=res.suggested_price,
                    minimum_price=res.minimum_price,
                    maximum_price=res.maximum_price,
                    estimated_cost=res.estimated_cost,
                    estimated_margin=res.estimated_margin,
                    confidence=res.confidence,
                    explanation=res.explanation,
                    is_demo_data=settings.demo_mode,
                )
            )
            db.commit()

    return PricePredictResponse(
        product_id=req.product_id,
        suggested_price=res.suggested_price,
        minimum_price=res.minimum_price,
        maximum_price=res.maximum_price,
        estimated_cost=res.estimated_cost,
        estimated_margin=res.estimated_margin,
        confidence=res.confidence,
        explanation=res.explanation,
        provider=res.provider,
        suggested=res.suggested_price,
        min=res.minimum_price,
        max=res.maximum_price,
        cost=res.estimated_cost,
        margin=res.estimated_margin,
    )


@router.post("/pricing/calculate", response_model=PriceCalculateResponse)
async def calculate_price(req: PriceCalculateRequest) -> PriceCalculateResponse:
    """
    Detailed rural-first unit-economics pricing calculator.
    Formula:
      - Labour Cost = labour_hours * hourly_wage
      - Total Production Cost = raw_material_cost + labour_cost + packaging_cost + shipping_cost
      - Minimum Sustainable Price = Total Cost * 1.15
      - Recommended Fair Price = Total Cost * 1.45 (rounded to psychological craft price e.g. ₹999)
      - Estimated Profit = Recommended Price - Total Cost - Platform Fee
      - Artisan Total Earnings = Labour Cost + Estimated Profit
    """
    labour_cost = round(req.labour_hours * req.hourly_wage, 2)
    base_cost = round(req.raw_material_cost + labour_cost + req.packaging_cost + req.shipping_cost, 2)

    # Calculate min and recommended prices
    min_price = round(base_cost * 1.15, 2)
    raw_rec = base_cost * 1.45
    # Round to attractive price point e.g. ending in 49 or 99
    rec_price = round(raw_rec / 10.0) * 10 - 1
    if rec_price < min_price:
        rec_price = min_price

    platform_fee = round((rec_price * (req.platform_fee_percent / 100.0)), 2)
    profit = round(rec_price - base_cost - platform_fee, 2)
    artisan_earnings = round(labour_cost + profit, 2)

    explanation = (
        f"Raw Materials: ₹{req.raw_material_cost:.0f} + Skilled Labour ({req.labour_hours:.1f} hrs @ ₹{req.hourly_wage:.0f}/hr = ₹{labour_cost:.0f}) + "
        f"Packaging: ₹{req.packaging_cost:.0f} + Shipping: ₹{req.shipping_cost:.0f}. "
        f"Minimum sustainable base is ₹{min_price:.0f}. Recommended retail price ₹{rec_price:.0f} ensures a fair artisan earning of ₹{artisan_earnings:.0f} (profit ₹{profit:.0f} + fair labor wage ₹{labour_cost:.0f})."
    )

    return PriceCalculateResponse(
        raw_material_cost=req.raw_material_cost,
        labour_cost=labour_cost,
        packaging_cost=req.packaging_cost,
        shipping_cost=req.shipping_cost,
        platform_fee=platform_fee,
        total_cost=base_cost,
        minimum_price=min_price,
        recommended_price=rec_price,
        estimated_profit=profit,
        artisan_earnings=artisan_earnings,
        explanation=explanation,
    )

