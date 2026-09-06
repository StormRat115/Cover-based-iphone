import { findCoverForPoint, isLineBlocked } from './cover.js';

export function createDylan() {
  return {
    name: 'Dylan',
    x: 40,
    y: 160,
    tx: 40,
    ty: 160,
    hp: 90,
    maxHp: 90,
    speed: 155,
    state: 'idle',
    anim: 0,
    cover: null,
    reloading: false,
    reloadTimer: 0,
    weapon: { magazine: 24, ammo: 24, range: 520, fireCooldown: 0 },
    think: 0.4,
    dead: false,
  };
}

function nearestLiving(list, from) {
  let best = null;
  let bestD = Infinity;
  for (const e of list) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - from.x, e.y - from.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function nearestFreeCover(covers, pos, reserved) {
  let best = null;
  let bestD = Infinity;
  for (const c of covers) {
    if (reserved.has(c.id)) continue;
    const d = Math.hypot(c.x - pos.x, c.y - pos.y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export function updateDylan(dylan, dt, enemies, covers, player) {
  if (dylan.dead) return;
  dylan.anim += dt;
  dylan.weapon.fireCooldown = Math.max(0, dylan.weapon.fireCooldown - dt);
  if (dylan.reloading) {
    dylan.reloadTimer -= dt;
    if (dylan.reloadTimer <= 0) {
      dylan.reloading = false;
      dylan.weapon.ammo = dylan.weapon.magazine;
      dylan.state = 'idle';
    }
    return;
  }

  dylan.think -= dt;
  const reserved = new Set();
  if (player.cover) reserved.add(player.cover.id);

  if (dylan.think <= 0) {
    dylan.think = 0.35 + Math.random() * 0.35;
    if (!dylan.cover) {
      const c = nearestFreeCover(covers, dylan, reserved);
      if (c) {
        dylan.tx = c.x;
        dylan.ty = c.y + 18;
        dylan.cover = null;
        dylan.state = 'walk';
      }
    }
    const foe = nearestLiving(enemies, dylan);
    if (foe && dylan.weapon.ammo <= 0) {
      dylan.reloading = true;
      dylan.reloadTimer = 1.4;
      dylan.state = 'reload';
      return;
    }
    if (foe && dylan.weapon.fireCooldown <= 0 && dylan.weapon.ammo > 0) {
      const d = Math.hypot(foe.x - dylan.x, foe.y - dylan.y);
      if (d < dylan.weapon.range) {
        const blocked = isLineBlocked(dylan, foe, covers);
        if (!blocked || dylan.cover) {
          dylan.weapon.ammo--;
          dylan.weapon.fireCooldown = 0.22;
          dylan.state = 'shoot';
          const dmg = dylan.cover ? 18 : 14;
          foe.hp -= dmg;
          if (foe.hp <= 0) {
            foe.hp = 0;
            foe.dead = true;
          }
        }
      }
    }
  }

  const dx = dylan.tx - dylan.x;
  const dy = dylan.ty - dylan.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 5) {
    dylan.x += (dx / dist) * dylan.speed * dt;
    dylan.y += (dy / dist) * dylan.speed * dt;
    dylan.state = 'walk';
    dylan.cover = null;
  } else {
    const c = findCoverForPoint(dylan.x, dylan.y, covers);
    if (c && !reserved.has(c.id)) dylan.cover = c;
    if (dylan.state === 'walk') dylan.state = 'idle';
  }
}

export function drawDylan(ctx, d, iso) {
  if (d.dead) return;
  const [sx, sy] = iso(d.x, d.y);
  ctx.save();
  ctx.translate(sx, sy - Math.sin(d.anim * 9) * 1.5);
  ctx.fillStyle = '#0008';
  ctx.beginPath();
  ctx.ellipse(0, 3, 26, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  if (d.cover) {
    ctx.strokeStyle = '#6ecf8e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -8, 28, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  // body - teal ally kit
  ctx.strokeStyle = '#1c3a42';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-7, -2);
  ctx.lineTo(-10, 20);
  ctx.moveTo(7, -2);
  ctx.lineTo(10, 20);
  ctx.stroke();
  ctx.fillStyle = '#2f6f78';
  ctx.fillRect(-14, -38, 28, 36);
  ctx.fillStyle = '#4aa3ae';
  ctx.fillRect(-10, -34, 20, 17);
  ctx.fillStyle = '#d7b39a';
  ctx.beginPath();
  ctx.arc(0, -48, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a2e34';
  ctx.fillRect(-12, -55, 24, 8);
  ctx.strokeStyle = '#d7b39a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-9, -31);
  ctx.lineTo(-18, -19);
  ctx.moveTo(9, -31);
  ctx.lineTo(15, -20);
  ctx.stroke();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(7, -22);
  ctx.lineTo(27, -16);
  ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.fillRect(24, -18, 9, 4);
  if (d.state === 'shoot') {
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(33, -16);
    ctx.lineTo(46, -12);
    ctx.lineTo(33, -8);
    ctx.closePath();
    ctx.fill();
  }
  // nameplate
  ctx.fillStyle = '#6ecf8ecc';
  ctx.font = 'bold 11px system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DYLAN', 0, -68);
  // hp bar
  ctx.fillStyle = '#111';
  ctx.fillRect(-22, -62, 44, 4);
  ctx.fillStyle = '#3dce7a';
  ctx.fillRect(-22, -62, 44 * Math.max(0, d.hp / d.maxHp), 4);
  ctx.restore();
}

export function resetDylan(d) {
  Object.assign(d, {
    x: 40,
    y: 160,
    tx: 40,
    ty: 160,
    hp: 90,
    state: 'idle',
    anim: 0,
    cover: null,
    reloading: false,
    reloadTimer: 0,
    think: 0.4,
    dead: false,
  });
  d.weapon.ammo = d.weapon.magazine;
  d.weapon.fireCooldown = 0;
}
