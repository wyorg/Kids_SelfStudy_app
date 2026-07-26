# -*- coding: utf-8 -*-
"""
민건이의 우주 미션 - 홈화면 앱 아이콘 생성기.

Pillow 만으로 귀여운 우주 로켓 아이콘을 그려서 PWA / iOS / 파비콘 사이즈의
PNG 를 public/ 폴더에 출력합니다. (외부 SVG 변환기 불필요)

  python scripts/make-icons.py

부드러운 가장자리를 위해 4배(SS) 크기로 그린 뒤 LANCZOS 로 축소합니다.
"""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public"
OUT.mkdir(parents=True, exist_ok=True)

SS = 4  # supersample factor

# ---- theme colors (앱과 동일 계열) -------------------------------------------
INNER = (22, 38, 86)     # 중심 인디고 글로우
OUTER = (5, 7, 20)       # #050714 딥 스페이스
CYAN = (0, 242, 255)     # #00f2ff
CYAN_DK = (0, 150, 190)
GOLD = (255, 204, 51)    # #ffcc33
ORANGE = (255, 122, 0)
PURPLE = (139, 92, 246)  # #8b5cf6
BODY_TOP = (255, 255, 255)
BODY_BOT = (206, 220, 240)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_bg(w):
    """중심이 살짝 위에 있는 방사형 스페이스 배경."""
    g = 180
    base = Image.new("RGB", (g, g))
    px = base.load()
    cx, cy = g * 0.5, g * 0.40
    maxd = math.hypot(g * 0.72, g * 0.78)
    for y in range(g):
        for x in range(g):
            d = min(1.0, math.hypot(x - cx, y - cy) / maxd)
            px[x, y] = lerp(INNER, OUTER, d ** 1.25)
    return base.resize((w, w), Image.BICUBIC).convert("RGBA")


def soft_blob(w, center, radius, color, alpha):
    """부드러운 성운 느낌의 컬러 글로우."""
    layer = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius],
              fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius=w * 0.09))


def add_stars(bg, w, safe):
    """중앙 로켓 영역을 피해서 반짝이는 별을 뿌린다."""
    rnd = random.Random(7)
    d = ImageDraw.Draw(bg)
    cx, cy = w * 0.5, w * 0.5
    lo, hi = (0.5 - safe / 2), (0.5 + safe / 2)
    placed = 0
    tries = 0
    while placed < 22 and tries < 400:
        tries += 1
        x = rnd.uniform(lo, hi) * w
        y = rnd.uniform(lo, hi) * w
        # 로켓이 앉는 중앙 세로 기둥은 피한다
        if abs(x - cx) < w * 0.16 and abs(y - cy) < w * 0.34:
            continue
        r = rnd.uniform(0.004, 0.012) * w
        bright = rnd.randint(190, 255)
        col = (bright, bright, min(255, bright + 10))
        if r > w * 0.009:
            glow = Image.new("RGBA", (w, w), (0, 0, 0, 0))
            gd = ImageDraw.Draw(glow)
            gd.ellipse([x - r * 2.4, y - r * 2.4, x + r * 2.4, y + r * 2.4],
                       fill=col + (110,))
            glow = glow.filter(ImageFilter.GaussianBlur(radius=w * 0.01))
            bg.alpha_composite(glow)
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (255,))
        placed += 1


def vgrad_masked(size, mask, top, bot):
    """세로 그라데이션을 mask 모양대로 칠한 RGBA 레이어."""
    w = size
    grad = Image.new("RGB", (1, w))
    gp = grad.load()
    for i in range(w):
        gp[0, i] = lerp(top, bot, i / (w - 1))
    grad = grad.resize((w, w)).convert("RGBA")
    out = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def scale_alpha(img, factor):
    r, g, b, a = img.split()
    a = a.point(lambda v: int(v * factor))
    return Image.merge("RGBA", (r, g, b, a))


def draw_rocket(w, h_frac):
    """위를 향한 귀여운 로켓을 RGBA 레이어에 그려서 반환."""
    L = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)

    cx = w * 0.5
    RH = w * h_frac                 # 로켓 전체 높이
    cy = w * 0.5 - RH * 0.04        # 살짝 위로
    top = cy - RH / 2
    bot = cy + RH / 2

    BW = RH * 0.40                  # 몸통 폭
    nose_h = RH * 0.30
    body_top = top + nose_h
    body_bot = bot - RH * 0.16      # 몸통 아래 (아래는 불꽃/노즐)

    # --- 불꽃 (몸통 뒤, 맨 아래) ---
    flame_top = body_bot - RH * 0.02
    for col, spread, length in ((GOLD, 0.60, 0.235), (ORANGE, 0.40, 0.175),
                                ((255, 246, 200), 0.19, 0.10)):
        fw = BW * spread
        fl = RH * length
        d.polygon([(cx - fw, flame_top),
                   (cx + fw, flame_top),
                   (cx, flame_top + fl)], fill=col + (255,))

    # --- 핀 (날개, 몸통 뒤) ---
    fin_col = CYAN_DK
    fin_top = body_bot - RH * 0.14
    fin_out = BW * 0.98
    fin_dy = RH * 0.15
    d.polygon([(cx - BW * 0.42, fin_top),
               (cx - fin_out, body_bot + fin_dy),
               (cx - BW * 0.42, body_bot + RH * 0.02)],
              fill=fin_col + (255,))
    d.polygon([(cx + BW * 0.42, fin_top),
               (cx + fin_out, body_bot + fin_dy),
               (cx + BW * 0.42, body_bot + RH * 0.02)],
              fill=fin_col + (255,))

    # --- 몸통 (흰색 캡슐, 세로 그라데이션) ---
    body_mask = Image.new("L", (w, w), 0)
    bm = ImageDraw.Draw(body_mask)
    bm.rounded_rectangle([cx - BW / 2, body_top, cx + BW / 2, body_bot],
                         radius=BW * 0.42, fill=255)
    L.alpha_composite(vgrad_masked(w, body_mask, BODY_TOP, BODY_BOT))

    # --- 노즈콘 (시안, 둥근 삼각형) ---
    nose_mask = Image.new("L", (w, w), 0)
    nm = ImageDraw.Draw(nose_mask)
    nm.polygon([(cx, top),
                (cx - BW / 2, body_top + BW * 0.10),
                (cx + BW / 2, body_top + BW * 0.10)], fill=255)
    nm.ellipse([cx - BW / 2, body_top - BW * 0.05,
                cx + BW / 2, body_top + BW * 0.25], fill=255)
    L.alpha_composite(vgrad_masked(w, nose_mask, CYAN, CYAN_DK))

    # 노즈-몸통 경계 골드 링
    d.rounded_rectangle([cx - BW / 2, body_top + BW * 0.02,
                         cx + BW / 2, body_top + BW * 0.20],
                        radius=BW * 0.09, fill=GOLD + (255,))

    # --- 창문 (골드 링 + 하늘색 유리 + 하이라이트) ---
    wr = BW * 0.30
    wcy = body_top + RH * 0.20
    d.ellipse([cx - wr, wcy - wr, cx + wr, wcy + wr], fill=GOLD + (255,))
    ir = wr * 0.74
    d.ellipse([cx - ir, wcy - ir, cx + ir, wcy + ir], fill=(150, 232, 255, 255))
    d.ellipse([cx - ir, wcy - ir, cx + ir * 0.15, wcy - ir * 0.15],
              fill=(210, 246, 255, 255))
    hr = wr * 0.26
    d.ellipse([cx - wr * 0.34 - hr, wcy - wr * 0.34 - hr,
               cx - wr * 0.34 + hr, wcy - wr * 0.34 + hr],
              fill=(255, 255, 255, 235))

    # --- 몸통 세로 하이라이트 (은은한 실린더 광택) ---
    hl = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    hd.rounded_rectangle([cx - BW * 0.28, body_top + BW * 0.26,
                          cx - BW * 0.14, body_bot - BW * 0.14],
                         radius=BW * 0.08, fill=(255, 255, 255, 95))
    hl = hl.filter(ImageFilter.GaussianBlur(radius=w * 0.012))
    L.alpha_composite(hl)

    return L


def sparkle(d, cx, cy, r, col):
    d.polygon([(cx, cy - r), (cx + r * 0.28, cy - r * 0.28),
               (cx + r, cy), (cx + r * 0.28, cy + r * 0.28),
               (cx, cy + r), (cx - r * 0.28, cy + r * 0.28),
               (cx - r, cy), (cx - r * 0.28, cy - r * 0.28)], fill=col)


def build(size, mode):
    w = size * SS
    rocket_frac = 0.44 if mode == "maskable" else 0.58
    safe = 0.80 if mode == "maskable" else 0.98

    bg = radial_bg(w)
    bg.alpha_composite(soft_blob(w, (w * 0.30, w * 0.66), w * 0.34, PURPLE, 70))
    bg.alpha_composite(soft_blob(w, (w * 0.72, w * 0.30), w * 0.30, CYAN, 55))
    add_stars(bg, w, safe)

    rk = draw_rocket(w, rocket_frac)

    # 로켓 실루엣 기반 네온 글로우
    alpha = rk.split()[3]
    glow = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    glow.paste(Image.new("RGBA", (w, w), CYAN + (255,)), (0, 0), alpha)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=w * 0.035))
    bg.alpha_composite(scale_alpha(glow, 0.55))
    bg.alpha_composite(rk)

    # 반짝이 장식
    sd = ImageDraw.Draw(bg)
    if mode != "maskable":
        sparkle(sd, w * 0.70, w * 0.30, w * 0.045, GOLD + (255,))
        sparkle(sd, w * 0.30, w * 0.72, w * 0.032, (255, 255, 255, 235))
    else:
        sparkle(sd, w * 0.66, w * 0.36, w * 0.030, GOLD + (255,))

    img = bg.resize((size, size), Image.LANCZOS).convert("RGB")
    return img


def main():
    targets = [
        ("icon-192.png", 192, "any"),
        ("icon-512.png", 512, "any"),
        ("icon-maskable-192.png", 192, "maskable"),
        ("icon-maskable-512.png", 512, "maskable"),
        ("apple-touch-icon.png", 180, "any"),
        ("favicon-48.png", 48, "any"),
        ("favicon-32.png", 32, "any"),
    ]
    for name, size, mode in targets:
        img = build(size, mode)
        img.save(OUT / name)
        print("wrote", name, f"{size}x{size}", mode)


if __name__ == "__main__":
    main()
