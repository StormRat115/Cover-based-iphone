import { isLineBlocked } from "./cover.js?v=20260905-59";
import { recoverInCover, shouldRecover } from "./recoveryAI.js?v=20260905-59";

var burstUntil = 0,
  burstPauseUntil = 0,
  lastTick = performance.now();
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function nearestTarget(player, enemies) {
  var best = null,
    bd = Infinity;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (!e || e.dead) continue;
    var d = distance(player, e);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}
function tick() {
  var now = performance.now(),
    dt = Math.min(0.12, (now - lastTick) / 1000);
  lastTick = now;
  if (!window.__autoPlay) return;
  var p = window.__battlePlayer,
    enemies = window.__battleEnemies || [],
    covers = window.__battleCovers || [],
    allies = window.__battleAllies || [];
  if (!p || p.dead || p.downed) return;
  var e =
    p.aimTarget && !p.aimTarget.dead ? p.aimTarget : nearestTarget(p, enemies);
  if (shouldRecover(p)) {
    burstUntil = 0;
    burstPauseUntil = 0;
    if (e) p.aimTarget = e;
    recoverInCover(p, e, covers, allies, dt);
    return;
  }
  if (p.reloading) return;
  if (!e) return;
  p.aimTarget = e;
  var d = distance(p, e);
  if (d > p.weapon.range) return;
  if (isLineBlocked(p, e, covers) && !e.exposed) return;
  if (p.weapon.ammo <= 0) {
    p.startReload();
    return;
  }
  if (now < burstPauseUntil) return;
  if (now >= burstUntil) {
    burstUntil = now + 1500 + Math.random() * 1300;
    burstPauseUntil = 0;
  }
  if (now <= burstUntil && p.weapon.fireCooldown <= 0) {
    var before = p.weapon.ammo,
      hit = p.fireAt(e);
    if (p.weapon.ammo < before && window.__spawnAutoTracer)
      window.__spawnAutoTracer(p, e, !!hit);
    if (p.weapon.ammo <= 0) p.startReload();
  }
  if (now > burstUntil) {
    burstPauseUntil = now + 120 + Math.random() * 180;
    burstUntil = 0;
  }
}
setInterval(tick, 45);
