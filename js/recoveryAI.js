import { pickTacticalCover, applyCoverChoice, moveTowardTarget, coverStillUseful } from './combatAI.js?v=20260904-35';

export function shouldRecover(actor){
  if(!actor||actor.dead||actor.downed)return false;
  var pct=actor.maxHp>0?actor.hp/actor.maxHp:1;
  if(actor.recovering){if(pct>=.50){actor.recovering=false;actor.recoveryCoverChosen=false;return false}return true}
  if(pct<=.20){actor.recovering=true;actor.recoveryCoverChosen=false;actor.exposed=false;return true}
  return false
}

export function recoverInCover(actor,threat,covers,friendlies,dt){
  if(!shouldRecover(actor))return false;
  if(!threat){actor.targetX=actor.x;actor.targetY=actor.y;return true}
  var useful=actor.cover&&coverStillUseful(actor,threat,covers,120,2600);
  if(!useful&&!actor.recoveryCoverChosen){
    var choice=pickTacticalCover(actor,threat,covers,friendlies||[],{maxTravel:850,desiredRange:Math.min((actor.weapon&&actor.weapon.range||1200)*.82,1350),anchor:{x:actor.x,y:actor.y},anchorWeight:.28});
    if(choice){applyCoverChoice(actor,choice);actor.combatState='seeking';actor.recoveryCoverChosen=true}
  }
  if(actor.cover){
    actor.exposed=false;
    actor.targetX=actor.coverAnchorX;actor.targetY=actor.coverAnchorY;
    if(Math.hypot(actor.x-actor.coverAnchorX,actor.y-actor.coverAnchorY)>8)moveTowardTarget(actor,dt,1.12);
    else{actor.x=actor.coverAnchorX;actor.y=actor.coverAnchorY;actor.combatState='covered'}
  }
  return true
}
