/* Road-scale urban battlefield: sparse cover, readable sightlines, realistic prop proportions. */
export function createCover(){return[
{id:'leftCar',x:-430,y:40,w:125,h:42,type:'car'},
{id:'rightCar',x:430,y:15,w:125,h:42,type:'car'},
{id:'leftFront',x:-350,y:300,w:150,h:34,type:'wide'},
{id:'rightFront',x:350,y:275,w:150,h:34,type:'wide'},
{id:'leftMid',x:-330,y:-170,w:125,h:30,type:'low'},
{id:'rightMid',x:330,y:-205,w:125,h:30,type:'low'},
{id:'farCenter',x:0,y:-540,w:165,h:34,type:'wide'},
{id:'farLeft',x:-520,y:-470,w:115,h:30,type:'low'},
{id:'farRight',x:520,y:-500,w:115,h:30,type:'low'}
]}
export function findCoverForPoint(x,y,covers){return covers.find(c=>Math.abs(x-c.x)<c.w/2+24&&Math.abs(y-c.y)<c.h/2+18)||null}
export function getCoverSlot(c,actor,threat){let side;if(threat){side=threat.y<c.y?'bottom':'top'}else{side=actor.y<c.y?'top':'bottom'}const inset=c.type==='wide'?30:22;const x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,actor.x));const y=side==='top'?c.y-c.h/2-28:c.y+c.h/2+28;return{x,y,side}}
export function isLineBlocked(a,b,covers){for(const c of covers){const left=c.x-c.w/2,right=c.x+c.w/2,top=c.y-c.h/2,bottom=c.y+c.h/2;const steps=32;for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>left&&x<right&&y>top&&y<bottom)return true}}return false}
export function getHitChance(shooter,target,covers){if(!target)return 0;const d=Math.hypot(target.x-shooter.x,target.y-shooter.y);let chance=96-Math.max(0,d-120)*.055;const blocked=isLineBlocked(shooter,target,covers||[]);if(blocked)chance-=34;const cover=target.cover;if(cover){if(cover.type==='low')chance-=14;else if(cover.type==='wide')chance-=25;else if(cover.type==='car')chance-=20;else chance-=22}if(shooter.cover)chance+=3;return Math.round(Math.max(8,Math.min(95,chance)))}
function box(ctx,x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x-w/2,y-h,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.strokeRect(x-w/2,y-h,w,h)}}
export function drawCover(ctx,c,iso){const [x,y]=iso(c.x,c.y);const S=.28;ctx.save();ctx.translate(x,y);ctx.shadowColor='#0007';ctx.shadowBlur=5;ctx.shadowOffsetY=4;
if(c.type==='car'){const w=c.w*S,h=c.h*S;ctx.fillStyle='#465055';ctx.fillRect(-w/2,-h*.55,w,h*.55);ctx.fillStyle='#252c30';ctx.fillRect(-w*.34,-h,w*.68,h*.45);ctx.fillStyle='#778186';ctx.fillRect(-w*.25,-h*.9,w*.2,h*.2);ctx.fillRect(w*.05,-h*.9,w*.2,h*.2);ctx.fillStyle='#151a1c';ctx.beginPath();ctx.arc(-w*.32,0,w*.11,0,Math.PI*2);ctx.arc(w*.32,0,w*.11,0,Math.PI*2);ctx.fill();ctx.restore();return}
const w=c.w*S,h=(c.type==='low'?24:c.type==='wide'?34:42)*S;box(ctx,0,0,w,h,'#5a6264','#303637');ctx.shadowColor='transparent';ctx.fillStyle='#858b8a';ctx.fillRect(-w/2,-h,w,Math.max(2,h*.12));ctx.fillStyle='#41494a';if(c.type==='wide')ctx.fillRect(-w*.36,-h*.62,w*.72,Math.max(2,h*.1));ctx.restore()}
