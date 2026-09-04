import { getCoverSlot, isLineBlocked } from './cover.js?v=20260904-34';

function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

function occupiedSlots(cover,actors,ignore){
  var used={};
  for(var i=0;i<actors.length;i++){
    var a=actors[i];
    if(!a||a===ignore||a.dead||a.downed||a.cover!==cover)continue;
    used[a.coverSlotIndex||0]=true;
  }
  return used;
}

function slotIndexFor(cover,actors,ignore){
  var used=occupiedSlots(cover,actors,ignore);
  for(var i=0;i<3;i++)if(!used[i])return i;
  return 1;
}

function candidateSlot(cover,actor,threat,actors){
  var idx=slotIndexFor(cover,actors||[],actor);
  var proxy={x:actor.x,y:actor.y,coverSlotIndex:idx};
  var p=getCoverSlot(cover,proxy,threat);
  return {x:p.x,y:p.y,side:p.side,index:idx};
}

function flankValue(actor,threat,slot){
  var ax=actor.x-threat.x,ay=actor.y-threat.y,bx=slot.x-threat.x,by=slot.y-threat.y;
  var al=Math.hypot(ax,ay)||1,bl=Math.hypot(bx,by)||1;
  return clamp((ax*by-ay*bx)/(al*bl),-1,1);
}

export function coverProtects(cover,slot,threat){
  if(!cover||!slot||!threat)return false;
  return isLineBlocked({x:slot.x,y:slot.y},threat,[cover]);
}

export function pickTacticalCover(actor,threat,covers,friendlies,options){
  options=options||{};
  if(!actor||!threat||!covers||!covers.length)return null;
  var desired=options.desiredRange||560;
  var maxTravel=options.maxTravel||1150;
  var minThreat=options.minThreat||220;
  var maxThreat=options.maxThreat||Math.max(desired*1.9,1100);
  var flankSide=options.flankSide||0;
  var flankWeight=options.flankWeight==null?150:options.flankWeight;
  var anchor=options.anchor||null;
  var anchorWeight=options.anchorWeight==null?.18:options.anchorWeight;
  var forceNew=!!options.forceNew;
  var best=null,bestScore=Infinity;

  for(var i=0;i<covers.length;i++){
    var c=covers[i],travel=Math.hypot(c.x-actor.x,c.y-actor.y);
    if(travel>maxTravel)continue;
    var slot=candidateSlot(c,actor,threat,friendlies||[]);
    var threatDist=Math.hypot(slot.x-threat.x,slot.y-threat.y);
    if(threatDist<minThreat||threatDist>maxThreat)continue;

    var protection=coverProtects(c,slot,threat);
    var midpoint={x:(actor.x+slot.x)*.5,y:(actor.y+slot.y)*.5};
    var routeCovered=isLineBlocked(midpoint,threat,covers);
    var users=0;
    for(var j=0;j<(friendlies||[]).length;j++){
      var f=friendlies[j];
      if(f&&f!==actor&&!f.dead&&!f.downed&&f.cover===c)users++;
    }

    var score=travel*.62+Math.abs(threatDist-desired)*.38;
    score+=protection?-330:420;
    if(!routeCovered&&travel>170)score+=Math.min(260,travel*.26);
    if(routeCovered)score-=45;
    score+=users*150;
    if(c.type==='wide'||c.type==='car')score-=70;
    else if(c.type==='low')score+=20;
    if(c.segments&&c.segments.length>1)score-=55;

    var lateral=flankValue(actor,threat,slot);
    if(flankSide)score-=lateral*flankSide*flankWeight;
    else score-=Math.abs(lateral)*55;

    if(anchor){
      score+=Math.hypot(slot.x-anchor.x,slot.y-anchor.y)*anchorWeight;
    }
    if(actor.cover===c){
      score+=forceNew?420:-150;
    }
    if(actor.lastCoverId&&actor.lastCoverId===c.id&&forceNew)score+=180;
    score+=(Math.random()-.5)*36;

    if(score<bestScore){
      bestScore=score;
      best={cover:c,slot:slot,score:score,protected:protection,threatDistance:threatDist};
    }
  }
  return best;
}

export function applyCoverChoice(actor,choice){
  if(!actor||!choice)return false;
  if(actor.cover&&actor.cover!==choice.cover)actor.lastCoverId=actor.cover.id||null;
  actor.cover=choice.cover;
  actor.coverSlotIndex=choice.slot.index;
  actor.coverAnchorX=choice.slot.x;
  actor.coverAnchorY=choice.slot.y;
  actor.targetX=choice.slot.x;
  actor.targetY=choice.slot.y;
  actor.exposed=false;
  return true;
}

export function moveTowardTarget(actor,dt,speedScale){
  var dx=actor.targetX-actor.x,dy=actor.targetY-actor.y,d=Math.hypot(dx,dy);
  if(d<=6){actor.x=actor.targetX;actor.y=actor.targetY;return true}
  actor.facingX=dx/d;actor.facingY=dy/d;
  var step=Math.min(d,actor.speed*(speedScale||1)*dt);
  actor.x+=dx/d*step;
  actor.y+=dy/d*step;
  return d<=10;
}

export function faceThreat(actor,threat){
  if(!actor||!threat)return;
  var dx=threat.x-actor.x,dy=threat.y-actor.y,d=Math.hypot(dx,dy)||1;
  actor.facingX=dx/d;actor.facingY=dy/d;
}

export function coverStillUseful(actor,threat,covers,minRange,maxRange){
  if(!actor||!actor.cover||!threat)return false;
  var slot={x:actor.coverAnchorX,y:actor.coverAnchorY};
  if(!Number.isFinite(slot.x)||!Number.isFinite(slot.y))return false;
  var d=Math.hypot(slot.x-threat.x,slot.y-threat.y);
  if(d<(minRange||180)||d>(maxRange||1400))return false;
  return coverProtects(actor.cover,slot,threat);
}

export function peekPoint(actor,threat,amount){
  if(!actor||!actor.cover)return {x:actor.x,y:actor.y};
  var ax=actor.coverAnchorX,ay=actor.coverAnchorY;
  var tx=threat?threat.x-ax:1,ty=threat?threat.y-ay:0;
  var len=Math.hypot(tx,ty)||1;
  var px=-ty/len,py=tx/len;
  var side=(actor.coverSlotIndex||0)===0?-1:1;
  var step=amount||(actor.cover.type==='wide'?50:38);
  return {x:ax+px*step*side,y:ay+py*step*side};
}
