import { createPlayer, drawPlayer } from './player.js';
import { createBandits, updateBandits, drawBandit } from './enemy.js';
import { createCover, findCoverForPoint, getCoverSlot, drawCover, isLineBlocked } from './cover.js';
import { initKeyboard, getKeyboardMove } from './input.js';

const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),hint=document.querySelector('#hint');
const fireButton=document.querySelector('#fire'),reloadButton=document.querySelector('#reload');
const restartButton=document.querySelector('#restart'),message=document.querySelector('#message');
const messageTitle=document.querySelector('#messageTitle'),messageText=document.querySelector('#messageText'),messageButton=document.querySelector('#messageButton');
let W=0,H=0,dpr=1,last=0,gameOver=false,won=false,target=null,kills=0,hitMarker=0,damagePops=[];
const world={scaleX:.72,scaleY:.38,offsetY:-40};
const player=createPlayer(),covers=createCover();let enemies=createBandits();
const projectiles=[];
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
export function iso(x,y){return[W/2+(x-y)*world.scaleX,H/2+(x+y)*world.scaleY+world.offsetY]}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
export function nearestEnemy(){return enemies.filter(e=>!e.dead).sort((a,b)=>distance(player,a)-distance(player,b))[0]||null}
function screenToWorld(sx,sy){const a=(sx-W/2)/world.scaleX,b=(sy-(H/2+world.offsetY))/world.scaleY;return{x:(a+b)/2,y:(b-a)/2}}
function setTarget(e){target=e;player.aimTarget=e}
function spawnProjectile(e){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;projectiles.push({x:player.x+dx/d*18,y:player.y+dy/d*18,tx:e.x,ty:e.y,life:0,maxLife:Math.min(.45,d/900),speed:900})}
function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.life+=dt;const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);const step=p.speed*dt;if(d<=step||p.life>=p.maxLife){p.x=p.tx;p.y=p.ty;projectiles.splice(i,1);continue}p.x+=dx/d*step;p.y+=dy/d*step}}
function drawProjectiles(){for(const p of projectiles){const [x,y]=iso(p.x,p.y),[tx,ty]=iso(p.tx,p.ty);const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1;const tail=12;ctx.save();ctx.strokeStyle='#ffe36b';ctx.lineWidth=3;ctx.lineCap='round';ctx.globalAlpha=Math.max(.2,1-p.life/p.maxLife);ctx.beginPath();ctx.moveTo(x-dx/d*tail,y-dy/d*tail);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#fff7b0';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.restore()}}
function updateFeedback(dt){hitMarker=Math.max(0,hitMarker-dt);for(let i=damagePops.length-1;i>=0;i--){const p=damagePops[i];p.t+=dt;if(p.t>=.7)damagePops.splice(i,1)}}
function drawFeedback(){if(hitMarker>0){const a=Math.min(1,hitMarker/.12),x=W/2,y=H/2-28;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-10,y-10);ctx.lineTo(x-3,y-3);ctx.moveTo(x+10,y-10);ctx.lineTo(x+3,y-3);ctx.moveTo(x-10,y+10);ctx.lineTo(x-3,y+3);ctx.moveTo(x+10,y+10);ctx.lineTo(x+3,y+3);ctx.stroke();ctx.restore()}for(const p of damagePops){const [x,y]=iso(p.x,p.y),a=1-p.t/.7;ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#fff';ctx.font='900 16px system-ui';ctx.textAlign='center';ctx.fillText(p.value,x,y-48-p.t*28);ctx.restore()}}
function attemptFire(){if(gameOver||won||player.reloading||player.dead)return;const e=target&&!target.dead?target:nearestEnemy();if(!e)return;if(distance(player,e)>player.weapon.range)return;if(player.weapon.ammo<=0){reload();return}const blocked=isLineBlocked(player,e,covers);if(blocked&&!player.cover)return;const result=player.fireAt(e);if(result){spawnProjectile(e);hitMarker=.12;damagePops.push({x:e.x,y:e.y,value:24,t:0});if(e.dead)kills++}}
function reload(){if(!player.dead&&!player.reloading&&player.weapon.ammo<player.weapon.magazine)player.startReload()}
fireButton.addEventListener('pointerdown',e=>{e.preventDefault();fireButton.classList.add('active');attemptFire()});addEventListener('pointerup',()=>fireButton.classList.remove('active'));
reloadButton.addEventListener('pointerdown',e=>{e.preventDefault();reload()});restartButton.addEventListener('pointerdown',reset);messageButton.addEventListener('pointerdown',reset);
canvas.addEventListener('pointerdown',e=>{if(gameOver||won||player.dead)return;const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;for(const enemy of enemies){if(enemy.dead)continue;const[x,y]=iso(enemy.x,enemy.y);if(Math.hypot(sx-x,sy-(y-28))<38){setTarget(enemy);return}}const p=screenToWorld(sx,sy-12),cover=findCoverForPoint(p.x,p.y,covers);if(cover){const slot=getCoverSlot(cover,player,target&&!target.dead?target:null);player.setDestination(slot.x,slot.y,cover)}else player.setDestination(p.x,p.y,null)});
initKeyboard({onFire:attemptFire,onReload:reload});
function finish(win){won=win;gameOver=!win;messageTitle.textContent=win?'AREA CLEAR':'MISSION FAILED';messageText.textContent=win?'All hostiles eliminated.':'The soldier was killed.';message.classList.remove('hidden')}
function reset(){player.reset();enemies=createBandits();projectiles.length=0;damagePops.length=0;hitMarker=0;target=null;kills=0;gameOver=false;won=false;message.classList.add('hidden')}
function update(dt){if(gameOver||won)return;const km=getKeyboardMove();if(km)player.setKeyboardMove(km);else if(player.keyboardMove)player.setKeyboardMove(null);updateBandits(enemies,dt,player,covers);if(player.hp<=0&&!player.dead)player.triggerDeath();player.update(dt);updateProjectiles(dt);updateFeedback(dt);if(target?.dead)target=null;if(player.dead&&player.deathTimer>=player.deathDuration){finish(false);return}if(enemies.every(e=>e.dead&&e.deathTimer>=e.deathDuration))finish(true)}
function diamond(x,y,w,h,c){const p=iso(x,y);ctx.beginPath();ctx.moveTo(p[0],p[1]-h);ctx.lineTo(p[0]+w,p[1]);ctx.lineTo(p[0],p[1]+h);ctx.lineTo(p[0]-w,p[1]);ctx.closePath();ctx.fillStyle=c;ctx.fill()}
function drawWorld(){ctx.fillStyle='#293238';ctx.fillRect(0,0,W,H);for(let x=-900;x<=900;x+=80)for(let y=-700;y<=700;y+=80)diamond(x,y,28,15,(x+y)%160===0?'#303a3f':'#2c353a');covers.forEach(c=>drawCover(ctx,c,iso));if(target&&!target.dead){const a=iso(player.x,player.y),b=iso(target.x,target.y);ctx.strokeStyle='#f5d54799';ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(a[0],a[1]-30);ctx.lineTo(b[0],b[1]-30);ctx.stroke();ctx.setLineDash([])}}
function draw(){drawWorld();drawProjectiles();enemies.filter(e=>!e.dead||e.deathTimer<e.deathDuration).sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(e=>drawBandit(ctx,e,iso,target===e));drawPlayer(ctx,player,iso);drawFeedback();status.textContent=`HP ${Math.max(0,Math.ceil(player.hp))} • ${kills}/${enemies.length} BANDITS • ${player.weapon.ammo}/${player.weapon.magazine}${player.cover?' • IN COVER':''}${target&&!target.dead?' • TARGET LOCKED':''}`;hint.textContent=player.dead?'SOLDIER DOWN':player.reloading?'RELOADING…':'Tap cover to take position • WASD move • SPACE/FIRE shoot • R reload';reloadButton.classList.toggle('hidden',player.weapon.ammo===player.weapon.magazine&&!player.reloading)}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
