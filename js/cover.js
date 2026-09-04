/* Sparse urban battlefield cover. Open lanes are intentional so every piece creates a meaningful tactical choice. */
export function createCover(){return[
{id:'southWall',x:0,y:360,w:250,h:42,type:'wide'},
{id:'southLeft',x:-430,y:245,w:150,h:38,type:'low'},
{id:'southRight',x:430,y:215,w:160,h:38,type:'low'},
{id:'midLeft',x:-330,y:-10,w:190,h:42,type:'high'},
{id:'midRight',x:340,y:-35,w:180,h:42,type:'high'},
{id:'fountainWall',x:0,y:-180,w:220,h:40,type:'low'},
{id:'northLeft',x:-390,y:-355,w:170,h:40,type:'high'},
{id:'northRight',x:390,y:-330,w:170,h:40,type:'high'}
]}
export function findCoverForPoint(x,y,covers){return covers.find(c=>Math.abs(x-c.x)<c.w/2+24&&Math.abs(y-c.y)<c.h/2+18)||null}
export function getCoverSlot(c,actor,threat){let side;if(threat){side=threat.y<c.y?'bottom':'top'}else{side=actor.y<c.y?'top':'bottom'}const inset=c.type==='wide'?28:22;const x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,actor.x));const y=side==='top'?c.y-c.h/2-24:c.y+c.h/2+24;return{x,y,side}}
export function isLineBlocked(a,b,covers){for(const c of covers){const left=c.x-c.w/2,right=c.x+c.w/2,top=c.y-c.h/2,bottom=c.y+c.h/2;const steps=24;for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>left&&x<right&&y>top&&y<bottom)return true}}return false}
export function drawCover(ctx,c,iso){const [x,y]=iso(c.x,c.y);const heights={low:24,high:52,wide:34};const height=heights[c.type]||34;ctx.save();ctx.translate(x,y);ctx.shadowColor='#0008';ctx.shadowBlur=8;ctx.shadowOffsetY=5;ctx.fillStyle=c.type==='low'?'#686b68':c.type==='high'?'#555b5b':'#626765';ctx.fillRect(-c.w*.36,-height,c.w*.72,height);ctx.shadowColor='transparent';ctx.fillStyle='#858987';ctx.fillRect(-c.w*.36,-height,c.w*.72,6);ctx.strokeStyle='#343a39';ctx.lineWidth=2;ctx.strokeRect(-c.w*.36,-height,c.w*.72,height);if(c.type==='wide'){ctx.fillStyle='#474d4c';ctx.fillRect(-c.w*.28,-height+9,c.w*.56,6)}ctx.restore()}
