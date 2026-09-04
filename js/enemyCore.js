import { isLineBlocked, getHitChance } from './cover.js?v=20260904-34';
import { weaponCopy } from './weapons.js';
import { pickTacticalCover, applyCoverChoice, moveTowardTarget, faceThreat, coverStillUseful, peekPoint } from './combatAI.js?v=20260904-34';

var TYPES={
  rifleman:{weapon:'rifle',hp:60,speed:205,scale:1},
  shotgunner:{weapon:'shotgun',hp:90,speed:190,scale:1.05},
  heavy:{weapon:'lmg',hp:150,speed:160,scale:1.15},
  sniper:{weapon:'sniper',hp:55,speed:180,scale:.95},
  marksman:{weapon:'dmr',hp:75,speed:190,scale:1},
  smg:{weapon:'smg',hp:52,speed:235,scale:.98},
  pistol:{weapon:'pistol',hp:45,speed:220,scale:.95}
};
var SPAWNS=[
  [-1500,-1180],[-980,-1320],[-280,-1350],[500,-1330],[1240,-1160],[1490,-560],
  [1540,180],[1380,920],[760,1260],[40,1320],[-700,1240],[-1320,900],[-1510,230],[-1420,-590]
];

function rand(a,b){return a+Math.random()*(b-a)}

export function createBandits(wave){
  wave=wave||1;
  var count=Math.min(SPAWNS.length,5+wave*2);
  return SPAWNS.slice(0,count).map(function(pos,i){
    var x=pos[0],y=pos[1],type='rifleman';
    if(wave>=2&&i%5===1)type='shotgunner';
    if(wave>=2&&i%6===3)type='heavy';
    if(wave>=3&&i%4===0)type='sniper';
    if(wave>=3&&i%7===4)type='marksman';
    if(wave>=4&&i%6===1)type='smg';
    if(wave>=4&&i%8===6)type='pistol';
    var s=TYPES[type],w=weaponCopy(s.weapon);
    return {
      x:x,y:y,type:type,weapon:w,hp:s.hp,maxHp:s.hp,fire:w.cooldown*2+i*.08,t:i*.35,
      dead:false,deathTimer:0,deathDuration:.8,muzzle:0,hit:0,targetX:x,targetY:y,
      moveTimer:.35+i*.06,spawnTimer:1.8+(i%3)*.28,cover:null,coverSlotIndex:i%3,
      speed:s.speed,facingX:x<0?1:-1,facingY:0,scale:s.scale,reloadTimer:0,
      combatState:'seeking',combatTimer:0,shotsLeft:0,coverCycles:0,
      coverAnchorX:x,coverAnchorY:y,exposed:true,lastCoverId:null,
      flankSide:i%2===0?1:-1,repositionCooldown:0
    };
  });
}

function desiredRange(e){
  if(e.weapon.role==='precision')return 980;
  if(e.weapon.role==='marksman')return 820;
  if(e.weapon.role==='flanker')return 470;
  if(e.weapon.role==='breach')return 350;
  if(e.weapon.role==='support')return 690;
  return 650;
}

function enterCovered(e){
  e.combatState='covered';
  e.combatTimer=rand(.45,.85);
  e.exposed=false;
  e.targetX=e.coverAnchorX;e.targetY=e.coverAnchorY;
  e.coverCycles++;
}
function enterExposed(e,player){
  e.combatState='exposed';
  e.combatTimer=rand(1.25,2.15);
  e.shotsLeft=3+Math.floor(Math.random()*5);
  e.exposed=true;
  var p=peekPoint(e,player,e.cover&&e.cover.type==='wide'?62:48);
  e.targetX=p.x;e.targetY=p.y;
}
function enterTucking(e){
  e.combatState='tucking';
  e.combatTimer=rand(.3,.62);
  e.exposed=true;
  e.targetX=e.coverAnchorX;e.targetY=e.coverAnchorY;
}
function chooseCover(e,player,covers,enemies,forceNew){
  var role=e.weapon.role;
  var choice=pickTacticalCover(e,player,covers,enemies,{
    desiredRange:desiredRange(e),
    maxTravel:1250,
    minThreat:role==='breach'?180:role==='flanker'?220:300,
    maxThreat:role==='precision'?1550:role==='marksman'?1400:1250,
    flankSide:(role==='flanker'||role==='assault')?e.flankSide:0,
    flankWeight:role==='flanker'?300:role==='assault'?160:80,
    forceNew:!!forceNew
  });
  if(choice){
    applyCoverChoice(e,choice);
    e.combatState='seeking';
    e.exposed=true;
    e.coverCycles=0;
    return true;
  }
  return false;
}
function shouldReposition(e,player,covers){
  if(!coverStillUseful(e,player,covers,190,e.weapon.role==='precision'?1600:1350))return true;
  if(e.coverCycles<2)return false;
  var chance=e.weapon.role==='flanker'?.48:e.weapon.role==='breach'?.38:e.weapon.role==='precision'?.12:.23;
  if(e.hp<e.maxHp*.35)chance*=.45;
  return Math.random()<chance;
}

export function updateBandits(enemies,dt,player,covers,spawnProjectile){
  if(typeof window!=='undefined')window.__battleEnemies=enemies;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(e.dead){e.deathTimer=Math.min(e.deathDuration,e.deathTimer+dt);continue}
    e.t+=dt;e.fire-=dt;e.muzzle=Math.max(0,e.muzzle-dt);e.hit=Math.max(0,e.hit-dt);
    e.repositionCooldown=Math.max(0,(e.repositionCooldown||0)-dt);

    if(e.spawnTimer>0){
      e.spawnTimer=Math.max(0,e.spawnTimer-dt);
      faceThreat(e,player);
      continue;
    }

    var dist=Math.hypot(player.x-e.x,player.y-e.y);

    if(!e.cover&&e.repositionCooldown<=0){
      if(!chooseCover(e,player,covers,enemies,false)){
        var dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;
        e.targetX=player.x-dx/d*desiredRange(e);
        e.targetY=player.y-dy/d*desiredRange(e);
        e.combatState='seeking';
        e.exposed=true;
      }
      e.repositionCooldown=.45;
    }

    if(e.cover&&e.combatState!=='seeking'&&e.combatState!=='tucking'&&shouldReposition(e,player,covers)&&e.repositionCooldown<=0){
      if(chooseCover(e,player,covers,enemies,true))e.repositionCooldown=1.0;
    }

    if(dist<240&&e.repositionCooldown<=0&&e.combatState!=='seeking'){
      if(chooseCover(e,player,covers,enemies,true))e.repositionCooldown=.8;
    }

    if(e.combatState==='seeking'){
      e.exposed=true;
      if(moveTowardTarget(e,dt,1.08)){
        if(e.cover)enterCovered(e);
        else{
          e.combatState='exposed';
          e.combatTimer=rand(1.0,1.5);
          e.shotsLeft=3+Math.floor(Math.random()*3);
        }
      }
    }else if(e.combatState==='covered'){
      e.exposed=false;
      e.targetX=e.coverAnchorX;e.targetY=e.coverAnchorY;
      moveTowardTarget(e,dt,1);
      faceThreat(e,player);
      e.combatTimer-=dt;
      if(e.combatTimer<=0&&dist<e.weapon.range*1.18&&!e.weapon.reloading)enterExposed(e,player);
    }else if(e.combatState==='exposed'){
      e.exposed=true;
      if(e.cover){
        var pp=peekPoint(e,player,e.cover.type==='wide'?62:48);
        e.targetX=pp.x;e.targetY=pp.y;
        moveTowardTarget(e,dt,.88);
      }
      faceThreat(e,player);
      e.combatTimer-=dt;
      if(e.combatTimer<=0||e.shotsLeft<=0){
        if(e.cover)enterTucking(e);
        else{
          e.combatState='seeking';
          e.repositionCooldown=0;
        }
      }
    }else if(e.combatState==='tucking'){
      e.exposed=true;
      e.targetX=e.coverAnchorX;e.targetY=e.coverAnchorY;
      var tucked=moveTowardTarget(e,dt,1.18);
      e.combatTimer-=dt;
      if(tucked||e.combatTimer<=0)enterCovered(e);
    }

    dist=Math.hypot(player.x-e.x,player.y-e.y);
    var lineBlocked=isLineBlocked(e,player,covers);
    var chance=Math.max(8,Math.min(98,getHitChance(e,player,covers)+e.weapon.accuracy));
    e.lastHitChance=chance;

    if(e.weapon.ammo<=0&&!e.weapon.reloading){
      e.weapon.reloading=true;e.reloadTimer=e.weapon.reload;
      if(e.cover&&e.combatState==='exposed')enterTucking(e);
    }
    if(e.weapon.reloading){
      e.reloadTimer-=dt;
      if(e.reloadTimer<=0){e.weapon.reloading=false;e.weapon.ammo=e.weapon.magazine}
    }

    var peekOffset=e.cover?Math.hypot(e.x-e.coverAnchorX,e.y-e.coverAnchorY):999;
    var canFire=dist<e.weapon.range&&!e.weapon.reloading&&e.exposed&&(!lineBlocked||peekOffset>28);
    if(e.fire<=0&&canFire){
      e.fire=e.weapon.cooldown+Math.random()*e.weapon.cooldown*.55;
      faceThreat(e,player);
      e.muzzle=.13;
      if(e.cover&&e.combatState==='exposed')e.shotsLeft--;
      if(spawnProjectile){var hitShot=Math.random()*100<chance;spawnProjectile(e,player,'enemy',hitShot?e.weapon.damage:0);}
    }
  }
}
