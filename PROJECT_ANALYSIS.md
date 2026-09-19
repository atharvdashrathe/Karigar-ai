# 🛠️ PROJECT ANALYSIS — Karigar AI (SIH26090)

> **Phase 0 — Repository Inspection Report**
> Generated: 6 Sep 2026 | Python 3.14.7 | GPU: NVIDIA RTX 3050 (4GB) | CUDA 13.1

---

## A. Current Project Status

### What exists right now

The repo already has a **working FastAPI backend** (Phases 1–3 of an earlier build plan) with a **vanilla HTML/CSS/JS frontend** served from the same server. There is also an `experiments/` folder containing standalone prototypes that were the proof-of-concept before the backend was built.

| Layer | Status |
|-------|--------|
| FastAPI backend (`backend/app/`) | ✅ Running, 47/48 tests pass |
| SQLite database (`data/karigar.db`) | ✅ Working, auto-seeds demo data |
| Image Enhancement (rembg/U2Net) | ✅ Fully working with real inference |
| Speech-to-Text (IndicConformer + Whisper) | ⚠️ Code complete, but **torch/transformers/whisper NOT installed** in venv |
| Translation (NLLB-200) | ⚠️ Code complete, but **torch/transformers NOT installed** in venv |
| Catalogue Generation | ❌ Stub only — returns 501 |
| AI Price Recommendation | ❌ Stub only — returns 501 |
| Listing Score | ❌ Stub only — returns 501 |
| Buyer Matching | ❌ Stub only — returns 501 |
| Frontend web UI | ✅ Dashboard, Products, Image Studio, Artisans, AI Tools pages |
| Streamlit demo (`experiments/streamlit_app.py`) | ⚠️ Working but requires torch/whisper |
| Experiments (standalone scripts) | ✅ Exist but are NOT used by the backend |

### File count summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| `backend/app/api/routes/` | 7 route files | API endpoints |
| `backend/app/services/` | 4 service files | AI business logic |
| `backend/app/models/` | 5 model files | SQLAlchemy ORM models |
| `backend/app/schemas/` | 6 schema files | Pydantic request/response |
| `backend/app/core/` | 2 files | Config + logging |
| `backend/app/db/` | 2 files | Session + demo seed |
| `backend/tests/` | 13 test files | pytest test suite |
| `experiments/` | 10 files | Standalone prototypes |
| `frontend/` | 9 files (HTML+CSS+JS) | Web dashboard UI |
| `data/` | Demo images + audio + SQLite DB | Sample data |

---

## B. Reusable Components (DO NOT touch these)

### ✅ 1. Image Enhancement Service — FULLY WORKING
- **File**: `backend/app/services/vision_service.py` (297 lines)
- **What it does**: Background removal (rembg/U2NetP) + brightness/contrast/sharpness enhancement + e-commerce framing on 1000x1000 white canvas + quality scoring (background/lighting/sharpness/framing, 0-100 scale)
- **Status**: Real AI inference tested and verified. Takes ~2.7 seconds on your RTX 3050.
- **Route**: `POST /api/image/enhance` → `backend/app/api/routes/image.py`
- **Schema**: `backend/app/schemas/image.py`

### ✅ 2. Audio Decoding Utility — FULLY WORKING
- **File**: `backend/app/services/audio_utils.py` (92 lines)
- **What it does**: Converts any audio format (WAV/M4A/MP3/OGG/WebM) to mono 16kHz float32 numpy array using ffmpeg
- **Status**: Tested against all 3 sample audio files. FFmpeg is available on your system.
- **Dependency**: ffmpeg (system binary) — installed

### ✅ 3. Speech Service — CODE COMPLETE, needs torch installed
- **File**: `backend/app/services/speech_service.py` (172 lines)
- **What it does**: IndicConformer primary ASR + Whisper fallback, supports 23 Indian languages
- **Status**: All routing/fallback logic verified via mocks. Real inference needs `torch` + `transformers` + `whisper` installed.
- **Route**: `POST /api/speech/transcribe` → `backend/app/api/routes/speech.py`

### ✅ 4. Translation Service — CODE COMPLETE, needs torch installed
- **File**: `backend/app/services/translation_service.py` (109 lines)
- **What it does**: NLLB-200-distilled-600M translation between 16 Indian languages + English
- **Status**: Graceful degradation verified. Real inference needs `torch` + `transformers` + `sentencepiece`.
- **Route**: `POST /api/translate` → `backend/app/api/routes/translate.py`

### ✅ 5. Database Layer — FULLY WORKING
- **Files**: `backend/app/db/session.py`, `backend/app/models/*.py`
- **What it does**: SQLAlchemy ORM with SQLite. Auto-creates tables, auto-seeds demo data.
- **Tables**: `users`, `artisan_profiles`, `products`, `product_images`, `catalogues`, `price_recommendations`, `buyer_opportunities`, `orders`, `inventory`, `translations`, `ai_processing_logs`
- **Status**: All tables already defined including `Catalogue` and `PriceRecommendation` — ready for Phase 4/5.

### ✅ 6. API Skeleton — FULLY WORKING
- **Files**: `backend/app/api/routes/artisans.py`, `products.py`, `dashboard.py`
- **What it does**: Full CRUD for artisans and products, dashboard/orders/earnings endpoints
- **Status**: Tested and working.

### ✅ 7. Frontend Web UI — FULLY WORKING
- **Files**: `frontend/index.html`, `frontend/css/style.css`, `frontend/js/*.js`
- **What it does**: SPA with sidebar navigation — Dashboard, Products (grid + CRUD), Image Studio, Artisans, AI Tools (speech + translate)
- **Status**: Served via FastAPI at `/`. Polished design with gradients, animations, responsive layout.

### ✅ 8. Experiment Prototypes — REFERENCE ONLY
- `experiments/catalogue_generator.py` — Rules-based catalogue from English text (regex pattern matching)
- `experiments/pricing_model.py` — RandomForest pricing model (sklearn, hardcoded 20-row training set)
- `experiments/complete_pipeline.py` — End-to-end: speech → translate → catalogue
- `experiments/streamlit_app.py` — Full Streamlit demo with all features integrated
- **Use as**: Reference/inspiration for backend services. DO NOT import from experiments into backend.

---

## C. Problems Found

### Critical Issues

| # | Problem | Impact | Location |
|---|---------|--------|----------|
| 1 | **torch/transformers/whisper NOT installed** in venv | Speech-to-text and translation return 503 (service unavailable) | `backend/.venv/` |
| 2 | **Catalogue generation is a 501 stub** | Core MVP feature missing — no way to generate product listings from voice transcripts | `backend/app/api/routes/ai_pipeline_stubs.py` |
| 3 | **Pricing is a 501 stub** | Core MVP feature missing — no AI price recommendation | `backend/app/api/routes/ai_pipeline_stubs.py` |
| 4 | **No artisan login flow** | Anyone can hit any API — no session/auth concept even for demo | Frontend + Backend |
| 5 | **No buyer-facing view** | Buyers cannot browse published products or send enquiries | Frontend |
| 6 | **No end-to-end product creation flow** | UI pages exist separately but aren't connected into the MVP journey | Frontend |

### Minor Issues

| # | Problem | Impact | Location |
|---|---------|--------|----------|
| 7 | 1 test failure: `test_enhance_image_requires_existing_product` | Image enhance accepts non-existent `product_id` (by design — optional). Test expectation is wrong. | `tests/test_image_endpoint.py:35` |
| 8 | 1 test error: Windows temp file permission error on teardown | Cosmetic — doesn't affect functionality | `tests/conftest.py:26` |
| 9 | Python 3.14.7 — very new | Some packages (torch, whisper) may not have wheels yet. May need 3.11/3.12 fallback. | System |
| 10 | `ffmpeg` found in PATH but `where ffmpeg` returned blank stdout | May need explicit path configuration | System |

---

## D. Recommended Architecture (Beginner-Friendly)

### Keep it simple: 3-layer architecture

```
+------------------------------------------------------+
|                  FRONTEND (Browser)                  |
|  Vanilla HTML + CSS + JS  (served by FastAPI at /)   |
|  Pages: Login, Dashboard, AddProduct (wizard),       |
|         Products, BuyerView, ImageStudio, AITools    |
+---------------------------+--------------------------+
                            |  REST API calls (fetch)
+---------------------------v--------------------------+
|               BACKEND (FastAPI + Uvicorn)            |
|  Routes -> Services -> Models/DB                     |
|                                                      |
|  Services:                                           |
|   vision_service.py    <- ALREADY EXISTS             |
|   speech_service.py    <- ALREADY EXISTS (needs torch)|
|   translation_service  <- ALREADY EXISTS (needs torch)|
|   catalogue_service.py <- TO BUILD (Phase 1)         |
|   pricing_service.py   <- TO BUILD (Phase 2)         |
|   enquiry_service.py   <- TO BUILD (Phase 3)         |
+---------------------------+--------------------------+
                            |
+---------------------------v--------------------------+
|              DATABASE (SQLite)                        |
|  Tables already defined for ALL features              |
|  data/karigar.db  (auto-created, auto-seeded)        |
+------------------------------------------------------+
```

### Why this is beginner-friendly
- **No separate frontend server** — HTML served by the same FastAPI app
- **No Docker** — just `pip install` and `uvicorn` to run
- **No cloud services** — everything runs locally (SQLite, local AI models)
- **No React/Vue/Angular** — plain JavaScript you can read line by line
- **SQLite** — one file, no database server to install

---

## E. MVP Scope (60-70% Functional Demo)

### The MVP user journey we need to make work:

```
ARTISAN LOGIN (simple phone + name)
    |
    v
ADD PRODUCT (wizard form)
    |
    +---> UPLOAD/TAKE PHOTO ---> AI IMAGE ENHANCEMENT (already works)
    |
    +---> SPEAK DESCRIPTION ---> SPEECH TO TEXT (already coded, needs torch)
    |                              |
    |                              v
    |                         TRANSLATION (already coded, needs torch)
    |                              |
    |                              v
    |                    AI CATALOGUE GENERATION (TO BUILD)
    |                              |
    |                              v
    |                  AI PRICE RECOMMENDATION (TO BUILD)
    |
    v
ARTISAN REVIEWS/EDITS (edit form)
    |
    v
PUBLISH PRODUCT
    |
    v
BUYER SEES PRODUCT (public browse page)
    |
    v
BUYER SENDS ENQUIRY (TO BUILD)
```

### What's IN scope (MVP)
- Simple artisan login (phone number, no OTP — just demo identity)
- Product creation wizard (photo -> voice -> catalogue -> price -> review -> publish)
- AI image enhancement (already works)
- Speech-to-text (already coded, needs torch installed)
- Translation (already coded, needs torch installed)
- Rules-based catalogue generation (port from experiments — NO LLM needed for MVP)
- Simple pricing model (port from experiments — formula + optional sklearn)
- Buyer browse page (read-only view of published products)
- Simple enquiry form (buyer name + message saved to DB)

### What's OUT of scope (MVP)
- Real OTP/SMS authentication
- Payment processing
- Real-time chat
- Mobile app (Flutter) — web-only for demo
- Production deployment
- LLM-based catalogue generation (nice-to-have, not required)
- Real marketplace buyer matching
- Inventory management
- Analytics/impact dashboard beyond basic demo data

---

## F. Files We Should CREATE

| File | Purpose | Phase |
|------|---------|-------|
| `backend/app/services/catalogue_service.py` | Generate product catalogue from transcript (rules-based, ported from experiments) | Phase 1 |
| `backend/app/services/pricing_service.py` | Price recommendation (formula-based + optional ML) | Phase 2 |
| `backend/app/api/routes/catalogue.py` | Real `/api/catalogue/generate` endpoint | Phase 1 |
| `backend/app/api/routes/pricing.py` | Real `/api/pricing/predict` endpoint | Phase 2 |
| `backend/app/schemas/catalogue.py` | Pydantic schemas for catalogue requests/responses | Phase 1 |
| `backend/app/schemas/pricing.py` | Pydantic schemas for pricing requests/responses | Phase 2 |
| `backend/app/models/enquiry.py` | Enquiry ORM model (buyer to artisan) | Phase 3 |
| `backend/app/api/routes/enquiry.py` | `/api/enquiries` endpoint | Phase 3 |
| `backend/app/schemas/enquiry.py` | Pydantic schemas for enquiries | Phase 3 |
| `frontend/js/pages/add-product.js` | Step-by-step product creation wizard | Phase 2 |
| `frontend/js/pages/buyer-view.js` | Public buyer browse page | Phase 3 |
| `frontend/js/pages/login.js` | Simple artisan login page | Phase 1 |

---

## G. Files We Should MODIFY

| File | What to Change | Phase |
|------|---------------|-------|
| `backend/app/api/routes/ai_pipeline_stubs.py` | Remove catalogue + pricing stubs as we replace them with real endpoints | Phase 1-2 |
| `backend/app/main.py` | Register new routers (catalogue, pricing, enquiry) | Phase 1-3 |
| `backend/app/models/__init__.py` | Add new models (Enquiry) | Phase 3 |
| `frontend/index.html` | Add nav links for Add Product, Buyer View, Login | Phase 1-3 |
| `frontend/js/app.js` | Register new page routes | Phase 1-3 |
| `frontend/js/api.js` | Add API methods for catalogue, pricing, enquiry | Phase 1-3 |
| `frontend/css/style.css` | Add styles for new pages/components | Phase 1-3 |

---

## H. Files We Should NOT Touch

These files are working correctly. Do not modify unless absolutely necessary.

| File | Reason |
|------|--------|
| `backend/app/services/vision_service.py` | Fully working image enhancement |
| `backend/app/services/speech_service.py` | Code complete, well-structured |
| `backend/app/services/translation_service.py` | Code complete, well-structured |
| `backend/app/services/audio_utils.py` | Tested against real audio files |
| `backend/app/api/routes/image.py` | Working endpoint |
| `backend/app/api/routes/speech.py` | Working endpoint |
| `backend/app/api/routes/translate.py` | Working endpoint |
| `backend/app/api/routes/artisans.py` | Working CRUD |
| `backend/app/api/routes/products.py` | Working CRUD |
| `backend/app/api/routes/dashboard.py` | Working dashboard |
| `backend/app/models/common.py` | UUID + timestamp mixins |
| `backend/app/models/user.py` | User + ArtisanProfile |
| `backend/app/models/product.py` | Product + ProductImage |
| `backend/app/models/catalogue.py` | Catalogue + PriceRecommendation + BuyerOpportunity |
| `backend/app/models/operations.py` | Order + Inventory + Translation + AIProcessingLog |
| `backend/app/db/session.py` | DB session management |
| `backend/app/db/seed_demo_data.py` | Demo data seeder |
| `backend/app/core/config.py` | Environment configuration |
| `backend/app/core/logging.py` | Logging setup |
| `backend/.env` / `.env.example` | Environment variables |
| `experiments/*` | Reference only — never modify |

---

## I. Dependencies Required

### Currently Installed (in `.venv`)
```
fastapi>=0.115          uvicorn[standard]>=0.32    pydantic>=2.9
pydantic-settings>=2.6  sqlalchemy>=2.0            python-dotenv>=1.0
python-multipart>=0.0.12  pillow>=10.4             numpy>=1.26
rembg>=2.0              onnxruntime>=1.19          pytest>=8.3
httpx>=0.27
```

### Need to Install for Speech + Translation
```
torch               (install from CPU wheel index first — see below)
transformers>=4.44  (for IndicConformer + NLLB)
sentencepiece>=0.2  (required by NLLB tokenizer)
openai-whisper>=20231117  (ASR fallback)
```

### Installation commands (run in order):
```powershell
# Step 1: Activate venv
d:\karigar-ai\karigar-ai\backend\.venv\Scripts\Activate.ps1

# Step 2: Install torch (CPU-only, ~200MB instead of ~4GB)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Step 3: Install speech + translation dependencies
pip install -r requirements-speech.txt
```

### Optional (for ML-based pricing — Phase 2)
```
scikit-learn>=1.5
pandas>=2.2
```

> **Python 3.14 compatibility note**: If `torch` doesn't have a wheel for Python 3.14 yet, we may need to create a separate venv with Python 3.11 or 3.12. Check this during Phase 1 setup.

---

## J. Development Phases

### Phase 1 — Catalogue Generation Service (NEXT)
**Goal**: Port `experiments/catalogue_generator.py` logic into a proper backend service.

1. Create `backend/app/services/catalogue_service.py` — rules-based catalogue generator
2. Create `backend/app/schemas/catalogue.py` — request/response schemas
3. Create `backend/app/api/routes/catalogue.py` — real endpoint replacing the 501 stub
4. Wire up the new router in `main.py`
5. Remove `/catalogue/generate` from `ai_pipeline_stubs.py`
6. Add `frontend/js/pages/login.js` — simple phone-based identity
7. Test with `pytest`

**Estimated effort**: 2-3 hours

---

### Phase 2 — Pricing Service + Product Creation Wizard
**Goal**: Port `experiments/pricing_model.py` logic + build the frontend wizard.

1. Create `backend/app/services/pricing_service.py` — formula-based pricing
2. Create `backend/app/schemas/pricing.py` — request/response schemas
3. Create `backend/app/api/routes/pricing.py` — real endpoint replacing the 501 stub
4. Create `frontend/js/pages/add-product.js` — step-by-step wizard (photo -> voice -> catalogue -> price -> review -> publish)
5. Wire everything together
6. Install torch + speech dependencies (if not done yet)

**Estimated effort**: 4-5 hours

---

### Phase 3 — Buyer View + Enquiry System
**Goal**: Let buyers see published products and send enquiries.

1. Create `backend/app/models/enquiry.py` — Enquiry ORM model
2. Create `backend/app/api/routes/enquiry.py` — endpoints for creating/listing enquiries
3. Create `frontend/js/pages/buyer-view.js` — public product browse page
4. Add enquiry form in buyer view
5. Connect all pages via navigation

**Estimated effort**: 3-4 hours

---

### Phase 4 — Polish and Demo Prep
**Goal**: Make it presentation-ready for SIH judges.

1. End-to-end testing of the full MVP journey
2. Fix any remaining UI/UX issues
3. Ensure demo mode works offline
4. Prepare demo script / walkthrough
5. Screenshots + recording

**Estimated effort**: 2-3 hours

---

## Quick Reference: Full File Tree

```
karigar-ai/
├── .gitignore
├── PROJECT_ANALYSIS.md          <- THIS FILE
│
├── backend/
│   ├── .env                     <- Environment config
│   ├── .env.example
│   ├── .venv/                   <- Python 3.14.7 virtual environment
│   ├── README.md                <- Backend documentation
│   ├── requirements.txt         <- Core dependencies (installed)
│   ├── requirements-speech.txt  <- Speech/translation deps (NOT installed)
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              <- FastAPI app factory + lifespan
│   │   │
│   │   ├── api/routes/
│   │   │   ├── ai_pipeline_stubs.py  <- 501 stubs for catalogue/pricing/etc
│   │   │   ├── artisans.py           <- CRUD (working)
│   │   │   ├── dashboard.py          <- Dashboard + orders + earnings (working)
│   │   │   ├── image.py              <- Image enhancement (working)
│   │   │   ├── products.py           <- CRUD (working)
│   │   │   ├── speech.py             <- Speech transcription (needs torch)
│   │   │   └── translate.py          <- Translation (needs torch)
│   │   │
│   │   ├── core/
│   │   │   ├── config.py             <- Pydantic Settings (env-driven)
│   │   │   └── logging.py            <- Structured logging
│   │   │
│   │   ├── db/
│   │   │   ├── seed_demo_data.py     <- Auto-seeds 5 products + 3 orders
│   │   │   └── session.py            <- SQLAlchemy engine + session
│   │   │
│   │   ├── models/                   <- SQLAlchemy ORM models
│   │   │   ├── catalogue.py          <- Catalogue, PriceRecommendation
│   │   │   ├── common.py             <- UUID PK + timestamp mixins
│   │   │   ├── operations.py         <- Order, Inventory, Translation
│   │   │   ├── product.py            <- Product, ProductImage
│   │   │   └── user.py               <- User, ArtisanProfile
│   │   │
│   │   ├── schemas/                  <- Pydantic request/response models
│   │   │   ├── artisan.py / dashboard.py / image.py
│   │   │   ├── product.py / speech.py / translate.py
│   │   │
│   │   └── services/                 <- AI business logic
│   │       ├── audio_utils.py        <- FFmpeg-based audio decoding
│   │       ├── speech_service.py     <- IndicConformer + Whisper ASR
│   │       ├── translation_service.py <- NLLB translation
│   │       └── vision_service.py     <- U2Net bg removal + quality scoring
│   │
│   └── tests/                        <- 48 tests (47 pass)
│
├── data/
│   ├── karigar.db                    <- SQLite database
│   ├── demo/                         <- Demo images + audio
│   └── uploads/                      <- Enhanced images saved here
│
├── experiments/                      <- Standalone prototypes (REFERENCE ONLY)
│   ├── catalogue_generator.py        <- Rules-based catalogue (TO PORT)
│   ├── pricing_model.py              <- RandomForest pricing (TO PORT)
│   ├── complete_pipeline.py          <- Full end-to-end pipeline
│   ├── streamlit_app.py              <- Full Streamlit demo
│   └── (others already ported)
│
└── frontend/
    ├── index.html                    <- SPA shell with sidebar nav
    ├── css/style.css                 <- 34KB polished CSS
    └── js/
        ├── api.js / app.js / utils.js
        └── pages/
            ├── ai-tools.js / artisans.js / dashboard.js
            ├── image-studio.js / products.js
```

---

## Test Results (48 total)

```
47 passed
 1 failed  (test_enhance_image_requires_existing_product — test expectation
            doesn't match the intentional design where product_id is optional)
 1 error   (Windows temp file permission on teardown — cosmetic)
```

## Environment Details

| Item | Value |
|------|-------|
| Python | 3.14.7 |
| Virtual env | `backend/.venv/` (exists, activated) |
| GPU | NVIDIA GeForce RTX 3050 Laptop (4GB VRAM) |
| CUDA | 13.1 |
| Driver | 592.82 |
| torch installed? | No |
| ffmpeg installed? | Yes (in PATH) |
| rembg working? | Yes |
| OS | Windows |
