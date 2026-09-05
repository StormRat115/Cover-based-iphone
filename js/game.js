import { createGameLoop } from "./gameLoop.js?v=20260905-61";
import {
  worldToScreen,
  screenToWorld as unproject,
  nearestLivingEnemy,
} from "./geometry.js?v=20260905-61";
import { recoverInCover, shouldRecover } from "./recoveryAI.js?v=20260905-61";
import {
  updateBlood,
  drawBlood,
  resetBlood,
} from "./bloodEffects.js?v=20260905-61";
import { updateSquadHud } from "./squadHud.js?v=20260905-61";
import { updateCombatHud } from "./combatHud.js?v=20260905-61";
import { updatePlayerHud } from "./player.js?v=20260905-61";
import { resetSquadCommands } from "./allyCore2.js?v=20260905-61";
import "./squadDrawer.js?v=20260905-61";
import { createPlayer, drawPlayer } from "./player.js?v=20260905-61";
import {
  createBandits,
  updateBandits,
  drawBandit,
} from "./enemy.js?v=20260905-61";
import { createAllies, updateAllies, drawAlly } from "./ally.js?v=20260905-61";
import {
  createCover,
  findCoverForPoint,
  getCoverSlot,
  drawCover,
  isLineBlocked,
} from "./cover.js?v=20260905-61";
import {
  initKeyboard,
  getKeyboardMove,
  isKeyboardFireHeld,
  clearKeyboard,
} from "./input.js?v=20260905-61";
import { initTactical } from "./tactical.js?v=20260905-61";
var canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d"),
  status = document.querySelector("#status"),
  hint = document.querySelector("#hint"),
  fireButton = document.querySelector("#fire"),
  reloadButton = document.querySelector("#reload"),
  autoPlayButton = document.querySelector("#autoPlay"),
  pauseButton = document.querySelector("#pause"),
  pauseMenu = document.querySelector("#pauseMenu"),
  resumeButton = document.querySelector("#resumeButton"),
  pauseRestart = document.querySelector("#pauseRestart"),
  message = document.querySelector("#message"),
  messageTitle = document.querySelector("#messageTitle"),
  messageText = document.querySelector("#messageText"),
  messageButton = document.querySelector("#messageButton");
var W = 0,
  H = 0,
  dpr = 1,
  started = false,
  hudDirty = true,
  lastHudUpdate = -Infinity,
  layers = [],
  gameOver = false,
  paused = false,
  target = null,
  kills = 0,
  hitMarker = 0,
  damagePops = [],
  fireHeld = false,
  playerHitFlash = 0,
  autoPlay = false,
  autoMoveTimer = 0,
  wave = 1,
  waveState = "active",
  waveTimer = 0;
var world = {
  scaleX: 0.25,
  scaleY: 0.125,
  offsetY: -40,
  cameraX: 0,
  cameraY: 0,
  minX: -2300,
  maxX: 2300,
  minY: -1900,
  maxY: 1900,
};
var player = createPlayer(),
  covers = createCover(),
  enemies = createBandits(wave),
  allies = createAllies(),
  projectiles = [];
initTactical();
window.__battlePlayer = player;
window.__battleEnemies = enemies;
window.__battleAllies = allies;
window.__battleCovers = covers;
window.__waveDefense = true;
window.__wave = wave;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (runtime) runtime.invalidate();
}
window.addEventListener("resize", resize);
resize();
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function updateCamera() {
  world.cameraX +=
    (clamp(player.x, world.minX + 430, world.maxX - 430) - world.cameraX) *
    0.09;
  world.cameraY +=
    (clamp(player.y, world.minY + 330, world.maxY - 330) - world.cameraY) *
    0.09;
}
export function iso(x, y) {
  return worldToScreen(x, y, world, W, H);
}
function nearestEnemy() {
  return nearestLivingEnemy(player, enemies);
}
function screenToWorld(sx, sy) {
  const point = unproject(sx, sy, world, W, H);
  return {
    x: clamp(point.x, world.minX, world.maxX),
    y: clamp(point.y, world.minY, world.maxY),
  };
}
function setTarget(e) {
  target = e;
  player.aimTarget = e;
}
function spawnProjectile(from, to, owner, damage) {
  var dx = to.x - from.x,
    dy = to.y - from.y,
    d = Math.hypot(dx, dy) || 1,
    tx = to.x,
    ty = to.y,
    hitDamage = damage || 0,
    targetRef = to;
  if (hitDamage <= 0) {
    var miss = 45 + Math.min(130, d * 0.11),
      px = -dy / d,
      py = dx / d,
      side = Math.random() < 0.5 ? -1 : 1;
    tx += px * miss * side + rand(-22, 22);
    ty += py * miss * side + rand(-22, 22);
    targetRef = null;
  }
  projectiles.push({
    x: from.x + (dx / d) * 22,
    y: from.y + (dy / d) * 22,
    px: from.x + (dx / d) * 22,
    py: from.y + (dy / d) * 22,
    tx: tx,
    ty: ty,
    life: 0,
    maxLife: Math.min(0.62, d / 5200 + 0.05),
    speed: 6500,
    owner: owner,
    damage: hitDamage,
    target: targetRef,
    coverGrace: from && from.exposed ? 0.12 : 0.05,
  });
}
function spawnEnemyProjectile(e, to, owner, damage) {
  spawnProjectile(e, to || player, owner || "enemy", damage);
}
function spawnAllyProjectile(a, e, owner, damage) {
  spawnProjectile(a, e, owner || "ally", damage);
}
function updateProjectiles(dt) {
  for (var i = projectiles.length - 1; i >= 0; i--) {
    var p = projectiles[i];
    p.life += dt;
    var dx = p.tx - p.x,
      dy = p.ty - p.y,
      d = Math.hypot(dx, dy) || 1,
      step = p.speed * dt,
      nx = d <= step ? p.tx : p.x + (dx / d) * step,
      ny = d <= step ? p.ty : p.y + (dy / d) * step;
    if (
      (p.owner === "enemy" || p.owner === "ally") &&
      p.life > p.coverGrace &&
      isLineBlocked({ x: p.x, y: p.y }, { x: nx, y: ny }, covers)
    ) {
      projectiles.splice(i, 1);
      continue;
    }
    p.px = p.x;
    p.py = p.y;
    p.x = nx;
    p.y = ny;
    if (d <= step || p.life >= p.maxLife) {
      if (p.owner === "enemy" && p.damage > 0) {
        if (!player.dead && !player.downed) player.takeDamage(p.damage);
      }
      // Player/ally damage is applied once, at fire time. Their projectiles are visual.
      projectiles.splice(i, 1);
    }
  }
}
function drawProjectiles() {
  projectiles.forEach(function (p) {
    var xy = iso(p.x, p.y),
      txy = iso(p.tx, p.ty),
      x = xy[0],
      y = xy[1],
      tx = txy[0],
      ty = txy[1],
      dx = tx - x,
      dy = ty - y,
      d = Math.hypot(dx, dy) || 1,
      isPlayerShot = p.owner === "player",
      tracer =
        p.owner === "enemy"
          ? "#ff8d62"
          : p.owner === "ally"
            ? "#71b9ff"
            : "#ffd400",
      tip =
        p.owner === "enemy"
          ? "#ffd0a8"
          : p.owner === "ally"
            ? "#c8e7ff"
            : "#fffbd1";
    ctx.save();
    ctx.globalAlpha = Math.max(
      isPlayerShot ? 0.88 : 0.62,
      1 - p.life / p.maxLife,
    );
    ctx.strokeStyle = tracer;
    ctx.lineWidth = isPlayerShot ? 4 : 2.2;
    ctx.lineCap = "round";
    ctx.shadowColor = tracer;
    ctx.shadowBlur = isPlayerShot ? 13 : 6;
    ctx.beginPath();
    ctx.moveTo(
      x - (dx / d) * (isPlayerShot ? 66 : 34),
      y - (dy / d) * (isPlayerShot ? 66 : 34),
    );
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.arc(x, y, isPlayerShot ? 3.2 : 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
function updateFeedback(dt) {
  hitMarker = Math.max(0, hitMarker - dt);
  playerHitFlash = Math.max(0, playerHitFlash - dt);
  for (var i = damagePops.length - 1; i >= 0; i--) {
    damagePops[i].t += dt;
    if (damagePops[i].t >= 0.7) damagePops.splice(i, 1);
  }
}
function drawFeedback() {
  if (hitMarker > 0) {
    var a = Math.min(1, hitMarker / 0.12),
      x = W / 2,
      y = H / 2 - 28;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x - 3, y - 3);
    ctx.moveTo(x + 10, y - 10);
    ctx.lineTo(x + 3, y - 3);
    ctx.moveTo(x - 10, y + 10);
    ctx.lineTo(x - 3, y + 3);
    ctx.moveTo(x + 10, y + 10);
    ctx.lineTo(x + 3, y + 3);
    ctx.stroke();
    ctx.restore();
  }
  damagePops.forEach(function (p) {
    var xy = iso(p.x, p.y),
      a = 1 - p.t / 0.7;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#fff";
    ctx.font = "900 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(p.value, xy[0], xy[1] - 30 - p.t * 20);
    ctx.restore();
  });
  if (playerHitFlash > 0 && !player.dead) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.35, (playerHitFlash / 0.22) * 0.35);
    ctx.fillStyle = "#e14b3f";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
function reload() {
  if (!started || paused || gameOver || document.hidden) return;
  if (
    !player.dead &&
    !player.downed &&
    !player.reloading &&
    player.weapon.ammo < player.weapon.magazine
  )
    player.startReload();
}
function canPlayerEngage(e) {
  if (!e || e.dead || distance(player, e) > player.weapon.range) return false;
  // A covered player fires by peeking around their current cover. Checking only
  // the actor's center makes that same cover look like an obstruction.
  return !isLineBlocked(player, e, covers) || e.exposed || !!player.cover;
}
function attemptFire() {
  if (
    !started ||
    gameOver ||
    paused ||
    document.hidden ||
    player.reloading ||
    player.dead ||
    player.downed ||
    player.weapon.fireCooldown > 0
  )
    return;
  var e = target && !target.dead ? target : nearestEnemy();
  if (!e) return;
  if (!canPlayerEngage(e)) return;
  if (player.weapon.ammo <= 0) {
    reload();
    return;
  }
  var before = player.weapon.ammo,
    hit = player.fireAt(e);
  if (player.weapon.ammo < before) {
    spawnProjectile(player, e, "player", hit ? 1 : 0);
    if (hit) {
      hitMarker = 0.12;
      damagePops.push({
        x: e.x,
        y: e.y,
        value: Math.round(
          e.lastDamageTaken || player.weapon.damage + (player.damageBonus || 0),
        ),
        t: 0,
      });
      if (e.dead) kills++;
    }
  }
}
function chooseAutoPosition(e) {
  var best = null,
    bestCover = null,
    bestScore = 1e9,
    desired = Math.min(player.weapon.range * 0.72, 760);
  covers.forEach(function (c) {
    var cd = distance(player, c),
      ed = distance(e, c);
    if (cd > 1250 || ed < 240 || ed > player.weapon.range * 0.95) return;
    var slot = getCoverSlot(c, player, e),
      protectedSpot = isLineBlocked({ x: slot.x, y: slot.y }, e, [c]),
      score =
        cd +
        Math.abs(ed - desired) * 0.55 +
        (protectedSpot ? -190 : 180) +
        (c.type === "wide" ? -45 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = slot;
      bestCover = c;
    }
  });
  if (best) {
    player.setDestination(
      clamp(best.x, world.minX, world.maxX),
      clamp(best.y, world.minY, world.maxY),
      bestCover,
    );
    return true;
  }
  return false;
}
function updateAutoPlayer(dt) {
  if (!autoPlay || gameOver || paused || player.dead || player.downed) return;
  var e = target && !target.dead ? target : nearestEnemy();
  if (shouldRecover(player)) {
    recoverInCover(player, e, covers, allies, dt);
    // Recovery moves directly; do not also pursue an old tap-to-move destination.
    player.tx = player.x;
    player.ty = player.y;
    return;
  }
  if (!e) return;
  if (target !== e) setTarget(e);
  var d = distance(player, e),
    blocked = isLineBlocked(player, e, covers),
    engage = Math.min(player.weapon.range * 0.86, 900);
  if (player.weapon.ammo <= 0) {
    reload();
    return;
  }
  autoMoveTimer -= dt;
  // Fire at the weapon's full range while advancing or peeking from cover.
  // Movement decisions use a shorter preferred engagement distance.
  if (canPlayerEngage(e)) attemptFire();
  if (d > engage) {
    if (autoMoveTimer <= 0) {
      autoMoveTimer = 0.45;
      if (!chooseAutoPosition(e)) {
        var dx = e.x - player.x,
          dy = e.y - player.y,
          len = Math.hypot(dx, dy) || 1,
          advance = Math.min(Math.max(100, d - engage * 0.78), 430);
        player.setDestination(
          clamp(player.x + (dx / len) * advance, world.minX, world.maxX),
          clamp(player.y + (dy / len) * advance, world.minY, world.maxY),
          null,
        );
      }
    }
    return;
  }
  if (blocked || d < 280) {
    if (autoMoveTimer <= 0) {
      autoMoveTimer = 0.35;
      chooseAutoPosition(e);
    }
    if (blocked && !player.cover) return;
  }
  if (canPlayerEngage(e)) attemptFire();
}
autoPlayButton.addEventListener("pointerdown", function (e) {
  e.preventDefault();
  if (!started || paused || gameOver) return;
  autoPlay = !autoPlay;
  hudDirty = true;
  window.__autoPlay = autoPlay;
  autoPlayButton.classList.toggle("active", autoPlay);
  autoPlayButton.textContent = autoPlay ? "AUTO PLAY: ON" : "AUTO PLAY";
  if (autoPlay) {
    fireHeld = false;
    fireButton.classList.remove("active");
    autoMoveTimer = 0;
    player.keyboardMove = null;
  } else player.keyboardMove = null;
});
fireButton.addEventListener("pointerdown", function (e) {
  e.preventDefault();
  if (!started || autoPlay || paused || gameOver) return;
  fireHeld = true;
  fireButton.classList.add("active");
  attemptFire();
});
window.addEventListener("pointerup", function () {
  fireHeld = false;
  fireButton.classList.remove("active");
});
window.addEventListener("pointercancel", function () {
  fireHeld = false;
  fireButton.classList.remove("active");
});
reloadButton.addEventListener("pointerdown", function (e) {
  e.preventDefault();
  reload();
});
function togglePause() {
  if (!started || gameOver) return;
  paused = !paused;
  hudDirty = true;
  clearKeyboard();
  runtime.resetClock();
  fireHeld = false;
  fireButton.classList.remove("active");
  pauseMenu.classList.toggle("hidden", !paused);
  pauseButton.textContent = paused ? "▶" : "Ⅱ";
}
pauseButton.addEventListener("pointerdown", function (e) {
  e.preventDefault();
  togglePause();
});
resumeButton.addEventListener("pointerdown", function (e) {
  e.preventDefault();
  if (paused) togglePause();
});
pauseRestart.addEventListener("pointerdown", function (e) {
  e.preventDefault();
  reset();
});
messageButton.addEventListener("pointerdown", reset);
canvas.addEventListener("pointerdown", function (e) {
  if (
    !started ||
    gameOver ||
    paused ||
    player.dead ||
    player.downed ||
    autoPlay
  )
    return;
  var r = canvas.getBoundingClientRect(),
    sx = e.clientX - r.left,
    sy = e.clientY - r.top;
  for (var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    if (enemy.dead) continue;
    var xy = iso(enemy.x, enemy.y);
    if (Math.hypot(sx - xy[0], sy - (xy[1] - 16)) < 26) {
      setTarget(enemy);
      return;
    }
  }
  var p = screenToWorld(sx, sy - 10),
    cover = findCoverForPoint(p.x, p.y, covers);
  if (cover) {
    var slot = getCoverSlot(
      cover,
      player,
      target && !target.dead ? target : null,
    );
    player.setDestination(slot.x, slot.y, cover);
  } else player.setDestination(p.x, p.y, null);
});
initKeyboard({
  onFire: function () {
    if (!autoPlay && !paused) attemptFire();
  },
  onReload: reload,
});
function beginNextWave() {
  wave++;
  window.__wave = wave;
  enemies = createBandits(wave);
  window.__battleEnemies = enemies;
  waveState = "active";
  waveTimer = 0;
  target = null;
  player.aimTarget = null;
  projectiles.length = 0;
  rebuildLayers();
}
function finishFailure() {
  gameOver = true;
  hudDirty = true;
  fireHeld = false;
  fireButton.classList.remove("active");
  messageTitle.textContent = "DEFENSE BROKEN";
  messageText.textContent = "The position was overrun on wave " + wave + ".";
  message.classList.remove("hidden");
}
function updateWaveDefense(dt) {
  if (waveState === "cleared") {
    waveTimer -= dt;
    if (waveTimer <= 0) beginNextWave();
    return;
  }
  if (
    enemies.length &&
    enemies.every(function (e) {
      return e.dead && e.deathTimer >= e.deathDuration;
    })
  ) {
    waveState = "cleared";
    waveTimer = 2.8;
    target = null;
    player.aimTarget = null;
  }
}
function reset() {
  player.reset();
  allies = createAllies();
  window.__battleAllies = allies;
  resetSquadCommands();
  resetBlood();
  clearKeyboard();
  hudDirty = true;
  runtime.resetClock();
  fireButton.classList.remove("active");
  wave = 1;
  window.__wave = wave;
  waveState = "active";
  waveTimer = 0;
  enemies = createBandits(wave);
  window.__battleEnemies = enemies;
  projectiles.length = 0;
  damagePops.length = 0;
  hitMarker = 0;
  playerHitFlash = 0;
  target = null;
  kills = 0;
  fireHeld = false;
  autoPlay = false;
  window.__autoPlay = false;
  autoMoveTimer = 0;
  paused = false;
  autoPlayButton.classList.remove("active");
  autoPlayButton.textContent = "AUTO PLAY";
  gameOver = false;
  world.cameraX = 0;
  world.cameraY = 0;
  pauseMenu.classList.add("hidden");
  pauseButton.textContent = "Ⅱ";
  message.classList.add("hidden");
  rebuildLayers();
}
function update(dt) {
  if (gameOver || paused) return;
  var km = getKeyboardMove();
  if (!autoPlay) {
    if (km) player.setKeyboardMove({ x: km.x, y: km.y });
    else if (player.keyboardMove) player.setKeyboardMove(null);
  } else if (player.keyboardMove) player.setKeyboardMove(null);
  if ((fireHeld || isKeyboardFireHeld()) && !autoPlay) attemptFire();
  updateAutoPlayer(dt);
  updateBandits(enemies, dt, player, covers, spawnEnemyProjectile);
  updateAllies(allies, dt, player, covers, enemies, spawnAllyProjectile);
  player.update(dt);
  player.x = clamp(player.x, world.minX, world.maxX);
  player.y = clamp(player.y, world.minY, world.maxY);
  allies.forEach(function (a) {
    a.x = clamp(a.x, world.minX, world.maxX);
    a.y = clamp(a.y, world.minY, world.maxY);
  });
  enemies.forEach(function (e) {
    e.x = clamp(e.x, world.minX, world.maxX);
    e.y = clamp(e.y, world.minY, world.maxY);
  });
  updateProjectiles(dt);
  updateFeedback(dt);
  updateBlood(dt);
  updateWaveDefense(dt);
  updateCamera();
  if (window.__tacticalTick) window.__tacticalTick(dt, player, enemies);
  if (target && target.dead) setTarget(null);
  if (player.dead && player.deathTimer >= player.deathDuration) finishFailure();
}
function worldPoly(points, fill, stroke) {
  ctx.beginPath();
  points.forEach(function (p, i) {
    var q = iso(p[0], p[1]);
    if (i === 0) ctx.moveTo(q[0], q[1]);
    else ctx.lineTo(q[0], q[1]);
  });
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function drawBuilding(x, y, w, h, roof) {
  if (!onScreen(x, y, ((w + h) * world.scaleX) / 2 + 48)) return;
  var pts = [
      [x - w / 2, y - h / 2],
      [x + w / 2, y - h / 2],
      [x + w / 2, y + h / 2],
      [x - w / 2, y + h / 2],
    ],
    q = pts.map(function (p) {
      return iso(p[0], p[1]);
    });
  ctx.save();
  ctx.shadowColor = "#0008";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#716b60";
  ctx.beginPath();
  ctx.moveTo(q[0][0], q[0][1] - 24);
  q.slice(1).forEach(function (v) {
    ctx.lineTo(v[0], v[1] - 24);
  });
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = roof || "#454b49";
  ctx.beginPath();
  ctx.moveTo(q[0][0], q[0][1] - 32);
  q.slice(1).forEach(function (v) {
    ctx.lineTo(v[0], v[1] - 32);
  });
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#252a29";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
function drawStreetLamp(x, y) {
  if (!onScreen(x, y, 48)) return;
  var q = iso(x, y);
  ctx.save();
  ctx.strokeStyle = "#252b2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(q[0], q[1]);
  ctx.lineTo(q[0], q[1] - 28);
  ctx.lineTo(q[0] + 6, q[1] - 33);
  ctx.stroke();
  ctx.fillStyle = "#c6b979";
  ctx.beginPath();
  ctx.arc(q[0] + 7, q[1] - 33, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawCrosswalk(y) {
  for (var x = -380; x <= 380; x += 58)
    worldPoly(
      [
        [x, y],
        [x + 32, y],
        [x + 32, y + 13],
        [x, y + 13],
      ],
      "#d1d0c5aa",
    );
}
function drawMapDecor() {
  worldPoly(
    [
      [world.minX, world.minY],
      [world.maxX, world.minY],
      [world.maxX, world.maxY],
      [world.minX, world.maxY],
    ],
    "#4b514c",
  );
  worldPoly(
    [
      [-310, world.minY],
      [310, world.minY],
      [310, world.maxY],
      [-310, world.maxY],
    ],
    "#414542",
  );
  worldPoly(
    [
      [world.minX, world.minY],
      [-310, world.minY],
      [-310, world.maxY],
      [world.minX, world.maxY],
    ],
    "#343a3a",
  );
  worldPoly(
    [
      [310, world.minY],
      [world.maxX, world.minY],
      [world.maxX, world.maxY],
      [310, world.maxY],
    ],
    "#343a3a",
  );
  for (var y = world.minY + 80; y <= world.maxY - 50; y += 118)
    worldPoly(
      [
        [-11, y],
        [11, y],
        [11, y + 62],
        [-11, y + 62],
      ],
      "#c0a64d99",
    );
  [-1500, -900, -320, 300, 920, 1500].forEach(drawCrosswalk);
  var outerRows = [-1650, -1100, -550, 0, 550, 1100, 1650];
  outerRows.forEach(function (y) {
    drawBuilding(-1650, y, 470, 330, "#404644");
    drawBuilding(1650, y, 470, 330, "#454947");
  });
  var innerRows = [-1200, -600, 0, 600, 1200];
  innerRows.forEach(function (y) {
    drawBuilding(-980, y, 320, 250, "#3e4442");
    drawBuilding(980, y, 320, 250, "#424744");
  });
  for (var ly = -1700; ly <= 1700; ly += 360) {
    drawStreetLamp(-430, ly);
    drawStreetLamp(430, ly);
  }
}
function drawWorld() {
  ctx.fillStyle = "#4b514c";
  ctx.fillRect(0, 0, W, H);
  drawMapDecor();
  if (target && !target.dead) {
    var a = iso(player.x, player.y),
      b = iso(target.x, target.y);
    ctx.save();
    ctx.strokeStyle = "#f5d54799";
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1] - 12);
    ctx.lineTo(b[0], b[1] - 12);
    ctx.stroke();
    ctx.restore();
  }
}
function drawPlayerEngagementRange() {
  if (!player || player.dead || !player.weapon) return;
  const center = iso(player.x, player.y);
  const radius = player.weapon.range;
  const radiusX = radius * world.scaleX * Math.SQRT2;
  const radiusY = radius * world.scaleY * Math.SQRT2;
  ctx.save();
  ctx.globalAlpha = autoPlay ? 0.62 : 0.42;
  ctx.strokeStyle = "#ffd400";
  ctx.lineWidth = autoPlay ? 2.4 : 1.7;
  ctx.setLineDash(autoPlay ? [] : [9, 8]);
  ctx.shadowColor = "#ffd400";
  ctx.shadowBlur = autoPlay ? 9 : 4;
  ctx.beginPath();
  ctx.ellipse(center[0], center[1], radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function drawMissionUI() {
  ctx.save();
  var boxW = Math.min(235, W - 24),
    x = 12,
    y = 12;
  ctx.fillStyle = "#11181de8";
  ctx.strokeStyle = "#ffffff33";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 12, y);
  ctx.lineTo(x + boxW - 12, y);
  ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + 12);
  ctx.lineTo(x + boxW, y + 70);
  ctx.quadraticCurveTo(x + boxW, y + 82, x + boxW - 12, y + 82);
  ctx.lineTo(x + 12, y + 82);
  ctx.quadraticCurveTo(x, y + 82, x, y + 70);
  ctx.lineTo(x, y + 12);
  ctx.quadraticCurveTo(x, y, x + 12, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#8fb7c8";
  ctx.font = "800 10px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("WAVE DEFENSE", x + 14, y + 18);
  ctx.fillStyle = "#fff";
  ctx.font = "900 15px system-ui";
  ctx.fillText("HOLD THE BLOCK", x + 14, y + 41);
  ctx.fillStyle = "#8fb7c8";
  ctx.font = "800 10px system-ui";
  var alive = enemies.filter(function (e) {
      return !e.dead;
    }).length,
    line =
      waveState === "cleared"
        ? "WAVE " +
          wave +
          " CLEAR  •  NEXT " +
          Math.max(0, waveTimer).toFixed(1) +
          "s"
        : "WAVE " + wave + "  •  HOSTILES " + alive;
  ctx.fillText(line, x + 14, y + 63);
  ctx.restore();
}
function onScreen(x, y, margin = 110) {
  const q = iso(x, y);
  return (
    q[0] >= -margin &&
    q[0] <= W + margin &&
    q[1] >= -margin &&
    q[1] <= H + margin
  );
}
function rebuildLayers() {
  layers = [];
  for (const [objects, type] of [
    [covers, "cover"],
    [allies, "ally"],
    [enemies, "enemy"],
    [[player], "player"],
  ]) {
    for (const o of objects) layers.push({ o, y: o.x + o.y, type });
  }
}
function draw(now) {
  drawWorld();
  drawPlayerEngagementRange();
  drawBlood(ctx, iso);
  drawProjectiles();
  for (const layer of layers) layer.y = layer.o.x + layer.o.y;
  layers.sort(function (a, b) {
    return a.y - b.y;
  });
  layers.forEach(function (v) {
    if (!onScreen(v.o.x, v.o.y)) return;
    if (v.type === "cover") drawCover(ctx, v.o, iso);
    else if (v.type === "ally") drawAlly(ctx, v.o, iso);
    else if (v.type === "enemy") drawBandit(ctx, v.o, iso, target === v.o);
    else drawPlayer(ctx, v.o, iso);
  });
  drawFeedback();
  drawMissionUI();
  var aliveAllies = allies.filter(function (a) {
      return !a.dead;
    }).length,
    aliveEnemies = enemies.filter(function (e) {
      return !e.dead;
    }).length;
  const nextStatus =
    "HP " +
    Math.max(0, Math.ceil(player.hp)) +
    " • " +
    kills +
    " KILLS • WAVE " +
    wave +
    " • " +
    aliveEnemies +
    " HOSTILES • " +
    aliveAllies +
    " ALLIES • " +
    player.weapon.ammo +
    "/" +
    player.weapon.magazine +
    (player.downed ? " • DOWNED" : "") +
    (player.cover ? " • IN COVER" : "") +
    (target && !target.dead ? " • TARGET LOCKED" : "") +
    (autoPlay ? " • AI PILOT" : "") +
    (paused ? " • PAUSED" : "");
  const nextHint = paused
    ? "GAME PAUSED"
    : player.downed
      ? "WAIT FOR A REVIVE"
      : player.dead
        ? "SOLDIER KIA"
        : waveState === "cleared"
          ? "WAVE CLEAR — PREPARE FOR CONTACT"
          : player.reloading
            ? "RELOADING..."
            : "Tap to move • Tap enemy to lock • Hold FIRE";
  if (status.textContent !== nextStatus) status.textContent = nextStatus;
  if (hint.textContent !== nextHint) hint.textContent = nextHint;
  if (hudDirty || now - lastHudUpdate >= 100) {
    updateSquadHud();
    updateCombatHud();
    updatePlayerHud(player);
    lastHudUpdate = now;
    hudDirty = false;
  }
  if (paused) {
    ctx.save();
    ctx.fillStyle = "#0005";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
var runtime = createGameLoop({
  update,
  draw,
  isActive: () => started && !paused && !gameOver && !document.hidden,
});
function clearHeldInput() {
  clearKeyboard();
  fireHeld = false;
  fireButton.classList.remove("active");
}
window.addEventListener("blur", clearHeldInput);
document.addEventListener("visibilitychange", function () {
  clearHeldInput();
  if (document.hidden && started && !paused && !gameOver) togglePause();
  runtime.resetClock();
});
export function startGame() {
  if (started) return;
  // Release menu focus so held keyboard controls reach the battlefield.
  document.activeElement?.blur?.();
  clearKeyboard();
  started = true;
  rebuildLayers();
  runtime.start();
}
