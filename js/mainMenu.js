import {
  WEAPONS,
  weaponCopy,
  weaponWithAttachments,
} from "./weapons.js?v=20260906-73";
import { soldierSource } from "./soldierAssets.js?v=20260906-73";
import {
  CHARACTER_STATS,
  damageReductionPercent,
  GENERAL_ACCURACY_PENALTY,
} from "./combatStats.js?v=20260906-73";
import {
  ATTACHMENT_SLOTS,
  ATTACHMENT_SLOT_LABELS,
  attachmentsForSlot,
  emptyAttachmentIds,
  normalizeAttachmentIds,
} from "./attachments.js?v=20260906-73";

var DEFAULT_WEAPONS = { player: "rifle", Rook: "rifle", Viper: "smg", Doc: "dmr" },
  STORAGE = "coverShooterLoadout",
  CHARACTERS = [
    { key: "player", label: "PLAYER" },
    { key: "Rook", label: "ROOK" },
    { key: "Viper", label: "VIPER" },
    { key: "Doc", label: "DOC" },
  ],
  previewImage = soldierSource;

function defaultEntry(weaponId) {
  return {
    weapon: weaponId || "rifle",
    attachments: emptyAttachmentIds(),
  };
}

function normalizeEntry(raw, fallbackWeapon) {
  if (typeof raw === "string") return defaultEntry(raw || fallbackWeapon);
  if (raw && typeof raw === "object") {
    return {
      weapon: raw.weapon || fallbackWeapon || "rifle",
      attachments: normalizeAttachmentIds(raw.attachments),
    };
  }
  return defaultEntry(fallbackWeapon);
}

function loadSelection() {
  var out = {};
  CHARACTERS.forEach(function (c) {
    out[c.key] = defaultEntry(DEFAULT_WEAPONS[c.key]);
  });
  try {
    var parsed = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    CHARACTERS.forEach(function (c) {
      if (parsed[c.key] != null)
        out[c.key] = normalizeEntry(parsed[c.key], DEFAULT_WEAPONS[c.key]);
    });
  } catch (e) {}
  return out;
}

function saveSelection(v) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(v));
  } catch (e) {}
  window.__selectedLoadout = cloneSelection(v);
}

function cloneSelection(v) {
  var o = {};
  CHARACTERS.forEach(function (c) {
    o[c.key] = normalizeEntry(v[c.key], DEFAULT_WEAPONS[c.key]);
  });
  return o;
}

window.__selectedLoadout = loadSelection();

export function resolveLoadoutWeaponId(entry, fallback) {
  if (typeof entry === "string") return entry || fallback || "rifle";
  if (entry && entry.weapon) return entry.weapon;
  return fallback || "rifle";
}

export function resolveLoadoutAttachments(entry) {
  if (typeof entry === "string") return emptyAttachmentIds();
  return normalizeAttachmentIds(entry && entry.attachments);
}

function weaponOptions(selected) {
  return Object.keys(WEAPONS)
    .map(function (id) {
      var w = WEAPONS[id];
      return (
        '<option value="' +
        id +
        '"' +
        (id === selected ? " selected" : "") +
        ">" +
        w.name +
        "</option>"
      );
    })
    .join("");
}

function attachmentOptions(slot, selected) {
  var opts =
    '<option value=""' +
    (!selected ? " selected" : "") +
    ">— NONE —</option>";
  attachmentsForSlot(slot).forEach(function (a) {
    opts +=
      '<option value="' +
      a.id +
      '"' +
      (a.id === selected ? " selected" : "") +
      ">" +
      a.name +
      "</option>";
  });
  return opts;
}

function ensureStyle() {
  if (document.getElementById("loadoutPanelStyle")) return;
  var s = document.createElement("style");
  s.id = "loadoutPanelStyle";
  s.textContent =
    ".loadoutTabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px}.loadoutTab{min-height:36px;border:1px solid #ffffff33;border-radius:8px;background:#172126;color:#9eb0b8;font:900 9px system-ui}.loadoutTab.active{background:#315a68;color:#fff}.characterLoadoutCard{position:relative;text-align:left;border:1px solid #ffffff2d;border-radius:12px;background:#11191ed9;padding:14px;min-height:270px;overflow:hidden}.characterLoadoutName{font:950 20px system-ui;color:#fff;padding-right:94px}.characterLoadoutRole{font:800 9px system-ui;color:#7fa7b8;margin:2px 0 12px}.characterSprite{position:absolute;right:3px;top:1px;width:100px;height:110px}.characterStatsGrid,.weaponStatsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0 12px}.statCell{padding:7px 8px;border-radius:8px;background:#ffffff09;border:1px solid #ffffff14}.statCell b{display:block;color:#8fb7c8;font:800 8px system-ui}.statCell strong{display:block;margin-top:2px;color:#fff;font:950 13px system-ui}.weaponBlock{margin-top:8px;padding-top:10px;border-top:1px solid #ffffff1c}.weaponBlockTitle{font:900 9px system-ui;color:#8fb7c8;margin-bottom:6px}.weaponSelect,.attachmentSelect{width:100%;min-height:42px;border:1px solid #ffffff44;border-radius:9px;background:#182228;color:#fff;padding:0 10px;font:850 11px system-ui}.attachmentGrid{display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0 8px}.attachmentRow label{display:block;font:850 8px system-ui;color:#8fb7c8;letter-spacing:1px;margin:0 0 4px}.accuracyNote{font:750 8px system-ui;color:#7f929a;margin-top:6px}";
  document.head.appendChild(s);
}

function roleName(k) {
  return k === "Rook"
    ? "ASSAULT"
    : k === "Viper"
      ? "FLANKER"
      : k === "Doc"
        ? "MARKSMAN"
        : "OPERATOR";
}

function statCell(l, v) {
  return (
    '<div class="statCell"><b>' + l + "</b><strong>" + v + "</strong></div>"
  );
}

function renderPanel(rows, key, selection) {
  var c =
      CHARACTERS.find(function (x) {
        return x.key === key;
      }) || CHARACTERS[0],
    stats = CHARACTER_STATS[key] || CHARACTER_STATS.player,
    entry = normalizeEntry(selection[key], DEFAULT_WEAPONS[key]),
    w = weaponWithAttachments(entry.weapon, entry.attachments),
    totalDamage = w.damage + stats.damage,
    fireRate = (1 / w.cooldown).toFixed(1);
  selection[key] = entry;
  var attachmentHtml = ATTACHMENT_SLOTS.map(function (slot, idx) {
    return (
      '<div class="attachmentRow"><label>' +
      ATTACHMENT_SLOT_LABELS[slot] +
      '</label><select class="attachmentSelect" data-character="' +
      key +
      '" data-slot="' +
      idx +
      '">' +
      attachmentOptions(slot, entry.attachments[idx]) +
      "</select></div>"
    );
  }).join("");
  rows.innerHTML =
    '<div class="loadoutTabs">' +
    CHARACTERS.map(function (x) {
      return (
        '<button type="button" class="loadoutTab' +
        (x.key === key ? " active" : "") +
        '" data-character="' +
        x.key +
        '">' +
        x.label +
        "</button>"
      );
    }).join("") +
    '</div><div class="characterLoadoutCard"><div class="characterLoadoutName">' +
    c.label +
    '</div><div class="characterLoadoutRole">' +
    roleName(key) +
    '</div><canvas id="characterPreview" class="characterSprite" width="200" height="220"></canvas><div class="characterStatsGrid">' +
    statCell("HEALTH", stats.hp + " HP") +
    statCell(
      "DEFENSE",
      stats.defense + " · " + damageReductionPercent(stats.defense) + "% MIT",
    ) +
    statCell("ACCURACY", "+" + stats.accuracy) +
    statCell("REGEN", stats.regen + " HP/s") +
    statCell("DAMAGE", "+" + stats.damage) +
    statCell("BASE ACCURACY", GENERAL_ACCURACY_PENALTY + " global") +
    '</div><div class="weaponBlock"><div class="weaponBlockTitle">EQUIPPED WEAPON</div><select class="weaponSelect" data-loadout="' +
    key +
    '">' +
    weaponOptions(entry.weapon) +
    '</select><div class="attachmentGrid">' +
    attachmentHtml +
    '</div><div class="weaponStatsGrid">' +
    statCell("DAMAGE", w.damage + " + " + stats.damage + " = " + totalDamage) +
    statCell("ACCURACY", (w.accuracy >= 0 ? "+" : "") + w.accuracy) +
    statCell("SHOT SPREAD", w.spread + "°") +
    statCell("RANGE", w.range) +
    statCell("FIRE RATE", fireRate + " / sec") +
    statCell("RELOAD SPEED", w.reload.toFixed(2) + " sec") +
    statCell("MAGAZINE", w.magazine) +
    '</div><div class="accuracyNote">Character Accuracy is added after the general ' +
    Math.abs(GENERAL_ACCURACY_PENALTY) +
    " point accuracy reduction. Attachments modify the weapon stats above.</div></div></div>";
  drawPreview();
}

function drawPreview() {
  var canvas = document.getElementById("characterPreview");
  if (!canvas) return;
  var g = canvas.getContext("2d");
  function paint() {
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(previewImage, 200, 0, 120, 165, 38, 42, 124, 170);
  }
  if (previewImage && previewImage.complete && previewImage.naturalWidth) {
    paint();
    return;
  }
  if (!previewImage.complete)
    previewImage.addEventListener("load", paint, { once: true });
}

function equipFromSelection(s) {
  var p = window.__battlePlayer;
  if (p) {
    var pe = normalizeEntry(s.player, DEFAULT_WEAPONS.player);
    p.weapon = weaponCopy(pe.weapon, pe.attachments);
  }
  (window.__battleAllies || []).forEach(function (a) {
    var ae = normalizeEntry(
      s[a.name],
      DEFAULT_WEAPONS[a.name] || "rifle",
    );
    a.weapon = weaponCopy(ae.weapon, ae.attachments);
  });
}

function applySelection(s) {
  saveSelection(s);
  equipFromSelection(s);
}

export function initMainMenu(onPlay) {
  ensureStyle();
  var selection = loadSelection(),
    active = "player",
    screen = document.getElementById("mainMenu"),
    home = document.getElementById("mainMenuHome"),
    loadout = document.getElementById("mainMenuLoadout"),
    play = document.getElementById("menuPlay"),
    open = document.getElementById("menuLoadout"),
    back = document.getElementById("menuBack"),
    rows = document.getElementById("menuLoadoutRows");
  window.__selectedLoadout = cloneSelection(selection);
  if (rows) {
    renderPanel(rows, active, selection);
    rows.addEventListener("pointerdown", function (e) {
      var key =
        e.target && e.target.dataset ? e.target.dataset.character : null;
      if (key && e.target.classList && e.target.classList.contains("loadoutTab")) {
        e.preventDefault();
        active = key;
        renderPanel(rows, active, selection);
      }
    });
    rows.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || !t.dataset) return;
      if (t.dataset.loadout) {
        var key = t.dataset.loadout;
        selection[key] = normalizeEntry(selection[key], DEFAULT_WEAPONS[key]);
        selection[key].weapon = t.value;
        selection[key].attachments = emptyAttachmentIds();
        saveSelection(selection);
        renderPanel(rows, active, selection);
        return;
      }
      if (t.dataset.slot != null && t.dataset.character) {
        var ck = t.dataset.character;
        var slot = +t.dataset.slot;
        selection[ck] = normalizeEntry(selection[ck], DEFAULT_WEAPONS[ck]);
        selection[ck].attachments = normalizeAttachmentIds(
          selection[ck].attachments,
        );
        selection[ck].attachments[slot] = t.value || null;
        selection[ck].attachments = normalizeAttachmentIds(
          selection[ck].attachments,
        );
        saveSelection(selection);
        renderPanel(rows, active, selection);
      }
    });
  }
  if (open)
    open.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      home.classList.add("hidden");
      loadout.classList.remove("hidden");
      renderPanel(rows, active, selection);
    });
  if (back)
    back.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      loadout.classList.add("hidden");
      home.classList.remove("hidden");
    });
  if (play)
    play.addEventListener(
      "pointerdown",
      function (e) {
        e.preventDefault();
        applySelection(selection);
        screen.classList.add("hidden");
        if (onPlay) onPlay();
      },
      { once: true },
    );
}
