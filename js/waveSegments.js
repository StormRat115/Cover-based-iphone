export const DEFAULT_PACK_SIZE = 3;
export const DEFAULT_INTERVAL = 9.5;
export const DEFAULT_FIRST_DELAY = 0.55;

export function packCount(total, packSize) {
  packSize = Math.max(1, packSize || DEFAULT_PACK_SIZE);
  return Math.max(1, Math.ceil((total || 0) / packSize));
}

export function segmentIndexFor(index, packSize) {
  packSize = Math.max(1, packSize || DEFAULT_PACK_SIZE);
  return Math.floor(Math.max(0, index) / packSize);
}

export function segmentWave(enemies, options) {
  options = options || {};
  var packSize = options.packSize || DEFAULT_PACK_SIZE;
  var interval = options.interval == null ? DEFAULT_INTERVAL : options.interval;
  var firstDelay = options.firstDelay == null ? DEFAULT_FIRST_DELAY : options.firstDelay;
  var director = {
    packSize: packSize,
    interval: interval,
    released: 1,
    packs: packCount(enemies.length, packSize),
    timer: interval,
    firstDelay: firstDelay,
  };
  enemies.forEach(function (e, i) {
    var pack = segmentIndexFor(i, packSize);
    e.waveSegment = pack;
    if (pack === 0) {
      e.pendingSegment = false;
      e.spawnTimer = (e.spawnTimer || 0) + firstDelay;
    } else {
      e.pendingSegment = true;
      e.spawnTimer = 1e6;
      e.exposed = false;
    }
  });
  return director;
}

export function releaseNextSegment(director, enemies) {
  if (!director || director.released >= director.packs) return false;
  var pack = director.released;
  var released = 0;
  enemies.forEach(function (e) {
    if (e.waveSegment !== pack || !e.pendingSegment) return;
    e.pendingSegment = false;
    e.spawnTimer = 1.4 + (released % 3) * 0.28;
    released++;
  });
  director.released += 1;
  director.timer = director.interval;
  return released > 0;
}

export function updateWaveSegments(director, dt, enemies) {
  if (!director) return director;
  if (director.released >= director.packs) return director;
  var live = 0;
  enemies.forEach(function (e) {
    if (!e.dead && !e.pendingSegment && e.spawnTimer <= 0) live++;
  });
  director.timer -= dt;
  // Hold the next pack while the current fight is still dense; release sooner
  // if the field is quiet so combat keeps a slow pulse instead of a dump.
  var ready = director.timer <= 0 || (live <= 1 && director.timer <= director.interval * 0.45);
  if (ready) releaseNextSegment(director, enemies);
  return director;
}

export function pendingHostiles(enemies) {
  var n = 0;
  (enemies || []).forEach(function (e) {
    if (e && e.pendingSegment && !e.dead) n++;
  });
  return n;
}

export function waveFullyCleared(enemies, director) {
  if (!enemies || !enemies.length) return false;
  var living = enemies.some(function (e) {
    return !e.dead;
  });
  if (living) return false;
  if (director && director.released < director.packs) {
    var pendingLive = enemies.some(function (e) {
      return e.pendingSegment && !e.dead;
    });
    if (pendingLive) return false;
  }
  return enemies.every(function (e) {
    return e.dead && e.deathTimer >= (e.deathDuration || 0);
  });
}
