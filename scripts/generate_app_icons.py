#!/usr/bin/env python3
"""Generate high quality tank app icons for Web and Android (Capacitor mipmap assets)."""

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PUBLIC.mkdir(exist_ok=True)

def create_tank_icon_image(size: int) -> Image.Image:
    """Renders a stylized tank icon image of given size (e.g. 512x512)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    scale = size / 512.0

    # Rounded rectangle background (Dark Slate / Slate 950)
    bg_color = (11, 18, 32, 255)
    border_color = (245, 158, 11, 255) # Gold/Amber
    border_width = int(12 * scale)
    corner_radius = int(80 * scale)

    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_radius, fill=bg_color, outline=border_color, width=border_width)

    # Inner glow / subtle grid lines
    grid_color = (251, 191, 36, 18)
    grid_spacing = int(32 * scale)
    for x in range(grid_spacing, size, grid_spacing):
        draw.line([(x, 0), (x, size)], fill=grid_color, width=1)
    for y in range(grid_spacing, size, grid_spacing):
        draw.line([(0, y), (size, y)], fill=grid_color, width=1)

    # Tank shadow
    shadow_box = [int(80 * scale), int(340 * scale), int(432 * scale), int(410 * scale)]
    draw.ellipse(shadow_box, fill=(2, 6, 23, 180))

    # Treads (Bottom)
    tread_y1 = int(310 * scale)
    tread_y2 = int(370 * scale)
    tread_x1 = int(90 * scale)
    tread_x2 = int(422 * scale)
    draw.rounded_rectangle([tread_x1, tread_y1, tread_x2, tread_y2], radius=int(28 * scale), fill=(31, 41, 55, 255), outline=(15, 23, 42, 255), width=int(6 * scale))

    # Tread wheels
    wheel_y = int((tread_y1 + tread_y2) / 2)
    num_wheels = 5
    wheel_radius = int(18 * scale)
    for i in range(num_wheels):
        wx = int(tread_x1 + (tread_x2 - tread_x1) * (i + 1) / (num_wheels + 1))
        draw.ellipse([wx - wheel_radius, wheel_y - wheel_radius, wx + wheel_radius, wheel_y + wheel_radius], fill=(156, 163, 175, 255), outline=(15, 23, 42, 255), width=int(4 * scale))
        draw.ellipse([wx - int(6 * scale), wheel_y - int(6 * scale), wx + int(6 * scale), wheel_y + int(6 * scale)], fill=(55, 65, 81, 255))

    # Lower Armor Hull (Blue main battle tank armor)
    hull_x1 = int(110 * scale)
    hull_y1 = int(245 * scale)
    hull_x2 = int(402 * scale)
    hull_y2 = int(320 * scale)
    draw.rounded_rectangle([hull_x1, hull_y1, hull_x2, hull_y2], radius=int(14 * scale), fill=(37, 99, 235, 255), outline=(15, 23, 42, 255), width=int(6 * scale))

    # Hull highlights / panel line
    draw.line([(hull_x1 + int(20 * scale), hull_y1 + int(20 * scale)), (hull_x2 - int(20 * scale), hull_y1 + int(20 * scale))], fill=(147, 197, 253, 255), width=int(4 * scale))

    # Tank Cannon Barrel
    barrel_x1 = int(290 * scale)
    barrel_y1 = int(188 * scale)
    barrel_x2 = int(455 * scale)
    barrel_y2 = int(218 * scale)
    draw.rounded_rectangle([barrel_x1, barrel_y1, barrel_x2, barrel_y2], radius=int(6 * scale), fill=(30, 58, 138, 255), outline=(15, 23, 42, 255), width=int(5 * scale))
    # Muzzle tip
    draw.rectangle([barrel_x2 - int(12 * scale), barrel_y1 - int(3 * scale), barrel_x2, barrel_y2 + int(3 * scale)], fill=(245, 158, 11, 255))

    # Turret (Upper Body)
    turret_x1 = int(160 * scale)
    turret_y1 = int(165 * scale)
    turret_x2 = int(330 * scale)
    turret_y2 = int(255 * scale)
    draw.rounded_rectangle([turret_x1, turret_y1, turret_x2, turret_y2], radius=int(32 * scale), fill=(147, 197, 253, 255), outline=(15, 23, 42, 255), width=int(6 * scale))

    # Hatch / Commander Cupola
    hatch_x1 = int(210 * scale)
    hatch_y1 = int(145 * scale)
    hatch_x2 = int(270 * scale)
    hatch_y2 = int(170 * scale)
    draw.rounded_rectangle([hatch_x1, hatch_y1, hatch_x2, hatch_y2], radius=int(8 * scale), fill=(30, 58, 138, 255), outline=(15, 23, 42, 255), width=int(4 * scale))

    # Gold Star Emblem on Turret
    star_center_x = int(245 * scale)
    star_center_y = int(210 * scale)
    star_r_out = int(24 * scale)
    star_r_in = int(10 * scale)
    points = []
    for i in range(10):
        r = star_r_out if i % 2 == 0 else star_r_in
        angle = i * math.pi / 5 - math.pi / 2
        points.append((star_center_x + r * math.cos(angle), star_center_y + r * math.sin(angle)))
    draw.polygon(points, fill=(251, 191, 36, 255), outline=(180, 83, 9, 255))

    # Top Star Emblem (Army Crest)
    crest_x = int(256 * scale)
    crest_y = int(75 * scale)
    crest_r1 = int(32 * scale)
    crest_r2 = int(14 * scale)
    c_pts = []
    for i in range(10):
        r = crest_r1 if i % 2 == 0 else crest_r2
        angle = i * math.pi / 5 - math.pi / 2
        c_pts.append((crest_x + r * math.cos(angle), crest_y + r * math.sin(angle)))
    draw.polygon(c_pts, fill=(245, 158, 11, 255), outline=(254, 243, 199, 255))

    # Text Banner: IRON FRONT
    text_y = int(430 * scale)
    try:
        font_size = int(40 * scale)
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    draw.text((crest_x, text_y), "IRON FRONT", fill=(245, 158, 11, 255), font=font, anchor="mm")

    return img

def create_svg_icon() -> str:
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="armor" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#60a5fa"/>
      <stop offset="1" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="turretGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#93c5fd"/>
      <stop offset="1" stop-color="#3b82f6"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="url(#bg)" stroke="#f59e0b" stroke-width="12"/>

  <!-- Tactical Grid -->
  <path d="M0 64h512M0 128h512M0 192h512M0 256h512M0 320h512M0 384h512M0 448h512" stroke="#facc15" stroke-width="1" opacity="0.08"/>
  <path d="M64 0v512M128 0v512M192 0v512M256 0v512M320 0v512M384 0v512M448 0v512" stroke="#facc15" stroke-width="1" opacity="0.08"/>

  <!-- Top Star Emblem -->
  <path d="M256 42l15 32 35 5-25 25 6 35-31-16-31 16 6-35-25-25 35-5z" fill="#fbbf24" stroke="#fff" stroke-width="3" filter="url(#glow)"/>

  <!-- Shadow -->
  <ellipse cx="256" cy="380" rx="180" ry="24" fill="#020617" opacity="0.6"/>

  <!-- Treads -->
  <rect x="90" y="310" width="332" height="60" rx="30" fill="#1e293b" stroke="#0f172a" stroke-width="8"/>
  <circle cx="140" cy="340" r="18" fill="#9ca3af" stroke="#0f172a" stroke-width="4"/>
  <circle cx="198" cy="340" r="18" fill="#9ca3af" stroke="#0f172a" stroke-width="4"/>
  <circle cx="256" cy="340" r="18" fill="#9ca3af" stroke="#0f172a" stroke-width="4"/>
  <circle cx="314" cy="340" r="18" fill="#9ca3af" stroke="#0f172a" stroke-width="4"/>
  <circle cx="372" cy="340" r="18" fill="#9ca3af" stroke="#0f172a" stroke-width="4"/>

  <!-- Main Hull -->
  <rect x="110" y="245" width="292" height="75" rx="16" fill="url(#armor)" stroke="#0f172a" stroke-width="8"/>
  <line x1="130" y1="262" x2="382" y2="262" stroke="#93c5fd" stroke-width="5" stroke-linecap="round"/>

  <!-- Cannon Barrel -->
  <rect x="290" y="188" width="165" height="30" rx="6" fill="#1e3a8a" stroke="#0f172a" stroke-width="6"/>
  <rect x="443" y="185" width="15" height="36" rx="3" fill="#f59e0b"/>

  <!-- Turret -->
  <rect x="160" y="165" width="170" height="90" rx="36" fill="url(#turretGrad)" stroke="#0f172a" stroke-width="8"/>
  <rect x="210" y="145" width="60" height="25" rx="8" fill="#1e3a8a" stroke="#0f172a" stroke-width="5"/>

  <!-- Turret Star -->
  <path d="M245 190l7 14 16 2-11 11 3 16-15-8-15 8 3-16-11-11 16-2z" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>

  <!-- Title Text -->
  <text x="256" y="445" text-anchor="middle" font-family="'Oxanium', 'Arial Black', Impact, sans-serif" font-weight="900" font-size="40" fill="#f59e0b" letter-spacing="2">IRON FRONT</text>
</svg>
"""

def main():
    print("Generating tank app icons...")

    # Save SVG
    svg_content = create_svg_icon()
    (PUBLIC / "icon.svg").write_text(svg_content)
    print("Saved public/icon.svg")

    # Generate PNG icons
    img512 = create_tank_icon_image(512)
    img512.save(PUBLIC / "icon-512.png", "PNG")
    print("Saved public/icon-512.png")

    img192 = create_tank_icon_image(192)
    img192.save(PUBLIC / "icon-192.png", "PNG")
    print("Saved public/icon-192.png")

    img_apple = create_tank_icon_image(180)
    img_apple.save(PUBLIC / "apple-touch-icon.png", "PNG")
    print("Saved public/apple-touch-icon.png")

    img_fav = create_tank_icon_image(64)
    img_fav.save(PUBLIC / "favicon.png", "PNG")
    print("Saved public/favicon.png")

    # If Android res exists, write mipmap icons
    android_res = ROOT / "android" / "app" / "src" / "main" / "res"
    if android_res.exists():
        mipmap_sizes = {
            "mipmap-mdpi": 48,
            "mipmap-hdpi": 72,
            "mipmap-xhdpi": 96,
            "mipmap-xxhdpi": 144,
            "mipmap-xxxhdpi": 192,
        }
        for folder, sz in mipmap_sizes.items():
            target_dir = android_res / folder
            target_dir.mkdir(parents=True, exist_ok=True)
            icon_img = create_tank_icon_image(sz)
            icon_img.save(target_dir / "ic_launcher.png", "PNG")
            icon_img.save(target_dir / "ic_launcher_round.png", "PNG")
            icon_img.save(target_dir / "ic_launcher_foreground.png", "PNG")
            print(f"Saved Android {folder} launcher icons ({sz}x{sz})")

if __name__ == "__main__":
    main()
