"""
Dynamic Pricing Service (Section 3 of the spec).

Combines Gemini LLM dynamic fair-trade intelligence with fallback econometric models.
Considers:
- Raw material costs
- Artisan labor hours based on fair Indian living wage standards
- Market demand elasticity & category benchmarks
- Sustainable margin calculation
"""
from __future__ import annotations

import time
from dataclasses import dataclass

from app.core.logging import get_logger
from app.services import gemini_service

logger = get_logger(__name__)

# Heuristic category cost & hour benchmarks
CATEGORY_BENCHMARKS = {
    "Traditional Handicrafts": {"base_cost": 300.0, "hourly_rate": 80.0, "default_hours": 5.0, "multiplier": 1.6},
    "Handloom Textiles": {"base_cost": 500.0, "hourly_rate": 90.0, "default_hours": 8.0, "multiplier": 1.7},
    "Artisan Jewellery": {"base_cost": 1200.0, "hourly_rate": 150.0, "default_hours": 12.0, "multiplier": 1.8},
    "Art & Paintings": {"base_cost": 600.0, "hourly_rate": 140.0, "default_hours": 10.0, "multiplier": 1.75},
    "Wooden Crafts": {"base_cost": 350.0, "hourly_rate": 85.0, "default_hours": 6.0, "multiplier": 1.65},
    "Brass & Metalware": {"base_cost": 900.0, "hourly_rate": 120.0, "default_hours": 9.0, "multiplier": 1.7},
    "Pottery": {"base_cost": 200.0, "hourly_rate": 70.0, "default_hours": 4.0, "multiplier": 1.55},
}


@dataclass
class DynamicPriceResult:
    suggested_price: float
    minimum_price: float
    maximum_price: float
    estimated_cost: float
    estimated_margin: float
    confidence: float
    explanation: str
    provider: str
    duration_ms: int


async def predict_price(
    product_name: str,
    category: str,
    materials: list[str],
    description: str = "",
    artisan_location: str = "Maharashtra, India",
    hours_to_make: float = 8.0,
) -> DynamicPriceResult:
    start = time.perf_counter()

    # 1. Try Gemini LLM Dynamic Pricing
    if gemini_service.is_gemini_available():
        try:
            gemini_res = await gemini_service.predict_price_gemini(
                product_name=product_name,
                category=category,
                materials=materials,
                description=description,
                artisan_location=artisan_location,
                hours_to_make=hours_to_make,
            )
            if gemini_res:
                duration_ms = int((time.perf_counter() - start) * 1000)
                logger.info("Dynamic price predicted via Gemini in %dms: ₹%.2f", duration_ms, gemini_res.suggested_price)
                return DynamicPriceResult(
                    suggested_price=gemini_res.suggested_price,
                    minimum_price=gemini_res.minimum_price,
                    maximum_price=gemini_res.maximum_price,
                    estimated_cost=gemini_res.estimated_cost,
                    estimated_margin=gemini_res.estimated_margin,
                    confidence=gemini_res.confidence,
                    explanation=gemini_res.explanation,
                    provider=gemini_res.provider,
                    duration_ms=duration_ms,
                )
        except Exception as exc:
            logger.warning("Gemini pricing prediction failed, using fallback: %s", exc)

    # 2. Rule-based / Econometric Fallback
    benchmark = CATEGORY_BENCHMARKS.get(category, CATEGORY_BENCHMARKS["Traditional Handicrafts"])
    hours = hours_to_make or benchmark["default_hours"]
    material_cost = benchmark["base_cost"] + (len(materials) * 50.0)
    labor_cost = hours * benchmark["hourly_rate"]
    total_cost = material_cost + labor_cost

    suggested = round(total_cost * benchmark["multiplier"] / 10.0) * 10 - 1  # e.g., 699, 1249
    minimum = round(total_cost * 1.25 / 10.0) * 10
    maximum = round(total_cost * 2.1 / 10.0) * 10
    margin = round(suggested - total_cost)

    explanation = (
        f"Based on ₹{material_cost:.0f} raw materials and {hours:.1f} hours of skilled craft labor "
        f"at standard regional fair-wage rates (₹{benchmark['hourly_rate']:.0f}/hr), with sustainable artisan margin."
    )

    duration_ms = int((time.perf_counter() - start) * 1000)
    return DynamicPriceResult(
        suggested_price=float(suggested),
        minimum_price=float(minimum),
        maximum_price=float(maximum),
        estimated_cost=float(round(total_cost)),
        estimated_margin=float(margin),
        confidence=86.0,
        explanation=explanation,
        provider="fair-trade-econometric-model",
        duration_ms=duration_ms,
    )
