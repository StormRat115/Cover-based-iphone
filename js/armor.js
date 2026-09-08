import { getTeamProgress, setArmorId } from "./teamProgress.js?v=20260907-121";
import { CHARACTER_STATS, damageReductionPercent } from "./combatStats.js?v=20260907-121";

export const PLAYER_BASE_SPEED = 250;

export const ARMOR_OPTIONS = [
  {
    id: "light",
    name: "LIGHT CARRIER",
    blurb: "Thin plates. Faster, easier to land shots, less protection.",
    defense: -20,
    hitChance: 6,
    speed: 40,
  },
  {
    id: "balanced",
    name: "STANDARD PLATE",
    blurb: "Issue kit. No tradeoffs.",
    defense: 0,
    hitChance: 0,
    speed: 0,
  },
  {
    id: "assault",
    name: "ASSAULT RIG",
    blurb: "Mobile fighting harness. Modest speed and aim, thinner armor.",
    defense: -10,
    hitChance: 3,
    speed: 25,
  },
  {
    id: "heavy",
    name: "HEAVY BALLISTIC",
    blurb: "Thick plates. Harder to drop, slower, shots drift.",
    defense: 45,
    hitChance: -8,
    speed: -45,
  },
  {
    id: "fortress",
    name: "FORTRESS HARNESS",
    blurb: "Max protection. Lowest speed and hit chance.",
    defense: 70,
    hitChance: -12,
    speed: -70,
  },
];

export function getArmor(id) {
  return (
    ARMOR_OPTIONS.find(function (a) {
      return a.id === id;
    }) || ARMOR_OPTIONS[1]
  );
}

export function selectedArmorId() {
  var state = getTeamProgress();
  return getArmor(state.armor).id;
}

export function selectArmor(id) {
  var armor = getArmor(id);
  setArmorId(armor.id);
  return armor;
}

export function applyArmorMods(base, armor) {
  base = base || {};
  armor = typeof armor === "string" ? getArmor(armor) : armor || getArmor("balanced");
  return {
    defense: Math.max(0, (Number(base.defense) || 0) + armor.defense),
    accuracy: (Number(base.accuracy) || 0) + armor.hitChance,
    speed: Math.max(90, (Number(base.speed) || PLAYER_BASE_SPEED) + armor.speed),
    hitChance: armor.hitChance,
  };
}

export function describeArmorStats(armor) {
  armor = typeof armor === "string" ? getArmor(armor) : armor || getArmor("balanced");
  var base = CHARACTER_STATS.player;
  var result = applyArmorMods(
    { defense: base.defense, accuracy: base.accuracy, speed: PLAYER_BASE_SPEED },
    armor,
  );
  return {
    armor: armor,
    defense: result.defense,
    mit: damageReductionPercent(result.defense),
    hitChance: result.accuracy,
    speed: result.speed,
    defenseDelta: armor.defense,
    hitDelta: armor.hitChance,
    speedDelta: armor.speed,
  };
}

export function signed(n) {
  n = Number(n) || 0;
  return (n > 0 ? "+" : "") + n;
}
