const MAP_SCALE = 1.7;

export const COVER_SHAPES = ["square", "rect", "T", "U", "L"];

const SHAPE_KITS = {
  square: {
    segments: [{ dx: 0, dy: 0, w: 84, h: 84 }],
  },
  rect: {
    segments: [{ dx: 0, dy: 0, w: 168, h: 38 }],
  },
  T: {
    segments: [
      { dx: 0, dy: -46, w: 156, h: 38 },
      { dx: 0, dy: 28, w: 42, h: 96 },
    ],
  },
  U: {
    segments: [
      { dx: 0, dy: -52, w: 164, h: 38 },
      { dx: -63, dy: 20, w: 38, h: 112 },
      { dx: 63, dy: 20, w: 38, h: 112 },
    ],
  },
  L: {
    segments: [
      { dx: -16, dy: 42, w: 148, h: 38 },
      { dx: -55, dy: -28, w: 38, h: 108 },
    ],
  },
};

const SET_PIECE_KITS = {
  fortL: {
    shape: "L",
    segments: [
      { dx: -8, dy: 62, w: 220, h: 42 },
      { dx: -86, dy: -42, w: 42, h: 168 },
      { dx: 92, dy: 62, w: 100, h: 36 },
    ],
  },
  barricade: {
    shape: "rect",
    segments: [
      { dx: -96, dy: 0, w: 124, h: 38 },
      { dx: 30, dy: 0, w: 124, h: 38 },
      { dx: 126, dy: 8, w: 72, h: 34 },
    ],
  },
  bunkerU: {
    shape: "U",
    segments: [
      { dx: 0, dy: -74, w: 220, h: 42 },
      { dx: -90, dy: 28, w: 42, h: 148 },
      { dx: 90, dy: 28, w: 42, h: 148 },
    ],
  },
  checkpointT: {
    shape: "T",
    segments: [
      { dx: 0, dy: -60, w: 210, h: 42 },
      { dx: 0, dy: 40, w: 48, h: 128 },
    ],
  },
};

function rotatePoint(dx, dy, facing) {
  if (facing === 90) return { dx: dy, dy: -dx };
  if (facing === 180) return { dx: -dx, dy: -dy };
  if (facing === 270) return { dx: -dy, dy: dx };
  return { dx: dx, dy: dy };
}

export function rotateCoverSegments(segments, facing) {
  facing = ((facing % 360) + 360) % 360;
  return segments.map(function (segment) {
    var p = rotatePoint(segment.dx || 0, segment.dy || 0, facing);
    var swap = facing === 90 || facing === 270;
    return {
      dx: p.dx,
      dy: p.dy,
      w: swap ? segment.h : segment.w,
      h: swap ? segment.w : segment.h,
    };
  });
}

export function boundsFromSegments(segments) {
  var minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  segments.forEach(function (segment) {
    minX = Math.min(minX, (segment.dx || 0) - segment.w / 2);
    maxX = Math.max(maxX, (segment.dx || 0) + segment.w / 2);
    minY = Math.min(minY, (segment.dy || 0) - segment.h / 2);
    maxY = Math.max(maxY, (segment.dy || 0) + segment.h / 2);
  });
  return {
    w: Math.max(36, Math.round(maxX - minX)),
    h: Math.max(28, Math.round(maxY - minY)),
  };
}

export function coverTypeForTheme(theme) {
  if (theme === "sandbags" || theme === "crates") return "low";
  if (theme === "wreck") return "car";
  return "wide";
}

export function makeShapedCover(spec) {
  var setKit = spec.kit && SET_PIECE_KITS[spec.kit];
  var shape = (setKit && setKit.shape) || spec.shape;
  var kit = setKit || SHAPE_KITS[shape];
  if (!kit) throw new Error("Unknown cover shape: " + shape);
  var facing = spec.facing || 0;
  var segments = rotateCoverSegments(kit.segments, facing);
  var box = boundsFromSegments(segments);
  var theme = spec.theme || "jersey";
  return {
    id: spec.id,
    x: spec.x,
    y: spec.y,
    shape: shape,
    theme: theme,
    facing: facing,
    asset: theme + "_" + shape,
    coverType: spec.coverType || coverTypeForTheme(theme),
    scale: spec.scale || 0.26,
    w: box.w,
    h: box.h,
    segments: segments,
    setPiece: spec.kit || null,
    sprite: spec.sprite || (spec.kit ? "set_" + spec.kit : null),
  };
}

function spread(items) {
  return items.map(function (item) {
    return Object.assign({}, item, {
      x: Math.round(item.x * MAP_SCALE),
      y: Math.round(item.y * MAP_SCALE),
    });
  });
}

function createCityCoverTemplates() {
  return spread(
    [
      { id: "p1", x: -180, y: 520, kit: "barricade", shape: "rect", theme: "jersey", sprite: "set_barricade" },
      { id: "p2", x: 0, y: 520, shape: "rect", theme: "jersey" },
      { id: "p3", x: 180, y: 520, shape: "rect", theme: "sandbags" },
      { id: "ml1", x: -280, y: 250, shape: "rect", theme: "sandbags" },
      { id: "ml2", x: -420, y: 60, kit: "fortL", shape: "L", theme: "jersey", facing: 0, sprite: "set_fortL" },
      { id: "ml3", x: -260, y: -120, shape: "square", theme: "crates" },
      { id: "mr1", x: 280, y: 250, kit: "bunkerU", shape: "U", theme: "sandbags", facing: 180, sprite: "sandbags_U" },
      { id: "mr2", x: 420, y: 40, shape: "L", theme: "jersey", facing: 90 },
      { id: "mr3", x: 260, y: -140, shape: "rect", theme: "crates", facing: 90 },
      { id: "c1", x: 0, y: 210, kit: "checkpointT", shape: "T", theme: "jersey", facing: 0 },
      { id: "c2", x: -90, y: -25, shape: "square", theme: "sandbags" },
      { id: "c3", x: 105, y: -30, shape: "square", theme: "crates" },
      { id: "c4", x: 0, y: -260, shape: "L", theme: "sandbags", facing: 270 },
      { id: "f1", x: -260, y: -470, shape: "rect", theme: "wreck" },
      { id: "f2", x: 250, y: -470, shape: "L", theme: "wreck", facing: 0 },
      { id: "f3", x: 0, y: -610, shape: "rect", theme: "rubble" },
      { id: "l1", x: -560, y: -180, shape: "T", theme: "rubble", facing: 90 },
      { id: "l2", x: -620, y: 180, shape: "rect", theme: "jersey" },
      { id: "r1", x: 560, y: -180, shape: "U", theme: "jersey", facing: 90 },
      { id: "r2", x: 620, y: 180, shape: "rect", theme: "jersey" },
      { id: "e1", x: -115, y: 85, shape: "square", theme: "sandbags" },
      { id: "e2", x: 125, y: 95, shape: "square", theme: "crates" },
      { id: "e3", x: -360, y: -330, shape: "T", theme: "sandbags", facing: 180 },
      { id: "e4", x: 360, y: -330, shape: "U", theme: "crates", facing: 0 },
      { id: "g1", x: -1050, y: 620, shape: "rect", theme: "jersey" },
      { id: "g2", x: 950, y: 650, shape: "L", theme: "jersey", facing: 180 },
      { id: "g3", x: 0, y: 950, shape: "T", theme: "jersey", facing: 0 },
      { id: "g4", x: -900, y: -800, shape: "rect", theme: "sandbags" },
      { id: "g5", x: 850, y: -780, shape: "U", theme: "sandbags", facing: 0 },
      { id: "g6", x: -1050, y: -250, shape: "rect", theme: "rubble" },
      { id: "g7", x: 1050, y: -250, shape: "rect", theme: "wreck" },
      { id: "g8", x: -950, y: 100, shape: "L", theme: "wreck", facing: 90 },
      { id: "g9", x: 950, y: 100, shape: "rect", theme: "jersey" },
      { id: "g10", x: 0, y: -1000, shape: "T", theme: "crates", facing: 270 },
      { id: "g11", x: -600, y: 900, shape: "square", theme: "crates" },
      { id: "g12", x: 600, y: 900, shape: "U", theme: "jersey", facing: 180 },
    ].map(function (item) {
      return makeShapedCover(item);
    }),
  );
}

const PLAYER_SAFE_ZONE = { x: 0, y: 190, radius: 330 };
const OBJECTIVE_SAFE_ZONE = { x: 0, y: -5700, radius: 520 };
const ENEMY_SPAWNS = [
  [-1500, -1180],
  [-980, -1320],
  [-280, -1350],
  [500, -1330],
  [1240, -1160],
  [1490, -560],
  [1540, 180],
  [1380, 920],
  [760, 1260],
  [40, 1320],
  [-700, 1240],
  [-1320, 900],
  [-1510, 230],
  [-1420, -590],
];
const PROP_POINTS = spread([
  { x: -760, y: 640 },
  { x: -520, y: 380 },
  { x: 760, y: 640 },
  { x: 520, y: 380 },
  { x: -720, y: -120 },
  { x: 720, y: -120 },
  { x: -690, y: 40 },
  { x: 690, y: 40 },
  { x: -470, y: -550 },
  { x: 470, y: -550 },
  { x: -120, y: -720 },
  { x: 120, y: -720 },
]);

function shuffled(items, random) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Asphalt half-width matches wartornCity ROAD. Cover stays on the road;
// sidewalks/buildings stay on the edges as backdrop.
export const STREET_ROAD_HALF = 980;
export const STREET_COVER_HALF = 720;
export const STREET_COVER_LANES = [-580, 0, 580];
export const STREET_COVER_Y0 = -320;
export const STREET_COVER_Y1 = -5180;
export const STREET_COVER_GAP_X = 180;
export const STREET_COVER_GAP_Y = 240;
export const STREET_COVER_MIN_DIST = 320;

export function isFortCover(cover) {
  return !!(cover && cover.id && String(cover.id).indexOf("fort-") === 0);
}

export function coversTooClose(a, b, padX, padY, minDist) {
  if (!a || !b) return false;
  padX = padX == null ? STREET_COVER_GAP_X : padX;
  padY = padY == null ? STREET_COVER_GAP_Y : padY;
  minDist = minDist == null ? STREET_COVER_MIN_DIST : minDist;
  if (Math.hypot(a.x - b.x, a.y - b.y) < minDist) return true;
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 + padX &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2 + padY
  );
}

function isClear(candidate, placed) {
  const extent = Math.max(candidate.w, candidate.h) / 2;
  if (Math.abs(candidate.x) > STREET_COVER_HALF) return false;
  if (
    Math.hypot(
      candidate.x - PLAYER_SAFE_ZONE.x,
      candidate.y - PLAYER_SAFE_ZONE.y,
    ) <
    PLAYER_SAFE_ZONE.radius + extent
  )
    return false;
  if (
    Math.hypot(
      candidate.x - OBJECTIVE_SAFE_ZONE.x,
      candidate.y - OBJECTIVE_SAFE_ZONE.y,
    ) <
    OBJECTIVE_SAFE_ZONE.radius + extent
  )
    return false;
  if (
    ENEMY_SPAWNS.some(
      ([x, y]) => Math.hypot(candidate.x - x, candidate.y - y) < 190 + extent,
    )
  )
    return false;
  if (
    PROP_POINTS.some(
      (prop) =>
        Math.hypot(candidate.x - prop.x, candidate.y - prop.y) < 115 + extent,
    )
  )
    return false;
  return placed.every(function (other) {
    return !coversTooClose(candidate, other);
  });
}

function cloneCover(template, id, x, y) {
  return Object.assign({}, template, {
    id: id,
    x: Math.round(x),
    y: Math.round(y),
    segments: template.segments
      ? template.segments.map((segment) => Object.assign({}, segment))
      : null,
  });
}

export function createCityCoverLayout(random = Math.random) {
  const templates = shuffled(createCityCoverTemplates(), random);
  const targetCount = 30 + Math.floor(random() * 5);
  const placed = [];
  const lanes = STREET_COVER_LANES;
  const rows = Math.max(1, Math.ceil(targetCount / lanes.length));
  const yStride = (STREET_COVER_Y0 - STREET_COVER_Y1) / rows;

  function tryPlace(template, slot, x, y) {
    x = Math.max(-STREET_COVER_HALF, Math.min(STREET_COVER_HALF, x));
    y = Math.max(STREET_COVER_Y1, Math.min(STREET_COVER_Y0, y));
    const candidate = cloneCover(
      template,
      "street-" + slot + "-" + template.id,
      x,
      y,
    );
    if (!isClear(candidate, placed)) return false;
    placed.push(candidate);
    return true;
  }

  for (let slot = 0; slot < targetCount; slot++) {
    const template = templates[slot % templates.length];
    const lane = slot % lanes.length;
    const row = Math.floor(slot / lanes.length);
    // Stagger odd lanes by half a stride so exclusive slots do not form a wall.
    const yBase = STREET_COVER_Y0 - (row + 0.5) * yStride - (lane % 2) * (yStride * 0.35);
    let placedSlot = false;
    for (let attempt = 0; attempt < 180 && !placedSlot; attempt++) {
      const laneX = lanes[(lane + attempt) % lanes.length];
      const x = laneX + (random() - 0.5) * 72;
      const y = yBase + (random() - 0.5) * 48 + (attempt % 9 - 4) * (yStride * 0.22);
      placedSlot = tryPlace(template, slot, x, y);
    }
  }

  // Fill holes so street + fort stay in the 34–40 piece band.
  let extra = 0;
  while (placed.length < targetCount && extra < 220) {
    const template = templates[extra % templates.length];
    const laneX = lanes[extra % lanes.length];
    const t = (extra * 0.173) % 1;
    const x = laneX + (random() - 0.5) * 80;
    const y = STREET_COVER_Y0 - t * (STREET_COVER_Y0 - STREET_COVER_Y1);
    tryPlace(template, placed.length, x, y);
    extra++;
  }
  placed.push(
    makeShapedCover({
      id: "fort-front",
      x: 0,
      y: -5920,
      kit: "bunkerU",
      shape: "U",
      theme: "sandbags",
      facing: 0,
      coverType: "wide",
      scale: 0.33,
      sprite: "sandbags_U",
    }),
    makeShapedCover({
      id: "fort-left",
      x: -380,
      y: -5680,
      kit: "fortL",
      shape: "L",
      theme: "jersey",
      facing: 180,
      scale: 0.3,
      sprite: "set_fortL",
    }),
    makeShapedCover({
      id: "fort-right",
      x: 380,
      y: -5680,
      kit: "fortL",
      shape: "L",
      theme: "jersey",
      facing: 0,
      scale: 0.3,
      sprite: "set_fortL",
    }),
    makeShapedCover({
      id: "fort-rear",
      x: 0,
      y: -5460,
      shape: "rect",
      theme: "jersey",
      scale: 0.28,
    }),
  );
  return placed;
}

export function createCityProps() {
  return spread([
    { x: -760, y: 640, asset: "lamp_post", scale: 0.24 },
    { x: -520, y: 380, asset: "lamp_post", scale: 0.24 },
    { x: 760, y: 640, asset: "lamp_post", scale: 0.24 },
    { x: 520, y: 380, asset: "lamp_post", scale: 0.24 },
    { x: -720, y: -120, asset: "power_pole", scale: 0.23 },
    { x: 720, y: -120, asset: "traffic_light", scale: 0.23 },
    { x: -690, y: 40, asset: "barrels", scale: 0.22 },
    { x: 690, y: 40, asset: "barrels", scale: 0.22 },
    { x: -470, y: -550, asset: "guard_booth", scale: 0.2 },
    { x: 470, y: -550, asset: "guard_booth", scale: 0.2 },
    { x: -120, y: -720, asset: "dual_lamp", scale: 0.23 },
    { x: 120, y: -720, asset: "camera_pole", scale: 0.23 },
  ]);
}
