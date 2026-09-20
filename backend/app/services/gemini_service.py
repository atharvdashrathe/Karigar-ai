"""
Gemini LLM Service for Karigar AI.

Provides unified Multimodal AI capabilities:
1. Voice-to-Text Audio Transcription (Indic languages + English)
2. Image Analysis, Feature Extraction & Visual Quality Critique
3. Dynamic Fair-Trade Pricing Model & Margin Breakdown
4. Multilingual Catalogue Generation (EN, HI, MR)
5. Listing Score & Buyer Matching Recommendations

Uses Gemini REST API with httpx for zero-dependency high performance,
with robust graceful fallbacks when offline or when no API key is provided.
"""
from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _clean_json_markdown(text: str) -> str:
    """Strips ```json ... ``` code fences if Gemini wraps JSON responses in markdown."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def is_gemini_available() -> bool:
    settings = get_settings()
    return bool(settings.gemini_api_key and settings.gemini_api_key.strip() and not settings.gemini_api_key.startswith("your_"))


async def call_gemini(
    contents: list[dict[str, Any]],
    system_instruction: str | None = None,
    response_mime_type: str = "application/json",
    temperature: float = 0.2,
) -> dict[str, Any] | None:
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not is_gemini_available():
        return None

    preferred_model = settings.gemini_model or "gemini-1.5-flash"
    candidate_models = [preferred_model]
    for alt in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-pro", "gemini-flash-lite-latest"]:
        if alt not in candidate_models:
            candidate_models.append(alt)

    payload: dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": response_mime_type,
        },
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code != 200:
                    logger.warning("Gemini model %s error (%d): %s", model, resp.status_code, resp.text[:150])
                    continue
                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    continue
                content_parts = candidates[0].get("content", {}).get("parts", [])
                if not content_parts:
                    continue
                text = content_parts[0].get("text", "")
                cleaned = _clean_json_markdown(text)
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    logger.warning("Failed to parse Gemini JSON from %s: %s", model, text[:150])
                    return None
        except Exception as exc:
            logger.warning("Gemini model %s call failed: %s", model, exc)
            continue
    return None


# =========================================================================
# 1. VOICE-TO-TEXT CONVERTER (Multimodal Audio Transcription)
# =========================================================================

@dataclass
class GeminiTranscriptionResult:
    transcript: str
    detected_language: str
    english_translation: str | None
    provider: str


async def transcribe_audio_gemini(
    audio_bytes: bytes,
    mime_type: str = "audio/wav",
    target_language: str | None = None,
) -> GeminiTranscriptionResult | None:
    """Transcribes audio using Gemini Multimodal Audio understanding."""
    if not is_gemini_available():
        return None

    b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
    
    prompt = (
        "You are an expert speech-to-text transcription engine for Indian regional languages and crafts.\n"
        "Accurately transcribe the spoken voice in this audio file.\n"
        f"The speaker is likely speaking an Indian language (e.g. Marathi, Hindi, Gujarati, Tamil, Telugu, Bengali) or English. "
        f"{f'Preferred target language: {target_language}. ' if target_language else ''}"
        "Return a JSON object with:\n"
        "{\n"
        '  "transcript": "Exact verbatim transcription in the original language using native script",\n'
        '  "detected_language": "Language code (e.g., mr, hi, gu, ta, te, bn, en)",\n'
        '  "english_translation": "Fluent English translation of the transcription"\n'
        "}"
    )

    contents = [
        {
            "role": "user",
            "parts": [
                {
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": b64_audio,
                    }
                },
                {"text": prompt},
            ],
        }
    ]

    result = await call_gemini(contents, temperature=0.1)
    if result and "transcript" in result:
        return GeminiTranscriptionResult(
            transcript=result.get("transcript", "").strip(),
            detected_language=result.get("detected_language", target_language or "en"),
            english_translation=result.get("english_translation"),
            provider="gemini-multimodal",
        )
    return None


# =========================================================================
# 2. IMAGE VISION ANALYSIS & CRITIQUE
# =========================================================================

@dataclass
class GeminiVisionAnalysis:
    category: str
    materials: list[str]
    craft_type: str
    colors: list[str]
    quality_score: int
    quality_breakdown: dict[str, int]
    suggestions: list[str]
    tags: list[str]
    provider: str


async def analyze_image_gemini(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> GeminiVisionAnalysis | None:
    """Analyzes artisan product photo for e-commerce quality & craft details."""
    if not is_gemini_available():
        return None

    b64_img = base64.b64encode(image_bytes).decode("utf-8")
    prompt = (
        "You are an expert Indian artisan product curator and e-commerce photographer.\n"
        "Analyze this handmade craft product image and evaluate its presentation quality.\n"
        "Return a JSON object strictly matching:\n"
        "{\n"
        '  "category": "e.g. Traditional Handicrafts, Handloom Textiles, Artisan Jewellery, Art & Paintings, Wooden Crafts, Brass & Metalware, Pottery",\n'
        '  "materials": ["e.g. Bamboo", "Natural dye"],\n'
        '  "craft_type": "e.g. Bamboo weaving, Handloom, Brass casting, Wood carving",\n'
        '  "colors": ["e.g. Natural brown", "Indigo", "Gold"],\n'
        '  "quality_score": 88,\n'
        '  "quality_breakdown": {\n'
        '    "background": 90,\n'
        '    "lighting": 85,\n'
        '    "sharpness": 88,\n'
        '    "framing": 89\n'
        "  },\n"
        '  "suggestions": [\n'
        '    "Short, friendly tips for the artisan to take even better photos (e.g. use natural side lighting, angle)"\n'
        "  ],\n"
        '  "tags": ["handmade", "bamboo", "rustic", "sustainable"]\n'
        "}"
    )

    contents = [
        {
            "role": "user",
            "parts": [
                {
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": b64_img,
                    }
                },
                {"text": prompt},
            ],
        }
    ]

    result = await call_gemini(contents, temperature=0.2)
    if result and "quality_score" in result:
        return GeminiVisionAnalysis(
            category=result.get("category", "Traditional Handicrafts"),
            materials=result.get("materials", ["Natural materials"]),
            craft_type=result.get("craft_type", "Handicraft"),
            colors=result.get("colors", []),
            quality_score=int(result.get("quality_score", 85)),
            quality_breakdown=result.get("quality_breakdown", {"background": 85, "lighting": 85, "sharpness": 85, "framing": 85}),
            suggestions=result.get("suggestions", []),
            tags=result.get("tags", []),
            provider="gemini-vision",
        )
    return None


# =========================================================================
# 3. DYNAMIC PRICING MODEL
# =========================================================================

@dataclass
class GeminiPriceResult:
    suggested_price: float
    minimum_price: float
    maximum_price: float
    estimated_cost: float
    estimated_margin: float
    confidence: float
    explanation: str
    provider: str


async def predict_price_gemini(
    product_name: str,
    category: str,
    materials: list[str],
    description: str = "",
    artisan_location: str = "India",
    hours_to_make: float = 8.0,
) -> GeminiPriceResult | None:
    """Predicts a fair dynamic price for artisan products using Gemini LLM."""
    if not is_gemini_available():
        return None

    prompt = (
        "You are an AI fair-trade pricing consultant for traditional Indian artisans (Karigar AI).\n"
        "Your mission is to prevent artisans from being underpaid while keeping prices competitive in domestic & export craft markets.\n"
        f"Product Name: {product_name}\n"
        f"Category: {category}\n"
        f"Materials: {', '.join(materials)}\n"
        f"Description / Craft Story: {description}\n"
        f"Artisan Location: {artisan_location}\n"
        f"Estimated Time to Craft: {hours_to_make} hours\n\n"
        "Compute fair dynamic pricing in Indian Rupees (INR ₹).\n"
        "Ensure fair living hourly wage for artisan effort + raw material costs + ethical profit margin.\n"
        "Return JSON:\n"
        "{\n"
        '  "suggested_price": 750,\n'
        '  "minimum_price": 650,\n'
        '  "maximum_price": 900,\n'
        '  "estimated_cost": 420,\n'
        '  "estimated_margin": 330,\n'
        '  "confidence": 88,\n'
        '  "explanation": "Clear explanation of raw materials, labor hours at fair wage, and market value for hand-crafted authenticity."\n'
        "}"
    )

    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    result = await call_gemini(contents, temperature=0.2)
    if result and "suggested_price" in result:
        return GeminiPriceResult(
            suggested_price=float(result.get("suggested_price", 699)),
            minimum_price=float(result.get("minimum_price", 600)),
            maximum_price=float(result.get("maximum_price", 850)),
            estimated_cost=float(result.get("estimated_cost", 400)),
            estimated_margin=float(result.get("estimated_margin", 299)),
            confidence=float(result.get("confidence", 85)),
            explanation=str(result.get("explanation", "")),
            provider="gemini-llm",
        )
    return None


# =========================================================================
# 4. MULTILINGUAL CATALOGUE GENERATOR
# =========================================================================

@dataclass
class GeminiCatalogueResult:
    name: str
    category: str
    materials: list[str]
    keywords: list[str]
    description_en: str
    description_hi: str
    description_mr: str
    provider: str


async def generate_catalogue_gemini(
    transcript: str,
    source_language: str = "mr",
    extra_details: str = "",
) -> GeminiCatalogueResult | None:
    """Generates a professional e-commerce catalogue listing in EN, HI, and MR."""
    if not is_gemini_available():
        return None

    prompt = (
        "You are an expert e-commerce copywriter and handicraft cataloguer for Karigar AI.\n"
        f"An artisan spoke this voice description in '{source_language}':\n"
        f'"{transcript}"\n'
        f"{f'Additional context: {extra_details}' if extra_details else ''}\n\n"
        "Transform this into a professional, compelling e-commerce product catalogue listing.\n"
        "Highlight the handcrafted heritage, materials, utility, and authentic story.\n"
        "Return JSON:\n"
        "{\n"
        '  "name": "Catchy, professional product title (e.g. Handcrafted Bamboo Fruit Basket)",\n'
        '  "category": "Standard category (e.g. Traditional Handicrafts, Handloom Textiles, Artisan Jewellery, Art & Paintings, Wooden Crafts)",\n'
        '  "materials": ["Primary material 1", "Natural finish"],\n'
        '  "keywords": ["handmade", "artisan", "traditional", "sustainable"],\n'
        '  "description_en": "Professional 2-3 paragraph English listing highlighting artisan heritage, technique, dimensions/care, and utility.",\n'
        '  "description_hi": "Professional Hindi translation in Devanagari script.",\n'
        '  "description_mr": "Professional Marathi translation in Devanagari script."\n'
        "}"
    )

    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    result = await call_gemini(contents, temperature=0.3)
    if result and "name" in result:
        return GeminiCatalogueResult(
            name=result.get("name", "Handcrafted Artisan Product"),
            category=result.get("category", "Traditional Handicrafts"),
            materials=result.get("materials", ["Handcrafted materials"]),
            keywords=result.get("keywords", ["handmade", "artisan", "traditional"]),
            description_en=result.get("description_en", transcript),
            description_hi=result.get("description_hi", transcript),
            description_mr=result.get("description_mr", transcript),
            provider="gemini-llm",
        )
    return None


# =========================================================================
# 5. VOICE-FIRST "SELL SOMETHING" INTENT EXTRACTOR
# =========================================================================

async def extract_product_from_voice(
    transcript: str,
    language: str = "auto",
) -> dict[str, Any]:
    """
    Extracts structured product information from natural artisan spoken speech.
    Example: "I made five blue sarees. Each costs 1200 rupees. They are handmade from cotton."
    Returns: product_name, category, quantity, price, materials, description, language
    """
    if is_gemini_available():
        prompt = (
            "You are Karigar AI's natural voice extractor for rural Indian artisans.\n"
            "The artisan spoke about a product they made. Extract key details into structured JSON.\n"
            "Generate an authentic, attractive, customer-ready e-commerce product description in English (or Hindi if requested) "
            "that highlights artisan handcrafting techniques, natural materials, durability, and cultural heritage.\n\n"
            f'Spoken Voice Transcript: "{transcript}"\n'
            f"Language hint: {language}\n\n"
            "Return valid JSON:\n"
            "{\n"
            '  "product_name": "E.g. Royal Blue Handcrafted Cotton Saree",\n'
            '  "category": "Handloom Textiles | Traditional Handicrafts | Pottery | Artisan Jewellery | Wooden Crafts | Bamboo Weaving",\n'
            '  "quantity": 5,\n'
            '  "price": 1200.0,\n'
            '  "materials": ["Pure Cotton", "Natural Indigo Dye"],\n'
            '  "description": "Exquisite handloom cotton saree woven with traditional heritage motifs. Breathable, comfortable, and handcrafted with care by master artisans for timeless elegance.",\n'
            '  "language": "en"\n'
            "}"
        )
        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        res = await call_gemini(contents, temperature=0.2)
        if res and "product_name" in res:
            desc = res.get("description")
            if not desc or len(desc.strip()) < 10:
                desc = f"Authentic handcrafted {res.get('product_name', 'artisan piece')} made with exceptional craftsmanship and traditional heritage techniques. Handcrafted from premium materials."
            return {
                "product_name": res.get("product_name", "Handcrafted Artisan Product"),
                "category": res.get("category", "Traditional Handicrafts"),
                "quantity": int(res.get("quantity") or 1),
                "price": float(res.get("price") or 699),
                "materials": res.get("materials") if isinstance(res.get("materials"), list) and res.get("materials") else ["Handcrafted materials"],
                "description": desc,
                "language": res.get("language") or language,
                "confidence": 0.94,
            }

    # Offline / Heuristic multilingual regex fallback
    word_to_num = {
        "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाच": 5, "पाँच": 5,
        "सहा": 6, "छह": 6, "सात": 7, "आठ": 8, "नऊ": 9, "नौ": 9, "दहा": 10, "दस": 10,
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
        "eight": 8, "nine": 9, "ten": 10, "dozen": 12, "pair": 2
    }

    qty = 1
    t_lower = transcript.lower()

    # Check digit quantity
    qty_match = re.search(r"(\d+)\s*(pieces|items|sarees|baskets|pots|bowls|units|nag|piece|साड्या|साड़ियां|नग|भांडी)?", transcript, re.I)
    if qty_match:
        try:
            qty = int(qty_match.group(1))
        except Exception:
            pass
    else:
        # Check word quantity
        for w, n in word_to_num.items():
            if re.search(rf"\b{w}\b", t_lower):
                qty = n
                break

    # Price detection
    price = 699.0
    price_match = re.search(r"(?:₹|rs\.?|rupees?|costs?|price|किंमत|दाम|मूल्य|रुपये|रुपए)\s*[:=]?\s*(\d[\d,]*)", transcript, re.I)
    if not price_match:
        price_match = re.search(r"(\d[\d,]*)\s*(?:₹|rs\.?|rupees?|रुपये|रुपए)", transcript, re.I)
    if price_match:
        try:
            price = float(price_match.group(1).replace(",", ""))
        except Exception:
            pass

    cat = "Traditional Handicrafts"
    materials = ["Handcrafted Natural Materials"]
    item_title_core = "Artisan Craft Piece"

    if any(k in t_lower for k in ["saree", "साडी", "साड़ी", "textile", "cloth", "dupatta", "दुपट्टा", "cotton", "सुती", "सूती", "सूत", "विणलेली"]):
        cat = "Handloom Textiles"
        materials = ["Pure Handloom Cotton", "Natural Dyes"]
        item_title_core = "Handloom Woven Saree"
    elif any(k in t_lower for k in ["pot", "clay", "terracotta", "माती", "माटी", "भांडे", "कुंभार", "घडा", "मटका"]):
        cat = "Pottery"
        materials = ["Terracotta Natural Clay", "Organic Glaze"]
        item_title_core = "Terracotta Earthenware Craft"
    elif any(k in t_lower for k in ["jewel", "necklace", "brass", "diya", "दागिने", "हार", "पितळ", "पीतल", "झुमके", "दीया"]):
        cat = "Artisan Jewellery"
        materials = ["Hand-cast Brass", "Traditional Embellishments"]
        item_title_core = "Artisan Handcrafted Jewellery"
    elif any(k in t_lower for k in ["wood", "bowl", "carv", "लाकूड", "लाकडी", "लकड़ी", "कोरलेले"]):
        cat = "Wooden Crafts"
        materials = ["Seasoned Sheesham Wood", "Natural Beeswax Finish"]
        item_title_core = "Hand-Carved Wooden Creation"
    elif any(k in t_lower for k in ["bamboo", "basket", "बांबू", "टोपली", "बांस", "टोकरी"]):
        cat = "Bamboo Weaving"
        materials = ["Locally Sourced Organic Bamboo", "Plant Fibers"]
        item_title_core = "Hand-Woven Bamboo Craft"

    # Extract color hint if present
    color_hint = ""
    for c_en, c_hi, c_mr in [("Blue", "नीली", "निळी"), ("Red", "लाल", "लाल"), ("Green", "हरी", "हिरवी"), ("Yellow", "पीली", "पिवळी"), ("Black", "काली", "काळी"), ("White", "सफेद", "पांढरी")]:
        if c_en.lower() in t_lower or c_hi in transcript or c_mr in transcript:
            color_hint = f"{c_en} "
            break

    product_name = f"{color_hint}{item_title_core}".strip()

    # Generate an engaging authentic product description
    materials_str = ", ".join(materials)
    description = (
        f"Exquisite handcrafted {product_name.lower()} crafted with care using authentic {materials_str}. "
        f"Each piece is individually shaped and finished by traditional master artisans, reflecting centuries "
        f"of generational craft heritage. Perfect for home styling, gifting, and conscious sustainable living."
    )

    return {
        "product_name": product_name,
        "category": cat,
        "quantity": qty,
        "price": price,
        "materials": materials,
        "description": description,
        "language": language if language != "auto" else "en",
        "confidence": 0.88,
    }


# =========================================================================
# 6. AI SAATHI ARTISAN COMPANION CHAT
# =========================================================================

async def chat_ai_saathi(
    message: str,
    context: dict[str, Any] | None = None,
    language: str = "en",
) -> dict[str, Any]:
    """
    Artisan companion AI chatbot.
    Answers: pricing strategies, safe packaging, WhatsApp/Instagram marketing,
    regional language translations, sales & earnings questions, scam safety warnings,
    and mobile photography lighting tips.
    """
    ctx = context or {}
    artisan_name = ctx.get("artisan_name", "Artisan")
    craft = ctx.get("craft_type", "Handicrafts")
    sales_total = ctx.get("total_sales", 12450)
    products_count = ctx.get("total_products", 6)
    orders_count = ctx.get("total_orders", 12)

    if is_gemini_available():
        system_instruction = (
            "You are 'AI Saathi' (AI साथी), a warm, supportive, and highly knowledgeable business mentor "
            "for traditional Indian rural artisans on Karigar AI.\n"
            "Your goals:\n"
            "1. Give practical, simple advice on pricing, safe eco-friendly packaging, craft photography, and buyer negotiations.\n"
            "2. Help write social media captions (Instagram, WhatsApp) with relevant emojis and hashtags.\n"
            "3. Help artisans understand their earnings and sales clearly.\n"
            "4. Provide Scam Protection warnings: remind them NEVER to share OTP/UPI PIN. Receiving money never requires typing a PIN.\n"
            "5. Answer in the language the artisan speaks or the requested language (supports English, Hindi, Marathi, Bengali, Tamil, Telugu, Kannada, Gujarati).\n"
            "Keep answers concise, actionable, and encouraging."
        )

        user_prompt = (
            f"Artisan: {artisan_name} | Craft: {craft} | Products: {products_count} | Orders: {orders_count} | Total Sales: ₹{sales_total}\n"
            f"Question from Artisan in {language}: '{message}'\n\n"
            "Return JSON:\n"
            "{\n"
            '  "reply": "Warm, conversational and practical advice in requested language (use bullet points if explaining steps)",\n'
            '  "suggested_actions": ["Short follow-up question 1", "Short follow-up question 2"],\n'
            '  "category": "pricing | marketing | packaging | photography | security | earnings | general"\n'
            "}"
        )

        contents = [{"role": "user", "parts": [{"text": user_prompt}]}]
        res = await call_gemini(contents, system_instruction=system_instruction, temperature=0.4)
        if res and "reply" in res:
            return {
                "reply": res.get("reply"),
                "suggested_actions": res.get("suggested_actions", ["What price should I set?", "How to write a WhatsApp message?"]),
                "category": res.get("category", "general"),
            }

    # Heuristic fallback
    m_low = message.lower()
    if "price" in m_low or "किंमत" in m_low or "दाम" in m_low or "मूल्य" in m_low:
        reply = (
            "💰 **Smart Pricing Rule for Your Craft:**\n"
            "1. Calculate Raw Materials + (Hours spent × ₹80-₹120 fair hourly wage).\n"
            "2. Add ₹50-₹80 for protective packaging and shipping.\n"
            "3. Keep a 35-45% profit margin for your handmade artistry!\n"
            "Check our 'Smart Pricing' tool in the Sell menu for exact automatic breakdown."
        )
        actions = ["Calculate price for my new product", "How much should I charge for shipping?"]
        cat = "pricing"
    elif "scam" in m_low or "otp" in m_low or "pin" in m_low or "suspicious" in m_low or "धोखा" in m_low or "पैसे" in m_low:
        reply = (
            "🛡️ **Important Safety Warning for Artisans:**\n"
            "• **NEVER** enter your UPI PIN to receive money. Receiving payment is 100% automatic.\n"
            "• **NEVER** share OTP, banking passwords, or scan unknown QR codes sent by buyers.\n"
            "• If a buyer says 'I have sent payment, accept it by typing your PIN', that is a scam."
        )
        actions = ["Check a suspicious buyer message", "How to receive payment safely?"]
        cat = "security"
    elif "earn" in m_low or "sale" in m_low or "order" in m_low or "कमाई" in m_low or "विक्री" in m_low:
        reply = (
            f"📊 **Your Current Business Summary, {artisan_name}:**\n"
            f"• Total Orders: **{orders_count}** orders fulfilled\n"
            f"• Total Sales: **₹{sales_total:,}**\n"
            f"• Active Catalog: **{products_count}** handmade items\n"
            "Visit the Earnings page for complete monthly breakdown and payout status."
        )
        actions = ["How can I increase my monthly sales?", "Add another product to store"]
        cat = "earnings"
    elif "package" in m_low or "pack" in m_low or "packaging" in m_low or "डब्बा" in m_low:
        reply = (
            "📦 **Eco-Friendly & Safe Packaging Tips:**\n"
            "1. Wrap delicate craft items in recycled honeycomb paper or cotton pouch.\n"
            "2. Add a handwritten thank-you note with your artisan story card.\n"
            "3. Seal in corrugated box with paper tape for zero-damage transit."
        )
        actions = ["Where to source craft packaging?", "Write a thank you note template"]
        cat = "packaging"
    elif "photo" in m_low or "camera" in m_low or "lighting" in m_low or "फोटो" in m_low:
        reply = (
            "📸 **Pro Photo Tips for Crafts:**\n"
            "1. Place your craft near an open window during morning or late afternoon natural daylight.\n"
            "2. Keep a plain, uncluttered background (white sheet, clean wooden table, or earthen wall).\n"
            "3. Take 1 close-up showing fine texture and 1 showing the complete product."
        )
        actions = ["Enhance my product photo with AI", "What angle is best for sarees?"]
        cat = "photography"
    else:
        reply = (
            f"Namaste {artisan_name}! I am your AI Saathi. I can help you price your handmade items, "
            "write WhatsApp/Instagram promotions, inspect suspicious buyer messages, and guide you on packaging and photography. What would you like to do today?"
        )
        actions = ["Help me price a product", "Write WhatsApp message", "Scam safety check", "Packaging advice"]
        cat = "general"

    return {"reply": reply, "suggested_actions": actions, "category": cat}


# =========================================================================
# 7. AI MARKETING KIT GENERATOR
# =========================================================================

async def generate_marketing_kit(
    product_name: str,
    category: str,
    materials: list[str],
    description: str = "",
    price: float | None = None,
    language: str = "en",
) -> dict[str, Any]:
    """Generates Instagram Caption, WhatsApp broadcast message, 30s Reel Script and Short Ad copy."""
    m_str = ", ".join(materials) if materials else "authentic handcrafted materials"
    price_str = f"₹{price:.0f}" if price else "fair-trade price"

    if is_gemini_available():
        prompt = (
            "You are a top-tier digital marketing copywriter for authentic rural Indian artisans.\n"
            f"Product: {product_name}\n"
            f"Category: {category}\n"
            f"Materials: {m_str}\n"
            f"Price: {price_str}\n"
            f"Story/Description: {description}\n"
            f"Language: {language}\n\n"
            "Generate high-converting social media promotional content:\n"
            "Return JSON:\n"
            "{\n"
            '  "instagram_caption": "Engaging Instagram post with emojis, craft story, price and call-to-action to DM/order.",\n'
            '  "hashtags": ["#HandmadeInIndia", "#VocalForLocal", "#ArtisanCraft", "#SustainableLiving", "#KarigarAI"],\n'
            '  "whatsapp_message": "Friendly WhatsApp broadcast message ready to send to loyal customers and groups.",\n'
            '  "video_script_30s": "30-second Reel/Shorts video script with [Visual] and [Voiceover] cues.",\n'
            '  "short_ad": "Short punchy 2-sentence ad hook for banners and marketplaces."\n'
            "}"
        )
        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        res = await call_gemini(contents, temperature=0.4)
        if res and "instagram_caption" in res:
            return res

    # Fallback
    ig = (
        f"✨ Authenticity in every stitch & weave! ✨\n\n"
        f"Meet our {product_name}, hand-crafted using traditional {m_str}. "
        f"Every piece directly empowers rural artisan families with sustainable fair wages. 🌱\n\n"
        f"🏷️ Price: {price_str}\n"
        f"📦 Doorstep Delivery Available across India\n"
        f"💬 Send us a message or tap link in bio to order yours today!"
    )
    tags = ["#HandmadeInIndia", "#VocalForLocal", "#RuralArtisans", "#EthicalCraft", "#KarigarAI", "#SustainableLuxury"]
    wa = (
        f"🌸 *New Craft Launch by Local Artisans!* 🌸\n\n"
        f"We have just finished crafting a fresh batch of *{product_name}* ({m_str}).\n"
        f"💰 Fair Price: *{price_str}*\n"
        f"✨ 100% Authentic Handmade\n"
        f"🚚 Secure packaging & delivery to your doorstep.\n\n"
        f"Reply to this message if you would like to book yours!"
    )
    script = (
        "[0:00 - 0:05] Close-up of artisan hands carefully crafting the piece.\n"
        "Voiceover: 'Real luxury isn't made in a factory. It's born in the hands of Indian master artisans.'\n\n"
        f"[0:05 - 0:18] Reveal the completed {product_name} in warm daylight.\n"
        f"Voiceover: 'This is authentic {product_name}, crafted from {m_str}. Clean, sustainable, and timeless.'\n\n"
        "[0:18 - 0:30] Packaged with handwritten artisan card.\n"
        f"Voiceover: 'Support our craft directly. Order yours on Karigar AI today for {price_str}.'"
    )
    ad = f"Own authentic Indian craftsmanship with {product_name}. Handmade with {m_str} at {price_str}."

    return {
        "instagram_caption": ig,
        "hashtags": tags,
        "whatsapp_message": wa,
        "video_script_30s": script,
        "short_ad": ad,
    }


# =========================================================================
# 8. SCAM & PHISHING RISK EVALUATOR
# =========================================================================

async def evaluate_scam_risk(message_text: str) -> dict[str, Any]:
    """Evaluates whether a buyer message or payment request contains scam red flags."""
    m_low = message_text.lower()
    flags = []
    risk = 0

    if "otp" in m_low:
        flags.append("Mentions OTP (One Time Password)")
        risk += 45
    if "pin" in m_low or "upi pin" in m_low:
        flags.append("Asks for UPI PIN or entering PIN to receive funds")
        risk += 50
    if "qr code" in m_low or "scan qr" in m_low:
        flags.append("Asks to scan QR code to receive payment")
        risk += 35
    if "advance fee" in m_low or "processing fee" in m_low or "lottery" in m_low:
        flags.append("Requests upfront deposit or advance fee")
        risk += 40
    if "army" in m_low or "military" in m_low or "officer" in m_low or "urgent transfer" in m_low:
        flags.append("Impersonates official or claims urgent immediate transfer")
        risk += 25

    is_suspicious = risk >= 35
    if is_suspicious:
        advice = (
            "⚠️ This message contains critical warning signs. "
            "NEVER enter your UPI PIN, scan QR codes to receive money, or share OTPs. "
            "Legitimate buyers never ask artisans to pay or enter PINs to receive money."
        )
    else:
        advice = "✅ No obvious scam patterns detected. Always verify payment has credited in your bank app directly."

    return {
        "is_suspicious": is_suspicious,
        "risk_score": min(risk, 100),
        "warning_flags": flags,
        "advice": advice,
    }

