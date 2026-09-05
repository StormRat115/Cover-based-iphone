export function worldToScreen(x, y, world, width, height) {
  return [
    width / 2 + (x - world.cameraX - y + world.cameraY) * world.scaleX,
    height / 2 +
      (x - world.cameraX + y - world.cameraY) * world.scaleY +
      world.offsetY,
  ];
}

export function screenToWorld(sx, sy, world, width, height) {
  const horizontal = (sx - width / 2) / world.scaleX;
  const vertical = (sy - height / 2 - world.offsetY) / world.scaleY;
  return {
    x: world.cameraX + (horizontal + vertical) / 2,
    y: world.cameraY + (vertical - horizontal) / 2,
  };
}

export function nearestLivingEnemy(actor, enemies) {
  let best = null;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const dx = actor.x - enemy.x,
      dy = actor.y - enemy.y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      best = enemy;
      bestDistance = distance;
    }
  }
  return best;
}

// Solve the original 35 interior samples analytically. This preserves existing
// cover/hit-chance behavior without testing every point against every rectangle.
export function sampledLineIntersectsRect(a, b, rect) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const left = rect.x - rect.w / 2,
    right = rect.x + rect.w / 2;
  const top = rect.y - rect.h / 2,
    bottom = rect.y + rect.h / 2;
  let enter = 0,
    exit = 1;
  if (dx === 0) {
    if (a.x <= left || a.x >= right) return false;
  } else {
    const t1 = (left - a.x) / dx,
      t2 = (right - a.x) / dx;
    enter = t1 < t2 ? t1 : t2;
    exit = t1 > t2 ? t1 : t2;
  }
  if (dy === 0) {
    if (a.y <= top || a.y >= bottom) return false;
  } else {
    const t1 = (top - a.y) / dy,
      t2 = (bottom - a.y) / dy;
    const start = t1 < t2 ? t1 : t2;
    const end = t1 > t2 ? t1 : t2;
    if (start > enter) enter = start;
    if (end < exit) exit = end;
  }
  if (enter >= exit || enter >= 35 / 36 || exit <= 1 / 36) return false;
  // The bounded positive interval permits truncation without a Math call.
  const firstSample = enter < 1 / 36 ? 1 : ((enter * 36) | 0) + 1;
  return firstSample < exit * 36;
}
