import { drawCityAsset } from './cityAssets.js?v=20260904-34';
import { createCityCoverLayout } from './cityMap.js?v=20260904-34';

/* Tactical cover driven by the city battlefield atlas, with threat-aware cover sides. */
export function createCover(){
  const layout=createCityCoverLayout().map(function(item){
    return{id:item.id,x:item.x,y:item.y,w:item.w||120,h:item.h||34,type:item.coverType||'low',asset:item.asset,scale:item.scale||.24,segments:item.segments||null};
  });
  if(typeof window!=='undefined')window.__battleCovers=layout;
  return layout;
}
function pieces(c){
  return c.segments&&c.segments.length?c.segments.map(function(s){
    return{x:c.x+(s.dx||0),y:c.y+(s.dy||0),w:s.w,h:s.h,type:c.type};
  }):[{x:c.x,y:c.y,w:c.w,h:c.h,type:c.type}];
}
function inside(p,x,y,padX,padY){return Math.abs(x-p.x)<p.w/2+padX&&Math.abs(y-p.y)<p.h/2+padY}
export function findCoverForPoint(x,y,covers){
  for(const c of covers){const ps=pieces(c);for(const p of ps)if(inside(p,x,y,24,18))return c}
  return null;
}
export function getCoverSlot(c,actor,threat){
  var side='bottom';
  if(threat){
    var dx=threat.x-c.x,dy=threat.y-c.y;
    if(Math.abs(dx)>Math.abs(dy)*1.15)side=dx<0?'right':'left';
    else side=dy<0?'bottom':'top';
  }else if(actor){
    var adx=actor.x-c.x,ady=actor.y-c.y;
    if(Math.abs(adx)>Math.abs(ady)*1.15)side=adx<0?'left':'right';
    else side=ady<0?'top':'bottom';
  }

  var inset=c.type==='wide'?24:18;
  var slot=actor&&Number.isFinite(actor.coverSlotIndex)?Math.max(0,Math.min(2,actor.coverSlotIndex)):0;
  var offsets=[-1,0,1],x=c.x,y=c.y;
  if(side==='top'||side==='bottom'){
    var usableX=Math.max(18,c.w/2-inset);
    var spreadX=c.type==='wide'?Math.min(58,usableX*.78):Math.min(44,usableX*.78);
    x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,c.x+offsets[slot]*spreadX));
    y=side==='top'?c.y-c.h/2-28:c.y+c.h/2+28;
  }else{
    var usableY=Math.max(16,c.h/2+20);
    var spreadY=Math.min(38,usableY*.72);
    y=c.y+offsets[slot]*spreadY;
    x=side==='left'?c.x-c.w/2-28:c.x+c.w/2+28;
  }

  if(c.segments&&c.segments.length>1&&slot===2){
    var s=c.segments[1],sx=c.x+(s.dx||0),sy=c.y+(s.dy||0);
    if(side==='top'||side==='bottom'){
      x=sx;y=sy+(side==='top'?-s.h/2-24:s.h/2+24);
    }else{
      x=sx+(side==='left'?-s.w/2-24:s.w/2+24);y=sy;
    }
  }
  return{x:x,y:y,side:side};
}
export function getCoverPeekOptions(c,actor,threat){
  const anchor=getCoverSlot(c,actor,threat);
  if(!threat)return[{x:anchor.x-36,y:anchor.y},{x:anchor.x+36,y:anchor.y}];
  const dx=threat.x-anchor.x,dy=threat.y-anchor.y,d=Math.hypot(dx,dy)||1;
  const nx=dx/d,ny=dy/d,px=-ny,py=nx;
  const sideAmt=c.type==='wide'?58:c.type==='car'?54:c.type==='low'?42:48;
  const toward=c.type==='low'?12:18;
  let opts=[
    {x:anchor.x+px*sideAmt+nx*toward,y:anchor.y+py*sideAmt+ny*toward,side:-1},
    {x:anchor.x-px*sideAmt+nx*toward,y:anchor.y-py*sideAmt+ny*toward,side:1}
  ];
  if(c.segments&&c.segments.length>1){
    for(const s of c.segments){
      const cx=c.x+(s.dx||0),cy=c.y+(s.dy||0),sx=Math.max(28,(s.w||c.w)*.48),sy=Math.max(28,(s.h||c.h)*.48);
      opts.push({x:cx+px*sx+nx*14,y:cy+py*sy+ny*14,side:-1});
      opts.push({x:cx-px*sx+nx*14,y:cy-py*sy+ny*14,side:1});
    }
  }
  return opts;
}
export function chooseCoverPeek(c,actor,threat,covers){
  const opts=getCoverPeekOptions(c,actor,threat);
  let best=opts[0],bestScore=Infinity;
  for(const p of opts){
    const blocked=isLineBlocked(p,threat,covers||[]),travel=Math.hypot(p.x-actor.x,p.y-actor.y);
    const preferred=actor&&Number.isFinite(actor.coverSlotIndex)?((actor.coverSlotIndex%2===0&&p.side<0)||(actor.coverSlotIndex%2===1&&p.side>0)):false;
    const score=(blocked?10000:0)+travel+(preferred?-25:0);
    if(score<bestScore){bestScore=score;best=p}
  }
  return best;
}
export function isLineBlocked(a,b,covers){
  for(const c of covers){
    for(const p of pieces(c)){
      const left=p.x-p.w/2,right=p.x+p.w/2,top=p.y-p.h/2,bottom=p.y+p.h/2,steps=36;
      for(let i=1;i<steps;i++){
        const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        if(x>left&&x<right&&y>top&&y<bottom)return true;
      }
    }
  }
  return false;
}
export function getHitChance(shooter,target,covers){
  if(!target)return 0;
  const d=Math.hypot(target.x-shooter.x,target.y-shooter.y);
  let chance=96-Math.max(0,d-120)*.055;
  const blocked=isLineBlocked(shooter,target,covers||[]);
  if(blocked&&!target.exposed)chance-=34;
  const cover=target.cover;
  if(cover&&!target.exposed){
    if(cover.type==='low')chance-=14;
    else if(cover.type==='wide')chance-=25;
    else if(cover.type==='car')chance-=20;
    else chance-=22;
    if(cover.segments&&cover.segments.length>1)chance-=4;
  }
  if(target.exposed)chance+=5;
  if(shooter.cover&&!shooter.exposed)chance+=3;
  return Math.round(Math.max(8,Math.min(95,chance)));
}
export function drawCover(ctx,c,iso){
  const q=iso(c.x,c.y),x=q[0],y=q[1];
  if(c.asset){drawCityAsset(ctx,c.asset,x,y,{scale:c.scale||.24});return}
  ctx.save();ctx.translate(x,y);ctx.fillStyle=c.type==='low'?'#6f6652':'#5a6264';
  ctx.fillRect(-c.w*.14,-c.h*.28,c.w*.28,c.h*.28);ctx.restore();
}
