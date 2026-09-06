export function stanceForEnemy(index, type) {
  if (type === "charger" || type === "melee") return "rush";
  if (type === "sniper" || type === "marksman") return "cover";
  if (type === "heavy") return index % 2 === 0 ? "cover" : "exposed";
  if (type === "shotgunner" || type === "smg")
    return index % 2 === 0 ? "exposed" : "cover";
  return index % 3 === 1 ? "exposed" : "cover";
}

export function tagEnemyStance(enemy, index) {
  if (!enemy) return enemy;
  var stance = enemy.coverBehavior || stanceForEnemy(index, enemy.type);
  enemy.coverBehavior = stance;
  enemy.exposedShooter = stance === "exposed";
  if (stance === "exposed") {
    enemy.cover = null;
    enemy.aggression = Math.max(enemy.aggression || 0, 1.15);
  }
  return enemy;
}

export function tagWaveStances(enemies) {
  (enemies || []).forEach(function (enemy, i) {
    tagEnemyStance(enemy, i);
  });
  return enemies;
}

export function seeksCover(enemy) {
  if (!enemy) return false;
  if (enemy.type === "charger" || enemy.meleeCharge) return false;
  if (enemy.coverBehavior === "rush") return false;
  return enemy.coverBehavior !== "exposed";
}

export function applyExposedHold(enemy, threat) {
  if (!enemy || !threat) return;
  var dx = threat.x - enemy.x,
    dy = threat.y - enemy.y,
    d = Math.hypot(dx, dy) || 1,
    range = 520;
  if (enemy.weapon) {
    if (enemy.weapon.role === "precision") range = 900;
    else if (enemy.weapon.role === "marksman") range = 760;
    else if (enemy.weapon.role === "flanker") range = 420;
    else if (enemy.weapon.role === "breach") range = 300;
    else if (enemy.weapon.role === "support") range = 640;
  }
  enemy.cover = null;
  enemy.exposed = true;
  enemy.targetX = threat.x - (dx / d) * range;
  enemy.targetY = threat.y - (dy / d) * range;
  if (enemy.combatState === "covered" || enemy.combatState === "tucking")
    enemy.combatState = "exposed";
}
