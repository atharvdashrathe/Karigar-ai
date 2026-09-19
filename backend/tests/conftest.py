from __future__ import annotations

import os
import tempfile
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

# Point at a throwaway SQLite file and uploads dir *before* importing anything
# from `app`: app.core.config.get_settings() is lru_cache'd on first call, and
# several modules read these at import time, so the env vars must exist first.
_TMP_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_TMP_UPLOADS = tempfile.mkdtemp(prefix="karigar_test_uploads_")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB.name}"
os.environ["UPLOADS_DIR"] = _TMP_UPLOADS
os.environ["DEMO_MODE"] = "true"

from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _cleanup_tmp_files():
    yield
    import shutil
    from app.db.session import engine
    try:
        engine.dispose()
    except Exception:
        pass
    try:
        os.unlink(_TMP_DB.name)
    except OSError:
        pass
    shutil.rmtree(_TMP_UPLOADS, ignore_errors=True)


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client
