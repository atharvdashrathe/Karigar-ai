from PIL import Image, ImageEnhance
from rembg import remove, new_session
import os

# Load U2Net once and reuse it
session = new_session("u2net")


def enhance_image(input_path, output_no_bg, output_final):
    print("Loading image...")
    image = Image.open(input_path).convert("RGBA")

    print("Removing background using U2Net...")
    no_bg = remove(image, session=session)

    # Save transparent background version
    no_bg.save(output_no_bg)

    print("Creating e-commerce image...")

    # White background
    background = Image.new("RGBA", no_bg.size, "white")
    background.alpha_composite(no_bg)

    # Convert to RGB
    final = background.convert("RGB")

    # Improve image quality
    final = ImageEnhance.Brightness(final).enhance(1.08)
    final = ImageEnhance.Contrast(final).enhance(1.08)
    final = ImageEnhance.Sharpness(final).enhance(1.15)

    # Resize to e-commerce format
    final.thumbnail((1000, 1000), Image.Resampling.LANCZOS)

    # Create 1000x1000 white canvas
    canvas = Image.new("RGB", (1000, 1000), "white")

    x = (1000 - final.width) // 2
    y = (1000 - final.height) // 2

    canvas.paste(final, (x, y))

    canvas.save(output_final, quality=95)

    print("Image enhancement completed!")
    print("Transparent image:", output_no_bg)
    print("Final image:", output_final)


if __name__ == "__main__":
    input_path = "data/Threeidiots.jpg"
    output_no_bg = "data/Threeidiots_no_bg.png"
    output_final = "data/Threeidiots_final.jpg"

    enhance_image(
        input_path,
        output_no_bg,
        output_final
    )