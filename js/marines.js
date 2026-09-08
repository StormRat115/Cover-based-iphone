import {
  updateAllies as updateFriendlyAI,
  MARINE_AGGRO,
} from "./allyCore2.js?v=20260908-134";
import { tagMarineFireteams } from "./fireteams.js?v=20260908-134";
import { weaponCopy } from "./weapons.js?v=20260908-134";
import { knifeWeapon } from "./melee.js?v=20260908-134";
import { drawSoldier } from "./soldierAssets.js?v=20260908-134";
import { drawCoverShield } from "./coverSlots.js?v=20260908-134";
import { drawCombatMarks } from "./engaged.js?v=20260908-134";
export { MARINE_AGGRO };

export const INITIAL_MARINE_COUNT = 2;

const MARINE_STARTS = [
  [-130, 330],
  [130, 330],
  [-240, 255],
  [0, 365],
  [240, 255],
];

export function createMarineAt(x, y, index) {
  const weaponId = index % 5 === 4 ? "lmg" : "rifle";
  return {
    name: "Marine " + (index + 1),
    role: index % 5 === 4 ? "support" : "rifleman",
    weapon: weaponCopy(weaponId),
    melee: knifeWeapon(),
    meleeTimer: 0,
    x: x,
    y: y,
    hp: 90,
    maxHp: 90,
    defense: 20,
    accuracy: 0,
    damageBonus: 0,
    dead: false,
    downed: false,
    permanentDeath: true,
    canBeRevived: false,
    canRevive: false,
    canRecover: false,
    deathTimer: 0,
    deathDuration: 0.8,
    muzzle: 0,
    hit: 0,
    targetX: x,
    targetY: y,
    cover: null,
    coverSlotIndex: index % 3,
    speed: index % 5 === 4 ? 205 : 220,
    facingX: 1,
    facingY: 0,
    timeSinceDamage: 99,
    regenDelay: Infinity,
    regenRate: 0,
    callout: "",
    calloutTimer: 0,
    reloadTimer: 0,
    reloading: false,
    kills: 0,
    flankSide: index % 2 ? -1 : 1,
    combatState: "seeking",
    combatTimer: 0,
    shotsLeft: 0,
    coverAnchorX: x,
    coverAnchorY: y,
    exposed: true,
    repositionCooldown: index * 0.12,
    recovering: false,
    isMarine: true,
    yieldsToPlayer: true,
    aggressiveAdvance: true,
  };
}

export function createMarines() {
  const marines = MARINE_STARTS.slice(0, INITIAL_MARINE_COUNT).map(
    function (position, index) {
      return createMarineAt(position[0], position[1], index);
    },
  );
  window.__battleMarines = marines;
  tagMarineFireteams(marines);
  return marines;
}

export function updateMarines(
  marines,
  dt,
  player,
  covers,
  enemies,
  spawnProjectile,
  squad,
) {
  updateFriendlyAI(
    marines,
    dt,
    player,
    covers,
    enemies,
    spawnProjectile,
    "AGGRESSIVE",
    squad,
  );
}

export function drawMarine(ctx, marine, iso) {
  const point = iso(marine.x, marine.y);
  ctx.save();
  ctx.translate(point[0], point[1]);
  if (!marine.dead && marine.hp < marine.maxHp) {
    ctx.fillStyle = "#111";
    ctx.fillRect(-12, -45, 24, 3);
    ctx.fillStyle = "#7fa35d";
    ctx.fillRect(-12, -45, 24 * Math.max(0, marine.hp / marine.maxHp), 3);
  }
  drawSoldier(ctx, marine, {
    team: "marine",
    scale: 0.29,
    alpha: marine.dead ? 0.94 : 1,
  });
  ctx.fillStyle = marine.dead ? "#7d8378" : "#c7e2aa";
  ctx.font = "900 8px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 3;
  ctx.fillText(
    (marine.dead ? "KIA · " : "") + marine.name.toUpperCase(),
    0,
    -44,
  );
  drawCoverShield(ctx, marine, -62);
  drawCombatMarks(ctx, marine);
  ctx.restore();
}
