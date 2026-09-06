#!/usr/bin/env python3
"""Fail if player-solid-atlas has inverted, clipped, or wrapped cells.

Phone Art v4 is 4×6, cell 192, states idle/run/standShoot/crouchShoot/reload/death.
Cover rows were removed. Run (and every standing cell) must keep the whole body
together: head near the top, feet near the bottom, padding so nothing clips.
"""
from __future__ import annotations

import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "assets/generated/soldier/player-solid-atlas.png"
META = ROOT / "assets/generated/soldier/player-solid-atlas.json"
CELL = 192
STANDING = {"idle", "run", "standShoot", "crouchShoot", "reload"}


def components(mask):
    h, w = len(mask), len(mask[0])
    vis = [[False] * w for _ in range(h)]
    comps = []
    for y in range(h):
        for x in range(w):
            if not mask[y][x] or vis[y][x]:
                continue
            q = deque([(y, x)])
            vis[y][x] = True
            ys, xs = [], []
            while q:
                cy, cx = q.popleft()
                ys.append(cy)
                xs.append(cx)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny][nx] and not vis[ny][nx]:
                        vis[ny][nx] = True
                        q.append((ny, nx))
            comps.append(
                {
                    "n": len(ys),
                    "miny": min(ys),
                    "maxy": max(ys),
                    "minx": min(xs),
                    "maxx": max(xs),
                }
            )
    comps.sort(key=lambda c: -c["n"])
    return comps


def cell_mask(px, w, h):
    mask = [[False] * w for _ in range(h)]
    mid = leftover = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if 0 < a < 255:
                mid += 1
            if a == 0 and (r or g or b):
                leftover += 1
            if a >= 40:
                mask[y][x] = True
    return mask, mid, leftover


def main() -> int:
    meta = json.loads(META.read_text())
    errors = []
    if meta.get("cell") != CELL or meta.get("cols") != 4 or meta.get("rows") != 6:
        errors.append(f"unexpected layout {meta}")
    states = meta.get("states") or []
    if states != ["idle", "run", "standShoot", "crouchShoot", "reload", "death"]:
        errors.append(f"unexpected states {states}")
    if "tallCover" in states or "lowCover" in states:
        errors.append("cover rows must stay off the official sheet")

    im = Image.open(PNG).convert("RGBA")
    if im.size != (768, 1152):
        errors.append(f"unexpected sheet size {im.size}")

    for row, state in enumerate(states):
        for col in range(4):
            crop = im.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
            px = crop.load()
            mask, mid, leftover = cell_mask(px, CELL, CELL)
            label = f"{state}[{col}]"
            if mid:
                errors.append(f"{label}: {mid} mid-alpha pixels")
            if leftover:
                errors.append(f"{label}: {leftover} leftover RGB on transparent")
            comps = components(mask)
            if not comps:
                errors.append(f"{label}: empty cell")
                continue
            main_c = comps[0]
            pad_t = main_c["miny"]
            pad_b = CELL - 1 - main_c["maxy"]
            yspan = main_c["maxy"] - main_c["miny"] + 1
            top_edge = sum(1 for x in range(CELL) for y in range(4) if mask[y][x])
            bot_edge = sum(1 for x in range(CELL) for y in range(CELL - 4, CELL) if mask[y][x])
            top_frags = [
                c
                for c in comps[1:]
                if c["maxy"] <= 22 and c["n"] >= 8
            ]
            if top_frags:
                errors.append(
                    f"{label}: floating fragment at top of cell (feet-above-head)"
                )
            if top_edge:
                errors.append(f"{label}: opaque pixels clip the top 4px ({top_edge})")
            if state in STANDING:
                if pad_t < 6 or pad_b < 6:
                    errors.append(
                        f"{label}: not enough padding (padT={pad_t} padB={pad_b})"
                    )
                if yspan < 150:
                    errors.append(f"{label}: body too short (yspan={yspan})")
                if pad_t <= 8 and pad_b >= 50:
                    errors.append(f"{label}: feet-at-top / inverted framing")
            if state == "death":
                if pad_b < 6:
                    errors.append(f"{label}: death feet clip the bottom")
                if bot_edge:
                    errors.append(f"{label}: death clips the bottom 4px")

    if errors:
        print("player-solid-atlas framing FAILED:")
        for err in errors:
            print(" -", err)
        return 1
    print(
        "player-solid-atlas framing OK: 4x6 cell 192, no cover rows, "
        "run/idle/shoot/reload upright full-body, binary alpha"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
