#!/usr/bin/env python3
"""piksel-sprite.py <inn> <ut.png> <ikon|BxH>: a transparent pixel sprite from a model image drawn on
flat magenta (#FF00FF). Keys out the magenta, crops to the drawing, scales it down by area averaging
(alpha = coverage, hard edge at 50 %), snaps every colour to the shared Snøfall palette and writes RGBA.

  ikon   32×32 for the Ugleposten pocket: the object fits 30 px and is centred, 1 px dark outline.
  BxH    a figure overlay sized in scene pixels (scenes are 4× their logical pixels): fit B/4×H/4
         logical pixels, keep the drawing's aspect, scale back up 4× nearest. No outline (the scenes
         have none).

ffmpeg decodes the input (any format); the rest is stdlib, there is no PIL on this machine.
  piksel-sprite.py --tett <ikon.png>...   crop finished 32×32 icons to the drawing and refit it to 30 px
  piksel-sprite.py --selvtest
"""
import struct
import subprocess
import sys
import zlib
from pathlib import Path

# 40 colours from palettegen over klokketarnet/torget/julebodene/antenne-tarn, plus the reds, greens,
# brass, tin and whites the scenes rarely use but the items need (berries, mitt, leaf, bell, tin can),
# and skin tones (without them faces snap to pink and yellow blotches)
PALETT = [int(c[1:], 16) for c in (
    "#010001 #070406 #0e2751 #112953 #130a0b #18151e #18243b #1e395d #242d42 #251109 #295074 #341c14 "
    "#36679c #3c6475 #3d3c43 #482717 #4b7ebf #537e77 #577fa6 #5b361f #664f45 #7794c2 #7d481d #8e6c51 "
    "#9097a8 #9a5927 #9ac6de #a5cee5 #ad915f #afb6c4 #b0692e #cab098 #cdebf6 #cf7e37 #def5fb #dff4fc "
    "#e7dcbd #e8a44a #f1f8d7 #fbd27c "
    "#7a1a1a #b3202a #e04040 #f08080 #2e7d4f #5aa860 #1d4a30 #ffffff #f4f1e8 #c8a24a #e3b23c #8a7a66 "
    "#c9b99a #ff9933 #ffd84a #6b6b70 #b8b8be #3a3128 #d9d9dc #4a4a50 "
    "#f6dcc4 #eec3a0 #dba07c #c27e5e #9c5c44 #e8b0a0").split()]
PALETT_RGB = [((c >> 16) & 255, (c >> 8) & 255, c & 255) for c in PALETT]
KONTUR = (0x18, 0x15, 0x1e)
SKALA = 4  # scene pixels per logical pixel
FIT = 30  # icon object size in the 32 px square


def les(path):
    """(w, h, bytes rgb24) via ffmpeg."""
    wh = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                         "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True).stdout.strip()
    w, h = (int(x) for x in wh.split(",")[:2])
    d = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       capture_output=True, check=True).stdout
    return w, h, d


def skriv_png(path, w, h, rgba: bytes):
    raw = b"".join(b"\0" + rgba[y * w * 4:(y + 1) * w * 4] for y in range(h))

    def chunk(t, b):
        return struct.pack(">I", len(b)) + t + b + struct.pack(">I", zlib.crc32(t + b) & 0xffffffff)
    Path(path).write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                           + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def magenta(r, g, b) -> bool:
    # loose on purpose: anti-aliased edges blend towards magenta and must not leave a pink fringe
    return r - g > 90 and b - g > 90


def bbox(w, h, d):
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        row = d[y * w * 3:(y + 1) * w * 3]
        for x in range(w):
            if not magenta(row[x * 3], row[x * 3 + 1], row[x * 3 + 2]):
                x0, x1 = min(x0, x), max(x1, x)
                y0, y1 = min(y0, y), max(y1, y)
    return (x0, y0, x1 + 1, y1 + 1) if x1 >= 0 else None


def naermest(r, g, b):
    return min(PALETT_RGB, key=lambda c: (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2)


def nedskaler(w, h, d, box, tw, th):
    """tw×th cells over box; each cell: mean colour of its non-magenta pixels, opaque if they cover ≥ 50 %."""
    x0, y0, x1, y1 = box
    out = []
    for cy in range(th):
        ya, yb = y0 + (y1 - y0) * cy // th, max(y0 + (y1 - y0) * (cy + 1) // th, y0 + (y1 - y0) * cy // th + 1)
        for cx in range(tw):
            xa, xb = x0 + (x1 - x0) * cx // tw, max(x0 + (x1 - x0) * (cx + 1) // tw, x0 + (x1 - x0) * cx // tw + 1)
            n = sr = sg = sb = 0
            tot = 0
            for y in range(ya, yb):
                row = d[(y * w + xa) * 3:(y * w + xb) * 3]
                for i in range(0, len(row), 3):
                    tot += 1
                    r, g, b = row[i], row[i + 1], row[i + 2]
                    if not magenta(r, g, b):
                        n += 1
                        sr += r
                        sg += g
                        sb += b
            out.append(naermest(sr // n, sg // n, sb // n) if n * 2 >= tot and n else None)
    return out


def kontur(cells, tw, th):
    """1 px dark outline where a transparent cell touches an opaque one (4-neighbours)."""
    out = list(cells)
    for y in range(th):
        for x in range(tw):
            if cells[y * tw + x] is None and any(
                    0 <= nx < tw and 0 <= ny < th and cells[ny * tw + nx] is not None
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))):
                out[y * tw + x] = KONTUR
    return out


def sprite(inn, ut, spec):
    w, h, d = les(inn)
    box = bbox(w, h, d)
    if not box:
        sys.exit(f"piksel-sprite.py: bare magenta i {inn}")
    bw, bh = box[2] - box[0], box[3] - box[1]
    if spec == "ikon":
        W = H = 32
        fit, opp, outline = FIT, 1, True
        mw, mh = fit, fit
    else:
        W, H = (int(v) for v in spec.lower().split("x"))
        mw, mh = max(W // SKALA, 1), max(H // SKALA, 1)
        opp, outline = SKALA, False
    s = min(mw / bw, mh / bh)
    tw, th = max(1, round(bw * s)), max(1, round(bh * s))
    if outline:  # leave room for the outline inside FIT
        tw, th = max(1, tw - 2), max(1, th - 2)
    cells = nedskaler(w, h, d, box, tw, th)
    if outline:
        cells = kontur([None] * (tw + 2) + sum(([None] + cells[y * tw:(y + 1) * tw] + [None] for y in range(th)), [])
                       + [None] * (tw + 2), tw + 2, th + 2)
        tw, th = tw + 2, th + 2
    # canvas: icons centred in 32×32; figures exactly the fitted size, scaled up
    cw, ch = (W, H) if spec == "ikon" else (tw * opp, th * opp)
    ox, oy = ((cw - tw * opp) // 2, (ch - th * opp) // 2)
    px = bytearray(cw * ch * 4)
    for y in range(th):
        for x in range(tw):
            c = cells[y * tw + x]
            if c is None:
                continue
            for dy in range(opp):
                for dx in range(opp):
                    i = ((oy + y * opp + dy) * cw + ox + x * opp + dx) * 4
                    px[i:i + 4] = bytes((*c, 255))
    skriv_png(ut, cw, ch, bytes(px))
    print(f"{ut} {cw}×{ch}")


def tett(path):
    """Crop a finished RGBA icon to its opaque pixels and refit nearest-neighbour to FIT, centred in 32×32."""
    W, H = 32, 32
    d = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
                       capture_output=True, check=True).stdout
    on = [(i % W, i // W) for i in range(W * H) if d[i * 4 + 3]]
    if not on:
        return
    x0, y0 = min(x for x, _ in on), min(y for _, y in on)
    bw, bh = max(x for x, _ in on) - x0 + 1, max(y for _, y in on) - y0 + 1
    s = min(FIT / bw, FIT / bh)
    if s >= 2:
        s = int(s)  # whole steps keep every pixel square
    tw, th = max(1, round(bw * s)), max(1, round(bh * s))
    ox, oy = (W - tw) // 2, (H - th) // 2
    px = bytearray(W * H * 4)
    for y in range(th):
        for x in range(tw):
            sx, sy = x0 + min(bw - 1, int(x / s)), y0 + min(bh - 1, int(y / s))
            i = ((oy + y) * W + ox + x) * 4
            px[i:i + 4] = d[(sy * W + sx) * 4:(sy * W + sx) * 4 + 4]
    skriv_png(path, W, H, bytes(px))
    print(f"{path} {bw}×{bh} -> {tw}×{th}")


def selvtest():
    import tempfile
    with tempfile.TemporaryDirectory() as t:
        inn, ut = Path(t) / "inn.png", Path(t) / "ut.png"
        # 64×64 magenta with a 32×16 red box at (16, 24)
        w = h = 64
        px = bytearray()
        for y in range(h):
            for x in range(w):
                px += bytes((200, 30, 30, 255)) if 16 <= x < 48 and 24 <= y < 40 else bytes((255, 0, 255, 255))
        skriv_png(inn, w, h, bytes(px))
        assert bbox(w, h, les(inn)[2]) == (16, 24, 48, 40)
        sprite(inn, ut, "ikon")
        W, H, d = les(ut)
        assert (W, H) == (32, 32)
        # the red lands on a palette red; magenta never survives
        cols = {d[i:i + 3] for i in range(0, len(d), 3)}
        assert bytes((0xb3, 0x20, 0x2a)) in cols, cols
        assert not any(magenta(*c) for c in cols), cols
        sprite(inn, ut, "80x40")  # 20×10 logical, aspect 2:1 kept → 20×10 ×4
        assert les(ut)[:2] == (80, 40), les(ut)[:2]
        sprite(inn, ut, "40x80")  # width-bound: 10×5 logical
        assert les(ut)[:2] == (40, 20), les(ut)[:2]
        sprite(inn, ut, "ikon")
        tett(ut)  # already at FIT: unchanged size
        a = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ut), "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
                           capture_output=True, check=True).stdout
        assert max(i % 32 for i in range(1024) if a[i * 4 + 3]) - min(i % 32 for i in range(1024) if a[i * 4 + 3]) + 1 == FIT
    print("selvtest ok")


if __name__ == "__main__":
    if "--selvtest" in sys.argv:
        selvtest()
    elif sys.argv[1:2] == ["--tett"]:
        for f in sys.argv[2:]:
            tett(f)
    elif len(sys.argv) == 4:
        sprite(*sys.argv[1:])
    else:
        sys.exit(__doc__)
