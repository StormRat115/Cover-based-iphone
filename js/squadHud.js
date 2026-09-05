var hud=null;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function healthColor(pct,dead){return dead?'#666':pct>55?'#61b86b':pct>25?'#d6b74d':'#d85b50'}
function ensureHud(){
  if(hud)return hud;
  var old=document.getElementById('allyHealth');if(old)old.style.display='none';
  var status=document.getElementById('status');if(status)status.style.display='none';
  var hint=document.getElementById('hint');if(hint)hint.style.display='none';
  hud=document.createElement('div');hud.id='squadHealthHud';
  hud.style.cssText='position:fixed;left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));width:min(240px,calc(100vw - 82px));padding:8px 9px 7px;border:1px solid #ffffff22;border-radius:10px;background:#101714d9;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);z-index:7;pointer-events:none;font:800 10px system-ui;color:#e8eee9;letter-spacing:.55px;text-shadow:0 1px 3px #000;box-shadow:0 4px 14px #0005';
  document.body.appendChild(hud);return hud;
}
function bar(name,label,pct,color,big,dead){
  var height=big?8:4,margin=big?'0 0 8px':'3px 0 5px',font=big?12:9;
  return '<div style="margin:'+margin+';opacity:'+(dead?'.42':'1')+'"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:'+(big?4:2)+'px;font-size:'+font+'px"><span style="font-weight:950">'+name+'</span><span>'+label+'</span></div><div style="height:'+height+'px;background:#303733;border-radius:999px;overflow:hidden;border:'+(big?'1px solid #ffffff24':'0')+'"><div style="height:100%;width:'+pct+'%;background:'+color+'"></div></div></div>';
}
function updateHud(){
  var h=ensureHud(),p=window.__battlePlayer,allies=window.__battleAllies||[];
  var html='<div style="font-size:8px;color:#8fb7c8;letter-spacing:1.4px;margin-bottom:5px">SQUAD STATUS</div>';
  if(p){var pp=Math.round(clamp(p.hp,0,p.maxHp)/p.maxHp*100),pl=p.dead?'KIA':p.downed?'DOWNED':pp+'%';html+=bar('PLAYER',pl,pp,healthColor(pp,p.dead),true,p.dead)}
  html+=allies.map(function(a){var pct=Math.round(clamp(a.hp,0,a.maxHp)/a.maxHp*100),label=a.dead?'KIA':a.downed?'DOWNED':pct+'%';return bar(a.name+' · '+a.weapon.short,label,pct,healthColor(pct,a.dead),false,a.dead)}).join('');
  h.innerHTML=html;
  var old=document.getElementById('allyHealth');if(old)old.style.display='none';
}
function tick(){updateHud();requestAnimationFrame(tick)}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
