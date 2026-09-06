import { loadImage } from "./assets.js?v=20260906-79";
export { loadImage };
export const cityAtlas = new Image();
cityAtlas.src =
  "./assets/C226AF9A-3862-4A3E-BA10-1F43A16A3D8A.PNG?v=20260906-79";
export const generatedCoverAtlas = new Image();
generatedCoverAtlas.src =
  "./assets/generated/cover-runtime-atlas.webp?v=20260906-79";

const THEME = {
  jersey: {
    left: "#6d7270",
    right: "#4f5553",
    top: "#8b908c",
    stroke: "#2c302e",
    accent: "#d56a2a",
    accentDark: "#8a3d14",
  },
  sandbags: {
    left: "#8a7348",
    right: "#6a5634",
    top: "#c4a56a",
    stroke: "#3d311c",
    accent: "#a8884e",
    accentDark: "#5a4526",
  },
  crates: {
    left: "#7a5330",
    right: "#5a3c22",
    top: "#b07a45",
    stroke: "#2c1b10",
    accent: "#d2a066",
    accentDark: "#3d2414",
  },
  wreck: {
    left: "#5a4a3d",
    right: "#3d332b",
    top: "#7a6756",
    stroke: "#1e1814",
    accent: "#2a2420",
    accentDark: "#11100e",
  },
  rubble: {
    left: "#6a6660",
    right: "#4c4944",
    top: "#8a857c",
    stroke: "#2a2723",
    accent: "#9a8f7c",
    accentDark: "#3a362f",
  },
};

export function preloadCityAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.1, "LOADING CITY ASSETS");
  return Promise.all([loadImage(cityAtlas), loadImage(generatedCoverAtlas)]).then(
    function (images) {
      if (images.some(function (img) {
        return !img;
      }))
        throw new Error("City environment images are not ready");
      onProgress(1, "CITY ASSETS READY");
      return {
        cityAtlas: images[0],
        generatedCoverAtlas: images[1],
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
  var long = Math.max(segment.w, segment.h);
  var base = type === "low" ? 11 : type === "car" ? 17 : 22;
  if (cover.shape === "square") base += 3;
  return base + Math.min(6, long * 0.02);
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
  var midA = [
      (prism.A[0] + prism.D[0]) / 2,
      (prism.A[1] + prism.D[1]) / 2,
    ],
    midB = [
      (prism.B[0] + prism.C[0]) / 2,
      (prism.B[1] + prism.C[1]) / 2,
    ];
  ctx.save();
  ctx.strokeStyle = "#d56a2a";
  ctx.lineWidth = 3;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(midA[0], midA[1]);
  ctx.lineTo(midB[0], midB[1]);
  ctx.stroke();
  ctx.strokeStyle = "#f0d38a";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function decorateSandbags(ctx, prism, segment) {
  var count = Math.max(3, Math.round(Math.max(segment.w, segment.h) / 28));
  ctx.save();
  for (var i = 0; i < count; i++) {
    var t = (i + 0.5) / count;
    var p = alongTop(prism, t);
    ctx.fillStyle = i % 2 ? "#d2b57a" : "#b89658";
    ctx.strokeStyle = "#3d311c";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(p[0], p[1] - 2, 7, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function decorateCrates(ctx, prism) {
  ctx.save();
  ctx.strokeStyle = "#3d2414";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(prism.A[0], prism.A[1]);
  ctx.lineTo(prism.C[0], prism.C[1]);
  ctx.moveTo(prism.B[0], prism.B[1]);
  ctx.lineTo(prism.D[0], prism.D[1]);
  ctx.stroke();
  ctx.strokeStyle = "#d2a066";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(
    (prism.A[0] + prism.C[0]) / 2 - 5,
    (prism.A[1] + prism.C[1]) / 2 - 3,
    10,
    6,
  );
  ctx.restore();
}

function decorateWreck(ctx, prism) {
  var cabin = [
    [
      prism.A[0] * 0.35 + prism.B[0] * 0.35 + prism.D[0] * 0.15 + prism.C[0] * 0.15,
      prism.A[1] * 0.35 + prism.B[1] * 0.35 + prism.D[1] * 0.15 + prism.C[1] * 0.15 - 6,
    ],
    [
      prism.A[0] * 0.15 + prism.B[0] * 0.55 + prism.D[0] * 0.1 + prism.C[0] * 0.2,
      prism.A[1] * 0.15 + prism.B[1] * 0.55 + prism.D[1] * 0.1 + prism.C[1] * 0.2 - 6,
    ],
    [
      (prism.C[0] + prism.B[0]) / 2,
      (prism.C[1] + prism.B[1]) / 2 - 1,
    ],
    [
      (prism.D[0] + prism.A[0]) / 2,
      (prism.D[1] + prism.A[1]) / 2 - 1,
    ],
  ];
  fillPoly(ctx, cabin, "#2c3538", "#11100e", 1);
  ctx.save();
  ctx.fillStyle = "#1a1816";
  ctx.beginPath();
  ctx.ellipse(prism.d[0] + 4, prism.d[1] + 1, 5, 2.4, 0, 0, Math.PI * 2);
  ctx.ellipse(prism.c[0] - 4, prism.c[1] + 1, 5, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function decorateRubble(ctx, prism) {
  ctx.save();
  ctx.fillStyle = "#9a8f7c";
  ctx.beginPath();
  ctx.moveTo(prism.A[0] + 6, prism.A[1] + 2);
  ctx.lineTo(prism.B[0] - 8, prism.B[1] + 1);
  ctx.lineTo((prism.B[0] + prism.C[0]) / 2, (prism.B[1] + prism.C[1]) / 2 + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5a564e";
  ctx.beginPath();
  ctx.arc(prism.D[0] + 8, prism.D[1] - 4, 3.2, 0, Math.PI * 2);
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

export function drawShapedCover(ctx, cover, iso) {
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
