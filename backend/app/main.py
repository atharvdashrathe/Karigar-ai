from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import (
    admin,
    appreciations,
    artisans,
    buyers,
    catalogue,
    collectives,
    dashboard,
    enquiries,
    image,
    listing,
    marketing,
    pricing,
    products,
    saathi,
    speech,
    stories,
    translate,
)
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.db.session import init_db

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.demo_data_dir.mkdir(parents=True, exist_ok=True)
    init_db()

    if settings.demo_mode:
        # Auto-seed on first boot so the app is never shown empty during judging.
        from app.db.seed_demo_data import seed
        from app.db.session import SessionLocal

        db = SessionLocal()
        try:
            seed(db)
        finally:
            db.close()

    logger.info("Karigar AI backend started (environment=%s, demo_mode=%s)", settings.environment, settings.demo_mode)
    yield
    logger.info("Karigar AI backend shutting down.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="AI business manager backend for marginalized artisans (SIH26090).",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_allow_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(artisans.router)
    app.include_router(products.router)
    app.include_router(dashboard.router)
    app.include_router(image.router)
    app.include_router(speech.router)
    app.include_router(translate.router)
    app.include_router(pricing.router)
    app.include_router(catalogue.router)
    app.include_router(listing.router)
    app.include_router(buyers.router)
    app.include_router(enquiries.router)
    app.include_router(saathi.router)
    app.include_router(marketing.router)
    app.include_router(collectives.router)
    app.include_router(stories.router)
    app.include_router(appreciations.router)
    app.include_router(admin.router)

    # StaticFiles requires the directory to exist at mount time (which happens
    # here, at import time) — the lifespan startup hook runs too late for this.
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    # Serves saved original/enhanced images back to the Flutter app. A
    # prototype-appropriate stand-in for real object storage / a CDN.
    app.mount("/uploads", StaticFiles(directory=str(settings.uploads_dir)), name="uploads")

    @app.get("/health", tags=["health"])
    def health() -> dict:
        return {"status": "ok", "demo_mode": settings.demo_mode}

    # --- Serve the web frontend ---
    # Mount frontend static assets (CSS, JS) at /app so they don't clash with
    # API routes.  The root "/" returns index.html directly.
    frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
    if frontend_dir.exists():
        app.mount("/app", StaticFiles(directory=str(frontend_dir)), name="frontend")

        @app.get("/", include_in_schema=False)
        def serve_frontend() -> FileResponse:
            return FileResponse(str(frontend_dir / "index.html"))

    return app


app = create_app()
