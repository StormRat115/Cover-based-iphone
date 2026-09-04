export const WEAPONS={
  rifle:{id:'rifle',name:'ASSAULT RIFLE',short:'RIFLE',damage:24,range:560,cooldown:.32,magazine:24,reload:1.35,accuracy:0,pellets:1,role:'assault'},
  pistol:{id:'pistol',name:'SIDEARM',short:'PISTOL',damage:16,range:380,cooldown:.42,magazine:15,reload:1.05,accuracy:2,pellets:1,role:'backup'},
  shotgun:{id:'shotgun',name:'BREACH SHOTGUN',short:'SHOTGUN',damage:13,range:300,cooldown:.9,magazine:6,reload:1.65,accuracy:-4,pellets:7,role:'breach'},
  sniper:{id:'sniper',name:'PRECISION RIFLE',short:'SNIPER',damage:72,range:900,cooldown:1.65,magazine:5,reload:1.8,accuracy:8,pellets:1,role:'precision'},
  lmg:{id:'lmg',name:'LIGHT MACHINE GUN',short:'LMG',damage:16,range:620,cooldown:.19,magazine:48,reload:2.15,accuracy:-7,pellets:1,role:'support'},
  dmr:{id:'dmr',name:'DESIGNATED MARKSMAN RIFLE',short:'DMR',damage:38,range:760,cooldown:.68,magazine:12,reload:1.55,accuracy:6,pellets:1,role:'marksman'},
  smg:{id:'smg',name:'SUBMACHINE GUN',short:'SMG',damage:18,range:430,cooldown:.15,magazine:32,reload:1.25,accuracy:-6,pellets:1,role:'flanker'}
};
export function weaponCopy(id){const w=WEAPONS[id]||WEAPONS.rifle;return Object.assign({},w,{ammo:w.magazine,recoil:0,fireCooldown:0})}
export function getWeapon(id){return WEAPONS[id]||WEAPONS.rifle}
