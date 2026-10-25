(()=>{
"use strict";
/* Ordini familiari su Supabase con RLS. Le tariffe del blip vengono lette
   soltanto dopo autenticazione e approvazione; non sono presenti nel codice pubblico.
   Il vecchio localStorage viene importato una sola volta, conservando un backup. */
const WEAPONS=Array.isArray(window.VAUCLAIR_WEAPONS)?window.VAUCLAIR_WEAPONS:[];
// Il catalogo storico resta leggibile negli ordini salvati; le nuove forniture usano solo armi rilasciate.
const ACTIVE_WEAPONS=WEAPONS.filter(w=>w.tag==="attuale");
const STORE="vauclair.armurerie.orders.v1",DRAFT="vauclair.armurerie.draft.v1";
const MIGRATED="vauclair.armurerie.orders.cloud-migrated.v1";
const TABLE="vauclair_shared_orders";
const SUPABASE_URL="https://bvihgkzztxksmzdjtniy.supabase.co";
const SUPABASE_PUBLIC_KEY="sb_publishable_kXVblfFaJZzSIPHbQYs6ig_0do9tewr";
const STATES=["Da valutare","Confermato","In corso","Ricevuto","Annullato"];
// The archive is a view of the SAME authenticated cloud records, not a second storage.
const ARCHIVE_VIEW=document.body?.dataset?.orderView==="archive";
const visibleOrder=r=>ARCHIVE_VIEW?r.status==="Ricevuto":r.status!=="Ricevuto";
const money=value=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"USD",currencyDisplay:"narrowSymbol",useGrouping:"always",minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const norm=str=>String(str||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const formatDate=stamp=>{const date=new Date(stamp);return Number.isNaN(date.getTime())?stamp:date.toLocaleString("it-IT",{dateStyle:"short",timeStyle:"short"})};
const validLine=l=>l&&WEAPONS.some(w=>w.id===l.id)&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<=9999&&Number.isFinite(l.unit)&&l.unit>=0&&l.unit<=100000;
const validOrder=r=>r&&typeof r==="object"&&typeof r.id==="string"&&r.id.length<100&&typeof r.created==="string"&&r.created.length<80&&typeof r.supplier==="string"&&r.supplier.length<=90&&typeof r.type==="string"&&r.type.length<=50&&typeof r.notes==="string"&&r.notes.length<=700&&STATES.includes(r.status)&&Number.isFinite(r.price)&&r.price>=0&&r.price<=10000000&&(r.expenses===undefined||(Number.isFinite(r.expenses)&&r.expenses>=0&&r.expenses<=10000000))&&Array.isArray(r.lines)&&r.lines.length>0&&r.lines.length<=22&&r.lines.every(validLine);
let orders=[],lines=[],priceEdited=false,editingRecord=null,approved=false,client=null,authSerial=0,refreshing=false,userId=null;
let tariff=new Map(),subscription=null;
const cents=v=>Math.round(Number(v||0)*100);
const toMoney=c=>money(c/100);
function notice(msg){$("saveStatus").textContent=msg}
function syncInfo(text,error=false){
 const box=$("orderSyncStatus");box.textContent=text;box.classList.toggle("error",error);
}
function accessMessage(text){$("orderAccessMessage").textContent=text}
function lock(text){
 approved=false;userId=null;orders=[];tariff.clear();
 $("orderWorkspace").hidden=true;$("orderAccessGate").hidden=false;
 accessMessage(text);if(subscription&&client){client.removeChannel(subscription);subscription=null;}
}
function readLegacy(){
 try{const old=JSON.parse(localStorage.getItem(STORE)||"[]");return Array.isArray(old)?old.filter(validOrder).slice(0,3000):[]}
 catch(_){return []}
}
function cleanPayload(r){
 const {updated_at,...record}=r;
 return {...record,expenses:Math.round((record.expenses??0)*100)/100};
}
function finance(r){
 let revenue=0;
 for(const l of r.lines){
  if(!tariff.has(l.id))return null;
  revenue+=l.qty*cents(tariff.get(l.id));
 }
 const purchase=cents(r.price),extra=cents(r.expenses||0),spent=purchase+extra;
 return {revenue,purchase,extra,spent,profit:revenue-spent,roi:spent>0?(revenue-spent)/spent*100:null};
}
function showPreview(){
 if(!$("newOrderProjection"))return;
 const purchase=cents($("agreedPrice").value),extra=cents($("orderExpenses").value);
 const linesReady=lines.length>0&&lines.every(l=>tariff.has(l.id));
 if(!linesReady){
  $("newOrderProjection").textContent="Seleziona solo armi con tariffe di esportazione approvate per ottenere una stima del profitto.";
  return;
 }
 const revenue=lines.reduce((s,l)=>s+l.qty*cents(tariff.get(l.id)),0);
 $("newOrderProjection").textContent="Ricavo blip stimato: "+toMoney(revenue)+" · Costi totali: "+toMoney(purchase+extra)+" · Profitto previsto: "+toMoney(revenue-purchase-extra)+" (armi tutte esportabili).";
}
async function fetchShared(){
 const received=[];
 for(let from=0;from<3000;from+=1000){
  const {data,error}=await client.from(TABLE).select("id,payload,updated_at").order("updated_at",{ascending:false}).range(from,from+999);
  if(error)throw error;
  received.push(...(data||[]));
  if(!data||data.length<1000)break;
 }
 return received.filter(row=>row&&row.payload&&validOrder({...row.payload,id:row.id}))
  .map(row=>({...row.payload,id:row.id,expenses:row.payload.expenses??0,updated_at:row.updated_at}));
}
async function importLegacy(remote){
 if(localStorage.getItem(MIGRATED)==="1")return;
 const known=new Set(remote.map(x=>x.id));
 const pending=readLegacy().filter(x=>!known.has(x.id));
 for(let i=0;i<pending.length;i+=50){
  const batch=pending.slice(i,i+50).map(r=>({id:r.id,payload:cleanPayload(r)}));
  const {error}=await client.from(TABLE).upsert(batch,{onConflict:"id",ignoreDuplicates:true});
  if(error)throw error;
 }
 // Non cancellare lo storico locale: rimane come backup.
 localStorage.setItem(MIGRATED,"1");
 if(pending.length&&window.VAUCLAIR_NOTIFY)window.VAUCLAIR_NOTIFY("Ordini importati",pending.length+" ordini trasferiti al registro condiviso");
}
async function refreshShared(){
 if(!approved||refreshing)return;
 refreshing=true;
 try{orders=await fetchShared();render();syncInfo((ARCHIVE_VIEW?"Archivio ricevuti":"Ordini attivi")+" sincronizzato · "+orders.filter(visibleOrder).length+" ordini · Daniel e Vivian · aggiornato alle "+new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}));}
 catch(e){syncInfo("Sincronizzazione non riuscita: "+(e.message||"controlla la connessione")+" · Riprova prima di modificare.",true);}
 finally{refreshing=false;}
}
async function checkAccess(){
 const n=++authSerial;
 if(!client){lock("Servizio di autenticazione non disponibile: ricarica la pagina.");return;}
 try{
  const {data:{user},error}=await client.auth.getUser();
  if(n!==authSerial)return;
  if(error||!user){lock("Accedi prima al Registro riservato con l'account di Daniel o Vivian; poi torna qui.");return;}
  const auth=await client.from("vauclair_private_members").select("user_id").eq("user_id",user.id).maybeSingle();
  if(n!==authSerial)return;
  if(auth.error)throw auth.error;
  if(!auth.data){lock("Questo account non è abilitato agli ordini della famiglia Vauclair.");return;}
  const prices=await client.from("vauclair_export_prices").select("weapon_id,blip_price").eq("quality","REALE").gt("blip_price",0);
  if(n!==authSerial)return;
  if(prices.error)throw prices.error;
  if(!Array.isArray(prices.data)||prices.data.length!==11)throw Error("Tariffe riservate non disponibili o incomplete.");
  tariff=new Map(prices.data.map(x=>[x.weapon_id,Number(x.blip_price)]));
  approved=true;userId=user.id;
  let remote=await fetchShared();
  if(n!==authSerial)return;
  try{await importLegacy(remote);remote=await fetchShared();}
  catch(e){syncInfo("Importazione storico locale non completata: "+e.message,true);throw e;}
  if(n!==authSerial)return;
  orders=remote;$("orderAccessGate").hidden=true;$("orderWorkspace").hidden=false;
  render();showPreview();
  syncInfo((ARCHIVE_VIEW?"Archivio ricevuti":"Ordini attivi")+" condiviso · "+orders.filter(visibleOrder).length+" ordini · Daniel e Vivian");
  if(!subscription&&typeof client.channel==="function"){
   subscription=client.channel("vauclair-family-orders")
    .on("postgres_changes",{event:"*",schema:"public",table:TABLE},()=>{void refreshShared();})
    .subscribe();
  }
 }catch(e){if(n!==authSerial)return;lock("Impossibile verificare l'accesso o sincronizzare gli ordini: "+(e.message||"errore di connessione")+". Riprova.");}
}
async function writeOrder(record){
 if(!approved)throw Error("Accesso non autorizzato");
 const {error}=await client.from(TABLE).insert({id:record.id,payload:cleanPayload(record)});
 if(error)throw error;
 await refreshShared();
}
async function changeOrder(record){
 if(!approved)throw Error("Accesso non autorizzato");
 const timestamp=new Date().toISOString();
 const {data,error}=await client.from(TABLE)
  .update({payload:cleanPayload(record),updated_at:timestamp})
  .eq("id",record.id).eq("updated_at",record.updated_at).select("id");
 if(error)throw error;
 if(!data?.length)throw Error("Questo ordine è stato modificato altrove. Aggiorna e riprova.");
 await refreshShared();
}
async function eraseOrder(record){
 if(!approved)throw Error("Accesso non autorizzato");
 const {data,error}=await client.from(TABLE)
  .delete().eq("id",record.id).eq("updated_at",record.updated_at).select("id");
 if(error)throw error;
 if(!data?.length)throw Error("L'ordine è stato modificato altrove. Aggiorna prima di eliminarlo.");
 await refreshShared();
}
function openPanel(){
  $("orderPanel").hidden=false;
  $("orderPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
function closePanel(){
  editingRecord=null;lines=[];priceEdited=false;
  $("orderForm").reset();
  $("orderPanel").hidden=true;
  $("formTitle").textContent="Nuovo ordine";
  $("editingOrderHint").hidden=true;
  $("saveOrderButton").textContent="Salva ordine";
  $("estimatedPrice").textContent=money(0);
  $("chosenWeapons").textContent="Nessuna arma inserita.";
  $("orderExpenses").value="0";
  showPreview();notice("");
}
function startNewOrder(){closePanel();openPanel();}
function beginEditOrder(record){
  if(!approved)return;
  editingRecord={...record,lines:record.lines.map(l=>({...l}))};
  lines=record.lines.map(l=>({...l}));
  priceEdited=Math.abs(cents(record.price)-lines.reduce((sum,l)=>sum+cents(l.unit)*l.qty,0))>1;
  $("orderForm").reset();
  $("supplier").value=record.supplier;
  $("supplierType").value=record.type;
  $("initialStatus").value=record.status;
  $("orderNotes").value=record.notes;
  $("orderExpenses").value=String(record.expenses||0);
  $("agreedPrice").value=String(record.price);
  $("formTitle").textContent="Modifica ordine · "+record.id;
  $("editingOrderHint").hidden=false;
  $("saveOrderButton").textContent="Salva modifiche";
  updateLines();
  $("agreedPrice").value=String(record.price);
  showPreview();openPanel();
  notice("Modifica modelli, quantità e prezzi; verifica il totale effettivamente pagato prima di salvare.");
}
function updateTotals(){
  const total=lines.reduce((sum,l)=>sum+cents(l.unit)*l.qty,0);
  $("estimatedPrice").textContent=toMoney(total);
  if(!priceEdited)$("agreedPrice").value=(total/100).toFixed(2);
  showPreview();
}
function updateLines(){
  const root=$("chosenWeapons");root.replaceChildren();
  if(!lines.length)root.append(node("div","","Nessuna arma inserita."));
  for(const line of lines){
    const w=WEAPONS.find(x=>x.id===line.id);
    if(!w)continue;
    const row=node("div","order-chosen-line order-edit-line");
    row.append(node("span","",w.name));
    const qtyLabel=node("label","","Quantità"),qty=node("input");
    Object.assign(qty,{type:"number",min:"1",max:"9999",step:"1",value:String(line.qty)});
    qty.setAttribute("aria-label","Quantità "+w.name);
    qty.addEventListener("change",()=>{
      const val=Number(qty.value);
      if(!Number.isInteger(val)||val<1||val>9999){qty.value=String(line.qty);notice("La quantità deve essere intera, da 1 a 9999.");return;}
      line.qty=val;notice("");updateTotals();
    });
    qtyLabel.append(qty);row.append(qtyLabel);
    const unitLabel=node("label","","Prezzo indicativo / arma ($)"),unit=node("input");
    Object.assign(unit,{type:"number",min:"0",max:"100000",step:"0.01",value:String(line.unit)});
    unit.setAttribute("aria-label","Prezzo unitario indicativo "+w.name);
    unit.addEventListener("change",()=>{
      const val=Number(unit.value);
      if(unit.value.trim()===""||!Number.isFinite(val)||val<0||val>100000||Math.abs(cents(val)/100-val)>0.000001){
        unit.value=String(line.unit);notice("Inserisci un prezzo unitario valido con al massimo due decimali.");return;
      }
      line.unit=cents(val)/100;notice("");updateTotals();
    });
    unitLabel.append(unit);row.append(unitLabel);
    const remove=node("button","","×");remove.type="button";remove.setAttribute("aria-label","Rimuovi "+w.name);
    remove.addEventListener("click",()=>{lines=lines.filter(l=>l!==line);updateLines();});
    row.append(remove);root.append(row);
  }
  updateTotals();
}
function addWeapon(id,amount){
  const w=ACTIVE_WEAPONS.find(x=>x.id===id),qty=Number(amount);
  if(!w||!Number.isInteger(qty)||qty<1||qty>999){notice("Seleziona un modello e una quantità da 1 a 999.");return;}
  const current=lines.find(x=>x.id===id);
  if(current&&current.qty+qty>9999){notice("Il massimo è 9999 armi per modello.");return;}
  if(!current&&lines.length>=22){notice("Massimo 22 modelli per ordine.");return;}
  if(current)current.qty+=qty;else lines.push({id,qty,unit:w.buy});
  notice("");updateLines();
}
function makeId(){
  const t=new Date().toISOString().slice(0,10).replace(/-/g,"");
  const rnd=typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID().slice(0,6).toUpperCase():Math.random().toString(36).slice(2,8).toUpperCase();
  return "VA-"+t+"-"+rnd;
}
function render(){
  const root=$("orderList");root.replaceChildren();
  const received=orders.filter(r=>r.status==="Ricevuto");
  if(ARCHIVE_VIEW){
    $("statNew").textContent=received.length;
    $("statProgress").textContent=received.reduce((total,r)=>total+r.lines.reduce((sum,l)=>sum+l.qty,0),0);
    const estimates=received.map(finance);
    $("statDone").textContent=estimates.some(f=>f===null)?"—":money(estimates.reduce((total,f)=>total+f.profit,0)/100);
  }else{
    $("statNew").textContent=orders.filter(r=>r.status==="Da valutare").length;
    $("statProgress").textContent=orders.filter(r=>r.status==="Confermato"||r.status==="In corso").length;
    $("statDone").textContent=received.length;
  }
  const q=norm($("filterOrders").value.trim()),s=$("filterStatus").value;
  const matches=orders.filter(r=>visibleOrder(r)&&(!s||r.status===s)&&(!q||norm([r.id,r.supplier,r.type,r.notes,r.lines.map(l=>WEAPONS.find(w=>w.id===l.id)?.name||"").join(" ")].join(" ")).includes(q)));
  matches.sort((a,b)=>b.created.localeCompare(a.created));
  if(!matches.length){root.append(node("div","order-empty",orders.some(visibleOrder)?"Nessun ordine corrisponde alla ricerca.":ARCHIVE_VIEW?"L'archivio è vuoto: gli ordini impostati su Ricevuto compariranno qui automaticamente.":"Non ci sono ordini attivi. Quelli ricevuti si trovano nell'Archivio."));return}
  for(const r of matches){
    const card=node("article","order-card"),head=node("div","order-card-head"),title=node("div","");
    title.append(node("small","",r.id+" · "+formatDate(r.created)));
    title.append(node("h3","",r.supplier));
    const meta=node("div","order-card-meta");
    meta.append(node("span","",r.type));
    meta.append(node("span","",r.lines.reduce((tot,l)=>tot+l.qty,0)+" armi"));
    if(r.edited_at)meta.append(node("span","","Ultima modifica: "+formatDate(r.edited_at)));
    title.append(meta);
    const state=node("span","order-status",r.status);head.append(title,state);card.append(head);
    const items=node("div","order-card-items");
    for(const l of r.lines){const w=WEAPONS.find(x=>x.id===l.id);if(w)items.append(node("span","",l.qty+" × "+w.name));}
    card.append(items);
    if(r.notes)card.append(node("p","order-card-notes",r.notes));
    const fin=finance(r),breakdown=node("div","order-card-finance");
    const metric=(label,value,cls="")=>{const v=node("div",cls);v.append(node("small","",label),node("strong","",value));return v;};
    breakdown.append(metric("Acquisto armi",money(r.price)),metric("Spese aggiuntive",money(r.expenses||0)));
    breakdown.append(metric("Ricavo previsto al blip",fin?toMoney(fin.revenue):"Non disponibile"),
      metric("PROFITTO NETTO PREVISTO",fin?toMoney(fin.profit):"Non disponibile","order-profit"+(fin?.profit<0?" negative":"")));
    breakdown.append(node("small","order-card-finance-note",fin?
      "Profitto = ricavo delle armi esportabili − acquisto − spese extra. Stima alle tariffe blip correnti: presuppone tutte le armi almeno al 90% e riparazioni possibili.":
      "Profitto non calcolabile: uno o più modelli non hanno una tariffa di esportazione approvata."));
    card.append(breakdown);
    const bottom=node("div","order-card-bottom");
    const cost=node("div","order-card-cost");cost.append(node("span","","Spesa di acquisto concordata"),node("strong","",money(r.price)));bottom.append(cost);
    const actions=node("div","");
    const select=node("select","","");select.setAttribute("aria-label","Stato ordine "+r.id);
    for(const opt of STATES){const el=node("option","",opt);el.value=opt;el.selected=opt===r.status;select.append(el);}
    select.addEventListener("change",async()=>{
      const before=r.status,next=select.value;if(before===next)return;
      select.disabled=true;
      try{
        await changeOrder({...r,status:next});
        if(window.VAUCLAIR_NOTIFY)window.VAUCLAIR_NOTIFY("Stato ordine aggiornato",r.supplier+" · "+before+" → "+next,r.id);
      }catch(e){syncInfo("Impossibile modificare lo stato: "+e.message,true);select.value=before;await refreshShared();}
      finally{select.disabled=false;}
    });
    const copy=node("button","","Copia");copy.type="button";copy.addEventListener("click",async()=>{
      const msg=["VAUCLAIR ARMURERIE — ORDINE "+r.id,"Fornitore: "+r.supplier,"Tipo: "+r.type,
        ...r.lines.map(l=>{const w=WEAPONS.find(x=>x.id===l.id);return "• "+l.qty+" × "+(w?.name||"Arma")+" ("+money(l.unit)+" cad. indicativi)";}),
        "Costo armi concordato: "+money(r.price),"Spese aggiuntive: "+money(r.expenses||0),...(finance(r)?["Ricavo esportazione previsto: "+toMoney(finance(r).revenue),"Profitto netto previsto: "+toMoney(finance(r).profit)]:[]),"Stato: "+r.status,r.notes?"Note: "+r.notes:null].filter(Boolean).join("\n");
      try{await navigator.clipboard.writeText(msg);copy.textContent="Copiato ✓";}
      catch(_){window.prompt("Copia il riepilogo dell'ordine:",msg);}
    });
    const edit=node("button","","Modifica ordine");edit.type="button";
    edit.addEventListener("click",()=>beginEditOrder(r));
    const remove=node("button","","Elimina");remove.type="button";
    remove.addEventListener("click",async()=>{
      if(!confirm("Eliminare l'ordine "+r.id+"? Sarà rimosso anche per Vivian e non recuperabile senza backup."))return;
      remove.disabled=true;
      try{await eraseOrder(r);}
      catch(e){syncInfo("Eliminazione non riuscita: "+e.message,true);await refreshShared();}
      finally{remove.disabled=false;}
    });
    actions.append(select,edit,copy,remove);bottom.append(actions);card.append(bottom);root.append(card);
  }
}
function downloadBackup(){
  const data=JSON.stringify({version:1,created:new Date().toISOString(),orders},null,2);
  const blob=new Blob([data],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=node("a");
  a.href=url;a.download="vauclair-armurerie-ordini-"+new Date().toISOString().slice(0,10)+".json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function startSimulationDraft(){
  const key="vauclair.armurerie.simulation-order.v1";
  try{
    const decoded=JSON.parse(sessionStorage.getItem(key)||"null");
    // Compatible with the old array-only draft and the new amount for internal grease costs.
    const draft=Array.isArray(decoded)?decoded:decoded?.lines;
    const extra=Array.isArray(decoded)?0:Number(decoded?.expenses??0);
    if(!Array.isArray(draft)||!draft.length||draft.length>11||!draft.every(l=>validLine(l)&&l.qty<=999&&ACTIVE_WEAPONS.some(w=>w.id===l.id))||new Set(draft.map(l=>l.id)).size!==draft.length||
       !Number.isFinite(extra)||extra<0||extra>10000000)return false;
    lines=draft.map(l=>({id:l.id,qty:l.qty,unit:Math.round(l.unit*100)/100}));
    priceEdited=false;updateLines();
    $("orderExpenses").value=String(Math.round(extra*100)/100);
    showPreview();openPanel();
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(DRAFT);
    notice("Fornitura dal simulatore: prezzi delle armi separati dalla spesa per i grassi. Verifica costi e fornitore prima di salvare l'ordine condiviso.");
    return true;
  }catch(_){return false;}
}
function startDraft(){
  try{
    const draft=JSON.parse(sessionStorage.getItem(DRAFT)||"null");
    sessionStorage.removeItem(DRAFT);
    if(!Array.isArray(draft)||!draft.length)return;
    for(const l of draft){
      if(ACTIVE_WEAPONS.some(w=>w.id===l.id)&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<=999) addWeapon(l.id,l.qty);
    }
    if(lines.length)openPanel();
  }catch(_){}
}
function init(){
  const sel=$("weaponChoice");
  if(!sel)return;
  for(const w of ACTIVE_WEAPONS){const opt=node("option","",w.name);opt.value=w.id;sel.append(opt);}
  $("newOrder").addEventListener("click",startNewOrder);
  $("cancelOrder").addEventListener("click",closePanel);
  $("addWeapon").addEventListener("click",()=>addWeapon(sel.value,$("weaponQuantity").value));
  $("agreedPrice").addEventListener("input",()=>{priceEdited=true;showPreview();});
  $("useEstimatedPrice").addEventListener("click",()=>{priceEdited=false;updateTotals();notice("Prezzo totale aggiornato dalla somma delle righe.");});
  $("orderExpenses").addEventListener("input",showPreview);
  $("filterOrders").addEventListener("input",render);
  $("filterStatus").addEventListener("change",render);
  $("exportData").addEventListener("click",downloadBackup);
  $("refreshOrders").addEventListener("click",()=>void refreshShared());
  $("orderRetry").addEventListener("click",()=>void checkAccess());
  $("orderForm").addEventListener("submit",async ev=>{
    ev.preventDefault();
    if(!ev.currentTarget.reportValidity()||!approved)return;
    const supplier=$("supplier").value.trim(),price=Number($("agreedPrice").value),
      extra=Number($("orderExpenses").value),type=$("supplierType").value;
    if(!supplier||!lines.length||!Number.isFinite(price)||price<0||price>10000000||
       !Number.isFinite(extra)||extra<0||extra>10000000){notice("Inserisci fornitore, almeno un'arma e importi validi.");return;}
    if(!lines.every(validLine)||new Set(lines.map(l=>l.id)).size!==lines.length){notice("Controlla quantità e prezzi delle armi.");return;}
    const wasEditing=!!editingRecord;
    const record=wasEditing?
      {...editingRecord,supplier,type,status:$("initialStatus").value,price:cents(price)/100,expenses:cents(extra)/100,
       lines:lines.map(l=>({...l})),notes:$("orderNotes").value.trim(),edited_at:new Date().toISOString()}:
      {id:makeId(),supplier,type,status:$("initialStatus").value,price:cents(price)/100,expenses:cents(extra)/100,
       lines:lines.map(l=>({...l})),notes:$("orderNotes").value.trim(),created:new Date().toISOString()};
    if(!validOrder(record)){notice("Controlla i dati dell'ordine.");return;}
    const btn=$("saveOrderButton");btn.disabled=true;
    notice(wasEditing?"Aggiornamento dell'ordine condiviso…":"Salvataggio nel registro condiviso…");
    try{
      if(wasEditing)await changeOrder(record);
      else await writeOrder(record);
      if(window.VAUCLAIR_NOTIFY){
        const count=record.lines.reduce((sum,l)=>sum+l.qty,0);
        window.VAUCLAIR_NOTIFY(wasEditing?"Ordine modificato":"Nuovo ordine condiviso",record.supplier+" · "+count+" armi · "+money(record.price),record.id);
      }
      closePanel();
      if(wasEditing&&!visibleOrder(record))syncInfo("Modifica salvata. L'ordine ora si trova in "+(record.status==="Ricevuto"?"Archivio.":"Ordini attivi."));
      $("orderList").scrollIntoView({behavior:"smooth",block:"start"});
    }catch(e){
      notice("Salvataggio non riuscito: "+(e?.message||"errore di rete")+". I dati non sono stati cancellati: controlla l'ordine e riprova.");
      syncInfo("Impossibile aggiornare l'ordine: "+(e?.message||"errore di rete"),true);
    }finally{btn.disabled=false;}
  });
  // Opening Archivio never consumes a draft that belongs to the active Orders form.
  if(!ARCHIVE_VIEW){
    updateLines();if(!startSimulationDraft())startDraft();
    if(window.location.hash==="#nuovo"&&!lines.length)openPanel();
  }
  if(!window.supabase||typeof window.supabase.createClient!=="function"){
    lock("Non riesco a caricare Supabase. Controlla la connessione e riprova.");return;
  }
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange(event=>{
    if(["SIGNED_IN","SIGNED_OUT","INITIAL_SESSION","USER_UPDATED"].includes(event))queueMicrotask(()=>void checkAccess());
  });
  window.addEventListener("focus",()=>{if(approved)void refreshShared();else void checkAccess();});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&approved)void refreshShared();});
  setInterval(()=>{if(approved&&!document.hidden)void refreshShared();},20000);
  void checkAccess();
}
init();
})();

