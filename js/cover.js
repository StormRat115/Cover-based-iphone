/* Road-scale tactical cover: spaced positions, multi-angle barricades, and combined cover groups. */
export function createCover(){const layout=[
{id:'leftCar',x:-430,y:40,w:125,h:42,type:'car'},
{id:'rightCar',x:430,y:15,w:125,h:42,type:'car'},
{id:'leftFront',x:-350,y:300,w:150,h:34,type:'wide'},
{id:'rightFront',x:350,y:275,w:150,h:34,type:'wide'},
{id:'leftMid',x:-330,y:-170,w:125,h:30,type:'low'},
{id:'rightMid',x:330,y:-205,w:125,h:30,type:'low'},
{id:'farCenter',x:0,y:-540,w:165,h:34,type:'wide'},
{id:'farLeft',x:-520,y:-470,w:115,h:30,type:'low'},
{id:'farRight',x:520,y:-500,w:115,h:30,type:'low'},
{id:'angleLeft',x:-575,y:155,w:115,h:28,type:'low',segments:[{dx:0,dy:0,w:115,h:28},{dx:52,dy:-42,w:28,h:78}]},
{id:'angleRight',x:575,y:145,w:115,h:28,type:'low',segments:[{dx:0,dy:0,w:115,h:28},{dx:-52,dy:-42,w:28,h:78}]},
{id:'angleLeftFar',x:-610,y:-300,w:120,h:28,type:'wide',segments:[{dx:0,dy:0,w:120,h:28},{dx:48,dy:42,w:28,h:82}]},
{id:'angleRightFar',x:610,y:-320,w:120,h:28,type:'wide',segments:[{dx:0,dy:0,w:120,h:28},{dx:-48,dy:42,w:28,h:82}]},
{id:'centerSouth',x:0,y:360,w:135,h:30,type:'wide',segments:[{dx:0,dy:0,w:135,h:30},{dx:0,dy:-38,w:30,h:78}]},
{id:'leftSouth',x:-600,y:430,w:125,h:30,type:'low'},
{id:'rightSouth',x:600,y:430,w:125,h:30,type:'low'},
{id:'centerNorth',x:0,y:-735,w:135,h:30,type:'wide',segments:[{dx:0,dy:0,w:135,h:30},{dx:0,dy:40,w:30,h:80}]}
];if(typeof window!=='undefined')window.__battleCovers=layout;return layout}
function pieces(c){return c.segments&&c.segments.length?c.segments.map(function(s){return{x:c.x+(s.dx||0),y:c.y+(s.dy||0),w:s.w,h:s.h,type:c.type}}):[{x:c.x,y:c.y,w:c.w,h:c.h,type:c.type}]}
function inside(p,x,y,padX,padY){return Math.abs(x-p.x)<p.w/2+padX&&Math.abs(y-p.y)<p.h/2+padY}
export function findCoverForPoint(x,y,covers){for(const c of covers){const ps=pieces(c);for(const p of ps)if(inside(p,x,y,24,18))return c}return null}
export function getCoverSlot(c,actor,threat){let side;if(threat){side=threat.y<c.y?'bottom':'top'}else{side=actor.y<c.y?'top':'bottom'}const inset=c.type==='wide'?24:18;const slot=actor&&Number.isFinite(actor.coverSlotIndex)?Math.max(0,Math.min(2,actor.coverSlotIndex)):0;const offsets=[-1,0,1];const usable=Math.max(18,c.w/2-inset);const spread=c.type==='wide'?Math.min(58,usable*.78):Math.min(44,usable*.78);let x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,c.x+offsets[slot]*spread));let y=side==='top'?c.y-c.h/2-28:c.y+c.h/2+28;if(c.segments&&c.segments.length>1&&slot===2){const s=c.segments[1];x=c.x+s.dx;y=c.y+s.dy+(side==='top'?-s.h/2-24:s.h/2+24)}return{x,y,side}}
export function isLineBlocked(a,b,covers){for(const c of covers){for(const p of pieces(c)){const left=p.x-p.w/2,right=p.x+p.w/2,top=p.y-p.h/2,bottom=p.y+p.h/2;const steps=36;for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>left&&x<right&&y>top&&y<bottom)return true}}}return false}
export function getHitChance(shooter,target,covers){if(!target)return 0;const d=Math.hypot(target.x-shooter.x,target.y-shooter.y);let chance=96-Math.max(0,d-120)*.055;const blocked=isLineBlocked(shooter,target,covers||[]);if(blocked)chance-=34;const cover=target.cover;if(cover){if(cover.type==='low')chance-=14;else if(cover.type==='wide')chance-=25;else if(cover.type==='car')chance-=20;else chance-=22;if(cover.segments&&cover.segments.length>1)chance-=4}if(shooter.cover)chance+=3;return Math.round(Math.max(8,Math.min(95,chance)))}
function box(ctx,x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x-w/2,y-h,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.strokeRect(x-w/2,y-h,w,h)}}
export function drawCover(ctx,c,iso){const [x,y]=iso(c.x,c.y);const S=.28;ctx.save();ctx.translate(x,y);ctx.shadowColor='#0007';ctx.shadowBlur=5;ctx.shadowOffsetY=4;
if(c.type==='car'){const w=c.w*S,h=c.h*S;ctx.fillStyle='#465055';ctx.fillRect(-w/2,-h*.55,w,h*.55);ctx.fillStyle='#252c30';ctx.fillRect(-w*.34,-h,w*.68,h*.45);ctx.fillStyle='#778186';ctx.fillRect(-w*.25,-h*.9,w*.2,h*.2);ctx.fillRect(w*.05,-h*.9,w*.2,h*.2);ctx.fillStyle='#151a1c';ctx.beginPath();ctx.arc(-w*.32,0,w*.11,0,Math.PI*2);ctx.arc(w*.32,0,w*.11,0,Math.PI*2);ctx.fill();ctx.restore();return}
if(c.segments&&c.segments.length>1){c.segments.forEach(function(sg){const w=sg.w*S,h=sg.h*S;ctx.save();ctx.translate((sg.dx||0)*S,(sg.dy||0)*S);box(ctx,0,0,w,h,'#5a6264','#303637');ctx.shadowColor='transparent';ctx.fillStyle='#858b8a';ctx.fillRect(-w/2,-h,w,Math.max(2,h*.12));ctx.restore()});ctx.restore();return}
const w=c.w*S,h=(c.type==='low'?24:c.type==='wide'?34:42)*S;box(ctx,0,0,w,h,'#5a6264','#303637');ctx.shadowColor='transparent';ctx.fillStyle='#858b8a';ctx.fillRect(-w/2,-h,w,Math.max(2,h*.12));ctx.fillStyle='#41494a';if(c.type==='wide')ctx.fillRect(-w*.36,-h*.62,w*.72,Math.max(2,h*.1));ctx.restore()}
