# Karigar AI — Backend (Phases 1–3)

Phase 1 (skeleton), Phase 2 (AI Image Studio), and Phase 3 (speech + translation)
are done. Remaining endpoints (`/api/catalogue/generate`, `/api/pricing/predict`,
`/api/listing/score`, `/api/buyers/match`) exist as routes but honestly return
`501 Not Implemented` — built out in Phases 4–6.

## ⚠️ Phase 3 environment note — read this before judging it "broken"

`/api/speech/transcribe` and `/api/translate` are fully implemented (real
IndicConformer/Whisper ASR logic, real NLLB translation logic, ported from
`experiments/indic_conformer.py` and `experiments/translator.py`), but the
**model weights were never downloaded in the sandbox this was built in** —
that environment's network policy blocks `huggingface.co` and
`openaipublic.azureedge.net` outright (confirmed via direct request, both
return HTTP 403), and there wasn't enough disk headroom for `torch` either.

This means:
- Everything not dependent on those hosts — audio decoding (ffmpeg, tested
  against all 3 real sample files including a mislabeled M4A), language
  validation, the primary/fallback routing logic (tested with mocked models),
  and the graceful-degradation behavior — is real and verified.
- The actual transcription/translation *output* could only be verified via
  the honest-failure path (503 / `degraded: true`), not the success path.

**To verify the real models on a normal machine:**
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements-speech.txt
```
Then re-run `pytest tests/test_speech_service.py tests/test_translation_service.py
tests/test_speech_endpoint.py tests/test_translate_endpoint.py -v` — the tests
marked as testing "real" behavior should start returning actual transcripts/
translations instead of the honest-unavailable responses. If they don't,
that's a real bug to come back and fix, not a sandbox artifact.

## What's working right now

- `GET /health`
- `POST/GET /api/artisans`, `GET /api/artisans/{id}`
- `POST/GET/PUT/DELETE /api/products[/{id}]`
- `GET /api/dashboard`, `GET /api/orders`, `GET /api/earnings`
- `POST /api/image/enhance` — real U2Net background removal + quality scoring
  (Phase 2, fully verified with real inference in-sandbox).
- `POST /api/speech/transcribe` — IndicConformer primary / Whisper fallback,
  real ffmpeg-based audio decoding (handles wav/m4a/mp3/ogg — verified against
  actual sample files), honest 503 + text-input-fallback message when no ASR
  backend is available.
- `POST /api/translate` — NLLB-based translation with graceful degradation
  (returns original text + `degraded: true` rather than crashing or faking a
  translation when the model can't load).
- Auto-seeded demo data on startup when `DEMO_MODE=true`.
- Full test suite (48 tests) — see the environment note above for what Phase 3's
  tests do and don't prove in this sandbox.

### Try image enhancement yourself

```bash
curl -X POST http://localhost:8000/api/image/enhance \
  -F "product_id=<a real product id>" \
  -F "file=@../data/demo/Threeidiots.jpg;type=image/jpeg"
```

### Try speech transcription yourself (after installing requirements-speech.txt)

```bash
curl -X POST http://localhost:8000/api/speech/transcribe \
  -F "language=mr" \
  -F "file=@../data/demo/audio/product_loud.wav;type=audio/wav"
```

### Try translation yourself

```bash
curl -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"यह एक हस्तनिर्मित उत्पाद है।","source_lang":"hi","target_lang":"en"}'
```

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Then visit `http://localhost:8000/docs` for interactive API docs, or
`http://localhost:8000/api/dashboard` to see the auto-seeded demo data.

## Seed demo data manually (optional)

Demo data seeds automatically on startup when `DEMO_MODE=true` (the default).
To (re-)seed without starting the server:

```bash
python3 -m app.db.seed_demo_data
```

Safe to run repeatedly — it checks for the existing demo artisan phone number
and skips seeding if already present.

## Tests

```bash
pytest tests/ -v
```

Tests run against an isolated temp SQLite file (see `tests/conftest.py`), never
against your real `data/karigar.db`.

## Next phases

See the build prompt for the full plan. Immediate next step (Phase 4): port
`experiments/catalogue_generator.py` (rules-based, kept as an offline
fallback) and add an LLM-backed generator as the primary path, wiring up
`POST /api/catalogue/generate` for real. This is also where the transcript
returned by `/api/speech/transcribe` gets turned into a structured product
listing.
