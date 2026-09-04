export function createCover(){return[
{id:'c1',x:-500,y:-300,w:190,h:42,type:'high'},
{id:'c2',x:-250,y:-330,w:150,h:40,type:'low'},
{id:'c3',x:30,y:-300,w:220,h:40,type:'wide'},
{id:'c4',x:340,y:-250,w:170,h:42,type:'high'},
{id:'c5',x:520,y:-20,w:210,h:40,type:'wide'},
{id:'c6',x:260,y:90,w:150,h:40,type:'low'},
{id:'c7',x:40,y:230,w:190,h:42,type:'high'},
{id:'c8',x:-250,y:300,w:220,h:40,type:'wide'},
{id:'c9',x:-520,y:240,w:160,h:40,type:'low'},
{id:'c10',x:-610,y:-40,w:190,h:42,type:'high'},
{id:'c11',x:-360,y:40,w:150,h:40,type:'low'},
{id:'c12',x:20,y:-20,w:150,h:40,type:'low'},
{id:'c13',x:430,y:300,w:190,h:42,type:'high'},
{id:'c14',x:650,y:180,w:160,h:40,type:'low'}
]}
export function findCoverForPoint(x,y,covers){return covers.find(c=>Math.abs(x-c.x)<c.w/2+24&&Math.abs(y-c.y)<c.h/2+18)||null}
export function getCoverSlot(c,actor,threat){let side;if(threat){side=threat.y<c.y?'bottom':'top'}else{side=actor.y<c.y?'top':'bottom'}const inset=c.type==='wide'?28:22;const x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,actor.x));const y=side==='top'?c.y-c.h/2-24:c.y+c.h/2+24;return{x,y,side}}
export function isLineBlocked(a,b,covers){for(const c of covers){const left=c.x-c.w/2,right=c.x+c.w/2,top=c.y-c.h/2,bottom=c.y+c.h/2;const steps=24;for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>left&&x<right&&y>top&&y<bottom)return true}}return false}
export function drawCover(ctx,c,iso){const [x,y]=iso(c.x,c.y);const heights={low:24,high:52,wide:34};const height=heights[c.type]||34;ctx.save();ctx.translate(x,y);ctx.fillStyle=c.type==='low'?'#59636a':c.type==='high'?'#4c5960':'#657178';ctx.fillRect(-c.w*.36,-height,c.w*.72,height);ctx.fillStyle='#89949a';ctx.fillRect(-c.w*.36,-height,c.w*.72,7);ctx.strokeStyle='#1b2226';ctx.strokeRect(-c.w*.36,-height,c.w*.72,height);if(c.type==='low'){ctx.strokeStyle='#aeb8bc55';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-c.w*.3,-height+6);ctx.lineTo(c.w*.3,-height+6);ctx.stroke()}ctx.restore()}
