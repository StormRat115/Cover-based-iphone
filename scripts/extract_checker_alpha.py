"""Remove a generated checkerboard connected to an atlas edge.

This keeps enclosed neutral pixels (concrete, glass, highlights) intact while
turning only edge-connected, bright, low-saturation background pixels into
alpha. It is intentionally deterministic so source sheets can be rebuilt.
"""

from collections import deque
from pathlib import Path
import sys

from PIL import Image


def is_background(pixel):
    red, green, blue = pixel[:3]
    return max(pixel[:3]) >= 174 and max(pixel[:3]) - min(pixel[:3]) <= 18


def extract(source, destination):
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    seen = bytearray(width * height)
    queue = deque()

    def add(x, y):
        index = y * width + x
        if not seen[index] and is_background(pixels[x, y]):
            seen[index] = 1
            queue.append((x, y))

    for x in range(width):
        add(x, 0)
        add(x, height - 1)
    for y in range(height):
        add(0, y)
        add(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (*pixels[x, y][:3], 0)
        if x:
            add(x - 1, y)
        if x + 1 < width:
            add(x + 1, y)
        if y:
            add(x, y - 1)
        if y + 1 < height:
            add(x, y + 1)

    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, optimize=True)


if __name__ == "__main__":
    extract(sys.argv[1], sys.argv[2])
