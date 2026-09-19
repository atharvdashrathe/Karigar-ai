# Karigar AI

Karigar AI is an AI-assisted business and marketplace platform that helps rural Indian artisans turn their craft knowledge into discoverable, fairly priced digital product listings.

## Overview

Many artisans have valuable products and craft traditions but limited access to digital tools, online marketplaces, professional photography, and business support. Karigar AI brings those needs into one workflow: an artisan can manage a profile and products, use voice and AI assistance to prepare a listing, improve product images, receive pricing guidance, and connect with prospective buyers.

The repository contains a FastAPI backend, an active React/TanStack frontend, a legacy vanilla frontend, and standalone AI experiments that document earlier prototypes.

## Problem Statement

Rural artisans commonly face several connected barriers:

- Limited digital access and confidence with complex web tools.
- Language barriers when product information must be entered in English.
- Difficulty writing consistent product listings and descriptions.
- Limited access to product photography and image editing.
- Uncertainty about material costs, labour value, margins, and fair pricing.
- Limited marketing support for social and messaging channels.
- Difficulty reaching customers beyond a local network.
- Fragmented access to online marketplace and buyer opportunities.

## Solution

Karigar AI combines a business-management backend, an artisan-focused web experience, AI-assisted product workflows, and marketplace-oriented features. It supports voice and multilingual inputs, product image enhancement, catalogue generation, pricing guidance, marketing content, buyer enquiries, artisan stories, and administrative verification workflows.

## Key Features

### Artisan Features

- Artisan registration, sign-in demo flow, profile, location, craft, and business details.
- Product creation, editing, deletion, inventory updates, drafts, and publishing states.
- Voice-first product creation flow with confirmation before a listing is generated.
- Dashboard views for products, enquiries, orders, and earnings.
- Offline-oriented draft and inventory support in the frontend.

### AI Features

- Product image enhancement with background removal, quality scoring, lighting/sharpness/framing checks, and suggestions.
- Speech transcription using IndicConformer with Whisper fallback when the required models are available.
- Translation using NLLB-200 with an explicit degraded response when the model is unavailable.
- Multilingual catalogue generation using Gemini when configured, with a rules-based fallback.
- Fair-trade price prediction using Gemini when configured, with an econometric fallback.
- Listing completeness scoring and buyer-opportunity matching endpoints.
- AI marketing kit generation for Instagram, WhatsApp, short advertisements, and video scripts.
- Saathi assistant endpoints for craft-business questions, voice-product extraction, and scam-risk checks.

### Marketplace Features

- Marketplace browse and product-detail routes.
- Product stories, artisan profiles, authenticity-style badges, and appreciation actions.
- Direct buyer enquiries connected to products.
- Artisan collectives and craft-cluster views.
- Buyer opportunity responses from the backend matching endpoint.

### Customer Features

- Browse products and open individual product pages.
- View product and maker information, including stories where available.
- Send an enquiry to an artisan.
- Thank or appreciate an artisan through the frontend experience.

### Admin/Management Features

- Admin metrics dashboard.
- Artisan verification endpoint and product verification-badge endpoint.
- Dashboard, orders, earnings, inventory, and enquiry management APIs.

Some frontend screens use demo data or local session state when a backend record is not available. They should be treated as prototype UI flows rather than evidence of a production marketplace, payment system, or authentication service.

## AI Capabilities

The backend currently includes these AI and AI-assisted paths:

| Capability | Current implementation | Notes |
| --- | --- | --- |
| Image enhancement | `rembg`/U2NetP, Pillow, NumPy, ONNX Runtime | Background removal can fall back to enhancement without removal; quality checks are explainable image metrics. |
| Speech-to-text | IndicConformer primary, Whisper fallback | Requires the optional speech dependencies and model downloads. |
| Translation | NLLB-200 distilled 600M | Returns the original text with `degraded: true` when the model is unavailable. |
| Catalogue generation | Gemini REST integration plus rules-based fallback | Produces structured name, category, materials, keywords, and English/Hindi/Marathi descriptions. |
| Pricing | Gemini fair-trade pricing plus category benchmarks | Also exposes a detailed unit-economics calculator. |
| Listing score | Backend scoring endpoint | Prototype completeness score with recommendations. |
| Marketing and assistance | Gemini-backed marketing and Saathi endpoints | Requires a configured Gemini API key for live model responses. |

The standalone scripts in `experiments/` include earlier catalogue, pricing, speech, translation, image, and Streamlit prototypes. They are reference implementations and are not imported into the backend runtime.

## Multilingual / Voice Support

The backend speech service validates these language codes for IndicConformer/Whisper: Assamese (`as`), Bengali (`bn`), Bodo (`brx`), Dogri (`doi`), English (`en`), Gujarati (`gu`), Hindi (`hi`), Kannada (`kn`), Konkani (`kok`), Kashmiri (`ks`), Maithili (`mai`), Malayalam (`ml`), Manipuri (`mni`), Marathi (`mr`), Nepali (`ne`), Odia (`or`), Punjabi (`pa`), Sanskrit (`sa`), Santali (`sat`), Sindhi (`sd`), Tamil (`ta`), Telugu (`te`), and Urdu (`ur`).

The NLLB translation service currently maps 16 supported codes: Assamese, Bengali, English, Gujarati, Hindi, Kannada, Malayalam, Marathi, Nepali, Odia, Punjabi, Sanskrit, Sindhi, Tamil, Telugu, and Urdu. Catalogue output includes English, Hindi, and Marathi descriptions. The frontend also contains language and voice-guide UI for several Indian languages.

Speech and translation model inference is not guaranteed immediately after the base install. The model weights are downloaded lazily, and the backend is designed to report unavailable/degraded results rather than fabricate output.

## Tech Stack

### Frontend

- React 19 and TypeScript.
- TanStack Start, TanStack Router, and TanStack Query.
- Vite 8, Tailwind CSS 4, Radix UI, Framer Motion, Recharts, Lucide React, and React Hook Form.

### Backend

- Python FastAPI with Uvicorn.
- Pydantic and pydantic-settings for schemas and configuration.
- SQLAlchemy ORM.
- `python-multipart` for file uploads and `python-dotenv` for environment loading.

### Database

- SQLite by default, with SQLAlchemy models and automatic table initialization.
- Demo data is seeded on startup when `DEMO_MODE=true`.

### AI/ML

- Gemini REST API for optional LLM, vision, catalogue, pricing, marketing, and assistant features.
- `rembg` with U2NetP and ONNX Runtime for image processing.
- IndicConformer and OpenAI Whisper for speech-to-text.
- NLLB-200 and SentencePiece for translation.
- Pillow and NumPy for image and audio-related processing.

### APIs/Libraries

- REST-style FastAPI endpoints with automatic OpenAPI documentation.
- Hugging Face Transformers, HTTPX, and ffmpeg-backed audio decoding.

### Development Tools

- Pytest and HTTPX for backend tests.
- npm scripts, ESLint, Prettier, TypeScript, and Vite for the frontend.

## Project Structure

```text
karigar-ai/
├── backend/                 # FastAPI application, services, models, schemas, and tests
├── frontend/                # Active React/TanStack Start frontend
├── frontend_old/            # Earlier vanilla HTML/CSS/JavaScript dashboard
├── data/                    # Demo data and local runtime upload/database locations
├── experiments/             # Standalone AI and Streamlit prototypes
├── .gitignore               # Ignores secrets, local databases, uploads, models, and build output
├── PROJECT_ANALYSIS.md      # Repository inspection and implementation status notes
└── README.md                # Project documentation
```

Important backend areas include `backend/app/api/routes/` for HTTP routes, `backend/app/services/` for business and AI logic, `backend/app/models/` for SQLAlchemy models, `backend/app/schemas/` for API contracts, and `backend/tests/` for the test suite.

## Prerequisites

- Python. The repository does not pin a Python version; `PROJECT_ANALYSIS.md` records development on Python 3.14.7. Use a Python version supported by the installed PyTorch/Whisper wheels when enabling speech features.
- `pip` and a virtual-environment module.
- Node.js and npm for the active frontend. The repository does not pin Node.js or npm versions.
- ffmpeg for backend audio decoding and speech workflows.
- Internet access for Gemini requests and first-time Hugging Face/OpenAI model downloads.
- Optional: a Gemini API key for live Gemini-backed functionality.

## Installation

### Backend Setup

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

On macOS/Linux, use `python3 -m venv .venv`, `source .venv/bin/activate`, and `cp .env.example .env` instead.

Speech and translation dependencies are intentionally separate because they are large:

```bash
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r requirements-speech.txt
```

Use a compatible GPU/PyTorch installation instead if your environment requires one.

### Frontend Setup

In a second terminal, from the repository root:

```bash
cd frontend
npm install
```

The frontend uses `VITE_API_BASE_URL` when set and otherwise defaults to `http://localhost:8000`.

## Environment Variables

Create `backend/.env` from `backend/.env.example`. Keep real credentials out of source control.

```dotenv
APP_NAME=Karigar AI
ENVIRONMENT=development
DEMO_MODE=true
LOG_LEVEL=INFO
DATABASE_URL=sqlite:///../data/karigar.db
MAX_UPLOAD_MB=15
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
ASR_PRIMARY_MODEL=ai4bharat/indic-conformer-600m-multilingual
ARTISAN_ASR_MODEL=small
TRANSLATION_MODEL=facebook/nllb-200-distilled-600M
VISION_BG_REMOVAL_MODEL=u2netp
CORS_ALLOW_ORIGINS=*
```

Only use your own credentials. The real `.env`, local databases, uploads, audio, and downloaded model files are ignored by `.gitignore`.

## Running the Project

Start the backend in one terminal:

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

The backend API is available at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs` and a health check at `http://localhost:8000/health`.

Start the active frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Use the local URL printed by Vite. The active frontend is developed and run as a separate TanStack Start application; `frontend_old/` is the earlier vanilla dashboard and is retained as a reference.

## API / Backend

The main API areas include:

- Artisan profiles and products, including CRUD and inventory updates.
- Dashboard summaries, orders, and earnings.
- Image enhancement and uploaded media serving.
- Speech transcription and text translation.
- Catalogue generation, pricing prediction/calculation, and listing scores.
- Buyer matching, enquiries, marketing generation, and Saathi assistance.
- Artisan stories, appreciations, collectives, and administrative verification/metrics.

FastAPI exposes the complete route contract through `/docs` when the backend is running.

## Application Workflow

The supported high-level workflow is:

```text
Artisan profile
    -> creates or edits a product
    -> adds a photo and voice note or text details
    -> AI assists with image enhancement, transcription, catalogue, translation, and pricing
    -> artisan reviews the generated information
    -> saves or publishes the product listing
    -> customer discovers the product in the marketplace
    -> customer sends an enquiry or appreciation
```

The repository does not currently provide a complete payment checkout or production order-fulfilment flow. Orders and earnings are represented in backend models and dashboard APIs.

## Testing

Run the backend test suite from `backend/`:

```bash
pytest tests/ -v
```

The tests cover health checks, artisan and product APIs, dashboard data, enquiries, marketplace publishing, image enhancement, audio decoding, speech and translation contracts/fallbacks, catalogue and pricing services, AI endpoint behavior, and vision services. Speech/translation tests distinguish model-independent behavior from paths that require downloaded model weights. Test results depend on the local environment; no claim that every test currently passes is made here.

## Screenshots / Demo

Screenshots are not currently stored in the repository. Add future images under `docs/screenshots/` and link them here, for example:

```text
TODO: Add dashboard, product creation, image studio, and marketplace screenshots under docs/screenshots/.
```

## Current Status

### Implemented

- FastAPI backend with SQLite persistence, demo seeding, API documentation, artisan/product CRUD, dashboard data, enquiries, and administrative routes.
- Image enhancement with U2NetP/rembg fallback behavior and quality scoring.
- Catalogue generation and pricing endpoints with Gemini integrations and local fallback logic.
- Listing scoring, buyer matching, marketing, Saathi, stories, appreciations, collectives, and verification API surfaces.
- Active React/TanStack frontend routes for onboarding, dashboard, products, marketplace, enquiries, earnings, marketing, profile, collectives, and admin views.
- Legacy vanilla frontend and standalone experiment applications retained in the repository.

### Partially Implemented or Environment-Dependent

- Real speech transcription requires `torch`, `transformers`, `openai-whisper`, model downloads, and a compatible runtime.
- Real NLLB translation requires the speech requirements and model downloads; otherwise the API deliberately returns the source text with a degraded flag.
- Gemini-backed responses require a user-provided API key and network access; local fallback behavior exists for selected services.
- Several frontend screens use mock data or local state as resilient demo behavior, so not every screen represents a persisted end-to-end marketplace transaction.
- Authentication is a demo/session flow rather than production identity, OTP, or authorization infrastructure.

### Planned / Future

- Production authentication and role-based authorization.
- Payment, shipping, order fulfilment, and notification integrations.
- Persistent buyer accounts and production-grade buyer matching.
- Cloud object storage, deployment configuration, monitoring, and larger-scale model evaluation.

## Future Improvements

Planned improvements should focus on validating AI outputs with artisans, expanding evaluation data beyond prototype heuristics, improving offline synchronization, adding production authentication and marketplace operations, and measuring performance on supported Indian languages and real product images.

## Security Notes

- Keep API keys in `backend/.env`; never place credentials in committed source or README files.
- Do not commit `.env` files, local SQLite databases, user uploads, demo audio, or downloaded model binaries.
- Configure your own Gemini and model credentials where required.
- Review CORS, authentication, upload validation, storage, and authorization settings before any production deployment. The default development configuration is not a production security configuration.

## Contributing

1. Fork or clone the repository.
2. Create a focused branch for your change.
3. Make the change and add or update relevant tests.
4. Run the backend tests and frontend lint/build checks as applicable.
5. Commit the changes with a clear message.
6. Push the branch to your fork.
7. Open a pull request describing the change and verification performed.

## Author

**Atharv Dashrathe**

- GitHub: <https://github.com/atharvdashrathe>
- Project: <https://github.com/atharvdashrathe/Karigar-ai>

## License

License: Not specified yet.