"""
Placeholder routes for the AI pipeline endpoints (Sections 1-6, 8 of the spec).

These exist now so the full API surface is documented and the Flutter team can
build against stable paths/response shapes immediately — but each returns
501 Not Implemented rather than a faked response. Per the project's own rule
("never claim a feature is complete without testing it"), a fake 200 here
would be worse than an honest 501. Each of these gets replaced with a real
implementation in its own phase (see build prompt, Section 10):

  Phase 2 (DONE, see routes/image.py)   -> /api/image/enhance
  Phase 3 (DONE, see routes/speech.py, routes/translate.py)
                                         -> /api/speech/transcribe, /api/translate
  Phase 4 -> /api/catalogue/generate       (catalogue_service)
  Phase 5 -> /api/pricing/predict          (pricing_service)
  Phase 6 -> /api/listing/score            (listing_score_service)
  Phase 6 -> /api/buyers/match             (buyer_matching_service)
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/api", tags=["ai-pipeline (not yet implemented)"])

_NOT_IMPLEMENTED = {
    "/catalogue/generate": "Phase 4 - catalogue_service",
    "/pricing/predict": "Phase 5 - pricing_service",
    "/listing/score": "Phase 6 - listing_score_service",
    "/buyers/match": "Phase 6 - buyer_matching_service",
}


def _not_implemented(path: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"{path} is not implemented yet. Scheduled: {_NOT_IMPLEMENTED[path]}.",
    )


@router.post("/catalogue/generate")
def generate_catalogue() -> None:
    _not_implemented("/catalogue/generate")


@router.post("/pricing/predict")
def predict_price() -> None:
    _not_implemented("/pricing/predict")


@router.post("/listing/score")
def score_listing() -> None:
    _not_implemented("/listing/score")


@router.post("/buyers/match")
def match_buyers() -> None:
    _not_implemented("/buyers/match")
