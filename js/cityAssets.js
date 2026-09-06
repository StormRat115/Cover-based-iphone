import { loadImage } from "./assets.js?v=20260906-93";
import { COVER_ATLAS_SPRITES } from "./coverAtlasData.js?v=20260906-93";
import { preloadWartornAssets } from "./wartornCity.js?v=20260906-93";
export { loadImage };
export const cityAtlas = new Image();
cityAtlas.src =
  "./assets/C226AF9A-3862-4A3E-BA10-1F43A16A3D8A.PNG?v=20260906-88";
export const generatedCoverAtlas = new Image();
generatedCoverAtlas.src =
  "./assets/generated/cover-runtime-atlas.webp?v=20260906-88";
export const coverShapeAtlas = new Image();
coverShapeAtlas.src =
  "./assets/generated/cover/cover-shape-atlas.webp?v=20260906-88";

const THEME = {
  jersey: {
    left: "#8d9290",
    right: "#5c6361",
    top: "#c5cac6",
    stroke: "#2a2e2c",
    accent: "#ef6a1c",
    accentDark: "#8a3d14",
  },
  sandbags: {
    left: "#9a7c42",
    right: "#6e5528",
    top: "#e0c07a",
    stroke: "#3a2c14",
    accent: "#c8a45c",
    accentDark: "#5a4526",
  },
  crates: {
    left: "#8a4e22",
    right: "#5c3316",
    top: "#d08a3c",
    stroke: "#2a160c",
    accent: "#f0c070",
    accentDark: "#3d2414",
  },
  wreck: {
    left: "#4a5560",
    right: "#2e353c",
    top: "#6b7580",
    stroke: "#14181c",
    accent: "#8fd0e8",
    accentDark: "#11151a",
  },
  rubble: {
    left: "#7a756c",
    right: "#534e46",
    top: "#b0a898",
    stroke: "#2a2620",
    accent: "#d0c4ac",
    accentDark: "#3a362f",
  },
};

export function preloadCityAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.1, "LOADING CITY ASSETS");
  return Promise.all([
    loadImage(cityAtlas),
    loadImage(generatedCoverAtlas),
    loadImage(coverShapeAtlas),
    preloadWartornAssets(onProgress),
  ]).then(
    function (images) {
      if (images.some(function (img) {
        return !img;
      }))
        throw new Error("City environment images are not ready");
      onProgress(1, "CITY ASSETS READY");
      return {
        cityAtlas: images[0],
        generatedCoverAtlas: images[1],
        coverShapeAtlas: images[2],
      };
    },
  );
}

export const CITY_ASSET_DEFS = {
  barrier_long: { x: 0, y: 0, w: 355, h: 170, kind: "cover", cover: "high" },
  barrier_short: { x: 380, y: 5, w: 170, h: 145, kind: "cover", cover: "high" },
  lamp_post: { x: 780, y: 760, w: 90, h: 250, kind: "prop" },
  dual_lamp: { x: 985, y: 800, w: 120, h: 180, kind: "prop" },
  power_pole: { x: 1110, y: 790, w: 120, h: 210, kind: "prop" },
  traffic_light: { x: 1230, y: 790, w: 95, h: 200, kind: "prop" },
  camera_pole: { x: 1330, y: 780, w: 110, h: 220, kind: "prop" },
  barrels: { x: 0, y: 630, w: 180, h: 155, kind: "prop" },
  guard_booth: { x: 545, y: 760, w: 220, h: 250, kind: "cover", cover: "high" },
};

function lift(p, z) {
  return [p[0], p[1] - z];
}

function fillPoly(ctx, pts, fill, stroke, width) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width == null ? 1 : width;
    ctx.stroke();
  }
}

function prismHeight(cover, segment) {
  var type = cover.type || "low";
  var theme = cover.theme || "jersey";
  var long = Math.max(segment.w, segment.h);
  var base = type === "low" ? 13 : type === "car" ? 16 : 24;
  if (theme === "jersey") base = Math.max(base, 26);
  if (theme === "sandbags") base = Math.min(base, 15);
  if (theme === "crates" || cover.shape === "square") base = Math.max(base, 18);
  if (theme === "wreck") base = 15;
  return base + Math.min(5, long * 0.015);
}

function drawPrism(ctx, iso, x, y, w, h, z, palette) {
  var a = iso(x - w / 2, y - h / 2),
    b = iso(x + w / 2, y - h / 2),
    c = iso(x + w / 2, y + h / 2),
    d = iso(x - w / 2, y + h / 2),
    A = lift(a, z),
    B = lift(b, z),
    C = lift(c, z),
    D = lift(d, z);
  ctx.save();
  ctx.fillStyle = "#00000055";
  ctx.beginPath();
  ctx.moveTo(a[0], a[1] + 3);
  ctx.lineTo(b[0], b[1] + 3);
  ctx.lineTo(c[0], c[1] + 3);
  ctx.lineTo(d[0], d[1] + 3);
  ctx.closePath();
  ctx.fill();
  fillPoly(ctx, [d, c, C, D], palette.left, palette.stroke, 1);
  fillPoly(ctx, [c, b, B, C], palette.right, palette.stroke, 1);
  fillPoly(ctx, [A, B, C, D], palette.top, palette.stroke, 1.1);
  ctx.restore();
  return { a: a, b: b, c: c, d: d, A: A, B: B, C: C, D: D, z: z };
}

function alongTop(prism, t) {
  var p = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  var from = t < 0.5 ? prism.A : prism.B;
  var to = t < 0.5 ? prism.B : prism.C;
  return [from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p];
}

function decorateJersey(ctx, prism) {
  var stripe = [
    [
      prism.A[0] * 0.55 + prism.D[0] * 0.45,
      prism.A[1] * 0.55 + prism.D[1] * 0.45,
    ],
    [
      prism.B[0] * 0.55 + prism.C[0] * 0.45,
      prism.B[1] * 0.55 + prism.C[1] * 0.45,
    ],
    [
      prism.B[0] * 0.45 + prism.C[0] * 0.55,
      prism.B[1] * 0.45 + prism.C[1] * 0.55,
    ],
    [
      prism.A[0] * 0.45 + prism.D[0] * 0.55,
      prism.A[1] * 0.45 + prism.D[1] * 0.55,
    ],
  ];
  fillPoly(ctx, stripe, "#ef6a1c", "#8a3d14", 1);
  ctx.save();
  ctx.strokeStyle = "#ffe08a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(stripe[0][0], stripe[0][1]);
  ctx.lineTo(stripe[1][0], stripe[1][1]);
  ctx.stroke();
  ctx.restore();
}

function decorateSandbags(ctx, prism, segment) {
  var count = Math.max(4, Math.round(Math.max(segment.w, segment.h) / 22));
  ctx.save();
  for (var row = 0; row < 2; row++) {
    for (var i = 0; i < count; i++) {
      var t = (i + (row ? 0.15 : 0.5)) / count;
      if (t <= 0 || t >= 1) continue;
      var p = alongTop(prism, t);
      ctx.fillStyle = (i + row) % 2 ? "#efd08a" : "#c8a45c";
      ctx.strokeStyle = "#3a2c14";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(p[0], p[1] - 1 - row * 5, 8.5, 5, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function decorateCrates(ctx, prism) {
  ctx.save();
  ctx.strokeStyle = "#2a160c";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(prism.A[0], prism.A[1]);
  ctx.lineTo(prism.C[0], prism.C[1]);
  ctx.moveTo(prism.B[0], prism.B[1]);
  ctx.lineTo(prism.D[0], prism.D[1]);
  ctx.stroke();
  var cx = (prism.A[0] + prism.C[0]) / 2,
    cy = (prism.A[1] + prism.C[1]) / 2;
  ctx.fillStyle = "#5c3316";
  ctx.fillRect(cx - 7, cy - 5, 14, 9);
  ctx.strokeStyle = "#f0c070";
  ctx.lineWidth = 1.6;
  ctx.strokeRect(cx - 7, cy - 5, 14, 9);
  ctx.restore();
}

function decorateWreck(ctx, prism) {
  var cabin = [
    [
      prism.A[0] * 0.42 + prism.B[0] * 0.28 + prism.D[0] * 0.18 + prism.C[0] * 0.12,
      prism.A[1] * 0.42 + prism.B[1] * 0.28 + prism.D[1] * 0.18 + prism.C[1] * 0.12 - 10,
    ],
    [
      prism.A[0] * 0.18 + prism.B[0] * 0.52 + prism.D[0] * 0.1 + prism.C[0] * 0.2,
      prism.A[1] * 0.18 + prism.B[1] * 0.52 + prism.D[1] * 0.1 + prism.C[1] * 0.2 - 10,
    ],
    [
      prism.C[0] * 0.55 + prism.B[0] * 0.45,
      prism.C[1] * 0.55 + prism.B[1] * 0.45 - 2,
    ],
    [
      prism.D[0] * 0.55 + prism.A[0] * 0.45,
      prism.D[1] * 0.55 + prism.A[1] * 0.45 - 2,
    ],
  ];
  fillPoly(ctx, cabin, "#8fd0e8", "#14181c", 1);
  fillPoly(
    ctx,
    [
      cabin[0],
      cabin[1],
      [
        cabin[1][0] * 0.7 + cabin[2][0] * 0.3,
        cabin[1][1] * 0.7 + cabin[2][1] * 0.3,
      ],
      [
        cabin[0][0] * 0.7 + cabin[3][0] * 0.3,
        cabin[0][1] * 0.7 + cabin[3][1] * 0.3,
      ],
    ],
    "#2a3338",
    "#14181c",
    1,
  );
  ctx.save();
  ctx.fillStyle = "#11151a";
  ctx.beginPath();
  ctx.ellipse(prism.d[0] + 6, prism.d[1] + 2, 6, 2.8, 0, 0, Math.PI * 2);
  ctx.ellipse(prism.c[0] - 6, prism.c[1] + 2, 6, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function decorateRubble(ctx, prism) {
  ctx.save();
  ctx.fillStyle = "#d0c4ac";
  ctx.beginPath();
  ctx.moveTo(prism.A[0] + 8, prism.A[1] + 1);
  ctx.lineTo(prism.B[0] - 10, prism.B[1] + 2);
  ctx.lineTo((prism.B[0] + prism.C[0]) / 2 - 4, (prism.B[1] + prism.C[1]) / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#534e46";
  ctx.beginPath();
  ctx.arc(prism.D[0] + 10, prism.D[1] - 5, 4, 0, Math.PI * 2);
  ctx.arc(prism.C[0] - 12, prism.C[1] - 3, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function decorateSegment(ctx, prism, cover, segment) {
  var theme = cover.theme || "jersey";
  if (theme === "sandbags") decorateSandbags(ctx, prism, segment);
  else if (theme === "crates") decorateCrates(ctx, prism);
  else if (theme === "wreck") decorateWreck(ctx, prism);
  else if (theme === "rubble") decorateRubble(ctx, prism);
  else decorateJersey(ctx, prism);
}

function spriteDefFor(cover) {
  if (cover.sprite && COVER_ATLAS_SPRITES[cover.sprite])
    return COVER_ATLAS_SPRITES[cover.sprite];
  if (cover.setPiece && COVER_ATLAS_SPRITES["set_" + cover.setPiece])
    return COVER_ATLAS_SPRITES["set_" + cover.setPiece];
  var theme = cover.theme || "jersey";
  var shape = cover.shape || "rect";
  return (
    COVER_ATLAS_SPRITES[theme + "_" + shape] ||
    COVER_ATLAS_SPRITES[theme + "_rect"] ||
    COVER_ATLAS_SPRITES.jersey_rect
  );
}

function isoBox(iso, x0, y0, x1, y1, lift) {
  var pts = [iso(x0, y0), iso(x1, y0), iso(x1, y1), iso(x0, y1)];
  var minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (var i = 0; i < pts.length; i++) {
    minX = Math.min(minX, pts[i][0]);
    maxX = Math.max(maxX, pts[i][0]);
    minY = Math.min(minY, pts[i][1] - lift);
    maxY = Math.max(maxY, pts[i][1]);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function stampCoverSprite(ctx, def, dest) {
  if (
    !coverShapeAtlas.complete ||
    !coverShapeAtlas.naturalWidth ||
    !def ||
    dest.w < 4 ||
    dest.h < 4
  )
    return false;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    coverShapeAtlas,
    def.x,
    def.y,
    def.w,
    def.h,
    dest.x,
    dest.y,
    dest.w,
    dest.h,
  );
  ctx.restore();
  return true;
}

function drawCoverSprite(ctx, cover, iso) {
  var def = spriteDefFor(cover);
  if (!def) return false;
  var segments =
    cover.segments && cover.segments.length
      ? cover.segments
      : [{ dx: 0, dy: 0, w: cover.w, h: cover.h }];
  var stampSegments =
    cover.facing && cover.facing % 360 !== 0 && !cover.setPiece && segments.length > 1;
  if (stampSegments) {
    var themeRect =
      COVER_ATLAS_SPRITES[(cover.theme || "jersey") + "_rect"] || def;
    var painted = false;
    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      var x = cover.x + (s.dx || 0),
        y = cover.y + (s.dy || 0);
      var lift = prismHeight(cover, s) + 6;
      var dest = isoBox(
        iso,
        x - s.w / 2,
        y - s.h / 2,
        x + s.w / 2,
        y + s.h / 2,
        lift,
      );
      dest.y -= 4;
      dest.h += 8;
      painted = stampCoverSprite(ctx, themeRect, dest) || painted;
    }
    return painted;
  }
  var minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity,
    lift = 16;
  for (var j = 0; j < segments.length; j++) {
    var seg = segments[j];
    var cx = cover.x + (seg.dx || 0),
      cy = cover.y + (seg.dy || 0);
    minX = Math.min(minX, cx - seg.w / 2);
    maxX = Math.max(maxX, cx + seg.w / 2);
    minY = Math.min(minY, cy - seg.h / 2);
    maxY = Math.max(maxY, cy + seg.h / 2);
    lift = Math.max(lift, prismHeight(cover, seg) + 8);
  }
  var box = isoBox(iso, minX, minY, maxX, maxY, lift);
  box.y -= 6;
  box.h += 10;
  return stampCoverSprite(ctx, def, box);
}

export function drawShapedCover(ctx, cover, iso) {
  if (drawCoverSprite(ctx, cover, iso)) return true;
  var segments = cover.segments && cover.segments.length
    ? cover.segments
    : [{ dx: 0, dy: 0, w: cover.w, h: cover.h }];
  var palette = THEME[cover.theme] || THEME.jersey;
  var ordered = segments
    .map(function (segment) {
      return {
        segment: segment,
        depth: cover.x + (segment.dx || 0) + cover.y + (segment.dy || 0),
      };
    })
    .sort(function (a, b) {
      return a.depth - b.depth;
    });
  for (var i = 0; i < ordered.length; i++) {
    var segment = ordered[i].segment;
    var x = cover.x + (segment.dx || 0);
    var y = cover.y + (segment.dy || 0);
    var z = prismHeight(cover, segment);
    var prism = drawPrism(ctx, iso, x, y, segment.w, segment.h, z, palette);
    decorateSegment(ctx, prism, cover, segment);
  }
  return true;
}

export function drawCityAsset(ctx, key, x, y, options) {
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
