# -*- coding: utf-8 -*-
"""
우리 아이 오늘의 미션 - 홈화면 앱 아이콘 생성기.

Pillow 만으로 테마 중립적인 아이콘(밝은 파스텔 그라데이션 + 금색 별)을 그려서
PWA / iOS / 파비콘 사이즈의 PNG 를 public/ 폴더에 출력합니다. (외부 SVG 변환기 불필요)

  python scripts/make-icons.py

별(성취의 상징)은 우주 테마와 동화 테마 어디에도 치우치지 않아 중립적입니다.
부드러운 가장자리를 위해 4배(SS) 크기로 그린 뒤 LANCZOS 로 축소합니다.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public"
OUT.mkdir(parents=True, exist_ok=True)

SS = 4  # supersample factor

# ---- 중립 파스텔 팔레트 (cool→warm, 어느 테마에도 안 치우침) -------------------
BG_TL = (124, 134, 246)   # 좌상단 페리윙클 인디고
BG_MID = (124, 205, 214)  # 가운데 민트
BG_BR = (255, 150, 186)   # 우하단 코랄 핑크
STAR_TOP = (255, 227, 140)  # 별 위쪽 (밝은 금)
STAR_BOT = (247, 178, 54)   # 별 아래쪽 (진한 금/amber)
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def grad3(t):
    """3-스톱(인디고→민트→핑크) 보간."""
    if t < 0.5:
        return lerp(BG_TL, BG_MID, t / 0.5)
    return lerp(BG_MID, BG_BR, (t - 0.5) / 0.5)


def diagonal_bg(w):
    """좌상→우하 대각선 파스텔 그라데이션 배경."""
    g = 192
    base = Image.new("RGB", (g, g))
    px = base.load()
    for y in range(g):
        for x in range(g):
            t = (x + y) / (2 * (g - 1))
            px[x, y] = grad3(t)
    base = base.resize((w, w), Image.BICUBIC).convert("RGBA")
    # 상단 중앙 은은한 흰 글로우로 입체감
    glow = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r = w * 0.42
    gd.ellipse([w * 0.5 - r, w * 0.08 - r, w * 0.5 + r, w * 0.08 + r],
               fill=WHITE + (60,))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=w * 0.10))
    base.alpha_composite(glow)
    return base


def soft_dots(bg, w, safe):
    """중앙 별을 피해 은은한 흰 점(장식)을 몇 개 뿌린다."""
    pts = [(0.20, 0.22, 0.016), (0.82, 0.20, 0.012), (0.24, 0.80, 0.013),
           (0.80, 0.78, 0.017), (0.14, 0.52, 0.010), (0.88, 0.50, 0.011)]
    d = ImageDraw.Draw(bg)
    pad = (1 - safe) / 2
    for fx, fy, fr in pts:
        if fx < pad or fx > 1 - pad or fy < pad or fy > 1 - pad:
            continue
        x, y, r = fx * w, fy * w, fr * w
        d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE + (150,))


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


def star_points(cx, cy, R, inner=0.46, rot=-math.pi / 2):
    pts = []
    for i in range(10):
        r = R if i % 2 == 0 else R * inner
        ang = rot + i * math.pi / 5
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


def draw_star(w, frac):
    """가운데 통통한 금색 별(흰 테두리 + 하이라이트)을 RGBA 레이어로 반환."""
    L = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    cx, cy = w * 0.5, w * 0.515
    R = w * frac / 2

    # 흰 테두리(별을 살짝 키워 뒤에 깔기)
    rim = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    ImageDraw.Draw(rim).polygon(star_points(cx, cy, R * 1.075), fill=WHITE + (255,))
    L.alpha_composite(rim)

    # 금색 그라데이션 별 (마스크로 세로 그라데이션 채움)
    mask = Image.new("L", (w, w), 0)
    ImageDraw.Draw(mask).polygon(star_points(cx, cy, R), fill=255)
    L.alpha_composite(vgrad_masked(w, mask, STAR_TOP, STAR_BOT))

    # 위쪽 절반 은은한 하이라이트
    hi = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hi)
    hd.ellipse([cx - R * 0.62, cy - R * 0.78, cx + R * 0.62, cy + R * 0.10],
               fill=WHITE + (90,))
    hi = hi.filter(ImageFilter.GaussianBlur(radius=w * 0.015))
    hil = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    hil.paste(hi, (0, 0), mask)  # 별 영역 안으로만
    L.alpha_composite(hil)
    return L


def sparkle(d, cx, cy, r, col):
    d.polygon([(cx, cy - r), (cx + r * 0.28, cy - r * 0.28),
               (cx + r, cy), (cx + r * 0.28, cy + r * 0.28),
               (cx, cy + r), (cx - r * 0.28, cy + r * 0.28),
               (cx - r, cy), (cx - r * 0.28, cy - r * 0.28)], fill=col)


def build(size, mode):
    w = size * SS
    star_frac = 0.52 if mode == "maskable" else 0.68
    safe = 0.80 if mode == "maskable" else 0.98

    bg = diagonal_bg(w)
    soft_dots(bg, w, safe)

    st = draw_star(w, star_frac)

    # 별 실루엣 기반 부드러운 그림자(아래로 살짝)
    alpha = st.split()[3]
    shadow = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    shadow.paste(Image.new("RGBA", (w, w), (60, 40, 90, 255)), (0, 0), alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=w * 0.03))
    off = int(w * 0.02)
    bg.alpha_composite(scale_alpha(shadow, 0.35), (0, off))
    bg.alpha_composite(st)

    # 반짝이 장식 (마스커블/소형은 생략해 깔끔하게)
    if mode != "maskable" and size >= 64:
        sd = ImageDraw.Draw(bg)
        sparkle(sd, w * 0.76, w * 0.26, w * 0.05, WHITE + (240,))
        sparkle(sd, w * 0.26, w * 0.74, w * 0.035, WHITE + (210,))

    return bg.resize((size, size), Image.LANCZOS).convert("RGB")


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
        build(size, mode).save(OUT / name)
        print("wrote", name, f"{size}x{size}", mode)


if __name__ == "__main__":
    main()
