import whisper

print("Loading Whisper AI model...")

model = whisper.load_model("small")

print("Transcribing Marathi audio...")

result = model.transcribe(
    "data/audio/product_loud.wav",
    language="mr",
    task="transcribe",
    fp16=False,
    temperature=0,
    condition_on_previous_text=False
)

print("\nDetected language:")
print(result["language"])

print("\nTranscription:")
print(result["text"])