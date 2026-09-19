from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

print("Loading translation AI...")

model_name = "facebook/nllb-200-distilled-600M"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

marathi_text = """
तुमचा मराठी मजकूर इथे टाका.
"""

print("Translating Marathi to English...")

tokenizer.src_lang = "mar_Deva"

inputs = tokenizer(
    marathi_text,
    return_tensors="pt"
)

translated_tokens = model.generate(
    **inputs,
    forced_bos_token_id=tokenizer.convert_tokens_to_ids("eng_Latn")
)

english_text = tokenizer.batch_decode(
    translated_tokens,
    skip_special_tokens=True
)[0]

print("\nEnglish Translation:")
print(english_text)