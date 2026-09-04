const keys=new Set();
let firePressed=false,reloadPressed=false;

export function initKeyboard({onFire,onReload}={}){
 addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','r'].includes(k)) e.preventDefault();
  if(k===' '&&!e.repeat){firePressed=true;onFire?.()}
  if(k==='r'&&!e.repeat){reloadPressed=true;onReload?.()}
  keys.add(k);
 });
 addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
 addEventListener('blur',()=>keys.clear());
}

export function getKeyboardMove(){
 let x=0,y=0;
 if(keys.has('a')||keys.has('arrowleft'))x-=1;
 if(keys.has('d')||keys.has('arrowright'))x+=1;
 if(keys.has('w')||keys.has('arrowup'))y-=1;
 if(keys.has('s')||keys.has('arrowdown'))y+=1;
 const len=Math.hypot(x,y);
 return len?{x:x/len,y:y/len}:null;
}

export function hasKeyboardFocus(){return keys.size>0}
