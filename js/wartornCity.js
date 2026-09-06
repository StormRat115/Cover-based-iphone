import { loadImage } from "./assets.js?v=20260906-83";

function plate(file) {
  var image = new Image();
  image.src = "./assets/generated/world/" + file + "?v=20260906-83";
  return image;
}

export const wartornSkyline = plate("wartorn-skyline-backdrop.png");
export const wartornStreet = plate("wartorn-street-plate.png");
export const wartornRuin = plate("wartorn-ruin-building-a.png");
export const wartornRubblePile = plate("wartorn-rubble-pile.png");
export const wartornRuinCut = plate("wartorn-ruin-building-a-cut.webp");
export const wartornRubbleCut = plate("wartorn-rubble-pile-cut.webp");
export const facadeApartment = plate("facade-ruin-apartment.webp");
export const facadeStorefront = plate("facade-ruin-storefront.webp");
export const rubbleBrick = plate("rubble-brick.webp");
export const rubbleConcrete = plate("rubble-concrete-rebar.webp");
export const rubbleSandbags = plate("rubble-sandbags-crates.webp");
export const rubbleScrap = plate("rubble-scrap-metal.webp");
export const wreckSedan = plate("wreck-burnt-sedan.webp");
export const wreckPickup = plate("wreck-burnt-pickup.webp");
export const wreckArmored = plate("wreck-burnt-armored.webp");
export const skylineSmoke = plate("skyline-smoke-backdrop.webp");

var ROAD = 980;
var OPAQUE_PLATES = [wartornRuin, wartornRubblePile];

var STREET_SCENES = [
  { x: -1480, y: 720, s: 1.05 },
  { x: 1520, y: 680, s: 1.0 },
  { x: -1620, y: -280, s: 0.98 },
  { x: 1660, y: -320, s: 0.96 },
  { x: -1540, y: -1480, s: 1.02 },
  { x: 1580, y: -1420, s: 1.0 },
  { x: -1680, y: -2680, s: 0.94 },
  { x: 1720, y: -2620, s: 0.96 },
  { x: -1560, y: -3880, s: 1.0 },
  { x: 1600, y: -3820, s: 0.98 },
  { x: -1640, y: -5080, s: 0.96 },
  { x: 1680, y: -5020, s: 1.02 },
  { x: -1500, y: -6180, s: 0.94 },
  { x: 1540, y: -6120, s: 0.96 },
];

var SIDE_DRESSING = [
  { x: -1280, y: 820, kind: "ruin", s: 0.92 },
  { x: 1320, y: 780, kind: "apartment", s: 0.88 },
  { x: -1420, y: 220, kind: "storefront", s: 0.86 },
  { x: 1460, y: 180, kind: "ruin", s: 0.9 },
  { x: -1360, y: -280, kind: "apartment", s: 0.84 },
  { x: 1380, y: -320, kind: "storefront", s: 0.82 },
  { x: -1480, y: -860, kind: "ruin", s: 0.94 },
  { x: 1500, y: -820, kind: "apartment", s: 0.9 },
  { x: -1320, y: -1480, kind: "storefront", s: 0.8 },
  { x: 1400, y: -1520, kind: "ruin", s: 0.86 },
  { x: -1440, y: -2140, kind: "apartment", s: 0.88 },
  { x: 1460, y: -2080, kind: "storefront", s: 0.84 },
  { x: -1380, y: -2780, kind: "ruin", s: 0.9 },
  { x: 1420, y: -2720, kind: "apartment", s: 0.86 },
  { x: -1500, y: -3440, kind: "storefront", s: 0.82 },
  { x: 1520, y: -3380, kind: "ruin", s: 0.88 },
  { x: -1340, y: -4100, kind: "apartment", s: 0.9 },
  { x: 1360, y: -4040, kind: "storefront", s: 0.84 },
  { x: -1460, y: -4780, kind: "ruin", s: 0.92 },
  { x: 1480, y: -4720, kind: "apartment", s: 0.88 },
  { x: -1400, y: -5420, kind: "storefront", s: 0.86 },
  { x: 1440, y: -5360, kind: "ruin", s: 0.9 },
  { x: -1280, y: -6080, kind: "apartment", s: 0.84 },
  { x: 1300, y: -6000, kind: "storefront", s: 0.82 },
];

var RUBBLE = [
  { x: -1040, y: 640, kind: "pile", s: 0.52 },
  { x: 1060, y: 600, kind: "brick", s: 0.46 },
  { x: -1100, y: 80, kind: "concrete", s: 0.44 },
  { x: 1120, y: 40, kind: "sandbags", s: 0.48 },
  { x: -1060, y: -520, kind: "scrap", s: 0.46 },
  { x: 1080, y: -560, kind: "pile", s: 0.5 },
  { x: -1120, y: -1180, kind: "brick", s: 0.42 },
  { x: 1140, y: -1220, kind: "concrete", s: 0.46 },
  { x: -1080, y: -1860, kind: "sandbags", s: 0.48 },
  { x: 1100, y: -1900, kind: "scrap", s: 0.44 },
  { x: -1140, y: -2540, kind: "pile", s: 0.5 },
  { x: 1160, y: -2580, kind: "brick", s: 0.42 },
  { x: -1060, y: -3220, kind: "concrete", s: 0.48 },
  { x: 1080, y: -3260, kind: "sandbags", s: 0.44 },
  { x: -1120, y: -3900, kind: "scrap", s: 0.46 },
  { x: 1140, y: -3940, kind: "pile", s: 0.5 },
  { x: -1080, y: -4580, kind: "brick", s: 0.44 },
  { x: 1100, y: -4620, kind: "concrete", s: 0.46 },
  { x: -1140, y: -5260, kind: "sandbags", s: 0.42 },
  { x: 1160, y: -5300, kind: "scrap", s: 0.48 },
  { x: -1060, y: -5900, kind: "pile", s: 0.46 },
  { x: 1080, y: -5840, kind: "brick", s: 0.44 },
];

var WRECKS = [
  { x: -1180, y: 420, kind: "sedan", s: 0.58 },
  { x: 1220, y: 360, kind: "pickup", s: 0.56 },
  { x: -1240, y: -720, kind: "armored", s: 0.54 },
  { x: 1260, y: -780, kind: "sedan", s: 0.56 },
  { x: -1200, y: -1980, kind: "pickup", s: 0.52 },
  { x: 1240, y: -2040, kind: "armored", s: 0.54 },
  { x: -1260, y: -3240, kind: "sedan", s: 0.56 },
  { x: 1280, y: -3300, kind: "pickup", s: 0.52 },
  { x: -1220, y: -4500, kind: "armored", s: 0.54 },
  { x: 1260, y: -4560, kind: "sedan", s: 0.56 },
  { x: -1180, y: -5720, kind: "pickup", s: 0.52 },
  { x: 1220, y: -5660, kind: "armored", s: 0.54 },
];

var SMOKE = [
  { x: -1240, y: 400, s: 0.55 },
  { x: 1280, y: -200, s: 0.5 },
  { x: -1300, y: -1600, s: 0.62 },
  { x: 1340, y: -2800, s: 0.48 },
  { x: -1260, y: -4000, s: 0.58 },
  { x: 1300, y: -5200, s: 0.52 },
];

function ready(image) {
  return !!(image && image.complete && image.naturalWidth > 0);
}

function punchDarkPlate(image) {
  if (!image) return image;
  if (image.__punched) return image.__punched;
  if (!ready(image)) return image;
  var canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  var ctx = canvas.getContext && canvas.getContext("2d");
  if (!ctx || typeof ctx.drawImage !== "function") {
    image.__punched = image;
    return image;
  }
  ctx.drawImage(image, 0, 0);
  var data;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (err) {
    image.__punched = image;
    return image;
  }
  if (!data || !data.data) {
    image.__punched = image;
    return image;
  }
  var px = data.data,
    w = canvas.width,
    h = canvas.height,
    n = w * h,
    mark = new Uint8Array(n),
    stack = [],
    i,
    x,
    y,
    o,
    luma,
    chroma;
  function tryPush(pxX, pxY) {
    if (pxX < 0 || pxY < 0 || pxX >= w || pxY >= h) return;
    var idx = pxY * w + pxX;
    if (mark[idx]) return;
    var off = idx * 4;
    var r = px[off],
      g = px[off + 1],
      b = px[off + 2];
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (luma <= 42 && chroma < 24) {
      mark[idx] = 1;
      stack.push(idx);
    } else mark[idx] = 2;
  }
  for (x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }
  while (stack.length) {
    i = stack.pop();
    x = i % w;
    y = (i / w) | 0;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }
  for (i = 0; i < n; i++) {
    if (mark[i] !== 1) continue;
    o = i * 4;
    px[o + 3] = 0;
  }
  try {
    ctx.putImageData(data, 0, 0);
  } catch (err) {
    image.__punched = image;
    return image;
  }
  image.__punched = canvas;
  return canvas;
}

function punched(image) {
  return punchDarkPlate(image);
}

function spriteForBuilding(kind) {
  if (kind === "apartment") return facadeApartment;
  if (kind === "storefront") return facadeStorefront;
  return ready(wartornRuinCut) ? wartornRuinCut : punched(wartornRuin);
}

function spriteForRubble(kind) {
  if (kind === "brick") return rubbleBrick;
  if (kind === "concrete") return rubbleConcrete;
  if (kind === "sandbags") return rubbleSandbags;
  if (kind === "scrap") return rubbleScrap;
  return ready(wartornRubbleCut) ? wartornRubbleCut : punched(wartornRubblePile);
}

function spriteForWreck(kind) {
  if (kind === "pickup") return wreckPickup;
  if (kind === "armored") return wreckArmored;
  return wreckSedan;
}

function stamp(ctx, image, x, y, dw, dh, alpha) {
  if (!ready(image) && !(image && image.width)) return false;
  var drawable =
    (image.complete && image.naturalWidth > 0) ||
    (image.width > 0 && image.height > 0);
  if (!drawable || dw < 8 || dh < 8) return false;
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, x - dw / 2, y - dh, dw, dh);
  ctx.restore();
  return true;
}

function fallbackRuin(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#3a3834";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.35, y);
  ctx.lineTo(x + w * 0.4, y - 6);
  ctx.lineTo(x + w * 0.28, y - h);
  ctx.lineTo(x - w * 0.22, y - h * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2a2723";
  ctx.fillRect(x - w * 0.18, y - h * 0.7, w * 0.1, h * 0.16);
  ctx.fillRect(x + w * 0.02, y - h * 0.55, w * 0.08, h * 0.14);
  ctx.restore();
}

function fallbackRubble(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = "#5a554c";
  ctx.beginPath();
  ctx.moveTo(x - 28 * s, y);
  ctx.lineTo(x + 30 * s, y + 4);
  ctx.lineTo(x + 12 * s, y - 16 * s);
  ctx.lineTo(x - 8 * s, y - 12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7a6a4a";
  ctx.fillRect(x - 10 * s, y - 8 * s, 14 * s, 7 * s);
  ctx.restore();
}

function clipSidewalk(ctx, iso, world, side) {
  if (!world || !iso) return false;
  var minX = world.minX == null ? -2300 : world.minX,
    maxX = world.maxX == null ? 2300 : world.maxX,
    minY = world.minY == null ? -6600 : world.minY,
    maxY = world.maxY == null ? 1900 : world.maxY;
  var pts =
    side < 0
      ? [
          [minX, minY],
          [-ROAD, minY],
          [-ROAD, maxY],
          [minX, maxY],
        ]
      : [
          [ROAD, minY],
          [maxX, minY],
          [maxX, maxY],
          [ROAD, maxY],
        ];
  ctx.beginPath();
  var q = iso(pts[0][0], pts[0][1]);
  ctx.moveTo(q[0], q[1]);
  for (var i = 1; i < pts.length; i++) {
    q = iso(pts[i][0], pts[i][1]);
    ctx.lineTo(q[0], q[1]);
  }
  ctx.closePath();
  ctx.clip();
  return true;
}

function drawStreetScenes(ctx, iso, world) {
  var sides, s, pattern, origin;
  if (!ready(wartornStreet) || !world || !iso) return;
  sides = [-1, 1];
  for (s = 0; s < sides.length; s++) {
    ctx.save();
    if (!clipSidewalk(ctx, iso, world, sides[s])) {
      ctx.restore();
      continue;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 0.34;
    pattern = ctx.createPattern && ctx.createPattern(wartornStreet, "repeat");
    origin = iso(sides[s] < 0 ? -1400 : 1400, 0);
    if (pattern) {
      ctx.translate(origin[0] % 160, origin[1] % 90);
      ctx.fillStyle = pattern;
      ctx.fillRect(-4000, -4000, 8000, 8000);
    }
    ctx.restore();
  }
}

export function preloadWartornAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.2, "LOADING WARTORN CITY");
  return Promise.all([
    loadImage(wartornSkyline),
    loadImage(wartornStreet),
    loadImage(wartornRuin),
    loadImage(wartornRubblePile),
    loadImage(wartornRuinCut),
    loadImage(wartornRubbleCut),
    loadImage(facadeApartment),
    loadImage(facadeStorefront),
    loadImage(rubbleBrick),
    loadImage(rubbleConcrete),
    loadImage(rubbleSandbags),
    loadImage(rubbleScrap),
    loadImage(wreckSedan),
    loadImage(wreckPickup),
    loadImage(wreckArmored),
    loadImage(skylineSmoke),
  ]).then(function (images) {
    if (
      images.some(function (img) {
        return !img;
      })
    )
      throw new Error("Wartorn city plates are not ready");
    OPAQUE_PLATES.forEach(punchDarkPlate);
    onProgress(1, "WARTORN CITY READY");
    return images;
  });
}

export function createWartornDressing() {
  return {
    buildings: SIDE_DRESSING.map(function (item) {
      return Object.assign({}, item);
    }),
    rubble: RUBBLE.map(function (item) {
      return Object.assign({}, item);
    }),
    wrecks: WRECKS.map(function (item) {
      return Object.assign({}, item);
    }),
    streetScenes: STREET_SCENES.map(function (item) {
      return Object.assign({}, item);
    }),
    smoke: SMOKE.map(function (item) {
      return Object.assign({}, item);
    }),
    road: ROAD,
  };
}

export function drawWartornAtmosphere(ctx, W, H) {
  var sky =
    ctx.createLinearGradient && ctx.createLinearGradient(0, 0, 0, H * 0.42);
  if (sky && sky.addColorStop) {
    sky.addColorStop(0, "#2b2a28");
    sky.addColorStop(0.55, "#3f403c");
    sky.addColorStop(1, "#4b514c");
    ctx.fillStyle = sky;
  } else ctx.fillStyle = "#3f403c";
  ctx.fillRect(0, 0, W, H);
  if (ready(wartornSkyline)) {
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(wartornSkyline, -W * 0.06, -H * 0.02, W * 1.12, H * 0.44);
    ctx.restore();
  }
  if (ready(skylineSmoke)) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(skylineSmoke, -W * 0.04, H * 0.02, W * 1.08, H * 0.22);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#1a1612";
  ctx.fillRect(0, 0, W, H * 0.22);
  ctx.restore();
}

export function drawWartornDressing(ctx, iso, world, W, H, onScreen) {
  var i, item, q, img, dw, dh;
  drawStreetScenes(ctx, iso, world);
  for (i = 0; i < SIDE_DRESSING.length; i++) {
    item = SIDE_DRESSING[i];
    if (onScreen && !onScreen(item.x, item.y, 420)) continue;
    q = iso(item.x, item.y);
    img = spriteForBuilding(item.kind);
    dw = item.kind === "ruin" ? 268 * item.s : 210 * item.s;
    dh = item.kind === "ruin" ? 214 * item.s : 176 * item.s;
    if (!stamp(ctx, img, q[0], q[1] + 8, dw, dh, 0.96))
      fallbackRuin(ctx, q[0], q[1], dw, dh);
  }
  for (i = 0; i < WRECKS.length; i++) {
    item = WRECKS[i];
    if (onScreen && !onScreen(item.x, item.y, 220)) continue;
    q = iso(item.x, item.y);
    img = spriteForWreck(item.kind);
    dw = 128 * item.s * 1.7;
    dh = 96 * item.s * 1.7;
    stamp(ctx, img, q[0], q[1] + 4, dw, dh, 0.94);
  }
  for (i = 0; i < RUBBLE.length; i++) {
    item = RUBBLE[i];
    if (onScreen && !onScreen(item.x, item.y, 180)) continue;
    q = iso(item.x, item.y);
    img = spriteForRubble(item.kind);
    dw = (item.kind === "pile" ? 168 : 118) * item.s * 1.8;
    dh = (item.kind === "pile" ? 96 : 86) * item.s * 1.8;
    if (!stamp(ctx, img, q[0], q[1] + 4, dw, dh, 0.94))
      fallbackRubble(ctx, q[0], q[1], item.s * 2.4);
  }
  for (i = 0; i < SMOKE.length; i++) {
    item = SMOKE[i];
    if (onScreen && !onScreen(item.x, item.y, 360)) continue;
    q = iso(item.x, item.y);
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#2a2622";
    ctx.beginPath();
    ctx.ellipse(q[0], q[1] - 78 * item.s, 16 * item.s, 52 * item.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.ellipse(
      q[0] + 10 * item.s,
      q[1] - 120 * item.s,
      22 * item.s,
      36 * item.s,
      0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }
}

export function playableStreetHalfWidth() {
  return ROAD;
}
