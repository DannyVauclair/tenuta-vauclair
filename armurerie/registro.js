/* Vauclair Armurerie — registro sul dispositivo (NON condiviso).
   Non pubblicare chiavi private o meccanismi di autenticazione solo frontend.
   Quando lo staff approverà il progetto, collegare un backend dedicato con RLS. */
(() => {
'use strict';
const C=Array.isArray(window.VAUCLAIR_CATALOG)?window.VAUCLAIR_CATALOG:[];
const STORAGE='vauclair.armurerie.pratiche.v1';
const STATUSES=['In attesa','Confermato','In lavorazione','Concluso','Annullato'];
const TYPES=['Acquisto','Commissione','Esportazione'];
const money=new Intl.NumberFormat('it-IT',{style:'currency',currency:'USD',currencyDisplay:'narrowSymbol',minimumFractionDigits:0,maximumFractionDigits:2});
const number=new Intl.NumberFormat('it-IT');
const $=id=>document.getElementById(id);
let records=[];
function read(){
  try{
    const raw=localStorage.getItem(STORAGE);
    const value=JSON.parse(raw||'[]');
    if(Array.isArray(value))records=value.filter(validate).slice(0,5000);
  }catch(_){records=[];}
}
function validate(x){
  return !!x && typeof x==='object'
    && typeof x.id==='string'&&x.id.length<=90
    && TYPES.includes(x.type)&&STATUSES.includes(x.status)
    && typeof x.party==='string'&&x.party.length<=90
    && typeof x.weapon==='string'&&C.some(z=>z.id===x.weapon)
    && Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=9999
    && typeof x.price==='number'&&Number.isFinite(x.price)&&x.price>=0&&x.price<=100000
    && typeof x.notes==='string'&&x.notes.length<=1000
    && typeof x.created==='string'&&x.created.length<=70;
}
function save(){
  try{localStorage.setItem(STORAGE,JSON.stringify(records));return true;}
  catch(_){alert('Impossibile salvare in questo browser. Esporta un backup prima di chiudere.');return false;}
}
function el(tag,cls,content){
  const z=document.createElement(tag);if(cls)z.className=cls;
  if(content!==undefined)z.textContent=String(content);return z;
}
function preview(){
  const qty=Number($('recordQuantity').value)||0;
  const price=Number($('recordPrice').value)||0;
  $('recordEstimate').textContent='Valore della pratica: '+money.format(qty*price)+' ('+qty+' × '+money.format(price)+').';
}
function refill(){
  const item=C.find(z=>z.id===$('recordWeapon').value);
  const type=$('recordType').value;
  $('recordPrice').value=item&&type!=='Esportazione'?String(item.buy):'';
  $('recordPrice').placeholder=type==='Esportazione'?'Importo riconosciuto dal blip':"Prezzo concordato con il fornitore";
  preview();
}
function updateStats(){
  const complete=records.filter(r=>r.status==='Concluso');
  const purchases=complete.filter(r=>r.type!=='Esportazione');
  const exports=complete.filter(r=>r.type==='Esportazione');
  const spent=purchases.reduce((s,r)=>s+r.quantity*r.price,0);
  const income=exports.reduce((s,r)=>s+r.quantity*r.price,0);
  $('statRecords').textContent=number.format(records.length);
  $('statAcquired').textContent=number.format(purchases.reduce((s,r)=>s+r.quantity,0));
  $('statExported').textContent=number.format(exports.reduce((s,r)=>s+r.quantity,0));
  $('statCash').textContent=money.format(Math.round((income-spent)*100)/100);
}
function textFilter(raw){return String(raw).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function render(){
  updateStats();
  const root=$('deskList');root.replaceChildren();
  const query=textFilter($('deskSearch').value.trim()),type=$('deskType').value,status=$('deskStatus').value;
  const current=records.filter(r=>(!type||r.type===type)&&(!status||r.status===status)&&
    (!query||textFilter([r.id,r.party,r.notes,C.find(c=>c.id===r.weapon)?.name].join(' ')).includes(query)));
  current.sort((a,b)=>b.created.localeCompare(a.created));
  if(!current.length){root.append(el('div','desk-empty',records.length?'Nessuna pratica corrisponde ai filtri.':'Nessuna pratica ancora registrata. Puoi crearne una qui sotto.'));return;}
  for(const r of current){
    const weapon=C.find(i=>i.id===r.weapon);
    const card=el('article','desk-card');
    const head=el('div','desk-card-head'),left=el('div');
    left.append(el('span','',r.id.slice(0,24)));
    left.append(el('strong','',r.type+' · '+r.party));
    const right=el('div');right.append(el('span','',r.created.slice(0,10)));
    head.append(left,right);
    const detail=el('div','desk-detail');
    detail.append(el('span','','Modello: '+(weapon?.name||'—')),el('span','','Stato: '+r.status));
    const lots=el('div','desk-rows',r.quantity+' × '+(weapon?.name||'—')+' · '+money.format(r.price)+' cad. = '+money.format(r.quantity*r.price));
    const foot=el('div','desk-card-buttons');
    const select=el('select','','');select.setAttribute('aria-label','Stato della pratica '+r.id);
    for(const stat of STATUSES){const opt=el('option','',stat);opt.value=stat;opt.selected=stat===r.status;select.append(opt);}
    select.addEventListener('change',()=>{r.status=select.value;save();render();});
    const copy=el('button','','Copia riepilogo');copy.type='button';
    copy.addEventListener('click',async()=>{
      const txt=['VAUCLAIR ARMURERIE · '+r.id, r.type+' — '+r.status,
        'Controparte: '+r.party,'Arma: '+(weapon?.name||'—'),'Quantità: '+r.quantity,
        'Prezzo unitario: '+money.format(r.price),'Totale: '+money.format(r.price*r.quantity),
        r.notes?'Note: '+r.notes:null].filter(x=>x!==null).join('\n');
      try{await navigator.clipboard.writeText(txt);copy.textContent='Copiato ✓';}
      catch(_){window.prompt('Copia il riepilogo:',txt);}
    });
    const duplicate=el('button','','Duplica');duplicate.type='button';
    duplicate.addEventListener('click',()=>{const x={...r,id:makeId(),created:new Date().toISOString(),status:'In attesa'};records.unshift(x);save();render();});
    const remove=el('button','','Elimina');remove.type='button';
    remove.addEventListener('click',()=>{if(!window.confirm('Eliminare definitivamente la pratica '+r.id+' da questo dispositivo?'))return;records=records.filter(x=>x.id!==r.id);save();render();});
    foot.append(select,copy,duplicate,remove);
    card.append(head,detail,lots);
    if(r.notes)card.append(el('p','',r.notes));
    card.append(foot);root.append(card);
  }
}
function makeId(){return 'VA-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,7).toUpperCase();}
function download(filename,text,format){
  const b=new Blob([text],{type:format}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),6000);
}
function csvCell(value){return '"'+String(value??'').replace(/"/g,'""')+'"';}
function csv(){
  const cols=['Codice','Creato','Tipo','Stato','Controparte','Arma','Quantita','Prezzo_unitario','Totale','Note'];
  const lines=[cols.join(';'),...records.map(r=>[
    r.id,r.created,r.type,r.status,r.party,C.find(c=>c.id===r.weapon)?.name||r.weapon,
    r.quantity,r.price.toFixed(2),(r.quantity*r.price).toFixed(2),r.notes
  ].map(csvCell).join(';'))];
  download('vauclair-registro-'+new Date().toISOString().slice(0,10)+'.csv','\ufeff'+lines.join('\r\n'),'text/csv;charset=utf-8');
}
async function importBackup(file){
  try{
    if(file.size>5*1024*1024)throw Error('File troppo grande.');
    const raw=JSON.parse(await file.text());
    if(!Array.isArray(raw)||raw.length>5000||raw.some(x=>!validate(x)))throw Error('Questo backup non ha un formato valido.');
    if(!window.confirm('Importare '+raw.length+' pratiche? Questo sostituirà quelle presenti su questo dispositivo.'))return;
    const before=records;records=raw;
    if(!save()){records=before;return;}
    render();$('recordMessage').textContent='Backup importato: '+raw.length+' pratiche.';
  }catch(err){$('recordMessage').textContent='Importazione non riuscita: '+err.message;}
}
function init(){
  const weapon=$('recordWeapon');if(!weapon)return;
  for(const item of C){const opt=el('option','',item.name);opt.value=item.id;weapon.append(opt);}
  for(const id of ['deskSearch','deskType','deskStatus'])$(id).addEventListener(id==='deskSearch'?'input':'change',render);
  for(const id of ['recordType','recordWeapon'])$(id).addEventListener('change',refill);
  for(const id of ['recordQuantity','recordPrice'])$(id).addEventListener('input',preview);
  $('recordForm').addEventListener('submit',e=>{
    e.preventDefault();const form=e.target;if(!form.reportValidity())return;
    const party=$('recordParty').value.trim(),qty=Number($('recordQuantity').value),price=Number($('recordPrice').value);
    if(!party||!Number.isInteger(qty)||qty<1||qty>9999||!Number.isFinite(price)||price<0||price>100000){
      $('recordMessage').textContent='Controlla quantità, prezzo e referente.';return;
    }
    const x={id:makeId(),type:$('recordType').value,party,weapon:weapon.value,quantity:qty,
      price:Math.round(price*100)/100,status:$('recordStatus').value,notes:$('recordNotes').value.trim(),
      created:new Date().toISOString()};
    if(!validate(x)){$('recordMessage').textContent='Controlla i campi inseriti.';return;}
    records.unshift(x);save();render();
    $('recordMessage').textContent='Pratica '+x.id+' salvata su questo dispositivo.';
    form.reset();refill();$('pratiche').scrollIntoView({behavior:'smooth'});
  });
  $('recordForm').addEventListener('reset',()=>setTimeout(refill,0));
  $('exportCsv').addEventListener('click',csv);
  $('exportJson').addEventListener('click',()=>download('vauclair-registro-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(records,null,2),'application/json'));
  $('importJson').addEventListener('change',async e=>{if(e.target.files?.[0])await importBackup(e.target.files[0]);e.target.value='';});
  const menuBtn=$('menuButton'),menu=$('mobileMenu');
  menuBtn.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuBtn.setAttribute('aria-expanded',String(!menu.hidden));});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuBtn.setAttribute('aria-expanded','false');}));
  read();render();refill();
}
init();
})();
