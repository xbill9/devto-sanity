"""Brawndo cover: a parody can and "It's got what plants crave."

Drawn at 2x and downsampled to dev.to's displayed ratio (1376x578, 2.381:1),
then written under a content-addressed name so no proxy has cached the URL.

    python3 articles/brawndo/make_cover.py
"""
import hashlib
import math
import pathlib
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1376, 578
S = 2
HERE = pathlib.Path(__file__).parent
FONTS = pathlib.Path("/usr/share/fonts/truetype")
BLACK = str(FONTS / "lato/Lato-Black.ttf")
COND = str(FONTS / "roboto/unhinted/RobotoCondensed-Bold.ttf")
COND_I = str(FONTS / "roboto/unhinted/RobotoCondensed-BoldItalic.ttf")

BG = (14, 18, 14)
INK = (240, 244, 232)
MUTED = (150, 164, 140)
LIME = (170, 230, 40)
GREEN = (34, 120, 44)
DARK_GREEN = (12, 52, 20)
SOIL = (58, 40, 26)


def f(path, px):
    return ImageFont.truetype(path, px * S)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def background():
    im = Image.new("RGB", (W * S, H * S), BG)
    small = Image.new("L", (W // 8, H // 8), 0)
    cx, cy = W * 0.80 / 8, H * 0.45 / 8
    for y in range(small.height):
        for x in range(small.width):
            r = math.hypot((x - cx) / (W * 0.42 / 8), (y - cy) / (H * 0.9 / 8))
            small.putpixel((x, y), int(200 * max(0.0, 1 - r) ** 1.3))
    glow = small.resize(im.size, Image.BICUBIC)
    im.paste(Image.new("RGB", im.size, (40, 90, 30)), mask=glow)
    return im


def can(size):
    """A tall can with a Brawndo-ish label, drawn upright on its own layer."""
    cw, ch = size
    layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rim = int(ch * 0.05)
    body = (0, rim, cw, ch - rim)

    # Cylinder shading: dark edges, a bright stripe left of centre.
    for x in range(cw):
        t = x / (cw - 1)
        shade = 0.35 + 0.65 * math.sin(math.pi * t) ** 0.6
        hi = max(0.0, 1 - abs(t - 0.32) / 0.07)
        c = lerp(DARK_GREEN, GREEN, shade)
        c = lerp(c, (200, 245, 170), hi * 0.55)
        d.line((x, body[1], x, body[3]), fill=c + (255,))

    # Black label bands top and bottom.
    band = int(ch * 0.13)
    for y0 in (rim + int(ch * 0.04), ch - rim - int(ch * 0.04) - band):
        for x in range(cw):
            t = x / (cw - 1)
            v = int(10 + 28 * math.sin(math.pi * t) ** 0.6)
            d.line((x, y0, x, y0 + band), fill=(v, v, v, 255))

    # Lids: metallic ellipses.
    for y, flip in ((0, 1), (ch - 2 * rim, -1)):
        d.ellipse((0, y, cw, y + 2 * rim), fill=(150, 156, 150, 255))
        d.ellipse((cw * 0.06, y + rim * 0.25, cw * 0.94, y + rim * 1.75),
                  fill=(196, 202, 196, 255) if flip == 1 else (120, 126, 120, 255))
    d.rounded_rectangle((cw * 0.42, rim * 0.55, cw * 0.62, rim * 1.2),
                        radius=int(rim * 0.3), fill=(120, 126, 120, 255))

    # Lightning bolt.
    cx, top, bh = cw * 0.50, ch * 0.27, ch * 0.46
    bolt = [(cx + 0.10 * cw, top), (cx - 0.20 * cw, top + 0.55 * bh),
            (cx - 0.01 * cw, top + 0.55 * bh), (cx - 0.12 * cw, top + bh),
            (cx + 0.22 * cw, top + 0.40 * bh), (cx + 0.02 * cw, top + 0.40 * bh),
            (cx + 0.14 * cw, top)]
    d.polygon([(x + 5 * S, y + 5 * S) for x, y in bolt], fill=(0, 0, 0, 120))
    d.polygon(bolt, fill=LIME + (255,), outline=(20, 30, 10, 255))

    # Wordmark, set vertically like the prop.
    avail = ch * 0.54
    px = int(cw * 0.40)
    while ImageFont.truetype(BLACK, px).getlength("BRAWNDO") > avail:
        px -= 2
    font = ImageFont.truetype(BLACK, px)
    word = Image.new("RGBA", (int(avail + 8 * S), int(px * 1.25)), (0, 0, 0, 0))
    wd = ImageDraw.Draw(word)
    tw = wd.textlength("BRAWNDO", font=font)
    wd.text(((word.width - tw) / 2 + 3 * S, 3 * S), "BRAWNDO", font=font, fill=(0, 0, 0, 170))
    wd.text(((word.width - tw) / 2, 0), "BRAWNDO", font=font, fill=INK + (255,),
            stroke_width=2 * S, stroke_fill=(10, 20, 10, 255))
    word = word.rotate(90, expand=True, resample=Image.BICUBIC)
    layer.alpha_composite(word, (int(cw / 2 - word.width / 2), int(ch * 0.50 - word.height / 2)))

    # Tagline in the bottom band.
    tf = ImageFont.truetype(COND_I, int(cw * 0.085))
    tag = "THE THIRST MUTILATOR"
    tw = d.textlength(tag, font=tf)
    y = ch - rim - int(ch * 0.04) - band / 2 - tf.size * 0.6
    d.text(((cw - tw) / 2, y), tag, font=tf, fill=LIME + (255,))
    tf2 = ImageFont.truetype(COND, int(cw * 0.075))
    top_tag = "ELECTROLYTES"
    tw = d.textlength(top_tag, font=tf2)
    d.text(((cw - tw) / 2, rim + int(ch * 0.04) + band / 2 - tf2.size * 0.6),
           top_tag, font=tf2, fill=INK + (255,))
    return layer


def crops(im, x0, x1, ground):
    """Wilted sprouts in dry soil: the problem Joe's plan fixes."""
    d = ImageDraw.Draw(im)
    rng = random.Random(7)
    fade = 160 * S
    for x in range(x0 - fade, x1):
        t = min(1.0, max(0.0, (x - x0 + fade) / fade))
        base = im.getpixel((x, ground))
        d.line((x, ground, x, H * S), fill=lerp(base, SOIL, t))
    for x in range(x0, x1, 7 * S):
        d.line((x, ground + rng.randint(0, 3) * S, x + rng.randint(-4, 4) * S,
                ground + rng.randint(8, 30) * S), fill=(78, 56, 36), width=S)
    for x in range(x0 + 20 * S, x1, 54 * S):
        h = rng.randint(44, 72) * S
        tip = (x + rng.randint(14, 24) * S, ground - h + rng.randint(18, 26) * S)
        stem = [(x, ground), (x + 2 * S, ground - h * 0.6), (x + 8 * S, ground - h), tip]
        d.line(stem, fill=(140, 128, 60), width=3 * S, joint="curve")
        d.ellipse((tip[0] - 7 * S, tip[1] - 3 * S, tip[0] + 7 * S, tip[1] + 11 * S),
                  fill=(150, 120, 50))
        lx = x + 2 * S
        ly = ground - h * 0.45
        d.polygon([(lx, ly), (lx - 18 * S, ly + 10 * S), (lx - 4 * S, ly + 4 * S)],
                  fill=(128, 110, 46))


def main():
    im = background()
    crops(im, int(W * 0.56 * S), W * S, int((H - 60) * S))

    c = can((200 * S, 400 * S)).rotate(-14, expand=True, resample=Image.BICUBIC)
    shadow = Image.new("RGBA", c.size, (0, 0, 0, 0))
    shadow.putalpha(c.getchannel("A").point(lambda a: a * 0.55))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14 * S))
    im = im.convert("RGBA")
    cx, cy = int(W * 0.79 * S - c.width / 2), int(H * 0.47 * S - c.height / 2)
    im.alpha_composite(shadow, (cx + 22 * S, cy + 26 * S))
    im.alpha_composite(c, (cx, cy))

    d = ImageDraw.Draw(im)
    L = 64 * S
    d.text((L, 64 * S), "SANITY CHALLENGE  ·  PATH TWO", font=f(COND, 22), fill=LIME)
    y = 112 * S
    for line in ("It's got what", "plants crave."):
        d.text((L, y), line, font=f(BLACK, 84), fill=INK)
        y += 96 * S
    d.rectangle((L, y + 16 * S, L + 88 * S, y + 22 * S), fill=LIME)
    d.text((L, y + 46 * S), "An agent proposes water. A Cabinet approves.",
           font=f(COND, 30), fill=INK)
    d.text((L, y + 84 * S), "Sanity Workflows waters the crops.",
           font=f(COND, 30), fill=INK)
    d.text((L, (H - 58) * S), "Sanity Studio  ·  Workflows  ·  App SDK  ·  Claude agent",
           font=f(COND, 20), fill=MUTED)

    out = im.convert("RGB").resize((W, H), Image.LANCZOS)
    tmp = HERE / "devto-cover.tmp.jpg"
    out.save(tmp, quality=90, optimize=True)
    digest = hashlib.sha256(tmp.read_bytes()).hexdigest()[:8]
    final = HERE / f"devto-cover.{digest}.jpg"
    tmp.replace(final)
    print(f"wrote {final.name}  {W}x{H}  {final.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
