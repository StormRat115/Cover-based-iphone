import { loadImage } from "./assets.js?v=20260906-106";

function plate(file) {
  var image = new Image();
  image.src = "./assets/generated/world/" + file + "?v=20260906-88";
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
export const lampPostIntact = plate("lamp-post-intact.webp");
export const lampPostBent = plate("lamp-post-bent.webp");
export const lampPostFallen = plate("lamp-post-fallen.webp");
export const sidewalkCurbEdge = plate("sidewalk-curb-edge.webp");
export const sidewalkHydrant = plate("sidewalk-hydrant-manhole.webp");
export const sidewalkShelter = plate("sidewalk-bus-shelter-wreck.webp");
export const sidewalkTrash = plate("sidewalk-trash-bin-tipped.webp");
export const sidewalkPlanter = plate("sidewalk-planter-dead.webp");

var ROAD = 980;
var WALK = 260;
var OPAQUE_PLATES = [wartornRuin, wartornRubblePile];

// Sidewalk grit anchors — off the playable asphalt, never tiled plates.
var STREET_SCENES = [
  { x: -1120, y: 720, s: 0.72 },
  { x: 1140, y: 680, s: 0.7 },
  { x: -1180, y: -280, s: 0.68 },
  { x: 1160, y: -320, s: 0.66 },
  { x: -1100, y: -1480, s: 0.7 },
  { x: 1180, y: -1420, s: 0.68 },
  { x: -1160, y: -2680, s: 0.64 },
  { x: 1120, y: -2620, s: 0.66 },
  { x: -1140, y: -3880, s: 0.7 },
  { x: 1160, y: -3820, s: 0.68 },
  { x: -1180, y: -5080, s: 0.66 },
  { x: 1100, y: -5020, s: 0.7 },
  { x: -1120, y: -6180, s: 0.64 },
  { x: 1140, y: -6120, s: 0.66 },
];

// Distant canyon walls: further out than the sidewalk, modest scale so
// sprites cannot become huge midfield facades over the road.
var SIDE_DRESSING = [
  { x: -1680, y: 820, kind: "ruin", s: 0.46 },
  { x: 1720, y: 780, kind: "apartment", s: 0.42 },
  { x: -1760, y: 220, kind: "storefront", s: 0.4 },
  { x: 1800, y: 180, kind: "ruin", s: 0.44 },
  { x: -1700, y: -280, kind: "apartment", s: 0.4 },
  { x: 1740, y: -320, kind: "storefront", s: 0.38 },
  { x: -1820, y: -860, kind: "ruin", s: 0.46 },
  { x: 1780, y: -820, kind: "apartment", s: 0.42 },
  { x: -1660, y: -1480, kind: "storefront", s: 0.38 },
  { x: 1760, y: -1520, kind: "ruin", s: 0.42 },
  { x: -1780, y: -2140, kind: "apartment", s: 0.4 },
  { x: 1820, y: -2080, kind: "storefront", s: 0.4 },
  { x: -1720, y: -2780, kind: "ruin", s: 0.44 },
  { x: 1700, y: -2720, kind: "apartment", s: 0.4 },
  { x: -1840, y: -3440, kind: "storefront", s: 0.38 },
  { x: 1760, y: -3380, kind: "ruin", s: 0.42 },
  { x: -1680, y: -4100, kind: "apartment", s: 0.42 },
  { x: 1740, y: -4040, kind: "storefront", s: 0.4 },
  { x: -1800, y: -4780, kind: "ruin", s: 0.44 },
  { x: 1820, y: -4720, kind: "apartment", s: 0.42 },
  { x: -1740, y: -5420, kind: "storefront", s: 0.4 },
  { x: 1780, y: -5360, kind: "ruin", s: 0.44 },
  { x: -1660, y: -6080, kind: "apartment", s: 0.4 },
  { x: 1700, y: -6000, kind: "storefront", s: 0.38 },
];

var RUBBLE = [
  { x: -1040, y: 640, kind: "pile", s: 0.52 },
  { x: 1060, y: 600, kind: "brick", s: 0.46 },
  { x: -620, y: 80, kind: "concrete", s: 0.44 },
  { x: 540, y: -40, kind: "sandbags", s: 0.48 },
  { x: -380, y: -720, kind: "scrap", s: 0.46 },
  { x: 420, y: -980, kind: "pile", s: 0.5 },
  { x: -700, y: -1680, kind: "brick", s: 0.42 },
  { x: 640, y: -1920, kind: "concrete", s: 0.46 },
  { x: -460, y: -2460, kind: "sandbags", s: 0.48 },
  { x: 320, y: -2880, kind: "scrap", s: 0.44 },
  { x: -1140, y: -2540, kind: "pile", s: 0.5 },
  { x: 1160, y: -2580, kind: "brick", s: 0.42 },
  { x: -580, y: -3420, kind: "concrete", s: 0.48 },
  { x: 480, y: -3760, kind: "sandbags", s: 0.44 },
  { x: -240, y: -4280, kind: "scrap", s: 0.46 },
  { x: 1140, y: -3940, kind: "pile", s: 0.5 },
  { x: -680, y: -4880, kind: "brick", s: 0.44 },
  { x: 560, y: -5220, kind: "concrete", s: 0.46 },
  { x: -360, y: -5680, kind: "sandbags", s: 0.42 },
  { x: 1160, y: -5300, kind: "scrap", s: 0.48 },
  { x: -1060, y: -5900, kind: "pile", s: 0.46 },
  { x: 280, y: -6180, kind: "brick", s: 0.44 },
];

var WRECKS = [
  { x: -520, y: 420, kind: "sedan", s: 0.58 },
  { x: 460, y: 280, kind: "pickup", s: 0.56 },
  { x: -340, y: -860, kind: "armored", s: 0.54 },
  { x: 580, y: -1240, kind: "sedan", s: 0.56 },
  { x: -620, y: -2180, kind: "pickup", s: 0.52 },
  { x: 300, y: -2640, kind: "armored", s: 0.54 },
  { x: -180, y: -3480, kind: "sedan", s: 0.56 },
  { x: 640, y: -4020, kind: "pickup", s: 0.52 },
  { x: -480, y: -4680, kind: "armored", s: 0.54 },
  { x: 220, y: -5340, kind: "sedan", s: 0.56 },
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

// Phone Art lamps and sidewalk props — sidewalk band only (|x| > ROAD).
var EDGE_LAMPS = [
  { x: -1090, y: 640, kind: "intact", s: 0.92 },
  { x: 1110, y: 280, kind: "bent", s: 0.88 },
  { x: -1140, y: -180, kind: "fallen", s: 0.86 },
  { x: 1080, y: -620, kind: "intact", s: 0.9 },
  { x: -1070, y: -1280, kind: "bent", s: 0.86 },
  { x: 1160, y: -1860, kind: "intact", s: 0.88 },
  { x: -1120, y: -2480, kind: "fallen", s: 0.84 },
  { x: 1090, y: -3120, kind: "bent", s: 0.86 },
  { x: -1150, y: -3780, kind: "intact", s: 0.9 },
  { x: 1130, y: -4420, kind: "fallen", s: 0.84 },
  { x: -1080, y: -5080, kind: "bent", s: 0.86 },
  { x: 1140, y: -5720, kind: "intact", s: 0.88 },
];

var SIDEWALK_PROPS = [
  { x: -1040, y: 820, kind: "curb", s: 0.7 },
  { x: 1060, y: 520, kind: "hydrant", s: 0.62 },
  { x: -1180, y: 80, kind: "shelter", s: 0.64 },
  { x: 1120, y: -220, kind: "trash", s: 0.6 },
  { x: -1080, y: -720, kind: "planter", s: 0.62 },
  { x: 1040, y: -980, kind: "curb", s: 0.68 },
  { x: -1160, y: -1580, kind: "hydrant", s: 0.6 },
  { x: 1180, y: -2180, kind: "shelter", s: 0.62 },
  { x: -1050, y: -2680, kind: "trash", s: 0.6 },
  { x: 1100, y: -3280, kind: "planter", s: 0.62 },
  { x: -1140, y: -3880, kind: "curb", s: 0.68 },
  { x: 1070, y: -4480, kind: "hydrant", s: 0.6 },
  { x: -1170, y: -5080, kind: "trash", s: 0.6 },
  { x: 1150, y: -5480, kind: "planter", s: 0.62 },
  { x: -1060, y: -5980, kind: "shelter", s: 0.62 },
  { x: 1090, y: -6280, kind: "curb", s: 0.68 },
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

function spriteForLamp(kind) {
  if (kind === "bent") return lampPostBent;
  if (kind === "fallen") return lampPostFallen;
  return lampPostIntact;
}

function sizeForLamp(kind, s) {
  if (kind === "fallen") return { dw: 70 * s, dh: 52 * s };
  if (kind === "bent") return { dw: 46 * s, dh: 74 * s };
  return { dw: 34 * s, dh: 76 * s };
}

function spriteForSidewalk(kind) {
  if (kind === "hydrant") return sidewalkHydrant;
  if (kind === "shelter") return sidewalkShelter;
  if (kind === "trash") return sidewalkTrash;
  if (kind === "planter") return sidewalkPlanter;
  return sidewalkCurbEdge;
}

function sizeForSidewalk(kind, s) {
  if (kind === "shelter") return { dw: 78 * s, dh: 86 * s };
  if (kind === "hydrant") return { dw: 50 * s, dh: 42 * s };
  if (kind === "trash") return { dw: 44 * s, dh: 48 * s };
  if (kind === "planter") return { dw: 48 * s, dh: 50 * s };
  return { dw: 58 * s, dh: 36 * s };
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

function hash01(i) {
  var n = (i * 374761393 + 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function worldBounds(world) {
  return {
    minX: world && world.minX != null ? world.minX : -2300,
    maxX: world && world.maxX != null ? world.maxX : 2300,
    minY: world && world.minY != null ? world.minY : -6600,
    maxY: world && world.maxY != null ? world.maxY : 1900,
  };
}

function clipWorldPoly(ctx, iso, pts) {
  if (!iso || !pts || !pts.length) return false;
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

function clipOffStreet(ctx, iso, world, side) {
  if (!world || !iso) return false;
  var b = worldBounds(world);
  var edge = side < 0 ? -ROAD : ROAD;
  var pts =
    side < 0
      ? [
          [b.minX, b.minY],
          [edge, b.minY],
          [edge, b.maxY],
          [b.minX, b.maxY],
        ]
      : [
          [edge, b.minY],
          [b.maxX, b.minY],
          [b.maxX, b.maxY],
          [edge, b.maxY],
        ];
  return clipWorldPoly(ctx, iso, pts);
}

function fillIsoPoly(ctx, iso, pts, fill) {
  if (!iso || !pts || !pts.length) return;
  ctx.beginPath();
  var q = iso(pts[0][0], pts[0][1]);
  ctx.moveTo(q[0], q[1]);
  for (var i = 1; i < pts.length; i++) {
    q = iso(pts[i][0], pts[i][1]);
    ctx.lineTo(q[0], q[1]);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawStreetScenes(ctx, iso, world, onScreen) {
  var i, item, q, w, h;
  if (!world || !iso) return;
  for (i = 0; i < STREET_SCENES.length; i++) {
    item = STREET_SCENES[i];
    if (onScreen && !onScreen(item.x, item.y, 200)) continue;
    q = iso(item.x, item.y);
    w = 54 * item.s;
    h = 18 * item.s;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = i % 2 ? "#4a4034" : "#3a342c";
    ctx.beginPath();
    ctx.ellipse(q[0], q[1], w, h, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (i % 3 === 0) {
      fillIsoPoly(
        ctx,
        iso,
        [
          [item.x - 18, item.y - 8],
          [item.x + 22, item.y - 4],
          [item.x + 10, item.y + 10],
          [item.x - 14, item.y + 6],
        ],
        "#5a504455",
      );
    }
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
    loadImage(lampPostIntact),
    loadImage(lampPostBent),
    loadImage(lampPostFallen),
    loadImage(sidewalkCurbEdge),
    loadImage(sidewalkHydrant),
    loadImage(sidewalkShelter),
    loadImage(sidewalkTrash),
    loadImage(sidewalkPlanter),
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
    lamps: EDGE_LAMPS.map(function (item) {
      return Object.assign({}, item);
    }),
    sidewalkProps: SIDEWALK_PROPS.map(function (item) {
      return Object.assign({}, item);
    }),
    road: ROAD,
    sidewalk: WALK,
  };
}

function drawOrganicPatches(ctx, iso, world, onScreen) {
  var b = worldBounds(world),
    i,
    r1,
    r2,
    r3,
    x,
    y,
    w,
    h,
    colors = [
      "#2a241c88",
      "#1c181490",
      "#4a3a2c70",
      "#5c463870",
      "#241e1888",
      "#6a534070",
      "#16121099",
      "#3c2e2478",
      "#4a302478",
      "#2e282070",
    ];
  for (i = 0; i < 150; i++) {
    r1 = hash01(i * 17 + 3);
    r2 = hash01(i * 19 + 11);
    r3 = hash01(i * 23 + 7);
    x = (r1 - 0.5) * (ROAD * 1.85);
    y = b.minY + 80 + r2 * (b.maxY - b.minY - 160);
    if (onScreen && !onScreen(x, y, 180)) continue;
    w = 48 + r3 * 140;
    h = 18 + r1 * 46;
    fillIsoPoly(
      ctx,
      iso,
      [
        [x - w * 0.55, y - h * 0.3],
        [x + w * 0.5, y - h * 0.45],
        [x + w * 0.4, y + h * 0.55],
        [x - w * 0.35, y + h * 0.4],
      ],
      colors[i % colors.length],
    );
  }
  for (i = 0; i < 22; i++) {
    r1 = hash01(i * 53 + 91);
    r2 = hash01(i * 59 + 17);
    r3 = hash01(i * 61 + 3);
    x = (r1 - 0.5) * (ROAD * 1.6);
    y = b.minY + 160 + r2 * (b.maxY - b.minY - 320);
    if (onScreen && !onScreen(x, y, 140)) continue;
    fillIsoPoly(
      ctx,
      iso,
      [
        [x - 10 - r3 * 16, y - 4],
        [x + 14 + r1 * 12, y - 2],
        [x + 8, y + 6 + r2 * 8],
        [x - 8, y + 5],
      ],
      i % 2 ? "#4a2c2288" : "#1a1816aa",
    );
  }
  for (i = 0; i < 36; i++) {
    r1 = hash01(i * 31 + 41);
    r2 = hash01(i * 37 + 13);
    r3 = hash01(i * 43 + 5);
    x = (r1 - 0.5) * (ROAD * 1.7);
    y = b.minY + 200 + r2 * (b.maxY - b.minY - 400);
    if (onScreen && !onScreen(x, y, 160)) continue;
    fillIsoPoly(
      ctx,
      iso,
      [
        [x, y],
        [x + 4 + r3 * 7, y + 8],
        [x + 1 + r1 * 4, y + 54 + r3 * 50],
        [x - 3, y + 48 + r2 * 30],
      ],
      "#1a1612b0",
    );
  }
}

export function drawWartornStreetSurface(ctx, iso, world, onScreen) {
  var b, walkL, walkR;
  if (!world || !iso) return;
  b = worldBounds(world);
  walkL = -ROAD - WALK;
  walkR = ROAD + WALK;
  ctx.save();
  if (
    !clipWorldPoly(ctx, iso, [
      [walkL, b.minY],
      [walkR, b.minY],
      [walkR, b.maxY],
      [walkL, b.maxY],
    ])
  ) {
    ctx.restore();
    return;
  }
  drawOrganicPatches(ctx, iso, world, onScreen);
  ctx.restore();
}

function drawFarBackdrop(ctx, iso, world, W, H) {
  var origin,
    scroll,
    i,
    x,
    facades,
    fade,
    count;
  facades = [
    facadeApartment,
    facadeStorefront,
    ready(wartornRuinCut) ? wartornRuinCut : punched(wartornRuin),
    facadeApartment,
  ];
  origin = iso(world && world.cameraX != null ? world.cameraX : 0, 0);
  scroll = ((origin[0] % 168) + 168) % 168;
  count = Math.ceil((W || 390) / 168) + 3;
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (i = -1; i < count; i++) {
    x = i * 168 - scroll + 28;
    stamp(ctx, facades[(i + 8) % facades.length], x + 62, H * 0.2, 132, 92, 0.82);
  }
  ctx.restore();
  if (ctx.createLinearGradient) {
    fade = ctx.createLinearGradient(0, H * 0.06, 0, H * 0.34);
    if (fade && fade.addColorStop) {
      fade.addColorStop(0, "rgba(44,40,36,0)");
      fade.addColorStop(0.62, "rgba(52,48,42,0.08)");
      fade.addColorStop(1, "rgba(58,54,48,0.72)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, H * 0.06, W, H * 0.3);
    }
  }
}

export function drawWartornAtmosphere(ctx, W, H, iso, world) {
  var sky, fade;
  sky = ctx.createLinearGradient && ctx.createLinearGradient(0, 0, 0, H * 0.42);
  if (sky && sky.addColorStop) {
    sky.addColorStop(0, "#2a2724");
    sky.addColorStop(0.5, "#3a3630");
    sky.addColorStop(1, "#3d3933");
    ctx.fillStyle = sky;
  } else ctx.fillStyle = "#3a3630";
  ctx.fillRect(0, 0, W, H);
  if (ready(wartornSkyline)) {
    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(wartornSkyline, -W * 0.02, -H * 0.04, W * 1.04, H * 0.32);
    ctx.restore();
  }
  if (iso && world) drawFarBackdrop(ctx, iso, world, W, H);
  if (ready(skylineSmoke)) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(skylineSmoke, -W * 0.02, H * 0.02, W * 1.04, H * 0.18);
    ctx.restore();
  }
  if (ctx.createLinearGradient) {
    fade = ctx.createLinearGradient(0, 0, 0, H * 0.36);
    if (fade && fade.addColorStop) {
      fade.addColorStop(0, "rgba(26,22,18,0.28)");
      fade.addColorStop(0.55, "rgba(42,38,34,0.08)");
      fade.addColorStop(1, "rgba(58,54,48,0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H * 0.36);
    }
  }
}

function drawEdgeAccents(ctx, iso, world, onScreen) {
  var i, item, q, img, size, outward;
  for (i = 0; i < SIDEWALK_PROPS.length; i++) {
    item = SIDEWALK_PROPS[i];
    if (onScreen && !onScreen(item.x, item.y, 220)) continue;
    ctx.save();
    clipOffStreet(ctx, iso, world, item.x < 0 ? -1 : 1);
    q = iso(item.x, item.y);
    img = spriteForSidewalk(item.kind);
    size = sizeForSidewalk(item.kind, item.s);
    outward = item.x < 0 ? -size.dw * 0.18 : size.dw * 0.18;
    stamp(ctx, img, q[0] + outward, q[1] + 4, size.dw, size.dh, 0.92);
    ctx.restore();
  }
  for (i = 0; i < EDGE_LAMPS.length; i++) {
    item = EDGE_LAMPS[i];
    if (onScreen && !onScreen(item.x, item.y, 200)) continue;
    ctx.save();
    clipOffStreet(ctx, iso, world, item.x < 0 ? -1 : 1);
    q = iso(item.x, item.y);
    img = spriteForLamp(item.kind);
    size = sizeForLamp(item.kind, item.s);
    outward = item.x < 0 ? -8 : 8;
    stamp(ctx, img, q[0] + outward, q[1] + 2, size.dw, size.dh, 0.94);
    ctx.restore();
  }
}

function drawSideBuildings(ctx, iso, world, onScreen) {
  var i, item, q, img, dw, dh, outward;
  for (i = 0; i < SIDE_DRESSING.length; i++) {
    item = SIDE_DRESSING[i];
    if (onScreen && !onScreen(item.x, item.y, 280)) continue;
    ctx.save();
    clipOffStreet(ctx, iso, world, item.x < 0 ? -1 : 1);
    q = iso(item.x, item.y);
    img = spriteForBuilding(item.kind);
    dw = item.kind === "ruin" ? 132 * item.s : 108 * item.s;
    dh = item.kind === "ruin" ? 108 * item.s : 90 * item.s;
    outward = item.x < 0 ? -dw * 0.28 : dw * 0.28;
    if (!stamp(ctx, img, q[0] + outward, q[1] + 6, dw, dh, 0.78))
      fallbackRuin(ctx, q[0] + outward, q[1], dw, dh);
    ctx.restore();
  }
}

export function drawWartornDressing(ctx, iso, world, W, H, onScreen) {
  var i, item, q, img, dw, dh;
  drawStreetScenes(ctx, iso, world, onScreen);
  drawEdgeAccents(ctx, iso, world, onScreen);
  drawSideBuildings(ctx, iso, world, onScreen);
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
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = "#2a2622";
    ctx.beginPath();
    ctx.ellipse(q[0], q[1] - 78 * item.s, 16 * item.s, 52 * item.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.14;
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

export function sidewalkWidth() {
  return WALK;
}
