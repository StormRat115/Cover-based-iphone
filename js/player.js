import { getHitChance } from "./cover.js?v=20260906-98";
import {
  resolveSolidMove,
  updateVault,
  planRoute,
  continueRoute,
} from "./coverCollision.js?v=20260906-98";
import { composeSolidAndUnitMove } from "./unitCollision.js?v=20260906-98";
import { weaponCopy } from "./weapons.js?v=20260906-98";
import { AudioBus } from "./audio.js?v=20260906-98";
import { drawSoldier } from "./soldierAssets.js?v=20260906-98";
import {
  CHARACTER_STATS,
  mitigateDamage,
  combatAccuracy,
  attackDamage,
  creditKill,
} from "./combatStats.js?v=20260906-98";
import {
  finishReload,
  canReloadFromReserve,
  isPrimaryDry,
  getSidearm,
  shouldSwapToSidearm,
} from "./ammoEconomy.js?v=20260906-98";
import { updateDownedCrawl } from "./downedCrawl.js?v=20260906-98";
import {
  tickSuppression,
  suppressionAccuracyDelta,
  isHardSuppressed,
} from "./suppression.js?v=20260906-98";
import { orderAccuracy, orderDefense } from "./squadDialog.js?v=20260906-98";
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
    (p.weapon.infinite ? "∞" : Math.round(p.weapon.reserve || 0)) +
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
function loadoutWeaponParts(entry, fallback) {
  if (typeof entry === "string")
    return {
      weapon: entry || fallback || "rifle",
      attachments: [null, null, null, null],
      sidearm: "pistol",
    };
  if (entry && typeof entry === "object")
    return {
      weapon: entry.weapon || fallback || "rifle",
      attachments: Array.isArray(entry.attachments)
        ? entry.attachments.slice(0, 4)
        : [null, null, null, null],
      sidearm: getSidearm(entry.sidearm).id,
    };
  return {
    weapon: fallback || "rifle",
    attachments: [null, null, null, null],
    sidearm: "pistol",
  };
}
export function createPlayer() {
  var parts = loadoutWeaponParts(
      typeof window !== "undefined" &&
        window.__selectedLoadout &&
        window.__selectedLoadout.player,
      "rifle",
    ),
    stats = CHARACTER_STATS.player;
  var p = {
    isPlayer: true,
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
    primary: weaponCopy(parts.weapon, parts.attachments),
    sidearm: weaponCopy(parts.sidearm || "pistol"),
    weaponSlot: "primary",
    weapon: null,
    keyboardMove: null,
    facingX: 1,
    facingY: 0,
    vaulting: false,
    vaultZ: 0,
    vaultT: 0,
    lastShotHit: false,
    deathTimer: 0,
    deathDuration: 0.8,
    hardPinSwap: false,
    crawlSettled: false,
    kills: 0,
    setWeapon: function (id, attachmentIds) {
      if (this.dead || this.downed || this.reloading) return;
      this.primary = weaponCopy(id, attachmentIds);
      if (this.weaponSlot !== "sidearm") this.weapon = this.primary;
    },
    equipSidearm: function (id) {
      this.sidearm = weaponCopy(id || "pistol");
      if (this.weaponSlot === "sidearm") this.weapon = this.sidearm;
    },
    swapWeapon: function (slot) {
      if (this.dead || this.downed || this.reloading) return false;
      var next = slot || (this.weaponSlot === "primary" ? "sidearm" : "primary");
      if (next === "sidearm") {
        this.weaponSlot = "sidearm";
        this.weapon = this.sidearm;
      } else {
        this.weaponSlot = "primary";
        this.weapon = this.primary;
      }
      this.hardPinSwap = false;
      return true;
    },
    maybeAutoSidearm: function () {
      if (this.weaponSlot === "sidearm") return false;
      this.hardPinSwap = isHardSuppressed(this);
      if (shouldSwapToSidearm(this) || isPrimaryDry(this.primary)) {
        return this.swapWeapon("sidearm");
      }
      return false;
    },
    setDestination: function (x, y, cover) {
      if (this.dead || this.downed) return;
      this.keyboardMove = null;
      this.cover = null;
      this.coverTarget = cover || null;
      this.tx = x;
      this.ty = y;
      this.routeGoalX = x;
      this.routeGoalY = y;
      planRoute(
        this,
        x,
        y,
        (typeof window !== "undefined" && window.__battleCovers) || [],
        cover || null,
      );
      this.state = this.vaulting ? "vault" : "walk";
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
        !canReloadFromReserve(this.weapon)
      )
        return;
      this.reloading = true;
      this.reloadTimer = this.weapon.reload;
      this.state = "reload";
      AudioBus.playReload();
    },
    fireAt: function (enemy) {
      if (
        this.dead ||
        this.downed ||
        this.reloading ||
        this.weapon.fireCooldown > 0
      )
        return false;
      this.maybeAutoSidearm();
      if (this.weapon.ammo <= 0) {
        AudioBus.playEmpty();
        return false;
      }
      var dx = enemy.x - this.x,
        dy = enemy.y - this.y,
        d = Math.hypot(dx, dy) || 1;
      this.facingX = dx / d;
      this.facingY = dy / d;
      var chance = combatAccuracy(
        getHitChance(this, enemy, window.__battleCovers || []),
        this.weapon.accuracy,
        this.accuracy,
        suppressionAccuracyDelta(this) + orderAccuracy(this),
      );
      enemy.lastHitChance = chance;
      this.weapon.ammo--;
      this.weapon.fireCooldown = this.weapon.cooldown;
      this.weapon.recoil = this.weapon.cooldown;
      AudioBus.playFire(this.weapon, { priority: 3 });
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
          creditKill(this);
        }
      }
      return hit;
    },
    takeDamage: function (amount) {
      if (this.dead || this.downed) return;
      var dealt = mitigateDamage(amount, this.defense + orderDefense(this));
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
      this.crawlSettled = false;
      if (!this.cover) this.coverTarget = null;
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
      var parts = loadoutWeaponParts(
        window.__selectedLoadout && window.__selectedLoadout.player,
        this.weapon.id || "rifle",
      );
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
        vaulting: false,
        vaultZ: 0,
        vaultT: 0,
        vaultCover: null,
        routeGoalX: undefined,
        routeGoalY: undefined,
        __lastSoldierState: undefined,
        __visualFacing: undefined,
        __faceLockUntil: 0,
        deathTimer: 0,
        primary: weaponCopy(parts.weapon, parts.attachments),
        sidearm: weaponCopy(parts.sidearm || "pistol"),
        weaponSlot: "primary",
        crawlSettled: false,
        hardPinSwap: false,
        kills: 0,
      });
      this.weapon = this.primary;
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
        updateDownedCrawl(
          this,
          dt,
          (typeof window !== "undefined" && window.__battleCovers) || [],
          (typeof window !== "undefined" && window.__battleEnemies) || [],
        );
        if (this.downTimer >= this.downDuration) this.triggerDeath();
        return;
      }
      tickSuppression(this, dt);
      if (this.hp < this.maxHp && this.timeSinceDamage > this.regenDelay)
        this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
      if (this.reloading) {
        this.reloadTimer -= dt;
        if (this.reloadTimer <= 0) {
          this.reloading = false;
          finishReload(this.weapon);
          this.state = "idle";
        }
      }
      if (this.shootTimer > 0) {
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.state === "shoot") this.state = "idle";
      }
      if (this.peek > 0) this.peek = Math.max(0, this.peek - dt);
      var covers =
        (typeof window !== "undefined" && window.__battleCovers) || [];
      if (this.vaulting) {
        updateVault(this, dt);
        return;
      }
      if (this.keyboardMove) {
        var knx = this.x + this.keyboardMove.x * this.speed * dt,
          kny = this.y + this.keyboardMove.y * this.speed * dt,
          kmove = composeSolidAndUnitMove(
            resolveSolidMove(this, knx, kny, covers, {
              target: { x: knx, y: kny },
              allowVault: true,
            }),
            this,
          );
        this.x = kmove.x;
        this.y = kmove.y;
        this.state = this.vaulting ? "vault" : "walk";
      } else {
        var dx = this.tx - this.x,
          dy = this.ty - this.y,
          d = Math.hypot(dx, dy);
        if (d > 5) {
          const step = Math.min(d, this.speed * dt);
          var nx = this.x + (dx / d) * step,
            ny = this.y + (dy / d) * step,
            moved = composeSolidAndUnitMove(
              resolveSolidMove(this, nx, ny, covers, {
                target: { x: this.tx, y: this.ty },
                allowVault: !this.coverTarget,
              }),
              this,
            );
          this.x = moved.x;
          this.y = moved.y;
          this.facingX = dx / d;
          this.facingY = dy / d;
          this.state = this.vaulting ? "vault" : "walk";
          continueRoute(this, covers);
        } else if (this.state === "walk" || this.state === "vault") {
          continueRoute(this, covers);
          if (Math.hypot(this.tx - this.x, this.ty - this.y) <= 5) {
            this.x = this.tx;
            this.y = this.ty;
            this.state = "idle";
            if (this.coverTarget) {
              this.cover = this.coverTarget;
              this.coverBlend = 1;
            }
          }
        }
      }
    },
  };
  p.weapon = p.primary;
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
