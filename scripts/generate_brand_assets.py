from __future__ import annotations

import math
import shutil
from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
BACKUP = ASSETS / "_original_before_beautify"

BLUE = (18, 115, 255)
CYAN = (31, 215, 232)
INDIGO = (28, 46, 140)
PURPLE = (113, 67, 255)
DEEP = (7, 18, 54)
WHITE = (255, 255, 255)


def ensure_backup() -> None:
    BACKUP.mkdir(exist_ok=True)
    for name in [
        "icon.png",
        "adaptive-icon.png",
        "favicon.png",
        "splash.png",
        "topic_center_outline.png",
        "titlehub.png",
        "generate_list_outline.png",
        "publish_list_outline.png",
    ]:
        src = ASSETS / name
        dst = BACKUP / name
        if src.exists() and not dst.exists():
            shutil.copy2(src, dst)


def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    candidates = []
    if weight == "bold":
        candidates.extend([
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
            "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ])
    candidates.extend([
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ])
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()


def linear_gradient(size: Tuple[int, int], stops: Iterable[Tuple[float, Tuple[int, int, int]]], vertical: bool = True) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)
    stops = sorted(stops, key=lambda x: x[0])
    total = h if vertical else w
    for i in range(total):
        t = i / max(1, total - 1)
        for idx in range(len(stops) - 1):
            t0, c0 = stops[idx]
            t1, c1 = stops[idx + 1]
            if t0 <= t <= t1:
                local = (t - t0) / max(0.0001, t1 - t0)
                color = tuple(int(c0[j] + (c1[j] - c0[j]) * local) for j in range(3))
                break
        else:
            color = stops[-1][1]
        if vertical:
            draw.line([(0, i), (w, i)], fill=color)
        else:
            draw.line([(i, 0), (i, h)], fill=color)
    return img


def add_soft_blob(img: Image.Image, center: Tuple[int, int], radius: int, color: Tuple[int, int, int, int]) -> None:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = center
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(radius // 2))
    img.alpha_composite(layer)


def draw_signal(draw: ImageDraw.ImageDraw, cx: int, cy: int, width: int, color: Tuple[int, int, int, int]) -> None:
    bars = 15
    gap = width / (bars + 4)
    max_h = width * 0.22
    for i in range(bars):
        x = cx - width / 2 + (i + 2) * gap
        envelope = math.sin((i + 1) / (bars + 1) * math.pi)
        h = max_h * (0.35 + 0.65 * envelope)
        draw.rounded_rectangle((x - 5, cy - h, x + 5, cy + h), radius=6, fill=color)


def draw_mark(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], foreground=(255, 255, 255, 255), accent=(31, 215, 232, 255)) -> None:
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    stem_w = int(w * 0.23)
    stem_x = x0 + int(w * 0.13)
    draw.rounded_rectangle((stem_x, y0 + int(h * 0.08), stem_x + stem_w, y1 - int(h * 0.08)), radius=int(stem_w * 0.22), fill=foreground)
    mid_x = x0 + int(w * 0.45)
    mid_y = y0 + int(h * 0.50)
    upper = [(mid_x, mid_y), (x1 - int(w * 0.12), y0 + int(h * 0.08)), (x1 - int(w * 0.31), y0 + int(h * 0.08)), (x0 + int(w * 0.38), mid_y)]
    lower = [(mid_x, mid_y), (x1 - int(w * 0.10), y1 - int(h * 0.08)), (x1 - int(w * 0.31), y1 - int(h * 0.08)), (x0 + int(w * 0.38), mid_y)]
    draw.polygon(upper, fill=foreground)
    draw.polygon(lower, fill=foreground)
    diamond = [
        (x0 + int(w * 0.43), mid_y),
        (x0 + int(w * 0.52), y0 + int(h * 0.41)),
        (x0 + int(w * 0.61), mid_y),
        (x0 + int(w * 0.52), y0 + int(h * 0.59)),
    ]
    draw.polygon(diamond, fill=(255, 255, 255, 238))
    draw_signal(draw, x0 + int(w * 0.52), mid_y, int(w * 0.78), accent)


def make_icon(size: int, path: Path) -> None:
    scale = 2
    s = size * scale
    bg = linear_gradient((s, s), [(0, (14, 165, 233)), (0.48, (37, 99, 235)), (1, (88, 28, 135))], vertical=False).convert("RGBA")
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle((36 * scale, 36 * scale, s - 36 * scale, s - 36 * scale), radius=220 * scale, fill=255)
    icon = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    icon.alpha_composite(bg)
    add_soft_blob(icon, (int(s * 0.22), int(s * 0.24)), int(s * 0.28), (74, 222, 255, 130))
    add_soft_blob(icon, (int(s * 0.85), int(s * 0.18)), int(s * 0.22), (167, 139, 250, 120))
    add_soft_blob(icon, (int(s * 0.72), int(s * 0.86)), int(s * 0.24), (20, 184, 166, 90))
    d = ImageDraw.Draw(icon)
    for i in range(7):
        y = int(s * (0.16 + i * 0.105))
        d.line((int(s * 0.12), y, int(s * 0.88), y + int(s * 0.08)), fill=(255, 255, 255, 16), width=2 * scale)
    draw_mark(d, (int(s * 0.18), int(s * 0.20), int(s * 0.86), int(s * 0.80)))
    icon.putalpha(mask)
    shadow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sm = Image.new("L", (s, s), 0)
    ImageDraw.Draw(sm).rounded_rectangle((45 * scale, 45 * scale, s - 45 * scale, s - 45 * scale), radius=210 * scale, fill=110)
    shadow.putalpha(sm.filter(ImageFilter.GaussianBlur(18 * scale)))
    canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(icon)
    canvas = canvas.resize((size, size), Image.Resampling.LANCZOS)
    canvas.save(path)


def make_favicon() -> None:
    make_icon(256, ASSETS / "favicon.png")


def make_splash() -> None:
    w, h = 1284, 2778
    img = linear_gradient((w, h), [(0, (6, 18, 50)), (0.42, (13, 87, 190)), (1, (12, 179, 214))], vertical=True).convert("RGBA")
    add_soft_blob(img, (int(w * 0.18), int(h * 0.15)), 360, (59, 130, 246, 95))
    add_soft_blob(img, (int(w * 0.88), int(h * 0.28)), 420, (34, 211, 238, 100))
    add_soft_blob(img, (int(w * 0.30), int(h * 0.82)), 520, (124, 58, 237, 82))

    d = ImageDraw.Draw(img)
    for i in range(20):
        y = int(h * 0.09 + i * h * 0.035)
        x0 = int(w * 0.06)
        x1 = int(w * 0.94)
        d.line((x0, y, x1, y + int(h * 0.08)), fill=(255, 255, 255, 18), width=2)
    for i in range(36):
        x = int(w * (0.08 + (i % 9) * 0.105))
        y = int(h * (0.16 + (i // 9) * 0.055))
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(255, 255, 255, 55))

    card_w = 430
    card_x = (w - card_w) // 2
    card_y = int(h * 0.29)
    card = Image.new("RGBA", (card_w, card_w), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((0, 0, card_w, card_w), radius=112, fill=(255, 255, 255, 42), outline=(255, 255, 255, 85), width=2)
    inner = Image.new("RGBA", (card_w, card_w), (0, 0, 0, 0))
    ImageDraw.Draw(inner).rounded_rectangle((34, 34, card_w - 34, card_w - 34), radius=92, fill=(255, 255, 255, 230))
    card.alpha_composite(inner)
    cd = ImageDraw.Draw(card)
    mark_box = (82, 92, card_w - 72, card_w - 92)
    draw_mark(cd, mark_box, foreground=(18, 99, 230, 255), accent=(22, 199, 220, 255))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((card_x + 18, card_y + 32, card_x + card_w - 18, card_y + card_w + 18), radius=112, fill=(0, 20, 80, 100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    img.alpha_composite(shadow)
    img.alpha_composite(card, (card_x, card_y))

    title_f = font(84, "bold")
    sub_f = font(38, "regular")
    small_f = font(30, "regular")
    title = "康桥智推"
    subtitle = "AI 驱动的全域营销增长中枢"
    hint = "选题洞察 · 智能生成 · 多平台发布"
    for text, fnt, yy, alpha in [
        (title, title_f, card_y + card_w + 112, 255),
        (subtitle, sub_f, card_y + card_w + 224, 226),
        (hint, small_f, card_y + card_w + 306, 198),
    ]:
        bbox = d.textbbox((0, 0), text, font=fnt)
        tw = bbox[2] - bbox[0]
        d.text(((w - tw) / 2, yy), text, font=fnt, fill=(255, 255, 255, alpha))

    pill = "Smart Marketing OS"
    pill_f = font(28, "bold")
    bbox = d.textbbox((0, 0), pill, font=pill_f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    px, py = int((w - tw) / 2 - 42), int(h * 0.79)
    d.rounded_rectangle((px, py, px + tw + 84, py + th + 34), radius=36, fill=(255, 255, 255, 36), outline=(255, 255, 255, 90), width=1)
    d.text((px + 42, py + 15), pill, font=pill_f, fill=(255, 255, 255, 226))

    img.save(ASSETS / "splash.png")


def draw_tab_topic(d: ImageDraw.ImageDraw, s: int) -> None:
    color = (0, 0, 0, 255)
    d.rounded_rectangle((110, 126, 402, 386), radius=42, outline=color, width=34)
    d.line((178, 224, 334, 224), fill=color, width=30)
    d.line((178, 292, 286, 292), fill=color, width=30)
    d.rounded_rectangle((328, 92, 420, 184), radius=30, fill=color)


def draw_tab_history(d: ImageDraw.ImageDraw, s: int) -> None:
    color = (0, 0, 0, 255)
    d.rounded_rectangle((124, 94, 388, 418), radius=36, outline=color, width=32)
    d.line((178, 174, 332, 174), fill=color, width=26)
    d.line((178, 244, 332, 244), fill=color, width=26)
    d.line((178, 314, 282, 314), fill=color, width=26)
    d.arc((268, 276, 424, 432), start=204, end=525, fill=color, width=28)
    d.polygon([(388, 278), (424, 288), (399, 318)], fill=color)


def draw_tab_generate(d: ImageDraw.ImageDraw, s: int) -> None:
    color = (0, 0, 0, 255)
    d.rounded_rectangle((112, 112, 400, 400), radius=52, outline=color, width=30)
    d.polygon([(256, 156), (284, 232), (360, 256), (284, 282), (256, 356), (228, 282), (152, 256), (228, 232)], fill=color)
    d.ellipse((358, 130, 396, 168), fill=color)


def draw_tab_publish(d: ImageDraw.ImageDraw, s: int) -> None:
    color = (0, 0, 0, 255)
    d.polygon([(104, 254), (422, 106), (352, 408), (262, 314), (186, 370)], outline=color)
    d.line((104, 254, 262, 314), fill=color, width=30)
    d.line((262, 314, 422, 106), fill=color, width=30)
    d.line((186, 370, 225, 286), fill=color, width=28)


def make_tab_icon(path: Path, drawer) -> None:
    s = 512
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    drawer(d, s)
    img.save(path)


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    ensure_backup()
    make_icon(1024, ASSETS / "icon.png")
    make_icon(1024, ASSETS / "adaptive-icon.png")
    make_favicon()
    make_splash()
    make_tab_icon(ASSETS / "topic_center_outline.png", draw_tab_topic)
    make_tab_icon(ASSETS / "titlehub.png", draw_tab_history)
    make_tab_icon(ASSETS / "generate_list_outline.png", draw_tab_generate)
    make_tab_icon(ASSETS / "publish_list_outline.png", draw_tab_publish)
    print("Generated brand assets in", ASSETS)


if __name__ == "__main__":
    main()
