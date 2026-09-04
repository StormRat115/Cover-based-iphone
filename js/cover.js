/* Hand-designed urban battlefield. Sparse cover creates lanes, sightlines and real movement decisions. */
export function createCover(){return[
{id:'westBlock',x:-520,y:-220,w:230,h:120,type:'building'},
{id:'eastBlock',x:500,y:-250,w:240,h:135,type:'building'},
{id:'northBlock',x:120,y:-555,w:300,h:115,type:'building'},
{id:'southBlock',x:-150,y:520,w:300,h:105,type:'building'},
{id:'westCar',x:-430,y:110,w:105,h:42,type:'car'},
{id:'eastCar',x:390,y:150,w:105,h:42,type:'car'},
{id:'westBarrier',x:-230,y:-80,w:150,h:32,type:'low'},
{id:'eastBarrier',x:245,y:-65,w:150,h:32,type:'low'},
{id:'centerWall',x:0,y:150,w:190,h:38,type:'wide'},
{id:'northWall',x:0,y:-350,w:175,h:38,type:'low'},
{id:'southWall',x:330,y:390,w:180,h:38,type:'low'},
{id:'westWall',x:-610,y:350,w:170,h:38,type:'low'}
]}
export function findCoverForPoint(x,y,covers){return covers.find(c=>Math.abs(x-c.x)<c.w/2+24&&Math.abs(y-c.y)<c.h/2+18)||null}
export function getCoverSlot(c,actor,threat){let side;if(threat){side=threat.y<c.y?'bottom':'top'}else{side=actor.y<c.y?'top':'bottom'}const inset=c.type==='wide'||c.type==='building'?32:22;const x=Math.max(c.x-c.w/2+inset,Math.min(c.x+c.w/2-inset,actor.x));const y=side==='top'?c.y-c.h/2-24:c.y+c.h/2+24;return{x,y,side}}
export function isLineBlocked(a,b,covers){for(const c of covers){const left=c.x-c.w/2,right=c.x+c.w/2,top=c.y-c.h/2,bottom=c.y+c.h/2;const steps=28;for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>left&&x<right&&y>top&&y<bottom)return true}}return false}
function rect(ctx,x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x-w/2,y-h,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(x-w/2,y-h,w,h)}}
export function drawCover(ctx,c,iso){const [x,y]=iso(c.x,c.y);ctx.save();ctx.translate(x,y);ctx.shadowColor='#0008';ctx.shadowBlur=9;ctx.shadowOffsetY=7;
if(c.type==='building'){ctx.shadowBlur=14;ctx.shadowOffsetY=9;rect(ctx,0,0,c.w*.72,c.h*.78,'#343b3e','#202628');ctx.shadowColor='transparent';ctx.fillStyle='#51585a';ctx.fillRect(-c.w*.36,-c.h*.78,c.w*.72,8);ctx.fillStyle='#242b2d';for(let wx=-c.w*.27;wx<c.w*.28;wx+=46){ctx.fillRect(wx,-c.h*.78+24,24,18);ctx.fillRect(wx,-c.h*.78+55,24,18)}ctx.fillStyle='#171d1f';ctx.fillRect(-c.w*.1,-c.h*.78+24,c.w*.2,c.h*.62);ctx.restore();return}
if(c.type==='car'){ctx.shadowBlur=8;ctx.shadowOffsetY=6;ctx.fillStyle='#4c5558';ctx.fillRect(-c.w*.5,-20,c.w,22);ctx.fillStyle='#252c2f';ctx.fillRect(-c.w*.34,-34,c.w*.68,15);ctx.fillStyle='#758083';ctx.fillRect(-c.w*.25,-31,c.w*.2,9);ctx.fillRect(c.w*.05,-31,c.w*.2,9);ctx.fillStyle='#14191a';ctx.beginPath();ctx.arc(-c.w*.31,3,9,0,Math.PI*2);ctx.arc(c.w*.31,3,9,0,Math.PI*2);ctx.fill();ctx.restore();return}
const heights={low:24,high:52,wide:34};const height=heights[c.type]||34;ctx.fillStyle=c.type==='low'?'#62696a':'#555d5e';ctx.fillRect(-c.w*.36,-height,c.w*.72,height);ctx.shadowColor='transparent';ctx.fillStyle='#858b8a';ctx.fillRect(-c.w*.36,-height,c.w*.72,5);ctx.strokeStyle='#303637';ctx.lineWidth=2;ctx.strokeRect(-c.w*.36,-height,c.w*.72,height);if(c.type==='wide'){ctx.fillStyle='#454c4c';ctx.fillRect(-c.w*.28,-height+9,c.w*.56,6)}ctx.restore()}
