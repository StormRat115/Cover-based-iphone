import { createPlayer, drawPlayer } from './player.js';
import { createBandits, updateBandits, drawBandit } from './enemy.js';
import { createCover, findCoverForPoint, drawCover, isLineBlocked } from './cover.js';
import { initKeyboard, getKeyboardMove } from './input.js';

const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),hint=document.querySelector('#hint');
const fireButton=document.querySelector('#fire'),reloadButton=document.querySelector('#reload');
const restartButton=document.querySelector('#restart'),message=document.querySelector('#message');
const messageTitle=document.querySelector('#messageTitle'),messageText=document.querySelector('#messageText'),messageButton=document.querySelector('#messageButton');
let W=0,H=0,dpr=1,last=0,gameOver=false,won=false,target=null,kills=0;
const world={scaleX:.72,scaleY:.38,offsetY:-40};
const player=createPlayer(),covers=createCover();let enemies=createBandits();
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
export function iso(x,y){return[W/2+(x-y)*world.scaleX,H/2+(x+y)*world.scaleY+world.offsetY]}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
export function nearestEnemy(){return enemies.filter(e=>!e.dead).sort((a,b)=>distance(player,a)-distance(player,b))[0]||null}
function screenToWorld(sx,sy){const a=(sx-W/2)/world.scaleX,b=(sy-(H/2+world.offsetY))/world.scaleY;return{x:(a+b)/2,y:(b-a)/2}}
function setTarget(e){target=e;player.aimTarget=e}
function attemptFire(){if(gameOver||won||player.reloading)return;const e=target&&!target.dead?target:nearestEnemy();if(!e)return;if(distance(player,e)>player.weapon.range)return;if(player.weapon.ammo<=0){reload();return}if(isLineBlocked(player,e,covers)&&!player.cover)return;const result=player.fireAt(e);if(result){kills+=e.dead?1:0;if(kills===enemies.length)finish(true)}}
function reload(){if(!player.reloading&&player.weapon.ammo<player.weapon.magazine)player.startReload()}
fireButton.addEventListener('pointerdown',e=>{e.preventDefault();fireButton.classList.add('active');attemptFire()});addEventListener('pointerup',()=>fireButton.classList.remove('active'));
reloadButton.addEventListener('pointerdown',e=>{e.preventDefault();reload()});restartButton.addEventListener('pointerdown',reset);messageButton.addEventListener('pointerdown',reset);
canvas.addEventListener('pointerdown',e=>{if(gameOver||won)return;const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;for(const enemy of enemies){if(enemy.dead)continue;const[x,y]=iso(enemy.x,enemy.y);if(Math.hypot(sx-x,sy-(y-28))<38){setTarget(enemy);return}}const p=screenToWorld(sx,sy),cover=findCoverForPoint(p.x,p.y,covers);player.setDestination(p.x,p.y,cover)});
initKeyboard({onFire:attemptFire,onReload:reload});
function finish(win){won=win;gameOver=!win;messageTitle.textContent=win?'AREA CLEAR':'MISSION FAILED';messageText.textContent=win?'All hostiles eliminated.':'The soldier was killed.';message.classList.remove('hidden')}
function reset(){player.reset();enemies=createBandits();target=null;kills=0;gameOver=false;won=false;message.classList.add('hidden')}
function update(dt){if(gameOver||won)return;const km=getKeyboardMove();if(km)player.setKeyboardMove(km);player.update(dt,covers);if(player.hp<=0){finish(false);return}updateBandits(enemies,dt,player,covers);if(target?.dead)target=null;if(enemies.every(e=>e.dead))finish(true)}
function diamond(x,y,w,h,c){const p=iso(x,y);ctx.beginPath();ctx.moveTo(p[0],p[1]-h);ctx.lineTo(p[0]+w,p[1]);ctx.lineTo(p[0],p[1]+h);ctx.lineTo(p[0]-w,p[1]);ctx.closePath();ctx.fillStyle=c;ctx.fill()}
function drawWorld(){ctx.fillStyle='#293238';ctx.fillRect(0,0,W,H);for(let x=-900;x<=900;x+=80)for(let y=-700;y<=700;y+=80)diamond(x,y,28,15,(x+y)%160===0?'#303a3f':'#2c353a');covers.forEach(c=>drawCover(ctx,c,iso));if(target&&!target.dead){const a=iso(player.x,player.y),b=iso(target.x,target.y);ctx.strokeStyle='#f5d54799';ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(a[0],a[1]-30);ctx.lineTo(b[0],b[1]-30);ctx.stroke();ctx.setLineDash([])}}
function draw(){drawWorld();enemies.filter(e=>!e.dead).sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(e=>drawBandit(ctx,e,iso,target===e));drawPlayer(ctx,player,iso);status.textContent=`HP ${Math.max(0,Math.ceil(player.hp))} • ${kills}/${enemies.length} BANDITS • ${player.weapon.ammo}/${player.weapon.magazine}${player.cover?' • IN COVER':''}${target&&!target.dead?' • TARGET LOCKED':''}`;hint.textContent=player.reloading?'RELOADING…':'WASD move • SPACE fire • R reload • Click/tap to move/target';reloadButton.classList.toggle('hidden',player.weapon.ammo===player.weapon.magazine&&!player.reloading)}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
