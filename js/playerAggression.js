import { isLineBlocked } from './cover.js?v=20260905-50';

var burstUntil=0,burstPauseUntil=0;
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function nearestTarget(player,enemies){var best=null,bd=Infinity;for(var i=0;i<enemies.length;i++){var e=enemies[i];if(!e||e.dead)continue;var d=distance(player,e);if(d<bd){bd=d;best=e}}return best}
function tick(){if(!window.__autoPlay)return;var p=window.__battlePlayer,enemies=window.__battleEnemies||[],covers=window.__battleCovers||[];if(!p||p.dead||p.downed||p.reloading)return;var now=performance.now(),e=p.aimTarget&&!p.aimTarget.dead?p.aimTarget:nearestTarget(p,enemies);if(!e)return;p.aimTarget=e;var d=distance(p,e);if(d>p.weapon.range)return;if(isLineBlocked(p,e,covers)&&!e.exposed)return;if(p.weapon.ammo<=0){p.startReload();return}if(now<burstPauseUntil)return;if(now>=burstUntil){burstUntil=now+1500+Math.random()*1300;burstPauseUntil=0}if(now<=burstUntil&&p.weapon.fireCooldown<=0){p.fireAt(e);if(p.weapon.ammo<=0)p.startReload()}if(now>burstUntil){burstPauseUntil=now+120+Math.random()*180;burstUntil=0}}
setInterval(tick,45);
