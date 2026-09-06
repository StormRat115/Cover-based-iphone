#!/usr/bin/env node
/* Generate compact Minecraft-style cover block skins + autotile atlas. */
import { deflateSync } from "zlib";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const TILE = 40;
const THEMES = ["jersey", "sandbags", "crates", "rubble", "wreck"];
const N = 1,
  E = 2,
  S = 4,
  W = 8;

const PAL = {
  jersey: {
    top: [198, 202, 198],
    mid: [140, 146, 142],
    dark: [82, 88, 86],
    grout: [40, 44, 42],
    accent: [239, 106, 28],
    accentDark: [138, 61, 20],
    speck: [220, 224, 218],
  },
  sandbags: {
    top: [224, 192, 122],
    mid: [176, 140, 74],
    dark: [110, 82, 40],
    grout: [58, 44, 20],
    accent: [200, 164, 92],
    accentDark: [90, 66, 30],
    speck: [240, 214, 150],
  },
  crates: {
    top: [208, 138, 60],
    mid: [148, 86, 36],
    dark: [82, 46, 20],
    grout: [42, 22, 12],
    accent: [240, 192, 112],
    accentDark: [61, 36, 20],
    speck: [228, 168, 88],
  },
  rubble: {
    top: [176, 168, 152],
    mid: [122, 116, 106],
    dark: [72, 68, 60],
    grout: [42, 38, 32],
    accent: [208, 196, 172],
    accentDark: [58, 54, 47],
    speck: [196, 188, 170],
  },
  wreck: {
    top: [108, 118, 128],
    mid: [70, 78, 86],
    dark: [36, 42, 48],
    grout: [16, 18, 22],
    accent: [176, 88, 42],
    accentDark: [20, 24, 28],
    speck: [143, 208, 232],
  },
};

function hash(x, y, s) {
  let n = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function noise(x, y, s) {
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const fx = x - x0,
    fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, s);
  const b = hash(x0 + 1, y0, s);
  const c = hash(x0, y0 + 1, s);
  const d = hash(x0 + 1, y0 + 1, s);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

function wrapNoise(x, y, themeIndex) {
  const u = x / TILE;
  const v = y / TILE;
  const n1 = noise(u * 4, v * 4, 11 + themeIndex);
  const n2 = noise(u * 8 + 3, v * 8, 29 + themeIndex);
  const n3 = noise((1 - u) * 4, (1 - v) * 4, 11 + themeIndex);
  const n4 = noise((1 - u) * 8 + 3, (1 - v) * 8, 29 + themeIndex);
  return (n1 * (1 - u) * (1 - v) + n3 * u * v + n2 * 0.35 + n4 * 0.15) / 1.5;
}

function mix(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function setPix(data, x, y, rgb, a) {
  if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
  const i = (y * TILE + x) * 4;
  data[i] = rgb[0];
  data[i + 1] = rgb[1];
  data[i + 2] = rgb[2];
  data[i + 3] = a == null ? 255 : a;
}

function paintTile(theme, mask, themeIndex) {
  const pal = PAL[theme];
  const data = new Uint8Array(TILE * TILE * 4);
  const openN = !(mask & N);
  const openE = !(mask & E);
  const openS = !(mask & S);
  const openW = !(mask & W);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = wrapNoise(x, y, themeIndex);
      let rgb = mix(pal.mid, pal.top, 0.35 + n * 0.55);
      if (theme === "jersey") {
        const brickX = ((x + (y >> 3) * 8) % 10) < 1;
        const brickY = y % 8 === 0;
        if (brickX || brickY) rgb = mix(rgb, pal.grout, 0.55);
        if (y > 15 && y < 24) rgb = mix(rgb, pal.accent, 0.72);
        if (y === 15 || y === 24) rgb = pal.accentDark;
      } else if (theme === "sandbags") {
        const row = Math.floor(y / 13);
        const offset = row % 2 ? 8 : 0;
        const cx = ((x + offset) % 16) - 8;
        const cy = (y % 13) - 6;
        if (cx * cx * 0.7 + cy * cy * 1.4 < 38) {
          rgb = mix(pal.top, pal.mid, n * 0.45 + (cy + 6) / 16);
          if (Math.abs(cx) < 1 && y % 13 > 3 && y % 13 < 10) rgb = pal.accentDark;
        } else rgb = mix(pal.dark, pal.mid, 0.35);
      } else if (theme === "crates") {
        if (x % 9 === 0 || y % 10 === 0) rgb = pal.grout;
        else if ((x + y) % 17 === 0) rgb = mix(rgb, pal.accent, 0.4);
        if (x > 14 && x < 26 && y > 14 && y < 26) {
          rgb = pal.dark;
          if (x === 15 || x === 25 || y === 15 || y === 25) rgb = pal.accent;
        }
      } else if (theme === "rubble") {
        if (n > 0.72) rgb = pal.accent;
        if (n < 0.22) rgb = pal.dark;
        if (((x * 3 + y * 5) % 23) === 0) rgb = pal.speck;
        if (y > 28 && n > 0.4) rgb = mix(rgb, pal.dark, 0.35);
      } else if (theme === "wreck") {
        if (y < 12) rgb = mix(pal.speck, pal.dark, 0.55 + n * 0.3);
        if (x < 6 || x > 33) rgb = mix(rgb, pal.dark, 0.4);
        if (((x + y * 2) % 19) === 0) rgb = pal.accent;
        if (y > 30) rgb = pal.dark;
      }
      if (hash(x, y, 90 + themeIndex) > 0.92) rgb = mix(rgb, pal.speck, 0.5);
      setPix(data, x, y, rgb, 255);
    }
  }
  const edge = pal.grout;
  for (let i = 0; i < TILE; i++) {
    if (openN) {
      setPix(data, i, 0, edge);
      setPix(data, i, 1, mix(pal.top, edge, 0.35));
    }
    if (openS) {
      setPix(data, i, TILE - 1, edge);
      setPix(data, i, TILE - 2, mix(pal.dark, edge, 0.25));
    }
    if (openW) {
      setPix(data, 0, i, edge);
      setPix(data, 1, i, mix(pal.mid, edge, 0.3));
    }
    if (openE) {
      setPix(data, TILE - 1, i, edge);
      setPix(data, TILE - 2, i, mix(pal.dark, edge, 0.3));
    }
  }
  if (openN && openW) setPix(data, 0, 0, edge);
  if (openN && openE) setPix(data, TILE - 1, 0, edge);
  if (openS && openW) setPix(data, 0, TILE - 1, edge);
  if (openS && openE) setPix(data, TILE - 1, TILE - 1, edge);
  return data;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function blit(dest, dw, tile, tx, ty) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const si = (y * TILE + x) * 4;
      const di = ((ty + y) * dw + (tx + x)) * 4;
      dest[di] = tile[si];
      dest[di + 1] = tile[si + 1];
      dest[di + 2] = tile[si + 2];
      dest[di + 3] = tile[si + 3];
    }
  }
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "assets/generated/cover/blocks");
mkdirSync(outDir, { recursive: true });

const atlasW = TILE * 16;
const atlasH = TILE * THEMES.length;
const atlas = Buffer.alloc(atlasW * atlasH * 4);
const sprites = {};

THEMES.forEach((theme, row) => {
  for (let mask = 0; mask < 16; mask++) {
    const tile = paintTile(theme, mask, row);
    blit(atlas, atlasW, tile, mask * TILE, row * TILE);
    sprites[theme + "_" + mask] = {
      x: mask * TILE,
      y: row * TILE,
      w: TILE,
      h: TILE,
    };
  }
  writeFileSync(
    resolve(outDir, theme + ".png"),
    encodePNG(TILE, TILE, Buffer.from(paintTile(theme, 0, row))),
  );
});

writeFileSync(resolve(outDir, "atlas.png"), encodePNG(atlasW, atlasH, atlas));
writeFileSync(
  resolve(outDir, "atlas.json"),
  JSON.stringify(
    {
      tile: TILE,
      themes: THEMES,
      neighbors: { N: 1, E: 2, S: 4, W: 8 },
      sprites,
      size: { w: atlasW, h: atlasH },
    },
    null,
    2,
  ),
);
console.log("wrote", outDir, atlasW + "x" + atlasH);
