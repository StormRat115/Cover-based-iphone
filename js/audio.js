const SFX_BASE = "./assets/sfx/";
const FIRE_FILES = {
  rifle: "rifle_fire.mp3",
  smg: "smg_fire.mp3",
  dmr: "dmr_fire.mp3",
  sniper: "sniper_fire.mp3",
  shotgun: "shotgun_fire.mp3",
  pistol: "pistol_fire.mp3",
  lmg: "lmg_fire.mp3",
};

const MAX_VOICES = 6;
const MIN_FIRE_GAP_MS = 45;
const MAX_FIRE_PER_WINDOW = 3;
const FIRE_WINDOW_MS = 80;

let ctx = null;
const buffers = Object.create(null);
const loading = Object.create(null);
const active = [];
let unlocked = false;
let preloaded = false;
let lastFireAt = 0;
let fireWindowStart = 0;
let fireWindowCount = 0;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function loadBuffer(key, file) {
  if (buffers[key] || loading[key]) return loading[key];
  const audioCtx = ensureCtx();
  if (!audioCtx) return null;
  loading[key] = fetch(SFX_BASE + file)
    .then(function (r) {
      return r.arrayBuffer();
    })
    .then(function (ab) {
      return audioCtx.decodeAudioData(ab.slice(0));
    })
    .then(function (buf) {
      buffers[key] = buf;
      delete loading[key];
      return buf;
    })
    .catch(function () {
      delete loading[key];
      return null;
    });
  return loading[key];
}

function pruneActive(now) {
  for (let i = active.length - 1; i >= 0; i--) {
    if (active[i].until <= now) active.splice(i, 1);
  }
}

function canStartVoice(priority, now) {
  pruneActive(now);
  if (active.length < MAX_VOICES) return true;
  // Drop lowest priority voice if this one is more important.
  let worst = -1;
  let worstPri = priority;
  for (let i = 0; i < active.length; i++) {
    if (active[i].priority < worstPri) {
      worstPri = active[i].priority;
      worst = i;
    }
  }
  if (worst < 0) return false;
  try {
    active[worst].source.stop(0);
  } catch (e) {}
  active.splice(worst, 1);
  return true;
}

function allowFireEvent(now) {
  if (now - lastFireAt < MIN_FIRE_GAP_MS) return false;
  if (now - fireWindowStart > FIRE_WINDOW_MS) {
    fireWindowStart = now;
    fireWindowCount = 0;
  }
  if (fireWindowCount >= MAX_FIRE_PER_WINDOW) return false;
  fireWindowCount++;
  lastFireAt = now;
  return true;
}

function playBuffer(key, opts) {
  opts = opts || {};
  const audioCtx = ensureCtx();
  const buf = buffers[key];
  if (!audioCtx || !buf) return false;
  const now =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  const priority = opts.priority == null ? 1 : opts.priority;
  if (!canStartVoice(priority, now)) return false;

  const source = audioCtx.createBufferSource();
  source.buffer = buf;
  const rate = opts.rate == null ? 1 : opts.rate;
  const jitter = 1 + (Math.random() * 2 - 1) * (opts.rateJitter == null ? 0.04 : opts.rateJitter);
  source.playbackRate.value = Math.max(0.85, Math.min(1.15, rate * jitter));

  const gain = audioCtx.createGain();
  const vol = Math.max(
    0.02,
    Math.min(1, (opts.volume == null ? 0.7 : opts.volume) * (0.94 + Math.random() * 0.12)),
  );
  gain.gain.value = vol;
  source.connect(gain);
  gain.connect(audioCtx.destination);

  const dur = Math.max(0.05, buf.duration / source.playbackRate.value);
  active.push({ source: source, until: now + dur * 1000, priority: priority });
  source.onended = function () {
    const idx = active.findIndex(function (v) {
      return v.source === source;
    });
    if (idx >= 0) active.splice(idx, 1);
  };
  try {
    source.start(0);
  } catch (e) {
    return false;
  }
  return true;
}

// Tiny HTMLAudio fallback pool (only if WebAudio unavailable).
const htmlPools = Object.create(null);
function htmlPlay(file, opts) {
  opts = opts || {};
  if (typeof Audio === "undefined") return;
  let list = htmlPools[file];
  if (!list) {
    list = [];
    for (let i = 0; i < 2; i++) {
      const a = new Audio(SFX_BASE + file);
      a.preload = "auto";
      list.push(a);
    }
    htmlPools[file] = list;
  }
  const slot = list.find(function (a) {
    return a.paused || a.ended;
  }) || list[0];
  try {
    slot.pause();
    slot.currentTime = 0;
  } catch (e) {}
  slot.volume = Math.max(0.05, Math.min(1, opts.volume == null ? 0.65 : opts.volume));
  const p = slot.play();
  if (p && p.catch) p.catch(function () {});
}

function playKey(key, file, opts) {
  opts = opts || {};
  if (buffers[key]) return playBuffer(key, opts);
  loadBuffer(key, file);
  // Soft fallback while decoding first time.
  htmlPlay(file, opts);
  return false;
}

export const AudioBus = {
  unlock() {
    if (unlocked) return;
    unlocked = true;
    const audioCtx = ensureCtx();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    this.preload();
  },
  preload() {
    if (preloaded) return;
    preloaded = true;
    ensureCtx();
    Object.keys(FIRE_FILES).forEach(function (id) {
      loadBuffer("fire:" + id, FIRE_FILES[id]);
    });
    loadBuffer("reload", "reload.mp3");
    loadBuffer("empty", "empty.mp3");
    loadBuffer("boom", "grenade_boom.ogg");
  },
  playFire(weaponOrId, opts) {
    opts = opts || {};
    const now =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    const priority = opts.priority == null ? 1 : opts.priority;
    // Always allow player-priority shots through the global fire gate loosely.
    if (priority < 3 && !allowFireEvent(now)) return;
    if (priority >= 3 && !allowFireEvent(now) && Math.random() > 0.35) return;

    const id =
      typeof weaponOrId === "string"
        ? weaponOrId
        : (weaponOrId && (weaponOrId.id || "")).toLowerCase();
    const key = FIRE_FILES[id] ? id : "rifle";
    const volumeMul =
      (weaponOrId && typeof weaponOrId === "object" && weaponOrId.sfxVolume) ||
      1;
    const base = opts.volume == null ? 0.7 : opts.volume;
    playKey("fire:" + key, FIRE_FILES[key], {
      volume: base * volumeMul,
      rate: opts.rate,
      priority: priority,
    });
  },
  playReload(opts) {
    opts = opts || {};
    playKey("reload", "reload.mp3", {
      volume: opts.volume == null ? 0.62 : opts.volume,
      priority: opts.priority == null ? 2 : opts.priority,
    });
  },
  playEmpty(opts) {
    opts = opts || {};
    playKey("empty", "empty.mp3", {
      volume: opts.volume == null ? 0.45 : opts.volume,
      priority: opts.priority == null ? 2 : opts.priority,
    });
  },
  playBoom(opts) {
    opts = opts || {};
    playKey("boom", "grenade_boom.ogg", {
      volume: opts.volume == null ? 0.68 : opts.volume,
      priority: opts.priority == null ? 3 : opts.priority,
    });
  },
};

function bindUnlock() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const once = function () {
    AudioBus.unlock();
    window.removeEventListener("pointerdown", once, true);
    window.removeEventListener("keydown", once, true);
    window.removeEventListener("touchstart", once, true);
  };
  window.addEventListener("pointerdown", once, true);
  window.addEventListener("keydown", once, true);
  window.addEventListener("touchstart", once, true);
}

bindUnlock();
export default AudioBus;
