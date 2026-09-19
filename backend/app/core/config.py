"""
Central, env-driven configuration for Karigar AI.

Nothing in this file should be hardcoded per-environment. Every value that
might differ between a developer's laptop, the SIH demo laptop, and a future
deployment lives here and is overridable via environment variables / .env.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root = two levels up from this file (backend/app/core/config.py -> repo root)
BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BACKEND_DIR / ".env"), extra="ignore")

    # --- General ---
    app_name: str = "Karigar AI"
    environment: str = "development"  # development | demo | production
    demo_mode: bool = True  # Section 18/22: judging must work with no internet/model downloads.
    log_level: str = "INFO"

    # --- Database ---
    # SQLite for the prototype. Kept behind SQLAlchemy so swapping to Postgres
    # later is a one-line change (DATABASE_URL only), not a rewrite.
    database_url: str = f"sqlite:///{REPO_ROOT}/data/karigar.db"

    # --- Storage paths ---
    uploads_dir: Path = REPO_ROOT / "data" / "uploads"
    demo_data_dir: Path = REPO_ROOT / "data" / "demo"
    models_dir: Path = REPO_ROOT / "models"

    # --- Upload validation (Section 20: security) ---
    max_upload_mb: int = 15
    allowed_image_types: tuple[str, ...] = ("image/jpeg", "image/png", "image/webp")
    allowed_audio_types: tuple[str, ...] = (
        "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg",
    )

    # --- AI service model selection ---
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    asr_primary_model: str = "ai4bharat/indic-conformer-600m-multilingual"
    asr_fallback_model: str = os.getenv("ARTISAN_ASR_MODEL", "small")  # Whisper size
    translation_model: str = "facebook/nllb-200-distilled-600M"
    vision_bg_removal_model: str = "u2netp"  # smaller model, kinder to 4GB GPUs

    # --- CORS (Allow frontend Vite/Next dev servers and any local origins) ---
    cors_allow_origins: tuple[str, ...] = ("*", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000")


@lru_cache
def get_settings() -> Settings:
    """Settings are cached so we don't re-parse env vars on every request."""
    return Settings()
