let elements = null;
import { getHitChance } from "./cover.js?v=20260905-66";
import { finalAccuracy } from "./combatStats.js?v=20260905-66";

function nearestEnemy(p, enemies) {
  var best = null,
    bd = Infinity;
  (enemies || []).forEach(function (e) {
    if (e && !e.dead) {
      var d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
  });
  return best;
}
function ensure() {
  if (elements) return;
  var old = document.getElementById("loadout");
  if (old) old.style.display = "none";
  var top = document.getElementById("playerHealthTop");
  if (top) top.style.display = "none";
  if (document.getElementById("combatHud")) return;
  var style = document.createElement("style");
  style.textContent =
    '#combatHud{position:absolute;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));width:min(330px,48vw);padding:10px 12px;border:1px solid #ffffff44;border-radius:12px;background:#10181ddd;pointer-events:none;text-shadow:0 2px 4px #000}#combatHudTop{display:flex;align-items:center;gap:10px}.combatHealthMain{flex:1}.combatHealthText{font:900 9px system-ui;letter-spacing:.7px;margin-bottom:4px}.combatHealthTrack{height:10px;border:1px solid #ffffff55;border-radius:6px;background:#101714;overflow:hidden}#combatHealthFill{height:100%;width:100%;background:#63c66b}.regenRing{position:relative;width:42px;height:42px;border-radius:50%;background:conic-gradient(#71c77b 0deg,#ffffff18 0);border:1px solid #ffffff44;display:grid;place-items:center}.regenRing:after{content:"";position:absolute;inset:5px;border-radius:50%;background:#10181d}.regenRing span{position:relative;z-index:1;font:900 8px system-ui;text-align:center}.combatWeapon{margin-top:8px;padding-top:7px;border-top:1px solid #ffffff22;display:flex;justify-content:space-between;align-items:end}.combatChance{font:950 13px system-ui}.combatChance small{display:block;font:800 7px system-ui;opacity:.65}.combatAmmo{text-align:right;font:950 15px system-ui}.combatAmmo small{display:block;font:800 7px system-ui;opacity:.65}@media(max-width:700px){#combatHud{right:8px;bottom:8px;width:245px;padding:8px 9px}.regenRing{width:38px;height:38px}}';
  document.head.appendChild(style);
  var hud = document.createElement("div");
  hud.id = "combatHud";
  hud.innerHTML =
    '<div id="combatHudTop"><div class="combatHealthMain"><div id="combatHealthText" class="combatHealthText">PLAYER</div><div class="combatHealthTrack"><div id="combatHealthFill"></div></div></div><div id="regenRing" class="regenRing"><span id="regenText">READY</span></div></div><div class="combatWeapon"><div id="hitChance" class="combatChance">--%<small>HIT CHANCE</small></div><div id="combatAmmo" class="combatAmmo">-- / --<small>AMMO</small></div></div>';
  document.getElementById("hud").appendChild(hud);
  elements = {};
  for (const id of [
    "combatHealthFill",
    "combatHealthText",
    "regenRing",
    "regenText",
    "hitChance",
    "combatAmmo",
  ]) {
    elements[id] = document.getElementById(id);
  }
}
export function updateCombatHud() {
  ensure();
  var p = window.__battlePlayer;
  if (!p) return;
  var enemies = window.__battleEnemies || [],
    covers = window.__battleCovers || [],
    target =
      p.aimTarget && !p.aimTarget.dead ? p.aimTarget : nearestEnemy(p, enemies),
    pct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100)),
    fill = elements.combatHealthFill;
  fill.style.width = pct + "%";
  fill.style.background =
    pct > 55 ? "#63c66b" : pct > 25 ? "#d6b74d" : "#d85b50";
  elements.combatHealthText.textContent =
    "HP " + Math.ceil(p.hp) + " / " + p.maxHp + " · DEF " + (p.defense || 0);
  var delay = p.regenDelay || 3,
    remaining = Math.max(0, delay - (p.timeSinceDamage || 0)),
    progress = remaining <= 0 ? 1 : 1 - remaining / delay,
    ring = elements.regenRing;
  ring.style.background =
    "conic-gradient(#71c77b " + Math.round(progress * 360) + "deg,#ffffff18 0)";
  elements.regenText.textContent =
    remaining > 0 ? remaining.toFixed(1) + "s" : "REGEN";
  var chance = "--";
  if (target) {
    chance = Math.round(
      finalAccuracy(
        getHitChance(p, target, covers),
        p.weapon.accuracy,
        p.accuracy,
      ),
    );
  }
  elements.hitChance.firstChild.nodeValue = chance + "%";
  elements.combatAmmo.firstChild.nodeValue =
    p.weapon.ammo + " / " + p.weapon.magazine;
}
