// Shared team XP for player + allies + marines.
//
// Formula:
//   killXP(type, wave) = 12 + 4 * wave + typeBonus(type)
//     typeBonus: charger 14, heavy 10, sniper 8, shotgunner 6, marksman 5, shield 8, medic 6, ripper 4, else 2
//   waveXP(wave)       = 50 + 20 * wave
//   xpToReach(level)   = sum_{n=1..level-1} (70 + 40 * n)
//     level 1 starts at 0 XP; first level-up costs 110 XP
//   skill points       = team level - 1  (1 point granted per level gained)
//
// Progress persists in localStorage for the session and across missions.

export const TEAM_XP_STORAGE = "coverShooterTeamProgress";

export const TYPE_BONUS = {
  charger: 14,
  heavy: 10,
  sniper: 8,
  shotgunner: 6,
  marksman: 5,
  shield: 8,
  medic: 6,
  ripper: 4,
};

export function typeBonus(type) {
  return TYPE_BONUS[type] || 2;
}

export function killXp(type, wave) {
  return 12 + 4 * Math.max(1, wave || 1) + typeBonus(type);
}

export function waveXp(wave) {
  return 50 + 20 * Math.max(1, wave || 1);
}

export function xpForLevel(level) {
  // XP required to go from `level` to `level + 1`.
  return 70 + 40 * Math.max(1, level || 1);
}

export function totalXpForLevel(level) {
  var need = 0;
  for (var n = 1; n < Math.max(1, level || 1); n++) need += xpForLevel(n);
  return need;
}

export function levelFromXp(xp) {
  xp = Math.max(0, Number(xp) || 0);
  var level = 1;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    if (level > 99) break;
  }
  return level;
}

export function xpIntoLevel(xp) {
  xp = Math.max(0, Number(xp) || 0);
  var level = 1;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    if (level > 99) break;
  }
  return xp;
}

export function skillPointsFromLevel(level) {
  return Math.max(0, (level || 1) - 1);
}

function emptyState() {
  return {
    xp: 0,
    level: 1,
    unspent: 0,
    spent: {},
    armor: "balanced",
  };
}

function normalizeState(raw) {
  var s = emptyState();
  if (!raw || typeof raw !== "object") return s;
  s.xp = Math.max(0, Math.floor(Number(raw.xp) || 0));
  s.level = levelFromXp(s.xp);
  s.spent = raw.spent && typeof raw.spent === "object" ? Object.assign({}, raw.spent) : {};
  s.armor = typeof raw.armor === "string" ? raw.armor : "balanced";
  var earned = skillPointsFromLevel(s.level);
  var used = 0;
  Object.keys(s.spent).forEach(function (k) {
    used += Math.max(0, Math.floor(Number(s.spent[k]) || 0));
  });
  s.unspent = Math.max(0, earned - used);
  return s;
}

export function loadTeamProgress() {
  try {
    var parsed = JSON.parse(localStorage.getItem(TEAM_XP_STORAGE) || "{}");
    return normalizeState(parsed);
  } catch (e) {
    return emptyState();
  }
}

export function saveTeamProgress(state) {
  var next = normalizeState(state);
  try {
    localStorage.setItem(TEAM_XP_STORAGE, JSON.stringify(next));
  } catch (e) {}
  if (typeof window !== "undefined") window.__teamProgress = next;
  return next;
}

export function getTeamProgress() {
  if (typeof window !== "undefined" && window.__teamProgress)
    return window.__teamProgress;
  return saveTeamProgress(loadTeamProgress());
}

export function grantXp(amount) {
  var state = getTeamProgress();
  var before = state.level;
  state.xp = Math.max(0, state.xp + Math.max(0, Math.floor(Number(amount) || 0)));
  state.level = levelFromXp(state.xp);
  if (state.level > before) state.unspent += state.level - before;
  return saveTeamProgress(state);
}

export function grantKillXp(enemy, wave) {
  return grantXp(killXp(enemy && enemy.type, wave));
}

export function grantWaveXp(wave) {
  return grantXp(waveXp(wave));
}

export function setArmorId(id) {
  var state = getTeamProgress();
  state.armor = id || "balanced";
  return saveTeamProgress(state);
}

export function spendSkill(id) {
  var state = getTeamProgress();
  if (state.unspent <= 0) return state;
  state.spent[id] = (state.spent[id] || 0) + 1;
  state.unspent -= 1;
  return saveTeamProgress(state);
}

export function hasSkill(id) {
  var state = getTeamProgress();
  return (state.spent[id] || 0) > 0;
}

if (typeof window !== "undefined") {
  window.__teamProgress = loadTeamProgress();
}
