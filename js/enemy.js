import { findCoverForPoint, isLineBlocked } from './cover.js';

export function createBandits(wave = 1) {
  if (wave === 1) {
    return [
      makeBandit(-220, -95, 60, 1.0),
      makeBandit(235, -15, 60, 1.6),
      makeBandit(-190, 185, 60, 2.1),
    ];
  }
  // wave 2 - slightly tougher / different spawn
  return [
    makeBandit(-280, -40, 70, 0.8),
    makeBandit(260, -90, 70, 1.2),
    makeBandit(40, -200, 70, 1.5),
    makeBandit(-120, 210, 70, 1.9),
  ];
}

function makeBandit(x, y, hp, fireDelay) {
  return {
    x,
    y,
    tx: x,
    ty: y,
    hp,
    maxHp: hp,
    fire: fireDelay,
    t: Math.random() * 6,
    dead: false,
    cover: null,
    speed: 70 + Math.random() * 30,
    state: 'idle',
    think: Math.random() * 0.5,
  };
}

function nearestAlly(allies, e) {
  let best = null;
  let bestD = Infinity;
  for (const a of allies) {
    if (!a || a.dead || a.hp <= 0) continue;
    const d = Math.hypot(a.x - e.x, a.y - e.y);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

function pickCover(covers, e, player) {
  let best = null;
  let bestScore = Infinity;
  for (const c of covers) {
    const toCover = Math.hypot(c.x - e.x, c.y - e.y);
    const toPlayer = Math.hypot(c.x - player.x, c.y - player.y);
    const score = toCover * 0.6 + toPlayer * 0.4;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

export function updateBandits(enemies, dt, player, covers, allies = []) {
  const targets = [player, ...allies].filter((a) => a && !a.dead && a.hp > 0);

  for (const e of enemies) {
    if (e.dead) continue;
    e.t += dt;
    e.fire -= dt;
    e.think -= dt;

    if (e.think <= 0) {
      e.think = 0.6 + Math.random() * 0.7;
      if (!e.cover) {
        const c = pickCover(covers, e, player);
        if (c) {
          const ang = Math.atan2(player.y - c.y, player.x - c.x);
          e.tx = c.x - Math.cos(ang) * 22;
          e.ty = c.y - Math.sin(ang) * 22;
          e.state = 'seek';
        }
      }
    }

    const dx = e.tx - e.x;
    const dy = e.ty - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 6) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
      e.cover = null;
    } else {
      const c = findCoverForPoint(e.x, e.y, covers);
      if (c) e.cover = c;
      e.x += Math.cos(e.t * 0.55) * dt * 3;
      e.y += Math.sin(e.t * 0.7) * dt * 2.5;
      e.state = 'hold';
    }

    if (e.fire <= 0) {
      e.fire = 1.35 + Math.random() * 1.1;
      const tgt = nearestAlly(targets, e);
      if (!tgt) continue;
      const d = Math.hypot(tgt.x - e.x, tgt.y - e.y);
      if (d > 460) continue;
      const blocked = isLineBlocked(e, tgt, covers);
      if (blocked && !e.cover && tgt.cover) continue;
      let dmg = e.cover ? 7 : 10;
      if (tgt.cover) dmg = Math.max(2, Math.floor(dmg * 0.35));
      tgt.hp -= dmg;
      if (tgt.hp <= 0) {
        tgt.hp = 0;
        if ('dead' in tgt) tgt.dead = true;
      }
      e.state = 'shoot';
    }
  }
}

export function drawBandit(ctx, e, iso, selected) {
  const [x, y] = iso(e.x, e.y);
  if (selected) {
    ctx.strokeStyle = '#f5d547';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 32, 21, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#111';
  ctx.fillRect(x - 22, y - 67, 44, 5);
  ctx.fillStyle = '#d84b4b';
  ctx.fillRect(x - 22, y - 67, 44 * Math.max(0, e.hp / e.maxHp), 5);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0008';
  ctx.beginPath();
  ctx.ellipse(0, 3, 25, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  if (e.cover) {
    ctx.strokeStyle = '#c97850';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -8, 28, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#47352c';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-7, -2);
  ctx.lineTo(-10, 20);
  ctx.moveTo(7, -2);
  ctx.lineTo(10, 20);
  ctx.stroke();
  ctx.fillStyle = '#76503b';
  ctx.fillRect(-13, -38, 26, 36);
  ctx.fillStyle = '#b77e59';
  ctx.beginPath();
  ctx.arc(0, -48, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3e3029';
  ctx.fillRect(-11, -55, 22, 8);
  ctx.strokeStyle = '#b77e59';
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
  ctx.lineTo(24, -16);
  ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.fillRect(21, -18, 8, 4);
  if (e.state === 'shoot') {
    ctx.fillStyle = '#ffb34a';
    ctx.beginPath();
    ctx.moveTo(28, -16);
    ctx.lineTo(40, -12);
    ctx.lineTo(28, -8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
