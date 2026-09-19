import torch
import wave
import numpy as np
from transformers import AutoModel

print("Loading IndicConformer...")

model = AutoModel.from_pretrained(
    "ai4bharat/indic-conformer-600m-multilingual",
    trust_remote_code=True,
    device="cpu"
)

print("Model loaded successfully!")

# ----------------------------------------
# Load WAV
# ----------------------------------------

audio_path = "data/audio/product_loud.wav"

with wave.open(audio_path, "rb") as audio:
    original_sr = audio.getframerate()
    channels = audio.getnchannels()
    sample_width = audio.getsampwidth()
    frames = audio.readframes(audio.getnframes())

print("\nOriginal audio:")
print("Sample rate:", original_sr)
print("Channels:", channels)

# 16-bit PCM → float32
audio_data = np.frombuffer(frames, dtype=np.int16)
audio_data = audio_data.astype(np.float32) / 32768.0

# Stereo → mono
if channels > 1:
    audio_data = audio_data.reshape(-1, channels).mean(axis=1)

# ----------------------------------------
# Convert to 16 kHz
# ----------------------------------------

wav = torch.from_numpy(audio_data)

if original_sr != 16000:
    print("Resampling audio to 16 kHz...")

    new_length = int(len(wav) * 16000 / original_sr)

    wav = torch.nn.functional.interpolate(
        wav.unsqueeze(0).unsqueeze(0),
        size=new_length,
        mode="linear",
        align_corners=False
    ).squeeze()

wav = wav.unsqueeze(0)

print("Final sample rate: 16000")
print("Tensor shape:", wav.shape)
print("Duration:", round(wav.shape[1] / 16000, 2), "seconds")

# ----------------------------------------
# Marathi transcription
# ----------------------------------------

print("\nRunning Marathi CTC transcription...")
print("Please wait...")

with torch.no_grad():
    result = model(wav, "mr", "ctc")

print("\n==============================")
print("MARATHI TRANSCRIPTION")
print("==============================")
print(result)
print("==============================")