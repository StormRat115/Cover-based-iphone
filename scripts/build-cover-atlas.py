#!/usr/bin/env python3
"""Pack generated cover / vault sprites into mobile-sized runtime atlases."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/generated/cover/src"
OUT_DIR = ROOT / "assets/generated/cover"
SOLDIER_DIR = ROOT / "assets/generated/soldier"
EXISTING = ROOT / "assets/generated"


def punch_black(im: Image.Image, thresh: int = 20, feather: int = 14) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = max(r, g, b)
            if m <= thresh:
                px[x, y] = (0, 0, 0, 0)
            elif m <= thresh + feather:
                fade = int(255 * (m - thresh) / feather)
                px[x, y] = (r, g, b, min(a, fade))
    return im


def trim(im: Image.Image, pad: int = 3) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def content_ranges(im: Image.Image, min_span: int = 28, gap: int = 8) -> list[tuple[int, int]]:
    px = im.load()
    w, h = im.size
    filled = []
    for x in range(w):
        has = False
        for y in range(h):
            if px[x, y][3] > 24:
                has = True
                break
        filled.append(has)
    ranges = []
    start = None
    empty = 0
    for x, has in enumerate(filled):
        if has:
            if start is None:
                start = x
            empty = 0
        elif start is not None:
            empty += 1
            if empty >= gap:
                end = x - empty + 1
                if end - start >= min_span:
                    ranges.append((start, end))
                start = None
                empty = 0
    if start is not None and w - start >= min_span:
        ranges.append((start, w))
    return ranges


def slice_sheet(path: Path, names: list[str]) -> dict[str, Image.Image]:
    raw = punch_black(Image.open(path))
    ranges = content_ranges(raw)
    if len(ranges) != len(names):
        # Fall back to equal columns when gap detection misses a piece.
        col_w = raw.width // len(names)
        ranges = [(i * col_w, (i + 1) * col_w) for i in range(len(names))]
    out = {}
    for name, (x0, x1) in zip(names, ranges):
        piece = trim(raw.crop((max(0, x0 - 4), 0, min(raw.width, x1 + 4), raw.height)))
        out[name] = piece
    return out


def fit(im: Image.Image, max_w: int, max_h: int) -> Image.Image:
    if im.width <= max_w and im.height <= max_h:
        return im
    scale = min(max_w / im.width, max_h / im.height)
    nw = max(1, int(im.width * scale))
    nh = max(1, int(im.height * scale))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def pack(sprites: dict[str, Image.Image], width: int = 1024, pad: int = 2):
    x = pad
    y = pad
    row_h = 0
    placed = {}
    for name, im in sprites.items():
        if x + im.width + pad > width:
            x = pad
            y += row_h + pad
            row_h = 0
        placed[name] = {"x": x, "y": y, "w": im.width, "h": im.height, "image": im}
        x += im.width + pad
        row_h = max(row_h, im.height)
    height = y + row_h + pad
    atlas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    defs = {}
    for name, info in placed.items():
        atlas.paste(info["image"], (info["x"], info["y"]), info["image"])
        defs[name] = {k: info[k] for k in ("x", "y", "w", "h")}
    return atlas, defs


def build_cover_atlas():
    sprites: dict[str, Image.Image] = {}
    sprites.update(
        slice_sheet(
            SRC / "cover-jersey-shapes.png",
            ["jersey_square", "jersey_T", "jersey_U", "jersey_L"],
        )
    )
    sprites.update(
        slice_sheet(
            SRC / "cover-sandbag-shapes.png",
            ["sandbags_square", "sandbags_T", "sandbags_U", "sandbags_L"],
        )
    )
    sprites.update(
        slice_sheet(
            SRC / "cover-setpieces.png",
            ["set_fortL", "set_barricade", "rubble_T"],
        )
    )
    sprites.update(
        slice_sheet(
            SRC / "cover-crates-rubble.png",
            ["crates_square", "crates_T", "rubble_square", "rubble_rect"],
        )
    )
    extras = {
        "jersey_rect": EXISTING / "cover-jersey-organic.png",
        "sandbags_rect": EXISTING / "cover-sandbags-organic.png",
        "crates_rect": EXISTING / "cover-crates-organic.png",
        "wreck_rect": EXISTING / "cover-sedan-organic.png",
        "crates_L": EXISTING / "cover-crates-organic.png",
    }
    for name, path in extras.items():
        sprites[name] = trim(punch_black(Image.open(path)))

    aliases = {
        "crates_U": "crates_T",
        "wreck_square": "wreck_rect",
        "wreck_T": "wreck_rect",
        "wreck_U": "wreck_rect",
        "wreck_L": "wreck_rect",
        "rubble_U": "rubble_T",
        "rubble_L": "rubble_rect",
    }

    fitted = {name: fit(im, 152, 128) for name, im in sprites.items()}
    atlas, defs = pack(fitted, width=768)
    for alias, source in aliases.items():
        defs[alias] = dict(defs[source])
    out_png = OUT_DIR / "cover-shape-atlas.png"
    atlas.save(out_png, "PNG", optimize=True)
    webp = OUT_DIR / "cover-shape-atlas.webp"
    atlas.save(webp, "WEBP", quality=80, method=6)
    (OUT_DIR / "cover-shape-atlas.json").write_text(
        json.dumps({"sprites": defs, "aliases": aliases}, indent=2)
    )
    js = ["export const COVER_ATLAS_SPRITES = {"]
    for name, box in defs.items():
        js.append(
            f'  {json.dumps(name)}: {{ x: {box["x"]}, y: {box["y"]}, w: {box["w"]}, h: {box["h"]} }},'
        )
    js.append("};")
    js.append(f"export const COVER_ATLAS_SIZE = {{ w: {atlas.width}, h: {atlas.height} }};\n")
    (ROOT / "js/coverAtlasData.js").write_text("\n".join(js))
    print(
        f"cover atlas {atlas.size} png={out_png.stat().st_size} webp={webp.stat().st_size} sprites={len(defs)}"
    )


def build_vault_sheet():
    raw = punch_black(Image.open(SRC / "soldier-vault-sheet.png"), thresh=18, feather=12)
    ranges = content_ranges(raw, min_span=40, gap=10)
    if len(ranges) != 4:
        col_w = raw.width // 4
        ranges = [(i * col_w, (i + 1) * col_w) for i in range(4)]
    frames = []
    for x0, x1 in ranges:
        frame = trim(raw.crop((max(0, x0 - 2), 0, min(raw.width, x1 + 2), raw.height)), pad=2)
        frames.append(fit(frame, 168, 168))
    cell = 168
    sheet = Image.new("RGBA", (cell * 4, cell), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        dx = i * cell + (cell - frame.width) // 2
        dy = cell - frame.height
        sheet.paste(frame, (dx, dy), frame)
    out = SOLDIER_DIR / "vault-sheet.png"
    sheet.save(out, "PNG", optimize=True)
    print(f"vault sheet {sheet.size} {out.stat().st_size} bytes")


if __name__ == "__main__":
    build_cover_atlas()
    build_vault_sheet()
