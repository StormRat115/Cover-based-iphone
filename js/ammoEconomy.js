/* Generous primary reserves, street pickups, and an infinite sidearm. */

export const SIDEARMS = {
  pistol: {
    id: "pistol",
    name: "SERVICE PISTOL",
    short: "PISTOL",
    damage: 16,
    range: 1050,
    cooldown: 0.42,
    magazine: 15,
    reload: 0.85,
    accuracy: 2,
    spread: 2.7,
    pellets: 1,
    role: "backup",
    pressure: 2,
    infinite: true,
    blurb: "Clean iron sights. Reliable stopgap.",
  },
  magnum: {
    id: "magnum",
    name: "STREET MAGNUM",
    short: "MAGNUM",
    damage: 34,
    range: 980,
    cooldown: 0.62,
    magazine: 6,
    reload: 1.15,
    accuracy: 3,
    spread: 2.1,
    pellets: 1,
    role: "backup",
    pressure: 3,
    infinite: true,
    blurb: "Heavy punch, slower follow-up.",
  },
  machinePistol: {
    id: "machinePistol",
    name: "MACHINE PISTOL",
    short: "M-PISTOL",
    damage: 11,
    range: 880,
    cooldown: 0.12,
    magazine: 20,
    reload: 1.05,
    accuracy: -4,
    spread: 7.4,
    pellets: 1,
    role: "backup",
    pressure: 4,
    infinite: true,
    blurb: "Spray to keep heads down.",
  },
};

export const AMMO = {
  pickupRadius: 54,
  reserveCapMult: 12,
  dropChance: 0.62,
  waveDrops: 3,
  killAmountMin: 18,
  killAmountMax: 42,
};

export function startingReserve(weapon) {
  if (!weapon) return 0;
  if (weapon.infinite || weapon.role === "backup") return Infinity;
  var mag = weapon.magazine || 24;
  if (weapon.id === "lmg") return mag * 6;
  if (weapon.id === "shotgun") return mag * 9;
  if (weapon.id === "sniper") return mag * 8;
  return mag * 7;
}

export function reserveCap(weapon) {
  if (!weapon || weapon.infinite) return Infinity;
  return (weapon.magazine || 24) * AMMO.reserveCapMult;
}

export function prepareWeaponAmmo(weapon) {
  if (!weapon) return weapon;
  if (weapon.infinite || weapon.role === "backup") {
    weapon.infinite = true;
    weapon.reserve = Infinity;
  } else if (!Number.isFinite(weapon.reserve)) {
    weapon.reserve = startingReserve(weapon);
  }
  if (!Number.isFinite(weapon.ammo)) weapon.ammo = weapon.magazine;
  return weapon;
}

export function isPrimaryDry(weapon) {
  if (!weapon || weapon.infinite) return false;
  return (weapon.ammo || 0) <= 0 && (weapon.reserve || 0) <= 0;
}

export function canReloadFromReserve(weapon) {
  if (!weapon) return false;
  if (weapon.ammo >= weapon.magazine) return false;
  if (weapon.infinite) return true;
  return (weapon.reserve || 0) > 0;
}

export function finishReload(weapon) {
  if (!weapon) return weapon;
  if (weapon.infinite) {
    weapon.ammo = weapon.magazine;
    return weapon;
  }
  var need = Math.max(0, weapon.magazine - (weapon.ammo || 0));
  var take = Math.min(need, Math.max(0, weapon.reserve || 0));
  weapon.reserve = Math.max(0, (weapon.reserve || 0) - take);
  weapon.ammo = (weapon.ammo || 0) + take;
  return weapon;
}

export function addReserve(weapon, amount) {
  if (!weapon || weapon.infinite) return 0;
  var before = weapon.reserve || 0;
  weapon.reserve = Math.min(reserveCap(weapon), before + Math.max(0, amount || 0));
  return weapon.reserve - before;
}

export function createAmmoDrop(x, y, amount, kind) {
  return {
    x: x,
    y: y,
    amount: Math.max(8, Math.round(amount || 24)),
    kind: kind || "mixed",
    life: 42,
    bob: Math.random() * Math.PI,
  };
}

export function spawnKillAmmo(enemy, random) {
  random = random || Math.random;
  if (!enemy || random() > AMMO.dropChance) return null;
  var amount =
    AMMO.killAmountMin +
    Math.round(random() * (AMMO.killAmountMax - AMMO.killAmountMin));
  if (enemy.type === "heavy" || enemy.type === "charger") amount += 14;
  return createAmmoDrop(
    enemy.x + (random() - 0.5) * 36,
    enemy.y + (random() - 0.5) * 28,
    amount,
    "kill",
  );
}

export function spawnWaveAmmo(anchor, count, random) {
  random = random || Math.random;
  var drops = [];
  var n = count == null ? AMMO.waveDrops : count;
  for (var i = 0; i < n; i++) {
    drops.push(
      createAmmoDrop(
        ((anchor && anchor.x) || 0) + (random() - 0.5) * 220,
        ((anchor && anchor.y) || 0) + (random() - 0.5) * 160,
        28 + Math.round(random() * 24),
        "wave",
      ),
    );
  }
  return drops;
}

export function updateAmmoDrops(drops, player, dt) {
  if (!drops || !player) return 0;
  var picked = 0;
  for (var i = drops.length - 1; i >= 0; i--) {
    var d = drops[i];
    d.life -= dt;
    d.bob += dt * 3;
    if (d.life <= 0) {
      drops.splice(i, 1);
      continue;
    }
    if (player.dead) continue;
    var dist = Math.hypot(player.x - d.x, player.y - d.y);
    if (dist <= AMMO.pickupRadius) {
      var weapon = player.primary || player.weapon;
      addReserve(weapon, d.amount);
      picked += d.amount;
      drops.splice(i, 1);
    }
  }
  return picked;
}

export function drawAmmoDrops(ctx, iso, drops) {
  (drops || []).forEach(function (d) {
    var p = iso(d.x, d.y);
    var lift = Math.sin(d.bob) * 2;
    ctx.save();
    ctx.translate(p[0], p[1] + lift);
    ctx.fillStyle = "#0008";
    ctx.beginPath();
    ctx.ellipse(0, 8, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a7a32";
    ctx.strokeStyle = "#e8f3b4";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-13, -11, 26, 18, 3);
    else ctx.rect(-13, -11, 26, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f4ffc8";
    ctx.font = "900 10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AMMO", 0, -1);
    ctx.restore();
  });
}

export function shouldSwapToSidearm(player) {
  if (!player || player.dead || player.downed) return false;
  if (player.weaponSlot === "sidearm") return false;
  if (isPrimaryDry(player.primary || player.weapon)) return true;
  return !!(player.hardPinSwap);
}

export function getSidearm(id) {
  return SIDEARMS[id] || SIDEARMS.pistol;
}
