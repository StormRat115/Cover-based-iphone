/* Uniform Minecraft-style cover blocks. One size everywhere. */

export const COVER_BLOCK_SIZE = 40;
export const COVER_THEMES = ["jersey", "sandbags", "crates", "rubble", "wreck"];
export const COVER_SHAPES = ["square", "rect", "T", "U", "L", "line", "cluster"];

export const COVER_SKIN_FILES = {
  concrete: {
    center: "concrete-center.webp",
    edgeRight: "concrete-edge-right.webp",
    edgeVert: "concrete-edge-vert.webp",
    edgeTop: "concrete-edge-top.webp",
  },
  sandbags: {
    center: "sandbags-center.webp",
    gap: "sandbags-gap.webp",
    gapThick: "sandbags-gap-thick.webp",
    u: "sandbags-u.webp",
  },
  crates: {
    face: "crate-face.webp",
    cornerA: "crate-corner-a.webp",
    cornerB: "crate-corner-b.webp",
    top: "crate-top.webp",
  },
  rubble: {
    center: "rubble-center.webp",
    edgeLeft: "rubble-edge-left.webp",
    edgeRight: "rubble-edge-right.webp",
    scatter: "rubble-scatter.webp",
  },
};

export function skinMaterialForTheme(theme) {
  if (theme === "jersey") return "concrete";
  if (theme === "wreck") return "rubble";
  if (theme === "sandbags" || theme === "crates" || theme === "rubble")
    return theme;
  return "concrete";
}

export function allCoverSkinFiles() {
  var files = [],
    mat,
    role;
  for (mat in COVER_SKIN_FILES) {
    for (role in COVER_SKIN_FILES[mat]) files.push(COVER_SKIN_FILES[mat][role]);
  }
  return files;
}

export function pickCoverBlockSkin(theme, mask, shape) {
  var mat = skinMaterialForTheme(theme);
  var files = COVER_SKIN_FILES[mat] || COVER_SKIN_FILES.concrete;
  var n = (mask & N) !== 0,
    e = (mask & E) !== 0,
    s = (mask & S) !== 0,
    w = (mask & W) !== 0;
  var count = (n ? 1 : 0) + (e ? 1 : 0) + (s ? 1 : 0) + (w ? 1 : 0);
  if (mat === "sandbags") {
    if (shape === "U" && count <= 2) return files.u;
    if (count <= 1) return files.gap;
    if (count === 2 && ((n && s) || (e && w))) return files.gapThick;
    if (count === 2) return files.u;
    return files.center;
  }
  if (mat === "crates") {
    if (!n && !w) return files.cornerA;
    if (!n && !e) return files.cornerB;
    if (!s && !e) return files.cornerA;
    if (!s && !w) return files.cornerB;
    if (!n) return files.top;
    if (count <= 1) return files.top;
    return files.face;
  }
  if (mat === "rubble") {
    if (count === 0 || count === 1) return files.scatter;
    if (!w && e) return files.edgeLeft;
    if (!e && w) return files.edgeRight;
    return files.center;
  }
  if (e && w) return files.center;
  if (w && !e) return files.edgeRight;
  if (n && s && !(e && w)) return files.edgeVert;
  if (!n) return files.edgeTop;
  return files.center;
}

export const N = 1,
  E = 2,
  S = 4,
  W = 8;

const DIRS = [
  { bit: N, gx: 0, gy: -1, side: "top" },
  { bit: E, gx: 1, gy: 0, side: "right" },
  { bit: S, gx: 0, gy: 1, side: "bottom" },
  { bit: W, gx: -1, gy: 0, side: "left" },
];

const SHAPE_CELLS = {
  square: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  rect: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  line: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  T: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
    [1, 2],
  ],
  U: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [2, 1],
    [2, 2],
  ],
  L: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
  ],
};

const SET_PIECE_CELLS = {
  fortL: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [3, 2],
  ],
  barricade: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [2, 1],
  ],
  bunkerU: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [4, 1],
    [4, 2],
    [4, 3],
  ],
  checkpointT: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [2, 1],
    [2, 2],
    [2, 3],
  ],
};

export function coverTypeForTheme(theme) {
  if (theme === "sandbags" || theme === "crates") return "low";
  if (theme === "wreck") return "car";
  return "wide";
}

export function cellKey(gx, gy) {
  return gx + "," + gy;
}

export function rotateCell(gx, gy, facing) {
  facing = ((facing % 360) + 360) % 360;
  if (facing === 90) return { gx: gy, gy: -gx };
  if (facing === 180) return { gx: -gx, gy: -gy };
  if (facing === 270) return { gx: -gy, gy: gx };
  return { gx: gx, gy: gy };
}

export function rotateCells(cells, facing) {
  return cells.map(function (cell) {
    var p = rotateCell(cell[0], cell[1], facing);
    return [p.gx, p.gy];
  });
}

export function normalizeCells(cells) {
  var minX = Infinity,
    minY = Infinity,
    i;
  for (i = 0; i < cells.length; i++) {
    minX = Math.min(minX, cells[i][0]);
    minY = Math.min(minY, cells[i][1]);
  }
  return cells.map(function (cell) {
    return [cell[0] - minX, cell[1] - minY];
  });
}

export function cellsConnected(cells) {
  if (!cells || !cells.length) return false;
  var set = {},
    i,
    queue,
    seen,
    cur,
    d,
    nx,
    ny,
    key;
  for (i = 0; i < cells.length; i++) set[cellKey(cells[i][0], cells[i][1])] = true;
  queue = [cells[0]];
  seen = {};
  seen[cellKey(cells[0][0], cells[0][1])] = true;
  while (queue.length) {
    cur = queue.pop();
    for (i = 0; i < DIRS.length; i++) {
      d = DIRS[i];
      nx = cur[0] + d.gx;
      ny = cur[1] + d.gy;
      key = cellKey(nx, ny);
      if (set[key] && !seen[key]) {
        seen[key] = true;
        queue.push([nx, ny]);
      }
    }
  }
  return Object.keys(seen).length === cells.length;
}

function extentOf(cells) {
  var minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity,
    i;
  for (i = 0; i < cells.length; i++) {
    minX = Math.min(minX, cells[i][0]);
    maxX = Math.max(maxX, cells[i][0]);
    minY = Math.min(minY, cells[i][1]);
    maxY = Math.max(maxY, cells[i][1]);
  }
  return {
    minX: minX,
    maxX: maxX,
    minY: minY,
    maxY: maxY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

function compactEnough(cells, maxSpan) {
  var box = extentOf(cells);
  return box.w <= maxSpan && box.h <= maxSpan;
}

export function growCluster(random, minCount, maxCount, maxSpan) {
  random = random || Math.random;
  minCount = minCount == null ? 4 : minCount;
  maxCount = maxCount == null ? 7 : maxCount;
  maxSpan = maxSpan == null ? 4 : maxSpan;
  var n = minCount + Math.floor(random() * (maxCount - minCount + 1));
  var cells = [[0, 0]];
  var set = { "0,0": true };
  var guard = 0;
  while (cells.length < n && guard < 80) {
    var from = cells[Math.floor(random() * cells.length)];
    var d = DIRS[Math.floor(random() * DIRS.length)];
    var nx = from[0] + d.gx;
    var ny = from[1] + d.gy;
    var key = cellKey(nx, ny);
    guard++;
    if (set[key]) continue;
    var next = cells.concat([[nx, ny]]);
    if (!compactEnough(next, maxSpan)) continue;
    set[key] = true;
    cells.push([nx, ny]);
  }
  return normalizeCells(cells);
}

export function shapeCells(shape, extra) {
  var kit = SET_PIECE_CELLS[shape] || SHAPE_CELLS[shape];
  if (!kit) kit = SHAPE_CELLS.rect;
  var cells = kit.map(function (c) {
    return [c[0], c[1]];
  });
  if (extra && extra.length) {
    extra.forEach(function (c) {
      cells.push([c[0], c[1]]);
    });
  }
  return normalizeCells(cells);
}

function tryAddBud(cells, random, maxSpan) {
  var set = {};
  cells.forEach(function (c) {
    set[cellKey(c[0], c[1])] = true;
  });
  var tries = 0;
  while (tries < 16) {
    var from = cells[Math.floor(random() * cells.length)];
    var d = DIRS[Math.floor(random() * DIRS.length)];
    var nx = from[0] + d.gx;
    var ny = from[1] + d.gy;
    var key = cellKey(nx, ny);
    tries++;
    if (set[key]) continue;
    var next = cells.concat([[nx, ny]]);
    if (!compactEnough(next, maxSpan || 5)) continue;
    return normalizeCells(next);
  }
  return cells;
}

export function randomShapeCells(random, spec) {
  spec = spec || {};
  random = random || Math.random;
  var shape = spec.shape;
  var cycle = COVER_SHAPES;
  if (!shape) shape = cycle[Math.floor(random() * cycle.length)];
  if (shape === "cluster") return growCluster(random, 4, 7, 4);
  var cells = shapeCells(shape);
  if (!spec.kit && random() < 0.28) cells = tryAddBud(cells, random, 5);
  return normalizeCells(cells);
}

export function inferShapeName(cells) {
  var box = extentOf(cells);
  var n = cells.length;
  if (n === 1) return "square";
  if (box.w === box.h && n === box.w * box.h) return "square";
  if ((box.h === 1 || box.w === 1) && n === Math.max(box.w, box.h))
    return n <= 3 ? "line" : "rect";
  if (n >= 4 && n <= 8) {
    var keys = {};
    cells.forEach(function (c) {
      keys[cellKey(c[0], c[1])] = true;
    });
    function has(x, y) {
      return !!keys[cellKey(x, y)];
    }
    if (box.w === 3 && box.h === 3 && n === 5 && has(1, 0) && has(1, 1) && has(1, 2))
      return "T";
    if (box.w === 3 && box.h === 3 && n === 7 && has(0, 0) && has(2, 0) && !has(1, 1))
      return "U";
    if (n === 4 && (box.w === 2 || box.h === 2)) return "L";
  }
  if (n >= 4 && (box.h === 1 || box.w === 1)) return "rect";
  return n <= 3 ? "line" : "cluster";
}

export function livingBlocks(cover) {
  if (!cover || !cover.blocks) return [];
  return cover.blocks.filter(function (b) {
    return b && !b.destroyed;
  });
}

export function blockMap(blocks) {
  var map = {};
  (blocks || []).forEach(function (b) {
    if (!b || b.destroyed) return;
    map[cellKey(b.gx, b.gy)] = b;
  });
  return map;
}

export function neighborMask(block, blocks, sameThemeOnly) {
  var map = Array.isArray(blocks) ? blockMap(blocks) : blocks;
  var mask = 0,
    i,
    d,
    other;
  for (i = 0; i < DIRS.length; i++) {
    d = DIRS[i];
    other = map[cellKey(block.gx + d.gx, block.gy + d.gy)];
    if (!other || other.destroyed) continue;
    if (sameThemeOnly && other.theme && block.theme && other.theme !== block.theme)
      continue;
    mask |= d.bit;
  }
  return mask;
}

export function hasNeighbor(mask, bit) {
  return (mask & bit) !== 0;
}

export function blocksToSegments(blocks, size) {
  size = size || COVER_BLOCK_SIZE;
  return livingBlocks({ blocks: blocks }).map(function (b) {
    return {
      dx: b.dx,
      dy: b.dy,
      w: size,
      h: size,
      gx: b.gx,
      gy: b.gy,
      theme: b.theme,
    };
  });
}

export function boundsFromBlocks(blocks, size) {
  size = size || COVER_BLOCK_SIZE;
  var live = livingBlocks({ blocks: blocks });
  if (!live.length) return { w: size, h: size };
  var minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  live.forEach(function (b) {
    minX = Math.min(minX, (b.dx || 0) - size / 2);
    maxX = Math.max(maxX, (b.dx || 0) + size / 2);
    minY = Math.min(minY, (b.dy || 0) - size / 2);
    maxY = Math.max(maxY, (b.dy || 0) + size / 2);
  });
  return {
    w: Math.max(size, Math.round(maxX - minX)),
    h: Math.max(size, Math.round(maxY - minY)),
  };
}

export function cellsToBlocks(cells, theme, size) {
  size = size || COVER_BLOCK_SIZE;
  cells = normalizeCells(cells);
  var box = extentOf(cells);
  var cx = (box.minX + box.maxX) / 2;
  var cy = (box.minY + box.maxY) / 2;
  return cells.map(function (cell) {
    return {
      gx: cell[0],
      gy: cell[1],
      theme: theme,
      dx: (cell[0] - cx) * size,
      dy: (cell[1] - cy) * size,
      w: size,
      h: size,
      hp: null,
      maxHp: null,
      destroyed: false,
    };
  });
}

export function exposedBlocksOnSide(blocks, side) {
  var live = livingBlocks({ blocks: blocks });
  var map = blockMap(live);
  var bit = side === "top" ? N : side === "right" ? E : side === "bottom" ? S : W;
  var list = [];
  live.forEach(function (b) {
    if ((neighborMask(b, map, false) & bit) === 0) list.push(b);
  });
  list.sort(function (a, b) {
    if (side === "top" || side === "bottom") return a.gx - b.gx || a.gy - b.gy;
    return a.gy - b.gy || a.gx - b.gx;
  });
  return list;
}

export function slotCountFromBlocks(blocks) {
  var live = livingBlocks({ blocks: blocks });
  if (!live.length) return 1;
  var best = 1;
  ["top", "right", "bottom", "left"].forEach(function (side) {
    best = Math.max(best, exposedBlocksOnSide(live, side).length);
  });
  return Math.max(1, Math.min(4, best));
}

export function pointOnBlockEdge(cover, block, side) {
  var size = (cover && cover.blockSize) || COVER_BLOCK_SIZE;
  var standoff = cover && cover.type === "low" ? 16 : 18;
  var x = cover.x + block.dx;
  var y = cover.y + block.dy;
  if (side === "top") y -= size / 2 + standoff;
  else if (side === "bottom") y += size / 2 + standoff;
  else if (side === "left") x -= size / 2 + standoff;
  else x += size / 2 + standoff;
  return {
    x: x,
    y: y,
    side: side,
    segment: {
      x: cover.x + block.dx,
      y: cover.y + block.dy,
      w: size,
      h: size,
    },
    block: block,
  };
}

export function describeOuterSlots(cover, side, count) {
  var live = livingBlocks(cover);
  if (!live.length) return [];
  var facing = exposedBlocksOnSide(live, side);
  var extras = [];
  ["top", "right", "bottom", "left"].forEach(function (s) {
    if (s === side) return;
    extras = extras.concat(exposedBlocksOnSide(live, s));
  });
  var pool = facing.concat(extras);
  var used = {};
  var picked = [];
  var i,
    key,
    block,
    slotSide;
  count = Math.max(1, count || slotCountFromBlocks(live));
  for (i = 0; i < pool.length && picked.length < count; i++) {
    block = pool[i];
    key = cellKey(block.gx, block.gy);
    if (used[key]) continue;
    used[key] = true;
    slotSide = i < facing.length ? side : edgeSideForBlock(block, live, side);
    picked.push(pointOnBlockEdge(cover, block, slotSide));
  }
  if (!picked.length) picked.push(pointOnBlockEdge(cover, live[0], side));
  return picked;
}

function edgeSideForBlock(block, blocks, preferred) {
  var map = blockMap(blocks);
  var mask = neighborMask(block, map, false);
  if ((mask & (preferred === "top" ? N : preferred === "right" ? E : preferred === "bottom" ? S : W)) === 0)
    return preferred;
  if ((mask & S) === 0) return "bottom";
  if ((mask & N) === 0) return "top";
  if ((mask & E) === 0) return "right";
  if ((mask & W) === 0) return "left";
  return preferred;
}

export function syncCoverGeometry(cover) {
  if (!cover || !cover.blocks) return cover;
  var size = cover.blockSize || COVER_BLOCK_SIZE;
  var live = livingBlocks(cover);
  cover.segments = blocksToSegments(live, size);
  var box = boundsFromBlocks(live, size);
  cover.w = box.w;
  cover.h = box.h;
  cover.slotCount = slotCountFromBlocks(live);
  if (!live.length) {
    cover.destroyed = true;
    cover.hp = 0;
  }
  return cover;
}

export function findBlockAtPiece(cover, piece) {
  if (!cover || !piece) return null;
  var live = livingBlocks(cover);
  var best = null,
    bestD = Infinity,
    i,
    b,
    d;
  for (i = 0; i < live.length; i++) {
    b = live[i];
    d = Math.hypot(cover.x + b.dx - piece.x, cover.y + b.dy - piece.y);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return bestD < ((cover.blockSize || COVER_BLOCK_SIZE) * 0.75) ? best : null;
}

export function makeBlockCover(spec) {
  spec = spec || {};
  var size = spec.blockSize || COVER_BLOCK_SIZE;
  var theme = spec.theme || "jersey";
  var facing = spec.facing || 0;
  var random = spec.random || Math.random;
  var cells;
  if (spec.cells && spec.cells.length) cells = spec.cells;
  else if (spec.kit && SET_PIECE_CELLS[spec.kit]) cells = shapeCells(spec.kit);
  else if (spec.randomize || spec.shape === "cluster" || spec.shape === "line")
    cells = randomShapeCells(random, spec);
  else if (spec.shape) cells = shapeCells(spec.kit || spec.shape);
  else cells = randomShapeCells(random, spec);
  cells = normalizeCells(rotateCells(cells, facing));
  if (!cellsConnected(cells)) cells = shapeCells(spec.shape || "rect");
  var blocks = cellsToBlocks(cells, theme, size);
  var inferred = spec.shape && spec.shape !== "cluster" ? spec.shape : inferShapeName(cells);
  var cover = {
    id: spec.id,
    x: spec.x || 0,
    y: spec.y || 0,
    shape: inferred,
    theme: theme,
    facing: facing,
    asset: theme + "_" + inferred,
    coverType: spec.coverType || coverTypeForTheme(theme),
    type: spec.coverType || coverTypeForTheme(theme),
    scale: spec.scale || 0.26,
    blockSize: size,
    blocks: blocks,
    setPiece: spec.kit || null,
    sprite: spec.sprite || (spec.kit ? "set_" + spec.kit : null),
    grid: true,
  };
  syncCoverGeometry(cover);
  return cover;
}

export function cloneBlockCover(cover, id, x, y) {
  var copy = Object.assign({}, cover, {
    id: id == null ? cover.id : id,
    x: x == null ? cover.x : Math.round(x),
    y: y == null ? cover.y : Math.round(y),
    blocks: (cover.blocks || []).map(function (b) {
      return Object.assign({}, b);
    }),
    segments: (cover.segments || []).map(function (s) {
      return Object.assign({}, s);
    }),
  });
  return copy;
}

export function allBlocksUniform(covers, size) {
  size = size || COVER_BLOCK_SIZE;
  return (covers || []).every(function (c) {
    if (!c || c.destroyed) return true;
    var live = livingBlocks(c);
    if (!live.length) return false;
    return live.every(function (b) {
      return b.w === size && b.h === size && (c.blockSize || size) === size;
    });
  });
}
