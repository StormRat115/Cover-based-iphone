export const CHARACTER_STATS={
  player:{hp:100,defense:50},
  Rook:{hp:150,defense:100},
  Viper:{hp:115,defense:50},
  Doc:{hp:130,defense:75}
};

export const ENEMY_STATS={
  rifleman:{defense:25},
  shotgunner:{defense:50},
  heavy:{defense:150},
  sniper:{defense:25},
  marksman:{defense:50},
  smg:{defense:25},
  pistol:{defense:0}
};

export function damageMultiplier(defense){
  defense=Math.max(0,Number(defense)||0);
  return 100/(100+defense);
}

export function mitigateDamage(rawDamage,defense){
  var raw=Math.max(0,Number(rawDamage)||0);
  if(raw<=0)return 0;
  return raw*damageMultiplier(defense);
}

export function damageReductionPercent(defense){
  return Math.round((1-damageMultiplier(defense))*100);
}
