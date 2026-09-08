import { loadImage } from "./assets.js?v=20260908-137";
export const friendlyAtlasSource = new Image();
friendlyAtlasSource.src =
  "./assets/generated/soldier/player-solid-atlas.png?v=20260906-102";
export const soldierSource = new Image();
soldierSource.src =
  "./assets/EE4CA451-8D37-42A3-9F54-ED1930481CF9.png?v=20260906-88";
export const enemySource = new Image();
enemySource.src =
  "./assets/198C101B-E186-4852-A270-3F04D83451ED.png?v=20260906-88";
export const deathSource = new Image();
deathSource.src = "./assets/soldier_death_sheet.png?v=20260906-88";
export const vaultSheetSource = new Image();
vaultSheetSource.src =
  "./assets/generated/soldier/vault-sheet.png?v=20260906-99";
export const leoAtlasSource = new Image();
leoAtlasSource.src =
  "./assets/generated/soldier/leo-atlas.webp?v=20260908-126";
export const docAtlasSource = new Image();
const DOC_ATLAS_WEBP =
  "./assets/generated/soldier/doc-atlas.webp?v=20260908-132";
const DOC_ATLAS_PNG =
  "./assets/generated/soldier/doc-atlas.png?v=20260908-132";
docAtlasSource.src = DOC_ATLAS_WEBP;
export const viperAtlasSource = new Image();
const VIPER_ATLAS_WEBP =
  "./assets/generated/soldier/viper-atlas.webp?v=20260908-132";
const VIPER_ATLAS_PNG =
  "./assets/generated/soldier/viper-atlas.png?v=20260908-132";
viperAtlasSource.src = VIPER_ATLAS_WEBP;

const ENEMY_MONSTER_SHEET_WIDTH = 1536,
  ENEMY_MONSTER_SHEET_HEIGHT = 1022,
  ENEMY_MONSTER_FRAME_WIDTH = 256,
  ENEMY_MONSTER_FRAME_HEIGHT = 146,
  ENEMY_MONSTER_FRAMES = 6;
const ENEMY_MONSTER_ROWS = {
  idle: 0,
  run: 1,
  lowCover: 2,
  tallCover: 3,
  shoot: 4,
  hit: 5,
  death: 6,
};
const ENEMY_MONSTER_FILES = {
  rifleman: "enemy-ashfang-rifleman-sheet.png",
  shotgunner: "enemy-mawbreaker-breacher-sheet.png",
  heavy: "enemy-ironhide-heavy-sheet.png",
  sniper: "enemy-paleeye-stalker-sheet.png",
};
const enemyMonsterSources = Object.fromEntries(
  Object.entries(ENEMY_MONSTER_FILES).map(function ([type, file]) {
    const image = new Image();
    image.src = "./assets/generated/enemies/" + file + "?v=20260906-88";
    return [type, image];
  }),
);

const SOURCE_W = 1448,
  SOURCE_H = 1086,
  CELL = 180,
  COLS = 8;
const DEATH_FRAMES = 6,
  DEATH_FPS = 8,
  DEATH_DURATION = (DEATH_FRAMES - 1) / DEATH_FPS,
  DEATH_SCALE = 0.62;
let runtimeAtlas = null,
  runtimeEnemyAtlas = null,
  runtimeVaultSheet = null;
const FRAME_BOXES = {
  idle: [
    [200, 0, 120, 165],
    [333, 0, 120, 165],
    [472, 0, 120, 165],
    [614, 0, 120, 165],
    [762, 0, 120, 165],
  ],
  run: [
    [174, 165, 150, 170],
    [320, 165, 150, 170],
    [466, 165, 150, 170],
    [612, 165, 150, 170],
    [758, 165, 150, 170],
    [904, 165, 150, 170],
    [1050, 165, 150, 170],
    [1196, 165, 152, 170],
  ],
  lowCover: [
    [174, 335, 150, 135],
    [324, 335, 150, 135],
    [474, 335, 150, 135],
    [624, 335, 150, 135],
    [774, 335, 150, 135],
    [924, 335, 150, 135],
    [1074, 335, 150, 135],
  ],
  tallCover: [
    [184, 470, 130, 160],
    [334, 470, 130, 160],
    [484, 470, 130, 160],
    [634, 470, 130, 160],
    [784, 470, 130, 160],
    [924, 470, 130, 160],
    [1064, 470, 130, 160],
  ],
  shoot: [
    [180, 630, 145, 155],
    [330, 630, 145, 155],
    [480, 630, 145, 155],
    [630, 630, 160, 155],
    [780, 630, 175, 155],
    [940, 630, 185, 155],
    [1100, 630, 240, 155],
  ],
  crouchShoot: [
    [180, 785, 165, 125],
    [340, 785, 180, 125],
    [520, 785, 165, 125],
    [680, 785, 205, 125],
    [855, 785, 205, 125],
    [1020, 785, 235, 125],
  ],
  standShoot: [
    [190, 910, 150, 176],
    [350, 910, 150, 176],
    [510, 910, 160, 176],
    [675, 910, 210, 176],
    [875, 910, 285, 176],
  ],
};
const ENEMY_FRAME_BOXES = {
  idle: [
    [170, 0, 160, 180],
    [320, 0, 160, 180],
    [475, 0, 155, 180],
    [625, 0, 155, 180],
    [780, 0, 160, 180],
  ],
  run: [
    [145, 180, 190, 185],
    [325, 180, 180, 185],
    [475, 180, 180, 185],
    [625, 180, 180, 185],
    [780, 180, 180, 185],
    [930, 180, 180, 185],
    [1080, 180, 180, 185],
    [1230, 180, 200, 185],
  ],
  lowCover: [
    [150, 365, 175, 130],
    [305, 365, 170, 130],
    [460, 365, 170, 130],
    [615, 365, 170, 130],
    [770, 365, 170, 130],
    [925, 365, 170, 130],
    [1080, 365, 175, 130],
  ],
  tallCover: [
    [160, 490, 150, 180],
    [315, 490, 150, 180],
    [470, 490, 155, 180],
    [625, 490, 155, 180],
    [780, 490, 155, 180],
    [935, 490, 155, 180],
    [1090, 490, 160, 180],
  ],
  shoot: [
    [170, 655, 160, 160],
    [325, 655, 160, 160],
    [480, 655, 160, 160],
    [635, 655, 160, 160],
    [790, 655, 160, 160],
    [945, 655, 160, 160],
    [1100, 655, 160, 160],
  ],
  crouchShoot: [
    [170, 810, 170, 120],
    [340, 810, 170, 120],
    [510, 810, 170, 120],
    [680, 810, 170, 120],
    [850, 810, 170, 120],
    [1020, 810, 170, 120],
  ],
  standShoot: [
    [170, 928, 170, 158],
    [340, 928, 170, 158],
    [510, 928, 170, 158],
    [680, 928, 170, 158],
    [850, 928, 170, 158],
  ],
};
const FRIENDLY_CELL = 192;
const FRIENDLY_COLS = 4;
const FRIENDLY_ROWS_COUNT = 6;
// Transparent gutter around isolated cells so GPU REPEAT / bilinear
// samples empty pixels instead of wrapping the barrel to the back.
export const CELL_GUTTER = 40;
export const SPRITE_BOX_PAD = 40;
export const SPRITE_FIT = 0.86;
export const UNWRAP_PAD = 48;
const cleanedSheetCache = new WeakMap();
const paddedSheetCache =
  (typeof globalThis !== "undefined" && globalThis.__paddedSheetCache) ||
  new Map();
const unwrapInflight = new Map();
let unwrapSeq = 0;
if (typeof globalThis !== "undefined")
  globalThis.__paddedSheetCache = paddedSheetCache;
const UNWRAP_YIELD_MS = 8;
const FRIENDLY_ROWS = {
  idle: 0,
  run: 1,
  standShoot: 2,
  crouchShoot: 3,
  reload: 4,
  death: 5,
  shoot: 2,
  // Cover rows were removed — they baked a barrier into the sprite.
  tallCover: 0,
  lowCover: 3,
  vault: 1,
};
const FRIENDLY_FPS = {
  idle: 3.2,
  run: 9,
  standShoot: 10,
  crouchShoot: 10,
  shoot: 10,
  reload: 8,
  death: 7,
  vault: 10,
};
export const FRIENDLY_ATLAS_STATES = [
  "idle",
  "run",
  "standShoot",
  "crouchShoot",
  "reload",
  "death",
];
const LEO_ROWS_COUNT = 8;
const LEO_ROWS = {
  idle: 0,
  run: 1,
  standShoot: 2,
  shoot: 2,
  shieldRaise: 3,
  meleeSwing: 4,
  shieldBlock: 5,
  reload: 6,
  death: 7,
  crouchShoot: 5,
  tallCover: 5,
  lowCover: 5,
  vault: 1,
};
const LEO_FPS = {
  idle: 3,
  run: 9,
  standShoot: 10,
  shoot: 10,
  shieldRaise: 8,
  meleeSwing: 12,
  shieldBlock: 4,
  reload: 8,
  death: 7,
};
export const LEO_ATLAS_STATES = [
  "idle",
  "run",
  "standShoot",
  "shieldRaise",
  "meleeSwing",
  "shieldBlock",
  "reload",
  "death",
];
export const DOC_ATLAS_STATES = [
  "idle",
  "run",
  "standShoot",
  "crouchShoot",
  "reload",
  "death",
];
export const VIPER_ATLAS_STATES = [
  "idle",
  "run",
  "standShoot",
  "crouchShoot",
  "reload",
  "death",
];
const VAULT_COLS = 4;
const VAULT_CELL = 168;
let runtimeFriendlyAtlas = null,
  runtimeFriendlyFrames = null,
  runtimeLeoAtlas = null,
  runtimeLeoFrames = null,
  runtimeDocAtlas = null,
  runtimeDocFrames = null,
  runtimeViperAtlas = null,
  runtimeViperFrames = null;
const ROWS = {
  idle: 0,
  run: 1,
  lowCover: 2,
  tallCover: 3,
  shoot: 4,
  crouchShoot: 5,
  standShoot: 6,
};
const FPS = {
  // Snappier cycles; short sheets still loop cleanly with reduced blend.
  idle: 3.5,
  run: 9,
  lowCover: 3.0,
  tallCover: 3.0,
  shoot: 11,
  crouchShoot: 10,
  standShoot: 10,
};
const LOOP_STATES = {
  idle: true,
  run: true,
  lowCover: true,
  tallCover: true,
  shoot: true,
  crouchShoot: true,
  standShoot: true,
};
const STATE_HOLD_MS = {
  idle: 170,
  run: 140,
  lowCover: 200,
  tallCover: 200,
  shoot: 110,
  crouchShoot: 110,
  standShoot: 110,
  vault: 70,
  reload: 220,
  meleeSwing: 90,
  shieldRaise: 140,
  shieldBlock: 180,
  death: 99999,
};
function nowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

/** Snap milky/soft atlas pixels to binary alpha and zero leftover RGB.
 *  Does not wash colors — pale lifts were reading as ghosts. */
export function hardenSheetAlpha(source, cut) {
  if (!source || !(source.naturalWidth || source.width)) return source;
  cut = cut == null ? 40 : cut;
  try {
    var c = document.createElement("canvas");
    c.width = source.naturalWidth || source.width;
    c.height = source.naturalHeight || source.height;
    if (!c.width || !c.height) return source;
    var g = c.getContext("2d", { willReadFrequently: true });
    if (!g || typeof g.getImageData !== "function") return source;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(source, 0, 0);
    var img = g.getImageData(0, 0, c.width, c.height);
    if (!img || !img.data) return source;
    var d = img.data,
      w = c.width,
      h = c.height,
      i,
      x,
      y,
      idx,
      mid = 0;
    for (i = 0; i < d.length; i += 4) {
      if (d[i + 3] < cut) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 0;
      } else {
        if (d[i + 3] < 255) mid++;
        d[i + 3] = 255;
      }
    }
    if (!mid) {
      g.putImageData(img, 0, 0);
      return c;
    }
    // Soft source: fill enclosed transparent pockets so the road cannot show through.
    var opaque = new Uint8Array(w * h),
      exterior = new Uint8Array(w * h),
      stack = [];
    for (i = 0; i < opaque.length; i++) opaque[i] = d[i * 4 + 3] === 255 ? 1 : 0;
    function push(px, py) {
      if (px < 0 || py < 0 || px >= w || py >= h) return;
      var p = py * w + px;
      if (opaque[p] || exterior[p]) return;
      exterior[p] = 1;
      stack.push(p);
    }
    for (x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    while (stack.length) {
      var p = stack.pop(),
        px = p % w,
        py = (p - px) / w;
      push(px - 1, py);
      push(px + 1, py);
      push(px, py - 1);
      push(px, py + 1);
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        idx = y * w + x;
        if (opaque[idx] || exterior[idx]) continue;
        var sr = 0,
          sg = 0,
          sb = 0,
          n = 0,
          k;
        for (k = 0; k < 4; k++) {
          var nx = x + (k === 0 ? -1 : k === 1 ? 1 : 0),
            ny = y + (k === 2 ? -1 : k === 3 ? 1 : 0);
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          var ni = (ny * w + nx) * 4;
          if (d[ni + 3] === 255) {
            sr += d[ni];
            sg += d[ni + 1];
            sb += d[ni + 2];
            n++;
          }
        }
        i = idx * 4;
        if (n) {
          d[i] = Math.round(sr / n);
          d[i + 1] = Math.round(sg / n);
          d[i + 2] = Math.round(sb / n);
        } else {
          d[i] = 58;
          d[i + 1] = 52;
          d[i + 2] = 44;
        }
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  } catch (err) {
    return source;
  }
}

function analyzeCellData(img, cut) {
  cut = cut == null ? 40 : cut;
  var d = img.data,
    w = img.width,
    h = img.height,
    seen = new Uint8Array(w * h),
    frags = [],
    mainN = 0,
    mainBest = -1,
    x,
    y,
    i,
    p,
    px,
    py,
    ni,
    n,
    minx,
    maxx,
    miny,
    maxy,
    touchL,
    touchR,
    touchT,
    touchB,
    pixels,
    stack;
  function idx(ix, iy) {
    return iy * w + ix;
  }
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      i = idx(x, y);
      if (seen[i] || d[i * 4 + 3] < cut) continue;
      stack = [i];
      seen[i] = 1;
      n = 0;
      minx = maxx = x;
      miny = maxy = y;
      touchL = touchR = touchT = touchB = false;
      pixels = [];
      while (stack.length) {
        p = stack.pop();
        px = p % w;
        py = (p - px) / w;
        pixels.push(p);
        n++;
        if (px === 0) touchL = true;
        if (px === w - 1) touchR = true;
        if (py === 0) touchT = true;
        if (py === h - 1) touchB = true;
        if (px < minx) minx = px;
        if (px > maxx) maxx = px;
        if (py < miny) miny = py;
        if (py > maxy) maxy = py;
        if (px > 0 && !seen[(ni = idx(px - 1, py))] && d[ni * 4 + 3] >= cut) {
          seen[ni] = 1;
          stack.push(ni);
        }
        if (px + 1 < w && !seen[(ni = idx(px + 1, py))] && d[ni * 4 + 3] >= cut) {
          seen[ni] = 1;
          stack.push(ni);
        }
        if (py > 0 && !seen[(ni = idx(px, py - 1))] && d[ni * 4 + 3] >= cut) {
          seen[ni] = 1;
          stack.push(ni);
        }
        if (py + 1 < h && !seen[(ni = idx(px, py + 1))] && d[ni * 4 + 3] >= cut) {
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      frags.push({
        n: n,
        minx: minx,
        maxx: maxx,
        miny: miny,
        maxy: maxy,
        touchL: touchL,
        touchR: touchR,
        touchT: touchT,
        touchB: touchB,
        pixels: pixels,
      });
      if (n > mainN) {
        mainN = n;
        mainBest = frags.length - 1;
      }
    }
  }
  return {
    frags: frags,
    main: mainBest >= 0 ? frags[mainBest] : null,
    mainBest: mainBest,
  };
}

function isWrapFragment(frag, main, w, h) {
  if (!frag || !main) return false;
  var left =
    frag.touchL &&
    !frag.touchR &&
    frag.maxx < main.minx + 2 &&
    frag.maxx < w * 0.5;
  var top =
    frag.touchT &&
    !frag.touchB &&
    frag.maxy < main.miny + 2 &&
    frag.maxy < h * 0.5;
  var cx = (frag.minx + frag.maxx) / 2,
    cy = (frag.miny + frag.maxy) / 2;
  var orphanLeft =
    !frag.touchR &&
    cx < main.minx &&
    frag.n < Math.max(40, main.n * 0.12);
  var orphanTop =
    !frag.touchB &&
    cy < main.miny &&
    frag.n < Math.max(40, main.n * 0.12);
  return !!(left || top || orphanLeft || orphanTop);
}

function clearFrag(d, frag) {
  var k, pi;
  for (k = 0; k < frag.pixels.length; k++) {
    pi = frag.pixels[k] * 4;
    d[pi] = 0;
    d[pi + 1] = 0;
    d[pi + 2] = 0;
    d[pi + 3] = 0;
  }
}

/** Drop wrap chips: previous-cell barrel on the left, previous-row feet on
 *  the top, and leftover leg/cloak specks that flip onto the far side. */
export function stripWrappedOverflow(canvas, ox, oy, cellW, cellH, cut) {
  if (!canvas || !cellW || !cellH) return canvas;
  ox = ox || 0;
  oy = oy || 0;
  try {
    var g = canvas.getContext("2d", { willReadFrequently: true });
    if (!g || typeof g.getImageData !== "function") return canvas;
    var img = g.getImageData(ox, oy, cellW, cellH);
    if (!img || !img.data) return canvas;
    var info = analyzeCellData(img, cut),
      cleared = false,
      i,
      frag;
    if (!info.main) return canvas;
    for (i = 0; i < info.frags.length; i++) {
      if (i === info.mainBest) continue;
      frag = info.frags[i];
      if (isWrapFragment(frag, info.main, cellW, cellH)) {
        clearFrag(img.data, frag);
        cleared = true;
      }
    }
    if (cleared) g.putImageData(img, ox, oy);
    return canvas;
  } catch (_err) {
    return canvas;
  }
}

export function packedCellLayout(source, coreW, coreH) {
  var pad = (source && source._unwrapPad) || 0;
  var boxPad = (source && source._boxPad) || 0;
  return {
    pad: pad,
    boxPad: boxPad,
    footGutter: (source && source._footGutter) || 0,
    cellW: (source && source._paddedFrameW) || coreW,
    cellH: (source && source._paddedFrameH) || coreH,
    coreW: coreW,
    coreH: coreH,
    fit: (source && source._fit) || 1,
  };
}

/** Dest rect for a packed/fitted cell. Blit the full box (empty UV edges)
 *  and plant using the foot gutter so ankles sit on the actor origin. */
export function packedSpriteDest(layout, scale, yNudge) {
  var dw = layout.cellW * scale;
  var dh = layout.cellH * scale;
  return {
    dw: dw,
    dh: dh,
    dx: -dw * 0.5,
    dy: -dh + (layout.footGutter || 0) * scale + (yNudge || 0),
    bodyW: (layout.coreW || layout.cellW) * scale,
    bodyH: (layout.coreH || layout.cellH) * scale,
    inset: layout.boxPad ? 0 : layout.pad ? 1 : 5,
  };
}

function yieldToBrowser() {
  return new Promise(function (resolve) {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () {
        resolve();
      });
      return;
    }
    setTimeout(resolve, 0);
  });
}

function yieldIfBusy(busy) {
  if (!busy) return Promise.resolve();
  if (nowMs() - busy.t < UNWRAP_YIELD_MS) return Promise.resolve();
  return yieldToBrowser().then(function () {
    busy.t = nowMs();
  });
}

function sheetCacheKey(source, frameW, frameH) {
  var src = (source && (source.src || source._src)) || "";
  if (!src) return "";
  return [src, frameW, frameH, UNWRAP_PAD, SPRITE_BOX_PAD, SPRITE_FIT].join("|");
}

function peekCachedSheet(source, frameW, frameH) {
  if (!source) return null;
  if (
    source._fit === SPRITE_FIT &&
    source._coreW === frameW &&
    source._coreH === frameH
  )
    return source;
  if (cleanedSheetCache.has(source)) return cleanedSheetCache.get(source);
  var key = sheetCacheKey(source, frameW, frameH);
  if (key && paddedSheetCache.has(key)) {
    var hit = paddedSheetCache.get(key);
    cleanedSheetCache.set(source, hit);
    return hit;
  }
  return null;
}

function rememberSheet(source, result, frameW, frameH) {
  if (!source || !result) return result;
  cleanedSheetCache.set(source, result);
  var key = sheetCacheKey(source, frameW, frameH);
  if (key && result !== source && result._fit === SPRITE_FIT)
    paddedSheetCache.set(key, result);
  return result;
}

function stampFragIntoDest(dest, fromImg, frag, ox, oy, frameW, pad) {
  var k, p, px, py, si, di;
  for (k = 0; k < frag.pixels.length; k++) {
    p = frag.pixels[k];
    px = p % frameW;
    py = (p - px) / frameW;
    si = p * 4;
    di = ((oy + py) * (frameW + pad) + (ox + px)) * 4;
    if (fromImg.data[si + 3] < 40) continue;
    dest.data[di] = fromImg.data[si];
    dest.data[di + 1] = fromImg.data[si + 1];
    dest.data[di + 2] = fromImg.data[si + 2];
    dest.data[di + 3] = fromImg.data[si + 3];
  }
}

function beginUnwrap(source, frameW, frameH) {
  var cached = peekCachedSheet(source, frameW, frameH);
  if (cached) return { cached: cached };
  var iw = source.naturalWidth || source.width || 0,
    ih = source.naturalHeight || source.height || 0;
  if (!iw || !ih) return { bail: rememberSheet(source, source, frameW, frameH) };
  var srcCanvas = document.createElement("canvas");
  srcCanvas.width = iw;
  srcCanvas.height = ih;
  var sg = srcCanvas.getContext("2d", { willReadFrequently: true });
  if (!sg || typeof sg.getImageData !== "function")
    return { bail: rememberSheet(source, source, frameW, frameH) };
  sg.clearRect(0, 0, iw, ih);
  sg.drawImage(source, 0, 0);
  return {
    source: source,
    sg: sg,
    frameW: frameW,
    frameH: frameH,
    cols: Math.floor(iw / frameW),
    rows: Math.floor(ih / frameH),
    pad: UNWRAP_PAD,
  };
}

function analyzeUnwrapRow(job, grid, row) {
  var col, cellImg, info;
  grid[row] = [];
  for (col = 0; col < job.cols; col++) {
    cellImg = job.sg.getImageData(
      col * job.frameW,
      row * job.frameH,
      job.frameW,
      job.frameH,
    );
    if (!cellImg || !cellImg.data) return false;
    info = analyzeCellData(cellImg, 40);
    grid[row][col] = { img: cellImg, info: info };
  }
  return true;
}

function stampUnwrapCell(job, grid, g, row, col) {
  var slot = grid[row][col],
    frameW = job.frameW,
    frameH = job.frameH,
    pad = job.pad,
    cols = job.cols,
    rows = job.rows,
    core = new ImageData(
      new Uint8ClampedArray(slot.img.data),
      frameW,
      frameH,
    ),
    dx = col * (frameW + pad),
    dy = row * (frameH + pad),
    nextCol = col + 1 < cols ? grid[row][col + 1] : null,
    nextRow = row + 1 < rows ? grid[row + 1][col] : null,
    k,
    dest;
  if (slot.info.main) {
    for (k = 0; k < slot.info.frags.length; k++) {
      if (k === slot.info.mainBest) continue;
      if (isWrapFragment(slot.info.frags[k], slot.info.main, frameW, frameH))
        clearFrag(core.data, slot.info.frags[k]);
    }
  }
  g.putImageData(core, dx, dy);
  dest = g.getImageData(dx, dy, frameW + pad, frameH + pad);
  if (nextCol && nextCol.info.main) {
    for (k = 0; k < nextCol.info.frags.length; k++) {
      if (k === nextCol.info.mainBest) continue;
      if (
        isWrapFragment(
          nextCol.info.frags[k],
          nextCol.info.main,
          frameW,
          frameH,
        ) &&
        (nextCol.info.frags[k].touchL ||
          nextCol.info.frags[k].maxx < nextCol.info.main.minx)
      )
        stampFragIntoDest(
          dest,
          nextCol.img,
          nextCol.info.frags[k],
          frameW,
          0,
          frameW,
          pad,
        );
    }
  }
  if (nextRow && nextRow.info.main) {
    for (k = 0; k < nextRow.info.frags.length; k++) {
      if (k === nextRow.info.mainBest) continue;
      if (
        isWrapFragment(
          nextRow.info.frags[k],
          nextRow.info.main,
          frameW,
          frameH,
        ) &&
        (nextRow.info.frags[k].touchT ||
          nextRow.info.frags[k].maxy < nextRow.info.main.miny)
      )
        stampFragIntoDest(
          dest,
          nextRow.img,
          nextRow.info.frags[k],
          0,
          frameH,
          frameW,
          pad,
        );
    }
  }
  g.putImageData(dest, dx, dy);
}

function fitUnwrappedSheet(c, job) {
  var frameW = job.frameW,
    frameH = job.frameH,
    pad = job.pad,
    cols = job.cols,
    rows = job.rows,
    boxPad = SPRITE_BOX_PAD,
    innerW = frameW + pad,
    innerH = frameH + pad,
    contentW = Math.max(1, Math.round(innerW * SPRITE_FIT)),
    contentH = Math.max(1, Math.round(innerH * SPRITE_FIT)),
    cellOutW = contentW + boxPad * 2,
    cellOutH = contentH + boxPad * 2,
    fitted = document.createElement("canvas"),
    fg,
    foot = 8,
    row,
    col;
  c.naturalWidth = c.width;
  c.naturalHeight = c.height;
  c.complete = true;
  c._unwrapPad = pad;
  c._paddedFrameW = frameW + pad;
  c._paddedFrameH = frameH + pad;
  c._coreW = frameW;
  c._coreH = frameH;
  fitted.width = cols * cellOutW;
  fitted.height = rows * cellOutH;
  fg = fitted.getContext("2d", { willReadFrequently: true });
  if (!fg || typeof fg.drawImage !== "function") return c;
  fg.clearRect(0, 0, fitted.width, fitted.height);
  fg.imageSmoothingEnabled = false;
  for (row = 0; row < rows; row++) {
    for (col = 0; col < cols; col++) {
      fg.drawImage(
        c,
        col * innerW,
        row * innerH,
        innerW,
        innerH,
        col * cellOutW + Math.round((cellOutW - contentW) / 2),
        row * cellOutH + (cellOutH - contentH - foot),
        contentW,
        contentH,
      );
    }
  }
  fitted.naturalWidth = fitted.width;
  fitted.naturalHeight = fitted.height;
  fitted.complete = true;
  fitted._unwrapPad = pad;
  fitted._boxPad = boxPad;
  fitted._footGutter = foot;
  fitted._paddedFrameW = cellOutW;
  fitted._paddedFrameH = cellOutH;
  fitted._coreW = frameW;
  fitted._coreH = frameH;
  fitted._fit = SPRITE_FIT;
  return fitted;
}

function finishUnwrapGrid(job, grid) {
  var outW = job.cols * (job.frameW + job.pad),
    outH = job.rows * (job.frameH + job.pad),
    c = document.createElement("canvas"),
    g,
    row,
    col;
  c.width = outW;
  c.height = outH;
  g = c.getContext("2d", { willReadFrequently: true });
  if (!g || typeof g.putImageData !== "function") return null;
  g.clearRect(0, 0, outW, outH);
  for (row = 0; row < job.rows; row++) {
    for (col = 0; col < job.cols; col++) stampUnwrapCell(job, grid, g, row, col);
  }
  return fitUnwrappedSheet(c, job);
}

/** Copy a packed sheet into padded cells: strip wrap chips, then put the
 *  next cell's leftover barrel/feet back on the right/bottom of this pose
 *  so the figure is not sitting on cut-off ankles. Official PNGs stay. */
export function cleanPackedSheet(source, frameW, frameH) {
  if (!source || !frameW || !frameH) return source;
  var cached = peekCachedSheet(source, frameW, frameH);
  if (cached) return cached;
  try {
    var job = beginUnwrap(source, frameW, frameH),
      grid = [],
      row,
      fitted;
    if (job.cached) return job.cached;
    if (job.bail) return job.bail;
    for (row = 0; row < job.rows; row++) {
      if (!analyzeUnwrapRow(job, grid, row))
        return rememberSheet(source, source, frameW, frameH);
    }
    fitted = finishUnwrapGrid(job, grid);
    if (!fitted) return rememberSheet(source, source, frameW, frameH);
    return rememberSheet(source, fitted, frameW, frameH);
  } catch (_err) {
    return rememberSheet(source, source, frameW, frameH);
  }
}

/** Same rebuild as cleanPackedSheet, but yields so the loading bar can paint.
 *  Chunks the getImageData pass when a row takes more than UNWRAP_YIELD_MS. */
export function cleanPackedSheetAsync(source, frameW, frameH, onProgress) {
  onProgress = onProgress || function () {};
  if (!source || !frameW || !frameH) {
    onProgress(1);
    return Promise.resolve(source);
  }
  var cached = peekCachedSheet(source, frameW, frameH);
  if (cached) {
    onProgress(1);
    return Promise.resolve(cached);
  }
  var key = sheetCacheKey(source, frameW, frameH) || "anon-" + ++unwrapSeq;
  if (unwrapInflight.has(key)) {
    return unwrapInflight.get(key).then(function (result) {
      onProgress(1);
      return result;
    });
  }
  var jobPromise = (async function () {
    var job,
      grid = [],
      row,
      fitted,
      busy,
      outW,
      outH,
      c,
      g;
    onProgress(0.08);
    await yieldToBrowser();
    cached = peekCachedSheet(source, frameW, frameH);
    if (cached) {
      onProgress(1);
      return cached;
    }
    try {
      job = beginUnwrap(source, frameW, frameH);
      if (job.cached) {
        onProgress(1);
        return job.cached;
      }
      if (job.bail) {
        onProgress(1);
        return job.bail;
      }
      busy = { t: nowMs() };
      for (row = 0; row < job.rows; row++) {
        if (!analyzeUnwrapRow(job, grid, row))
          return rememberSheet(source, source, frameW, frameH);
        onProgress(0.12 + 0.5 * ((row + 1) / Math.max(1, job.rows)));
        await yieldIfBusy(busy);
      }
      outW = job.cols * (job.frameW + job.pad);
      outH = job.rows * (job.frameH + job.pad);
      c = document.createElement("canvas");
      c.width = outW;
      c.height = outH;
      g = c.getContext("2d", { willReadFrequently: true });
      if (!g || typeof g.putImageData !== "function")
        return rememberSheet(source, source, frameW, frameH);
      g.clearRect(0, 0, outW, outH);
      for (row = 0; row < job.rows; row++) {
        for (var col = 0; col < job.cols; col++)
          stampUnwrapCell(job, grid, g, row, col);
        onProgress(0.62 + 0.28 * ((row + 1) / Math.max(1, job.rows)));
        await yieldIfBusy(busy);
      }
      await yieldToBrowser();
      fitted = fitUnwrappedSheet(c, job);
      rememberSheet(source, fitted, frameW, frameH);
      onProgress(1);
      return fitted;
    } catch (_err) {
      onProgress(1);
      return rememberSheet(source, source, frameW, frameH);
    }
  })();
  unwrapInflight.set(key, jobPromise);
  return jobPromise.then(
    function (result) {
      unwrapInflight.delete(key);
      return result;
    },
    function (err) {
      unwrapInflight.delete(key);
      throw err;
    },
  );
}

/** Draw a source rect clipped to the bitmap. Dest shrinks with the clip
 *  so overflow is discarded instead of wrapping to the opposite edge. */
export function drawClampedSheetFrame(ctx, source, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!ctx || !source || sw <= 0 || sh <= 0 || !dw || !dh) return false;
  var iw = source.naturalWidth || source.width || 0,
    ih = source.naturalHeight || source.height || 0;
  if (!iw || !ih) return false;
  var x0 = Math.max(0, sx),
    y0 = Math.max(0, sy),
    x1 = Math.min(iw, sx + sw),
    y1 = Math.min(ih, sy + sh);
  if (x1 <= x0 || y1 <= y0) return false;
  var left = x0 - sx,
    top = y0 - sy,
    right = sx + sw - x1,
    bottom = sy + sh - y1,
    xScale = dw / sw,
    yScale = dh / sh;
  ctx.drawImage(
    source,
    x0,
    y0,
    x1 - x0,
    y1 - y0,
    dx + left * xScale,
    dy + top * yScale,
    dw - (left + right) * xScale,
    dh - (top + bottom) * yScale,
  );
  return true;
}

function buildCellFrameCache(source, rowCount, cols, cell) {
  if (!source) return null;
  var frames = [];
  var boxPad = SPRITE_BOX_PAD;
  var foot = 8;
  var content = Math.max(1, Math.round(cell * SPRITE_FIT));
  var box = content + boxPad * 2;
  try {
    var scratch = document.createElement("canvas");
    scratch.width = cell;
    scratch.height = cell;
    var sg = scratch.getContext("2d", { willReadFrequently: true });
    if (!sg || typeof sg.drawImage !== "function") return null;
    for (var row = 0; row < rowCount; row++) {
      frames[row] = [];
      for (var col = 0; col < cols; col++) {
        sg.clearRect(0, 0, cell, cell);
        sg.imageSmoothingEnabled = false;
        sg.drawImage(
          source,
          col * cell,
          row * cell,
          cell,
          cell,
          0,
          0,
          cell,
          cell,
        );
        stripWrappedOverflow(scratch, 0, 0, cell, cell, 40);
        var frame = document.createElement("canvas");
        frame.width = box;
        frame.height = box;
        var g = frame.getContext("2d", { willReadFrequently: true });
        if (!g || typeof g.drawImage !== "function") return null;
        g.clearRect(0, 0, box, box);
        g.imageSmoothingEnabled = false;
        g.drawImage(
          scratch,
          0,
          0,
          cell,
          cell,
          Math.round((box - content) / 2),
          box - content - foot,
          content,
          content,
        );
        // Shrink-to-fit inside a larger box: GPU REPEAT samples empty pad,
        // not the barrel or boots.
        var hardened = hardenSheetAlpha(frame, 40) || frame;
        hardened._cellGutter = boxPad;
        hardened._fitBox = 1;
        hardened._footGutter = foot;
        hardened.naturalWidth = box;
        hardened.naturalHeight = box;
        hardened.complete = true;
        frames[row][col] = hardened;
      }
    }
  } catch (_error) {
    return null;
  }
  return frames;
}

function buildFriendlyFrameCache(source) {
  return buildCellFrameCache(
    source,
    FRIENDLY_ROWS_COUNT,
    FRIENDLY_COLS,
    FRIENDLY_CELL,
  );
}

function buildLeoFrameCache(source) {
  return buildCellFrameCache(source, LEO_ROWS_COUNT, FRIENDLY_COLS, FRIENDLY_CELL);
}

function friendlyFrame(row, col) {
  if (!runtimeFriendlyFrames || !runtimeFriendlyFrames[row]) return null;
  return runtimeFriendlyFrames[row][col] || null;
}

function leoFrame(row, col) {
  if (!runtimeLeoFrames || !runtimeLeoFrames[row]) return null;
  return runtimeLeoFrames[row][col] || null;
}

function kitFrame(frames, row, col) {
  if (!frames || !frames[row]) return null;
  return frames[row][col] || null;
}

export function isLeoActor(actor) {
  return !!(actor && (actor.knight || actor.role === "knight" || actor.name === "Leo"));
}

export function isDocActor(actor) {
  return !!(actor && actor.name === "Doc");
}

export function isViperActor(actor) {
  return !!(actor && actor.name === "Viper");
}

export function leoAtlasReady() {
  return !!(
    runtimeLeoAtlas &&
    (runtimeLeoAtlas.naturalWidth > 0 || runtimeLeoAtlas.width > 0)
  );
}

export function docAtlasReady() {
  return !!(
    runtimeDocAtlas &&
    (runtimeDocAtlas.naturalWidth > 0 || runtimeDocAtlas.width > 0)
  );
}

export function viperAtlasReady() {
  return !!(
    runtimeViperAtlas &&
    (runtimeViperAtlas.naturalWidth > 0 || runtimeViperAtlas.width > 0)
  );
}

function loadPreferredAtlas(image, pngSrc, label) {
  return loadImage(image).catch(function () {
    if (image.src.indexOf(pngSrc.split("?")[0]) >= 0)
      throw new Error(label + " atlas missing");
    image.src = pngSrc;
    return loadImage(image);
  });
}

function namedSixStateKit(actor) {
  if (isDocActor(actor) && runtimeDocAtlas)
    return { atlas: runtimeDocAtlas, frames: runtimeDocFrames };
  if (isViperActor(actor) && runtimeViperAtlas)
    return { atlas: runtimeViperAtlas, frames: runtimeViperFrames };
  return null;
}

export function isLiveFriendly(actor, team) {
  return !!(
    actor &&
    team !== "enemy" &&
    !zeroHealth(actor) &&
    !actor.downed
  );
}
function buildAtlas(source, boxes) {
  var c = document.createElement("canvas");
  c.width = COLS * CELL;
  c.height = 7 * CELL;
  var g = c.getContext("2d");
  if (!g) throw new Error("2D canvas unavailable");
  var sx = source.naturalWidth / SOURCE_W,
    sy = source.naturalHeight / SOURCE_H;
  Object.keys(ROWS).forEach(function (state) {
    var row = ROWS[state],
      frames = boxes[state];
    frames.forEach(function (b, col) {
      var x = b[0] * sx,
        y = b[1] * sy,
        w = b[2] * sx,
        h = b[3] * sy,
        maxW = 172,
        maxH = 172,
        fit = Math.min(1, maxW / w, maxH / h),
        dw = w * fit,
        dh = h * fit,
        dx = col * CELL + (CELL - dw) / 2,
        dy = row * CELL + CELL - dh;
      g.clearRect(col * CELL, row * CELL, CELL, CELL);
      g.drawImage(source, x, y, w, h, dx, dy, dw, dh);
    });
  });
  return c;
}
export function preloadSoldierAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.06, "LOADING CHARACTER ANIMATION ATLASES");
  var pending = [
    loadImage(friendlyAtlasSource),
    loadImage(leoAtlasSource),
    loadPreferredAtlas(docAtlasSource, DOC_ATLAS_PNG, "Doc"),
    loadPreferredAtlas(viperAtlasSource, VIPER_ATLAS_PNG, "Viper"),
    loadImage(soldierSource),
    loadImage(enemySource),
    loadImage(deathSource),
    loadImage(vaultSheetSource),
    ...Object.values(enemyMonsterSources).map(function (image) {
      return loadImage(image);
    }),
  ];
  var loaded = 0;
  return Promise.all(
    pending.map(function (promise) {
      return promise.then(function (img) {
        loaded++;
        onProgress(
          0.06 + 0.2 * (loaded / pending.length),
          "LOADING CHARACTER ANIMATION ATLASES",
        );
        return img;
      });
    }),
  ).then(async function (imgs) {
    if (imgs.some((image) => !image))
      throw new Error("Character images are not ready");
    onProgress(0.28, "BUILDING CHARACTER ANIMATIONS");
    await yieldToBrowser();
    runtimeFriendlyAtlas =
      hardenSheetAlpha(friendlyAtlasSource) || friendlyAtlasSource;
    runtimeFriendlyFrames = buildFriendlyFrameCache(runtimeFriendlyAtlas);
    onProgress(0.34, "BUILDING CHARACTER ANIMATIONS");
    await yieldToBrowser();
    runtimeLeoAtlas = hardenSheetAlpha(leoAtlasSource) || leoAtlasSource;
    runtimeLeoFrames = buildLeoFrameCache(runtimeLeoAtlas);
    onProgress(0.4, "BUILDING CHARACTER ANIMATIONS");
    await yieldToBrowser();
    runtimeDocAtlas = hardenSheetAlpha(docAtlasSource) || docAtlasSource;
    runtimeDocFrames = buildFriendlyFrameCache(runtimeDocAtlas);
    onProgress(0.46, "BUILDING CHARACTER ANIMATIONS");
    await yieldToBrowser();
    runtimeViperAtlas = hardenSheetAlpha(viperAtlasSource) || viperAtlasSource;
    runtimeViperFrames = buildFriendlyFrameCache(runtimeViperAtlas);
    onProgress(0.52, "BUILDING CHARACTER ANIMATIONS");
    await yieldToBrowser();
    runtimeVaultSheet = hardenSheetAlpha(vaultSheetSource) || vaultSheetSource;
    var types = Object.keys(enemyMonsterSources);
    for (var i = 0; i < types.length; i++) {
      onProgress(
        0.56 + 0.36 * (i / Math.max(1, types.length)),
        "UNWRAPPING " + types[i].toUpperCase() + " SHEET",
      );
      await cleanPackedSheetAsync(
        enemyMonsterSources[types[i]],
        ENEMY_MONSTER_FRAME_WIDTH,
        ENEMY_MONSTER_FRAME_HEIGHT,
      );
    }
    // Legacy crop atlas kept as fallback; enemies still use monster atlas path.
    const soldierAtlas = buildAtlas(soldierSource, FRAME_BOXES);
    const monsterAtlas = buildAtlas(enemySource, ENEMY_FRAME_BOXES);
    runtimeAtlas = runtimeFriendlyAtlas || soldierAtlas;
    runtimeEnemyAtlas = monsterAtlas;
    onProgress(1, "SOLDIERS + MONSTERS READY");
    return { soldierAtlas: runtimeAtlas, monsterAtlas };
  });
}
function vaultSheet() {
  return runtimeVaultSheet || vaultSheetSource;
}

function vaultFrame(actor) {
  var u = actor && actor.vaulting ? Math.min(0.999, (actor.vaultT || 0) / 0.46) : 0;
  var col = u < 0.22 ? 0 : u < 0.5 ? 1 : u < 0.78 ? 2 : 3;
  var sheet = vaultSheet();
  var cellW =
    sheet.naturalWidth > 0
      ? Math.round(sheet.naturalWidth / VAULT_COLS)
      : sheet.width
        ? Math.round(sheet.width / VAULT_COLS)
        : VAULT_CELL;
  var cellH =
    sheet.naturalHeight > 0
      ? sheet.naturalHeight
      : sheet.height || VAULT_CELL;
  return { col: col, nextCol: col, blend: 0, row: 0, w: cellW, h: cellH, state: "vault" };
}
function moving(actor) {
  if (!actor) return false;
  if (actor.vaulting || actor.state === "vault") return true;
  if (actor.state === "walk" || actor.state === "run") return true;
  if (typeof actor.targetX === "number" && typeof actor.targetY === "number")
    return Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > 8;
  return false;
}
function shooting(actor) {
  return !!(
    actor &&
    ((actor.muzzle && actor.muzzle > 0) ||
      (actor.shootTimer && actor.shootTimer > 0) ||
      actor.state === "shoot")
  );
}
function pinnedDown(actor) {
  return !!(actor && (actor.suppressTimer || 0) > 0 && (actor.suppressStacks || 0) >= 1);
}
function lowCover(actor) {
  if (pinnedDown(actor) && actor.cover) return true;
  return !!(actor && actor.cover && actor.cover.type === "low");
}
function peekingFromCover(actor) {
  return !!(
    actor &&
    actor.cover &&
    (actor.exposed ||
      actor.combatState === "exposed" ||
      actor.combatState === "peeking" ||
      (actor.peek && actor.peek > 0))
  );
}
export function coverPlantOffset(actor) {
  if (!actor || !actor.cover || actor.dead || actor.downed)
    return { x: 0, y: 0, squat: 0 };
  var c = actor.cover,
    dx = c.x - actor.x,
    dy = c.y - actor.y,
    dist = Math.hypot(dx, dy),
    reach = Math.max(c.w, c.h) * 0.7 + 46;
  if (dist > reach) return { x: 0, y: 0, squat: 0 };
  var len = dist || 1,
    sx = (dx - dy) / len,
    sy = (dx + dy) / len,
    peeking = peekingFromCover(actor),
    low = lowCover(actor),
    pull = peeking ? -6 : 8,
    squat = low
      ? peeking
        ? pinnedDown(actor)
          ? 6
          : 2
        : pinnedDown(actor)
          ? 10
          : 7
      : peeking
        ? 0
        : 3;
  return {
    x: sx * pull,
    y: sy * pull * 0.42 + squat,
    squat: squat,
  };
}
function zeroHealth(actor) {
  return !!(actor && (actor.hp <= 0 || actor.dead));
}
function desiredLeoState(actor) {
  if (zeroHealth(actor)) return "death";
  if (actor.vaulting || actor.state === "vault") return "run";
  if (actor.downed) return "shieldBlock";
  if (actor.reloading || actor.state === "reload") return "reload";
  if ((actor.meleeTimer || 0) > 0.2) return "meleeSwing";
  if (actor.combatState === "melee") return "shieldBlock";
  if (shooting(actor)) return "standShoot";
  if (actor.blocking && moving(actor)) return "shieldRaise";
  if (actor.blocking) return "shieldBlock";
  if (actor.cover) {
    return peekingFromCover(actor) ? "standShoot" : "shieldBlock";
  }
  if (moving(actor)) return "run";
  return "idle";
}
function desiredSoldierState(actor) {
  if (!actor) return "idle";
  if (isLeoActor(actor)) return desiredLeoState(actor);
  if (zeroHealth(actor)) return "death";
  if (actor.vaulting || actor.state === "vault") return "vault";
  if (actor.downed) return "crouchShoot";
  if (actor.reloading || actor.state === "reload") return "reload";
  if (
    actor.combatState === "melee" ||
    (actor.meleeTimer && actor.meleeTimer > 0.12)
  )
    return "standShoot";
  if (shooting(actor)) {
    if (lowCover(actor)) return "crouchShoot";
    return "standShoot";
  }
  // World cover props are drawn separately — never use a baked barrier pose.
  if (actor.cover) {
    if (lowCover(actor)) return "crouchShoot";
    return peekingFromCover(actor) ? "standShoot" : "idle";
  }
  if (moving(actor)) return "run";
  return "idle";
}
export function getSoldierState(actor) {
  var desired = desiredSoldierState(actor),
    now = nowMs();
  if (!actor) return desired;
  if (!actor.__visualAnimState) {
    actor.__visualAnimState = desired;
    actor.__soldierStateStart = now;
    actor.__animLockUntil = now + (STATE_HOLD_MS[desired] || 180);
    return desired;
  }
  if (desired === actor.__visualAnimState) {
    // Refresh shoot locks while still firing so the cycle does not snap early.
    if (
      desired === "shoot" ||
      desired === "crouchShoot" ||
      desired === "standShoot" ||
      desired === "meleeSwing"
    )
      actor.__animLockUntil = Math.max(
        actor.__animLockUntil || 0,
        now + (STATE_HOLD_MS[desired] || 140),
      );
    return actor.__visualAnimState;
  }
  var urgent =
    desired === "death" ||
    desired === "vault" ||
    desired === "shoot" ||
    desired === "crouchShoot" ||
    desired === "standShoot" ||
    desired === "meleeSwing" ||
    desired === "reload" ||
    actor.__visualAnimState === "death";
  if (urgent || now >= (actor.__animLockUntil || 0)) {
    actor.__visualAnimState = desired;
    actor.__soldierStateStart = now;
    actor.__animLockUntil = now + (STATE_HOLD_MS[desired] || 180);
  }
  return actor.__visualAnimState;
}
function stableFacing(actor, state) {
  if (!actor) return 1;
  var now = nowMs(),
    fx = Number(actor.facingX) || 0,
    fy = Number(actor.facingY) || 0,
    screenDir = fx - fy,
    mag = Math.abs(screenDir),
    desired = screenDir < 0 ? -1 : 1,
    isShot =
      state === "shoot" ||
      state === "crouchShoot" ||
      state === "standShoot" ||
      state === "meleeSwing" ||
      state === "shieldRaise";
  if (actor.__visualFacing !== -1 && actor.__visualFacing !== 1)
    actor.__visualFacing = mag > 0.12 ? desired : 1;
  if (state === "death") return actor.__visualFacing;
  if (mag < 0.22) return actor.__visualFacing;
  if (isShot) {
    if (
      now >= (actor.__faceLockUntil || 0) &&
      desired !== actor.__visualFacing &&
      mag > 0.34
    )
      actor.__visualFacing = desired;
    actor.__faceLockUntil = now + 420;
    actor.__faceCandidate = desired;
    actor.__faceCandidateAt = now;
    return actor.__visualFacing;
  }
  if (now < (actor.__faceLockUntil || 0)) return actor.__visualFacing;
  if (desired === actor.__visualFacing) {
    actor.__faceCandidate = desired;
    actor.__faceCandidateAt = now;
    return actor.__visualFacing;
  }
  if (mag < 0.42) return actor.__visualFacing;
  if (actor.__faceCandidate !== desired) {
    actor.__faceCandidate = desired;
    actor.__faceCandidateAt = now;
    return actor.__visualFacing;
  }
  if (mag > 0.9 || now - (actor.__faceCandidateAt || now) > 190) {
    actor.__visualFacing = desired;
    actor.__faceLockUntil = now + 260;
  }
  return actor.__visualFacing;
}

/** Snap-ish frames: only a tiny ~15% crossfade near the end of each frame. */

function frameForLeo(actor, state) {
  var rowKey = state === "shoot" ? "standShoot" : state;
  if (LEO_ROWS[rowKey] == null) rowKey = "idle";
  var row = LEO_ROWS[rowKey];
  var now = nowMs();
  if (actor.__lastSoldierState !== state) {
    actor.__lastSoldierState = state;
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000);
  var fps = LEO_FPS[rowKey] || 4;
  if (rowKey === "run" && actor) {
    var spd = 0;
    if (typeof actor.vx === "number" && typeof actor.vy === "number")
      spd = Math.hypot(actor.vx, actor.vy);
    fps = Math.max(6, Math.min(11, fps * (0.75 + 0.4 * Math.min(1, spd / 90 || spd || 0.5))));
  }
  var count = FRIENDLY_COLS;
  var phase = elapsed * fps;
  var col, next, blend;
  if (rowKey === "death" || rowKey === "meleeSwing") {
    phase = Math.min(count - 1.001, phase);
    col = Math.min(count - 1, Math.floor(phase));
    next = Math.min(count - 1, col + 1);
    blend = softenBlend(phase - col);
  } else {
    col = Math.floor(phase) % count;
    next = (col + 1) % count;
    var frac = phase - Math.floor(phase);
    blend = frac < 0.18 ? 0 : frac > 0.82 ? 1 : softenBlend((frac - 0.18) / 0.64);
  }
  return {
    col: col,
    nextCol: next,
    blend: blend,
    row: row,
    w: FRIENDLY_CELL,
    h: FRIENDLY_CELL,
    state: rowKey,
  };
}

function frameForFriendly(actor, state) {
  var rowKey = state === "shoot" ? "standShoot" : state;
  if (rowKey === "tallCover") rowKey = "idle";
  if (rowKey === "lowCover") rowKey = "crouchShoot";
  if (FRIENDLY_ROWS[rowKey] == null) rowKey = "idle";
  var row = FRIENDLY_ROWS[rowKey];
  var now = nowMs();
  if (actor.__lastSoldierState !== state) {
    actor.__lastSoldierState = state;
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000);
  var fps = FRIENDLY_FPS[rowKey] || 4;
  if (rowKey === "run" && actor) {
    var spd = 0;
    if (typeof actor.vx === "number" && typeof actor.vy === "number")
      spd = Math.hypot(actor.vx, actor.vy);
    fps = Math.max(6, Math.min(11, fps * (0.75 + 0.4 * Math.min(1, spd / 90 || spd || 0.5))));
  }
  var count = FRIENDLY_COLS;
  var phase = elapsed * fps;
  var col, next, blend;
  if (rowKey === "death") {
    phase = Math.min(count - 1.001, phase);
    col = Math.min(count - 1, Math.floor(phase));
    next = Math.min(count - 1, col + 1);
    blend = softenBlend(phase - col);
  } else {
    col = Math.floor(phase) % count;
    next = (col + 1) % count;
    // Light snap — opaque sheets look milky if blend stays mid-frame long.
    var frac = phase - Math.floor(phase);
    blend = frac < 0.18 ? 0 : frac > 0.82 ? 1 : softenBlend((frac - 0.18) / 0.64);
  }
  return {
    col: col,
    nextCol: next,
    blend: blend,
    row: row,
    w: FRIENDLY_CELL,
    h: FRIENDLY_CELL,
    state: rowKey,
  };
}

function softenBlend(blend) {
  var b = Math.max(0, Math.min(1, blend || 0));
  if (b < 0.85) return 0;
  return (b - 0.85) / 0.15;
}
function frameFor(actor, state, boxes) {
  var frames = boxes[state] || boxes.idle,
    row = ROWS[state] || 0,
    now = nowMs(),
    count = frames.length;
  if (actor.__lastSoldierState !== state) {
    actor.__lastSoldierState = state;
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000),
    fps = FPS[state] || 4;
  // Slightly pace run cycles to travel speed so feet do not skate.
  if (state === "run" && actor) {
    var spd = 0;
    if (typeof actor.vx === "number" && typeof actor.vy === "number")
      spd = Math.hypot(actor.vx, actor.vy);
    else if (
      typeof actor.targetX === "number" &&
      typeof actor.targetY === "number"
    )
      spd = Math.min(
        1,
        Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) / 140,
      );
    fps = Math.max(6, Math.min(11, fps * (0.75 + 0.4 * Math.min(1, spd / 90 || spd))));
  }
  var phase = elapsed * fps,
    col = Math.floor(phase) % count,
    next = (col + 1) % count,
    blend = softenBlend(phase - Math.floor(phase));
  if (!LOOP_STATES[state]) {
    col = Math.min(count - 1, Math.floor(phase));
    next = Math.min(count - 1, col + 1);
    blend = col === next ? 0 : softenBlend(Math.min(1, phase - col));
  }
  return {
    x: col * CELL,
    y: row * CELL,
    nextX: next * CELL,
    nextY: row * CELL,
    w: CELL,
    h: CELL,
    state: state,
    col: col,
    nextCol: next,
    blend: blend,
  };
}
function deathFrame(actor) {
  var now = nowMs();
  if (actor.__lastSoldierState !== "death") {
    actor.__lastSoldierState = "death";
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000),
    phase = Math.min(DEATH_FRAMES - 1.001, elapsed * DEATH_FPS),
    frame = Math.min(DEATH_FRAMES - 1, Math.floor(phase)),
    next = Math.min(DEATH_FRAMES - 1, frame + 1),
    blend = softenBlend(phase - frame);
  return { frame: frame, next: next, blend: blend, elapsed: elapsed };
}
function teamFilter(team) {
  if (team === "ally")
    return "sepia(.35) saturate(1.35) hue-rotate(155deg) brightness(1.05)";
  if (team === "marine")
    return "sepia(.28) saturate(1.2) hue-rotate(55deg) brightness(.94)";
  return "none";
}

export function getEnemyMonsterSheet(type) {
  const source = enemyMonsterSources[type];
  if (!source) return null;
  return {
    type: type,
    file: ENEMY_MONSTER_FILES[type],
    source: cleanPackedSheet(
      source,
      ENEMY_MONSTER_FRAME_WIDTH,
      ENEMY_MONSTER_FRAME_HEIGHT,
    ),
    width: ENEMY_MONSTER_SHEET_WIDTH,
    height: ENEMY_MONSTER_SHEET_HEIGHT,
    frameWidth: ENEMY_MONSTER_FRAME_WIDTH,
    frameHeight: ENEMY_MONSTER_FRAME_HEIGHT,
    frames: ENEMY_MONSTER_FRAMES,
    rows: ENEMY_MONSTER_ROWS,
  };
}

function enemyMonsterState(actor, now) {
  if (zeroHealth(actor)) return "death";
  var hit = Math.max(0, actor.hit || 0),
    muzzle = Math.max(0, actor.muzzle || 0);
  if (hit > (actor.__monsterLastHit || 0) + 0.025)
    actor.__monsterHitUntil = now + 460;
  if (muzzle > (actor.__monsterLastMuzzle || 0) + 0.025)
    actor.__monsterShootUntil = now + 520;
  actor.__monsterLastHit = hit;
  actor.__monsterLastMuzzle = muzzle;
  var desired =
      now < (actor.__monsterHitUntil || 0)
        ? "hit"
        : now < (actor.__monsterShootUntil || 0)
          ? "shoot"
          : actor.cover
            ? lowCover(actor)
              ? "lowCover"
              : "tallCover"
            : moving(actor)
              ? "run"
              : "idle",
    urgent = desired === "hit" || desired === "shoot";
  if (!actor.__monsterVisualState) {
    actor.__monsterVisualState = desired;
    actor.__monsterStateStart = now;
    actor.__monsterStateLockUntil = now + 240;
  } else if (
    actor.__monsterVisualState !== desired &&
    (urgent || now >= (actor.__monsterStateLockUntil || 0))
  ) {
    actor.__monsterVisualState = desired;
    actor.__monsterStateStart = now;
    actor.__monsterStateLockUntil = now + (urgent ? 220 : 280);
  }
  return actor.__monsterVisualState;
}

function enemyMonsterFrame(actor, state, now) {
  var count = ENEMY_MONSTER_FRAMES;
  if (state === "death") {
    const duration = Math.max(0.01, actor.deathDuration || 0.8),
      progress = Math.min(0.999, Math.max(0, (actor.deathTimer || 0) / duration)),
      phase = progress * (count - 1),
      frame = Math.min(count - 1, Math.floor(phase)),
      next = Math.min(count - 1, frame + 1),
      blend = phase - frame;
    return {
      frame: frame,
      next: next,
      blend: softenBlend(blend),
    };
  }
  var stateStart = Number.isFinite(actor.__monsterStateStart)
      ? actor.__monsterStateStart
      : now,
    elapsed = Math.max(0, (now - stateStart) / 1000),
    fps =
      state === "run"
        ? 7.5
        : state === "shoot"
          ? 9
          : state === "hit"
            ? 8
            : state === "lowCover" || state === "tallCover"
              ? 3.0
              : 3.2,
    phase = elapsed * fps;
  if (state === "hit") {
    var hf = Math.min(count - 1, Math.floor(phase)),
      hn = Math.min(count - 1, hf + 1),
      hb = Math.min(1, phase - hf);
    return { frame: hf, next: hn, blend: softenBlend(hb) };
  }
  var frame = Math.floor(phase) % count,
    next = (frame + 1) % count,
    blend = phase - Math.floor(phase);
  return { frame: frame, next: next, blend: softenBlend(blend) };
}

function drawBlendedSheetFrame(
  ctx,
  source,
  frame,
  next,
  blend,
  row,
  frameW,
  frameH,
  dx,
  dy,
  dw,
  dh,
  baseAlpha,
  inset,
) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  var pad = Math.max(0, inset || 0),
    iw = (source && (source.naturalWidth || source.width)) || 0,
    maxCol = frameW > 0 && iw > 0 ? Math.max(0, Math.floor(iw / frameW) - 1) : 0,
    col0 = frame < 0 ? 0 : frame > maxCol ? maxCol : frame | 0,
    col1 = next < 0 ? 0 : next > maxCol ? maxCol : next | 0,
    sx0 = col0 * frameW + pad,
    sy0 = row * frameH + pad,
    sw = Math.max(1, frameW - pad * 2),
    sh = Math.max(1, frameH - pad * 2),
    a0 = baseAlpha * (1 - blend),
    a1 = baseAlpha * blend;
  if (a0 <= 0.02 && (a1 <= 0.02 || col1 === col0)) {
    ctx.globalAlpha = baseAlpha;
    drawClampedSheetFrame(ctx, source, sx0, sy0, sw, sh, dx, dy, dw, dh);
  } else {
    if (a0 > 0.02) {
      ctx.globalAlpha = a0;
      drawClampedSheetFrame(ctx, source, sx0, sy0, sw, sh, dx, dy, dw, dh);
    }
    if (a1 > 0.02 && col1 !== col0) {
      ctx.globalAlpha = a1;
      drawClampedSheetFrame(
        ctx,
        source,
        col1 * frameW + pad,
        sy0,
        sw,
        sh,
        dx,
        dy,
        dw,
        dh,
      );
    }
  }
  ctx.globalAlpha = 1;
}

export function drawEnemyMonster(ctx, actor, options) {
  const sheet = getEnemyMonsterSheet(actor && actor.type),
    source = sheet && sheet.source;
  if (!source || source.complete === false || !(source.naturalWidth || source.width))
    return false;
  options = options || {};
  const now = nowMs(),
    state = enemyMonsterState(actor, now),
    anim = enemyMonsterFrame(actor, state, now),
    row = ENEMY_MONSTER_ROWS[state],
    baseScale = options.scale == null ? 0.38 : options.scale * 1.27,
    scale = baseScale * (actor.scale || 1),
    flip = stableFacing(actor, state),
    baseAlpha = options.alpha == null ? 1 : options.alpha;
  var plant = coverPlantOffset(actor);
  var layout = packedCellLayout(
    source,
    ENEMY_MONSTER_FRAME_WIDTH,
    ENEMY_MONSTER_FRAME_HEIGHT,
  );
  var dest = packedSpriteDest(
    layout,
    scale,
    state === "lowCover" ? 4 : state === "tallCover" ? 2 : 0,
  );
  ctx.save();
  ctx.translate(
    (options.x || 0) + plant.x,
    (options.y || 0) + plant.y - (actor && actor.vaultZ ? actor.vaultZ : 0),
  );
  ctx.globalAlpha = baseAlpha;
  ctx.fillStyle = "#0007";
  ctx.beginPath();
  ctx.ellipse(
    0,
    2,
    Math.max(8, dest.bodyW * 0.22),
    Math.max(2, dest.bodyH * 0.05),
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.scale(flip, 1);
  drawBlendedSheetFrame(
    ctx,
    source,
    anim.frame,
    anim.next,
    anim.blend,
    row,
    layout.cellW,
    layout.cellH,
    dest.dx,
    dest.dy,
    dest.dw,
    dest.dh,
    baseAlpha,
    dest.inset,
  );
  ctx.restore();
  return true;
}
function drawDeath(ctx, actor, options, scale, flip) {
  if (!deathSource.complete || !deathSource.naturalWidth) return false;
  var d = deathFrame(actor),
    sw = deathSource.naturalWidth / DEATH_FRAMES,
    sh = deathSource.naturalHeight,
    deathScale = scale * DEATH_SCALE,
    dw = sw * deathScale,
    dh = sh * deathScale,
    baseAlpha = options.alpha == null ? 1 : options.alpha;
  ctx.save();
  ctx.scale(flip, 1);
  ctx.filter = teamFilter(options.team || "player");
  drawBlendedSheetFrame(
    ctx,
    deathSource,
    d.frame,
    d.next,
    d.blend,
    0,
    sw,
    sh,
    -dw * 0.5,
    -dh,
    dw,
    dh,
    baseAlpha,
    5,
  );
  ctx.restore();
  return true;
}
export function drawSoldier(ctx, actor, options) {
  options = options || {};
  var team = options.team || "player",
    isEnemy = team === "enemy",
    boxes = isEnemy ? ENEMY_FRAME_BOXES : FRAME_BOXES,
    atlas = isEnemy ? runtimeEnemyAtlas : runtimeAtlas,
    state = options.state || getSoldierState(actor),
    baseScale = options.scale == null ? 0.28 : options.scale,
    scale = baseScale * (actor && actor.scale ? actor.scale : 1),
    flip = stableFacing(actor, state),
    bob = 0,
    plant = coverPlantOffset(actor),
    enemyCorpse = false;
  var vaultLift = actor && actor.vaultZ ? actor.vaultZ : 0;
  ctx.save();
  ctx.translate(
    (options.x || 0) + plant.x,
    (options.y || 0) + bob + plant.y - vaultLift,
  );
  var useLeo = !isEnemy && isLeoActor(actor) && !!runtimeLeoAtlas;
  var namedKit = !isEnemy && !useLeo ? namedSixStateKit(actor) : null;
  var useNamedKit = !!namedKit;
  var solidFriendly =
    !isEnemy &&
    !!(useLeo ? runtimeLeoAtlas : namedKit ? namedKit.atlas : runtimeFriendlyAtlas);
  var recolor = options.recolorFilter || "";
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = solidFriendly ? recolor || "none" : teamFilter(team);
  ctx.globalAlpha = solidFriendly ? 1 : options.alpha == null ? 1 : options.alpha;
  if (state === "death") {
    if (isEnemy) {
      state = "lowCover";
      enemyCorpse = true;
    } else if (
      !runtimeFriendlyAtlas &&
      !useLeo &&
      !useNamedKit &&
      drawDeath(ctx, actor, options, scale, flip)
    ) {
      ctx.restore();
      return;
    } else if (!runtimeFriendlyAtlas && !useLeo && !useNamedKit) state = "lowCover";
  }
  var vaultSrc = vaultSheet();
  var useVault =
      state === "vault" &&
      vaultSrc &&
      (vaultSrc.complete !== false) &&
      (vaultSrc.naturalWidth > 0 || vaultSrc.width > 0);
  var useFriendly = !isEnemy && runtimeFriendlyAtlas && !useLeo && !useNamedKit;
  // Atlas cells include padding so the figure is smaller than the cell.
  if (useFriendly || useLeo || useNamedKit) scale *= 1.15;
  var r = useVault
      ? vaultFrame(actor)
      : useLeo
        ? frameForLeo(actor, state === "vault" ? "run" : state)
        : useFriendly || useNamedKit
          ? frameForFriendly(actor, state === "vault" ? "run" : state)
          : frameFor(actor, state === "vault" ? "run" : state, boxes);
  var cellW = useVault ? r.w : useFriendly || useLeo || useNamedKit ? FRIENDLY_CELL : CELL;
  var cellH = useVault ? r.h : useFriendly || useLeo || useNamedKit ? FRIENDLY_CELL : r.h;
  var dw = cellW * scale * (useVault ? 1.08 : 1);
  var dh = cellH * scale * (useVault ? 1.08 : 1);
  ctx.fillStyle = "#0007";
  ctx.beginPath();
  ctx.ellipse(
    0,
    2,
    Math.max(7, dw * 0.22),
    Math.max(2, dh * 0.05),
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (enemyCorpse) {
    ctx.translate(0, 4);
    ctx.scale(1, 0.62);
    ctx.globalAlpha *= 0.82;
  }
  ctx.scale(flip, 1);
  // Live friendlies: one opaque blit. No filter, no crossfade, no ghost plate.
  var isolatedFriendlyFrame =
    useFriendly && !useVault ? friendlyFrame(r.row, r.col) : null;
  var isolatedLeoFrame = useLeo && !useVault ? leoFrame(r.row, r.col) : null;
  var isolatedNamedFrame =
    useNamedKit && !useVault ? kitFrame(namedKit.frames, r.row, r.col) : null;
  var isolatedCell = isolatedLeoFrame || isolatedNamedFrame || isolatedFriendlyFrame;
  ctx.filter = solidFriendly ? "none" : teamFilter(team);
  ctx.imageSmoothingEnabled = true;
  var drawAtlas = useVault
    ? vaultSrc
    : useLeo
      ? isolatedLeoFrame || runtimeLeoAtlas
      : useNamedKit
        ? isolatedNamedFrame || namedKit.atlas
        : useFriendly
          ? isolatedFriendlyFrame || runtimeFriendlyAtlas
          : atlas;
  if (drawAtlas) {
    var baseAlpha = solidFriendly ? 1 : options.alpha == null ? 1 : options.alpha;
    if (enemyCorpse) baseAlpha *= 0.82;
    var coverNudge =
      state === "lowCover" || state === "crouchShoot"
        ? 5
        : state === "tallCover"
          ? 2
          : 0;
    var fitBox = !!(isolatedCell && isolatedCell._fitBox);
    var gutter = fitBox
      ? 0
      : isolatedCell && isolatedCell._cellGutter != null
        ? isolatedCell._cellGutter
        : isolatedCell && isolatedCell.width > cellW
          ? Math.round((isolatedCell.width - cellW) / 2)
          : 0;
    var srcX = isolatedCell ? (fitBox ? 0 : gutter) : r.col * cellW;
    var srcY = isolatedCell ? (fitBox ? 0 : gutter) : (useVault ? 0 : r.row) * cellH;
    var srcW = fitBox ? isolatedCell.width : cellW;
    var srcH = fitBox ? isolatedCell.height : cellH;
    if (fitBox) {
      dw = srcW * scale * (useVault ? 1.08 : 1);
      dh = srcH * scale * (useVault ? 1.08 : 1);
    }
    var destX = -dw * 0.5;
    var destY = -dh + (fitBox ? isolatedCell._footGutter || 0 : 0) * scale + coverNudge;
    if (solidFriendly) {
      ctx.globalAlpha = 1;
      ctx.filter = recolor || "none";
      ctx.globalCompositeOperation = "source-over";
      // Nearest-neighbor keeps binary atlas alpha; bilinear smoothing
      // invents milky fringe when the 160px cell is drawn small.
      ctx.imageSmoothingEnabled = false;
      drawClampedSheetFrame(
        ctx,
        drawAtlas,
        srcX,
        srcY,
        srcW,
        srcH,
        destX,
        destY,
        dw,
        dh,
      );
    } else {
      drawBlendedSheetFrame(
        ctx,
        drawAtlas,
        r.col,
        r.nextCol,
        r.blend || 0,
        useVault ? 0 : useFriendly || useLeo || useNamedKit ? r.row : ROWS[r.state] || 0,
        cellW,
        cellH,
        destX,
        destY,
        dw,
        dh,
        baseAlpha,
        useVault ? 1 : 2,
      );
    }
  } else {
    ctx.filter = "none";
    ctx.fillStyle = isEnemy
      ? "#7a4a38"
      : team === "ally"
        ? "#477da8"
        : team === "marine"
          ? "#607247"
          : "#56646b";
    ctx.fillRect(-7, -26, 14, 24);
    ctx.fillStyle = isEnemy ? "#9b6a4e" : "#9b9d9a";
    ctx.beginPath();
    ctx.arc(0, -30, isEnemy ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
export function getSoldierAtlasInfo() {
  return {
    sourceWidth: SOURCE_W,
    sourceHeight: SOURCE_H,
    cell: CELL,
    rows: ROWS,
    deathFrames: DEATH_FRAMES,
    deathDuration: DEATH_DURATION,
    deathScale: DEATH_SCALE,
    enemySource: "198C101B-E186-4852-A270-3F04D83451ED.png",
    enemyMonsterSheets: Object.assign({}, ENEMY_MONSTER_FILES),
    enemyMonsterFrame: {
      width: ENEMY_MONSTER_FRAME_WIDTH,
      height: ENEMY_MONSTER_FRAME_HEIGHT,
      columns: ENEMY_MONSTER_FRAMES,
      rows: ENEMY_MONSTER_ROWS,
    },
    frameCounts: {
      idle: FRIENDLY_COLS,
      run: FRIENDLY_COLS,
      shoot: FRIENDLY_COLS,
      crouchShoot: FRIENDLY_COLS,
      standShoot: FRIENDLY_COLS,
      reload: FRIENDLY_COLS,
      death: FRIENDLY_COLS,
      meleeSwing: FRIENDLY_COLS,
      shieldRaise: FRIENDLY_COLS,
      shieldBlock: FRIENDLY_COLS,
      vault: VAULT_COLS,
    },
    friendlyAtlas: "player-solid-atlas.png",
    friendlyCell: FRIENDLY_CELL,
    friendlyCols: FRIENDLY_COLS,
    friendlyStates: FRIENDLY_ATLAS_STATES.slice(),
    leoAtlas: "leo-atlas.webp",
    leoStates: LEO_ATLAS_STATES.slice(),
    leoRows: LEO_ROWS_COUNT,
    docAtlas: "doc-atlas.webp",
    docAtlasPng: "doc-atlas.png",
    docStates: DOC_ATLAS_STATES.slice(),
    viperAtlas: "viper-atlas.webp",
    viperAtlasPng: "viper-atlas.png",
    viperStates: VIPER_ATLAS_STATES.slice(),
    coverRows: "mapped",
    vaultSheet: "vault-sheet.png",
    vaultCell: VAULT_CELL,
    cellGutter: CELL_GUTTER,
    unwrapPad: UNWRAP_PAD,
    spriteBoxPad: SPRITE_BOX_PAD,
    spriteFit: SPRITE_FIT,
    wrapFix: "fit-box-empty-uv-edges",
  };
}
