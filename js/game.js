import { createPlayer, drawPlayer } from './player.js';
import { createBandits, updateBandits, drawBandit } from './enemy.js';
import { createCover, findCoverForPoint, drawCover, isLineBlocked } from './cover.js';
import { initKeyboard, initJoystick, getMoveVector } from './input.js';
import { createDylan, updateDylan, drawDylan, resetDylan } from './ally.js';
import { loadAssets, images } from './assets.js';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),hint=document.querySelector('#hint');
const fireButton=document.querySelector('#fire'),reloadButton=document.querySelector('#reload');
const restartButton=document.querySelector('#restart'),message=document.querySelector('#message');
const messageTitle=document.querySelector('#messageTitle'),messageText=document.querySelector('#messageText'),messageButton=document.querySelector('#messageButton');
const waveBanner=document.querySelector('#waveBanner');
let W=0,H=0,dpr=1,last=0,gameOver=false,won=false,target=null,kills=0,wave=1,waveAnnounce=0,spawning=false;
const world={scaleX:.72,scaleY:.38,offsetY:-40};
const player=createPlayer(),dylan=createDylan(),covers=createCover();
let enemies=createBandits(1);
const buildings=[{x:-420,y:-280,img:'ruinA',scale:2.4},{x:380,y:-300,img:'ruinB',scale:2.2},{x:-450,y:220,img:'ruinB',scale:2.0},{x:420,y:180,img:'ruinA',scale:2.1},{x:-80,y:-360,img:'ruinA',scale:1.8},{x:100,y:340,img:'ruinB',scale:1.7}];
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
export function iso(x,y){return[W/2+(x-y)*world.scaleX,H/2+(x+y)*world.scaleY+world.offsetY]}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
export function nearestEnemy(){return enemies.filter(e=>!e.dead).sort((a,b)=>distance(player,a)-distance(player,b))[0]||null}
function screenToWorld(sx,sy){const a=(sx-W/2)/world.scaleX,b=(sy-(H/2+world.offsetY))/world.scaleY;return{x:(a+b)/2,y:(b-a)/2}}
function setTarget(e){target=e;player.aimTarget=e}
function attemptFire(){if(gameOver||won||player.reloading)return;const e=target&&!target.dead?target:nearestEnemy();if(!e)return;if(distance(player,e)>player.weapon.range)return;if(player.weapon.ammo<=0){reload();return}const blocked=isLineBlocked(player,e,covers);if(blocked&&!player.cover)return;const result=player.fireAt(e);if(result&&e.dead){kills+=1;checkWaveClear()}}
function reload(){if(!player.reloading&&player.weapon.ammo<player.weapon.magazine)player.startReload()}
function checkWaveClear(){if(!enemies.every(e=>e.dead))return;if(wave===1&&!spawning){spawning=true;waveAnnounce=2.2;if(waveBanner){waveBanner.textContent='WAVE 2';waveBanner.classList.remove('hidden')}setTimeout(()=>{wave=2;enemies=createBandits(2);spawning=false;target=null;if(waveBanner)waveBanner.classList.add('hidden')},1600);return}if(wave>=2)finish(true)}
fireButton.addEventListener('pointerdown',e=>{e.preventDefault();fireButton.classList.add('active');attemptFire()});
addEventListener('pointerup',()=>fireButton.classList.remove('active'));
reloadButton.addEventListener('pointerdown',e=>{e.preventDefault();reload()});
restartButton.addEventListener('pointerdown',reset);messageButton.addEventListener('pointerdown',reset);
canvas.addEventListener('pointerdown',e=>{if(gameOver||won)return;if(e.target!==canvas)return;const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;for(const enemy of enemies){if(enemy.dead)continue;const[x,y]=iso(enemy.x,enemy.y);if(Math.hypot(sx-x,sy-(y-28))<38){setTarget(enemy);return}}const p=screenToWorld(sx,sy);player.setDestination(p.x,p.y,findCoverForPoint(p.x,p.y,covers))});
initKeyboard({onFire:attemptFire,onReload:reload});initJoystick(document.querySelector('#joystick'));
function finish(win){won=win;gameOver=!win;messageTitle.textContent=win?'AREA CLEAR':'MISSION FAILED';messageText.textContent=win?`All hostiles eliminated. Kills: ${kills}. Dylan ${dylan.dead?'KIA':'survived'}.`:'The soldier was killed.';message.classList.remove('hidden')}
function reset(){player.reset();resetDylan(dylan);wave=1;enemies=createBandits(1);target=null;kills=0;gameOver=false;won=false;spawning=false;waveAnnounce=0;message.classList.add('hidden');if(waveBanner)waveBanner.classList.add('hidden')}
function drawAsphalt(){const tile=images.asphalt;ctx.fillStyle='#1a2226';ctx.fillRect(0,0,W,H);const step=72;for(let x=-920;x<=920;x+=step)for(let y=-720;y<=720;y+=step){const[cx,cy]=iso(x,y),hw=world.scaleX*(step*.52),hh=world.scaleY*(step*.52);ctx.save();ctx.beginPath();ctx.moveTo(cx,cy-hh);ctx.lineTo(cx+hw,cy);ctx.lineTo(cx,cy+hh);ctx.lineTo(cx-hw,cy);ctx.closePath();ctx.clip();if(tile){const tw=hw*2.2,th=hh*2.2,ox=((x+y)*.13)%40,oy=((x-y)*.09)%40;ctx.globalAlpha=.92;ctx.drawImage(tile,cx-tw/2+ox*.2,cy-th/2+oy*.2,tw,th);ctx.globalAlpha=1}else{ctx.fillStyle=(x+y)%(step*2)===0?'#303a3f':'#2c353a';ctx.fill()}ctx.strokeStyle='#00000033';ctx.lineWidth=1;ctx.stroke();ctx.restore()}}
function drawBuildings(){for(const b of [...buildings].sort((a,b)=>(a.x+a.y)-(b.x+b.y))){const img=b.img==='ruinA'?images.ruinA:images.ruinB;if(!img)continue;const[sx,sy]=iso(b.x,b.y),w=160*b.scale,h=w*(img.height/img.width);ctx.save();ctx.globalAlpha=.95;ctx.drawImage(img,sx-w/2,sy-h*.88,w,h);ctx.restore()}}
function depthKey(o){return o.x+o.y}
function drawWorld(){drawAsphalt();drawBuildings();covers.forEach(c=>drawCover(ctx,c,iso));if(target&&!target.dead){const a=iso(player.x,player.y),b=iso(target.x,target.y);ctx.strokeStyle='#f5d54799';ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(a[0],a[1]-30);ctx.lineTo(b[0],b[1]-30);ctx.stroke();ctx.setLineDash([])}}
function update(dt){if(gameOver||won)return;if(waveAnnounce>0)waveAnnounce-=dt;const mv=getMoveVector();if(mv)player.setKeyboardMove(mv);else if(player.keyboardMove){player.keyboardMove=null;player.tx=player.x;player.ty=player.y;player.state='idle'}player.update(dt,covers);if(player.hp<=0){finish(false);return}updateDylan(dylan,dt,enemies,covers,player);if(dylan.hp<=0&&!dylan.dead)dylan.dead=true;updateBandits(enemies,dt,player,covers,[dylan]);if(target?.dead)target=null;if(!spawning&&enemies.every(e=>e.dead))checkWaveClear()}
function draw(){drawWorld();const sprites=[];for(const e of enemies)if(!e.dead)sprites.push({z:depthKey(e),kind:'enemy',ref:e});if(!dylan.dead)sprites.push({z:depthKey(dylan),kind:'dylan',ref:dylan});sprites.push({z:depthKey(player),kind:'player',ref:player});sprites.sort((a,b)=>a.z-b.z);for(const s of sprites){if(s.kind==='enemy')drawBandit(ctx,s.ref,iso,target===s.ref);else if(s.kind==='dylan')drawDylan(ctx,s.ref,iso);else drawPlayer(ctx,s.ref,iso)}const alive=enemies.filter(e=>!e.dead).length;status.innerHTML=`<span class="hp">HP ${Math.max(0,Math.ceil(player.hp))}</span> * <span class="ammo">AMMO ${player.weapon.ammo}/${player.weapon.magazine}</span> * <span class="kills">KILLS ${kills}</span> * W${wave} (${alive} left)`+(player.cover?' * IN COVER':'')+(target&&!target.dead?' * TARGET LOCKED':'');hint.textContent=player.reloading?'RELOADING...':'Joystick / WASD move * Tap target * FIRE * R reload';reloadButton.classList.toggle('hidden',player.weapon.ammo===player.weapon.magazine&&!player.reloading)}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
let started=false;function start(){if(started)return;started=true;requestAnimationFrame(loop)}
loadAssets().finally(start);setTimeout(start,2500);
