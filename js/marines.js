import { updateAllies as updateFriendlyAI } from "./allyCore2.js?v=20260905-66";
import { weaponCopy } from "./weapons.js?v=20260905-66";
import { drawSoldier } from "./soldierAssets.js?v=20260905-66";

const MARINE_STARTS = [
  [-240, 255],
  [-130, 330],
  [0, 365],
  [130, 330],
  [240, 255],
];

export function createMarines() {
  const marines = MARINE_STARTS.map(function (position, index) {
    const weaponId = index === 4 ? "lmg" : "rifle";
    return {
      name: "Marine " + (index + 1),
      role: index === 4 ? "support" : "rifleman",
      weapon: weaponCopy(weaponId),
      x: position[0],
      y: position[1],
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
      targetX: position[0],
      targetY: position[1],
      cover: null,
      coverSlotIndex: index % 3,
      speed: index === 4 ? 205 : 220,
      facingX: 1,
      facingY: 0,
      timeSinceDamage: 99,
      regenDelay: Infinity,
      regenRate: 0,
      callout: "",
      calloutTimer: 0,
      reloadTimer: 0,
      reloading: false,
      flankSide: index % 2 ? -1 : 1,
      combatState: "seeking",
      combatTimer: 0,
      shotsLeft: 0,
      coverAnchorX: position[0],
      coverAnchorY: position[1],
      exposed: true,
      repositionCooldown: index * 0.12,
      recovering: false,
      isMarine: true,
      aggressiveAdvance: true,
    };
  });
  window.__battleMarines = marines;
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
    "ASSAULT",
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
  ctx.restore();
}
