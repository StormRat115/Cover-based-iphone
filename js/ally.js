import {
  createAllies,
  updateAllies as updateAlliesCore,
  SQUAD_MODES,
} from "./allyCore2.js?v=20260908-134";
import { drawSoldier, leoAtlasReady } from "./soldierAssets.js?v=20260908-134";
import { drawCoverShield } from "./coverSlots.js?v=20260908-134";
import { speak } from "./squadDialog.js?v=20260908-134";
import {
  isLeo,
  LEO_TEMP_FILTER,
  drawLeoGear,
} from "./leoKit.js?v=20260908-134";
import { drawCombatMarks } from "./engaged.js?v=20260908-134";
export { createAllies, SQUAD_MODES };
var ALLY_LINES = {
  contact: ["CONTACT!", "ENEMY SPOTTED!", "I SEE THEM!", "EYES UP!"],
  knight: ["ON ME!", "BREAKING THEIR LINE!", "SWORD OUT!", "HOLD BEHIND THE SHIELD!"],
  fire: [
    "ENGAGING!",
    "SENDING ROUNDS!",
    "KEEP THEIR HEADS DOWN!",
    "ON TARGET!",
  ],
  cover: ["I'M SET!", "HOLDING HERE!", "COVERING!", "GOOD POSITION!"],
  move: ["MOVING!", "COVER ME!", "PUSHING UP!", "REPOSITIONING!"],
  danger: ["TAKING FIRE!", "I'M PINNED!", "GET DOWN!", "ROUNDS INCOMING!"],
  kill: ["TARGET DOWN!", "ONE DOWN!", "GOT ONE!", "HOSTILE DOWN!"],
  calm: ["STAY SHARP.", "WATCH YOUR SECTORS.", "CHECK AMMO.", "STAY WITH ME."],
};
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
function flavor(a, key, chance, duration) {
  if (Math.random() > chance) return;
  speak(a, pick(ALLY_LINES[key]), duration || 1.8);
}
export function updateAllies(
  allies,
  dt,
  player,
  covers,
  enemies,
  spawnProjectile,
  mode,
  otherFriendlies,
) {
  updateAlliesCore(
    allies,
    dt,
    player,
    covers,
    enemies,
    spawnProjectile,
    mode,
    otherFriendlies,
  );
  var alive = enemies.some(function (e) {
    return !e.dead;
  });
  allies.forEach(function (a) {
    if (a.dead || a.downed) return;
    a.flavorClock = (a.flavorClock || 0.8 + Math.random() * 2) - dt;
    a.lastFlavorState = a.lastFlavorState || "";
    if (a.hit > 0) flavor(a, "danger", 0.22, 1.5);
    if (a.combatState !== a.lastFlavorState) {
      if (a.combatState === "seeking") flavor(a, "move", 0.22, 1.35);
      else if (a.combatState === "covered") flavor(a, "cover", 0.16, 1.3);
      else if (a.combatState === "exposed") flavor(a, "fire", 0.2, 1.3);
      a.lastFlavorState = a.combatState;
    }
    if (a.flavorClock <= 0) {
      a.flavorClock = 3.8 + Math.random() * 5.5;
      if (alive && isLeo(a)) flavor(a, "knight", 0.38, 1.4);
      else if (alive) flavor(a, a.exposed ? "fire" : "contact", 0.32, 1.4);
      else flavor(a, "calm", 0.3, 1.5);
    }
  });
}
export function drawAlly(ctx, a, iso) {
  var p = iso(a.x, a.y);
  ctx.save();
  ctx.translate(p[0], p[1]);
  if (a.downed) {
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = "#d85b50";
    ctx.fillRect(-11, -6, 22, 3);
    ctx.fillStyle = "#fff";
    ctx.font = "900 8px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      "DOWNED " + Math.max(0, Math.ceil(a.downDuration - a.downTimer)) + "s",
      0,
      -17,
    );
    ctx.globalAlpha = 1;
  }
  if (!a.dead && !a.downed && a.hp < a.maxHp) {
    ctx.fillStyle = "#111";
    ctx.fillRect(-12, -45, 24, 3);
    ctx.fillStyle = "#58a8ff";
    ctx.fillRect(-12, -45, 24 * Math.max(0, a.hp / a.maxHp), 3);
  }
  drawSoldier(ctx, a, {
    x: 0,
    y: 0,
    team: "ally",
    scale: 0.3,
    alpha: a.dead ? 0.94 : a.downed ? 0.74 : 1,
    recolorFilter: isLeo(a) && !leoAtlasReady() ? LEO_TEMP_FILTER : "",
  });
  if (isLeo(a) && !a.dead && !leoAtlasReady()) drawLeoGear(ctx, a);
  ctx.fillStyle = "#fff";
  ctx.font = "800 8px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 3;
  ctx.fillText((a.name || "ALLY") + " · " + a.weapon.short, 0, -44);
  drawCoverShield(ctx, a, -62);
  drawCombatMarks(ctx, a);
  ctx.restore();
}
