import { createGameLoop } from "./gameLoop.js?v=20260906-98";
import {
  worldToScreen,
  screenToWorld as unproject,
  nearestLivingEnemy,
} from "./geometry.js?v=20260906-98";
import { recoverInCover, shouldRecover } from "./recoveryAI.js?v=20260906-98";
import {
  updateBlood,
  drawBlood,
  resetBlood,
} from "./bloodEffects.js?v=20260906-98";
import { updateSquadHud } from "./squadHud.js?v=20260906-98";
import { updateCombatHud } from "./combatHud.js?v=20260906-98";
import { updatePlayerHud } from "./player.js?v=20260906-98";
import { resetSquadCommands } from "./allyCore2.js?v=20260906-98";
import "./squadDrawer.js?v=20260906-98";
import { createPlayer, drawPlayer } from "./player.js?v=20260906-98";
import {
  createBandits,
  updateBandits,
  drawBandit,
  drawSniperLasers,
} from "./enemy.js?v=20260906-98";
import { createAllies, updateAllies, drawAlly } from "./ally.js?v=20260906-98";
import {
  createMarines,
  updateMarines,
  drawMarine,
} from "./marines.js?v=20260906-98";
import {
  createStreetMission,
  updateStreetMission,
  captureSecondsRemaining,
} from "./streetMission.js?v=20260906-98";
import {
  createSupportVehicle,
  updateSupportVehicle,
  drawSupportVehicle,
} from "./supportVehicle.js?v=20260906-98";
import {
  createCover,
  findCoverForPoint,
  getCoverSlot,
  drawCover,
  isLineBlocked,
  firstCoverOnSegment,
  registerCover,
} from "./cover.js?v=20260906-98";
import {
  isCoverFull,
  nearestFreeSlot,
  occupancyPenalty,
  reserveCoverSlot,
} from "./coverSlots.js?v=20260906-98";
import {
  initKeyboard,
  getKeyboardMove,
  isKeyboardFireHeld,
  clearKeyboard,
} from "./input.js?v=20260906-98";
import { initTactical } from "./tactical.js?v=20260906-98";
import { AudioBus } from "./audio.js?v=20260906-98";
import {
  segmentWave,
  updateWaveSegments,
  waveFullyCleared,
  pendingHostiles,
} from "./waveSegments.js?v=20260906-98";
import {
  grantKillXp,
  grantWaveXp,
  getTeamProgress,
} from "./teamProgress.js?v=20260906-98";
import {
  updateGrenades,
  drawGrenades,
  trySquadGrenades,
  resetGrenades,
} from "./grenades.js?v=20260906-98";
import {
  applyRunModifiers,
  updateMarineReinforcements,
  resetMarineTimer,
} from "./runModifiers.js?v=20260906-98";
import {
  drawWartornAtmosphere,
  drawWartornDressing,
  drawWartornStreetSurface,
} from "./wartornCity.js?v=20260906-98";
import {
  updateSquadDialog,
  drawDialogBubbles,
  resetSquadDialog,
} from "./squadDialog.js?v=20260906-98";
import {
  unstickOverlappingUnits,
  resetUnitUnstick,
} from "./unitCollision.js?v=20260906-98";
import {
  camModeLabel,
  cameraLookAt,
  easeCameraToward,
} from "./frontLineCam.js?v=20260906-98";
import {
  spraySuppression,
} from "./suppression.js?v=20260906-98";
import {
  updateAmmoDrops,
  drawAmmoDrops,
  spawnKillAmmo,
  spawnWaveAmmo,
} from "./ammoEconomy.js?v=20260906-98";
import {
  damageCover,
  tickCoverVisuals,
} from "./destructibleCover.js?v=20260906-98";
import {
  createStreetObjectives,
  resetStreetObjectives,
  updateStreetObjectives,
  currentPushGoal,
  objectiveStatusLine,
  drawStreetTask,
} from "./streetObjectives.js?v=20260906-98";
var canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d"),
  status = document.querySelector("#status"),
  hint = document.querySelector("#hint"),
  fireButton = document.querySelector("#fire"),
  reloadButton = document.querySelector("#reload"),
  swapButton = document.querySelector("#swapWeapon"),
  autoPlayButton = document.querySelector("#autoPlay"),
  camModeButton = document.querySelector("#camMode"),
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
  frontLineCam = false,
  autoMoveTimer = 0,
  autoTargetTimer = 0,
  wave = 1,
  waveState = "active",
  waveTimer = 0,
  waveDirector = null;
var world = {
  scaleX: 0.25,
  scaleY: 0.125,
  offsetY: -40,
  cameraX: 0,
  cameraY: 0,
  minX: -2300,
  maxX: 2300,
  minY: -6600,
  maxY: 1900,
};
var mission = createStreetMission(),
  supportVehicle = null,
  player = createPlayer(),
  covers = createCover(),
  enemies = createWaveEnemies(),
  allies = createAllies(),
  marines = createMarines(),
  projectiles = [];
var ammoDrops = [];
var streetTasks = createStreetObjectives();
initTactical();
window.__battlePlayer = player;
window.__battleEnemies = enemies;
window.__battleAllies = allies;
window.__battleMarines = marines;
window.__battleCovers = covers;
window.__streetMission = mission;
window.__supportVehicle = supportVehicle;
window.__waveDefense = true;
window.__wave = wave;
window.__frontLineCam = false;
window.__ammoDrops = ammoDrops;
window.__streetObjectives = streetTasks;
window.__activeStreetGoal = currentPushGoal(mission, streetTasks);
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
function syncCamModeHud() {
  if (!camModeButton) return;
  camModeButton.classList.toggle("hidden", !autoPlay);
  camModeButton.classList.toggle("active", !!(autoPlay && frontLineCam));
  camModeButton.textContent = camModeLabel(frontLineCam);
  camModeButton.setAttribute(
    "aria-pressed",
    autoPlay && frontLineCam ? "true" : "false",
  );
  window.__frontLineCam = !!(autoPlay && frontLineCam);
}
function setFrontLineCam(on) {
  frontLineCam = !!on && autoPlay;
  hudDirty = true;
  syncCamModeHud();
}
function updateCamera() {
  var look = cameraLookAt(
    world,
    player,
    allies,
    marines,
    enemies,
    autoPlay && frontLineCam,
  );
  easeCameraToward(world, look.x, look.y);
}
export function iso(x, y) {
  return worldToScreen(x, y, world, W, H);
}
function createWaveEnemies() {
  var roster = createBandits(wave, {
    spawnMode: mission && mission.captured ? "surround" : "northeast",
    spawnView: {
      world: world,
      width: W || 390,
      height: H || 844,
    },
  });
  waveDirector = segmentWave(roster, { packSize: 3, interval: 9.5, firstDelay: 0.7 });
  return roster;
}
function nearestEnemy() {
  return nearestLivingEnemy(player, enemies);
}
function activeCombatEnemies() {
  return enemies.filter(function (enemy) {
    return !enemy.dead && !enemy.downed && enemy.hp > 0 && enemy.spawnTimer <= 0;
  });
}
function chooseAutoCombatEnemy() {
  var best = null,
    bestScore = -Infinity;
  activeCombatEnemies().forEach(function (enemy) {
    var d = distance(player, enemy),
      blocked = isLineBlocked(player, enemy, covers),
      healthPressure = 1 - enemy.hp / Math.max(1, enemy.maxHp),
      score = Math.max(0, 1800 - d) * 0.045 + healthPressure * 42;
    score += blocked ? -18 : 24;
    score += enemy.exposed ? 22 : -8;
    if (enemy.type === "sniper") score += 58;
    else if (enemy.type === "heavy") score += 32;
    else if (enemy.type === "shotgunner" && d < 650) score += 45;
    if (enemy.combatTarget === player) score += 64;
    else if (enemy.combatTarget && enemy.combatTarget.isMarine) score += 18;
    if (enemy === target) score += 18;
    if (score > bestScore) {
      bestScore = score;
      best = enemy;
    }
  });
  return best;
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
    if (p.life > p.coverGrace) {
      var coverHit = firstCoverOnSegment(
        { x: p.x, y: p.y },
        { x: nx, y: ny },
        covers,
      );
      if (coverHit && coverHit.cover) {
        damageCover(
          coverHit.cover,
          p.owner === "player" ? 18 : p.owner === "ally" ? 14 : 10,
          [player].concat(allies).concat(marines).concat(enemies),
        );
        projectiles.splice(i, 1);
        continue;
      }
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
  player.maybeAutoSidearm && player.maybeAutoSidearm();
  if (player.weapon.ammo <= 0) {
    AudioBus.playEmpty();
    if (player.weaponSlot === "sidearm") reload();
    else if (player.swapWeapon) player.swapWeapon("sidearm");
    else reload();
    return;
  }
  var before = player.weapon.ammo,
    hit = player.fireAt(e);
  spraySuppression(player, e, enemies, true);
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
      if (e.dead) noteTeamKill(e);
    }
  }
}
function chooseAutoPosition(e, strategicGoal) {
  var best = null,
    bestCover = null,
    bestScore = 1e9,
    combatThreats = e ? activeCombatEnemies() : [],
    desired = Math.min(player.weapon.range * 0.72, 760),
    currentGoalDistance = strategicGoal
      ? distance(player, strategicGoal)
      : Infinity;
  covers.forEach(function (c) {
    if (!c || c.destroyed) return;
    var cd = distance(player, c),
      ed = e ? distance(e, c) : desired,
      goalDistance = strategicGoal ? distance(strategicGoal, c) : 0;
    if (cd > 1250) return;
    if (e && ed < 240) return;
    if (strategicGoal && goalDistance > currentGoalDistance - 90) return;
    var occupants = [player].concat(allies || []).concat(marines || []);
    if (isCoverFull(c, occupants, player)) return;
    var slot = reserveCoverSlot(c, player, e, occupants) || getCoverSlot(c, player, e),
      protectedSpot = e
        ? isLineBlocked({ x: slot.x, y: slot.y }, e, [c])
        : true,
      exposedTo = 0,
      routeExposure = 0,
      score =
        cd * (strategicGoal ? 0.35 : 1) +
        Math.abs(ed - desired) * (strategicGoal ? 0.25 : 0.55) +
        goalDistance * (strategicGoal ? 0.48 : 0) +
        (protectedSpot ? -190 : 180) +
        (c.type === "wide" || c.type === "car" ? -65 : 0) +
        occupancyPenalty(c, occupants, player);
    if (e) {
      var midpoint = {
        x: (player.x + slot.x) * 0.5,
        y: (player.y + slot.y) * 0.5,
      };
      combatThreats.forEach(function (threat) {
        if (!isLineBlocked(slot, threat, [c])) exposedTo++;
        if (!isLineBlocked(midpoint, threat, [c])) routeExposure++;
      });
      score += exposedTo * 185 + routeExposure * 42;
    }
    if (score < bestScore) {
      bestScore = score;
      best = slot;
      bestCover = c;
    }
  });
  if (best) {
    if (Number.isFinite(best.index)) player.coverSlotIndex = best.index;
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
  autoTargetTimer -= dt;
  if (
    autoTargetTimer <= 0 ||
    !target ||
    target.dead ||
    target.hp <= 0 ||
    target.spawnTimer > 0
  ) {
    var assessedTarget = chooseAutoCombatEnemy();
    if (assessedTarget !== target) setTarget(assessedTarget);
    autoTargetTimer = 0.48;
  }
  var e = target,
    strategicGoal = mission && !mission.captured ? mission.objective : null;
  if (shouldRecover(player)) {
    recoverInCover(player, e, covers, allies, dt);
    // Recovery moves directly; do not also pursue an old tap-to-move destination.
    player.tx = player.x;
    player.ty = player.y;
    return;
  }
  if (!e) {
    player.objectiveAdvancePaused = false;
    player.tacticalState = mission.captured ? "DEFENDING" : "ADVANCING";
    if (!strategicGoal) return;
    autoMoveTimer -= dt;
    if (distance(player, strategicGoal) <= strategicGoal.radius * 0.68) {
      player.tx = player.x;
      player.ty = player.y;
      return;
    }
    if (autoMoveTimer <= 0) {
      autoMoveTimer = 0.45;
      if (!chooseAutoPosition(null, strategicGoal)) {
        var gx = strategicGoal.x - player.x,
          gy = strategicGoal.y - player.y,
          gl = Math.hypot(gx, gy) || 1;
        player.setDestination(
          clamp(player.x + (gx / gl) * 180, world.minX, world.maxX),
          clamp(player.y + (gy / gl) * 180, world.minY, world.maxY),
          null,
        );
      }
    }
    return;
  }
  player.objectiveAdvancePaused = true;
  var d = distance(player, e),
    blocked = isLineBlocked(player, e, covers),
    engage = Math.min(player.weapon.range * 0.86, 900);
  player.tacticalState = d < 320 ? "DANGER CLOSE" : "ENGAGING FROM COVER";
  if (
    player.cover &&
    !player.reloading &&
    player.weapon.ammo <= Math.ceil(player.weapon.magazine * 0.3) &&
    d > 380
  ) {
    reload();
    return;
  }
  if (player.weapon.ammo <= 0) {
    if (player.maybeAutoSidearm && player.maybeAutoSidearm()) return;
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
      if (!chooseAutoPosition(e, null)) {
        player.tx = player.x;
        player.ty = player.y;
      }
    }
    return;
  }
  if (blocked || d < 280) {
    if (autoMoveTimer <= 0) {
      autoMoveTimer = 0.35;
      chooseAutoPosition(e, null);
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
    autoTargetTimer = 0;
    player.keyboardMove = null;
  } else {
    player.keyboardMove = null;
    frontLineCam = false;
  }
  syncCamModeHud();
});
if (camModeButton) {
  camModeButton.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (!started || paused || gameOver || !autoPlay) return;
    setFrontLineCam(!frontLineCam);
  });
}
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
function syncSwapButton() {
  if (!swapButton) return;
  var onSide = player.weaponSlot === "sidearm";
  swapButton.textContent = onSide ? "PRIMARY" : "SIDEARM";
  swapButton.classList.toggle("sidearm", onSide);
}
if (swapButton)
  swapButton.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (!started || paused || gameOver || player.dead || player.downed) return;
    if (player.swapWeapon) player.swapWeapon();
    syncSwapButton();
    hudDirty = true;
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
    var occupants = [player].concat(allies || []).concat(marines || []);
    var reserved =
      nearestFreeSlot(cover, p, target && !target.dead ? target : null, occupants, player) ||
      slot;
    if (reserved && Number.isFinite(reserved.index))
      player.coverSlotIndex = reserved.index;
    player.setDestination(reserved.x, reserved.y, cover);
  } else player.setDestination(p.x, p.y, null);
});
initKeyboard({
  onFire: function () {
    if (!autoPlay && !paused) attemptFire();
  },
  onReload: reload,
  onSwap: function () {
    if (!started || paused || gameOver || player.dead || player.downed) return;
    if (player.swapWeapon) player.swapWeapon();
    syncSwapButton();
    hudDirty = true;
  },
});
function noteTeamKill(enemy) {
  if (!enemy || enemy._xpGranted) return;
  enemy._xpGranted = true;
  kills++;
  grantKillXp(enemy, wave);
  var drop = spawnKillAmmo(enemy);
  if (drop) ammoDrops.push(drop);
}

function collectTeamKills() {
  enemies.forEach(function (e) {
    if (e.dead && !e._xpGranted) noteTeamKill(e);
  });
}

function beginNextWave() {
  wave++;
  window.__wave = wave;
  enemies = createWaveEnemies();
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
  messageTitle.textContent = "ADVANCE HALTED";
  messageText.textContent = "The street push was overrun on wave " + wave + ".";
  message.classList.remove("hidden");
}
function updateWaveDefense(dt) {
  collectTeamKills();
  if (waveState === "cleared") {
    waveTimer -= dt;
    if (waveTimer <= 0) beginNextWave();
    return;
  }
  updateWaveSegments(waveDirector, dt, enemies);
  if (waveFullyCleared(enemies, waveDirector)) {
    grantWaveXp(wave);
    waveState = "cleared";
    waveTimer = 2.8;
    spawnWaveAmmo(player, 3).forEach(function (d) {
      ammoDrops.push(d);
    });
    target = null;
    player.aimTarget = null;
  }
}
function reset() {
  player.reset();
  mission = createStreetMission();
  supportVehicle = null;
  window.__streetMission = mission;
  window.__supportVehicle = supportVehicle;
  covers = createCover();
  window.__battleCovers = covers;
  allies = createAllies();
  window.__battleAllies = allies;
  marines = createMarines();
  window.__battleMarines = marines;
  resetSquadCommands();
  resetBlood();
  resetGrenades();
  resetMarineTimer();
  resetSquadDialog();
  resetUnitUnstick();
  ammoDrops.length = 0;
  streetTasks = resetStreetObjectives(streetTasks);
  window.__streetObjectives = streetTasks;
  window.__activeStreetGoal = currentPushGoal(mission, streetTasks);
  window.__ammoDrops = ammoDrops;
  clearKeyboard();
  hudDirty = true;
  runtime.resetClock();
  fireButton.classList.remove("active");
  wave = 1;
  window.__wave = wave;
  waveState = "active";
  waveTimer = 0;
  world.cameraX = 0;
  world.cameraY = 0;
  enemies = createWaveEnemies();
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
  frontLineCam = false;
  autoMoveTimer = 0;
  autoTargetTimer = 0;
  paused = false;
  autoPlayButton.classList.remove("active");
  autoPlayButton.textContent = "AUTO PLAY";
  syncCamModeHud();
  gameOver = false;
  pauseMenu.classList.add("hidden");
  pauseButton.textContent = "Ⅱ";
  message.classList.add("hidden");
  applyRunModifiers(player, allies, marines);
  window.__battleMarines = marines;
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
  updateAllies(
    allies,
    dt,
    player,
    covers,
    enemies,
    spawnAllyProjectile,
    undefined,
    marines,
  );
  updateMarines(
    marines,
    dt,
    player,
    covers,
    enemies,
    spawnAllyProjectile,
    allies,
  );
  player.update(dt);
  player.x = clamp(player.x, world.minX, world.maxX);
  player.y = clamp(player.y, world.minY, world.maxY);
  allies.forEach(function (a) {
    a.x = clamp(a.x, world.minX, world.maxX);
    a.y = clamp(a.y, world.minY, world.maxY);
  });
  marines.forEach(function (marine) {
    marine.x = clamp(marine.x, world.minX, world.maxX);
    marine.y = clamp(marine.y, world.minY, world.maxY);
  });
  updateStreetMission(mission, dt, player, allies);
  var beforeCovers = covers.length;
  var streetResult = updateStreetObjectives(streetTasks, dt, {
    player: player,
    squad: allies,
    marines: marines,
    covers: covers,
  });
  window.__streetObjectives = streetTasks;
  window.__activeStreetGoal = currentPushGoal(mission, streetTasks);
  if (covers.length !== beforeCovers) {
    covers.forEach(registerCover);
    rebuildLayers();
  }
  if (streetResult && streetResult.justCompleted) {
    spawnWaveAmmo(streetResult.justCompleted, 2).forEach(function (d) {
      ammoDrops.push(d);
    });
    hudDirty = true;
  }
  updateAmmoDrops(ammoDrops, player, dt);
  tickCoverVisuals(covers, dt);
  if (mission.justCaptured && !supportVehicle) {
    supportVehicle = createSupportVehicle(mission.objective);
    window.__supportVehicle = supportVehicle;
    rebuildLayers();
  }
  updateSupportVehicle(
    supportVehicle,
    dt,
    enemies,
    covers,
    spawnAllyProjectile,
  );
  enemies.forEach(function (e) {
    if (
      !e.enteredWorld &&
      e.x >= world.minX &&
      e.x <= world.maxX &&
      e.y >= world.minY &&
      e.y <= world.maxY
    )
      e.enteredWorld = true;
    if (e.enteredWorld) {
      e.x = clamp(e.x, world.minX, world.maxX);
      e.y = clamp(e.y, world.minY, world.maxY);
    }
  });
  updateProjectiles(dt);
  var clock =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
  trySquadGrenades([player].concat(allies), enemies, dt, clock);
  updateGrenades(dt, enemies);
  updateMarineReinforcements(dt, marines, player, function () {
    window.__battleMarines = marines;
    rebuildLayers();
  });
  updateFeedback(dt);
  updateBlood(dt);
  updateWaveDefense(dt);
  unstickOverlappingUnits(null, dt);
  updateSquadDialog(dt, player, allies, marines, enemies);
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
  if (!onScreen(x, y, ((w + h) * world.scaleX) / 2 + 520)) return;
  var pts = [
      [x - w / 2, y - h / 2],
      [x + w / 2, y - h / 2],
      [x + w / 2, y + h / 2],
      [x - w / 2, y + h / 2],
    ],
    qs = pts.map(function (p) {
      return iso(p[0], p[1]);
    });
  ctx.save();
  ctx.shadowColor = "#0008";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#716b60";
  ctx.beginPath();
  ctx.moveTo(qs[0][0], qs[0][1] - 24);
  qs.slice(1).forEach(function (v) {
    ctx.lineTo(v[0], v[1] - 24);
  });
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = roof || "#454b49";
  ctx.beginPath();
  ctx.moveTo(qs[0][0], qs[0][1] - 32);
  qs.slice(1).forEach(function (v) {
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
  if (!onScreen(x, y, 180)) return;
  var q = iso(x, y);
  ctx.save();
  ctx.strokeStyle = "#2a2620";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(q[0], q[1]);
  ctx.lineTo(q[0], q[1] - 34);
  ctx.lineTo(q[0] + 8, q[1] - 40);
  ctx.stroke();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#d8c47a";
  ctx.beginPath();
  ctx.arc(q[0] + 9, q[1] - 40, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#c6b979";
  ctx.beginPath();
  ctx.arc(q[0] + 9, q[1] - 40, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawCrosswalk(y) {
  if (!onScreen(0, y, 520)) return;
  for (var x = -380; x <= 380; x += 58)
    worldPoly(
      [
        [x, y],
        [x + 32, y],
        [x + 32, y + 13],
        [x, y + 13],
      ],
      "#8a827466",
    );
}
function drawMapDecor() {
  // Continuous street corridor: soft asphalt + sidewalks, no tiled plates.
  var ROAD = 980,
    WALK = 260,
    INNER = 160,
    curbL = -ROAD,
    curbR = ROAD,
    walkL = curbL - WALK,
    walkR = curbR + WALK,
    y,
    step,
    fade;
  worldPoly(
    [
      [world.minX, world.minY],
      [world.maxX, world.minY],
      [world.maxX, world.maxY],
      [world.minX, world.maxY],
    ],
    "#322e29",
  );
  worldPoly(
    [
      [walkL, world.minY],
      [curbL + INNER, world.minY],
      [curbL + INNER, world.maxY],
      [walkL, world.maxY],
    ],
    "#454038",
  );
  worldPoly(
    [
      [curbR - INNER, world.minY],
      [walkR, world.minY],
      [walkR, world.maxY],
      [curbR - INNER, world.maxY],
    ],
    "#454038",
  );
  worldPoly(
    [
      [curbL, world.minY],
      [curbR, world.minY],
      [curbR, world.maxY],
      [curbL, world.maxY],
    ],
    "#3b3731",
  );
  for (step = 0; step < 3; step++) {
    worldPoly(
      [
        [curbL - 40 + step * 50, world.minY],
        [curbL + 90 + step * 40, world.minY],
        [curbL + 90 + step * 40, world.maxY],
        [curbL - 40 + step * 50, world.maxY],
      ],
      "rgba(56,52,46," + (0.16 + step * 0.08).toFixed(2) + ")",
    );
    worldPoly(
      [
        [curbR - 90 - step * 40, world.minY],
        [curbR + 40 - step * 50, world.minY],
        [curbR + 40 - step * 50, world.maxY],
        [curbR - 90 - step * 40, world.maxY],
      ],
      "rgba(56,52,46," + (0.16 + step * 0.08).toFixed(2) + ")",
    );
  }
  drawWartornStreetSurface(ctx, iso, world, onScreen);
  for (y = world.minY + 140; y <= world.maxY - 80; y += 240)
    worldPoly(
      [
        [-8 + ((y / 240) | 0) % 4, y],
        [8, y + 5],
        [6, y + 28],
        [-5, y + 24],
      ],
      "#7a6c4838",
    );
  for (var crossY = world.minY + 420; crossY < world.maxY; crossY += 1100)
    drawCrosswalk(crossY);
  if (ctx.createLinearGradient) {
    fade = ctx.createLinearGradient(0, 0, 0, H * 0.3);
    if (fade && fade.addColorStop) {
      fade.addColorStop(0, "rgba(42,38,34,0.55)");
      fade.addColorStop(0.45, "rgba(48,44,40,0.18)");
      fade.addColorStop(1, "rgba(58,54,48,0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H * 0.3);
    }
  }
}
function drawStreetObjective() {
  var objective = mission.objective,
    center = iso(objective.x, objective.y),
    radiusX = objective.radius * world.scaleX * Math.SQRT2,
    radiusY = objective.radius * world.scaleY * Math.SQRT2,
    color = mission.captured ? "#6fd77e" : "#e7c64d";
  ctx.save();
  ctx.globalAlpha = mission.captured ? 0.34 : mission.capturing ? 0.55 : 0.28;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(mission.captured ? [] : [9, 7]);
  ctx.beginPath();
  ctx.ellipse(center[0], center[1], radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#242b28";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(center[0], center[1] - 8);
  ctx.lineTo(center[0], center[1] - 62);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(center[0] + 2, center[1] - 61);
  ctx.lineTo(center[0] + 31, center[1] - 51);
  ctx.lineTo(center[0] + 2, center[1] - 42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawWorld() {
  drawWartornAtmosphere(ctx, W, H, iso, world);
  drawMapDecor();
  drawWartornDressing(ctx, iso, world, W, H, onScreen);
  drawStreetTask(ctx, iso, streetTasks);
  drawAmmoDrops(ctx, iso, ammoDrops);
  drawStreetObjective();
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
  ctx.lineTo(x + boxW, y + 91);
  ctx.quadraticCurveTo(x + boxW, y + 103, x + boxW - 12, y + 103);
  ctx.lineTo(x + 12, y + 103);
  ctx.quadraticCurveTo(x, y + 103, x, y + 91);
  ctx.lineTo(x, y + 12);
  ctx.quadraticCurveTo(x, y, x + 12, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#8fb7c8";
  ctx.font = "800 10px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("STREET PUSH", x + 14, y + 18);
  ctx.fillStyle = "#fff";
  ctx.font = "900 15px system-ui";
  ctx.fillText(
    streetTasks && streetTasks.current
      ? streetTasks.current.label
      : mission.captured
        ? "FORTIFICATION SECURED"
        : "CAPTURE THE FORT",
    x + 14,
    y + 41,
  );
  ctx.fillStyle = "#8fb7c8";
  ctx.font = "800 10px system-ui";
  var alive = enemies.filter(function (e) {
      return !e.dead;
    }).length,
    marineStrength = marines.filter(function (marine) {
      return !marine.dead;
    }).length,
    objectiveLine =
      streetTasks && streetTasks.current
        ? objectiveStatusLine(streetTasks)
        : mission.captured
          ? "OBJECTIVE SECURE  •  TURRET ACTIVE"
          : mission.capturing
            ? "CAPTURING  •  " + captureSecondsRemaining(mission).toFixed(1) + "s"
            : "DISTANCE  •  " +
              Math.max(0, Math.round(distance(player, mission.objective) / 10)) +
              "m",
    line =
      waveState === "cleared"
        ? "WAVE " +
          wave +
          " CLEAR  •  NEXT " +
          Math.max(0, waveTimer).toFixed(1) +
          "s"
        : "WAVE " +
          wave +
          "  •  HOSTILES " +
          alive +
          (pendingHostiles(enemies) ? " +" + pendingHostiles(enemies) : "") +
          "  •  MARINES " +
          marineStrength;
  ctx.fillText(objectiveLine, x + 14, y + 63);
  ctx.fillStyle = "#b8c5c9";
  ctx.fillText(line, x + 14, y + 84);
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
    [marines, "marine"],
    [enemies, "enemy"],
    [supportVehicle ? [supportVehicle] : [], "vehicle"],
    [[player], "player"],
  ]) {
    for (const o of objects) layers.push({ o, y: o.x + o.y, type });
  }
}
function draw(now) {
  drawWorld();
  drawSniperLasers(ctx, enemies, iso, now);
  drawPlayerEngagementRange();
  drawBlood(ctx, iso);
  drawProjectiles();
  drawGrenades(ctx, iso);
  for (const layer of layers) {
    var o = layer.o;
    layer.y = o.x + o.y;
    if (
      o.cover &&
      !o.exposed &&
      !o.dead &&
      (layer.type === "player" ||
        layer.type === "ally" ||
        layer.type === "marine" ||
        layer.type === "enemy")
    ) {
      var liveFriendly =
        (layer.type === "player" ||
          layer.type === "ally" ||
          layer.type === "marine") &&
        !o.downed &&
        o.hp > 0;
      // Living friendlies paint in front of their piece so soft cover sprites
      // cannot wash them into ghosts. Enemies keep a tight tuck.
      layer.y = o.cover.x + o.cover.y + (liveFriendly ? 48 : 1.2);
    }
  }
  layers.sort(function (a, b) {
    return a.y - b.y;
  });
  var livingFriendlies = [];
  layers.forEach(function (v) {
    if (!onScreen(v.o.x, v.o.y)) return;
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    if (ctx.globalCompositeOperation) ctx.globalCompositeOperation = "source-over";
    var live =
      (v.type === "player" || v.type === "ally" || v.type === "marine") &&
      v.o &&
      !v.o.dead &&
      !v.o.downed &&
      v.o.hp > 0;
    if (live) {
      livingFriendlies.push(v);
      return;
    }
    if (v.type === "cover") drawCover(ctx, v.o, iso);
    else if (v.type === "ally") drawAlly(ctx, v.o, iso);
    else if (v.type === "marine") drawMarine(ctx, v.o, iso);
    else if (v.type === "enemy") drawBandit(ctx, v.o, iso, target === v.o);
    else if (v.type === "vehicle") drawSupportVehicle(ctx, v.o, iso);
    else drawPlayer(ctx, v.o, iso);
  });
  // Second pass: living friendlies on top of cover so soft cover stamps
  // cannot milk them into ghosts.
  livingFriendlies.forEach(function (v) {
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    if (ctx.globalCompositeOperation) ctx.globalCompositeOperation = "source-over";
    if (v.type === "ally") drawAlly(ctx, v.o, iso);
    else if (v.type === "marine") drawMarine(ctx, v.o, iso);
    else drawPlayer(ctx, v.o, iso);
  });
  drawDialogBubbles(ctx, iso, [player].concat(allies).concat(marines));
  drawFeedback();
  drawMissionUI();
  var aliveAllies = allies.filter(function (a) {
      return !a.dead;
    }).length,
    aliveMarines = marines.filter(function (marine) {
      return !marine.dead;
    }).length,
    aliveEnemies = enemies.filter(function (e) {
      return !e.dead;
    }).length;
  const nextStatus =
    "HP " +
    Math.max(0, Math.ceil(player.hp)) +
    " • " +
    kills +
    " KILLS • LV " +
    getTeamProgress().level +
    " • WAVE " +
    wave +
    " • " +
    aliveEnemies +
    " HOSTILES • " +
    aliveAllies +
    " SQUAD • " +
    aliveMarines +
    " MARINES • " +
    player.weapon.ammo +
    "/" +
    (player.weapon.infinite ? "∞" : Math.round(player.weapon.reserve || 0)) +
    (player.weaponSlot === "sidearm" ? " SIDEARM" : "") +
    (player.downed ? " • DOWNED" : "") +
    (player.cover ? " • IN COVER" : "") +
    (target && !target.dead ? " • TARGET LOCKED" : "") +
    (autoPlay
      ? " • AI PILOT" +
        (frontLineCam ? " • FRONT-LINE CAM" : " • PLAYER CAM") +
        (player.tacticalState ? " • " + player.tacticalState : "")
      : "") +
    (mission.captured ? " • FORT SECURE" : mission.capturing ? " • CAPTURING" : "") +
    (paused ? " • PAUSED" : "");
  const nextHint = paused
    ? "GAME PAUSED"
    : player.downed
      ? player.crawlSettled
        ? "HOLDING COVER — WAIT FOR A REVIVE"
        : "CRAWLING TO COVER"
      : player.dead
        ? "SOLDIER KIA"
        : mission.capturing
          ? "HOLD THE FORTIFICATION — " +
            captureSecondsRemaining(mission).toFixed(1) +
            " SECONDS"
        : waveState === "cleared"
          ? "WAVE CLEAR — PREPARE FOR CONTACT"
          : mission.captured
            ? "DEFEND THE FORT — CONTACT ABOVE AND BELOW"
          : player.reloading
            ? "RELOADING..."
            : "Tap to move • Tap enemy to lock • Hold FIRE";
  if (status.textContent !== nextStatus) status.textContent = nextStatus;
  if (hint.textContent !== nextHint) hint.textContent = nextHint;
  if (hudDirty || now - lastHudUpdate >= 100) {
    updateSquadHud();
    updateCombatHud();
    updatePlayerHud(player);
    if (typeof syncSwapButton === "function") syncSwapButton();
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
  covers = createCover();
  window.__battleCovers = covers;
  ammoDrops.length = 0;
  streetTasks = resetStreetObjectives(streetTasks);
  window.__streetObjectives = streetTasks;
  window.__activeStreetGoal = currentPushGoal(mission, streetTasks);
  applyRunModifiers(player, allies, marines);
  window.__battleMarines = marines;
  resetGrenades();
  resetMarineTimer();
  enemies = createWaveEnemies();
  window.__battleEnemies = enemies;
  started = true;
  rebuildLayers();
  runtime.start();
}
