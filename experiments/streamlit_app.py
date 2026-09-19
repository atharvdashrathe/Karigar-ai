"""Artisan AI listing studio. Run with: streamlit run streamlit_app.py"""
from __future__ import annotations

import io
import os
import re
import subprocess
import wave
from dataclasses import asdict, dataclass

import numpy as np
import streamlit as st
import torch
import whisper
from PIL import Image, ImageEnhance

st.set_page_config(page_title="Artisan AI", page_icon="A", layout="wide", initial_sidebar_state="collapsed")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# Use the installed multilingual model by default. Set ARTISAN_ASR_MODEL=turbo
# after installing its checkpoint for a larger-model accuracy upgrade.
ASR_MODEL = os.getenv("ARTISAN_ASR_MODEL", "small")
LANGUAGES = {"Hindi": "hi", "Marathi": "mr", "English": "en"}
ASR_PROMPTS = {
    "Marathi": "\u0939\u0938\u094d\u0924\u0928\u093f\u0930\u094d\u092e\u093f\u0924 \u092a\u0947\u0902\u091f\u093f\u0902\u0917, \u0935\u0949\u091f\u0930 \u0915\u0932\u0930\u094d\u0938, \u0915\u094d\u0930\u0947\u092f\u0949\u0928\u094d\u0938, \u0939\u0938\u094d\u0924\u0915\u0932\u093e, \u0909\u0924\u094d\u092a\u093e\u0926\u0928\u093e\u091a\u0947 \u0935\u0930\u094d\u0923\u0928.",
    "Hindi": "\u0939\u0938\u094d\u0924\u0928\u093f\u0930\u094d\u092e\u093f\u0924 \u092a\u0947\u0902\u091f\u093f\u0902\u0917, \u0935\u093e\u091f\u0930\u0915\u0932\u0930, \u0915\u094d\u0930\u0947\u092f\u0949\u0928, \u0939\u0938\u094d\u0924\u0915\u0932\u093e, \u0909\u0924\u094d\u092a\u093e\u0926 \u0935\u093f\u0935\u0930\u0923\u0923.",
    "English": "handmade artisan product, painting, watercolours, crayons, materials, product description.",
}

st.markdown("""<style>
.stApp {background:#f6f8f7;color:#17211f}.block-container{max-width:1120px;padding:2rem 1.5rem 4rem}
.hero{background:linear-gradient(125deg,#103f3a,#1a6258);color:white;border-radius:28px;padding:2.2rem 2.5rem;margin-bottom:1rem}
.hero h1{color:white;margin:0}.hero p{color:#e1f1ec;margin:.6rem 0 0}.step{color:#176154;font-weight:800;text-transform:uppercase;letter-spacing:.09em;font-size:.78rem;margin:1.25rem 0 .7rem}
[data-testid="stForm"],.listing{background:white;border:1px solid #dfe8e3;border-radius:18px;padding:1.25rem;box-shadow:0 6px 20px rgba(24,56,48,.06)}
[data-testid="stMetric"]{background:white;border:1px solid #dfe8e3;border-radius:16px;padding:.85rem}.stButton button,.stDownloadButton button{border-radius:12px;min-height:46px}
</style>""", unsafe_allow_html=True)

@dataclass(frozen=True)
class Listing:
    name: str
    category: str
    materials: str
    description: str
    keywords: str

@st.cache_resource(show_spinner=False)
def load_asr(model_name: str):
    return whisper.load_model(model_name, device=DEVICE)

def audio_to_wav(raw: bytes) -> bytes:
    process = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-af", "highpass=f=80,lowpass=f=8000,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1"], input=raw, capture_output=True, check=False)
    if process.returncode:
        raise RuntimeError("We could not read that recording. Please upload a WAV, M4A, or MP3 file.")
    return process.stdout

def transcribe(audio: bytes, language: str) -> str:
    with wave.open(io.BytesIO(audio), "rb") as source:
        samples = np.frombuffer(source.readframes(source.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    try:
        model = load_asr(ASR_MODEL)
        model_name = ASR_MODEL
    except Exception:
        # Keeps the app usable on machines without sufficient GPU memory.
        model = load_asr("small")
        model_name = "small"
    options = {"language": LANGUAGES[language], "fp16": DEVICE == "cuda", "temperature": 0,
               "condition_on_previous_text": False, "beam_size": 5, "best_of": 5, "verbose": False}
    try:
        result = model.transcribe(samples, **options)
    except RuntimeError as error:
        if model_name == "small":
            raise error
        if DEVICE == "cuda":
            torch.cuda.empty_cache()
        model = load_asr("small")
        result = model.transcribe(samples, **options)
    text = re.sub(r"\s+", " ", result["text"]).strip()
    if not text:
        retry_options = dict(options)
        retry_options.pop("language")
        result = model.transcribe(samples, **retry_options)
        text = re.sub(r"\s+", " ", result["text"]).strip()
    if not text:
        return "No speech was detected in this recording. Please try a clearer voice note or use the product details field."
    return text

def polish_image(raw: bytes) -> Image.Image:
    """Fast deterministic enhancement; segmentation downloads a large model and often damages products."""
    source = Image.open(io.BytesIO(raw)).convert("RGBA")
    image = Image.new("RGBA", source.size, "white")
    image.alpha_composite(source)
    image = image.convert("RGB")
    image.thumbnail((1080, 1080), Image.Resampling.LANCZOS)
    image = ImageEnhance.Brightness(image).enhance(1.03)
    image = ImageEnhance.Contrast(image).enhance(1.05)
    image = ImageEnhance.Sharpness(image).enhance(1.08)
    canvas = Image.new("RGB", (1080, 1080), "white")
    canvas.paste(image, ((1080 - image.width) // 2, (1080 - image.height) // 2))
    return canvas

def export_image(image: Image.Image) -> bytes:
    data = io.BytesIO(); image.save(data, format="JPEG", quality=92, optimize=True)
    return data.getvalue()

def detect_listing(text: str) -> Listing:
    """Create only facts supported by the reviewed note/transcript."""
    lower = text.lower()
    kinds = [(r"paint|canvas|artwork|चित्र|पेंट|प्यंट", "Handmade Painting", "Art & Paintings", "handmade painting, wall art"), (r"bag|purse|बैग", "Handcrafted Artisan Bag", "Bags & Accessories", "handmade bag, artisan accessory"), (r"pot|vase|ceramic|clay|मिट्टी", "Handmade Decorative Pottery", "Home Décor & Pottery", "handmade pottery, home décor"), (r"jewel|necklace|earring|bangle|गह", "Handmade Artisan Jewellery", "Jewellery", "handmade jewellery, artisan accessory"), (r"textile|saree|sari|dupatta|weav|कपड", "Handwoven Textile", "Textiles & Apparel", "handwoven textile, traditional craft")]
    name, category, type_tags = "Handmade Artisan Product", "Handmade Crafts", "artisan made, traditional craft"
    for pattern, candidate, section, tags in kinds:
        if re.search(pattern, lower):
            name, category, type_tags = candidate, section, tags
            break
    material_terms = [(r"watercolou?r|वॉटर.?कलर|वाटा.?कलर", "Watercolour"), (r"crayon|क्रेय", "Crayons"), (r"cotton|कॉटन", "Cotton"), (r"silk|सिल्क", "Silk"), (r"wood|लकड", "Wood"), (r"clay|मिट्टी", "Clay"), (r"bamboo", "Bamboo"), (r"metal", "Metal"), (r"leather", "Leather")]
    materials = [label for pattern, label in material_terms if re.search(pattern, lower)] or ["Materials to be confirmed"]
    keywords = ", ".join(dict.fromkeys(["handmade", *type_tags.split(", "), *[item.lower() for item in materials]]))
    description = f"{name} made by an artisan. Review the product note below and add any important details before publishing."
    return Listing(name, category, ", ".join(materials), description, keywords)

def price_range(material: float, labour: float, complexity: int) -> tuple[int, int, int]:
    middle = round((material + labour) * (1.35 + complexity * .06) / 10) * 10
    return int(middle * .9), middle, int(middle * 1.12)

st.markdown('<section class="hero"><h1>Artisan AI</h1><p>Turn a product photo and voice note into a listing you can review and publish.</p></section>', unsafe_allow_html=True)
st.caption(f"Using {ASR_MODEL} speech recognition on {torch.cuda.get_device_name(0) if DEVICE == 'cuda' else 'CPU'}.")

with st.form("listing"):
    st.markdown('<div class="step">1 · Add product details</div>', unsafe_allow_html=True)
    left, right = st.columns(2)
    artisan = left.text_input("Your name or workshop", placeholder="e.g. Sita Handloom")
    language = right.selectbox("Language of voice note", list(LANGUAGES))
    photo = st.file_uploader("Product photo", type=["jpg", "jpeg", "png"])
    voice = st.file_uploader("Voice note", type=["wav", "m4a", "mp3", "webm", "ogg", "mp4"], help="WAV, M4A, MP3, WebM, OGG, or MP4 are supported.")
    product_note = st.text_area("Product details (optional but recommended)", placeholder="For best accuracy, add product name, materials, and special features here.")
    st.markdown('<div class="step">2 · Price essentials</div>', unsafe_allow_html=True)
    c1, c2, c3 = st.columns(3)
    material_cost = c1.number_input("Material cost (₹)", min_value=0, value=300, step=50)
    labour_cost = c2.number_input("Labour cost (₹)", min_value=0, value=250, step=50)
    complexity = c3.slider("Craft complexity", 1, 10, 6)
    submitted = st.form_submit_button("Create my listing", use_container_width=True, type="primary")

if submitted:
    if not photo or (not voice and not product_note.strip()):
        st.error("Add a product photo and either a voice note or product details.")
    else:
        try:
            with st.status("Creating your listing…", expanded=True) as status:
                st.write("Enhancing product photo")
                polished = polish_image(photo.getvalue())
                if voice:
                    st.write("Transcribing product story")
                    spoken = transcribe(audio_to_wav(voice.getvalue()), language)
                else:
                    spoken = "No voice note supplied; product details were used."
                low, middle, high = price_range(material_cost, labour_cost, complexity)
                status.update(label="Transcription ready for your confirmation", state="complete", expanded=False)
            # A listing must never be created directly from unverified speech.
            st.session_state.pop("confirmed_transcript", None)
            st.session_state.pop("confirmed_details", None)
            st.session_state.draft = {"artisan": artisan, "polished": polished, "spoken": spoken,
                                      "product_note": product_note.strip(), "low": low, "middle": middle, "high": high}
            st.session_state.pop("result", None)
        except Exception as error:
            st.error(f"Could not create the listing: {error}")

if draft := st.session_state.get("draft"):
    st.markdown('<div class="step">2 · Confirm the product information</div>', unsafe_allow_html=True)
    st.warning("Please check the transcription before the marketplace listing is created. Edit any word that is incorrect.")
    with st.form("confirm_transcription"):
        confirmed_transcript = st.text_area("Voice transcription", draft["spoken"], height=130, key="confirmed_transcript")
        confirmed_details = st.text_area("Confirmed product details", draft["product_note"] or confirmed_transcript, height=130, key="confirmed_details", help="Add or correct product type, materials, colours, size, and any special features.")
        confirmed = st.checkbox("I confirm these product details are correct.")
        create_verified = st.form_submit_button("Generate verified listing", use_container_width=True, type="primary")
    if create_verified:
        details = confirmed_details.strip() or confirmed_transcript.strip()
        if not confirmed:
            st.error("Please confirm that the product details are correct before creating the listing.")
        elif not details or details.startswith("No speech was detected"):
            st.error("Enter the correct product details before creating the listing.")
        else:
            listing = detect_listing(details)
            st.session_state.result = {**draft, "spoken": confirmed_transcript, "reviewed_text": details, "listing": asdict(listing)}
            st.session_state.pop("draft", None)
            st.rerun()

if result := st.session_state.get("result"):
    listing = Listing(**result["listing"])
    st.markdown('<div class="step">Your share-ready listing</div>', unsafe_allow_html=True)
    # Put the useful catalogue information first. A portrait photo can be much
    # taller than the viewport, so a side-by-side layout hides the result.
    st.markdown('<div class="listing">', unsafe_allow_html=True)
    st.subheader(listing.name)
    st.caption(f"{listing.category} - {listing.materials}")
    st.write(listing.description)
    st.caption(f"Search tags: {listing.keywords}")
    st.markdown('</div>', unsafe_allow_html=True)
    summary_prices = st.columns(3)
    summary_prices[0].metric("Start at", f"Rs. {result['low']}")
    summary_prices[1].metric("Recommended", f"Rs. {result['middle']}")
    summary_prices[2].metric("Premium", f"Rs. {result['high']}")
    image_col, copy_col = st.columns([1, 1.15], gap="large")
    with image_col:
        st.image(result["polished"], caption="Enhanced product photo", use_container_width=True)
        st.download_button("Download product photo", export_image(result["polished"]), "product-photo.jpg", "image/jpeg", use_container_width=True)
    with copy_col:
        st.markdown('<div class="listing">', unsafe_allow_html=True)
        st.subheader(listing.name); st.caption(f"{listing.category} · {listing.materials}"); st.write(listing.description); st.caption(f"Search tags: {listing.keywords}")
        st.markdown('</div>', unsafe_allow_html=True)
        p1, p2, p3 = st.columns(3)
        p1.metric("Start at", f"₹{result['low']}"); p2.metric("Recommended", f"₹{result['middle']}"); p3.metric("Premium", f"₹{result['high']}")
    with st.expander("Review voice transcription and product note", expanded=True):
        st.caption("If speech recognition is empty or inaccurate, edit these fields and update the listing.")
        corrected_speech = st.text_area("Corrected voice transcription", result["spoken"], height=100, key="corrected_speech")
        corrected_note = st.text_area("Corrected product details", result["reviewed_text"], height=100, key="corrected_note")
        if st.button("Update listing from corrected details", use_container_width=True):
            source_text = corrected_note.strip() or corrected_speech.strip()
            if source_text.startswith("No speech was detected"):
                st.error("Please enter product details before updating the listing.")
            else:
                refreshed = detect_listing(source_text)
                st.session_state.result["spoken"] = corrected_speech
                st.session_state.result["reviewed_text"] = source_text
                st.session_state.result["listing"] = asdict(refreshed)
                st.rerun()
        st.text_area("Voice transcription", result["spoken"], height=100, disabled=True)
        st.text_area("Product note used for this listing", result["reviewed_text"], height=100, disabled=True)
        st.info("For a change, update “Product details” above and create the listing again. This avoids silently publishing a bad translation.")
    download = f"ARTISAN AI PRODUCT LISTING\n\nArtisan: {result['artisan'] or 'Not specified'}\nProduct: {listing.name}\nCategory: {listing.category}\nMaterials: {listing.materials}\nRecommended price: ₹{result['middle']} (range ₹{result['low']}–₹{result['high']})\n\nProduct note:\n{result['reviewed_text']}\n\nDescription:\n{listing.description}\n\nKeywords: {listing.keywords}\n"
    st.download_button("Download listing details", download, "karigar-listing.txt", "text/plain", use_container_width=True)

st.caption("Artisan AI · Review the final text and price before publishing to a marketplace.")
