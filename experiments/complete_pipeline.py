import torch
import wave
import numpy as np

from transformers import (
    AutoModel,
    AutoTokenizer,
    AutoModelForSeq2SeqLM
)


# =========================================================
# 1. LOAD INDICCONFORMER
# =========================================================

print("\n==========================================")
print("       ARTISAN AI COMPLETE PIPELINE")
print("==========================================")

print("\n[1/4] Loading IndicConformer...")

asr_model = AutoModel.from_pretrained(
    "ai4bharat/indic-conformer-600m-multilingual",
    trust_remote_code=True,
    device="cpu"
)

print("IndicConformer loaded successfully!")


# =========================================================
# 2. LOAD AUDIO
# =========================================================

audio_path = "data/audio/product_loud.wav"

print("\n[2/4] Loading artisan voice...")

with wave.open(audio_path, "rb") as audio:

    sample_rate = audio.getframerate()
    channels = audio.getnchannels()
    sample_width = audio.getsampwidth()

    frames = audio.readframes(
        audio.getnframes()
    )


# Convert 16-bit audio to float
audio_data = np.frombuffer(
    frames,
    dtype=np.int16
)

audio_data = audio_data.astype(
    np.float32
) / 32768.0


# Stereo → Mono
if channels > 1:

    audio_data = audio_data.reshape(
        -1,
        channels
    ).mean(axis=1)


wav = torch.from_numpy(
    audio_data
)


# =========================================================
# 3. RESAMPLE TO 16 kHz
# =========================================================

if sample_rate != 16000:

    print(
        f"Resampling {sample_rate} Hz → 16000 Hz..."
    )

    new_length = int(
        len(wav) * 16000 / sample_rate
    )

    wav = torch.nn.functional.interpolate(
        wav.unsqueeze(0).unsqueeze(0),
        size=new_length,
        mode="linear",
        align_corners=False
    ).squeeze()


wav = wav.unsqueeze(0)


# =========================================================
# 4. MARATHI SPEECH → TEXT
# =========================================================

print("\nTranscribing Marathi speech...")
print("Please wait...")

with torch.no_grad():

    marathi_text = asr_model(
        wav,
        "mr",
        "ctc"
    )


print("\n------------------------------------------")
print("MARATHI TRANSCRIPTION")
print("------------------------------------------")

print(marathi_text)


# =========================================================
# 5. LOAD NLLB
# =========================================================

print("\n[3/4] Loading translation model...")

tokenizer = AutoTokenizer.from_pretrained(
    "facebook/nllb-200-distilled-600M"
)

translation_model = AutoModelForSeq2SeqLM.from_pretrained(
    "facebook/nllb-200-distilled-600M"
)

translation_model.eval()

print("Translation model loaded!")


# =========================================================
# 6. TRANSLATION FUNCTION
# =========================================================

def translate(text, target_language):

    tokenizer.src_lang = "mar_Deva"

    inputs = tokenizer(
        text,
        return_tensors="pt",
        padding=True,
        truncation=True
    )

    target_token_id = tokenizer.convert_tokens_to_ids(
        target_language
    )

    with torch.no_grad():

        output = translation_model.generate(
            **inputs,
            forced_bos_token_id=target_token_id,
            max_length=256
        )

    result = tokenizer.batch_decode(
        output,
        skip_special_tokens=True
    )

    return result[0]


# =========================================================
# 7. MARATHI → ENGLISH
# =========================================================

print("\nTranslating Marathi → English...")

english_text = translate(
    marathi_text,
    "eng_Latn"
)

print("\n------------------------------------------")
print("ENGLISH DESCRIPTION")
print("------------------------------------------")

print(english_text)


# =========================================================
# 8. MARATHI → HINDI
# =========================================================

print("\nTranslating Marathi → Hindi...")

hindi_text = translate(
    marathi_text,
    "hin_Deva"
)

print("\n------------------------------------------")
print("HINDI DESCRIPTION")
print("------------------------------------------")

print(hindi_text)


# =========================================================
# 9. CATALOGUE GENERATOR
# =========================================================

print("\n[4/4] Generating professional catalogue...")


def generate_catalogue(text):

    lower_text = text.lower()


    # -----------------------------
    # Product name
    # -----------------------------

    if "painting" in lower_text:

        product_name = (
            "Handmade Watercolor Painting"
        )

    elif "bag" in lower_text:

        product_name = (
            "Handmade Artisan Bag"
        )

    elif "pot" in lower_text:

        product_name = (
            "Handmade Decorative Pot"
        )

    elif (
        "jewellery" in lower_text
        or "jewelry" in lower_text
    ):

        product_name = (
            "Handmade Artisan Jewellery"
        )

    else:

        product_name = (
            "Handmade Artisan Product"
        )


    # -----------------------------
    # Category
    # -----------------------------

    if "painting" in lower_text:

        category = (
            "Handmade Art & Paintings"
        )

    elif "bag" in lower_text:

        category = (
            "Handmade Bags & Accessories"
        )

    elif "pot" in lower_text:

        category = (
            "Home Décor & Pottery"
        )

    elif (
        "jewellery" in lower_text
        or "jewelry" in lower_text
    ):

        category = (
            "Handmade Jewellery"
        )

    else:

        category = "Handmade Crafts"


    # -----------------------------
    # Materials
    # -----------------------------

    material_list = []

    materials = [
        "watercolors",
        "watercolor",
        "crayons",
        "crayon",
        "cotton",
        "silk",
        "wood",
        "clay",
        "bamboo",
        "wool",
        "metal"
    ]

    for material in materials:

        if material in lower_text:

            material_list.append(
                material.title()
            )


    if not material_list:

        material_list.append(
            "Traditional handcrafted materials"
        )


    # Remove duplicates
    material_list = list(
        dict.fromkeys(material_list)
    )


    # -----------------------------
    # Keywords
    # -----------------------------

    keywords = [
        "handmade",
        "artisan",
        "traditional craft",
        "handcrafted"
    ]


    if "painting" in lower_text:

        keywords.extend([
            "handmade painting",
            "watercolor art",
            "wall art",
            "home décor"
        ])


    if "bag" in lower_text:

        keywords.extend([
            "handmade bag",
            "artisan bag",
            "fashion accessory"
        ])


    if "pot" in lower_text:

        keywords.extend([
            "handmade pottery",
            "home décor",
            "decorative craft"
        ])


    if "bear" in lower_text:

        keywords.append(
            "bear artwork"
        )


    keywords = list(
        dict.fromkeys(keywords)
    )


    # -----------------------------
    # Professional description
    # -----------------------------

    description = (
        f"{text.strip()} "
        "This unique handmade product reflects "
        "the creativity and craftsmanship of skilled "
        "artisans. It can be suitable for home décor, "
        "gifting and personal collections."
    )


    return {
        "product_name": product_name,
        "category": category,
        "description": description,
        "materials": ", ".join(material_list),
        "keywords": ", ".join(keywords)
    }


# =========================================================
# 10. GENERATE CATALOGUE
# =========================================================

catalogue = generate_catalogue(
    english_text
)


# =========================================================
# 11. DISPLAY FINAL RESULT
# =========================================================

print("\n")
print("==========================================")
print("          FINAL AI CATALOGUE")
print("==========================================")

print("\nProduct Name:")
print(catalogue["product_name"])

print("\nCategory:")
print(catalogue["category"])

print("\nDescription:")
print(catalogue["description"])

print("\nMaterials:")
print(catalogue["materials"])

print("\nKeywords:")
print(catalogue["keywords"])

print("\nHindi Description:")
print(hindi_text)

print("\n==========================================")
print("       PIPELINE COMPLETED SUCCESSFULLY")
print("==========================================")