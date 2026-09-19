"""
AI Image Studio (Section 1 of the spec).

Ported from experiments/image_studio.py, with three changes over the original:
  1. Wrapped as a reusable function returning bytes, not a CLI script writing
     to hardcoded paths.
  2. Added the quality score + per-check breakdown the spec's UI needs
     (background / lighting / sharpness / framing), computed with classic,
     explainable image-processing metrics — no extra model to train or ship.
  3. Made background removal recoverable: if rembg/U2Net is unavailable or
     fails, we fall back to enhancing the original background rather than
     crashing or producing a broken image (Section 19: never crash on a
     missing/unavailable model).

Model choice: U2NetP (not full U2Net) per the project's own README decision —
smaller, kinder to a 4GB GPU, and fine for product-on-plain-background photos.
"""
from __future__ import annotations

import io
import time
from dataclasses import dataclass, field
from functools import lru_cache

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

CANVAS_SIZE = 1000
BORDER_BAND_FRACTION = 0.08  # outer ring used to judge background uniformity

# Standard "variance of Laplacian" blur-detection kernel, applied via PIL so we
# don't need an OpenCV dependency for one metric.
_LAPLACIAN_KERNEL = ImageFilter.Kernel((3, 3), [0, -1, 0, -1, 4, -1, 0, -1, 0], scale=1)

# Thresholds calibrated against the repo's sample artisan photo
# (data/demo/Threeidiots.jpg, before vs. after enhancement). These are
# reasonable starting points for a prototype, not tuned on a large dataset —
# revisit once real artisan photos are available.
SHARPNESS_MIN = 120.0        # Laplacian variance below this reads as blurry
BRIGHTNESS_IDEAL = 150.0     # 0-255 grayscale mean
BRIGHTNESS_TOLERANCE = 65.0  # +/- range considered "well lit"
BORDER_STD_MAX = 20.0        # background uniformity: lower std = cleaner background
FRAMING_MIN_FILL = 0.20      # subject should occupy at least this fraction of the frame
FRAMING_MAX_FILL = 0.95      # ...and not be so large it's clipped
EDGE_TOUCH_MARGIN_PX = 3


@dataclass
class QualityBreakdown:
    background: bool
    lighting: bool
    sharpness: bool
    framing: bool

    def as_dict(self) -> dict[str, bool]:
        # bool(...) guards against numpy.bool_ leaking in from upstream
        # comparisons — plain json.dumps() can't serialize that type.
        return {"background": bool(self.background), "lighting": bool(self.lighting),
                "sharpness": bool(self.sharpness), "framing": bool(self.framing)}


@dataclass
class EnhancementResult:
    enhanced_bytes: bytes
    quality_score: int
    quality_breakdown: QualityBreakdown
    suggestions: list[str]
    background_removed: bool
    provider: str
    duration_ms: int
    original_quality_score: int = 0
    original_quality_breakdown: QualityBreakdown = field(
        default_factory=lambda: QualityBreakdown(False, False, False, False)
    )


@lru_cache
def _get_rembg_session():
    """
    Load the U2NetP session once per process (Section 13: lazy loading + model
    caching, never reload per request). Returns None if rembg isn't installed
    or the model can't be fetched, so callers can fall back gracefully.
    """
    try:
        from rembg import new_session
        settings = get_settings()
        session = new_session(settings.vision_bg_removal_model)
        logger.info("Loaded rembg session (%s)", settings.vision_bg_removal_model)
        return session
    except Exception:
        logger.exception("Could not load background-removal model; will fall back to no-bg-removal mode.")
        return None


def _remove_background(image: Image.Image) -> tuple[Image.Image | None, bool]:
    """Returns (rgba_image_with_alpha, succeeded)."""
    session = _get_rembg_session()
    if session is None:
        return None, False
    try:
        from rembg import remove
        result = remove(image.convert("RGBA"), session=session)
        return result, True
    except Exception:
        logger.exception("Background removal failed at inference time; falling back to original background.")
        return None, False


def _composite_on_white(rgba: Image.Image) -> Image.Image:
    background = Image.new("RGBA", rgba.size, "white")
    background.alpha_composite(rgba)
    return background.convert("RGB")


def _enhance_and_frame(image: Image.Image) -> Image.Image:
    """Brightness/contrast/sharpness correction + center on a square e-commerce canvas."""
    image = ImageEnhance.Brightness(image).enhance(1.06)
    image = ImageEnhance.Contrast(image).enhance(1.08)
    image = ImageEnhance.Sharpness(image).enhance(1.12)
    image.thumbnail((CANVAS_SIZE, CANVAS_SIZE), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), "white")
    x = (CANVAS_SIZE - image.width) // 2
    y = (CANVAS_SIZE - image.height) // 2
    canvas.paste(image, (x, y))
    return canvas


# ----------------------------------------------------------------------------
# Quality scoring — four independent, explainable checks. Each contributes up
# to 25 points; suggestions are generated for anything that fails its check.
# ----------------------------------------------------------------------------

def _sharpness_metric(image: Image.Image) -> float:
    gray = image.convert("L")
    edges = gray.filter(_LAPLACIAN_KERNEL)
    return float(np.asarray(edges, dtype=np.float64).var())


def _brightness_metric(image: Image.Image) -> float:
    gray = image.convert("L")
    return float(np.asarray(gray, dtype=np.float64).mean())


def _border_uniformity_metric(image: Image.Image) -> float:
    """Standard deviation of pixel values in the outer border ring. Low = plain/uniform background."""
    arr = np.asarray(image.convert("L"), dtype=np.float64)
    h, w = arr.shape
    band = max(4, int(BORDER_BAND_FRACTION * min(h, w)))
    border_pixels = np.concatenate([
        arr[:band, :].ravel(), arr[-band:, :].ravel(),
        arr[:, :band].ravel(), arr[:, -band:].ravel(),
    ])
    return float(border_pixels.std())


def _framing_metric(image: Image.Image) -> tuple[float, bool] | None:
    """
    Returns (fill_ratio, touches_edge) using an edge-density bounding box as a
    proxy for "where is the subject". Returns None if no clear edges are found
    (e.g. a blank frame) — framing can't be judged in that case.

    The outermost pixels are trimmed before analysis: convolution at the true
    image boundary produces spurious high-response artifacts there (PIL pads
    out-of-bounds pixels during filtering), which would otherwise make almost
    every photo register as "touching the edge" regardless of actual framing.
    """
    gray = image.convert("L")
    edges = gray.filter(_LAPLACIAN_KERNEL)
    arr = np.asarray(edges, dtype=np.float64)
    h, w = arr.shape
    margin = max(2, int(0.015 * min(h, w)))
    interior = arr[margin: h - margin, margin: w - margin]
    if interior.size == 0:
        return None

    threshold = interior.mean() + interior.std()
    mask = interior > threshold
    if not mask.any():
        return None

    ys, xs = np.where(mask)
    ih, iw = interior.shape
    fill_ratio = ((ys.max() - ys.min() + 1) * (xs.max() - xs.min() + 1)) / (ih * iw)
    touches_edge = (
        xs.min() <= EDGE_TOUCH_MARGIN_PX or xs.max() >= iw - EDGE_TOUCH_MARGIN_PX - 1
        or ys.min() <= EDGE_TOUCH_MARGIN_PX or ys.max() >= ih - EDGE_TOUCH_MARGIN_PX - 1
    )
    return fill_ratio, touches_edge


def analyze_quality(image: Image.Image, background_was_removed: bool) -> tuple[int, QualityBreakdown, list[str]]:
    suggestions: list[str] = []
    score = 0

    # Background: if we successfully removed it, this check always passes
    # (we know it's a clean composite). Otherwise, judge the original
    # background's uniformity — a plain wall/table still passes.
    border_std = _border_uniformity_metric(image)
    background_ok = background_was_removed or border_std <= BORDER_STD_MAX
    if background_ok:
        score += 25
    else:
        suggestions.append("Place the product against a plain, uncluttered background for a cleaner look.")

    # Lighting
    brightness = _brightness_metric(image)
    lighting_ok = abs(brightness - BRIGHTNESS_IDEAL) <= BRIGHTNESS_TOLERANCE
    if lighting_ok:
        score += 25
    elif brightness < BRIGHTNESS_IDEAL:
        suggestions.append("The photo looks dark. Try taking it in daylight or near a window.")
    else:
        suggestions.append("The photo looks overexposed. Avoid direct harsh light or flash.")

    # Sharpness
    sharpness = _sharpness_metric(image)
    sharpness_ok = sharpness >= SHARPNESS_MIN
    if sharpness_ok:
        score += 25
    else:
        suggestions.append("The photo looks blurry. Hold the camera steady or clean the lens, then retake it.")

    # Framing
    framing_metrics = _framing_metric(image)
    if framing_metrics is None:
        framing_ok = False
        suggestions.append("We couldn't clearly detect the product. Try a photo with better contrast against the background.")
    else:
        fill_ratio, touches_edge = framing_metrics
        framing_ok = (FRAMING_MIN_FILL <= fill_ratio <= FRAMING_MAX_FILL) and not touches_edge
        if not framing_ok:
            if touches_edge or fill_ratio > FRAMING_MAX_FILL:
                suggestions.append("The product looks cropped. Step back slightly so the whole item is visible.")
            else:
                suggestions.append("The product looks small in the frame. Move closer for a more detailed photo.")
    if framing_ok:
        score += 25

    # Cast explicitly: comparisons against numpy scalars (fill_ratio, border_std,
    # etc. flow through numpy at various points) can yield numpy.bool_ rather
    # than a native Python bool, which json.dumps() rejects downstream.
    breakdown = QualityBreakdown(
        background=bool(background_ok), lighting=bool(lighting_ok),
        sharpness=bool(sharpness_ok), framing=bool(framing_ok),
    )
    return score, breakdown, suggestions


def enhance_image(raw_bytes: bytes) -> EnhancementResult:
    """
    Main entry point for POST /api/image/enhance. Runs background removal
    (with graceful fallback), enhancement, e-commerce framing, and quality
    scoring on both the original and the final image.
    """
    start = time.perf_counter()

    original = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    original_score, original_breakdown, _ = analyze_quality(original, background_was_removed=False)

    rgba, bg_removed = _remove_background(original)
    if bg_removed and rgba is not None:
        composited = _composite_on_white(rgba)
        provider = f"rembg-{get_settings().vision_bg_removal_model}"
    else:
        composited = original
        provider = "fallback-no-bg-removal"

    final = _enhance_and_frame(composited)
    final_score, final_breakdown, suggestions = analyze_quality(final, background_was_removed=bg_removed)

    buffer = io.BytesIO()
    final.save(buffer, format="JPEG", quality=92, optimize=True)

    duration_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "Image enhanced in %dms (background_removed=%s, score=%d->%d)",
        duration_ms, bg_removed, original_score, final_score,
    )

    return EnhancementResult(
        enhanced_bytes=buffer.getvalue(),
        quality_score=final_score,
        quality_breakdown=final_breakdown,
        suggestions=suggestions,
        background_removed=bg_removed,
        provider=provider,
        duration_ms=duration_ms,
        original_quality_score=original_score,
        original_quality_breakdown=original_breakdown,
    )
