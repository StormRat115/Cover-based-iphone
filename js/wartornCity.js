import { loadImage } from "./assets.js?v=20260907-117";

var ROAD = 980;
var WALK = 260;
var TOP_EDGE = -ROAD - WALK;

function surface(file) {
  var image = new Image();
  image.decoding = "async";
  image.src = "./assets/generated/environment/" + file + "?v=20260907-117";
  return image;
}

function plate(file) {
  var image = new Image();
  image.decoding = "async";
  image.src = "./assets/generated/world/" + file + "?v=20260907-117";
  return image;
}

export const asphaltSurface = surface("asphalt-tile.webp");
export const concreteSidewalkSurface = surface("concrete-sidewalk-tile.webp");
export const wartornSkyline = plate("wartorn-skyline-backdrop.png");
export const wartornStreet = plate("wartorn-street-plate.png");
export const wartornRuin = plate("wartorn-ruin-building-a.png");
export const wartornRubblePile = plate("wartorn-rubble-pile.png");
export const wartornRuinCut = plate("wartorn-ruin-building-a-cut.webp");
export const wartornRubbleCut = plate("wartorn-rubble-pile-cut.webp");
export const facadeApartment = plate("facade-ruin-apartment.webp");
export const facadeStorefront = plate("facade-ruin-storefront.webp");
export const facadeOffice = plate("facade-office.webp");
export const facadeGraffiti = plate("facade-graffiti-brick.webp");
export const facadeAlley = plate("facade-alley.webp");
export const doorExplodeSheet = plate("door-explode-sheet.webp");
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

var OPAQUE_PLATES = [
  wartornRuin,
  wartornRubblePile,
  facadeOffice,
  facadeGraffiti,
  facadeAlley,
  doorExplodeSheet,
];

function hash01(i) {
  var n = (i * 374761393 + 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function buildTopFacades() {
  var kinds = [
    "apartment",
    "office",
    "storefront",
    "graffiti",
    "ruin",
    "alley",
    "apartment",
    "office",
  ];
  var items = [];
  var i = 0;
  var y = 1680;
  while (y > -6480) {
    var kind = kinds[(i * 3 + ((hash01(i * 9 + 2) * kinds.length) | 0)) % kinds.length];
    items.push({
      id: "top-" + i,
      x: TOP_EDGE - 36 - hash01(i * 19 + 4) * 70,
      y: y,
      kind: kind,
      s: 1.05 + hash01(i * 17 + 1) * 0.28,
      flip: hash01(i * 11 + 8) > 0.52,
      door: i % 3 === 0,
      side: "top",
    });
    y -= 118 + hash01(i * 23 + 6) * 42;
    i++;
  }
  return items;
}

function buildSideFacades() {
  var kinds = ["storefront", "ruin", "apartment", "office"];
  var items = [];
  for (var i = 0; i < 14; i++) {
    items.push({
      id: "side-" + i,
      x: ROAD + WALK + 80 + hash01(i * 7) * 90,
      y: 820 - i * 560,
      kind: kinds[i % kinds.length],
      s: 0.42 + hash01(i * 5) * 0.1,
      flip: i % 2 === 0,
      door: false,
      side: "right",
    });
  }
  return items;
}

var SIDE_DRESSING = buildTopFacades().concat(buildSideFacades());

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

// Wrecks and rubble stay on sidewalks / far edges — never mid-road.
var RUBBLE = [
  { x: -1080, y: 640, kind: "pile", s: 0.42 },
  { x: 1100, y: 600, kind: "brick", s: 0.38 },
  { x: -1160, y: -180, kind: "concrete", s: 0.36 },
  { x: 1140, y: -520, kind: "sandbags", s: 0.4 },
  { x: -1100, y: -1180, kind: "scrap", s: 0.38 },
  { x: 1120, y: -1860, kind: "pile", s: 0.4 },
  { x: -1180, y: -2540, kind: "brick", s: 0.36 },
  { x: 1080, y: -3220, kind: "concrete", s: 0.38 },
  { x: -1120, y: -3940, kind: "sandbags", s: 0.4 },
  { x: 1160, y: -4580, kind: "scrap", s: 0.36 },
  { x: -1060, y: -5260, kind: "pile", s: 0.38 },
  { x: 1100, y: -5900, kind: "brick", s: 0.36 },
];

var WRECKS = [
  { x: -1140, y: 420, kind: "sedan", s: 0.42 },
  { x: 1160, y: 180, kind: "pickup", s: 0.4 },
  { x: -1180, y: -860, kind: "armored", s: 0.4 },
  { x: 1120, y: -1640, kind: "sedan", s: 0.4 },
  { x: -1100, y: -2480, kind: "pickup", s: 0.38 },
  { x: 1180, y: -3320, kind: "armored", s: 0.4 },
  { x: -1160, y: -4180, kind: "sedan", s: 0.4 },
  { x: 1100, y: -5020, kind: "pickup", s: 0.38 },
  { x: -1120, y: -5720, kind: "armored", s: 0.4 },
];

var SMOKE = [
  { x: -1320, y: 400, s: 0.55 },
  { x: 1380, y: -200, s: 0.5 },
  { x: -1380, y: -1600, s: 0.62 },
  { x: 1420, y: -2800, s: 0.48 },
  { x: -1340, y: -4000, s: 0.58 },
  { x: 1360, y: -5200, s: 0.52 },
];

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
  return !!(image && image.complete && image.naturalWidth);
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
  } catch (_err) {
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
  } catch (_err) {
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
  if (kind === "apartment") return punched(facadeApartment);
  if (kind === "storefront") return punched(facadeStorefront);
  if (kind === "office") return punched(facadeOffice);
  if (kind === "graffiti") return punched(facadeGraffiti);
  if (kind === "alley") return punched(facadeAlley);
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

function buildingSize(kind, s) {
  if (kind === "ruin") return { dw: 176 * s, dh: 168 * s };
  if (kind === "alley") return { dw: 132 * s, dh: 150 * s };
  if (kind === "office") return { dw: 158 * s, dh: 188 * s };
  return { dw: 148 * s, dh: 172 * s };
}

function stamp(ctx, image, x, y, dw, dh, alpha, flip) {
  var drawable =
    ready(image) ||
    (image && image.width > 0 && image.height > 0);
  if (!drawable || dw < 8 || dh < 8) return false;
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (flip) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(image, -dw / 2, -dh, dw, dh);
  } else ctx.drawImage(image, x - dw / 2, y - dh, dw, dh);
  ctx.restore();
  return true;
}

function fallbackRuin(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#4a3a32";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.38, y);
  ctx.lineTo(x + w * 0.42, y - 4);
  ctx.lineTo(x + w * 0.3, y - h);
  ctx.lineTo(x - w * 0.2, y - h * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6a3a2c";
  ctx.fillRect(x - w * 0.22, y - h * 0.72, w * 0.1, h * 0.14);
  ctx.fillRect(x + w * 0.02, y - h * 0.58, w * 0.09, h * 0.12);
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(x - w * 0.06, y - h * 0.28, w * 0.12, h * 0.22);
  ctx.restore();
}

function worldBounds(world) {
  return {
    minX: world && world.minX != null ? world.minX : -2300,
    maxX: world && world.maxX != null ? world.maxX : 2300,
    minY: world && Number.isFinite(world.minY) ? world.minY : -6600,
    maxY: world && Number.isFinite(world.maxY) ? world.maxY : 1900,
  };
}

function clipWorldPoly(ctx, iso, points) {
  if (!ctx || !iso || !points || !points.length) return false;
  ctx.beginPath();
  points.forEach(function (point, index) {
    var q = iso(point[0], point[1]);
    if (index === 0) ctx.moveTo(q[0], q[1]);
    else ctx.lineTo(q[0], q[1]);
  });
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

function worldPattern(ctx, image, iso, world) {
  if (!ready(image) || !ctx.createPattern) return null;
  var pattern = ctx.createPattern(image, "repeat");
  if (
    pattern &&
    pattern.setTransform &&
    typeof DOMMatrix !== "undefined" &&
    world
  ) {
    var origin = iso(0, 0);
    try {
      pattern.setTransform(
        new DOMMatrix([
          world.scaleX,
          world.scaleY,
          -world.scaleX,
          world.scaleY,
          origin[0],
          origin[1],
        ]),
      );
    } catch (_error) {
      // Older WebViews still receive the texture with screen-space tiling.
    }
  }
  return pattern;
}

function fillSurface(ctx, iso, world, points, image, fallback) {
  ctx.save();
  if (!clipWorldPoly(ctx, iso, points)) {
    ctx.restore();
    return;
  }
  ctx.fillStyle = worldPattern(ctx, image, iso, world) || fallback;
  var width = ctx.canvas.clientWidth || ctx.canvas.width || 390;
  var height = ctx.canvas.clientHeight || ctx.canvas.height || 844;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
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

function drawOrganicPatches(ctx, iso, world, onScreen) {
  var b = worldBounds(world),
    i,
    r1,
    r2,
    r3,
    x,
    y,
    w,
    h;
  // Off-street grit only — never paint the asphalt corridor.
  for (i = 0; i < 36; i++) {
    r1 = hash01(i * 17 + 3);
    r2 = hash01(i * 19 + 11);
    r3 = hash01(i * 23 + 7);
    x = (r1 < 0.5 ? -1 : 1) * (ROAD + 40 + r3 * 180);
    y = b.minY + 80 + r2 * (b.maxY - b.minY - 160);
    if (onScreen && !onScreen(x, y, 180)) continue;
    w = 28 + r3 * 54;
    h = 10 + r1 * 18;
    fillIsoPoly(
      ctx,
      iso,
      [
        [x - w * 0.55, y - h * 0.3],
        [x + w * 0.5, y - h * 0.45],
        [x + w * 0.4, y + h * 0.55],
        [x - w * 0.35, y + h * 0.4],
      ],
      i % 2 ? "#2a221c66" : "#3a302866",
    );
  }
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
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = i % 2 ? "#4a4034" : "#3a342c";
    ctx.beginPath();
    ctx.ellipse(q[0], q[1], w, h, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function preloadWartornAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.2, "LOADING WARTORN CITY");
  return Promise.all([
    loadImage(asphaltSurface),
    loadImage(concreteSidewalkSurface),
    loadImage(wartornSkyline),
    loadImage(wartornStreet),
    loadImage(wartornRuin),
    loadImage(wartornRubblePile),
    loadImage(wartornRuinCut),
    loadImage(wartornRubbleCut),
    loadImage(facadeApartment),
    loadImage(facadeStorefront),
    loadImage(facadeOffice),
    loadImage(facadeGraffiti),
    loadImage(facadeAlley),
    loadImage(doorExplodeSheet),
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
    punchDarkPlate(facadeApartment);
    punchDarkPlate(facadeStorefront);
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
    doors: facadeDoorPoints(),
    road: ROAD,
    sidewalk: WALK,
  };
}

export function facadeDoorPoints() {
  return SIDE_DRESSING.filter(function (item) {
    return item.door && item.side === "top";
  }).map(function (item) {
    return {
      id: item.id,
      x: item.x,
      y: item.y,
      doorX: -ROAD - 36,
      doorY: item.y,
      approachX: -ROAD + 220,
      approachY: item.y + (hash01(item.y | 0) - 0.5) * 70,
      kind: item.kind,
    };
  });
}

function drawFarBackdrop(ctx, iso, world, W, H) {
  var origin,
    scroll,
    i,
    x,
    facades,
    fade,
    count,
    band,
    dw,
    dh,
    camY,
    sample,
    q,
    s;
  facades = [
    punched(facadeApartment),
    punched(facadeOffice),
    punched(facadeStorefront),
    punched(facadeGraffiti),
    ready(wartornRuinCut) ? wartornRuinCut : punched(wartornRuin),
    punched(facadeAlley),
  ];
  camY = world && world.cameraY != null ? world.cameraY : 0;
  band = 150;
  if (iso) {
    for (s = -900; s <= 900; s += 300) {
      q = iso(TOP_EDGE + 20, camY + s);
      if (q && q[1] > band) band = q[1];
    }
  }
  band = Math.max(170, Math.min((H || 844) * 0.52, band + 16));
  origin = iso
    ? iso(world && world.cameraX != null ? world.cameraX : 0, camY)
    : [0, 0];
  scroll = ((origin[0] % 88) + 88) % 88;
  count = Math.ceil((W || 390) / 72) + 6;
  if (ready(wartornSkyline)) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(wartornSkyline, -8, -10, (W || 390) + 16, band + 8);
    ctx.restore();
  }
  ctx.save();
  for (i = -3; i < count; i++) {
    x = i * 72 - scroll * 0.35 + 6;
    dw = 210 + ((i * 17) % 7) * 12;
    dh = band + 36 + ((i * 13) % 9) * 10;
    stamp(
      ctx,
      facades[(i + 18) % facades.length],
      x + dw * 0.36,
      band + 6,
      dw,
      dh,
      0.98,
      i % 3 === 0,
    );
  }
  ctx.restore();
  if (ctx.createLinearGradient) {
    fade = ctx.createLinearGradient(0, band - 24, 0, band + 20);
    if (fade && fade.addColorStop) {
      fade.addColorStop(0, "rgba(36,32,28,0)");
      fade.addColorStop(1, "rgba(36,32,28,0.22)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, band - 24, W, 44);
    }
  }
}

export function drawWartornStreetSurface(ctx, iso, world) {
  if (!ctx || !iso || !world) return;
  var bounds = worldBounds(world);
  fillSurface(
    ctx,
    iso,
    world,
    [
      [-ROAD - WALK, bounds.minY],
      [-ROAD, bounds.minY],
      [-ROAD, bounds.maxY],
      [-ROAD - WALK, bounds.maxY],
    ],
    concreteSidewalkSurface,
    "#8a8b89",
  );
  fillSurface(
    ctx,
    iso,
    world,
    [
      [ROAD, bounds.minY],
      [ROAD + WALK, bounds.minY],
      [ROAD + WALK, bounds.maxY],
      [ROAD, bounds.maxY],
    ],
    concreteSidewalkSurface,
    "#8a8b89",
  );
  fillSurface(
    ctx,
    iso,
    world,
    [
      [-ROAD, bounds.minY],
      [ROAD, bounds.minY],
      [ROAD, bounds.maxY],
      [-ROAD, bounds.maxY],
    ],
    asphaltSurface,
    "#343638",
  );
}

export function drawWartornAtmosphere(ctx, W, H, iso, world) {
  var sky, fade;
  sky = ctx.createLinearGradient && ctx.createLinearGradient(0, 0, 0, H * 0.42);
  if (sky && sky.addColorStop) {
    sky.addColorStop(0, "#2a2724");
    sky.addColorStop(0.5, "#35322c");
    sky.addColorStop(1, "#3a3630");
    ctx.fillStyle = sky;
  } else ctx.fillStyle = "#2e2b27";
  ctx.fillRect(0, 0, W, H);
  if (ready(wartornSkyline)) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(wartornSkyline, -W * 0.02, -H * 0.02, W * 1.04, H * 0.3);
    ctx.restore();
  }
  if (iso && world) drawFarBackdrop(ctx, iso, world, W, H);
  if (ready(skylineSmoke)) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(skylineSmoke, -W * 0.02, H * 0.02, W * 1.04, H * 0.16);
    ctx.restore();
  }
  if (ctx.createLinearGradient) {
    fade = ctx.createLinearGradient(0, 0, 0, H * 0.2);
    if (fade && fade.addColorStop) {
      fade.addColorStop(0, "rgba(22,18,16,0.16)");
      fade.addColorStop(1, "rgba(36,32,28,0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H * 0.2);
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
  var i, item, q, img, size, outward;
  for (i = 0; i < SIDE_DRESSING.length; i++) {
    item = SIDE_DRESSING[i];
    if (onScreen && !onScreen(item.x, item.y, 360)) continue;
    ctx.save();
    clipOffStreet(ctx, iso, world, item.x < 0 ? -1 : 1);
    q = iso(item.x, item.y);
    img = spriteForBuilding(item.kind);
    size = buildingSize(item.kind, item.s);
    outward = item.x < 0 ? -size.dw * 0.08 : size.dw * 0.22;
    if (
      !stamp(
        ctx,
        img,
        q[0] + outward,
        q[1] + 10,
        size.dw,
        size.dh,
        item.side === "top" ? 0.98 : 0.8,
        item.flip,
      )
    )
      fallbackRuin(ctx, q[0] + outward, q[1], size.dw, size.dh);
    ctx.restore();
  }
}

export function drawWartornDressing(ctx, iso, world, W, H, onScreen) {
  var i, item, q, img, dw, dh;
  if (!ctx || !iso) return;
  drawFarBackdrop(ctx, iso, world, W, H);
  drawOrganicPatches(ctx, iso, world, onScreen);
  drawStreetScenes(ctx, iso, world, onScreen);
  drawSideBuildings(ctx, iso, world, onScreen);
  drawEdgeAccents(ctx, iso, world, onScreen);
  for (i = 0; i < WRECKS.length; i++) {
    item = WRECKS[i];
    if (onScreen && !onScreen(item.x, item.y, 220)) continue;
    ctx.save();
    clipOffStreet(ctx, iso, world, item.x < 0 ? -1 : 1);
    q = iso(item.x, item.y);
    img = spriteForWreck(item.kind);
    dw = 92 * item.s * 1.4;
    dh = 68 * item.s * 1.4;
    stamp(ctx, img, q[0], q[1] + 4, dw, dh, 0.88);
    ctx.restore();
  }
  for (i = 0; i < RUBBLE.length; i++) {
    item = RUBBLE[i];
    if (onScreen && !onScreen(item.x, item.y, 180)) continue;
    ctx.save();
    clipOffStreet(ctx, iso, world, item.x < 0 ? -1 : 1);
    q = iso(item.x, item.y);
    img = spriteForRubble(item.kind);
    dw = (item.kind === "pile" ? 96 : 72) * item.s * 1.5;
    dh = (item.kind === "pile" ? 56 : 50) * item.s * 1.5;
    stamp(ctx, img, q[0], q[1] + 4, dw, dh, 0.88);
    ctx.restore();
  }
  for (i = 0; i < SMOKE.length; i++) {
    item = SMOKE[i];
    if (onScreen && !onScreen(item.x, item.y, 360)) continue;
    q = iso(item.x, item.y);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#2a2622";
    ctx.beginPath();
    ctx.ellipse(q[0], q[1] - 78 * item.s, 16 * item.s, 52 * item.s, 0, 0, Math.PI * 2);
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

export function topFacadeEdgeX() {
  return TOP_EDGE;
}
