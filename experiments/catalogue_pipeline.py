import torch
import wave
import numpy as np

from transformers import (
    AutoModel,
    AutoTokenizer,
    AutoModelForSeq2SeqLM
)

# ==================================================
# 1. LOAD INDICCONFORMER
# ==================================================

print("Loading IndicConformer...")

asr_model = AutoModel.from_pretrained(
    "ai4bharat/indic-conformer-600m-multilingual",
    trust_remote_code=True,
    device="cpu"
)

print("IndicConformer loaded!")

# ==================================================
# 2. LOAD AUDIO
# ==================================================

audio_path = "data/audio/product_loud.wav"

with wave.open(audio_path, "rb") as audio:
    sample_rate = audio.getframerate()
    channels = audio.getnchannels()
    sample_width = audio.getsampwidth()
    frames = audio.readframes(audio.getnframes())

# Convert 16-bit PCM → float32
audio_data = np.frombuffer(frames, dtype=np.int16)
audio_data = audio_data.astype(np.float32) / 32768.0

# Stereo → mono
if channels > 1:
    audio_data = audio_data.reshape(-1, channels).mean(axis=1)

wav = torch.from_numpy(audio_data)

# ==================================================
# 3. RESAMPLE TO 16 kHz
# ==================================================

if sample_rate != 16000:

    print("Resampling audio to 16 kHz...")

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

print("Audio ready!")

# ==================================================
# 4. MARATHI SPEECH → MARATHI TEXT
# ==================================================

print("\nTranscribing Marathi speech...")
print("Please wait...")

with torch.no_grad():

    marathi_text = asr_model(
        wav,
        "mr",
        "ctc"
    )

print("\n--------------------------------")
print("MARATHI TRANSCRIPTION")
print("--------------------------------")
print(marathi_text)

# ==================================================
# 5. LOAD NLLB TRANSLATOR
# ==================================================

print("\nLoading NLLB translation model...")
print("Please wait...")

translator_tokenizer = AutoTokenizer.from_pretrained(
    "facebook/nllb-200-distilled-600M"
)

translator_model = AutoModelForSeq2SeqLM.from_pretrained(
    "facebook/nllb-200-distilled-600M"
)

translator_model.eval()

print("NLLB loaded!")

# ==================================================
# 6. TRANSLATION FUNCTION
# ==================================================

def translate(text, target_language):

    translator_tokenizer.src_lang = "mar_Deva"

    inputs = translator_tokenizer(
        text,
        return_tensors="pt",
        padding=True,
        truncation=True
    )

    target_token_id = translator_tokenizer.convert_tokens_to_ids(
        target_language
    )

    with torch.no_grad():

        output = translator_model.generate(
            **inputs,
            forced_bos_token_id=target_token_id,
            max_length=256
        )

    result = translator_tokenizer.batch_decode(
        output,
        skip_special_tokens=True
    )

    return result[0]


# ==================================================
# 7. MARATHI → ENGLISH
# ==================================================

print("\nTranslating Marathi → English...")

english_text = translate(
    marathi_text,
    "eng_Latn"
)

print("\n--------------------------------")
print("ENGLISH TRANSLATION")
print("--------------------------------")
print(english_text)


# ==================================================
# 8. MARATHI → HINDI
# ==================================================

print("\nTranslating Marathi → Hindi...")

hindi_text = translate(
    marathi_text,
    "hin_Deva"
)

print("\n--------------------------------")
print("HINDI TRANSLATION")
print("--------------------------------")
print(hindi_text)


# ==================================================
# COMPLETE
# ==================================================

print("\n================================")
print("TRANSLATION PIPELINE COMPLETE")
print("================================")