import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


# ==================================================
# 1. SAMPLE TRAINING DATA
# ==================================================

data = {
    "material_cost": [
        100, 150, 200, 250, 300,
        350, 400, 450, 500, 550,
        600, 700, 800, 900, 1000,
        1200, 1400, 1600, 1800, 2000
    ],

    "labour_cost": [
        50, 80, 100, 120, 150,
        180, 200, 220, 250, 280,
        300, 350, 400, 450, 500,
        600, 700, 800, 900, 1000
    ],

    "size": [
        "Small", "Small", "Small", "Medium", "Medium",
        "Medium", "Medium", "Large", "Large", "Large",
        "Small", "Medium", "Medium", "Large", "Large",
        "Large", "Large", "Large", "Large", "Large"
    ],

    "quality": [
        5, 6, 6, 7, 7,
        7, 8, 8, 8, 9,
        6, 7, 8, 8, 9,
        9, 9, 9, 10, 10
    ],

    "demand": [
        4, 4, 5, 5, 6,
        6, 7, 7, 8, 8,
        5, 6, 7, 8, 8,
        8, 9, 9, 10, 10
    ],

    "category": [
        "Painting", "Painting", "Painting", "Painting", "Painting",
        "Bag", "Bag", "Bag", "Bag", "Bag",
        "Pottery", "Pottery", "Pottery", "Pottery", "Pottery",
        "Jewellery", "Jewellery", "Jewellery", "Jewellery", "Jewellery"
    ],

    "price": [
        250, 350, 450, 550, 650,
        750, 850, 1000, 1150, 1300,
        700, 900, 1100, 1300, 1600,
        1800, 2200, 2700, 3200, 3800
    ]
}


df = pd.DataFrame(data)


print("\n==========================================")
print("       ARTISAN AI PRICING MODEL")
print("==========================================")

print("\nTraining dataset:")
print(df.head())


# ==================================================
# 2. INPUT FEATURES AND TARGET
# ==================================================

X = df[
    [
        "material_cost",
        "labour_cost",
        "size",
        "quality",
        "demand",
        "category"
    ]
]

y = df["price"]


# ==================================================
# 3. PREPROCESSING
# ==================================================

categorical_features = [
    "size",
    "category"
]

numeric_features = [
    "material_cost",
    "labour_cost",
    "quality",
    "demand"
]


preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features
        )
    ],
    remainder="passthrough"
)


# ==================================================
# 4. RANDOM FOREST MODEL
# ==================================================

model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),

        (
            "regressor",
            RandomForestRegressor(
                n_estimators=200,
                random_state=42
            )
        )
    ]
)


# ==================================================
# 5. TRAIN MODEL
# ==================================================

print("\nTraining ML pricing model...")

model.fit(X, y)

print("Model trained successfully!")


# ==================================================
# 6. TEST PRODUCT
# ==================================================

new_product = pd.DataFrame({
    "material_cost": [300],
    "labour_cost": [250],
    "size": ["Medium"],
    "quality": [8],
    "demand": [7],
    "category": ["Painting"]
})


predicted_price = model.predict(
    new_product
)[0]


# ==================================================
# 7. DISPLAY RESULT
# ==================================================

print("\n==========================================")
print("          PRICE RECOMMENDATION")
print("==========================================")

print("\nProduct:")
print("Handmade Watercolor Painting")

print("\nMaterial Cost:")
print("₹300")

print("\nLabour Cost:")
print("₹250")

print("\nQuality Score:")
print("8 / 10")

print("\nDemand Score:")
print("7 / 10")

print("\n------------------------------------------")

print(
    f"Recommended Price: ₹{predicted_price:.0f}"
)

print("------------------------------------------")

print("\nNOTE:")
print(
    "This recommendation is based on "
    "prototype training data."
)

print("\n==========================================")