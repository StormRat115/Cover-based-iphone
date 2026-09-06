import { loadImage } from "./assets.js?v=20260906-73";
export { loadImage };
export const cityAtlas = new Image();
cityAtlas.src =
  "./assets/C226AF9A-3862-4A3E-BA10-1F43A16A3D8A.PNG?v=20260905-60";
export const generatedCoverAtlas = new Image();
generatedCoverAtlas.src =
  "./assets/generated/cover-runtime-atlas.webp?v=20260905-62";
export const groundTile = new Image();
groundTile.src = "./assets/generated/tile-asphalt.png?v=20260906-73";
export const buildingRuinA = new Image();
buildingRuinA.src = "./assets/generated/building-ruin-a.png?v=20260906-73";
export const buildingRuinB = new Image();
buildingRuinB.src = "./assets/generated/building-ruin-b.png?v=20260906-73";
export const organicCovers = {
  jersey: Object.assign(new Image(), { src: "./assets/generated/cover-jersey-organic.png?v=20260906-73" }),
  sandbags: Object.assign(new Image(), { src: "./assets/generated/cover-sandbags-organic.png?v=20260906-73" }),
  crates: Object.assign(new Image(), { src: "./assets/generated/cover-crates-organic.png?v=20260906-73" }),
  sedan: Object.assign(new Image(), { src: "./assets/generated/cover-sedan-organic.png?v=20260906-73" }),
};

export function preloadCityAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.1, "LOADING CITY ASSETS");
  var organicList = Object.keys(organicCovers).map(function (k) {
    return loadImage(organicCovers[k]);
  });
  return Promise.all(
    [
      loadImage(cityAtlas),
      loadImage(generatedCoverAtlas),
      loadImage(groundTile),
      loadImage(buildingRuinA),
      loadImage(buildingRuinB),
    ].concat(organicList),
  ).then(function (images) {
    if (images.some(function (img) { return !img; }))
      throw new Error("City environment images are not ready");
    onProgress(1, "CITY ASSETS READY");
    return {
      cityAtlas: images[0],
      generatedCoverAtlas: images[1],
      groundTile: images[2],
      buildingRuinA: images[3],
      buildingRuinB: images[4],
      organicCovers: organicCovers,
    };
  });
}

export const CITY_ASSET_DEFS = {
  barrier_long: { x: 0, y: 0, w: 355, h: 170, kind: "cover", cover: "high" },
  barrier_short: { x: 380, y: 5, w: 170, h: 145, kind: "cover", cover: "high" },
  barrier_mid: { x: 560, y: 0, w: 250, h: 155, kind: "cover", cover: "high" },
  barrier_corner: {
    x: 825,
    y: 0,
    w: 285,
    h: 185,
    kind: "cover",
    cover: "high",
  },
  rubble_wall: { x: 1120, y: 0, w: 305, h: 190, kind: "cover", cover: "high" },
  barrier_yellow: {
    x: 0,
    y: 165,
    w: 310,
    h: 155,
    kind: "cover",
    cover: "high",
  },
  barrier_striped: {
    x: 320,
    y: 165,
    w: 260,
    h: 160,
    kind: "cover",
    cover: "high",
  },
  barrier_small: {
    x: 590,
    y: 165,
    w: 155,
    h: 125,
    kind: "cover",
    cover: "high",
  },
  barrier_small_2: {
    x: 760,
    y: 160,
    w: 175,
    h: 130,
    kind: "cover",
    cover: "high",
  },
  rubble_long: { x: 945, y: 155, w: 310, h: 165, kind: "cover", cover: "high" },
  rubble_chunk: {
    x: 1260,
    y: 165,
    w: 165,
    h: 140,
    kind: "cover",
    cover: "high",
  },
  sandbag_long: { x: 0, y: 325, w: 320, h: 145, kind: "cover", cover: "low" },
  sandbag_corner: {
    x: 330,
    y: 320,
    w: 290,
    h: 180,
    kind: "cover",
    cover: "low",
  },
  sandbag_short: {
    x: 625,
    y: 330,
    w: 140,
    h: 110,
    kind: "cover",
    cover: "low",
  },
  sandbag_crates: {
    x: 770,
    y: 320,
    w: 255,
    h: 175,
    kind: "cover",
    cover: "low",
  },
  street_fence: { x: 1030, y: 315, w: 165, h: 150, kind: "prop" },
  road_blocker: {
    x: 1195,
    y: 325,
    w: 155,
    h: 120,
    kind: "cover",
    cover: "low",
  },
  saw_horse: { x: 1330, y: 320, w: 110, h: 120, kind: "prop" },
  ammo_pallet: { x: 0, y: 475, w: 170, h: 120, kind: "prop" },
  crate_stack: { x: 175, y: 450, w: 225, h: 180, kind: "cover", cover: "low" },
  supply_stack: { x: 405, y: 455, w: 290, h: 165, kind: "cover", cover: "low" },
  burned_sedan: {
    x: 775,
    y: 430,
    w: 350,
    h: 230,
    kind: "cover",
    cover: "high",
  },
  pickup_truck: {
    x: 1130,
    y: 470,
    w: 315,
    h: 205,
    kind: "cover",
    cover: "high",
  },
  barrels: { x: 0, y: 630, w: 180, h: 155, kind: "prop" },
  barrel_single: { x: 195, y: 640, w: 85, h: 120, kind: "prop" },
  tank_cube: { x: 285, y: 640, w: 110, h: 120, kind: "prop" },
  gas_can: { x: 405, y: 650, w: 60, h: 90, kind: "prop" },
  planter: { x: 470, y: 620, w: 250, h: 150, kind: "cover", cover: "low" },
  rubble_small: { x: 0, y: 805, w: 235, h: 160, kind: "cover", cover: "low" },
  rubble_large: {
    x: 240,
    y: 785,
    w: 295,
    h: 190,
    kind: "cover",
    cover: "high",
  },
  guard_booth: { x: 545, y: 760, w: 220, h: 250, kind: "cover", cover: "high" },
  lamp_post: { x: 780, y: 760, w: 90, h: 250, kind: "prop" },
  dual_lamp: { x: 985, y: 800, w: 120, h: 180, kind: "prop" },
  power_pole: { x: 1110, y: 790, w: 120, h: 210, kind: "prop" },
  traffic_light: { x: 1230, y: 790, w: 95, h: 200, kind: "prop" },
  camera_pole: { x: 1330, y: 780, w: 110, h: 220, kind: "prop" },
  gen_concrete_long: { x: 0, y: 0, w: 512, h: 384, atlas: "generated" },
  gen_concrete_corner: { x: 512, y: 0, w: 512, h: 384, atlas: "generated" },
  gen_concrete_curve: { x: 1024, y: 0, w: 512, h: 384, atlas: "generated" },
  gen_sandbag_long: { x: 1536, y: 0, w: 512, h: 384, atlas: "generated" },
  gen_sandbag_u: { x: 0, y: 384, w: 512, h: 384, atlas: "generated" },
  gen_brick_wall: { x: 512, y: 384, w: 512, h: 384, atlas: "generated" },
  gen_wrecked_suv: { x: 1024, y: 384, w: 512, h: 384, atlas: "generated" },
  gen_cargo_truck: { x: 1536, y: 384, w: 512, h: 384, atlas: "generated" },
  gen_container: { x: 0, y: 768, w: 512, h: 384, atlas: "generated" },
  gen_pipe_stack: { x: 512, y: 768, w: 512, h: 384, atlas: "generated" },
  gen_crate_stack: { x: 1024, y: 768, w: 512, h: 384, atlas: "generated" },
  gen_planter: { x: 1536, y: 768, w: 512, h: 384, atlas: "generated" },
};


const ORGANIC_COVER_MAP = {
  barrier_long: "jersey",
  barrier_short: "jersey",
  barrier_mid: "jersey",
  barrier_corner: "jersey",
  barrier_yellow: "jersey",
  barrier_striped: "jersey",
  barrier_small: "jersey",
  barrier_small_2: "jersey",
  road_blocker: "jersey",
  sandbag_long: "sandbags",
  sandbag_corner: "sandbags",
  sandbag_short: "sandbags",
  sandbag_crates: "sandbags",
  gen_sandbag_long: "sandbags",
  gen_sandbag_u: "sandbags",
  crate_stack: "crates",
  supply_stack: "crates",
  gen_crate_stack: "crates",
  ammo_pallet: "crates",
  burned_sedan: "sedan",
  pickup_truck: "sedan",
  gen_wrecked_suv: "sedan",
  gen_cargo_truck: "sedan",
};

export function drawOrganicCover(ctx, key, x, y, options) {
  options = options || {};
  var which = ORGANIC_COVER_MAP[key];
  if (!which) return false;
  var img = organicCovers[which];
  if (!img || !img.complete || !img.naturalWidth) return false;
  var scale = options.scale == null ? 0.34 : options.scale;
  var dw = img.naturalWidth * scale;
  var dh = img.naturalHeight * scale;
  var anchorX = options.anchorX == null ? 0.5 : options.anchorX;
  var anchorY = options.anchorY == null ? 0.9 : options.anchorY;
  ctx.save();
  ctx.translate(x, y);
  // Soft contact shadow so props sit on asphalt.
  ctx.fillStyle = "#00000066";
  ctx.beginPath();
  ctx.ellipse(0, 2, Math.max(14, dw * 0.34), Math.max(4, dh * 0.08), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = options.alpha == null ? 1 : options.alpha;
  ctx.drawImage(img, -dw * anchorX, -dh * anchorY, dw, dh);
  ctx.restore();
  return true;
}

export function drawCityAsset(ctx, key, x, y, options) {
  if (drawOrganicCover(ctx, key, x, y, options)) return true;
  var def = CITY_ASSET_DEFS[key];
  if (!def) return false;
  options = options || {};
  var scale = options.scale == null ? 0.28 : options.scale;
  var rotation = options.rotation || 0;
  var alpha = options.alpha == null ? 1 : options.alpha;
  var anchorX = options.anchorX == null ? 0.5 : options.anchorX;
  var anchorY = options.anchorY == null ? 0.85 : options.anchorY;
  var dw = def.w * scale,
    dh = def.h * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  var drawn = false;
  var atlas = def.atlas === "generated" ? generatedCoverAtlas : cityAtlas;
  if (atlas.complete && atlas.naturalWidth > 0) {
    ctx.drawImage(
      atlas,
      def.x,
      def.y,
      def.w,
      def.h,
      -dw * anchorX,
      -dh * anchorY,
      dw,
      dh,
    );
    drawn = true;
  }
  ctx.restore();
  return drawn;
}
