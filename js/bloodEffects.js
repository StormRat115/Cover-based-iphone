const MAX_STAINS = 240;
var stains = [],
  seen = new WeakSet(),
  particles = [];
function spray(actor) {
  if (!actor || seen.has(actor)) return;
  seen.add(actor);
  var count = 7 + Math.floor(Math.random() * 6);
  for (var i = 0; i < count; i++) {
    var ang = Math.random() * Math.PI * 2,
      dist = 12 + Math.random() * 65;
    particles.push({
      x: actor.x,
      y: actor.y,
      z: 12 + Math.random() * 28,
      vx: Math.cos(ang) * (70 + Math.random() * 150),
      vy: Math.sin(ang) * (70 + Math.random() * 150),
      vz: 90 + Math.random() * 130,
      t: 0,
      life: 0.35 + Math.random() * 0.35,
      landX: actor.x + Math.cos(ang) * dist,
      landY: actor.y + Math.sin(ang) * dist,
      size: 3 + Math.random() * 7,
    });
  }
}
function watch() {
  const inspect = (unit) => {
    if (unit && (unit.dead || unit.downed || unit.hp <= 0)) spray(unit);
  };
  inspect(window.__battlePlayer);
  for (const unit of window.__battleAllies || []) inspect(unit);
  for (const unit of window.__battleEnemies || []) inspect(unit);
}
export function updateBlood(dt) {
  watch();
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vz -= 420 * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    if (p.z <= 0 || p.t >= p.life) {
      stains.push({
        x: p.landX + (Math.random() - 0.5) * 20,
        y: p.landY + (Math.random() - 0.5) * 20,
        size: p.size,
        rot: Math.random() * Math.PI,
      });
      if (stains.length > MAX_STAINS)
        stains.splice(0, stains.length - MAX_STAINS);
      particles.splice(i, 1);
    }
  }
}
export function drawStain(ctx, iso, s) {
  var q = iso(s.x, s.y);
  ctx.save();
  ctx.translate(q[0], q[1]);
  ctx.rotate(s.rot);
  ctx.globalAlpha = 0.58;
  ctx.fillStyle = "#641812";
  ctx.beginPath();
  ctx.ellipse(0, 0, s.size * 1.35, s.size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
export function drawParticle(ctx, iso, p) {
  var q = iso(p.x, p.y);
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "#a52a20";
  ctx.beginPath();
  ctx.arc(
    q[0],
    q[1] - Math.max(0, p.z),
    Math.max(1.5, p.size * 0.45),
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}
export function getBloodStains() {
  return stains;
}
export function getBloodParticles() {
  return particles;
}
export function drawBlood(ctx, iso) {
  stains.forEach(function (s) {
    drawStain(ctx, iso, s);
  });
  particles.forEach(function (p) {
    drawParticle(ctx, iso, p);
  });
}
export function resetBlood() {
  stains.length = 0;
  particles.length = 0;
  seen = new WeakSet();
}
