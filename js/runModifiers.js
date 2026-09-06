import { CHARACTER_STATS } from "./combatStats.js?v=20260906-94";
import { getSkillMods } from "./skillTree.js?v=20260906-94";
import { applyArmorMods, selectedArmorId, PLAYER_BASE_SPEED } from "./armor.js?v=20260906-94";
import { createMarineAt } from "./marines.js?v=20260906-94";

export function applyRunModifiers(player, allies, marines) {
  var mods = getSkillMods();
  var armor = applyArmorMods(
    {
      defense: CHARACTER_STATS.player.defense,
      accuracy: CHARACTER_STATS.player.accuracy,
      speed: PLAYER_BASE_SPEED,
    },
    selectedArmorId(),
  );
  if (player) {
    player.defense = armor.defense;
    player.accuracy = armor.accuracy + mods.playerAccuracy;
    player.damageBonus = CHARACTER_STATS.player.damage + mods.playerDamage;
    player.speed = armor.speed;
    player.maxHp = CHARACTER_STATS.player.hp;
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    if (player.weapon) {
      player.weapon.cooldown = Math.max(0.08, player.weapon.cooldown * mods.playerFireRate);
      player.weapon.reload = Math.max(0.45, player.weapon.reload * mods.playerReload);
    }
    player.isPlayer = true;
  }
  (allies || []).forEach(function (a) {
    var base = CHARACTER_STATS[a.name] || CHARACTER_STATS.player;
    a.maxHp = base.hp + mods.allyHp;
    a.hp = Math.min(a.maxHp, a.hp + mods.allyHp);
    a.defense = base.defense + mods.allyDefense;
    a.accuracy = base.accuracy + mods.allyAccuracy;
    a.damageBonus = base.damage + mods.allyDamage;
  });
  (marines || []).forEach(function (m) {
    applyMarineMods(m, mods);
  });
  if (mods.extraMarine && marines) {
    var extras = marines.filter(function (m) {
      return m.skillSpawned;
    }).length;
    if (extras < mods.extraMarine) {
      var add = createMarineAt(90, 300, marines.length);
      add.skillSpawned = true;
      applyMarineMods(add, mods);
      marines.push(add);
    }
  }
  if (typeof window !== "undefined") {
    window.__skillMods = mods;
    window.__runArmor = armor;
  }
  return mods;
}

export function applyMarineMods(marine, mods) {
  mods = mods || getSkillMods();
  if (!marine || marine._skillApplied) return marine;
  marine.maxHp = (marine.maxHp || 90) + mods.marineHp;
  marine.hp = Math.min(marine.maxHp, (marine.hp || marine.maxHp) + mods.marineHp);
  marine.defense = (marine.defense || 20) + mods.marineDefense;
  marine.accuracy = (marine.accuracy || 0) + mods.marineAccuracy;
  marine.damageBonus = (marine.damageBonus || 0) + mods.marineDamage;
  marine._skillApplied = true;
  return marine;
}

export function updateMarineReinforcements(dt, marines, player, onSpawn) {
  var mods = getSkillMods();
  if (!mods.marineSpawn) return null;
  if (typeof window === "undefined") return null;
  window.__marineSpawnTimer =
    window.__marineSpawnTimer == null ? mods.marineSpawnInterval : window.__marineSpawnTimer;
  window.__marineSpawnTimer -= dt;
  if (window.__marineSpawnTimer > 0) return null;
  window.__marineSpawnTimer = mods.marineSpawnInterval;
  if (!player || player.dead) return null;
  var marine = createMarineAt(player.x + 40, player.y + 55, (marines || []).length);
  marine.skillSpawned = true;
  applyMarineMods(marine, mods);
  if (marines) marines.push(marine);
  if (onSpawn) onSpawn(marine);
  return marine;
}

export function resetMarineTimer() {
  if (typeof window === "undefined") return;
  var mods = getSkillMods();
  window.__marineSpawnTimer = mods.marineSpawnInterval;
}
