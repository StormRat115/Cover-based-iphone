import { createAllies, updateAllies as updateAlliesCore, SQUAD_MODES } from './allyCore2.js?v=20260904-37';
import { drawSoldier } from './soldierAssets.js?v=20260904-37';

export { createAllies, SQUAD_MODES };

var ALLY_LINES={
  contact:['CONTACT!','ENEMY SPOTTED!','I SEE THEM!','EYES UP!'],
  fire:['ENGAGING!','SENDING ROUNDS!','KEEP THEIR HEADS DOWN!','ON TARGET!'],
  cover:['I\'M SET!','HOLDING HERE!','COVERING!','GOOD POSITION!'],
  move:['MOVING!','COVER ME!','PUSHING UP!','REPOSITIONING!'],
  danger:['TAKING FIRE!','I\'M PINNED!','GET DOWN!','ROUNDS INCOMING!'],
  kill:['TARGET DOWN!','ONE DOWN!','GOT ONE!','HOSTILE DOWN!'],
  calm:['STAY SHARP.','WATCH YOUR SECTORS.','CHECK AMMO.','STAY WITH ME.']
};
function pick(list){return list[Math.floor(Math.random()*list.length)]}
function flavor(a,key,chance,duration){if(a.calloutTimer>0||Math.random()>chance)return;a.callout=pick(ALLY_LINES[key]);a.calloutTimer=duration||1.5}
export function updateAllies(allies,dt,player,covers,enemies,spawnProjectile,mode){
  updateAlliesCore(allies,dt,player,covers,enemies,spawnProjectile,mode);
  var alive=enemies.some(function(e){return !e.dead});
  allies.forEach(function(a){
    if(a.dead||a.downed)return;
    a.flavorClock=(a.flavorClock||(.8+Math.random()*2))-dt;
    a.lastFlavorState=a.lastFlavorState||'';
    if(a.hit>0)flavor(a,'danger',.22,1.5);
    if(a.combatState!==a.lastFlavorState){
      if(a.combatState==='seeking')flavor(a,'move',.22,1.35);
      else if(a.combatState==='covered')flavor(a,'cover',.16,1.3);
      else if(a.combatState==='exposed')flavor(a,'fire',.20,1.3);
      a.lastFlavorState=a.combatState;
    }
    if(a.flavorClock<=0){
      a.flavorClock=3.8+Math.random()*5.5;
      if(alive)flavor(a,a.exposed?'fire':'contact',.32,1.4);
      else flavor(a,'calm',.30,1.5);
    }
  });
}

export function drawAlly(ctx,a,iso){var p=iso(a.x,a.y),sx=p[0],sy=p[1];ctx.save();ctx.translate(sx,sy);if(a.downed){ctx.globalAlpha=.78;ctx.fillStyle='#d85b50';ctx.fillRect(-11,-6,22,3);ctx.fillStyle='#fff';ctx.font='900 8px system-ui';ctx.textAlign='center';ctx.fillText('DOWNED '+Math.max(0,Math.ceil(a.downDuration-a.downTimer))+'s',0,-17);ctx.globalAlpha=1}if(!a.dead&&!a.downed&&a.hp<a.maxHp){ctx.fillStyle='#111';ctx.fillRect(-12,-45,24,3);ctx.fillStyle='#58a8ff';ctx.fillRect(-12,-45,24*Math.max(0,a.hp/a.maxHp),3)}if(a.hit>0&&!a.dead&&!a.downed){ctx.globalAlpha=.45;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-20,14,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}drawSoldier(ctx,a,{x:0,y:0,team:'ally',scale:.30,alpha:(a.dead ? .94 : a.downed ? .74 : 1)});ctx.fillStyle='#fff';ctx.font='800 8px system-ui';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.shadowColor='#000';ctx.shadowBlur=3;ctx.fillText((a.name||'ALLY')+' · '+a.weapon.short,0,-44);if(a.calloutTimer>0&&!a.dead){var text=a.callout,bw=Math.min(148,Math.max(64,text.length*6+18)),by=-73;ctx.font='900 9px system-ui';ctx.fillStyle='#eef3ef';ctx.beginPath();ctx.moveTo(-bw/2,by-18);ctx.quadraticCurveTo(-bw/2-3,by-18,-bw/2-3,by-14);ctx.lineTo(-bw/2-3,by-2);ctx.quadraticCurveTo(-bw/2-3,by+2,-bw/2+1,by+2);ctx.lineTo(-8,by+2);ctx.lineTo(-3,by+8);ctx.lineTo(0,by+2);ctx.lineTo(bw/2-3,by+2);ctx.quadraticCurveTo(bw/2,by+2,bw/2,by+2);ctx.lineTo(bw/2,by-14);ctx.quadraticCurveTo(bw/2,by-18,bw/2-3,by-18);ctx.closePath();ctx.fill();ctx.fillStyle='#18201d';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,0,by-9)}ctx.restore()}
