(()=>{
'use strict';

const FALLBACK_API='https://script.google.com/macros/s/AKfycbyQTjkjNZnPFpsxPArYZ2gpELWiHUOVPzRd5eQx1pzhfEjNsb4ejl1p0IrZWzhbMU49/exec';
const POLL_MS=60000;
let apiUrl='';
let panel=null;
let badge=null;
let countLabel=null;
let live=null;
let loading=false;
let timer=null;
let latest=[];

function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function money(v){return '$'+Number(v||0).toFixed(2)}
function relativeTime(value){
  if(!value)return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  const mins=Math.max(0,Math.floor((Date.now()-d.getTime())/60000));
  if(mins<1)return 'adesso';
  if(mins<60)return mins+' min fa';
  const hrs=Math.floor(mins/60);
  if(hrs<24)return hrs+' h fa';
  return Math.floor(hrs/24)+' g fa';
}
function jsonp(params){
  return new Promise((resolve,reject)=>{
    const cb='vauNotifCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    const s=document.createElement('script');
    const timeout=setTimeout(()=>{cleanup();reject(new Error('Timeout API'))},16000);
    function cleanup(){clearTimeout(timeout);delete window[cb];s.remove()}
    window[cb]=data=>{cleanup();resolve(data)};
    s.src=apiUrl+'?'+new URLSearchParams({...params,callback:cb,_t:Date.now()}).toString();
    s.onerror=()=>{cleanup();reject(new Error('Errore collegamento API'))};
    document.body.appendChild(s);
  });
}
async function apiGet(params){
  try{
    const q=new URLSearchParams({...params,_t:Date.now()});
    const r=await fetch(apiUrl+'?'+q.toString(),{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return await r.json();
  }catch(e){
    return await jsonp(params);
  }
}
async function apiPost(payload){
  try{
    const r=await fetch(apiUrl,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(payload)
    });
    if(r.ok)return await r.json();
  }catch(e){}
  let frame=document.getElementById('vauNotifPostFrame');
  if(!frame){
    frame=document.createElement('iframe');
    frame.name='vauNotifPostFrame';
    frame.id='vauNotifPostFrame';
    frame.style.display='none';
    document.body.appendChild(frame);
  }
  const form=document.createElement('form');
  form.method='POST';
  form.action=apiUrl;
  form.target='vauNotifPostFrame';
  form.style.display='none';
  const inp=document.createElement('input');
  inp.name='payload';
  inp.value=JSON.stringify(payload);
  form.appendChild(inp);
  document.body.appendChild(form);
  form.submit();
  form.remove();
  await new Promise(r=>setTimeout(r,350));
  return {ok:true,fallback:true};
}
function newOrdersFrom(items){
  return (Array.isArray(items)?items:[])
    .filter(o=>String(o?.status||'').trim().toLowerCase()==='nuovo')
    .sort((a,b)=>new Date(b?.createdAt||0)-new Date(a?.createdAt||0));
}
function itemHtml(o){
  const line=(o.lines||[])[0];
  const summary=line
    ? esc(line.item||'')+(Number(line.qty||0)>0?' ×'+Number(line.qty||0):'')
    : 'Ordine da aprire';
  return `<div class="vau-notify-item" data-order-id="${esc(o.id)}">
    <div class="vau-notify-top">
      <span class="vau-notify-code">${esc(o.id||'Ordine')}</span>
      <span class="vau-notify-time">${esc(relativeTime(o.createdAt))}</span>
    </div>
    <div class="vau-notify-client">${esc(o.client||'Cliente non indicato')}</div>
    <div class="vau-notify-meta">${esc(o.department||'Tenuta')} · ${money(o.total)} · ${summary}</div>
    <div class="vau-notify-actions">
      <button class="vau-notify-action primary" type="button" data-take="${esc(o.id)}">Prendi in carico</button>
      <button class="vau-notify-action" type="button" data-open-order>Apri ordine</button>
    </div>
  </div>`;
}
function render(){
  if(!panel||!badge||!countLabel)return;
  const n=latest.length;
  badge.textContent=String(n);
  badge.style.display=n?'flex':'none';
  countLabel.textContent=n===1?'1 da lavorare':n+' da lavorare';
  const head=`<div class="vau-notify-head"><strong>Nuovi ordini</strong><span id="vauNotifyCount">${n===1?'1 da lavorare':n+' da lavorare'}</span></div>`;
  if(!n){
    panel.innerHTML=head+'<div class="vau-notify-empty">Nessun nuovo ordine.</div><a class="vau-notify-footer" href="ordini.html">Apri registro ordini →</a>';
  }else{
    panel.innerHTML=head+latest.slice(0,5).map(itemHtml).join('')+
      (n>5?`<div class="vau-notify-empty">Altri ${n-5} ordini nuovi nel registro.</div>`:'')+
      '<a class="vau-notify-footer" href="ordini.html">Apri registro ordini →</a>';
  }
  countLabel=panel.querySelector('#vauNotifyCount');
}
function renderError(){
  if(!panel)return;
  panel.innerHTML='<div class="vau-notify-head"><strong>Nuovi ordini</strong><span>—</span></div><div class="vau-notify-error">Impossibile aggiornare le notifiche in questo momento.</div><a class="vau-notify-footer" href="ordini.html">Apri registro ordini →</a>';
}
async function refresh(){
  if(loading||!apiUrl)return;
  loading=true;
  try{
    const data=await apiGet({action:'orders'});
    if(!data||data.ok===false)throw new Error(data?.error||'Errore API');
    const previous=latest.length;
    latest=newOrdersFrom(data.orders);
    render();
    if(live && latest.length!==previous){
      live.textContent=latest.length?latest.length+' nuovi ordini da lavorare':'Nessun nuovo ordine';
    }
  }catch(e){
    if(!latest.length)renderError();
  }finally{
    loading=false;
  }
}
async function takeOrder(id,btn){
  if(!id||!btn)return;
  btn.disabled=true;
  btn.textContent='Aggiorno…';
  try{
    const r=await apiPost({action:'updateStatus',id,status:'In lavorazione'});
    if(r&&r.ok===false)throw new Error(r.error||'Errore');
    latest=latest.filter(o=>String(o.id)!==String(id));
    render();
    if(typeof window.loadOrders==='function')setTimeout(()=>window.loadOrders(),550);
    setTimeout(refresh,900);
  }catch(e){
    btn.disabled=false;
    btn.textContent='Prendi in carico';
  }
}
function inject(){
  const mast=document.querySelector('.masthead');
  if(!mast||mast.querySelector('.vau-logo-wrap'))return;

  const logo=document.createElement('div');
  logo.className='vau-logo-wrap';
  logo.innerHTML='<img src="assets/vauclair-logo.webp" alt="Stemma Famiglia Vauclair">';
  mast.appendChild(logo);

  const wrap=document.createElement('div');
  wrap.className='vau-notify-wrap';
  wrap.innerHTML=`<button class="vau-bell-btn" type="button" aria-label="Notifiche ordini" aria-expanded="false">🔔</button>
    <span class="vau-notify-badge" aria-hidden="true">0</span>
    <div class="vau-notify-panel" role="dialog" aria-label="Nuovi ordini"></div>
    <span class="vau-notify-live" aria-live="polite"></span>`;
  mast.appendChild(wrap);

  const bell=wrap.querySelector('.vau-bell-btn');
  panel=wrap.querySelector('.vau-notify-panel');
  badge=wrap.querySelector('.vau-notify-badge');
  live=wrap.querySelector('.vau-notify-live');
  panel.innerHTML='<div class="vau-notify-head"><strong>Nuovi ordini</strong><span id="vauNotifyCount">…</span></div><div class="vau-notify-empty">Aggiornamento notifiche…</div>';
  countLabel=panel.querySelector('#vauNotifyCount');

  bell.addEventListener('click',e=>{
    e.stopPropagation();
    const open=!panel.classList.contains('open');
    panel.classList.toggle('open',open);
    bell.setAttribute('aria-expanded',String(open));
    if(open)refresh();
  });
  panel.addEventListener('click',e=>{
    const take=e.target.closest('[data-take]');
    if(take){
      e.preventDefault();
      takeOrder(take.dataset.take,take);
      return;
    }
    if(e.target.closest('[data-open-order]')){
      location.href='ordini.html';
    }
  });
  document.addEventListener('click',e=>{
    if(!wrap.contains(e.target)){
      panel.classList.remove('open');
      bell.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      panel.classList.remove('open');
      bell.setAttribute('aria-expanded','false');
    }
  });
}
function init(){
  apiUrl=String(window.VAUCLAIR_CONFIG?.API_URL||FALLBACK_API);
  inject();
  refresh();
  timer=setInterval(refresh,POLL_MS);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')refresh();
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();