(()=>{
'use strict';

const API='https://script.google.com/macros/s/AKfycbyQTjkjNZnPFpsxPArYZ2gpELWiHUOVPzRd5eQx1pzhfEjNsb4ejl1p0IrZWzhbMU49/exec';
const POLL_MS=60000;
let apiUrl=API, panel, badge, bell, live, latest=[], loading=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'$'+Number(v||0).toFixed(2);

function relativeTime(value){
  if(!value)return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  const m=Math.max(0,Math.floor((Date.now()-d.getTime())/60000));
  if(m<1)return 'adesso';
  if(m<60)return m+' min fa';
  const h=Math.floor(m/60);
  if(h<24)return h+' h fa';
  return Math.floor(h/24)+' g fa';
}

async function textAsset(path){
  const r=await fetch(path+'?v=20261010-3',{cache:'force-cache'});
  if(!r.ok)throw new Error(path+' '+r.status);
  return (await r.text()).trim();
}

async function installVisuals(){
  let bg='',logo='';
  try{[bg,logo]=await Promise.all([textAsset('vau-bg.b64'),textAsset('vau-logo.b64')]);}catch(e){}

  const style=document.createElement('style');
  style.id='vau-live-theme';
  style.textContent=`
  body{
    background-color:#0e0d0f!important;
    ${bg?`background-image:linear-gradient(rgba(12,10,11,.70),rgba(12,10,11,.80)),url("data:image/webp;base64,${bg}")!important;`:''}
    background-size:cover!important;
    background-position:center top!important;
    background-repeat:no-repeat!important;
    background-attachment:fixed!important;
  }
  .masthead{
    position:relative!important;
    min-height:164px!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    text-align:center!important;
    padding:20px 210px 20px 170px!important;
    overflow:visible!important;
    z-index:30!important;
    background:
      linear-gradient(90deg,transparent,rgba(185,133,63,.06) 22%,rgba(185,133,63,.10) 50%,rgba(185,133,63,.06) 78%,transparent),
      rgba(19,17,17,.91)!important;
  }
  .mast-ornament{display:none!important}
  .vau-logo-wrap{
    position:absolute;right:24px;top:50%;transform:translateY(-50%);
    width:150px;height:150px;display:grid;place-items:center;
    pointer-events:none;filter:drop-shadow(0 8px 18px rgba(0,0,0,.55));z-index:3;
  }
  .vau-logo-wrap img{max-width:100%;max-height:100%;object-fit:contain;display:block}
  .vau-notify-wrap{
    position:absolute;right:190px;top:50%;transform:translateY(-50%);z-index:50;
    font-family:'Libre Baskerville',Georgia,serif;text-transform:none;letter-spacing:normal;
  }
  .vau-bell-btn{
    width:54px;height:54px;padding:0;border-radius:50%;border:1px solid #b9853f;
    background:rgba(25,21,21,.95);color:#d8ad63;cursor:pointer;
    display:grid;place-items:center;font-size:23px;line-height:1;
    box-shadow:0 8px 20px rgba(0,0,0,.30),inset 0 0 0 4px rgba(185,133,63,.05);
  }
  .vau-bell-btn:hover{background:#231b19;color:#efd092}
  .vau-notify-badge{
    position:absolute;right:-5px;top:-6px;min-width:24px;height:24px;padding:0 6px;
    border-radius:20px;background:#9f332d;border:2px solid #e3c68f;color:#fff;
    display:none;align-items:center;justify-content:center;
    font:700 12px/1 'Libre Baskerville',Georgia,serif;box-shadow:0 3px 8px rgba(0,0,0,.35);
  }
  .vau-notify-panel{
    position:absolute;right:0;top:66px;width:360px;max-height:min(520px,70vh);overflow:auto;
    display:none;background:linear-gradient(180deg,#251f1d,#171414);
    border:1px solid rgba(185,133,63,.34);border-top:2px solid #b9853f;
    box-shadow:0 18px 42px rgba(0,0,0,.50);text-align:left;color:#f1e8d8;
  }
  .vau-notify-panel.open{display:block}
  .vau-notify-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(241,232,216,.12)}
  .vau-notify-head strong{color:#d8ad63;font:600 12px 'Cinzel',serif;letter-spacing:.7px;text-transform:uppercase}
  .vau-notify-head span{color:#bfae91;font-size:10px}
  .vau-notify-item{padding:12px 14px;border-bottom:1px solid rgba(241,232,216,.12)}
  .vau-notify-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
  .vau-notify-code{color:#d8ad63;font-weight:700;font-size:12px}
  .vau-notify-time{color:#9e8c73;font-size:9.5px;white-space:nowrap}
  .vau-notify-client{margin-top:3px;color:#f1e8d8;font-weight:700;font-size:12.5px}
  .vau-notify-meta{margin-top:4px;color:#bfae91;font-size:10.5px;line-height:1.4}
  .vau-notify-actions{display:flex;gap:7px;margin-top:9px}
  .vau-notify-action{
    border:1px solid rgba(185,133,63,.34);background:#191617;color:#f1e8d8;
    padding:6px 8px;cursor:pointer;font:600 9px 'Cinzel',serif;letter-spacing:.25px;
  }
  .vau-notify-action:hover{border-color:#b9853f;color:#d8ad63}
  .vau-notify-action.primary{background:linear-gradient(180deg,#5c211e,#351311);border-color:#b9853f}
  .vau-notify-action[disabled]{opacity:.55;cursor:wait}
  .vau-notify-empty,.vau-notify-error{padding:18px 14px;color:#bfae91;font-size:11px;line-height:1.5}
  .vau-notify-error{color:#d47b71}
  .vau-notify-footer{
    display:block;text-align:center;padding:10px 12px;text-decoration:none;color:#d8ad63;
    border-top:1px solid rgba(241,232,216,.12);font:600 9.5px 'Cinzel',serif;
    letter-spacing:.55px;text-transform:uppercase;
  }
  .vau-notify-footer:hover{background:rgba(185,133,63,.055)}
  .vau-notify-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  @media(max-width:900px){
    .masthead{padding-left:120px!important;padding-right:160px!important}
    .vau-logo-wrap{width:115px;height:115px;right:16px}
    .vau-notify-wrap{right:145px}
  }
  @media(max-width:680px){
    body{background-attachment:scroll!important}
    .masthead{min-height:190px!important;padding:20px 16px 78px!important}
    .vau-logo-wrap{width:78px;height:78px;right:18px;top:auto;bottom:5px;transform:none}
    .vau-notify-wrap{right:auto;left:18px;top:auto;bottom:18px;transform:none}
    .vau-bell-btn{width:46px;height:46px;font-size:20px}
    .vau-notify-panel{left:0;right:auto;width:min(350px,calc(100vw - 36px));top:57px}
  }`;
  document.head.appendChild(style);

  const mast=document.querySelector('.masthead');
  if(mast && logo){
    const holder=document.createElement('div');
    holder.className='vau-logo-wrap';
    const img=document.createElement('img');
    img.alt='Stemma Famiglia Vauclair';
    img.src='data:image/webp;base64,'+logo;
    holder.appendChild(img);
    mast.appendChild(holder);
  }
}

function jsonp(params){
  return new Promise((resolve,reject)=>{
    const cb='vauNotif_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    const s=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();reject(new Error('Timeout API'))},16000);
    function cleanup(){clearTimeout(timer);delete window[cb];s.remove()}
    window[cb]=data=>{cleanup();resolve(data)};
    s.src=apiUrl+'?'+new URLSearchParams({...params,callback:cb,_t:Date.now()}).toString();
    s.onerror=()=>{cleanup();reject(new Error('Errore API'))};
    document.body.appendChild(s);
  });
}
async function apiGet(params){
  try{
    const r=await fetch(apiUrl+'?'+new URLSearchParams({...params,_t:Date.now()}),{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return await r.json();
  }catch(e){return jsonp(params)}
}
async function apiPost(payload){
  try{
    const r=await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    if(r.ok)return await r.json();
  }catch(e){}
  let frame=document.getElementById('vauNotifPostFrame');
  if(!frame){
    frame=document.createElement('iframe');frame.name='vauNotifPostFrame';frame.id='vauNotifPostFrame';frame.style.display='none';document.body.appendChild(frame);
  }
  const form=document.createElement('form');form.method='POST';form.action=apiUrl;form.target='vauNotifPostFrame';form.style.display='none';
  const inp=document.createElement('input');inp.name='payload';inp.value=JSON.stringify(payload);
  form.appendChild(inp);document.body.appendChild(form);form.submit();form.remove();
  await new Promise(r=>setTimeout(r,350));
  return{ok:true,fallback:true};
}

function newOrders(items){
  return (Array.isArray(items)?items:[])
    .filter(o=>String(o?.status||'').trim().toLowerCase()==='nuovo')
    .sort((a,b)=>new Date(b?.createdAt||0)-new Date(a?.createdAt||0));
}
function orderHtml(o){
  const line=(o.lines||[])[0];
  const first=line?(esc(line.item||'')+(Number(line.qty||0)>0?' ×'+Number(line.qty||0):'')):'Ordine da aprire';
  return `<div class="vau-notify-item">
    <div class="vau-notify-top"><span class="vau-notify-code">${esc(o.id||'Ordine')}</span><span class="vau-notify-time">${esc(relativeTime(o.createdAt))}</span></div>
    <div class="vau-notify-client">${esc(o.client||'Cliente non indicato')}</div>
    <div class="vau-notify-meta">${esc(o.department||'Tenuta')} · ${money(o.total)} · ${first}</div>
    <div class="vau-notify-actions">
      <button class="vau-notify-action primary" type="button" data-take="${esc(o.id)}">Prendi in carico</button>
      <button class="vau-notify-action" type="button" data-open>Apri ordine</button>
    </div>
  </div>`;
}
function render(){
  const n=latest.length;
  badge.textContent=String(n);badge.style.display=n?'flex':'none';
  const head=`<div class="vau-notify-head"><strong>Nuovi ordini</strong><span>${n===1?'1 da lavorare':n+' da lavorare'}</span></div>`;
  panel.innerHTML=head+(n?latest.slice(0,5).map(orderHtml).join(''):'<div class="vau-notify-empty">Nessun nuovo ordine.</div>')+
    (n>5?`<div class="vau-notify-empty">Altri ${n-5} ordini nuovi nel registro.</div>`:'')+
    '<a class="vau-notify-footer" href="ordini.html">Apri registro ordini →</a>';
}
async function refresh(){
  if(loading)return;loading=true;
  try{
    const d=await apiGet({action:'orders'});
    if(!d||d.ok===false)throw new Error(d?.error||'Errore');
    latest=newOrders(d.orders);render();
    if(live)live.textContent=latest.length?latest.length+' nuovi ordini':'Nessun nuovo ordine';
  }catch(e){
    if(!latest.length)panel.innerHTML='<div class="vau-notify-head"><strong>Nuovi ordini</strong><span>—</span></div><div class="vau-notify-error">Impossibile aggiornare le notifiche.</div><a class="vau-notify-footer" href="ordini.html">Apri registro ordini →</a>';
  }finally{loading=false}
}
async function take(id,btn){
  btn.disabled=true;btn.textContent='Aggiorno…';
  try{
    const r=await apiPost({action:'updateStatus',id,status:'In lavorazione'});
    if(r&&r.ok===false)throw new Error(r.error||'Errore');
    latest=latest.filter(o=>String(o.id)!==String(id));render();
    if(typeof window.loadOrders==='function')setTimeout(()=>window.loadOrders(),500);
    setTimeout(refresh,900);
  }catch(e){btn.disabled=false;btn.textContent='Prendi in carico'}
}
function injectBell(){
  const mast=document.querySelector('.masthead');if(!mast)return;
  const wrap=document.createElement('div');wrap.className='vau-notify-wrap';
  wrap.innerHTML='<button class="vau-bell-btn" type="button" aria-label="Notifiche ordini" aria-expanded="false">🔔</button><span class="vau-notify-badge">0</span><div class="vau-notify-panel"></div><span class="vau-notify-live" aria-live="polite"></span>';
  mast.appendChild(wrap);
  bell=wrap.querySelector('.vau-bell-btn');badge=wrap.querySelector('.vau-notify-badge');panel=wrap.querySelector('.vau-notify-panel');live=wrap.querySelector('.vau-notify-live');
  panel.innerHTML='<div class="vau-notify-head"><strong>Nuovi ordini</strong><span>…</span></div><div class="vau-notify-empty">Aggiornamento notifiche…</div>';
  bell.onclick=e=>{e.stopPropagation();const open=!panel.classList.contains('open');panel.classList.toggle('open',open);bell.setAttribute('aria-expanded',open);if(open)refresh()};
  panel.onclick=e=>{
    const t=e.target.closest('[data-take]');if(t){take(t.dataset.take,t);return}
    if(e.target.closest('[data-open]'))location.href='ordini.html';
  };
  document.addEventListener('click',e=>{if(!wrap.contains(e.target)){panel.classList.remove('open');bell.setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.classList.remove('open');bell.setAttribute('aria-expanded','false')}});
}
async function init(){
  apiUrl=String(window.VAUCLAIR_CONFIG?.API_URL||API);
  await installVisuals();
  injectBell();
  refresh();
  setInterval(refresh,POLL_MS);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();