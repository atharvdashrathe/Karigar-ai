"""
Catalogue Service (Section 2/4 of the spec).

Transforms raw artisan descriptions or voice transcripts into structured,
multilingual e-commerce listings with SEO keywords and descriptions in English, Hindi, and Marathi.
Uses Gemini LLM when online and available, with rule-based regex fallback.
"""
from __future__ import annotations

import re
import time
from dataclasses import dataclass

from app.core.logging import get_logger
from app.services import gemini_service

logger = get_logger(__name__)


@dataclass
class CatalogueResult:
    name: str
    category: str
    materials: list[str]
    keywords: list[str]
    description_en: str
    description_hi: str
    description_mr: str
    provider: str
    duration_ms: int


def _rule_based_catalogue(transcript: str, extra_details: str = "") -> tuple[str, str, list[str], list[str], str, str, str]:
    lower = f"{transcript} {extra_details}".lower()

    if any(w in lower for w in ["बांबू", "bamboo", "टोपली", "basket"]):
        name = "Handcrafted Bamboo Basket"
        category = "Traditional Handicrafts"
        materials = ["Bamboo", "Natural finish"]
        keywords = ["handmade", "bamboo", "traditional craft", "home décor", "eco-friendly"]
        desc_en = "A meticulously hand-woven bamboo basket crafted by traditional artisans. Lightweight, sturdy, and eco-friendly — ideal for fruit storage, gifting, and elegant home décor."
        desc_hi = "पारंपरिक कारीगरों द्वारा हस्तनिर्मित सुंदर बाँस की टोकरी। हल्की, मजबूत और पर्यावरण के अनुकूल — फल रखने और घर की सजावट के लिए आदर्श।"
        desc_mr = "पारंपरिक कारागिरांनी हाताने विणलेली सुबक बांबूची टोपली. हलकी, टिकाऊ आणि पर्यावरणपूरक — फळे ठेवण्यासाठी आणि घराच्या सजावटीसाठी उत्तम."
    elif any(w in lower for w in ["कापूस", "cotton", "textile", "indigo", "शाल", "कपडा", "fabric", "saree", "handloom"]):
        name = "Handwoven Artisan Textile"
        category = "Handloom Textiles"
        materials = ["Organic Cotton", "Natural Indigo Dye"]
        keywords = ["handloom", "indigo", "cotton", "sustainable textile", "artisan throw"]
        desc_en = "A soft, premium handloom cotton creation dyed in small batches with natural dyes. Each piece features subtle artisanal textures unique to traditional handloom weaving."
        desc_hi = "प्राकृतिक रंगों से रंगा गया शुद्ध सूती हथकरघा परिधान। हर पीस में पारंपरिक बुनाई की अनूठी चमक और कोमलता है।"
        desc_mr = "नैसर्गिक रंगाने रंगवलेला अस्सल हातमाग सुती कपडा. पारंपरिक विणकामाची सुंदर पोत आणि मऊपणा."
    elif any(w in lower for w in ["पितळ", "brass", "दागिने", "jewellery", "jewelry", "necklace", "earring"]):
        name = "Handcrafted Brass Artisan Jewellery"
        category = "Artisan Jewellery"
        materials = ["Brass", "Semi-precious stone"]
        keywords = ["brass jewellery", "handmade earrings", "ethnic", "festive wear", "artisan craft"]
        desc_en = "Exquisite handcrafted brass jewelry with hand-polished medallions and ethnic motifs. Nickel-free, lightweight, and perfect for festive elegance."
        desc_hi = "पारंपरिक रूपांकनों से सुसज्जित दस्तकारी पीतल के आभूषण। त्वचा के अनुकूल, हल्के और उत्सव के अवसरों के लिए उपयुक्त।"
        desc_mr = "सुंदर नक्षीकामाचे हस्तनिर्मित पितळी दागिने. वजनाने हलके आणि सणासुदीच्या प्रसंगांसाठी उत्कृष्ट."
    elif any(w in lower for w in ["चित्र", "painting", "watercolour", "watercolor", "art", "canvas", "sketch"]):
        name = "Original Handmade Artwork"
        category = "Art & Paintings"
        materials = ["Cotton Rag Paper", "Natural Pigment Watercolour"]
        keywords = ["watercolour", "original art", "rural landscape", "wall art", "signed painting"]
        desc_en = "An evocative original artwork on archival paper capturing rustic Indian heritage and folklore. Signed by the master artist."
        desc_hi = "मूल हस्तनिर्मित पेंटिंग, जो भारतीय ग्रामीण धरोहर, कला और प्रकृति को दर्शाती है।"
        desc_mr = "स्थानिक संस्कृती आणि निसर्गाचे सुंदर दर्शन घडवणारे मूळ हस्तचित्र कलाकृती."
    elif any(w in lower for w in ["लाकूड", "wood", "wooden", "वाटी", "bowl", "carving", "sheesham", "teak"]):
        name = "Traditional Carved Wooden Artifact"
        category = "Wooden Crafts"
        materials = ["Sheesham Wood", "Food-safe oil"]
        keywords = ["wood carving", "sheesham craft", "handmade woodenware", "rustic décor"]
        desc_en = "A hand-turned single-piece wooden artifact with delicate carved rim detailing, finished with natural food-safe oil."
        desc_hi = "एकल लकड़ी से तराशी गई शीशम की सुंदर कलाकृति, जिस पर बारीक नक्काशी और प्राकृतिक तेल की पॉलिश की गई है।"
        desc_mr = "अखंड लाकडातून कोरलेली सुबक कलाकृती, नैसर्गिक पॉलिशसह सजावटीसाठी आणि वापरासाठी उपयुक्त."
    elif any(w in lower for w in ["माती", "clay", "pottery", "terracotta", "भांडे", "pot", "vase", "ceramic"]):
        name = "Handcrafted Terracotta Clay Pottery"
        category = "Pottery"
        materials = ["Natural Terracotta Clay", "Eco-friendly Mineral Glaze"]
        keywords = ["terracotta", "pottery", "handmade pot", "clay decor", "eco-friendly"]
        desc_en = "An authentic handcrafted terracotta pottery piece shaped on traditional potter's wheel and wood kiln-fired for timeless rustic charm."
        desc_hi = "पारंपरिक चाक पर गढ़ी गई प्रामाणिक टेराकोटा मिट्टी की कलाकृति, जो प्राकृतिक और पर्यावरण के अनुकूल है।"
        desc_mr = "पारंपरिक कुंभाराच्या चाकावर घडवलेली अस्सल मातीची कलाकृती, पर्यावरणपूरक आणि घरच्या सजावटीसाठी उत्तम."
    elif any(w in lower for w in ["तांबे", "copper", "metal", "कासे", "bronze", "statue", "diya"]):
        name = "Handcrafted Brass & Metalware Artifact"
        category = "Brass & Metalware"
        materials = ["Cast Brass", "Hand-engraved Copper"]
        keywords = ["brassware", "metal craft", "handmade diya", "traditional metalwork"]
        desc_en = "Master-crafted traditional cast metal artifact with delicate chasing and fine polished patina."
        desc_hi = "पारंपरिक धातु कला का उत्कृष्ट हस्तनिर्मित नमूना, जो पूजा और गृह सज्जा के लिए उपयुक्त है।"
        desc_mr = "पारंपरिक धातूकामाची सुबक कलाकृती, उत्कृष्ट नक्षीकाम आणि आकर्षक पॉलिश."
    else:
        name = "Handcrafted Artisan Creation"
        category = "Traditional Handicrafts"
        materials = ["Natural Artisan Materials", "Traditional Finish"]
        keywords = ["handmade", "authentic craft", "traditional", "indian artisan"]
        detail = transcript or extra_details or "Traditional Indian craft"
        desc_en = f"A handcrafted artisanal creation representing rich local heritage. Made with care: {detail}"
        desc_hi = f"स्थानीय पारंपरिक कला का उत्कृष्ट हस्तनिर्मित नमूना: {detail}"
        desc_mr = f"स्थानिक समृद्ध परंपरेचे हस्तनिर्मित कलात्मक उत्पादन: {detail}"

    return name, category, materials, keywords, desc_en, desc_hi, desc_mr


async def generate_catalogue(
    transcript: str,
    source_language: str = "mr",
    extra_details: str = "",
) -> CatalogueResult:
    start = time.perf_counter()

    # 1. Try Gemini LLM for dynamic creative catalogue generation
    if gemini_service.is_gemini_available():
        try:
            gemini_res = await gemini_service.generate_catalogue_gemini(
                transcript=transcript,
                source_language=source_language,
                extra_details=extra_details,
            )
            if gemini_res:
                duration_ms = int((time.perf_counter() - start) * 1000)
                logger.info("Catalogue generated via Gemini in %dms", duration_ms)
                return CatalogueResult(
                    name=gemini_res.name,
                    category=gemini_res.category,
                    materials=gemini_res.materials,
                    keywords=gemini_res.keywords,
                    description_en=gemini_res.description_en,
                    description_hi=gemini_res.description_hi,
                    description_mr=gemini_res.description_mr,
                    provider=gemini_res.provider,
                    duration_ms=duration_ms,
                )
        except Exception as exc:
            logger.warning("Gemini catalogue generation failed, using fallback: %s", exc)

    # 2. Heuristic fallback
    name, cat, mats, kws, d_en, d_hi, d_mr = _rule_based_catalogue(transcript, extra_details)
    duration_ms = int((time.perf_counter() - start) * 1000)
    return CatalogueResult(
        name=name,
        category=cat,
        materials=mats,
        keywords=kws,
        description_en=d_en,
        description_hi=d_hi,
        description_mr=d_mr,
        provider="rules-based-generator",
        duration_ms=duration_ms,
    )
