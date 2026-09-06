import {
  getAttachment,
  normalizeAttachmentIds,
} from "./attachments.js?v=20260906-105";
import {
  SIDEARMS,
  startingReserve,
  prepareWeaponAmmo,
} from "./ammoEconomy.js?v=20260906-105";
export { SIDEARMS };

export const WEAPONS = {
  rifle: {
    id: "rifle",
    name: "ASSAULT RIFLE",
    short: "RIFLE",
    damage: 24,
    range: 1550,
    cooldown: 0.24,
    magazine: 24,
    reload: 1.35,
    accuracy: 0,
    spread: 3.2,
    pellets: 1,
    role: "assault",
    pressure: 5,
  },
  pistol: {
    id: "pistol",
    name: "SIDEARM",
    short: "PISTOL",
    damage: 16,
    range: 1050,
    cooldown: 0.42,
    magazine: 15,
    reload: 1.05,
    accuracy: 2,
    spread: 2.7,
    pellets: 1,
    role: "backup",
    pressure: 2,
  },
  shotgun: {
    id: "shotgun",
    name: "BREACH SHOTGUN",
    short: "SHOTGUN",
    damage: 13,
    range: 800,
    cooldown: 0.9,
    magazine: 6,
    reload: 1.65,
    accuracy: -4,
    spread: 12,
    pellets: 7,
    role: "breach",
    pressure: 7,
  },
  sniper: {
    id: "sniper",
    name: "PRECISION RIFLE",
    short: "SNIPER",
    damage: 96,
    range: 2200,
    cooldown: 2.6,
    magazine: 5,
    reload: 3.1,
    accuracy: 8,
    spread: 0.8,
    pellets: 1,
    role: "precision",
    pressure: 8,
  },
  lmg: {
    id: "lmg",
    name: "LIGHT MACHINE GUN",
    short: "LMG",
    damage: 16,
    range: 1750,
    cooldown: 0.19,
    magazine: 48,
    reload: 2.15,
    accuracy: -7,
    spread: 5.8,
    pellets: 1,
    role: "support",
    pressure: 12,
  },
  dmr: {
    id: "dmr",
    name: "DESIGNATED MARKSMAN RIFLE",
    short: "DMR",
    damage: 38,
    range: 2000,
    cooldown: 0.68,
    magazine: 12,
    reload: 1.55,
    accuracy: 6,
    spread: 1.4,
    pellets: 1,
    role: "marksman",
    pressure: 6,
  },
  smg: {
    id: "smg",
    name: "SUBMACHINE GUN",
    short: "SMG",
    damage: 18,
    range: 1200,
    cooldown: 0.15,
    magazine: 32,
    reload: 1.25,
    accuracy: -6,
    spread: 6.5,
    pellets: 1,
    role: "flanker",
    pressure: 4,
  },
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function applyAttachmentMods(base, attachmentIds) {
  const w = Object.assign(
    {
      sfxVolume: 1,
      armorPierce: 0,
      hipAccuracy: 0,
      stationaryAccuracy: 0,
    },
    base,
  );
  const ids = normalizeAttachmentIds(attachmentIds);
  ids.forEach(function (id) {
    const att = getAttachment(id);
    if (!att || !att.mods) return;
    const m = att.mods;
    Object.keys(m).forEach(function (k) {
      if (k === "sfxVolume") {
        // Values in (0, 1.5] are treated as multipliers; otherwise additive.
        var v = m[k];
        if (v > 0 && v <= 1.5) w.sfxVolume = (w.sfxVolume || 1) * v;
        else w.sfxVolume = (w.sfxVolume || 1) + v;
      } else {
        w[k] = (w[k] || 0) + m[k];
      }
    });
  });
  w.damage = clamp(Math.round(w.damage), 4, 160);
  w.range = clamp(Math.round(w.range), 350, 2800);
  w.cooldown = clamp(+w.cooldown.toFixed(3), 0.08, 3.5);
  w.magazine = clamp(Math.round(w.magazine), 3, 120);
  w.reload = clamp(+w.reload.toFixed(3), 0.45, 4.5);
  w.accuracy = clamp(Math.round(w.accuracy), -20, 30);
  w.spread = clamp(+w.spread.toFixed(2), 0.3, 20);
  w.pressure = clamp(Math.round(w.pressure), 0, 20);
  w.sfxVolume = clamp(+w.sfxVolume.toFixed(2), 0.2, 1.2);
  w.armorPierce = clamp(+w.armorPierce.toFixed(2), 0, 0.6);
  w.hipAccuracy = clamp(Math.round(w.hipAccuracy), -10, 20);
  w.stationaryAccuracy = clamp(Math.round(w.stationaryAccuracy), 0, 20);
  w.attachments = ids;
  return w;
}

export function weaponWithAttachments(weaponId, attachmentIds) {
  const base = WEAPONS[weaponId] || SIDEARMS[weaponId] || WEAPONS.rifle;
  return applyAttachmentMods(Object.assign({}, base), attachmentIds);
}

export function weaponCopy(id, attachmentIds) {
  const w = weaponWithAttachments(id, attachmentIds);
  const infinite = !!(w.infinite || w.role === "backup");
  return prepareWeaponAmmo(
    Object.assign({}, w, {
      ammo: w.magazine,
      reserve: infinite ? Infinity : startingReserve(w),
      infinite: infinite,
      recoil: 0,
      fireCooldown: 0,
    }),
  );
}

export function getWeapon(id) {
  return WEAPONS[id] || SIDEARMS[id] || WEAPONS.rifle;
}
