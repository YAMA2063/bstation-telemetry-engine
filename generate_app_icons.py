import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_super_app_icon():
    size = 512
    # Create base RGBA canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Mask Squircle with iOS/Android modern curve
    radius = 112
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)

    # 2. Rich Dark Obsidian to Electric Bstation Deep Blue Gradient
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    bg_draw = ImageDraw.Draw(bg)
    for y in range(size):
        ratio = y / float(size)
        # Deep space dark slate at top -> vibrant Bstation cobalt blue at bottom
        r = int(9 + ratio * 15)
        g = int(14 + ratio * 45)
        b = int(28 + ratio * 120)
        bg_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Add radial glow in center
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = 256, 250
    for r in range(240, 0, -6):
        alpha = int((1.0 - (r / 240.0)) * 95)
        glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 174, 236, alpha))
    bg = Image.alpha_composite(bg, glow)

    # Apply squircle mask
    bg.putalpha(mask)

    # 3. Ambient Rim Lighting Border (Glowing Bstation Blue + Cyan)
    border_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_img)
    border_draw.rounded_rectangle([3, 3, size - 4, size - 4], radius=radius - 2, outline=(0, 174, 236, 180), width=6)
    border_draw.rounded_rectangle([5, 5, size - 6, size - 6], radius=radius - 4, outline=(0, 240, 255, 120), width=3)

    # 4. Diagonal Specular Glass Reflection on Top Half
    glass = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glass_draw = ImageDraw.Draw(glass)
    glass_pts = [(0, 0), (size, 0), (size, 160), (0, 240)]
    glass_draw.polygon(glass_pts, fill=(255, 255, 255, 32))
    glass = Image.composite(glass, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask)

    # 5. Composite Base
    final_canvas = Image.alpha_composite(bg, border_img)
    final_canvas = Image.alpha_composite(final_canvas, glass)

    # 6. Draw Official Bstation TV Mascot & Booster Rocket Play Emblem
    emblem_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    emblem_draw = ImageDraw.Draw(emblem_layer)

    # --- Bstation TV Antennae ---
    # Left antenna
    emblem_draw.line([(188, 142), (135, 85)], fill=(0, 174, 236, 255), width=18)
    emblem_draw.ellipse([124, 74, 146, 96], fill=(0, 240, 255, 255))

    # Right antenna
    emblem_draw.line([(324, 142), (377, 85)], fill=(0, 174, 236, 255), width=18)
    emblem_draw.ellipse([366, 74, 388, 96], fill=(0, 240, 255, 255))

    # --- Bstation TV Body (Solid Vibrant Bstation Blue) ---
    tv_box = [100, 130, 412, 360]
    # Drop shadow for TV
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([100, 138, 412, 368], radius=56, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    final_canvas = Image.alpha_composite(final_canvas, shadow)

    # TV Outer Body
    emblem_draw.rounded_rectangle(tv_box, radius=56, fill=(0, 174, 236, 255), outline=(0, 240, 255, 255), width=5)

    # TV Inner Screen (Deep Gloss Dark Blue with soft cyan glow)
    screen_box = [128, 154, 384, 336]
    emblem_draw.rounded_rectangle(screen_box, radius=42, fill=(8, 22, 48, 255), outline=(0, 140, 210, 180), width=4)

    # --- Cute Bstation Eyes & Happy Smile ---
    eye_y = 224
    # Left eye
    emblem_draw.ellipse([180, eye_y - 18, 214, eye_y + 18], fill=(255, 255, 255, 255))
    # Right eye
    emblem_draw.ellipse([298, eye_y - 18, 332, eye_y + 18], fill=(255, 255, 255, 255))

    # Playful smile in center (sweet curve)
    smile_pts = [
        (238, 266),
        (248, 276),
        (256, 278),
        (264, 276),
        (274, 266)
    ]
    emblem_draw.line(smile_pts, fill=(255, 255, 255, 255), width=8, joint="curve")

    # Blush cheeks (subtle pinkish-cyan glow)
    emblem_draw.ellipse([156, eye_y + 12, 178, eye_y + 26], fill=(0, 240, 255, 110))
    emblem_draw.ellipse([334, eye_y + 12, 356, eye_y + 26], fill=(0, 240, 255, 110))

    # --- Cyber Booster Badge on Bottom Right of the TV ---
    # Fast forward / turbo rocket badge
    badge_poly = [(330, 310), (450, 375), (330, 440)]
    badge_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bs_draw = ImageDraw.Draw(badge_shadow)
    bs_draw.polygon(badge_poly, fill=(0, 0, 0, 160))
    badge_shadow = badge_shadow.filter(ImageFilter.GaussianBlur(10))
    final_canvas = Image.alpha_composite(final_canvas, badge_shadow)

    # Boost Rocket / Play Lightning
    boost_poly = [
        (350, 320),
        (430, 375),
        (350, 430),
        (375, 375)
    ]
    emblem_draw.polygon(boost_poly, fill=(0, 255, 180, 255), outline=(255, 255, 255, 240))

    # High gloss shine curve on TV Screen
    emblem_draw.arc([136, 162, 376, 290], start=190, end=350, fill=(255, 255, 255, 60), width=6)

    # Merge layers
    final_canvas = Image.alpha_composite(final_canvas, emblem_layer)

    return final_canvas

def main():
    base_dir = r"C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool"
    
    # 1. Create high-res 512x512 icon
    icon_512 = create_super_app_icon()

    # Targets to save
    targets = [
        os.path.join(base_dir, "public", "app_icon.png"),
        os.path.join(base_dir, "android_app", "app", "src", "main", "assets", "public", "app_icon.png"),
    ]

    for t in targets:
        os.makedirs(os.path.dirname(t), exist_ok=True)
        icon_512.save(t, "PNG")
        print(f"[OK] Saved 512x512 PNG -> {t}")

    # 2. Android APK launcher icon (192x192)
    android_res = os.path.join(base_dir, "android_app", "app", "src", "main", "res", "drawable", "ic_launcher.png")
    os.makedirs(os.path.dirname(android_res), exist_ok=True)
    icon_192 = icon_512.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(android_res, "PNG")
    print(f"[OK] Saved 192x192 Android icon -> {android_res}")

    # Also save in mipmap directories for Android standard
    for dens, dim in [("mipmap-hdpi", 72), ("mipmap-xhdpi", 96), ("mipmap-xxhdpi", 144), ("mipmap-xxxhdpi", 192)]:
        m_path = os.path.join(base_dir, "android_app", "app", "src", "main", "res", dens, "ic_launcher.png")
        os.makedirs(os.path.dirname(m_path), exist_ok=True)
        icon_512.resize((dim, dim), Image.Resampling.LANCZOS).save(m_path, "PNG")

    # 3. Windows ICO format for desktop executable
    ico_path = os.path.join(base_dir, "app_icon.ico")
    icon_512.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print(f"[OK] Saved Windows multi-size ICO -> {ico_path}")

    print("All app icon assets generated successfully!")

if __name__ == "__main__":
    main()
