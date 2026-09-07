import {
  WEAPONS,
  SIDEARMS,
  weaponCopy,
  weaponWithAttachments,
} from "./weapons.js?v=20260907-117";
import { soldierSource } from "./soldierAssets.js?v=20260907-117";
import {
  CHARACTER_STATS,
  damageReductionPercent,
  GENERAL_ACCURACY_PENALTY,
} from "./combatStats.js?v=20260907-117";
import {
  ATTACHMENT_SLOTS,
  ATTACHMENT_SLOT_LABELS,
  attachmentsForSlot,
  emptyAttachmentIds,
  normalizeAttachmentIds,
} from "./attachments.js?v=20260907-117";
import {
  getTeamProgress,
  xpIntoLevel,
  xpForLevel,
} from "./teamProgress.js?v=20260907-117";
import {
  SKILL_BRANCHES,
  canBuySkill,
  buySkill,
  getSkillMods,
} from "./skillTree.js?v=20260907-117";
import {
  ARMOR_OPTIONS,
  describeArmorStats,
  selectArmor,
  selectedArmorId,
  signed,
} from "./armor.js?v=20260907-117";

var DEFAULT_WEAPONS = { player: "rifle", Rook: "rifle", Viper: "smg", Doc: "dmr" },
  STORAGE = "coverShooterLoadout",
  CHARACTERS = [
    { key: "player", label: "PLAYER" },
    { key: "Rook", label: "ROOK" },
    { key: "Viper", label: "VIPER" },
    { key: "Doc", label: "DOC" },
  ],
  previewImage = soldierSource;

function defaultEntry(weaponId, sidearmId) {
  return {
    weapon: weaponId || "rifle",
    attachments: emptyAttachmentIds(),
    sidearm: sidearmId || "pistol",
  };
}

function normalizeEntry(raw, fallbackWeapon) {
  if (typeof raw === "string") return defaultEntry(raw || fallbackWeapon);
  if (raw && typeof raw === "object") {
    return {
      weapon: raw.weapon || fallbackWeapon || "rifle",
      attachments: normalizeAttachmentIds(raw.attachments),
      sidearm: SIDEARMS[raw.sidearm] ? raw.sidearm : "pistol",
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

function sidearmOptions(selected) {
  return Object.keys(SIDEARMS)
    .map(function (id) {
      var w = SIDEARMS[id];
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
    ".loadoutTabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px}.loadoutTab{min-height:36px;border:1px solid #ffffff33;border-radius:8px;background:#172126;color:#9eb0b8;font:900 9px system-ui}.loadoutTab.active{background:#315a68;color:#fff}.characterLoadoutCard{position:relative;text-align:left;border:1px solid #ffffff2d;border-radius:12px;background:#11191ed9;padding:14px;min-height:270px;overflow:hidden}.characterLoadoutName{font:950 20px system-ui;color:#fff;padding-right:94px}.characterLoadoutRole{font:800 9px system-ui;color:#7fa7b8;margin:2px 0 12px}.characterSprite{position:absolute;right:3px;top:1px;width:100px;height:110px}.characterStatsGrid,.weaponStatsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0 12px}.statCell{padding:7px 8px;border-radius:8px;background:#ffffff09;border:1px solid #ffffff14}.statCell b{display:block;color:#8fb7c8;font:800 8px system-ui}.statCell strong{display:block;margin-top:2px;color:#fff;font:950 13px system-ui}.weaponBlock{margin-top:8px;padding-top:10px;border-top:1px solid #ffffff1c}.weaponBlockTitle{font:900 9px system-ui;color:#8fb7c8;margin-bottom:6px}.weaponSelect,.attachmentSelect{width:100%;min-height:42px;border:1px solid #ffffff44;border-radius:9px;background:#182228;color:#fff;padding:0 10px;font:850 11px system-ui}.attachmentGrid{display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0 8px}.attachmentRow label{display:block;font:850 8px system-ui;color:#8fb7c8;letter-spacing:1px;margin:0 0 4px}.accuracyNote{font:750 8px system-ui;color:#7f929a;margin-top:6px}.teamBar{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin:0 0 10px;padding:10px;border:1px solid #ffffff24;border-radius:10px;background:#0f171b;text-align:left}.teamBar b{display:block;color:#8fb7c8;font:800 8px system-ui}.teamBar strong{color:#fff;font:950 16px system-ui}.xpTrack{height:6px;border-radius:99px;background:#ffffff14;overflow:hidden}.xpFill{height:100%;background:#7eb8d2}.pageTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 12px}.pageTab{min-height:34px;border:1px solid #ffffff33;border-radius:8px;background:#172126;color:#9eb0b8;font:900 9px system-ui}.pageTab.active{background:#3d5344;color:#fff}.skillTree{display:grid;grid-template-columns:1fr;gap:10px}.skillBranch{border:1px solid #ffffff1f;border-radius:10px;padding:10px;text-align:left;background:#0f171bd4}.skillBranch h3{margin:0 0 8px;font:900 11px system-ui;letter-spacing:1px}.skillNode{width:100%;margin:4px 0;padding:8px 10px;border-radius:8px;border:1px solid #ffffff2a;background:#182228;color:#d5e2e7;text-align:left}.skillNode small{display:block;color:#8aa0aa;font:750 9px system-ui;margin-top:2px}.skillNode.owned{background:#2b4a38;border-color:#7dca8a55}.skillNode.locked{opacity:.42}.armorGrid{display:grid;gap:8px}.armorCard{text-align:left;border:1px solid #ffffff24;border-radius:10px;background:#11191ed9;padding:10px;color:#dce7eb}.armorCard.active{border-color:#7eb8d2;background:#1a2a31}.armorCard b{display:block;font:900 12px system-ui}.armorCard p{margin:4px 0 6px;font:750 9px system-ui;color:#8aa0aa}.armorStats{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font:800 8px system-ui;color:#c5d6dd}";
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

function teamBarHtml() {
  var p = getTeamProgress(),
    into = xpIntoLevel(p.xp),
    need = xpForLevel(p.level),
    pct = Math.max(0, Math.min(100, Math.round((into / need) * 100)));
  return (
    '<div class="teamBar"><div><b>TEAM LEVEL</b><strong>' +
    p.level +
    '</strong></div><div><b>TEAM XP ' +
    into +
    " / " +
    need +
    '</b><div class="xpTrack"><div class="xpFill" style="width:' +
    pct +
    '%"></div></div></div><div><b>SKILL POINTS</b><strong>' +
    p.unspent +
    "</strong></div></div>"
  );
}

function pageTabsHtml(page) {
  return (
    '<div class="pageTabs">' +
    ["squad", "skills", "armor"]
      .map(function (id) {
        return (
          '<button type="button" class="pageTab' +
          (page === id ? " active" : "") +
          '" data-page="' +
          id +
          '">' +
          id.toUpperCase() +
          "</button>"
        );
      })
      .join("") +
    "</div>"
  );
}

function renderSkills() {
  var spent = getTeamProgress().spent || {};
  return (
    '<div class="skillTree">' +
    SKILL_BRANCHES.map(function (b) {
      return (
        '<div class="skillBranch"><h3 style="color:' +
        b.color +
        '">' +
        b.name +
        "</h3>" +
        b.nodes
          .map(function (n) {
            var owned = (spent[n.id] || 0) > 0,
              locked = !owned && !canBuySkill(n.id);
            return (
              '<button type="button" class="skillNode' +
              (owned ? " owned" : locked ? " locked" : "") +
              '" data-skill="' +
              n.id +
              '"' +
              (locked || owned ? " disabled" : "") +
              ">" +
              n.name +
              (owned ? "  ✓" : "") +
              "<small>" +
              n.desc +
              "</small></button>"
            );
          })
          .join("") +
        "</div>"
      );
    }).join("") +
    '<div class="accuracyNote">1 skill point per team level. Deeper nodes need the node above. Grenades, squad buffs, and marine reinforcements apply in combat.</div></div>'
  );
}

function renderArmor() {
  var selected = selectedArmorId();
  return (
    '<div class="armorGrid">' +
    ARMOR_OPTIONS.map(function (a) {
      var d = describeArmorStats(a);
      return (
        '<button type="button" class="armorCard' +
        (a.id === selected ? " active" : "") +
        '" data-armor="' +
        a.id +
        '"><b>' +
        a.name +
        (a.id === selected ? "  · EQUIPPED" : "") +
        "</b><p>" +
        a.blurb +
        '</p><div class="armorStats"><span>DEF ' +
        signed(d.defenseDelta) +
        " → " +
        d.defense +
        " (" +
        d.mit +
        "% MIT)</span><span>HIT " +
        signed(d.hitDelta) +
        " → " +
        d.hitChance +
        "</span><span>SPD " +
        signed(d.speedDelta) +
        " → " +
        d.speed +
        "</span></div></button>"
      );
    }).join("") +
    "</div>"
  );
}

function renderSquad(key, selection) {
  var c =
      CHARACTERS.find(function (x) {
        return x.key === key;
      }) || CHARACTERS[0],
    stats = CHARACTER_STATS[key] || CHARACTER_STATS.player,
    entry = normalizeEntry(selection[key], DEFAULT_WEAPONS[key]),
    w = weaponWithAttachments(entry.weapon, entry.attachments),
    side = SIDEARMS[entry.sidearm] || SIDEARMS.pistol,
    mods = getSkillMods(),
    totalDamage = w.damage + stats.damage + (key === "player" ? mods.playerDamage : mods.allyDamage),
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
  return (
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
    '</div>' +
    (key === "player"
      ? '<div class="weaponBlock"><div class="weaponBlockTitle">SIDEARM · INFINITE AMMO</div><select class="weaponSelect" data-sidearm="player">' +
        sidearmOptions(entry.sidearm) +
        '</select><div class="weaponStatsGrid">' +
        statCell("NAME", side.name) +
        statCell("DAMAGE", side.damage) +
        statCell("ACCURACY", (side.accuracy >= 0 ? "+" : "") + side.accuracy) +
        statCell("RANGE", side.range) +
        statCell("FIRE RATE", (1 / side.cooldown).toFixed(1) + " / sec") +
        statCell("MAGAZINE", side.magazine + " ∞") +
        '</div><div class="accuracyNote">' +
        side.blurb +
        " Auto-swaps when the primary is dry or you are pinned hard.</div></div>"
      : "") +
    '<div class="accuracyNote">Character Accuracy is added after the general ' +
    Math.abs(GENERAL_ACCURACY_PENALTY) +
    " point accuracy reduction. Attachments modify the weapon stats above. Armor and skill tree bonuses apply on PLAY.</div></div></div>"
  );
}

function renderPanel(rows, key, selection, page) {
  page = page || "squad";
  rows.innerHTML =
    teamBarHtml() +
    pageTabsHtml(page) +
    (page === "skills"
      ? renderSkills()
      : page === "armor"
        ? renderArmor()
        : renderSquad(key, selection));
  if (page === "squad") drawPreview();
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
    p.primary = weaponCopy(pe.weapon, pe.attachments);
    p.sidearm = weaponCopy(pe.sidearm || "pistol");
    p.weaponSlot = "primary";
    p.weapon = p.primary;
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
    page = "squad",
    screen = document.getElementById("mainMenu"),
    home = document.getElementById("mainMenuHome"),
    loadout = document.getElementById("mainMenuLoadout"),
    play = document.getElementById("menuPlay"),
    open = document.getElementById("menuLoadout"),
    back = document.getElementById("menuBack"),
    rows = document.getElementById("menuLoadoutRows");
  window.__selectedLoadout = cloneSelection(selection);
  var kicker =
    loadout && loadout.querySelector
      ? loadout.querySelector(".menuKicker")
      : null;
  if (kicker) kicker.textContent = "TEAM LEVEL · SKILLS · ARMOR";
  if (rows) {
    renderPanel(rows, active, selection, page);
    rows.addEventListener("pointerdown", function (e) {
      var t = e.target;
      while (t && t !== rows && (!t.dataset || (!t.dataset.character && !t.dataset.page && !t.dataset.skill && !t.dataset.armor)))
        t = t.parentElement;
      if (!t || !t.dataset) return;
      if (t.dataset.page) {
        e.preventDefault();
        page = t.dataset.page;
        renderPanel(rows, active, selection, page);
        return;
      }
      if (t.dataset.character && t.classList && t.classList.contains("loadoutTab")) {
        e.preventDefault();
        active = t.dataset.character;
        renderPanel(rows, active, selection, page);
        return;
      }
      if (t.dataset.skill) {
        e.preventDefault();
        buySkill(t.dataset.skill);
        renderPanel(rows, active, selection, page);
        return;
      }
      if (t.dataset.armor) {
        e.preventDefault();
        selectArmor(t.dataset.armor);
        renderPanel(rows, active, selection, page);
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
        renderPanel(rows, active, selection, page);
        return;
      }
      if (t.dataset.sidearm) {
        selection.player = normalizeEntry(selection.player, DEFAULT_WEAPONS.player);
        selection.player.sidearm = t.value;
        saveSelection(selection);
        renderPanel(rows, active, selection, page);
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
        renderPanel(rows, active, selection, page);
      }
    });
  }
  if (open)
    open.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      home.classList.add("hidden");
      loadout.classList.remove("hidden");
      renderPanel(rows, active, selection, page);
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
