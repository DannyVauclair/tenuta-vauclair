(()=>{
"use strict";
/* Ordini Vauclair Armurerie: salva su browser locale, nessun server.
   I valori di listino sono istantanee al momento della creazione.
   Nessun dato viene trasmesso o condiviso con altri utenti. */
const WEAPONS=Array.isArray(window.VAUCLAIR_WEAPONS)?window.VAUCLAIR_WEAPONS:[];
const STORE="vauclair.armurerie.orders.v1",DRAFT="vauclair.armurerie.draft.v1";
const STATES=["Da valutare","Confermato","In corso","Ricevuto","Annullato"];
const money=value=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"USD",currencyDisplay:"narrowSymbol",minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const norm=str=>String(str||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const formatDate=stamp=>{const date=new Date(stamp);return Number.isNaN(date.getTime())?stamp:date.toLocaleString("it-IT",{dateStyle:"short",timeStyle:"short"})};
const validLine=l=>l&&WEAPONS.some(w=>w.id===l.id)&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<=9999&&Number.isFinite(l.unit)&&l.unit>=0&&l.unit<=100000;
const validOrder=r=>r&&typeof r==="object"&&typeof r.id==="string"&&r.id.length<100&&typeof r.created==="string"&&r.created.length<80&&typeof r.supplier==="string"&&r.supplier.length<=90&&typeof r.type==="string"&&r.type.length<=50&&typeof r.notes==="string"&&r.notes.length<=700&&STATES.includes(r.status)&&Number.isFinite(r.price)&&r.price>=0&&r.price<=10000000&&Array.isArray(r.lines)&&r.lines.length>0&&r.lines.length<=22&&r.lines.every(validLine);
let orders=[],lines=[],priceEdited=false;
function notice(msg){$("saveStatus").textContent=msg}
function load(){
  try{const x=JSON.parse(localStorage.getItem(STORE)||"[]");orders=Array.isArray(x)?x.filter(validOrder).slice(0,3000):[];}catch(_){orders=[];}
}
function persist(){
  try{localStorage.setItem(STORE,JSON.stringify(orders));return true}
  catch(_){notice("Non è stato possibile salvare sul browser. Libera spazio o verifica le impostazioni.");return false}
}
function openPanel(){
  $("orderPanel").hidden=false;
  $("orderPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
function closePanel(){
  lines=[];priceEdited=false;$("orderForm").reset();$("orderPanel").hidden=true;
  $("estimatedPrice").textContent=money(0);
  $("chosenWeapons").textContent="Nessuna arma inserita.";
  notice("");
}
function updateLines(){
  const root=$("chosenWeapons");root.replaceChildren();
  let total=0;
  if(!lines.length)root.append(node("div","","Nessuna arma inserita."));
  for(const line of lines){
    const w=WEAPONS.find(x=>x.id===line.id);
    if(!w)continue;
    total+=line.qty*line.unit;
    const row=node("div","order-chosen-line");
    row.append(node("span","",line.qty+" × "+w.name),node("b","",money(line.qty*line.unit)));
    const remove=node("button","","×");remove.type="button";remove.setAttribute("aria-label","Rimuovi "+w.name);
    remove.addEventListener("click",()=>{lines=lines.filter(x=>x.id!==line.id);updateLines();});
    row.append(remove);root.append(row);
  }
  total=Math.round(total*100)/100;
  $("estimatedPrice").textContent=money(total);
  if(!priceEdited)$("agreedPrice").value=String(total);
}
function addWeapon(id,amount){
  const weapon=WEAPONS.find(w=>w.id===id);
  const qty=Number(amount);
  if(!weapon||!Number.isInteger(qty)||qty<1||qty>999){notice("Seleziona un modello e una quantità compresa tra 1 e 999.");return;}
  const prev=lines.find(x=>x.id===id);
  if(prev)prev.qty=Math.min(9999,prev.qty+qty);
  else lines.push({id,qty,unit:weapon.buy});
  notice("");updateLines();
}
function makeId(){
  const t=new Date().toISOString().slice(0,10).replace(/-/g,"");
  const rnd=typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID().slice(0,6).toUpperCase():Math.random().toString(36).slice(2,8).toUpperCase();
  return "VA-"+t+"-"+rnd;
}
function render(){
  const root=$("orderList");root.replaceChildren();
  $("statNew").textContent=orders.filter(r=>r.status==="Da valutare").length;
  $("statProgress").textContent=orders.filter(r=>r.status==="Confermato"||r.status==="In corso").length;
  $("statDone").textContent=orders.filter(r=>r.status==="Ricevuto").length;
  const q=norm($("filterOrders").value.trim()),s=$("filterStatus").value;
  const matches=orders.filter(r=>(!s||r.status===s)&&(!q||norm([r.id,r.supplier,r.type,r.notes,r.lines.map(l=>WEAPONS.find(w=>w.id===l.id)?.name||"").join(" ")].join(" ")).includes(q)));
  matches.sort((a,b)=>b.created.localeCompare(a.created));
  if(!matches.length){root.append(node("div","order-empty",orders.length?"Nessun ordine corrisponde ai filtri.":"Nessun ordine ancora registrato."));return}
  for(const r of matches){
    const card=node("article","order-card"),head=node("div","order-card-head"),title=node("div","");
    title.append(node("small","",r.id+" · "+formatDate(r.created)));
    title.append(node("h3","",r.supplier));
    const meta=node("div","order-card-meta");
    meta.append(node("span","",r.type));
    meta.append(node("span","",r.lines.reduce((tot,l)=>tot+l.qty,0)+" armi"));
    title.append(meta);
    const state=node("span","order-status",r.status);head.append(title,state);card.append(head);
    const items=node("div","order-card-items");
    for(const l of r.lines){const w=WEAPONS.find(x=>x.id===l.id);if(w)items.append(node("span","",l.qty+" × "+w.name));}
    card.append(items);
    if(r.notes)card.append(node("p","order-card-notes",r.notes));
    const bottom=node("div","order-card-bottom");
    bottom.append(node("strong","",money(r.price)));
    const actions=node("div","");
    const select=node("select","","");select.setAttribute("aria-label","Stato ordine "+r.id);
    for(const opt of STATES){const el=node("option","",opt);el.value=opt;el.selected=opt===r.status;select.append(el);}
    select.addEventListener("change",()=>{
      const before=r.status;r.status=select.value;
      if(!persist()){r.status=before;select.value=before;return;}
      render();
    });
    const copy=node("button","","Copia");copy.type="button";copy.addEventListener("click",async()=>{
      const msg=["VAUCLAIR ARMURERIE — ORDINE "+r.id,"Fornitore: "+r.supplier,"Tipo: "+r.type,
        ...r.lines.map(l=>{const w=WEAPONS.find(x=>x.id===l.id);return "• "+l.qty+" × "+(w?.name||"Arma")+" ("+money(l.unit)+" cad. indicativi)";}),
        "Importo concordato: "+money(r.price),"Stato: "+r.status,r.notes?"Note: "+r.notes:null].filter(Boolean).join("\n");
      try{await navigator.clipboard.writeText(msg);copy.textContent="Copiato ✓";}
      catch(_){window.prompt("Copia il riepilogo dell'ordine:",msg);}
    });
    const remove=node("button","","Elimina");remove.type="button";
    remove.addEventListener("click",()=>{
      if(!confirm("Eliminare l'ordine "+r.id+"? Non sarà recuperabile senza un backup."))return;
      const previous=orders;orders=orders.filter(o=>o!==r);
      if(!persist()){orders=previous;return;}render();
    });
    actions.append(select,copy,remove);bottom.append(actions);card.append(bottom);root.append(card);
  }
}
function downloadBackup(){
  const data=JSON.stringify({version:1,created:new Date().toISOString(),orders},null,2);
  const blob=new Blob([data],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=node("a");
  a.href=url;a.download="vauclair-armurerie-ordini-"+new Date().toISOString().slice(0,10)+".json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function startDraft(){
  try{
    const draft=JSON.parse(sessionStorage.getItem(DRAFT)||"null");
    sessionStorage.removeItem(DRAFT);
    if(!Array.isArray(draft)||!draft.length)return;
    for(const l of draft){
      if(WEAPONS.some(w=>w.id===l.id)&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<=999) addWeapon(l.id,l.qty);
    }
    if(lines.length)openPanel();
  }catch(_){}
}
function init(){
  const sel=$("weaponChoice");
  if(!sel)return;
  for(const w of WEAPONS){const opt=node("option","",w.name);opt.value=w.id;sel.append(opt);}
  $("newOrder").addEventListener("click",openPanel);
  $("cancelOrder").addEventListener("click",closePanel);
  $("addWeapon").addEventListener("click",()=>addWeapon(sel.value,$("weaponQuantity").value));
  $("agreedPrice").addEventListener("input",()=>{priceEdited=true;});
  $("filterOrders").addEventListener("input",render);
  $("filterStatus").addEventListener("change",render);
  $("exportData").addEventListener("click",downloadBackup);
  $("orderForm").addEventListener("submit",ev=>{
    ev.preventDefault();if(!ev.currentTarget.reportValidity())return;
    const supplier=$("supplier").value.trim(),price=Number($("agreedPrice").value),type=$("supplierType").value;
    if(!supplier||!lines.length||!Number.isFinite(price)||price<0||price>10000000){notice("Inserisci un fornitore, almeno un'arma e un importo valido.");return}
    const record={id:makeId(),supplier,type,status:$("initialStatus").value,price:Math.round(price*100)/100,
      lines:lines.map(l=>({...l})),notes:$("orderNotes").value.trim(),created:new Date().toISOString()};
    if(!validOrder(record)){notice("Controlla i dati dell'ordine.");return;}
    const before=orders;orders=[record,...orders];
    if(!persist()){orders=before;return;}
    closePanel();render();$("orderList").scrollIntoView({behavior:"smooth",block:"start"});
  });
  load();render();updateLines();startDraft();
  if(window.location.hash==="#nuovo"&&!lines.length)openPanel();
}
init();
})();
