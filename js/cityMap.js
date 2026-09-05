const MAP_SCALE = 1.32;
function spread(items) {
  return items.map(function (item) {
    return Object.assign({}, item, {
      x: Math.round(item.x * MAP_SCALE),
      y: Math.round(item.y * MAP_SCALE),
    });
  });
}
function createCityCoverTemplates() {
  return spread([
    {
      id: "p1",
      x: -180,
      y: 520,
      asset: "barrier_long",
      coverType: "wide",
      scale: 0.26,
      w: 160,
      h: 38,
    },
    {
      id: "p2",
      x: 0,
      y: 520,
      asset: "barrier_long",
      coverType: "wide",
      scale: 0.26,
      w: 160,
      h: 38,
    },
    {
      id: "p3",
      x: 180,
      y: 520,
      asset: "barrier_long",
      coverType: "wide",
      scale: 0.26,
      w: 160,
      h: 38,
    },
    {
      id: "ml1",
      x: -280,
      y: 250,
      asset: "sandbag_long",
      coverType: "low",
      scale: 0.25,
      w: 145,
      h: 32,
    },
    {
      id: "ml2",
      x: -420,
      y: 60,
      asset: "barrier_short",
      coverType: "wide",
      scale: 0.24,
      w: 120,
      h: 34,
    },
    {
      id: "ml3",
      x: -260,
      y: -120,
      asset: "crate_stack",
      coverType: "low",
      scale: 0.24,
      w: 120,
      h: 38,
    },
    {
      id: "mr1",
      x: 280,
      y: 250,
      asset: "sandbag_crates",
      coverType: "low",
      scale: 0.24,
      w: 135,
      h: 36,
    },
    {
      id: "mr2",
      x: 420,
      y: 40,
      asset: "barrier_short",
      coverType: "wide",
      scale: 0.24,
      w: 120,
      h: 34,
    },
    {
      id: "mr3",
      x: 260,
      y: -140,
      asset: "planter",
      coverType: "low",
      scale: 0.24,
      w: 135,
      h: 36,
    },
    {
      id: "c1",
      x: 0,
      y: 210,
      asset: "barrier_small",
      coverType: "wide",
      scale: 0.22,
      w: 100,
      h: 30,
    },
    {
      id: "c2",
      x: -90,
      y: -25,
      asset: "road_blocker",
      coverType: "low",
      scale: 0.22,
      w: 95,
      h: 28,
    },
    {
      id: "c3",
      x: 105,
      y: -30,
      asset: "road_blocker",
      coverType: "low",
      scale: 0.22,
      w: 95,
      h: 28,
    },
    {
      id: "c4",
      x: 0,
      y: -260,
      asset: "sandbag_corner",
      coverType: "low",
      scale: 0.24,
      w: 135,
      h: 42,
      segments: [
        { dx: -34, dy: 0, w: 92, h: 32 },
        { dx: 38, dy: -34, w: 34, h: 92 },
      ],
    },
    {
      id: "f1",
      x: -260,
      y: -470,
      asset: "burned_sedan",
      coverType: "car",
      scale: 0.22,
      w: 150,
      h: 48,
    },
    {
      id: "f2",
      x: 250,
      y: -470,
      asset: "pickup_truck",
      coverType: "car",
      scale: 0.22,
      w: 160,
      h: 50,
    },
    {
      id: "f3",
      x: 0,
      y: -610,
      asset: "rubble_long",
      coverType: "wide",
      scale: 0.23,
      w: 165,
      h: 42,
    },
    {
      id: "l1",
      x: -560,
      y: -180,
      asset: "rubble_wall",
      coverType: "wide",
      scale: 0.22,
      w: 145,
      h: 42,
    },
    {
      id: "l2",
      x: -620,
      y: 180,
      asset: "barrier_yellow",
      coverType: "wide",
      scale: 0.23,
      w: 145,
      h: 38,
    },
    {
      id: "r1",
      x: 560,
      y: -180,
      asset: "rubble_wall",
      coverType: "wide",
      scale: 0.22,
      w: 145,
      h: 42,
    },
    {
      id: "r2",
      x: 620,
      y: 180,
      asset: "barrier_striped",
      coverType: "wide",
      scale: 0.23,
      w: 145,
      h: 38,
    },
    {
      id: "e1",
      x: -115,
      y: 85,
      asset: "sandbag_short",
      coverType: "low",
      scale: 0.22,
      w: 85,
      h: 28,
    },
    {
      id: "e2",
      x: 125,
      y: 95,
      asset: "sandbag_short",
      coverType: "low",
      scale: 0.22,
      w: 85,
      h: 28,
    },
    {
      id: "e3",
      x: -360,
      y: -330,
      asset: "rubble_small",
      coverType: "low",
      scale: 0.22,
      w: 120,
      h: 34,
    },
    {
      id: "e4",
      x: 360,
      y: -330,
      asset: "rubble_small",
      coverType: "low",
      scale: 0.22,
      w: 120,
      h: 34,
    },
    {
      id: "g1",
      x: -1050,
      y: 620,
      asset: "gen_concrete_long",
      coverType: "wide",
      scale: 0.3,
      w: 220,
      h: 48,
    },
    {
      id: "g2",
      x: 950,
      y: 650,
      asset: "gen_concrete_corner",
      coverType: "wide",
      scale: 0.3,
      w: 190,
      h: 145,
      segments: [
        { dx: -42, dy: 0, w: 112, h: 42 },
        { dx: 42, dy: -42, w: 42, h: 126 },
      ],
    },
    {
      id: "g3",
      x: 0,
      y: 950,
      asset: "gen_concrete_curve",
      coverType: "wide",
      scale: 0.3,
      w: 230,
      h: 72,
      segments: [
        { dx: -70, dy: 8, w: 92, h: 40 },
        { dx: 0, dy: -8, w: 92, h: 42 },
        { dx: 70, dy: 8, w: 92, h: 40 },
      ],
    },
    {
      id: "g4",
      x: -900,
      y: -800,
      asset: "gen_sandbag_long",
      coverType: "low",
      scale: 0.29,
      w: 215,
      h: 54,
    },
    {
      id: "g5",
      x: 850,
      y: -780,
      asset: "gen_sandbag_u",
      coverType: "low",
      scale: 0.3,
      w: 210,
      h: 155,
      segments: [
        { dx: 0, dy: -54, w: 190, h: 44 },
        { dx: -74, dy: 5, w: 44, h: 135 },
        { dx: 74, dy: 5, w: 44, h: 135 },
      ],
    },
    {
      id: "g6",
      x: -1050,
      y: -250,
      asset: "gen_brick_wall",
      coverType: "wide",
      scale: 0.3,
      w: 215,
      h: 52,
    },
    {
      id: "g7",
      x: 1050,
      y: -250,
      asset: "gen_wrecked_suv",
      coverType: "car",
      scale: 0.31,
      w: 235,
      h: 82,
    },
    {
      id: "g8",
      x: -950,
      y: 100,
      asset: "gen_cargo_truck",
      coverType: "car",
      scale: 0.32,
      w: 285,
      h: 92,
    },
    {
      id: "g9",
      x: 950,
      y: 100,
      asset: "gen_container",
      coverType: "wide",
      scale: 0.31,
      w: 270,
      h: 88,
    },
    {
      id: "g10",
      x: 0,
      y: -1000,
      asset: "gen_pipe_stack",
      coverType: "low",
      scale: 0.29,
      w: 220,
      h: 72,
    },
    {
      id: "g11",
      x: -600,
      y: 900,
      asset: "gen_crate_stack",
      coverType: "low",
      scale: 0.28,
      w: 150,
      h: 88,
    },
    {
      id: "g12",
      x: 600,
      y: 900,
      asset: "gen_planter",
      coverType: "low",
      scale: 0.28,
      w: 175,
      h: 60,
    },
  ]);
}

const PLAYER_SAFE_ZONE = { x: 0, y: 190, radius: 330 };
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

function isClear(candidate, placed) {
  const extent = Math.max(candidate.w, candidate.h) / 2;
  if (
    Math.hypot(
      candidate.x - PLAYER_SAFE_ZONE.x,
      candidate.y - PLAYER_SAFE_ZONE.y,
    ) <
    PLAYER_SAFE_ZONE.radius + extent
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
    return !(
      Math.abs(candidate.x - other.x) < (candidate.w + other.w) / 2 + 90 &&
      Math.abs(candidate.y - other.y) < (candidate.h + other.h) / 2 + 72
    );
  });
}

export function createCityCoverLayout(random = Math.random) {
  const templates = shuffled(createCityCoverTemplates(), random);
  const targetCount = Math.min(templates.length, 27 + Math.floor(random() * 7));
  const placed = [];
  for (let i = 0; i < templates.length && placed.length < targetCount; i++) {
    const template = templates[i];
    for (let attempt = 0; attempt < 100; attempt++) {
      const slot = placed.length;
      const band =
        slot < 10 ? [370, 760] : slot < 22 ? [760, 1260] : [1260, 1780];
      const angle = random() * Math.PI * 2;
      const radius = band[0] + random() * (band[1] - band[0]);
      const candidate = Object.assign({}, template, {
        id: "mission-" + placed.length + "-" + template.id,
        x: Math.round(Math.cos(angle) * radius + (random() - 0.5) * 150),
        y: Math.round(Math.sin(angle) * radius * 0.82 + (random() - 0.5) * 120),
        segments: template.segments
          ? template.segments.map((segment) => Object.assign({}, segment))
          : null,
      });
      if (isClear(candidate, placed)) {
        placed.push(candidate);
        break;
      }
    }
  }
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
