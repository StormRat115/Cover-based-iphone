#!/usr/bin/env python3
"""Build a compact RGBA sprite sheet for the Gorehorn charger."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

W, H = 128, 112
COLS, ROWS = 4, 5
SHEET_W, SHEET_H = W * COLS, H * ROWS


def chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, width: int, height: int, pixels: bytearray) -> None:
    raw = b"".join(b"\x00" + bytes(pixels[y * width * 4 : (y + 1) * width * 4]) for y in range(height))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


class Pix:
    def __init__(self, width: int, height: int):
        self.w = width
        self.h = height
        self.p = bytearray(width * height * 4)

    def _blend(self, i: int, r: int, g: int, b: int, a: int) -> None:
        if a <= 0:
            return
        if a >= 255:
            self.p[i : i + 4] = bytes((r, g, b, 255))
            return
        da = self.p[i + 3]
        out_a = a + da * (255 - a) // 255
        if out_a <= 0:
            return
        inv = 255 - a
        self.p[i] = max(0, min(255, (r * a + self.p[i] * da * inv // 255) // out_a))
        self.p[i + 1] = max(0, min(255, (g * a + self.p[i + 1] * da * inv // 255) // out_a))
        self.p[i + 2] = max(0, min(255, (b * a + self.p[i + 2] * da * inv // 255) // out_a))
        self.p[i + 3] = max(0, min(255, out_a))

    def set(self, x: int, y: int, color) -> None:
        if x < 0 or y < 0 or x >= self.w or y >= self.h:
            return
        r, g, b, a = color
        self._blend((y * self.w + x) * 4, r, g, b, a)

    def ellipse(self, cx: float, cy: float, rx: float, ry: float, color, soft: float = 0.85) -> None:
        rx = max(1.0, rx)
        ry = max(1.0, ry)
        x0, x1 = int(cx - rx - 1), int(cx + rx + 1)
        y0, y1 = int(cy - ry - 1), int(cy + ry + 1)
        r, g, b, a = color
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                u = (x - cx) / rx
                v = (y - cy) / ry
                d = u * u + v * v
                if d > 1.15:
                    continue
                fade = 1.0 if d <= soft else max(0.0, 1.0 - (d - soft) / (1.15 - soft))
                self.set(x, y, (r, g, b, int(a * fade)))

    def rect(self, x0: int, y0: int, x1: int, y1: int, color) -> None:
        for y in range(min(y0, y1), max(y0, y1) + 1):
            for x in range(min(x0, x1), max(x0, x1) + 1):
                self.set(x, y, color)

    def limb(self, x0: float, y0: float, x1: float, y1: float, rad: float, color) -> None:
        steps = max(8, int(max(abs(x1 - x0), abs(y1 - y0)) * 1.6))
        for i in range(steps + 1):
            t = i / steps
            self.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, rad, rad * 0.78, color)


RUST = (122, 38, 28, 255)
RUST_D = (78, 20, 16, 255)
PLATE = (46, 42, 40, 255)
PLATE_L = (78, 72, 68, 255)
BONE = (232, 220, 196, 255)
BONE_D = (176, 156, 122, 255)
CLAW = (244, 236, 214, 255)
EYE = (255, 122, 36, 255)
GLOW = (255, 80, 18, 180)
SKIN = (92, 28, 24, 255)
SHADOW = (0, 0, 0, 70)
HOOF = (28, 22, 20, 255)


def pose(frame: int, row: int) -> dict:
    # Body offsets per animation row / frame.
    bob = [0, -1, 0, 1][frame]
    if row == 0:  # idle
        return {
            "lean": 0,
            "bob": bob,
            "larm": (-26, 10 + bob, -34, 34 + bob, -42, 46),
            "rarm": (24, 8 + bob, 36, 22 + bob, 48, 18),
            "lleg": (-10, 38, -16, 58, -12, 78),
            "rleg": (10, 38, 16, 56, 14, 78),
            "head": (4, -28 + bob),
            "horn": 0,
            "claw": 0,
        }
    if row == 1:  # run
        phase = [(-18, 16, 14, -12), (8, -10, -16, 12), (16, 8, -8, -14), (-8, -12, 12, 10)][frame]
        return {
            "lean": 8,
            "bob": [-2, 2, -1, 3][frame],
            "larm": (-20, 6, -38, 18, -50, 8 + phase[0] * 0.3),
            "rarm": (22, 4, 40, 10, 54, 4 + phase[1] * 0.25),
            "lleg": (-8, 36, -18 + phase[0] * 0.4, 54, -16 + phase[0] * 0.5, 78),
            "rleg": (10, 36, 16 + phase[1] * 0.4, 54, 14 + phase[1] * 0.5, 78),
            "head": (10, -26),
            "horn": 2,
            "claw": 4,
        }
    if row == 2:  # charge
        return {
            "lean": 16,
            "bob": [1, -2, 2, -1][frame],
            "larm": (-8, 16, -28, 28, -50, 22),
            "rarm": (30, 2, 52, -4, 70, -10 - frame),
            "lleg": (2, 36, -6, 54, -18, 76),
            "rleg": (16, 34, 28, 50, 36, 74),
            "head": (22, -16),
            "horn": 8,
            "claw": 10,
        }
    if row == 3:  # melee
        sweep = [-8, 10, 36, 18][frame]
        return {
            "lean": 6,
            "bob": [0, -3, 2, 1][frame],
            "larm": (-22, 8, -40, 0, -58, -8),
            "rarm": (18, 4, 40 + sweep * 0.2, -6, 62 + sweep * 0.45, -18 + sweep * 0.1),
            "lleg": (-8, 38, -14, 56, -10, 78),
            "rleg": (12, 38, 18, 56, 16, 78),
            "head": (8, -24),
            "horn": 4,
            "claw": 16 + sweep * 0.2,
        }
    # death
    sink = [6, 18, 32, 42][frame]
    collapse = [0, 10, 22, 30][frame]
    return {
        "lean": collapse,
        "bob": sink,
        "larm": (-20, 18 + sink, -36, 32 + sink, -48, 40 + sink),
        "rarm": (16, 16 + sink, 28, 30 + sink, 22, 44 + sink),
        "lleg": (-6, 40 + sink * 0.4, -20, 52 + sink * 0.3, -34, 62),
        "rleg": (10, 40 + sink * 0.4, 24, 50 + sink * 0.2, 40, 58),
        "head": (-4 + collapse, -8 + sink),
        "horn": -8,
        "claw": -6,
        "dead": frame,
    }


def draw_frame(dst: Pix, ox: int, oy: int, row: int, frame: int) -> None:
    p = pose(frame, row)
    cx, cy = ox + 64 + p["lean"], oy + 52 + p["bob"]
    dst.ellipse(cx, oy + 96, 22, 6, SHADOW)

    # hind / legs
    ll, rl = p["lleg"], p["rleg"]
    dst.limb(cx + ll[0], cy + ll[1], cx + ll[2], cy + ll[3], 7.5, RUST_D)
    dst.limb(cx + ll[2], cy + ll[3], cx + ll[4], cy + ll[5], 6.2, SKIN)
    dst.ellipse(cx + ll[4], cy + ll[5] + 2, 8, 4, HOOF)
    dst.limb(cx + rl[0], cy + rl[1], cx + rl[2], cy + rl[3], 7.5, RUST)
    dst.limb(cx + rl[2], cy + rl[3], cx + rl[4], cy + rl[5], 6.2, SKIN)
    dst.ellipse(cx + rl[4], cy + rl[5] + 2, 8, 4, HOOF)

    # torso plates
    dst.ellipse(cx - 2, cy + 8, 22, 28, RUST_D)
    dst.ellipse(cx + 2, cy + 4, 20, 24, RUST)
    dst.ellipse(cx + 4, cy - 2, 16, 18, PLATE)
    dst.ellipse(cx + 6, cy + 6, 12, 10, PLATE_L)
    # spine ridges
    for i, dy in enumerate((-10, 0, 10)):
        dst.ellipse(cx - 8, cy + dy, 5, 4, BONE_D)

    # head / muzzle
    hx, hy = cx + p["head"][0], cy + p["head"][1]
    dst.ellipse(hx, hy + 6, 16, 14, RUST)
    dst.ellipse(hx + 8, hy + 10, 14, 9, SKIN)
    dst.ellipse(hx + 16, hy + 12, 8, 5, RUST_D)
    # horns
    horn = p["horn"]
    dst.limb(hx - 4, hy - 4, hx - 14 - horn, hy - 22 - horn * 0.3, 3.4, BONE)
    dst.limb(hx + 6, hy - 6, hx + 16 + horn, hy - 24 - horn * 0.2, 3.6, BONE)
    dst.ellipse(hx - 14 - horn, hy - 22 - horn * 0.3, 3.2, 3.2, CLAW)
    dst.ellipse(hx + 16 + horn, hy - 24 - horn * 0.2, 3.2, 3.2, CLAW)
    # eyes
    dst.ellipse(hx + 6, hy + 4, 3.2, 2.4, EYE)
    dst.ellipse(hx + 10, hy + 3, 2.4, 2.0, GLOW)
    if row != 4:
        dst.ellipse(hx + 7, hy + 4, 6, 4, (255, 90, 20, 50))

    # arms + claws
    la, ra = p["larm"], p["rarm"]
    dst.limb(cx + la[0], cy + la[1], cx + la[2], cy + la[3], 8.2, RUST_D)
    dst.limb(cx + la[2], cy + la[3], cx + la[4], cy + la[5], 6.4, SKIN)
    dst.limb(cx + ra[0], cy + ra[1], cx + ra[2], cy + ra[3], 8.5, RUST)
    dst.limb(cx + ra[2], cy + ra[3], cx + ra[4], cy + ra[5], 6.6, SKIN)
    claw = p["claw"]
    for k, ang in enumerate((-10, 0, 10)):
        dst.limb(
            cx + ra[4],
            cy + ra[5],
            cx + ra[4] + 12 + claw * 0.4,
            cy + ra[5] - 8 + ang + k,
            2.1,
            CLAW,
        )
        dst.limb(
            cx + la[4],
            cy + la[5],
            cx + la[4] - 10,
            cy + la[5] + 8 + k * 2,
            2.0,
            CLAW,
        )

    # charge dust / melee slash
    if row == 2:
        dst.ellipse(cx - 28, oy + 98, 16 + frame * 2, 4, (90, 50, 30, 80))
        dst.ellipse(cx - 10, oy + 99, 10, 3, (70, 40, 24, 60))
    if row == 3 and frame >= 1:
        dst.ellipse(cx + ra[4] + 8, cy + ra[5] - 6, 14, 6, (255, 180, 90, 70))
    if row == 4 and frame >= 2:
        dst.ellipse(hx, hy + 8, 18, 6, (80, 16, 16, 90))


def main() -> None:
    sheet = Pix(SHEET_W, SHEET_H)
    for row in range(ROWS):
        for col in range(COLS):
            draw_frame(sheet, col * W, row * H, row, col)
    out = Path("assets/generated/enemies/enemy-gorehorn-charger-sheet.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    write_png(out, SHEET_W, SHEET_H, sheet.p)
    print(f"wrote {out} {out.stat().st_size} bytes")


if __name__ == "__main__":
    main()
