import { getTeamProgress, spendSkill } from "./teamProgress.js?v=20260908-133";

export const SKILL_BRANCHES = [
  {
    id: "combat",
    name: "COMBAT",
    color: "#d8a15a",
    nodes: [
      { id: "combat.damage", name: "KINETIC EDGE", desc: "+4 player damage", parent: null },
      { id: "combat.firerate", name: "RAPID CYCLE", desc: "15% faster player fire rate", parent: "combat.damage" },
      { id: "combat.reload", name: "SPEED RELOAD", desc: "20% faster player reload", parent: "combat.firerate" },
      { id: "combat.veteran", name: "VETERAN", desc: "+6 damage and +3 accuracy", parent: "combat.reload" },
    ],
  },
  {
    id: "grenade",
    name: "GRENADES",
    color: "#e07a4a",
    nodes: [
      { id: "grenade.unlock", name: "FRAG READY", desc: "Player throws a grenade every 18s", parent: null },
      { id: "grenade.ally", name: "SQUAD FRAGS", desc: "Allies also throw grenades", parent: "grenade.unlock" },
      { id: "grenade.frag", name: "HE FRAG", desc: "Larger blast and more damage", parent: "grenade.ally" },
      { id: "grenade.storm", name: "STORM POUCH", desc: "Grenade cooldown 11s", parent: "grenade.frag" },
    ],
  },
  {
    id: "squad",
    name: "SQUAD",
    color: "#6db4e3",
    nodes: [
      { id: "squad.hp", name: "FIELD MEDIC", desc: "+25 ally max HP", parent: null },
      { id: "squad.accuracy", name: "MARKSMAN DRILL", desc: "+4 ally accuracy", parent: "squad.hp" },
      { id: "squad.damage", name: "SQUAD FIREPOWER", desc: "+5 ally damage", parent: "squad.accuracy" },
      { id: "squad.iron", name: "IRON LINE", desc: "+20 ally defense and +15 HP", parent: "squad.damage" },
    ],
  },
  {
    id: "marine",
    name: "MARINES",
    color: "#8fbf6a",
    nodes: [
      { id: "marine.hp", name: "PLATE UP", desc: "+20 marine HP and +10 defense", parent: null },
      { id: "marine.accuracy", name: "RIFLE SCHOOL", desc: "+3 marine accuracy and +3 damage", parent: "marine.hp" },
      { id: "marine.reinforce", name: "REINFORCE", desc: "Spawn a marine every 60 seconds", parent: "marine.accuracy" },
      { id: "marine.company", name: "COMPANY", desc: "Spawn every 40s and +1 starting marine", parent: "marine.reinforce" },
    ],
  },
];

export const SKILL_NODES = (function () {
  var map = {};
  SKILL_BRANCHES.forEach(function (b) {
    b.nodes.forEach(function (n) {
      map[n.id] = Object.assign({ branch: b.id }, n);
    });
  });
  return map;
})();

export function isNodeUnlocked(id, spent) {
  var node = SKILL_NODES[id];
  if (!node) return false;
  if (!node.parent) return true;
  spent = spent || (getTeamProgress().spent || {});
  return (spent[node.parent] || 0) > 0;
}

export function canBuySkill(id) {
  var state = getTeamProgress();
  if (state.unspent <= 0) return false;
  if ((state.spent[id] || 0) > 0) return false;
  return isNodeUnlocked(id, state.spent);
}

export function buySkill(id) {
  if (!canBuySkill(id)) return getTeamProgress();
  return spendSkill(id);
}

export function computeSkillMods(spent) {
  spent = spent || (getTeamProgress().spent || {});
  var owned = function (id) {
    return (spent[id] || 0) > 0;
  };
  return {
    playerDamage: (owned("combat.damage") ? 4 : 0) + (owned("combat.veteran") ? 6 : 0),
    playerFireRate: owned("combat.firerate") ? 0.85 : 1,
    playerReload: owned("combat.reload") ? 0.8 : 1,
    playerAccuracy: owned("combat.veteran") ? 3 : 0,
    grenades: owned("grenade.unlock"),
    allyGrenades: owned("grenade.ally"),
    grenadeRadius: owned("grenade.frag") ? 210 : 150,
    grenadeDamage: owned("grenade.frag") ? 62 : 38,
    grenadeCooldown: owned("grenade.storm") ? 11 : 18,
    allyHp: (owned("squad.hp") ? 25 : 0) + (owned("squad.iron") ? 15 : 0),
    allyAccuracy: owned("squad.accuracy") ? 4 : 0,
    allyDamage: owned("squad.damage") ? 5 : 0,
    allyDefense: owned("squad.iron") ? 20 : 0,
    marineHp: owned("marine.hp") ? 20 : 0,
    marineDefense: owned("marine.hp") ? 10 : 0,
    marineAccuracy: owned("marine.accuracy") ? 3 : 0,
    marineDamage: owned("marine.accuracy") ? 3 : 0,
    marineSpawn: owned("marine.reinforce"),
    marineSpawnInterval: owned("marine.company") ? 40 : 60,
    extraMarine: owned("marine.company") ? 1 : 0,
  };
}

export function getSkillMods() {
  return computeSkillMods();
}

if (typeof window !== "undefined") {
  window.__skillMods = getSkillMods();
}
