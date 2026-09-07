import { loadImage } from "./assets.js?v=20260907-117";

var ROAD = 980;
var WALK = 260;

function surface(file) {
  var image = new Image();
  image.decoding = "async";
  image.src = "./assets/generated/environment/" + file + "?v=20260907-117";
  return image;
}

export const asphaltSurface = surface("asphalt-tile.webp");
export const concreteSidewalkSurface = surface("concrete-sidewalk-tile.webp");

function ready(image) {
  return !!(image && image.complete && image.naturalWidth);
}

function worldBounds(world) {
  return {
    minY: world && Number.isFinite(world.minY) ? world.minY : -6600,
    maxY: world && Number.isFinite(world.maxY) ? world.maxY : 1900,
  };
}

function clipWorldPoly(ctx, iso, points) {
  if (!ctx || !iso || !points.length) return false;
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

export function preloadWartornAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.25, "LOADING STREET SURFACES");
  return Promise.all([
    loadImage(asphaltSurface),
    loadImage(concreteSidewalkSurface),
  ]).then(function (images) {
    if (
      images.some(function (image) {
        return !image;
      })
    )
      throw new Error("Street surface textures are not ready");
    onProgress(1, "STREET SURFACES READY");
    return images;
  });
}

export function createWartornDressing() {
  return {
    buildings: [],
    rubble: [],
    wrecks: [],
    streetScenes: [],
    smoke: [],
    lamps: [],
    sidewalkProps: [],
    road: ROAD,
    sidewalk: WALK,
  };
}

export function drawWartornAtmosphere(ctx, width, height) {
  ctx.fillStyle = "#24272a";
  ctx.fillRect(0, 0, width, height);
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

// Non-block background props are intentionally disabled for the simplified map.
export function drawWartornDressing() {}

export function playableStreetHalfWidth() {
  return ROAD;
}

export function sidewalkWidth() {
  return WALK;
}
