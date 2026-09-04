/* Deliberately sparse, alternating cover lanes. The player starts south and the fight flows north toward the bridge/objective. */
export function createCover(){return[
{id:'south',x:0,y:390,w:230,h:48,type:'wide'},
{id:'southL',x:-360,y:300,w:180,h:42,type:'high'},
{id:'southR',x:360,y:300,w:180,h:42,type:'high'},
{id:'midL',x:-230,y:80,w:170,h:40,type:'low'},
{id:'midR',x:250,y:55,w:180,h:42,type:'high'},
{id:'center',x:0,y:-120,w:240,h:46,type:'wide'},
{id:'leftBlock',x:-500,y:-120,w:190,h:44,type:'high'},
{id:'rightBlock',x:500,y:-100,w:190,h:44,type:'high'},
{id:'northL',x:-330,y:-330,w:180,h:40,type:'low'},
{id:'northC',x:0,y:-370,w:210,h:42,type:'high'},
{id:'northR',x:340,y:-320,w:180,h:40,type:'low'}
]}
export function findCoverForPoint(x,y,covers){return covers.find(c=>Math.abs(x-c.x)<c.w/2+24&&Math.abs(y-c.y)<c.h/2+18)||null}
export function getCoverSlot(c,actor,threat){let side;if(threat){side=threat.y<c.y?'bottom':'top'}else{side=actor.y<c.y?'top':'bottom'}const inset=c.type==='wide'?28:22;const x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,actor.x));const y=side==='top'?c.y-c.h/2-24:c.y+c.h/2+24;return{x,y,side}}
export function isLineBlocked(a,b,covers){for(const c of covers){const left=c.x-c.w/2,right=c.x+c.w/2,top=c.y-c.h/2,bottom=c.y+c.h/2;const steps=24;for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>left&&x<right&&y>top&&y<bottom)return true}}return false}
export function drawCover(ctx,c,iso){const [x,y]=iso(c.x,c.y);const heights={low:24,high:52,wide:34};const height=heights[c.type]||34;ctx.save();ctx.translate(x,y);ctx.shadowColor='#0008';ctx.shadowBlur=9;ctx.shadowOffsetY=5;ctx.fillStyle=c.type==='low'?'#75684f':c.type==='high'?'#6a5b45':'#806f53';ctx.fillRect(-c.w*.36,-height,c.w*.72,height);ctx.shadowColor='transparent';ctx.fillStyle='#9b8a69';ctx.fillRect(-c.w*.36,-height,c.w*.72,7);ctx.strokeStyle='#40382e';ctx.strokeRect(-c.w*.36,-height,c.w*.72,height);if(c.type==='low'){ctx.strokeStyle='#c1ae8655';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-c.w*.3,-height+6);ctx.lineTo(c.w*.3,-height+6);ctx.stroke()}ctx.restore()}
