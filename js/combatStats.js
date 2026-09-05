export const GENERAL_ACCURACY_PENALTY=-5;

export const CHARACTER_STATS={
  player:{hp:100,defense:50,accuracy:6,regen:5,damage:3},
  Rook:{hp:150,defense:100,accuracy:4,regen:4,damage:4},
  Viper:{hp:115,defense:50,accuracy:2,regen:5,damage:2},
  Doc:{hp:130,defense:75,accuracy:8,regen:7,damage:5}
};

export const ENEMY_STATS={
  rifleman:{defense:25,accuracy:0,damage:0},
  shotgunner:{defense:50,accuracy:-2,damage:1},
  heavy:{defense:150,accuracy:-4,damage:0},
  sniper:{defense:25,accuracy:5,damage:3},
  marksman:{defense:50,accuracy:3,damage:2},
  smg:{defense:25,accuracy:-3,damage:0},
  pistol:{defense:0,accuracy:1,damage:0}
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

export function finalAccuracy(baseChance,weaponAccuracy,characterAccuracy){
  return Math.max(5,Math.min(98,(Number(baseChance)||0)+(Number(weaponAccuracy)||0)+(Number(characterAccuracy)||0)+GENERAL_ACCURACY_PENALTY));
}

export function attackDamage(weaponDamage,characterDamage){
  return Math.max(0,(Number(weaponDamage)||0)+(Number(characterDamage)||0));
}
