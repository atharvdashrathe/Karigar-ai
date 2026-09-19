import re

# ==========================================
# AI PRODUCT CATALOGUE GENERATOR
# ==========================================

def generate_catalogue(english_text):

    text = english_text.strip()

    # --------------------------------------
    # Product title
    # --------------------------------------

    title = "Handmade Artisan Product"

    if "painting" in text.lower():
        title = "Handmade Watercolor Painting"

    elif "bag" in text.lower():
        title = "Handmade Artisan Bag"

    elif "pot" in text.lower():
        title = "Handmade Decorative Pot"

    elif "jewellery" in text.lower() or "jewelry" in text.lower():
        title = "Handmade Artisan Jewellery"

    # --------------------------------------
    # Category
    # --------------------------------------

    category = "Handmade Crafts"

    if "painting" in text.lower():
        category = "Handmade Art & Paintings"

    elif "bag" in text.lower():
        category = "Handmade Bags & Accessories"

    elif "pot" in text.lower():
        category = "Home Décor & Pottery"

    elif "jewellery" in text.lower() or "jewelry" in text.lower():
        category = "Handmade Jewellery"

    # --------------------------------------
    # Materials
    # --------------------------------------

    materials = []

    material_words = [
        "watercolor",
        "watercolors",
        "crayon",
        "crayons",
        "cotton",
        "silk",
        "wood",
        "clay",
        "bamboo",
        "metal",
        "wool"
    ]

    for material in material_words:
        if material in text.lower():
            materials.append(material.title())

    if not materials:
        materials.append("Handcrafted Materials")

    # --------------------------------------
    # Keywords
    # --------------------------------------

    keywords = [
        "handmade",
        "artisan product",
        "traditional craft",
        "handcrafted"
    ]

    if "painting" in text.lower():
        keywords.extend([
            "handmade painting",
            "watercolor art",
            "wall art"
        ])

    if "bear" in text.lower():
        keywords.append("bear artwork")

    # Remove duplicates
    keywords = list(dict.fromkeys(keywords))

    # --------------------------------------
    # Professional description
    # --------------------------------------

    description = (
        f"{text.capitalize()} "
        "This unique handmade product showcases the "
        "creativity and craftsmanship of skilled artisans. "
        "It is suitable for home décor, gifting and "
        "personal collections."
    )

    # --------------------------------------
    # Return catalogue
    # --------------------------------------

    return {
        "product_name": title,
        "category": category,
        "description": description,
        "materials": ", ".join(materials),
        "keywords": ", ".join(keywords)
    }


# ==========================================
# TEST
# ==========================================

english_text = """
This is a handmade painting with three bears,
and we're going to show them as three idiots,
and this is a painting made using watercolors
and crayons.
"""

catalogue = generate_catalogue(english_text)

print("\n==========================================")
print("        AI PRODUCT CATALOGUE")
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

print("\n==========================================")