import subprocess
import sys
import os


# ==========================================
# ARTISAN AI - MAIN APPLICATION
# ==========================================

print("\n")
print("==============================================")
print("             ARTISAN AI")
print("     AI-Powered Artisan Market Assistant")
print("==============================================")

print("""
This system helps artisans:
1. Enhance product photographs
2. Convert regional speech into text
3. Translate product information
4. Generate product catalogues
5. Recommend a competitive price
""")


# ==========================================
# CHECK PROJECT FILES
# ==========================================

required_files = [
    "image_studio.py",
    "complete_pipeline.py",
    "pricing_model.py"
]

print("\nChecking project modules...")

for file in required_files:

    if os.path.exists(file):
        print(f"✓ {file}")
    else:
        print(f"✗ {file} not found")


# ==========================================
# RUN MODULE
# ==========================================

def run_module(filename, title):

    print("\n")
    print("==============================================")
    print(title)
    print("==============================================")

    result = subprocess.run(
        [sys.executable, filename]
    )

    if result.returncode != 0:

        print("\nERROR:")
        print(f"{filename} failed.")

        return False

    print(f"\n✓ {title} completed successfully.")

    return True


# ==========================================
# STEP 1 - IMAGE STUDIO
# ==========================================

image_success = run_module(
    "image_studio.py",
    "MODULE 1 - AI IMAGE STUDIO"
)

if not image_success:
    sys.exit()


# ==========================================
# STEP 2 - VOICE + TRANSLATION + CATALOGUE
# ==========================================

pipeline_success = run_module(
    "complete_pipeline.py",
    "MODULE 2 - VOICE → TEXT → TRANSLATION → CATALOGUE"
)

if not pipeline_success:
    sys.exit()


# ==========================================
# STEP 3 - PRICING
# ==========================================

pricing_success = run_module(
    "pricing_model.py",
    "MODULE 3 - DYNAMIC PRICING"
)

if not pricing_success:
    sys.exit()


# ==========================================
# FINAL MESSAGE
# ==========================================

print("\n")
print("==============================================")
print("          ARTISAN AI DEMO COMPLETE")
print("==============================================")

print("""
✓ Product image enhanced
✓ Marathi speech recognized
✓ English translation generated
✓ Hindi translation generated
✓ Product catalogue generated
✓ ML-based price recommendation generated

Your artisan product is now ready
for digital market listing.
""")

print("==============================================")
print("              SUCCESS 🚀")
print("==============================================")