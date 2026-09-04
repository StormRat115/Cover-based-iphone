export const soldierAtlas=new Image();
soldierAtlas.src='./assets/soldier_atlas.png?v=20260904-28';

const GRID_X=140;
const GRID_Y=490;
const CELL_W=80;
const CELL_H=96;
const ROW_STEP=96;
const BASE_SCALE=.40;

const WEAPON_ROWS={rifle:0,smg:1,shotgun:2,pistol:3,dmr:4,sniper:4,lmg:5};
const STATE_FRAMES={
idle:[0,1],
walk:[2,3,4,3],
run:[3,4,5,4],
reload:[5,6,7,6],
aim:[10,11],
shoot:[8,12],
cover:[13,14],
crouch:[10,13,14,13]
};

function loadImage(img){return new Promise(function(resolve,reject){if(img.complete&&img.naturalWidth>0){resolve(img);return}img.onload=function(){resolve(img)};img.onerror=function(){reject(new Error('Failed to load soldier animation atlas'))}})}
export function preloadSoldierAssets(onProgress){onProgress=onProgress||function(){};onProgress(.2,'LOADING SOLDIER ASSETS');return loadImage(soldierAtlas).then(function(){onProgress(1,'SOLDIER ASSETS READY');return soldierAtlas})}

function rowForWeapon(actor){var id=actor&&actor.weapon&&actor.weapon.id?actor.weapon.id:'rifle';return WEAPON_ROWS[id]==null?0:WEAPON_ROWS[id]}
function animTime(actor){if(!actor)return 0;if(typeof actor.anim==='number')return actor.anim;if(typeof actor.t==='number')return actor.t;return 0}
function moving(actor){if(!actor)return false;if(actor.state==='walk'||actor.state==='run')return true;if(typeof actor.targetX==='number'&&typeof actor.targetY==='number'){return Math.hypot(actor.targetX-actor.x,actor.targetY-actor.y)>8}return false}
export function getSoldierState(actor){if(!actor)return'idle';if(actor.dead)return'dead';if(actor.downed)return'downed';if(actor.reloading||actor.state==='reload')return'reload';if((actor.muzzle&&actor.muzzle>0)||(actor.shootTimer&&actor.shootTimer>0)||actor.state==='shoot')return'shoot';if(actor.cover){if(actor.suppressed)return'crouch';return'cover'}if(moving(actor))return actor.speed&&actor.speed>155?'run':'walk';return'idle'}

function frameRect(actor,state){if(state==='dead')return{x:GRID_X+15*CELL_W,y:GRID_Y+5*ROW_STEP,w:CELL_W,h:CELL_H};if(state==='downed')return{x:GRID_X+14*CELL_W,y:GRID_Y+5*ROW_STEP,w:CELL_W,h:CELL_H};var row=rowForWeapon(actor),seq=STATE_FRAMES[state]||STATE_FRAMES.idle,t=animTime(actor),fps=state==='shoot'?12:state==='reload'?7:state==='walk'||state==='run'?8:4,col=seq[Math.floor(t*fps)%seq.length];return{x:GRID_X+col*CELL_W,y:GRID_Y+row*ROW_STEP,w:CELL_W,h:CELL_H}}
function teamFilter(team){if(team==='ally')return'sepia(.38) saturate(1.65) hue-rotate(165deg) brightness(1.06)';if(team==='enemy')return'sepia(.48) saturate(1.85) hue-rotate(315deg) brightness(1.02)';return'none'}

export function drawSoldier(ctx,actor,options){options=options||{};var state=options.state||getSoldierState(actor),r=frameRect(actor,state),scale=(options.scale==null?BASE_SCALE:options.scale)*(actor&&actor.scale?actor.scale:1),dw=r.w*scale,dh=r.h*scale,flip=actor&&actor.facingX<0?-1:1,bob=state==='walk'||state==='run'?Math.sin(animTime(actor)*11)*.7:0;ctx.save();ctx.translate(options.x||0,(options.y||0)+bob);ctx.globalAlpha=options.alpha==null?1:options.alpha;ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(0,2,Math.max(7,dw*.23),Math.max(2,dh*.055),0,0,Math.PI*2);ctx.fill();ctx.scale(flip,1);ctx.filter=teamFilter(options.team||'player');if(soldierAtlas.complete&&soldierAtlas.naturalWidth>0){ctx.drawImage(soldierAtlas,r.x,r.y,r.w,r.h,-dw*.5,-dh,dw,dh)}else{ctx.filter='none';ctx.fillStyle=options.team==='enemy'?'#8b514b':options.team==='ally'?'#477da8':'#56646b';ctx.fillRect(-6,-24,12,22);ctx.fillStyle='#9b9d9a';ctx.beginPath();ctx.arc(0,-28,5,0,Math.PI*2);ctx.fill()}ctx.restore()}

export function getSoldierAtlasInfo(){return{width:1448,height:1086,gridX:GRID_X,gridY:GRID_Y,cellW:CELL_W,cellH:CELL_H,weaponRows:WEAPON_ROWS}}
