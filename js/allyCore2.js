import { isLineBlocked, getHitChance } from './cover.js?v=20260904-35';
import { weaponCopy } from './weapons.js';
import { pickTacticalCover, applyCoverChoice, moveTowardTarget, faceThreat, coverStillUseful, peekPoint } from './combatAI.js?v=20260904-35';

export const SQUAD_MODES=['FOLLOW','HOLD','ASSAULT','FOCUS'];
var squadMode='FOLLOW',healthHud=null;
var SQUAD=[
  {name:'Rook',weapon:'rifle',role:'assault',speed:205,regen:4,hp:80},
  {name:'Viper',weapon:'smg',role:'flanker',speed:235,regen:4,hp:80},
  {name:'Doc',weapon:'dmr',role:'marksman',speed:180,regen:5,hp:100}
];

function rand(a,b){return a+Math.random()*(b-a)}
function wireSquadCommands(){
  var buttons=document.querySelectorAll('#squadCommands button');
  buttons.forEach(function(b,i){
    b.classList.toggle('active',i===0);
    b.addEventListener('pointerdown',function(e){
      e.preventDefault();
      squadMode=b.dataset.command||'FOLLOW';
      window.squadMode=squadMode;
      buttons.forEach(function(x){x.classList.toggle('active',x===b)});
    });
  });
}
function ensureHealthHud(){
  if(healthHud)return healthHud;
  healthHud=document.createElement('div');
  healthHud.id='allyHealth';
  healthHud.style.cssText='position:fixed;left:12px;top:calc(env(safe-area-inset-top) + 104px);width:145px;padding:7px 8px;border:1px solid #ffffff22;border-radius:9px;background:#101714cc;backdrop-filter:blur(4px);z-index:5;pointer-events:none;font:800 10px system-ui;color:#e8eee9;letter-spacing:.6px;text-shadow:0 1px 3px #000';
  document.body.appendChild(healthHud);
  return healthHud;
}
function updateHealthHud(allies){
  var h=ensureHealthHud();
  h.innerHTML='<div style="font-size:9px;color:#8fb7c8;letter-spacing:1.2px;margin-bottom:4px">SQUAD STATUS</div>'+allies.map(function(a){
    var pct=Math.round(Math.max(0,a.hp)/a.maxHp*100);
    var label=a.dead?'KIA':a.downed?'DOWNED':pct+'%';
    var color=a.dead?'#666':pct>55?'#61b86b':pct>25?'#d6b74d':'#d85b50';
    return '<div style="margin:2px 0 5px;opacity:'+(a.dead?'.4':'1')+'"><div style="display:flex;justify-content:space-between"><span>'+a.name+' · '+a.weapon.short+'</span><span>'+label+'</span></div><div style="height:4px;background:#303733;border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+color+'"></div></div></div>';
  }).join('');
}

if(typeof window!=='undefined'){
  window.squadMode='FOLLOW';
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',wireSquadCommands);
  else wireSquadCommands();
}

export function createAllies(){
  var starts=[[-70,170],[75,185],[0,260]];
  var allies=SQUAD.map(function(s,i){
    var pos=starts[i],w=weaponCopy(s.weapon);
    return {
      name:s.name,role:s.role,weapon:w,x:pos[0],y:pos[1],hp:s.hp,maxHp:s.hp,lastHp:s.hp,
      fire:.4+i*.4,t:0,dead:false,permadead:false,downed:false,downTimer:0,downDuration:11,
      reviveTimer:0,reviveDuration:2.5,deathTimer:0,deathDuration:.8,muzzle:0,hit:0,
      targetX:pos[0],targetY:pos[1],moveTimer:.2+i*.3,cover:null,coverSlotIndex:i,speed:s.speed,
      facingX:i===1?-1:1,facingY:0,scale:1,timeSinceDamage:99,regenDelay:3,regenRate:s.regen,
      callout:'',calloutTimer:0,lastCalloutHealth:s.hp,reloadTimer:0,reloading:false,
      flankSide:i===1?-1:1,combatState:'seeking',combatTimer:0,shotsLeft:0,coverCycles:0,
      coverAnchorX:pos[0],coverAnchorY:pos[1],exposed:true,lastCoverId:null,repositionCooldown:0
    };
  });
  if(typeof window!=='undefined')window.__battleAllies=allies;
  return allies;
}

function say(a,text,duration){a.callout=text;a.calloutTimer=duration||1.8}
function nearestEnemy(a,enemies){
  var best=null,bd=Infinity;
  enemies.forEach(function(e){if(e.dead)return;var d=Math.hypot(a.x-e.x,a.y-e.y);if(d<bd){bd=d;best=e}});
  return {target:best,dist:bd};
}
function focusEnemy(player,enemies){
  var best=null,bd=Infinity;
  enemies.forEach(function(e){if(e.dead)return;var d=Math.hypot(player.x-e.x,player.y-e.y);if(d<bd){bd=d;best=e}});
  return {target:best,dist:bd};
}
function weakestEnemy(enemies){
  var best=null,score=-Infinity;
  enemies.forEach(function(e){if(e.dead)return;var s=(1-e.hp/e.maxHp)*2+Math.random()*.15;if(s>score){score=s;best=e}});
  return best;
}
function separateFromSquad(a,allies){
  var sx=0,sy=0,n=0;
  allies.forEach(function(o){
    if(o===a||o.dead||o.downed)return;
    var dx=a.x-o.x,dy=a.y-o.y,d=Math.hypot(dx,dy);
    if(d<110&&d>0){sx+=dx/d*(110-d);sy+=dy/d*(110-d);n++}
  });
  return n?{x:sx/n,y:sy/n}:null;
}
function tryRevive(a,allies,player,dt){
  var best=null,bd=Infinity;
  allies.forEach(function(o){
    if(o===a||o.dead||!o.downed)return;
    var d=Math.hypot(a.x-o.x,a.y-o.y);
    if(d<58&&d<bd){bd=d;best=o}
  });
  if(player&&player.downed&&!player.dead){
    var pd=Math.hypot(a.x-player.x,a.y-player.y);
    if(pd<58&&pd<bd){bd=pd;best=player}
  }
  if(!best){a.reviveTimer=0;return false}
  a.targetX=a.x;a.targetY=a.y;a.cover=null;a.exposed=false;a.reviveTimer+=dt;
  if(a.reviveTimer>=a.reviveDuration){
    a.reviveTimer=0;
    if(best.revive)best.revive();
    say(a,'BACK ON YOUR FEET!',1.5);
    if(best!==player)say(best,"I'M UP!",1.4);
  }
  return true;
}

function desiredRange(a,mode){
  if(a.role==='marksman')return mode==='ASSAULT'?610:790;
  if(a.role==='flanker')return mode==='ASSAULT'?360:470;
  return mode==='ASSAULT'?420:560;
}
function enterCovered(a){
  a.combatState='covered';
  a.combatTimer=rand(.55,1.0);
  a.exposed=false;
  a.targetX=a.coverAnchorX;
  a.targetY=a.coverAnchorY;
  a.coverCycles++;
}
function enterExposed(a,target){
  a.combatState='exposed';
  a.combatTimer=rand(.65,1.15);
  a.shotsLeft=2+Math.floor(Math.random()*3);
  a.exposed=true;
  var p=peekPoint(a,target,a.cover&&a.cover.type==='wide'?54:42);
  a.targetX=p.x;a.targetY=p.y;
}
function enterTucking(a){
  a.combatState='tucking';
  a.combatTimer=rand(.25,.5);
  a.exposed=true;
  a.targetX=a.coverAnchorX;
  a.targetY=a.coverAnchorY;
}
function chooseCover(a,target,player,covers,allies,mode,forceNew){
  var desired=desiredRange(a,mode);
  var choice=pickTacticalCover(a,target,covers,allies,{
    desiredRange:desired,
    maxTravel:mode==='HOLD'?700:1050,
    minThreat:a.role==='flanker'?220:280,
    maxThreat:a.role==='marksman'?1350:1150,
    flankSide:a.role==='flanker'?a.flankSide:0,
    flankWeight:a.role==='flanker'?260:100,
    anchor:mode==='FOLLOW'?player:null,
    anchorWeight:mode==='FOLLOW' ? .22 : .08,
    forceNew:!!forceNew
  });
  if(choice){
    applyCoverChoice(a,choice);
    a.combatState='seeking';
    a.exposed=true;
    a.coverCycles=0;
    return true;
  }
  return false;
}
function maybeReposition(a,target,covers,mode){
  if(mode==='HOLD')return !coverStillUseful(a,target,covers,190,1350);
  if(!coverStillUseful(a,target,covers,210,a.role==='marksman'?1450:1250))return true;
  if(a.coverCycles<3)return false;
  var chance=a.role==='flanker' ? .45 : a.role==='marksman' ? .16 : .25;
  if(mode==='ASSAULT')chance+=.15;
  return Math.random()<chance;
}

export function updateAllies(allies,dt,player,covers,enemies,spawnProjectile,mode){
  mode=mode||squadMode||'FOLLOW';
  updateHealthHud(allies);
  for(var i=0;i<allies.length;i++){
    var a=allies[i];
    if(a.dead){a.deathTimer=Math.min(a.deathDuration,a.deathTimer+dt);continue}
    a.t+=dt;a.fire-=dt;a.muzzle=Math.max(0,a.muzzle-dt);a.hit=Math.max(0,a.hit-dt);
    a.calloutTimer=Math.max(0,a.calloutTimer-dt);a.timeSinceDamage+=dt;
    a.repositionCooldown=Math.max(0,(a.repositionCooldown||0)-dt);

    if(a.hp<a.lastHp){
      a.timeSinceDamage=0;
      if(a.hp<a.maxHp*.35&&a.calloutTimer<=0)say(a,"I'M INJURED",1.6);
    }
    a.lastHp=a.hp;
    if(a.hp<=0&&!a.downed){a.downed=true;a.downTimer=0;a.hp=0;a.exposed=false;say(a,"I'M DOWNED",1.7)}
    if(a.downed){
      a.downTimer+=dt;
      if(a.downTimer>=a.downDuration){a.permadead=true;a.dead=true;a.downed=false;a.deathTimer=0}
      continue;
    }
    if(a.hp<a.maxHp&&a.timeSinceDamage>=a.regenDelay)a.hp=Math.min(a.maxHp,a.hp+a.regenRate*dt);

    if(a.reloading){
      a.reloadTimer-=dt;
      if(a.reloadTimer<=0){a.reloading=false;a.weapon.ammo=a.weapon.magazine}
    }
    if(tryRevive(a,allies,player,dt))continue;

    var pick,target=null,dist=Infinity;
    if(a.role==='marksman'&&mode!=='ASSAULT'){
      target=weakestEnemy(enemies);
      dist=target?Math.hypot(a.x-target.x,a.y-target.y):Infinity;
    }else if(mode==='FOCUS'){
      pick=focusEnemy(player,enemies);target=pick.target;dist=pick.dist;
    }else{
      pick=nearestEnemy(a,enemies);target=pick.target;dist=pick.dist;
    }

    if(!target){
      a.exposed=false;
      if(a.cover){
        a.targetX=a.coverAnchorX;a.targetY=a.coverAnchorY;
        moveTowardTarget(a,dt,1);
      }else{
        a.targetX=player.x+(a.role==='flanker'?a.flankSide*120:(a.x<player.x?-75:75));
        a.targetY=player.y+90+(a.role==='marksman'?-80:70);
        moveTowardTarget(a,dt,.9);
      }
      continue;
    }

    if(!a.cover&&a.repositionCooldown<=0){
      if(!chooseCover(a,target,player,covers,allies,mode,false)){
        a.targetX=player.x+(a.role==='flanker'?a.flankSide*150:(a.x<player.x?-100:100));
        a.targetY=player.y+80;
      }
      a.repositionCooldown=.45;
    }

    if(mode==='FOLLOW'&&Math.hypot(a.x-player.x,a.y-player.y)>900&&a.repositionCooldown<=0){
      chooseCover(a,target,player,covers,allies,mode,true);
      a.repositionCooldown=.8;
    }

    if(a.cover&&a.combatState!=='seeking'&&a.combatState!=='tucking'&&maybeReposition(a,target,covers,mode)&&a.repositionCooldown<=0){
      if(chooseCover(a,target,player,covers,allies,mode,true)){
        a.repositionCooldown=1.2;
        if(a.calloutTimer<=0&&a.role==='flanker')say(a,'MOVING!',1.1);
      }
    }

    if(a.combatState==='seeking'){
      a.exposed=true;
      var sep=separateFromSquad(a,allies);
      if(sep&&mode!=='HOLD'){a.targetX+=sep.x*.35;a.targetY+=sep.y*.35}
      if(moveTowardTarget(a,dt,1.05))enterCovered(a);
    }else if(a.combatState==='covered'){
      a.exposed=false;
      a.targetX=a.coverAnchorX;a.targetY=a.coverAnchorY;
      moveTowardTarget(a,dt,1);
      a.combatTimer-=dt;
      faceThreat(a,target);
      if(a.combatTimer<=0&&dist<a.weapon.range*1.08&&!a.reloading)enterExposed(a,target);
    }else if(a.combatState==='exposed'){
      a.exposed=true;
      var pp=peekPoint(a,target,a.cover&&a.cover.type==='wide'?54:42);
      a.targetX=pp.x;a.targetY=pp.y;
      moveTowardTarget(a,dt,.85);
      faceThreat(a,target);
      a.combatTimer-=dt;
      if(a.combatTimer<=0||a.shotsLeft<=0)enterTucking(a);
    }else if(a.combatState==='tucking'){
      a.exposed=true;
      a.targetX=a.coverAnchorX;a.targetY=a.coverAnchorY;
      var tucked=moveTowardTarget(a,dt,1.15);
      a.combatTimer-=dt;
      if(tucked||a.combatTimer<=0)enterCovered(a);
    }

    dist=Math.hypot(a.x-target.x,a.y-target.y);
    var lineBlocked=isLineBlocked(a,target,covers);
    var chance=Math.max(12,Math.min(98,getHitChance(a,target,covers)+a.weapon.accuracy));
    a.lastHitChance=chance;

    if(a.weapon.ammo<=0&&!a.reloading){
      a.reloading=true;a.reloadTimer=a.weapon.reload;say(a,'RELOADING',1.1);
      if(a.cover&&a.combatState==='exposed')enterTucking(a);
    }

    var peekOffset=a.cover?Math.hypot(a.x-a.coverAnchorX,a.y-a.coverAnchorY):999;
    var canFire=dist<a.weapon.range&&!a.reloading&&a.exposed&&(!lineBlocked||peekOffset>24);
    if(a.fire<=0&&canFire){
      a.fire=a.weapon.cooldown*(a.role==='flanker' ? .9 : 1.05)+Math.random()*.16;
      faceThreat(a,target);
      a.muzzle=.1;
      if(a.cover&&a.combatState==='exposed')a.shotsLeft--;
      if(spawnProjectile){var hitShot=Math.random()*100<chance;spawnProjectile(a,target,'ally',hitShot?a.weapon.damage:0);}
    }
  }
}
