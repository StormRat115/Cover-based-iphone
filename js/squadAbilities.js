import {
  pickTacticalCover,
  applyCoverChoice,
  moveTowardTarget,
  faceThreat,
} from "./combatAI.js?v=20260908-131";
import { occupiesCoverSlot } from "./coverSlots.js?v=20260908-131";
import {
  mitigateDamage,
  attackDamage,
  creditKill,
} from "./combatStats.js?v=20260908-131";
import { isLeo } from "./leoKit.js?v=20260908-131";

// Independent squad abilities. Each character fires their own kit on cooldown.
// StormRat knobs — bump these instead of rewriting the brains.
export const ABILITY_KNOBS = {
  doc: {
    id: "stem",
    cooldown: 16,
    range: 560,
    heal: 48,
    reviveHp: 0.45,
    mark: 1.6,
  },
  rook: {
    id: "mg88",
    cooldown: 26,
    shots: 200,
    fireCooldown: 0.048,
    damage: 14,
    range: 9999,
  },
  viper: {
    id: "heat",
    cooldown: 20,
    duration: 10,
  },
  leo: {
    id: "legionary",
    cooldown: 22,
    duration: 12,
    regenPerSec: 2,
  },
};

function living(actor) {
  return !!(actor && !actor.dead && actor.hp > 0);
}

function ready(actor) {
  return living(actor) && !actor.downed && (actor.abilityCooldown || 0) <= 0;
}

function teamOf(allies, player) {
  var list = (allies || []).slice();
  if (player) list.push(player);
  return list;
}

function named(allies, name) {
  for (var i = 0; i < (allies || []).length; i++) {
    if (allies[i] && allies[i].name === name) return allies[i];
  }
  return null;
}

export function mg88Weapon() {
  var k = ABILITY_KNOBS.rook;
  return {
    id: "mg88",
    name: "MG88",
    short: "MG88",
    damage: k.damage,
    range: k.range,
    cooldown: k.fireCooldown,
    magazine: k.shots,
    reload: 0.2,
    accuracy: 12,
    spread: 2.2,
    pellets: 1,
    role: "support",
    pressure: 16,
    ammo: k.shots,
    reserve: 0,
    infinite: false,
    recoil: 0,
    fireCooldown: 0,
    reloading: false,
  };
}

function pickStemTarget(doc, team) {
  var k = ABILITY_KNOBS.doc,
    downed = [],
    hurt = [],
    i,
    t,
    d;
  for (i = 0; i < team.length; i++) {
    t = team[i];
    if (!t || t === doc || t.dead) continue;
    d = Math.hypot(doc.x - t.x, doc.y - t.y);
    if (d > k.range) continue;
    if (t.downed) downed.push({ t: t, d: d });
    else if (t.hp < t.maxHp) hurt.push({ t: t, hp: t.hp / t.maxHp, d: d });
  }
  downed.sort(function (a, b) {
    return a.d - b.d;
  });
  if (downed.length) return downed[0].t;
  hurt.sort(function (a, b) {
    return a.hp - b.hp || a.d - b.d;
  });
  return hurt.length ? hurt[0].t : null;
}

function fireStem(doc, target) {
  var k = ABILITY_KNOBS.doc;
  if (!target) return false;
  if (target.downed) {
    if (target.revive) target.revive();
    else {
      target.downed = false;
      target.hp = Math.max(30, Math.round(target.maxHp * k.reviveHp));
      target.reviveTimer = 0;
    }
  } else {
    target.hp = Math.min(target.maxHp, target.hp + k.heal);
  }
  target.stemMark = k.mark;
  target.timeSinceDamage = Math.max(target.timeSinceDamage || 0, 0.5);
  doc.abilityCooldown = k.cooldown;
  doc.callout = "STEM OUT";
  doc.calloutTimer = 1.3;
  return true;
}

function startMg88(rook, covers, friendlies, threat) {
  var k = ABILITY_KNOBS.rook;
  if (!rook.cover || !occupiesCoverSlot(rook, 70)) {
    var choice = pickTacticalCover(rook, threat || { x: rook.x, y: rook.y - 400 }, covers || [], friendlies || [], {
      maxTravel: 900,
      desiredRange: 520,
      slotPriority: true,
      allowUnprotected: true,
    });
    if (choice) applyCoverChoice(rook, choice);
    rook.combatState = "seeking";
    rook.mg88Pending = true;
    return true;
  }
  rook.mg88Stash = rook.weapon;
  rook.weapon = mg88Weapon();
  rook.weaponSlot = "primary";
  rook.mg88Active = true;
  rook.mg88Pending = false;
  rook.abilityCooldown = 0;
  rook.exposed = false;
  rook.combatState = "covered";
  rook.callout = "MG88 UP";
  rook.calloutTimer = 1.4;
  return true;
}

function finishMg88(rook) {
  if (rook.mg88Stash) rook.weapon = rook.mg88Stash;
  rook.mg88Stash = null;
  rook.mg88Active = false;
  rook.mg88Pending = false;
  rook.abilityCooldown = ABILITY_KNOBS.rook.cooldown;
}

function fireMg88(rook, enemies, spawnProjectile, covers) {
  var gun = rook.weapon;
  if (!gun || gun.id !== "mg88") return;
  if (gun.ammo <= 0) {
    finishMg88(rook);
    return;
  }
  if (gun.fireCooldown > 0) return;
  var target = null,
    best = Infinity;
  (enemies || []).forEach(function (e) {
    if (!living(e) || e.downed || e.spawnTimer > 0) return;
    if (e.engaged) return;
    var d = Math.hypot(rook.x - e.x, rook.y - e.y);
    if (d < best) {
      best = d;
      target = e;
    }
  });
  if (!target) {
    (enemies || []).forEach(function (e) {
      if (!living(e) || e.downed || e.spawnTimer > 0) return;
      var d = Math.hypot(rook.x - e.x, rook.y - e.y);
      if (d < best) {
        best = d;
        target = e;
      }
    });
  }
  if (!target) return;
  faceThreat(rook, target);
  gun.ammo--;
  gun.fireCooldown = gun.cooldown;
  rook.muzzle = 0.08;
  rook.shotsLeft = gun.ammo;
  if (spawnProjectile) spawnProjectile(rook, target, "ally", 1);
  var dealt = mitigateDamage(attackDamage(gun.damage, rook.damageBonus), target.defense);
  target.hp = Math.max(0, target.hp - dealt);
  target.lastDamageTaken = dealt;
  target.hit = 0.12;
  if (target.hp <= 0) {
    target.hp = 0;
    target.dead = true;
    target.deathTimer = 0;
    creditKill(rook);
  }
  if (gun.ammo <= 0) finishMg88(rook);
}

function startHeat(viper, player) {
  var k = ABILITY_KNOBS.viper;
  viper.heatRounds = k.duration;
  if (player && !player.dead) player.heatRounds = k.duration;
  viper.abilityCooldown = k.cooldown;
  viper.callout = "HEAT ROUNDS";
  viper.calloutTimer = 1.5;
}

function startLegionary(leo) {
  var k = ABILITY_KNOBS.leo;
  leo.legionaryTimer = k.duration;
  leo.abilityRegenOverride = true;
  leo.abilityCooldown = k.cooldown;
  leo.callout = "LEGIONARY";
  leo.calloutTimer = 1.4;
}

export function hasPerfectHit(actor) {
  return !!actor && (actor.heatRounds || 0) > 0;
}

export function tickSquadAbilities(allies, player, dt, covers, enemies, spawnProjectile, friendlies) {
  var team = teamOf(allies, player);
  var hostiles = (enemies || []).filter(function (e) {
    return living(e) && !e.downed && !(e.spawnTimer > 0);
  });
  var inCombat = hostiles.length > 0;
  team.forEach(function (a) {
    if (!a) return;
    a.abilityCooldown = Math.max(0, (a.abilityCooldown || 0) - dt);
    if ((a.heatRounds || 0) > 0) a.heatRounds = Math.max(0, a.heatRounds - dt);
    if ((a.stemMark || 0) > 0) a.stemMark = Math.max(0, a.stemMark - dt);
    if ((a.legionaryTimer || 0) > 0) {
      a.legionaryTimer = Math.max(0, a.legionaryTimer - dt);
      if (living(a) && !a.downed)
        a.hp = Math.min(a.maxHp, a.hp + ABILITY_KNOBS.leo.regenPerSec * dt);
      if (a.legionaryTimer <= 0) a.abilityRegenOverride = false;
    } else if (a.abilityRegenOverride && !a.legionaryTimer) {
      a.abilityRegenOverride = false;
    }
    if (a.weapon && a.weapon.id === "mg88" && a.weapon.fireCooldown > 0)
      a.weapon.fireCooldown = Math.max(0, a.weapon.fireCooldown - dt);
  });
  if (player && (player.heatRounds || 0) > 0 && team.indexOf(player) < 0)
    player.heatRounds = Math.max(0, player.heatRounds - dt);

  var doc = named(allies, "Doc");
  var rook = named(allies, "Rook");
  var viper = named(allies, "Viper");
  var leo = named(allies, "Leo") || (allies || []).filter(isLeo)[0];

  if (doc && ready(doc) && inCombat) {
    var stem = pickStemTarget(doc, team);
    if (stem) fireStem(doc, stem);
  }

  if (rook && living(rook) && !rook.downed) {
    if (rook.mg88Active) {
      if (rook.cover && Number.isFinite(rook.coverAnchorX)) {
        rook.targetX = rook.coverAnchorX;
        rook.targetY = rook.coverAnchorY;
        if (Math.hypot(rook.x - rook.coverAnchorX, rook.y - rook.coverAnchorY) > 8)
          moveTowardTarget(rook, dt, 1.1);
        else {
          rook.x = rook.coverAnchorX;
          rook.y = rook.coverAnchorY;
        }
      }
      fireMg88(rook, hostiles, spawnProjectile, covers);
    } else if (rook.mg88Pending) {
      if (rook.cover && !occupiesCoverSlot(rook, 58)) {
        rook.combatState = "seeking";
        moveTowardTarget(rook, dt, 1.16);
      } else if (rook.cover) startMg88(rook, covers, friendlies || team, hostiles[0]);
      else if (ready(rook) && inCombat)
        startMg88(rook, covers, friendlies || team, hostiles[0]);
    } else if (ready(rook) && inCombat) {
      startMg88(rook, covers, friendlies || team, hostiles[0]);
    }
  }

  if (viper && ready(viper) && inCombat) startHeat(viper, player);
  if (leo && ready(leo) && inCombat) startLegionary(leo);
}

export function abilityBusy(actor) {
  return !!(actor && (actor.mg88Active || actor.mg88Pending));
}
