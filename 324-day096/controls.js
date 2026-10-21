export const $=id=>document.getElementById(id);
export const defaults={volume:80,offset:0,hand:'right',quality:'high',guide:'on',partner:'on',tempo:112,mute:false};
export function read(key,fallback){try{return JSON.parse(localStorage.getItem('tg.324.'+key))??fallback}catch{return fallback}}
export function save(key,value){try{localStorage.setItem('tg.324.'+key,JSON.stringify(value))}catch{}}
export const settings={...defaults,...read('settings',{})};
settings.volume=Math.max(0,Math.min(100,Number(settings.volume)||0));settings.offset=Math.max(-100,Math.min(100,Number(settings.offset)||0));
export function setupControls(api){
 const pointers=new Map(),keys=new Map(),rects=new Map();const pads=[...document.querySelectorAll('.pad')];
 function measure(){pads.forEach(p=>rects.set(p,p.getBoundingClientRect()))}addEventListener('resize',measure);measure();
 function hand(p){return Number(p.dataset.hand)^(settings.hand==='left'?1:0)}
 function end(id,cancel=false){const p=pointers.get(id);if(!p)return;api.up(p.token,cancel);p.el.classList.remove('pressed');pointers.delete(id)}
 pads.forEach(el=>{el.addEventListener('pointerdown',e=>{if(!api.enabled()||e.button>0)return;e.preventDefault();api.unlock();el.setPointerCapture(e.pointerId);const r=rects.get(el);const type=e.clientY-r.top<r.height*.26?'K':'D';const token=api.down(hand(el),type);pointers.set(e.pointerId,{el,y:e.clientY,token,swiped:false});el.classList.add('pressed')});el.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(p&&!p.swiped&&p.y-e.clientY>=48){p.swiped=true;api.swipe(p.token)}});el.addEventListener('pointerup',e=>end(e.pointerId));el.addEventListener('pointercancel',e=>end(e.pointerId,true));el.addEventListener('lostpointercapture',e=>end(e.pointerId,true))});
 function clear(){for(const id of pointers.keys())end(id,true);for(const t of keys.values())api.up(t,true);keys.clear()}
 addEventListener('blur',()=>{clear();api.pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();api.pause()}});
 const codes={KeyF:[0,'D'],KeyJ:[1,'D'],KeyD:[0,'K'],KeyK:[1,'K']};
 addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;if(e.code==='Escape'||e.code==='Space'){e.preventDefault();if(!e.repeat)api.pause();return}if(!codes[e.code]||e.repeat||!api.enabled())return;e.preventDefault();api.unlock();const [h,t]=codes[e.code];keys.set(e.code,api.down(h^(settings.hand==='left'?1:0),e.shiftKey?'O':t))});addEventListener('keyup',e=>{if(keys.has(e.code)){api.up(keys.get(e.code));keys.delete(e.code)}});
 $('pause').onclick=()=>{clear();api.pause()};document.querySelectorAll('.mute').forEach(el=>el.onclick=()=>{settings.mute=!settings.mute;save('settings',settings);api.settings();refresh()});
 function refresh(){document.querySelectorAll('.mute').forEach(el=>el.textContent=settings.mute?'音 OFF':'音 ON');for(const id of ['volume','offset','tempo'])$(id+'Value').textContent=settings[id]+(id==='offset'?' ms':id==='tempo'?' BPM':' %')}
 for(const id of ['volume','offset','hand','quality','guide','partner','tempo']){$(id).value=settings[id];$(id).oninput=()=>{settings[id]=$(id).type==='range'?Number($(id).value):$(id).value;save('settings',settings);refresh();api.settings()}}
 $('gear').onclick=()=>{clear();api.openSettings()};$('settingsClose').onclick=()=>api.closeSettings();$('calibrate').onclick=()=>api.calibrate();
 function orientation(){const landscape=innerWidth>innerHeight&&matchMedia('(pointer:coarse)').matches;$('rotate').hidden=!landscape;if(landscape){clear();api.pause()}}addEventListener('resize',orientation);orientation();
 document.addEventListener('dblclick',e=>e.preventDefault());document.addEventListener('contextmenu',e=>e.preventDefault());refresh();return{clear,refresh};
}
// Control-only boot is also a working input/setting preview before the runtime is added.
if(!document.querySelector('script[src="main.js"]')){let start=0;setupControls({enabled:()=>true,unlock(){},down(){start=performance.now();$('feedback').textContent='打撃';return start},up(){const t=performance.now()-start;$('feedback').textContent=t<=120?'脱力':t<=250?'並':'力み'},swipe(){ $('feedback').textContent='大ドン'},pause(){ $('overlay').hidden=!$('overlay').hidden},settings(){},openSettings(){ $('settings').hidden=false},closeSettings(){ $('settings').hidden=true},calibrate(){}});$('overlay').hidden=true}
