/** Attachment catalog: optic / barrel / magazine / underbarrel (4 slots). */
export const ATTACHMENT_SLOTS = ["optic", "barrel", "magazine", "underbarrel"];

export const ATTACHMENT_SLOT_LABELS = {
  optic: "OPTIC",
  barrel: "BARREL",
  magazine: "MAGAZINE",
  underbarrel: "UNDERBARREL",
};

/**
 * Stat keys applied by weaponWithAttachments:
 * accuracy, damage, range, cooldown (fire rate), magazine, reload,
 * spread, pressure, sfxVolume, armorPierce, hipAccuracy, stationaryAccuracy.
 */
export const ATTACHMENTS = {
  reflex_sight: {
    id: "reflex_sight",
    name: "Reflex Sight",
    slot: "optic",
    description: "Faster target acquisition; slight accuracy boost.",
    mods: { accuracy: 3, spread: -0.15 },
  },
  acog_scope: {
    id: "acog_scope",
    name: "ACOG Scope",
    slot: "optic",
    description: "Magnified optic: more accuracy and range, slower hip work.",
    mods: { accuracy: 6, range: 84, hipAccuracy: -4, cooldown: 0.02 },
  },
  thermal_optic: {
    id: "thermal_optic",
    name: "Thermal Optic",
    slot: "optic",
    description: "Highlights threats; solid accuracy, mild fire-rate cost.",
    mods: { accuracy: 5, range: 56, cooldown: 0.03 },
  },
  compensator: {
    id: "compensator",
    name: "Compensator",
    slot: "barrel",
    description: "Cuts muzzle climb and spread.",
    mods: { spread: -1.2, pressure: -1, accuracy: 2 },
  },
  suppressor: {
    id: "suppressor",
    name: "Suppressor",
    slot: "barrel",
    description: "Quieter shots; slight damage and range loss.",
    mods: { sfxVolume: 0.55, damage: -2, range: -42, pressure: -2 },
  },
  heavy_barrel: {
    id: "heavy_barrel",
    name: "Heavy Barrel",
    slot: "barrel",
    description: "Stabilizes long shots; slows handling a bit.",
    mods: { accuracy: 4, range: 105, cooldown: 0.04, spread: -0.4 },
  },
  muzzle_brake: {
    id: "muzzle_brake",
    name: "Muzzle Brake",
    slot: "barrel",
    description: "Recoil control for sustained fire.",
    mods: { pressure: -3, spread: -0.8, accuracy: 1 },
  },
  extended_mag: {
    id: "extended_mag",
    name: "Extended Mag",
    slot: "magazine",
    description: "More rounds; slower reload.",
    mods: { magazine: 10, reload: 0.25 },
  },
  drum_mag: {
    id: "drum_mag",
    name: "Drum Mag",
    slot: "magazine",
    description: "Huge capacity; noticeable reload penalty.",
    mods: { magazine: 24, reload: 0.55, spread: 0.4 },
  },
  quick_mag: {
    id: "quick_mag",
    name: "Quick Mag",
    slot: "magazine",
    description: "Faster reloads; slightly fewer rounds.",
    mods: { reload: -0.35, magazine: -2 },
  },
  armor_piercing: {
    id: "armor_piercing",
    name: "AP Rounds",
    slot: "magazine",
    description: "Stub armor pierce and a bit more damage.",
    mods: { armorPierce: 0.15, damage: 3, magazine: -2 },
  },
  foregrip: {
    id: "foregrip",
    name: "Foregrip",
    slot: "underbarrel",
    description: "Tighter spread and better control.",
    mods: { spread: -1.5, accuracy: 2, pressure: -1 },
  },
  laser_sight: {
    id: "laser_sight",
    name: "Laser Sight",
    slot: "underbarrel",
    description: "Improves hip-fire accuracy.",
    mods: { hipAccuracy: 6, accuracy: 1, spread: -0.1 },
  },
  bipod: {
    id: "bipod",
    name: "Bipod",
    slot: "underbarrel",
    description: "Accuracy bonus while stationary.",
    mods: { stationaryAccuracy: 8, spread: 0.2 },
  },
  grenade_launcher: {
    id: "grenade_launcher",
    name: "GL Stub",
    slot: "underbarrel",
    description: "Utility stub; slight mobility/handling cost.",
    mods: { pressure: 2, cooldown: 0.05, damage: 2 },
  },
  lightweight_stock: {
    // Treated as underbarrel/utility slot for catalog variety.
    id: "lightweight_stock",
    name: "Lightweight Rail",
    slot: "underbarrel",
    description: "Faster fire rate; a bit more spray.",
    mods: { cooldown: -0.03, spread: 0.6, pressure: 1 },
  },
};

export function getAttachment(id) {
  return id ? ATTACHMENTS[id] || null : null;
}

export function attachmentsForSlot(slot) {
  return Object.values(ATTACHMENTS).filter(function (a) {
    return a.slot === slot;
  });
}

export function emptyAttachmentIds() {
  return [null, null, null, null];
}

export function normalizeAttachmentIds(ids) {
  var out = emptyAttachmentIds();
  if (!Array.isArray(ids)) return out;
  for (var i = 0; i < 4; i++) {
    var id = ids[i] || null;
    if (!id) {
      out[i] = null;
      continue;
    }
    var att = ATTACHMENTS[id];
    if (att && att.slot === ATTACHMENT_SLOTS[i]) out[i] = id;
    else out[i] = null;
  }
  return out;
}
