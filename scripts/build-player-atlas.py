#!/usr/bin/env python3
"""Build a solid, binary-alpha player/ally soldier atlas.

Source art is the light-background rifle sheet plus the death strip.
Every living-body pixel is written at alpha 255 with interior holes filled
so the road cannot show through. Cells keep padding so head and boots stay
inside the frame.
"""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RIFLE_SHEET = ROOT / "assets/rifle_soldier_sheet.png"
DEATH_SHEET = ROOT / "assets/soldier_death_sheet.png"
VAULT_SHEET = ROOT / "assets/generated/soldier/vault-sheet.png"
OUT_DIR = ROOT / "assets/generated/soldier"

CELL = 160
COLS = 6
PAD = 18
STATES = [
    "idle",
    "run",
    "tallCover",
    "lowCover",
    "standShoot",
    "crouchShoot",
    "reload",
    "death",
]
FPS = {
    "idle": 3.2,
    "run": 9,
    "tallCover": 3,
    "lowCover": 3,
    "standShoot": 10,
    "crouchShoot": 10,
    "reload": 8,
    "death": 7,
}
LABEL_X = 188
MIN_AREA = 1400


def is_paper(rgb: np.ndarray) -> np.ndarray:
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    return (lum >= 214) & (sat <= 20)


def dilate(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    padded = np.pad(mask, radius, constant_values=False)
    out = np.zeros_like(mask)
    h, w = mask.shape
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dx * dx + dy * dy > radius * radius:
                continue
            out |= padded[
                radius + dy : radius + dy + h,
                radius + dx : radius + dx + w,
            ]
    return out


def erode(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    return ~dilate(~mask, radius)


def close_mask(mask: np.ndarray, radius: int = 2) -> np.ndarray:
    return erode(dilate(mask, radius), radius)


def fill_holes(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    exterior = np.zeros((h, w), dtype=np.uint8)
    q = deque()

    def add(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not mask[y, x] and not exterior[y, x]:
            exterior[y, x] = 1
            q.append((x, y))

    for x in range(w):
        add(x, 0)
        add(x, h - 1)
    for y in range(h):
        add(0, y)
        add(w - 1, y)
    while q:
        x, y = q.popleft()
        add(x - 1, y)
        add(x + 1, y)
        add(x, y - 1)
        add(x, y + 1)
    holes = (~mask) & (exterior == 0)
    return mask | holes


def nearest_body_color(rgb: np.ndarray, original: np.ndarray, filled: np.ndarray) -> np.ndarray:
    """Paint newly filled pixels with a nearby original body color."""
    out = rgb.copy()
    if not filled.any() or not original.any():
        return out
    seed_lum = rgb.mean(axis=2)
    seed = original & (seed_lum < 168)
    if not seed.any():
        seed = original
    body = rgb[seed]
    median = np.median(body, axis=0).astype(np.uint8)
    if median.mean() > 170:
        median = np.array([62, 56, 46], dtype=np.uint8)
    known = seed.copy()
    color = rgb.astype(np.int16)
    for _ in range(6):
        if not ((filled) & (~known)).any():
            break
        grow = dilate(known, 1) & filled
        new = grow & (~known)
        if not new.any():
            break
        acc = np.zeros(rgb.shape, dtype=np.int32)
        cnt = np.zeros(rgb.shape[:2], dtype=np.int32)
        h, w = known.shape
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ys, xs = np.where(new)
            sy = ys + dy
            sx = xs + dx
            inbound = (sy >= 0) & (sy < h) & (sx >= 0) & (sx < w)
            ok = inbound.copy()
            ok[inbound] = known[sy[inbound], sx[inbound]]
            acc[ys[ok], xs[ok]] += color[sy[ok], sx[ok]]
            cnt[ys[ok], xs[ok]] += 1
        hit = new & (cnt > 0)
        out[hit] = (acc[hit] // cnt[hit, None]).astype(np.uint8)
        known |= hit
    leftover = filled & (~known)
    if leftover.any():
        out[leftover] = median
    return out


def strip_paper_fringe(rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Drop milky anti-aliased paper pixels clinging to the silhouette."""
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    fringe = mask & ((lum >= 168) & (sat <= 28))
    # Keep bright but saturated highlights (visor, muzzle, metal).
    keep_hot = mask & (sat >= 40) & (lum >= 168)
    return (mask & ~fringe) | keep_hot


def solidify(rgb: np.ndarray, mask: np.ndarray) -> Image.Image:
    mask = strip_paper_fringe(rgb, mask)
    # Open once to kill 1px paper speckles, then close+fill so the body is solid.
    mask = dilate(erode(mask, 1), 1)
    closed = fill_holes(close_mask(mask, 2))
    added = closed & (~mask)
    color = nearest_body_color(rgb, mask, added)
    # Never write paper-white into the body.
    lum = color.mean(axis=2)
    paperish = closed & (lum >= 188)
    if paperish.any():
        color = color.copy()
        color[paperish] = (58, 52, 44)
    # Lift only near-black interior so asphalt cannot read through dark plates.
    lift = closed & (color.mean(axis=2) < 38)
    if lift.any():
        color = color.astype(np.int16)
        color[lift] = np.clip(color[lift] + 28, 0, 255)
        color = color.astype(np.uint8)
    rgba = np.zeros((rgb.shape[0], rgb.shape[1], 4), dtype=np.uint8)
    rgba[closed, :3] = color[closed]
    rgba[closed, 3] = 255
    # Kill leftover paper-halo pixels on the silhouette (opaque but milky).
    body = rgba[:, :, 3] >= 255
    edge = body & dilate(~body, 1)
    elum = rgba[:, :, :3].mean(axis=2)
    esat = rgba[:, :, :3].max(axis=2) - rgba[:, :, :3].min(axis=2)
    drop = edge & (elum >= 90) & (esat <= 38)
    rgba[drop] = 0
    return Image.fromarray(rgba, "RGBA")


def components(
    mask: np.ndarray, min_area: int = MIN_AREA, min_cx: int = 0
) -> list[tuple[int, int, int, int, int]]:
    h, w = mask.shape
    seen = np.zeros((h, w), dtype=np.uint8)
    boxes = []
    ys, xs = np.where(mask)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if seen[y, x]:
            continue
        q = deque([(x, y)])
        seen[y, x] = 1
        minx = maxx = x
        miny = maxy = y
        area = 0
        while q:
            cx, cy = q.popleft()
            area += 1
            if cx < minx:
                minx = cx
            elif cx > maxx:
                maxx = cx
            if cy < miny:
                miny = cy
            elif cy > maxy:
                maxy = cy
            for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = 1
                    q.append((nx, ny))
        if area >= min_area and (minx + maxx) * 0.5 >= min_cx:
            boxes.append((minx, miny, maxx, maxy, area))
    return boxes


def cluster_rows(boxes: list[tuple[int, int, int, int, int]]) -> list[list[tuple]]:
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) * 0.5)
    rows: list[list[tuple]] = []
    for box in boxes:
        cy = (box[1] + box[3]) * 0.5
        if rows:
            prev = rows[-1]
            prev_cy = sum((b[1] + b[3]) * 0.5 for b in prev) / len(prev)
            if abs(cy - prev_cy) < 46:
                prev.append(box)
                continue
        rows.append([box])
    for row in rows:
        row.sort(key=lambda b: b[0])
    rows = [row for row in rows if len(row) >= 4]
    rows.sort(key=lambda row: sum((b[1] + b[3]) * 0.5 for b in row) / len(row))
    return rows


def crop_solid(
    rgb: np.ndarray,
    box: tuple[int, int, int, int, int],
    grow: int = 6,
    mask_full: np.ndarray | None = None,
) -> Image.Image:
    x0, y0, x1, y1, _ = box
    x0 = max(0, x0 - grow)
    y0 = max(0, y0 - grow)
    x1 = min(rgb.shape[1] - 1, x1 + grow)
    y1 = min(rgb.shape[0] - 1, y1 + grow)
    tile = rgb[y0 : y1 + 1, x0 : x1 + 1]
    if mask_full is not None:
        mask = mask_full[y0 : y1 + 1, x0 : x1 + 1].copy()
    else:
        mask = ~is_paper(tile)
        lum = tile.mean(axis=2)
        sat = tile.max(axis=2) - tile.min(axis=2)
        # Drop the soft ground shadow under the boots.
        mask &= ~((lum >= 188) & (sat <= 14))
    return solidify(tile, mask)


def fit_cell(sprite: Image.Image, cell: int = CELL, pad: int = PAD) -> Image.Image:
    arr = np.array(sprite)
    alpha = arr[:, :, 3] >= 255
    if not alpha.any():
        return Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    ys, xs = np.where(alpha)
    cropped = sprite.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    max_w = cell - pad * 2
    max_h = cell - pad * 2
    fit = min(1.0, max_w / cropped.width, max_h / cropped.height)
    dw = max(1, min(max_w, int(round(cropped.width * fit))))
    dh = max(1, min(max_h, int(round(cropped.height * fit))))
    fitted = cropped.resize((dw, dh), Image.Resampling.NEAREST)
    # Nearest keeps binary alpha. Re-threshold after resize just in case.
    fa = np.array(fitted)
    body = fa[:, :, 3] >= 128
    fa[body, 3] = 255
    fa[~body] = 0
    fitted = Image.fromarray(fa, "RGBA")
    cell_img = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    dx = (cell - dw) // 2
    dy = cell - pad - dh
    cell_img.paste(fitted, (dx, dy), fitted)
    return cell_img


def pad_frames(frames: list[Image.Image], count: int) -> list[Image.Image]:
    if not frames:
        raise ValueError("no frames")
    out = list(frames)
    while len(out) < count:
        # Ping-pong extras so a short row still has unique motion.
        idx = len(out) % len(frames)
        ping = idx if ((len(out) // len(frames)) % 2 == 0) else len(frames) - 1 - idx
        out.append(frames[ping])
    return out[:count]


def shift_opaque(sprite: Image.Image, dx: int, dy: int) -> Image.Image:
    arr = np.array(sprite)
    h, w, _ = arr.shape
    out = np.zeros_like(arr)
    x0 = max(0, dx)
    y0 = max(0, dy)
    x1 = min(w, w + dx)
    y1 = min(h, h + dy)
    sx0 = max(0, -dx)
    sy0 = max(0, -dy)
    out[y0:y1, x0:x1] = arr[sy0 : sy0 + (y1 - y0), sx0 : sx0 + (x1 - x0)]
    return Image.fromarray(out, "RGBA")


def draw_magazine(sprite: Image.Image, x: int, y: int) -> Image.Image:
    img = sprite.copy()
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        (x, y, x + 8, y + 14),
        radius=1,
        fill=(42, 40, 34, 255),
        outline=(22, 20, 16, 255),
    )
    draw.rectangle((x + 2, y + 1, x + 6, y + 3), fill=(58, 52, 40, 255))
    return img


def make_reload_frames(idle: list[Image.Image]) -> list[Image.Image]:
    arr = np.array(idle[0])
    ys, xs = np.where(arr[:, :, 3] >= 255)
    cx = int(np.percentile(xs, 62))
    cy = int(np.percentile(ys, 48))
    ready = idle[0]
    dip = shift_opaque(idle[min(1, len(idle) - 1)], 2, 6)
    mag_out = draw_magazine(
        shift_opaque(idle[min(2, len(idle) - 1)], 0, 8), cx + 6, cy + 18
    )
    mag_in = draw_magazine(
        shift_opaque(idle[min(3, len(idle) - 1)], 1, 5), cx + 4, cy + 6
    )
    rack = shift_opaque(idle[min(1, len(idle) - 1)], 6, -4)
    seat = idle[min(4, len(idle) - 1)] if len(idle) > 4 else idle[0]
    return [ready, dip, mag_out, mag_in, rack, seat]


def extract_rifle_rows() -> dict[str, list[Image.Image]]:
    rgb = np.array(Image.open(RIFLE_SHEET).convert("RGB"))
    mask = ~is_paper(rgb)
    boxes = components(mask, min_cx=LABEL_X)
    rows = cluster_rows(boxes)
    if len(rows) < 7:
        raise RuntimeError(f"expected 7 rifle rows, found {len(rows)}")
    # Sheet order: idle, run, lowCover, tallCover, shoot, crouchShoot, standShoot
    mapped = {
        "idle": rows[0],
        "run": rows[1],
        "lowCover": rows[2],
        "tallCover": rows[3],
        "shoot": rows[4],
        "crouchShoot": rows[5],
        "standShoot": rows[6],
    }
    frames: dict[str, list[Image.Image]] = {}
    for name, row in mapped.items():
        sprites = [fit_cell(crop_solid(rgb, box)) for box in row[:COLS]]
        frames[name] = pad_frames(sprites, COLS)
        print(f"  rifle {name}: {len(row)} source -> {len(frames[name])} cells")
    return frames


def extract_death_frames() -> list[Image.Image]:
    im = Image.open(DEATH_SHEET).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]
    lum = rgb.mean(axis=2)
    mask = (alpha >= 56) & (lum < 200)
    boxes = components(mask, min_area=4000, min_cx=0)
    boxes.sort(key=lambda b: b[0])
    if len(boxes) < 4:
        # Fallback: 6 equal columns if blob detect fails.
        fw = arr.shape[1] // 6
        boxes = []
        for i in range(6):
            sl = mask[:, i * fw : (i + 1) * fw]
            if not sl.any():
                continue
            ys, xs = np.where(sl)
            boxes.append((i * fw + xs.min(), ys.min(), i * fw + xs.max(), ys.max(), int(sl.sum())))
    frames = []
    for box in boxes[:COLS]:
        frames.append(fit_cell(crop_solid(rgb, box, grow=4, mask_full=mask)))
    print(f"  death: {len(boxes)} blobs -> {len(frames)} frames")
    return pad_frames(frames, COLS)


def harden_vault() -> None:
    """Snap vault pixels to binary alpha and fill holes. Keep authored framing."""
    if not VAULT_SHEET.exists():
        return
    arr = np.array(Image.open(VAULT_SHEET).convert("RGBA"))
    cols = 4
    cw = arr.shape[1] // cols
    out = np.zeros_like(arr)
    for i in range(cols):
        tile = arr[:, i * cw : (i + 1) * cw]
        rgb = tile[:, :, :3]
        alpha = tile[:, :, 3]
        mask = alpha >= 48
        closed = fill_holes(close_mask(mask, 1))
        added = closed & (~mask)
        color = nearest_body_color(rgb, mask, added)
        rgba = np.zeros_like(tile)
        rgba[closed, :3] = color[closed]
        rgba[closed, 3] = 255
        out[:, i * cw : (i + 1) * cw] = rgba
    Image.fromarray(out, "RGBA").save(VAULT_SHEET, "PNG", optimize=True)
    print(f"  vault hardened bytes={VAULT_SHEET.stat().st_size}")


def cell_stats(atlas: Image.Image) -> dict:
    arr = np.array(atlas)
    mid = int(((arr[:, :, 3] > 0) & (arr[:, :, 3] < 255)).sum())
    leftover = int(((arr[:, :, 3] == 0) & ((arr[:, :, 0] | arr[:, :, 1] | arr[:, :, 2]) > 0)).sum())
    holes = 0
    pads = []
    for row in range(len(STATES)):
        for col in range(COLS):
            tile = arr[row * CELL : (row + 1) * CELL, col * CELL : (col + 1) * CELL]
            body = tile[:, :, 3] >= 255
            closed = fill_holes(body)
            holes += int((closed & (~body)).sum())
            if body.any():
                ys, xs = np.where(body)
                pads.append(
                    {
                        "state": STATES[row],
                        "col": col,
                        "padL": int(xs.min()),
                        "padR": int(CELL - 1 - xs.max()),
                        "padT": int(ys.min()),
                        "padB": int(CELL - 1 - ys.max()),
                        "fill": round(float(body.mean()), 4),
                    }
                )
    return {
        "midAlpha": mid,
        "leftoverRgb": leftover,
        "interiorHoles": holes,
        "minPad": min(min(p["padL"], p["padR"], p["padT"], p["padB"]) for p in pads),
        "cells": pads,
    }


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("extracting rifle rows")
    rows = extract_rifle_rows()
    print("building reload + death")
    rows["reload"] = [fit_cell(frame) for frame in make_reload_frames(rows["idle"])]
    rows["death"] = extract_death_frames()

    atlas = Image.new("RGBA", (COLS * CELL, len(STATES) * CELL), (0, 0, 0, 0))
    for r, name in enumerate(STATES):
        frames = pad_frames(rows[name], COLS)
        for c, frame in enumerate(frames):
            atlas.paste(frame, (c * CELL, r * CELL), frame)

    stats = cell_stats(atlas)
    if stats["midAlpha"] or stats["leftoverRgb"] or stats["interiorHoles"]:
        raise SystemExit(
            f"atlas not solid: mid={stats['midAlpha']} leftover={stats['leftoverRgb']} holes={stats['interiorHoles']}"
        )
    if stats["minPad"] < 12:
        raise SystemExit(f"atlas padding too tight: minPad={stats['minPad']}")

    png = OUT_DIR / "player-ally-atlas.png"
    webp = OUT_DIR / "player-ally-atlas.webp"
    atlas.save(png, "PNG", optimize=True)
    atlas.save(webp, "WEBP", quality=82, method=6)
    meta = {
        "cols": COLS,
        "rows": len(STATES),
        "cell": CELL,
        "padding": PAD,
        "states": STATES,
        "fps": FPS,
        "opaque": True,
        "binaryAlpha": True,
        "interiorHoles": 0,
        "file": "player-ally-atlas.png",
        "webp": "player-ally-atlas.webp",
        "pngBytes": png.stat().st_size,
        "webpBytes": webp.stat().st_size,
    }
    (OUT_DIR / "player-ally-atlas.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(
        f"wrote {atlas.size} png={png.stat().st_size} webp={webp.stat().st_size} "
        f"minPad={stats['minPad']}"
    )
    harden_vault()


def np_to_img(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(arr, "RGBA")


if __name__ == "__main__":
    build()
