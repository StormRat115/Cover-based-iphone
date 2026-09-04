export const soldierSource=new Image();
soldierSource.src='./assets/rifle_soldier_sheet.png?v=20260904-29';

const SOURCE_W=1448,SOURCE_H=1086,CELL=160,COLS=8;
let runtimeAtlas=null;

const FRAME_BOXES={
  idle:[[239,16,75,140],[368,16,73,140],[494,16,71,140],[618,16,71,140],[746,16,70,140]],
  run:[[220,174,103,138],[354,174,111,137],[485,173,110,129],[612,174,106,137],[729,175,109,137],[865,178,111,134],[999,178,115,133],[1140,179,115,131]],
  lowCover:[[223,326,107,106],[359,324,106,109],[485,323,112,109],[620,328,106,103],[749,329,109,100],[880,330,108,99]],
  tallCover:[[229,454,78,124],[363,454,79,124],[497,452,79,128],[630,455,74,123],[744,452,92,129],[878,456,83,125]],
  shoot:[[221,590,92,140],[358,592,94,140],[492,592,95,138],[624,592,99,138],[763,593,127,137],[917,593,146,137]],
  crouchShoot:[[221,746,101,106],[358,747,104,104],[506,748,104,104],[665,748,140,103],[835,747,141,104]],
  standShoot:[[221,875,105,151],[364,875,105,152],[505,875,106,152],[655,875,144,151],[822,875,152,152]]
};
const ROWS={idle:0,run:1,lowCover:2,tallCover:3,shoot:4,crouchShoot:5,standShoot:6};
const FPS={idle:3,run:9,lowCover:3,tallCover:3,shoot:20,crouchShoot:16,standShoot:16};

function nowMs(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now()}
function loadImage(img){return new Promise(function(resolve,reject){if(img.complete&&img.naturalWidth>0){resolve(img);return}img.onload=function(){resolve(img)};img.onerror=function(){reject(new Error('Failed to load rifle soldier animation sheet'))}})}

function buildRuntimeAtlas(){
  const c=document.createElement('canvas');c.width=COLS*CELL;c.height=7*CELL;const g=c.getContext('2d',{willReadFrequently:true});
  const sx=soldierSource.naturalWidth/SOURCE_W,sy=soldierSource.naturalHeight/SOURCE_H;
  Object.keys(ROWS).forEach(function(state){const row=ROWS[state],frames=FRAME_BOXES[state];frames.forEach(function(b,col){const x=b[0]*sx,y=b[1]*sy,w=b[2]*sx,h=b[3]*sy;const maxW=142,maxH=150,fit=Math.min(1,maxW/w,maxH/h),dw=w*fit,dh=h*fit,dx=col*CELL+(CELL-dw)/2,dy=row*CELL+CELL-dh-4;g.drawImage(soldierSource,x,y,w,h,dx,dy,dw,dh)})});
  const im=g.getImageData(0,0,c.width,c.height),d=im.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),sat=mx-mn,bright=(r+gg+b)/3;if(bright>204&&sat<48)d[i+3]=0;else if(bright>188&&sat<28)d[i+3]=Math.min(d[i+3],Math.max(0,(220-bright)*8))}
  g.clearRect(0,0,c.width,c.height);g.putImageData(im,0,0);runtimeAtlas=c;
}

export function preloadSoldierAssets(onProgress){onProgress=onProgress||function(){};onProgress(.15,'LOADING RIFLE SOLDIER SHEET');return loadImage(soldierSource).then(function(){onProgress(.72,'BUILDING SOLDIER ANIMATIONS');buildRuntimeAtlas();onProgress(1,'SOLDIER ANIMATIONS READY');return runtimeAtlas})}

function moving(actor){if(!actor)return false;if(actor.state==='walk'||actor.state==='run')return true;if(typeof actor.targetX==='number'&&typeof actor.targetY==='number')return Math.hypot(actor.targetX-actor.x,actor.targetY-actor.y)>8;return false}
function shooting(actor){return !!(actor&&((actor.muzzle&&actor.muzzle>0)||(actor.shootTimer&&actor.shootTimer>0)||actor.state==='shoot'))}
function lowCover(actor){return !!(actor&&actor.cover&&actor.cover.type==='low')}

export function getSoldierState(actor){
  if(!actor)return'idle';if(actor.dead)return'dead';if(actor.downed)return'downed';
  if(shooting(actor)){if(lowCover(actor)||actor.suppressed)return'crouchShoot';if(actor.cover)return'shoot';return'standShoot'}
  if(actor.cover)return lowCover(actor)?'lowCover':'tallCover';
  if(moving(actor))return'run';
  return'idle';
}

function stableFacing(actor,state){
  if(!actor)return 1;const now=nowMs(),fx=Number(actor.facingX)||0,fy=Number(actor.facingY)||0,screenDir=fx-fy,mag=Math.abs(screenDir),desired=screenDir<0?-1:1,isShot=state==='shoot'||state==='crouchShoot'||state==='standShoot';
  if(actor.__visualFacing!==-1&&actor.__visualFacing!==1)actor.__visualFacing=mag>.08?desired:1;
  if(mag<.18)return actor.__visualFacing;
  if(isShot){if(now>=(actor.__faceLockUntil||0)&&desired!==actor.__visualFacing&&mag>.24)actor.__visualFacing=desired;actor.__faceLockUntil=now+260;actor.__faceCandidate=desired;actor.__faceCandidateAt=now;return actor.__visualFacing}
  if(now<(actor.__faceLockUntil||0))return actor.__visualFacing;
  if(desired===actor.__visualFacing){actor.__faceCandidate=desired;actor.__faceCandidateAt=now;return actor.__visualFacing}
  if(mag<.32)return actor.__visualFacing;
  if(actor.__faceCandidate!==desired){actor.__faceCandidate=desired;actor.__faceCandidateAt=now;return actor.__visualFacing}
  if(mag>.86||now-(actor.__faceCandidateAt||now)>140){actor.__visualFacing=desired;actor.__faceLockUntil=now+180}
  return actor.__visualFacing;
}

function frameFor(actor,state){
  let s=state;if(s==='dead'||s==='downed')s='lowCover';const frames=FRAME_BOXES[s]||FRAME_BOXES.idle,row=ROWS[s]||0,now=nowMs();
  if(actor.__lastSoldierState!==state){actor.__lastSoldierState=state;actor.__soldierStateStart=now}
  const elapsed=Math.max(0,(now-(actor.__soldierStateStart||now))/1000),fps=FPS[s]||4,col=Math.min(frames.length-1,Math.floor(elapsed*fps)%frames.length);
  return{x:col*CELL,y:row*CELL,w:CELL,h:CELL};
}
function teamFilter(team){if(team==='ally')return'sepia(.55) saturate(1.75) hue-rotate(155deg) brightness(1.06)';if(team==='enemy')return'sepia(.62) saturate(1.95) hue-rotate(315deg) brightness(1.02)';return'none'}

export function drawSoldier(ctx,actor,options){
  options=options||{};const state=options.state||getSoldierState(actor),r=frameFor(actor,state),baseScale=options.scale==null ? .30 : options.scale,scale=baseScale*(actor&&actor.scale?actor.scale:1),dw=r.w*scale,dh=r.h*scale,flip=stableFacing(actor,state),bob=state==='run'?Math.sin(nowMs()*.018)*.65:0;
  ctx.save();ctx.translate(options.x||0,(options.y||0)+bob);ctx.globalAlpha=options.alpha==null?1:options.alpha;
  ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(0,2,Math.max(7,dw*.22),Math.max(2,dh*.05),0,0,Math.PI*2);ctx.fill();
  if(state==='dead'){ctx.translate(0,6);ctx.rotate(flip*1.34)}else if(state==='downed'){ctx.translate(0,3);ctx.rotate(flip*.20)}
  ctx.scale(flip,1);ctx.filter=teamFilter(options.team||'player');ctx.imageSmoothingEnabled=true;
  const source=runtimeAtlas||soldierSource;
  if(source&&((source.width&&source.height)||(source.complete&&source.naturalWidth))){if(runtimeAtlas)ctx.drawImage(source,r.x,r.y,r.w,r.h,-dw*.5,-dh,dw,dh);else ctx.drawImage(source,-dw*.5,-dh,dw,dh)}else{ctx.filter='none';ctx.fillStyle=options.team==='enemy'?'#8b514b':options.team==='ally'?'#477da8':'#56646b';ctx.fillRect(-6,-24,12,22);ctx.fillStyle='#9b9d9a';ctx.beginPath();ctx.arc(0,-28,5,0,Math.PI*2);ctx.fill()}
  ctx.restore();
}

export function getSoldierAtlasInfo(){return{sourceWidth:SOURCE_W,sourceHeight:SOURCE_H,cell:CELL,rows:ROWS,frameCounts:{idle:5,run:8,lowCover:6,tallCover:6,shoot:6,crouchShoot:5,standShoot:5}}}
