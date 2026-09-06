import { loadImage } from "./assets.js?v=20260906-82";

function plate(file) {
  var image = new Image();
  image.src = "./assets/generated/world/" + file + "?v=20260906-82";
  return image;
}

export const wartornSkyline = plate("wartorn-skyline.webp");
export const wartornTenement = plate("ruin-tenement.webp");
export const wartornWarehouse = plate("ruin-warehouse.webp");

var ROAD = 980;

var SIDE_DRESSING = [
  { x: -1280, y: 820, kind: "tenement", s: 0.92 },
  { x: 1320, y: 780, kind: "warehouse", s: 0.88 },
  { x: -1420, y: 220, kind: "facade", s: 0.86 },
  { x: 1460, y: 180, kind: "tenement", s: 0.9 },
  { x: -1360, y: -280, kind: "warehouse", s: 0.84 },
  { x: 1380, y: -320, kind: "facade", s: 0.82 },
  { x: -1480, y: -860, kind: "tenement", s: 0.94 },
  { x: 1500, y: -820, kind: "warehouse", s: 0.9 },
  { x: -1320, y: -1480, kind: "facade", s: 0.8 },
  { x: 1400, y: -1520, kind: "tenement", s: 0.86 },
  { x: -1440, y: -2140, kind: "warehouse", s: 0.88 },
  { x: 1460, y: -2080, kind: "facade", s: 0.84 },
  { x: -1380, y: -2780, kind: "tenement", s: 0.9 },
  { x: 1420, y: -2720, kind: "warehouse", s: 0.86 },
  { x: -1500, y: -3440, kind: "facade", s: 0.82 },
  { x: 1520, y: -3380, kind: "tenement", s: 0.88 },
  { x: -1340, y: -4100, kind: "warehouse", s: 0.9 },
  { x: 1360, y: -4040, kind: "facade", s: 0.84 },
  { x: -1460, y: -4780, kind: "tenement", s: 0.92 },
  { x: 1480, y: -4720, kind: "warehouse", s: 0.88 },
  { x: -1400, y: -5420, kind: "facade", s: 0.86 },
  { x: 1440, y: -5360, kind: "tenement", s: 0.9 },
  { x: -1280, y: -6080, kind: "warehouse", s: 0.84 },
  { x: 1300, y: -6000, kind: "facade", s: 0.82 },
];

var RUBBLE = [
  { x: -1020, y: 640, s: 0.42 },
  { x: 1040, y: 600, s: 0.4 },
  { x: -1080, y: 80, s: 0.36 },
  { x: 1100, y: 40, s: 0.38 },
  { x: -1040, y: -520, s: 0.4 },
  { x: 1060, y: -560, s: 0.36 },
  { x: -1100, y: -1180, s: 0.34 },
  { x: 1120, y: -1220, s: 0.38 },
  { x: -1060, y: -1860, s: 0.4 },
  { x: 1080, y: -1900, s: 0.36 },
  { x: -1120, y: -2540, s: 0.38 },
  { x: 1140, y: -2580, s: 0.34 },
  { x: -1040, y: -3220, s: 0.4 },
  { x: 1060, y: -3260, s: 0.36 },
  { x: -1100, y: -3900, s: 0.38 },
  { x: 1120, y: -3940, s: 0.4 },
  { x: -1060, y: -4580, s: 0.36 },
  { x: 1080, y: -4620, s: 0.38 },
  { x: -1120, y: -5260, s: 0.34 },
  { x: 1140, y: -5300, s: 0.4 },
  { x: -1040, y: -5900, s: 0.38 },
  { x: 1060, y: -5840, s: 0.36 },
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

function spriteFor(kind) {
  if (kind === "warehouse" || kind === "facade") return wartornWarehouse;
  return wartornTenement;
}

function stamp(ctx, image, x, y, dw, dh, alpha) {
  if (!ready(image) || dw < 8 || dh < 8) return false;
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

export function preloadWartornAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.2, "LOADING WARTORN CITY");
  return Promise.all([
    loadImage(wartornSkyline),
    loadImage(wartornTenement),
    loadImage(wartornWarehouse),
  ]).then(function (images) {
    if (
      images.some(function (img) {
        return !img;
      })
    )
      throw new Error("Wartorn city plates are not ready");
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
    ctx.globalAlpha = 0.42;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(wartornSkyline, -W * 0.08, -H * 0.04, W * 1.16, H * 0.38);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#1a1612";
  ctx.fillRect(0, 0, W, H * 0.22);
  ctx.restore();
}

export function drawWartornDressing(ctx, iso, world, W, H, onScreen) {
  var i, item, q, img, dw, dh;
  for (i = 0; i < SIDE_DRESSING.length; i++) {
    item = SIDE_DRESSING[i];
    if (onScreen && !onScreen(item.x, item.y, 420)) continue;
    q = iso(item.x, item.y);
    img = spriteFor(item.kind);
    dw = 210 * item.s;
    dh = 168 * item.s;
    if (!stamp(ctx, img, q[0], q[1] + 8, dw, dh, 0.96))
      fallbackRuin(ctx, q[0], q[1], dw, dh);
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
    ctx.ellipse(q[0] + 10 * item.s, q[1] - 120 * item.s, 22 * item.s, 36 * item.s, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (i = 0; i < RUBBLE.length; i++) {
    item = RUBBLE[i];
    if (onScreen && !onScreen(item.x, item.y, 180)) continue;
    q = iso(item.x, item.y);
    fallbackRubble(ctx, q[0], q[1], item.s * 2.4);
  }
}

export function playableStreetHalfWidth() {
  return ROAD;
}
