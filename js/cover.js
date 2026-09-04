/* City battlefield cover: sparse, readable lanes with no hard cover in the squad's opening pocket. */
export function createCover(){return[
{id:'northWest',x:-520,y:-390,w:150,h:34,type:'low'},
{id:'northEast',x:500,y:-420,w:150,h:34,type:'low'},
{id:'farNorth',x:90,y:-570,w:190,h:36,type:'wide'},
{id:'westVehicle',x:-610,y:-20,w:120,h:46,type:'car'},
{id:'eastVehicle',x:625,y:-10,w:120,h:46,type:'car'},
{id:'westMid',x:-470,y:250,w:180,h:38,type:'wide'},
{id:'eastMid',x:470,y:240,w:180,h:38,type:'wide'},
{id:'northMid',x:-210,y:-230,w:135,h:32,type:'low'},
{id:'northMidEast',x:250,y:-255,w:135,h:32,type:'low'},
{id:'southWest',x:-520,y:470,w:180,h:38,type:'wide'},
{id:'southEast',x:520,y:455,w:180,h:38,type:'wide'},
{id:'farSouth',x:0,y:570,w:190,h:36,type:'wide'}
]}
export function findCoverForPoint(x,y,covers){return covers.find(c=>Math.abs(x-c.x)<c.w/2+24&&Math.abs(y-c.y)<c.h/2+18)||null}
export function getCoverSlot(c,actor,threat){let side;if(threat){side=threat.y<c.y?'bottom':'top'}else{side=actor.y<c.y?'top':'bottom'}const inset=c.type==='wide'?34:26;const x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,actor.x));const y=side==='top'?c.y-c.h/2-30:c.y+c.h/2+30;return{x,y,side}}
export function isLineBlocked(a,b,covers){for(const c of covers){const left=c.x-c.w/2,right=c.x+c.w/2,top=c.y-c.h/2,bottom=c.y+c.h/2;const steps=28;for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>left&&x<right&&y>top&&y<bottom)return true}}return false}
function box(ctx,x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x-w/2,y-h,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.strokeRect(x-w/2,y-h,w,h)}}
export function drawCover(ctx,c,iso){const [x,y]=iso(c.x,c.y);const S=.44;ctx.save();ctx.translate(x,y);ctx.shadowColor='#0007';ctx.shadowBlur=6;ctx.shadowOffsetY=5;
if(c.type==='car'){const w=c.w*S,h=c.h*S;ctx.fillStyle='#465055';ctx.fillRect(-w/2,-h*.55,w,h*.55);ctx.fillStyle='#252c30';ctx.fillRect(-w*.34,-h,w*.68,h*.45);ctx.fillStyle='#778186';ctx.fillRect(-w*.25,-h*.9,w*.2,h*.2);ctx.fillRect(w*.05,-h*.9,w*.2,h*.2);ctx.fillStyle='#151a1c';ctx.beginPath();ctx.arc(-w*.32,0,w*.11,0,Math.PI*2);ctx.arc(w*.32,0,w*.11,0,Math.PI*2);ctx.fill();ctx.restore();return}
const w=c.w*S,h=(c.type==='low'?24:c.type==='wide'?34:42)*S;box(ctx,0,0,w,h,'#5a6264','#303637');ctx.shadowColor='transparent';ctx.fillStyle='#858b8a';ctx.fillRect(-w/2,-h,w,Math.max(2,h*.12));ctx.fillStyle='#41494a';if(c.type==='wide')ctx.fillRect(-w*.36,-h*.62,w*.72,Math.max(2,h*.1));ctx.restore()}
