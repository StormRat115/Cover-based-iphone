import { getHitChance } from "./cover.js?v=20260905-63";
import { weaponCopy } from "./weapons.js?v=20260905-63";
import { drawSoldier } from "./soldierAssets.js?v=20260905-63";
import {
  CHARACTER_STATS,
  mitigateDamage,
  finalAccuracy,
  attackDamage,
} from "./combatStats.js?v=20260905-63";
let shotHud = null,
  weaponHud = null,
  shotFeedbackTime = 0,
  lastWeaponHtml = "";
function getShotHud() {
  if (shotHud) return shotHud;
  shotHud = document.createElement("div");
  shotHud.id = "shotFeedback";
  shotHud.style.cssText =
    "position:fixed;left:50%;top:calc(50% + 8px);transform:translate(-50%,-50%);padding:4px 8px;border-radius:6px;background:#111a;color:#ff9a82;font:900 13px system-ui;letter-spacing:1.5px;text-shadow:0 2px 4px #000;z-index:7;pointer-events:none;display:none";
  document.body.appendChild(shotHud);
  return shotHud;
}
function getWeaponHud() {
  if (weaponHud) return weaponHud;
  weaponHud = document.createElement("div");
  weaponHud.id = "weaponHud";
  weaponHud.style.cssText =
    "position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom) + 112px);padding:7px 10px;border:1px solid #ffffff22;border-radius:8px;background:#101714dd;color:#e8eee9;font:900 10px system-ui;letter-spacing:1px;text-align:right;text-shadow:0 2px 4px #000;z-index:5;pointer-events:none";
  document.body.appendChild(weaponHud);
  return weaponHud;
}
function showShotFeedback(hit) {
  var h = getShotHud();
  h.textContent = hit ? "HIT" : "MISS";
  h.style.color = hit ? "#b8f28c" : "#ff9a82";
  h.style.display = "block";
  shotFeedbackTime = hit ? 0.18 : 0.42;
}
export function updatePlayerHud(p) {
  var h = getWeaponHud();
  const html =
    '<div style="color:#9edcff">' +
    p.weapon.name +
    '</div><div style="font-size:16px;margin-top:2px">' +
    p.weapon.ammo +
    " / " +
    p.weapon.magazine +
    '</div><div style="font-size:9px;margin-top:2px;color:#a9b7bd">HP ' +
    Math.ceil(p.hp) +
    " / " +
    p.maxHp +
    " · DEF " +
    p.defense +
    " · ACC +" +
    p.accuracy +
    "</div>" +
    (p.reloading
      ? '<div style="color:#f2d36b;font-size:9px;margin-top:2px">RELOADING</div>'
      : "");
  if (html !== lastWeaponHtml) {
    h.innerHTML = html;
    lastWeaponHtml = html;
  }
}
export function createPlayer() {
  var selected =
      (typeof window !== "undefined" &&
        window.__selectedLoadout &&
        window.__selectedLoadout.player) ||
      "rifle",
    stats = CHARACTER_STATS.player;
  var p = {
    x: 0,
    y: 120,
    tx: 0,
    ty: 120,
    hp: stats.hp,
    maxHp: stats.hp,
    defense: stats.defense,
    accuracy: stats.accuracy,
    damageBonus: stats.damage,
    speed: 250,
    state: "idle",
    anim: 0,
    cover: null,
    coverTarget: null,
    coverBlend: 0,
    aimTarget: null,
    reloading: false,
    reloadTimer: 0,
    shootTimer: 0,
    peek: 0,
    peekSide: 1,
    hitFlash: 0,
    dead: false,
    downed: false,
    downTimer: 0,
    downDuration: 12,
    reviveTimer: 0,
    reviveDuration: 2.6,
    regenDelay: 3,
    regenRate: stats.regen,
    timeSinceDamage: 99,
    weapon: weaponCopy(selected),
    keyboardMove: null,
    facingX: 1,
    facingY: 0,
    lastShotHit: false,
    deathTimer: 0,
    deathDuration: 0.8,
    setWeapon: function (id) {
      if (this.dead || this.downed || this.reloading) return;
      this.weapon = weaponCopy(id);
    },
    setDestination: function (x, y, cover) {
      if (this.dead || this.downed) return;
      this.keyboardMove = null;
      this.cover = null;
      this.coverTarget = cover || null;
      this.tx = x;
      this.ty = y;
      this.state = "walk";
    },
    setKeyboardMove: function (v) {
      if (this.dead || this.downed) return;
      this.keyboardMove = v;
      this.cover = null;
      this.coverTarget = null;
      this.coverBlend = 0;
      this.tx = this.x;
      this.ty = this.y;
      if (v) {
        this.facingX = v.x;
        this.facingY = v.y;
        this.state = "walk";
      } else if (this.state === "walk") this.state = "idle";
    },
    startReload: function () {
      if (
        this.dead ||
        this.downed ||
        this.reloading ||
        this.weapon.ammo === this.weapon.magazine
      )
        return;
      this.reloading = true;
      this.reloadTimer = this.weapon.reload;
      this.state = "reload";
    },
    fireAt: function (enemy) {
      if (
        this.dead ||
        this.downed ||
        this.reloading ||
        this.weapon.ammo <= 0 ||
        this.weapon.fireCooldown > 0
      )
        return false;
      var dx = enemy.x - this.x,
        dy = enemy.y - this.y,
        d = Math.hypot(dx, dy) || 1;
      this.facingX = dx / d;
      this.facingY = dy / d;
      var chance = finalAccuracy(
        getHitChance(this, enemy, window.__battleCovers || []),
        this.weapon.accuracy,
        this.accuracy,
      );
      enemy.lastHitChance = chance;
      this.weapon.ammo--;
      this.weapon.fireCooldown = this.weapon.cooldown;
      this.weapon.recoil = this.weapon.cooldown;
      this.state = "shoot";
      this.shootTimer = Math.min(0.22, this.weapon.cooldown);
      this.peek = 0.22;
      this.peekSide = this.cover
        ? Math.abs(enemy.x - this.cover.x) >= Math.abs(enemy.y - this.cover.y)
          ? enemy.x < this.cover.x
            ? -1
            : 1
          : enemy.y < this.cover.y
            ? -1
            : 1
        : 1;
      var hit = Math.random() * 100 < chance;
      this.lastShotHit = hit;
      showShotFeedback(hit);
      if (hit) {
        var raw = attackDamage(this.weapon.damage, this.damageBonus),
          dealt = mitigateDamage(raw, enemy.defense);
        enemy.hp -= dealt;
        enemy.lastDamageTaken = dealt;
        if (enemy.hp <= 0) {
          enemy.hp = 0;
          enemy.dead = true;
          enemy.deathTimer = 0;
        }
      }
      return hit;
    },
    takeDamage: function (amount) {
      if (this.dead || this.downed) return;
      var dealt = mitigateDamage(amount, this.defense);
      this.hp = Math.max(0, this.hp - dealt);
      this.lastDamageTaken = dealt;
      this.timeSinceDamage = 0;
      this.hitFlash = 0.18;
      if (this.hp <= 0) this.triggerDowned();
    },
    triggerDowned: function () {
      if (this.dead || this.downed) return;
      this.downed = true;
      this.downTimer = 0;
      this.reviveTimer = 0;
      this.state = "downed";
      this.reloading = false;
      this.shootTimer = 0;
      this.peek = 0;
      this.keyboardMove = null;
      this.cover = null;
      this.coverTarget = null;
    },
    revive: function () {
      if (this.dead) return false;
      this.downed = false;
      this.hp = Math.max(35, Math.round(this.maxHp * 0.4));
      this.downTimer = 0;
      this.reviveTimer = 0;
      this.timeSinceDamage = 0;
      this.state = "idle";
      return true;
    },
    triggerDeath: function () {
      if (this.dead) return;
      if (this.downed) {
        this.dead = true;
        this.downed = false;
        this.state = "dead";
        this.deathTimer = 0;
        return;
      }
      this.triggerDowned();
    },
    reset: function () {
      shotFeedbackTime = 0;
      if (shotHud) shotHud.style.display = "none";
      var id =
        (window.__selectedLoadout && window.__selectedLoadout.player) ||
        this.weapon.id ||
        "rifle";
      Object.assign(this, {
        x: 0,
        y: 120,
        tx: 0,
        ty: 120,
        hp: stats.hp,
        maxHp: stats.hp,
        defense: stats.defense,
        accuracy: stats.accuracy,
        damageBonus: stats.damage,
        regenRate: stats.regen,
        state: "idle",
        anim: 0,
        cover: null,
        coverTarget: null,
        coverBlend: 0,
        aimTarget: null,
        reloading: false,
        reloadTimer: 0,
        shootTimer: 0,
        peek: 0,
        peekSide: 1,
        hitFlash: 0,
        dead: false,
        downed: false,
        downTimer: 0,
        reviveTimer: 0,
        timeSinceDamage: 99,
        keyboardMove: null,
        facingX: 1,
        facingY: 0,
        lastShotHit: false,
        lastDamageTaken: 0,
        recovering: false,
        recoveryCoverChosen: false,
        targetX: undefined,
        targetY: undefined,
        exposed: undefined,
        __lastSoldierState: undefined,
        __visualFacing: undefined,
        __faceLockUntil: 0,
        deathTimer: 0,
        weapon: weaponCopy(id),
      });
    },
    update: function (dt) {
      if (shotFeedbackTime > 0) {
        shotFeedbackTime = Math.max(0, shotFeedbackTime - dt);
        if (shotFeedbackTime === 0 && shotHud) shotHud.style.display = "none";
      }
      this.timeSinceDamage += dt;
      if (this.weapon.fireCooldown > 0)
        this.weapon.fireCooldown = Math.max(0, this.weapon.fireCooldown - dt);
      if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.dead) {
        this.deathTimer += dt;
        return;
      }
      if (this.downed) {
        this.downTimer += dt;
        if (this.downTimer >= this.downDuration) this.triggerDeath();
        return;
      }
      if (this.hp < this.maxHp && this.timeSinceDamage > this.regenDelay)
        this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
      if (this.reloading) {
        this.reloadTimer -= dt;
        if (this.reloadTimer <= 0) {
          this.reloading = false;
          this.weapon.ammo = this.weapon.magazine;
          this.state = "idle";
        }
      }
      if (this.shootTimer > 0) {
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.state === "shoot") this.state = "idle";
      }
      if (this.peek > 0) this.peek = Math.max(0, this.peek - dt);
      if (this.keyboardMove) {
        this.x += this.keyboardMove.x * this.speed * dt;
        this.y += this.keyboardMove.y * this.speed * dt;
        this.state = "walk";
      } else {
        var dx = this.tx - this.x,
          dy = this.ty - this.y,
          d = Math.hypot(dx, dy);
        if (d > 5) {
          const step = Math.min(d, this.speed * dt);
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
          this.facingX = dx / d;
          this.facingY = dy / d;
          this.state = "walk";
        } else if (this.state === "walk") {
          this.x = this.tx;
          this.y = this.ty;
          this.state = "idle";
          if (this.coverTarget) {
            this.cover = this.coverTarget;
            this.coverBlend = 1;
          }
        }
      }
    },
  };
  return p;
}
export function drawPlayer(ctx, p, iso) {
  var q = iso(p.x, p.y);
  ctx.save();
  ctx.translate(q[0], q[1]);
  if (!p.dead && !p.downed && p.hp < p.maxHp) {
    ctx.fillStyle = "#111";
    ctx.fillRect(-13, -47, 26, 3);
    ctx.fillStyle = "#68d36e";
    ctx.fillRect(-13, -47, 26 * Math.max(0, p.hp / p.maxHp), 3);
  }
  drawSoldier(ctx, p, {
    x: 0,
    y: 0,
    team: "player",
    scale: 0.31,
    alpha: p.dead ? 0.94 : p.downed ? 0.74 : 1,
  });
  ctx.restore();
}
