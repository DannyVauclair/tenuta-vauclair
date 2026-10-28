/* Private simulator: receives approved data only after existing auth/RLS checks. */
(()=>{
"use strict";
const M=window.VauclairMath,$=id=>document.getElementById(id);
const retail={a1:80,a2:90,a3:95,a4:120,a5:140,a9:125,a10:145,a15:100,a16:140,a17:240,a18:245};
const money=c=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"USD",currencyDisplay:"narrowSymbol"}).format(c/100);
const pct=x=>x===null?"—":new Intl.NumberFormat("it-IT",{maximumFractionDigits:2}).format(x)+"%";
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||"";if(text!==undefined)n.textContent=text;return n;};
function formatUnitIndices(indices){
 const parts=[];let start=indices[0],end=start;
 for(let i=1;i<=indices.length;i++){
  if(indices[i]===end+1){end=indices[i];continue;}
  parts.push(start===end?String(start):start+"–"+end);
  start=end=indices[i];
 }
 return parts.join(", ");
}
function renderAdvice(advice){
 const container=$("simAdviceList");container.replaceChildren();
 $("simAdviceCount").textContent=advice.accept+" da accettare · "+advice.review+" da verificare · "+advice.reject+" da evitare";
 if(!advice.total){container.append(el("p","sim-advice-empty","Seleziona le armi per vedere quali conviene acquistare."));return;}
 const labels={accept:"ACCETTA",review:"DA VERIFICARE",reject:"NON ACCETTARE"};
 for(const status of ["accept","review","reject"]){
  const groups=advice.groups.filter(g=>g.status===status);
  if(!groups.length)continue;
  const section=el("section","sim-advice-group sim-advice-"+status);
  section.append(el("h4","",labels[status]+" · "+advice[status]));
  for(const g of groups){
   const item=el("div","sim-advice-item");
   item.append(el("strong","",g.indices.length+" × "+g.model));
   if(g.indices.length<g.modelQty)item.append(el("small","sim-advice-indices","Esemplari n. "+formatUnitIndices(g.indices)));
   let detail="";
   switch(g.reason){
    case "ready": detail="Già al 90% o più. Margine per queste armi: +"+money(g.margin)+".";break;
    case "repairable":detail="Riparabili al 90% con "+g.greases+" grassi prudenziali ($"+(g.greases*8)+"). Margine dopo manutenzione: +"+money(g.margin)+".";break;
    case "grease-shortage":detail="Al 15% sono recuperabili, ma i grassi selezionati sono insufficienti: servirebbero "+g.greases+" grassi per questi esemplari. Non confermare senza integrarli.";break;
    case "uncertain":detail="Non garantite al 15% entro le 5 riparazioni. Possibili solo con risultati più favorevoli, fino al 20%.";break;
    case "unrecoverable":detail="Non raggiungono il 90% neppure con il 20% per grasso e le riparazioni rimaste.";break;
    case "unprofitable":detail="Il prezzo d'acquisto e i grassi necessari eliminano il margine: "+money(g.margin)+" per questi esemplari. Rinegoziare prima di acquistare.";break;
   }
   item.append(el("small","",detail));section.append(item);
  }
  container.append(section);
 }
}
let data=[],quantities=null,prices=new Map(),conditions=new Map(),priorRepairs=new Map(),unitStates=new Map(),greaseManual=null,onQuantity=()=>{},views=new Map(),requested=null,goalValue=0,roiValue=0;
function rows(){return data.filter(w=>quantities?.get(w.id)>0).map(w=>({...w,qty:quantities.get(w.id),price:prices.get(w.id)??w.standard,condition:conditions.get(w.id)??100,repaired:priorRepairs.get(w.id)??0,units:unitStates.get(w.id)||new Map()}));}
function setUnit(id,index,condition,repaired){
 const qty=quantities?.get(id)||0;
 if(!Number.isInteger(index)||index<0||index>=qty||!Number.isInteger(condition)||condition<0||condition>100||!Number.isInteger(repaired)||repaired<0||repaired>5)return;
 let overrides=unitStates.get(id);
 if(!overrides){overrides=new Map();unitStates.set(id,overrides);}
 if(condition===(conditions.get(id)??100)&&repaired===(priorRepairs.get(id)??0))overrides.delete(index);
 else overrides.set(index,{condition,repaired});
 if(!overrides.size)unitStates.delete(id);
 update();
}
function button(text,fn){const b=el("button","order-subtle",text);b.type="button";b.onclick=fn;return b;}
function input(type,value,min,max,step,label){const i=el("input");Object.assign(i,{type,value,min,max,step});i.setAttribute("aria-label",label);return i;}
function manual(){requested=null;$("simStrategy").textContent="Prezzi personalizzati";}
function update(){
 const rr=rows(),t=M.totals(rr);
 if(!t.count)greaseManual=null;
 const plan=M.repairPlan(rr,Infinity,M.RESTORE_MIN);
 const favorablePlan=M.repairPlan(rr,Infinity,M.RESTORE_MAX);
 const suggested=plan.suggested,greaseCount=t.count?(greaseManual??suggested):0;
 const fin=M.financials(rr,greaseCount,goalValue,roiValue,M.RESTORE_MIN);
 const supplierNet=M.netSupplierOffer(t.cost,greaseCount);
 const advice=M.purchaseAdvice(rr,fin);
 const favorableRaw=M.financials(rr,greaseCount,goalValue,roiValue,M.RESTORE_MAX);
 // With a 20% yield we can always follow the conservative gun allocation and
 // obtain AT LEAST its revenue; changing the greedy order must not lower the best case.
 const favorable=favorableRaw.revenue>=fin.revenue?favorableRaw:{...favorableRaw,
   revenue:fin.revenue,profit:fin.profit,exportable:fin.exportable};
 const maximum=fin.maxPurchase;
 const metrics={
  simCount:t.count,simEligible:fin.exportable,simImpossible:fin.impossible,simUncovered:fin.uncovered,
  simCost:money(t.cost),simNetOffer:t.count?money(supplierNet.amount):"—",simGreaseTotal:greaseCount,
  simRepairCost:money(fin.repair),simTotalCost:money(fin.totalCost),
  simRevenue:money(fin.revenue),simProfit:money(fin.profit),
  simReturn:pct(fin.roi),simMargin:pct(fin.margin),
  simSaving:money(t.retail-t.cost),
  simEligibleOptimistic:favorable.exportable,
  simRevenueOptimistic:money(favorable.revenue),
  simProfitOptimistic:money(favorable.profit),
  simMaximum:t.count?money(maximum):"—",
  simRoom:t.count?money(maximum-t.cost):"—"
 };
 for(const [id,value] of Object.entries(metrics))$(id).textContent=value;
 renderAdvice(advice);
 $("simNetOfferHelp").textContent=!t.count?"Il valore tra parentesi è una proposta per la trattativa, non un pagamento registrato.":
  supplierNet.uncovered?"Il costo dei grassi supera il prezzo d'acquisto: l'offerta indicativa è limitata a $0 e restano "+money(supplierNet.uncovered)+" di manutenzione non compensabili con uno sconto. Nessuna offerta viene modificata automaticamente.":
  "Proposta di trattativa: "+money(t.cost)+" per le armi − "+money(supplierNet.repair)+" per i "+greaseCount+" grassi selezionati. Non cambia l'offerta concordata, i profitti né gli ordini finché non modifichi manualmente i prezzi.";
 $("simProfit").classList.toggle("sim-loss",fin.profit<0);
 $("simBudget").max=(t.retail/100).toFixed(2);
 $("simBudgetNumber").max=(t.retail/100).toFixed(2);
 if(document.activeElement!==$("simBudget"))$("simBudget").value=((requested??t.cost)/100).toFixed(2);
 if(document.activeElement!==$("simBudgetNumber"))$("simBudgetNumber").value=((requested??t.cost)/100).toFixed(2);
 $("simResidual").textContent=requested===null?"Offerta effettiva: "+money(t.cost):"Budget richiesto: "+money(requested)+" · Offerta effettiva: "+money(t.cost)+" · Residuo non distribuito: "+money(requested-t.cost);
 $("simBudget").disabled=$("simBudgetNumber").disabled=!t.count;
 $("simGreaseCount").disabled=$("simGreaseAuto").disabled=!t.count;
 if(document.activeElement!==$("simGreaseCount"))$("simGreaseCount").value=greaseCount;
 $("simGreaseSuggest").textContent=String(suggested);
 $("simGreaseSuggestOptimistic").textContent=String(favorablePlan.suggested);
 const isShort=fin.uncovered>0,blocked=fin.impossible>0;
 $("simGreaseStatus").classList.toggle("sim-repair-short",isShort||blocked);
 const notices=[];
 if(blocked){
   const favorableOnly=fin.impossible-favorablePlan.impossible;
   if(favorableOnly)notices.push(favorableOnly+" arm"+(favorableOnly===1?"a potrebbe":"i potrebbero")+" raggiungere il 90% soltanto con riparazioni più favorevoli del 15%: il risultato non è garantito.");
   if(favorablePlan.impossible)notices.push(favorablePlan.impossible+" arm"+(favorablePlan.impossible===1?"a non può":"i non possono")+" raggiungere il 90% neppure ottenendo il 20% per grasso entro il limite di cinque riparazioni.");
 }
 if(isShort)notices.push(fin.uncovered+" arm"+(fin.uncovered===1?"a esclusa":"i escluse")+" dalla proiezione prudenziale per grassi insufficienti. Servirebbero "+Math.max(0,suggested-greaseCount)+" grassi in più per coprire le armi recuperabili con il 15%.");
 if(greaseManual!==null&&greaseCount>fin.used)notices.push((greaseCount-fin.used)+" grassi non assegnati a riparazioni che garantiscono il 90% nello scenario prudente; il loro costo è comunque incluso e potrebbero servire in uno scenario favorevole.");
 if(!notices.length)notices.push(!t.count?"Aggiungi almeno un'arma per simulare le riparazioni.":"La proiezione prudente raggiunge il 90% contando soltanto il 15% per applicazione e al massimo cinque riparazioni per arma.");
 $("simGreaseStatus").textContent=notices.join(" ");
 const goalText=!t.count?"Aggiungi almeno un’arma per valutare l’obiettivo.":
  maximum<0?"Obiettivo irraggiungibile anche con un acquisto gratuito: ricavo esportabile e spese di manutenzione non lo consentono.":
  fin.totalCost===0&&roiValue>0?"Il rendimento percentuale non è definito con una spesa totale pari a zero.":
  t.cost<=maximum?"Obiettivi rispettati nella proiezione prudenziale (15% per grasso). Puoi aumentare l'offerta alle armerie fino al limite indicato.":
  "Obiettivi non raggiunti: riduci la spesa per le armi di almeno "+money(t.cost-maximum)+".";
 $("simGoalStatus").textContent=goalText+(blocked||isShort?" Le armi non garantite al 90% non producono ricavi nello scenario prudente.":"");
 $("simWarning").textContent=t.count&&(maximum<t.standard||rr.some(r=>r.price<r.standard))?
 "Attenzione: un'offerta sotto il listino Vauclair potrebbe essere poco interessante per il fornitore. Le riparazioni non riducono il prezzo concordato per le armi.":
 "La disponibilità del fornitore ad accettare il prezzo va comunque negoziata.";
 $("simTransfer").disabled=!t.count;
 for(const r of rr){
  const v=views.get(r.id);if(!v)continue;
  v.profit.textContent=money(r.qty*(r.export-r.price));
  v.total.textContent=money(r.qty*r.price);
  v.range.max=Math.max(r.retail,r.price)/100;
  if(document.activeElement!==v.range)v.range.value=r.price/100;
  if(document.activeElement!==v.exact)v.exact.value=(r.price/100).toFixed(2);
  v.warning.textContent=r.price<r.standard?"Offerta inferiore al listino Vauclair":r.price>r.retail?"Offerta superiore al prezzo pieno":"";
  const local=M.repairPlan([r],Infinity,M.RESTORE_MIN),favLocal=M.repairPlan([r],Infinity,M.RESTORE_MAX);
  const modelNet=M.netSupplierOffer(r.qty*r.price,local.suggested);
  v.netOffer.textContent=local.impossible===r.qty?
    "Nessuna arma garantita recuperabile: offerta netta non stimabile solo dai grassi.":
    "(Detraendo "+local.suggested+" grassi prudenziali, "+money(modelNet.repair)+": "+money(modelNet.amount)+" totali"+(r.qty>1?", media "+money(modelNet.amount/r.qty)+" per arma":"")+")"+
    (modelNet.uncovered?" · La riparazione supera l'offerta di "+money(modelNet.uncovered)+".":"")+
    (local.impossible?" · "+local.impossible+" armi non garantite: da valutare a parte.":"");
  v.netTotal.textContent=local.impossible===r.qty?
    "(nessuna stima netta per armi non recuperabili)":
    "(al netto dei grassi: "+money(modelNet.amount)+")";
  const common=M.repairStatus(r.condition,r.repaired,M.RESTORE_MIN);
  const bestCommon=M.repairStatus(r.condition,r.repaired,M.RESTORE_MAX);
  v.conditionHint.textContent="Riparazioni rimaste: "+common.remaining+"/5 · "+(common.alreadyReady?"Già esportabile al 90%.":common.possible?"Grassi per arma: "+common.needed+" al 15% prudente, "+bestCommon.needed+" al 20% favorevole.":bestCommon.possible?"Non garantita al 15%; possibile con "+bestCommon.needed+" grassi favorevoli al 20%.":"Non recuperabile neppure con "+common.remaining+" grassi al 20%.");
  v.historyHint.textContent="Grassi prudenziali: "+local.suggested+" · nello scenario favorevole: "+favLocal.suggested+" · riparazioni ancora disponibili: "+local.capacity;
  v.unitSummary.textContent="Dettaglio singoli esemplari ("+r.qty+")"+(r.units.size?" · "+r.units.size+" personalizzati":"");
  const favorableOnly=local.impossible-favLocal.impossible;
  v.lineStatus.textContent=local.impossible?local.impossible+" armi non garantite al 15%"+(favorableOnly?" (di cui "+favorableOnly+" potenzialmente recuperabili con risultati migliori)":"")+".":"Tutte le armi di questo modello possono raggiungere il 90% nello scenario prudente.";
  v.lineStatus.classList.toggle("sim-repair-short",local.impossible>0);
 }
}
function render(){
 if(!quantities)return;
 requested=null;
 const root=$("simLines");root.replaceChildren();views.clear();
 for(const r of rows()){
  const card=el("article","sim-line"),head=el("div","sim-line-head");
  head.append(el("h3","",r.name),button("Rimuovi",()=>{quantities.delete(r.id);unitStates.delete(r.id);manual();onQuantity();}));
  const refs=el("p","sim-reference","Listino Vauclair "+money(r.standard)+" · Prezzo pieno "+money(r.retail)+" · Esportazione "+money(r.export));
  const qty=input("number",r.qty,0,999,1,"Quantità "+r.name);
  const qbox=el("label","sim-quantity","Quantità ");
  const change=n=>{if(!Number.isInteger(n)||n<0||n>999){qty.setCustomValidity("Quantità intera da 0 a 999");qty.reportValidity();return;}qty.setCustomValidity("");
  if(n)quantities.set(r.id,n);else{quantities.delete(r.id);unitStates.delete(r.id);}
  const overrides=unitStates.get(r.id);
  if(overrides){for(const i of overrides.keys())if(i>=n)overrides.delete(i);if(!overrides.size)unitStates.delete(r.id);}
  manual();onQuantity();};
  qty.onchange=()=>change(Number(qty.value));
  qbox.append(button("−",()=>change(r.qty-1)),qty,button("+",()=>change(Math.min(999,r.qty+1))));
  const range=input("range",r.price/100,0,Math.max(r.retail,r.price)/100,.01,"Prezzo offerto "+r.name);
  const exact=input("number",(r.price/100).toFixed(2),0,100000,.01,"Prezzo unitario esatto "+r.name);
  const offer=el("label","sim-offer","Offerta per arma ($)");const netOffer=el("small","sim-net-offer");offer.append(range,exact,netOffer);
  const set=i=>{if(i.value===""||!i.checkValidity())return;prices.set(r.id,M.cents(i.value));manual();update();};
  range.oninput=()=>set(range);exact.oninput=()=>set(exact);
  exact.onchange=()=>{if(!exact.checkValidity()||exact.value===""){exact.value=((prices.get(r.id)??r.standard)/100).toFixed(2);}update();};
  const condition=input("number",r.condition,0,100,1,"Condizione comune (%) "+r.name);
  const conditionBox=el("label","sim-condition","Condizione iniziale comune delle armi (%)");
  const conditionHint=el("small","sim-reference");
  conditionBox.append(condition,conditionHint);
  condition.oninput=()=>{if(condition.value!==""&&condition.checkValidity()&&Number.isInteger(Number(condition.value))){conditions.set(r.id,Number(condition.value));update();if(unitDetails.open)renderUnitPage();}};
  condition.onchange=()=>{if(condition.value===""||!condition.checkValidity()||!Number.isInteger(Number(condition.value)))condition.value=conditions.get(r.id)??100;update();};
  const history=input("number",r.repaired,0,5,1,"Riparazioni già effettuate per arma "+r.name);
  const historyBox=el("label","sim-history","Riparazioni già effettuate (comune, da 0 a 5)");
  const historyHint=el("small","sim-reference");
  historyBox.append(history,historyHint);
  history.oninput=()=>{if(history.value!==""&&history.checkValidity()&&Number.isInteger(Number(history.value))){priorRepairs.set(r.id,Number(history.value));update();if(unitDetails.open)renderUnitPage();}};
  history.onchange=()=>{if(history.value===""||!history.checkValidity()||!Number.isInteger(Number(history.value)))history.value=priorRepairs.get(r.id)??0;update();};
  const lineStatus=el("p","sim-unit-status");
  const unitDetails=el("details","sim-units");
  const unitSummary=el("summary","","Dettaglio singoli esemplari ("+r.qty+")");
  const unitBody=el("div","sim-units-inner");
  unitDetails.append(unitSummary,unitBody);
  let page=0;
  const pageSize=20;
  function renderUnitPage(){
    const current=rows().find(x=>x.id===r.id);
    if(!current)return;
    const count=current.qty,numberOfPages=Math.ceil(count/pageSize);
    page=Math.min(page,numberOfPages-1);
    unitBody.replaceChildren();
    unitBody.append(el("p","sim-reference","Modifica la condizione e le riparazioni precedenti di ciascuna arma. Le impostazioni comuni si applicano alle armi senza personalizzazioni."));
    for(let i=page*pageSize;i<Math.min(count,(page+1)*pageSize);i++){
      const overridden=unitStates.get(r.id)?.get(i);
      const initial=overridden?.condition??conditions.get(r.id)??100;
      const repaired=overridden?.repaired??priorRepairs.get(r.id)??0;
      const line=el("div","sim-unit");
      const label=el("strong","sim-unit-name","Arma n. "+(i+1));
      const cField=input("number",initial,0,100,1,"Condizione arma "+(i+1)+" "+r.name);
      const rField=input("number",repaired,0,5,1,"Riparazioni pregresse arma "+(i+1)+" "+r.name);
      const cLabel=el("label","","Condizione (%)"),rLabel=el("label","","Riparazioni precedenti");
      const hint=el("small","sim-unit-state");
      const refresh=()=>{
        const check=M.repairStatus(Number(cField.value),Number(rField.value),M.RESTORE_MIN);
        const best=M.repairStatus(Number(cField.value),Number(rField.value),M.RESTORE_MAX);
        hint.textContent=check.alreadyReady?"Esportabile ora · "+check.remaining+" riparazioni rimaste":check.possible?"Al 90%: "+check.needed+" grassi prudenziali / "+best.needed+" favorevoli · "+check.remaining+" usi rimasti":best.possible?"NON GARANTITA: possibile solo con "+best.needed+" grassi favorevoli · "+check.remaining+" usi rimasti":"Non recuperabile nemmeno al 20% (limite riparazioni)";

        hint.classList.toggle("sim-repair-short",!check.possible);
      };
      const change=()=>{
        if(cField.value===""||rField.value===""||!cField.checkValidity()||!rField.checkValidity()||!Number.isInteger(Number(cField.value))||!Number.isInteger(Number(rField.value)))return;
        setUnit(r.id,i,Number(cField.value),Number(rField.value));refresh();
      };
      cField.oninput=change;rField.oninput=change;
      cField.onchange=()=>{if(!cField.checkValidity()||cField.value==="")cField.value=unitStates.get(r.id)?.get(i)?.condition??conditions.get(r.id)??100;refresh();};
      rField.onchange=()=>{if(!rField.checkValidity()||rField.value==="")rField.value=unitStates.get(r.id)?.get(i)?.repaired??priorRepairs.get(r.id)??0;refresh();};
      cLabel.append(cField);rLabel.append(rField);line.append(label,cLabel,rLabel,hint);
      unitBody.append(line);refresh();
    }
    const controls=el("div","sim-unit-nav"),prev=button("← Precedenti",()=>{page--;renderUnitPage();}),next=button("Successive →",()=>{page++;renderUnitPage();});
    prev.disabled=page===0;next.disabled=page>=numberOfPages-1;
    controls.append(prev,el("span","","Armi "+(page*pageSize+1)+"–"+Math.min(count,(page+1)*pageSize)+" di "+count),next);
    unitBody.append(controls);
    const reset=button("Annulla le personalizzazioni di questo modello",()=>{unitStates.delete(r.id);renderUnitPage();update();});
    reset.disabled=!(unitStates.get(r.id)?.size);
    unitBody.append(reset);
  }
  unitDetails.addEventListener("toggle",()=>{if(unitDetails.open)renderUnitPage();});
  const summary=el("div","sim-line-bottom"),total=el("strong"),gain=el("strong"),warning=el("small","sim-warning");
  const c=el("span","","Acquisto modello "),netTotal=el("small","sim-net-total");c.append(total,netTotal);const g=el("span","","Profitto prima dei grassi ");g.append(gain);summary.append(c,g);
  card.append(head,refs,qbox,offer,conditionBox,historyBox,lineStatus,unitDetails,summary,warning);
  root.append(card);views.set(r.id,{range,exact,total,netTotal,netOffer,profit:gain,warning,conditionHint,historyHint,lineStatus,unitSummary});
 }
 if(!rows().length)root.append(el("p","empty","Aggiungi armi alla fornitura: puoi scegliere i modelli qui sopra oppure dal catalogo."));
 update();
}
window.VauclairSimulator={
 mount(weapons,q,callback,preserve=false){
  const catalog=window.VAUCLAIR_WEAPONS||[];
  data=weapons.map(w=>{const p=catalog.find(p=>p.id===w.weapon_id&&p.tag==="attuale");if(!p||!retail[p.id])throw Error("Modello non disponibile nel catalogo ufficiale");return {id:p.id,name:p.name,standard:M.cents(p.buy),retail:M.cents(retail[p.id]),export:M.cents(w.blip_price)};});
  quantities=q;onQuantity=callback;if(!preserve){prices.clear();conditions.clear();priorRepairs.clear();unitStates.clear();greaseManual=null;}requested=null;
  const picker=$("simAddModel");picker.replaceChildren();
  for(const w of data){const option=el("option","",w.name);option.value=w.id;picker.append(option);}
  $("simAddButton").disabled=!data.length;
  render();
 },
 render,
 clear(){data=[];quantities=null;prices.clear();conditions.clear();priorRepairs.clear();unitStates.clear();greaseManual=null;views.clear();requested=null;goalValue=roiValue=0;$("simStrategy").textContent="Listino Vauclair";$("simLines").replaceChildren();$("simAddModel").replaceChildren();$("simAddButton").disabled=true;for(const id of ["simCost","simNetOffer","simEligible","simEligibleOptimistic","simImpossible","simUncovered","simGreaseTotal","simRepairCost","simTotalCost","simGreaseSuggest","simGreaseSuggestOptimistic","simGreaseStatus","simRevenue","simRevenueOptimistic","simProfit","simProfitOptimistic","simReturn","simMargin","simSaving","simMaximum","simRoom","simCount","simResidual","simGoalStatus","simWarning"])$(id).textContent="";$("simGoal").value=$("simRoi").value=$("simBudget").value=$("simBudgetNumber").value=$("simGreaseCount").value=0;$("simGreaseAuto").disabled=$("simGreaseCount").disabled=true;$("simNetOfferHelp").textContent="";},
};
$("simAddForm").onsubmit=event=>{
 event.preventDefault();
 if(!quantities)return;
 const id=$("simAddModel").value,qty=Number($("simAddQty").value);
 if(!data.some(w=>w.id===id)||!Number.isInteger(qty)||qty<1||qty>999)return;
 quantities.set(id,Math.min(999,(quantities.get(id)||0)+qty));
 manual();onQuantity();
};
$("simGreaseCount").oninput=()=>{
 if(!quantities||$("simGreaseCount").value===""||!$("simGreaseCount").checkValidity())return;
 const count=Number($("simGreaseCount").value);
 if(!Number.isInteger(count))return;
 greaseManual=count;update();
};
$("simGreaseCount").onchange=()=>{
 if($("simGreaseCount").value===""||!$("simGreaseCount").checkValidity()||!Number.isInteger(Number($("simGreaseCount").value))){
  $("simGreaseCount").value=greaseManual??M.greaseSuggested(rows());update();
 }
};
$("simGreaseAuto").onclick=()=>{greaseManual=null;update();};
document.querySelectorAll("[data-sim-preset]").forEach(b=>b.onclick=()=>{if(!quantities)return;const mode=b.dataset.simPreset;if(mode==="custom"){manual();update();return;}for(const w of data)prices.set(w.id,mode==="standard"?w.standard:Math.round(w.retail*(mode==="full"?1:mode==="five"?.95:.9)));requested=null;$("simStrategy").textContent=b.textContent;render();});
for(const id of ["simGoal","simRoi"]){
 $(id).oninput=()=>{if($(id).value!==""&&$(id).checkValidity()){if(id==="simGoal")goalValue=M.cents($(id).value);else roiValue=Math.round(Number($(id).value)*100);update();}};
 $(id).onchange=()=>{if($(id).value===""||!$(id).checkValidity())$(id).value=((id==="simGoal"?goalValue:roiValue)/100).toFixed(2);update();};
}
function budget(i){if(!quantities||i.value===""||!i.checkValidity())return;const rr=rows(),a=M.allocate(rr,M.cents(i.value));rr.forEach((r,j)=>prices.set(r.id,a.prices[j]));requested=a.budget;$("simStrategy").textContent="Budget proporzionale al listino";update();}
$("simBudget").oninput=()=>budget($("simBudget"));
$("simBudgetNumber").oninput=()=>budget($("simBudgetNumber"));
$("simBudgetNumber").onchange=()=>{if(!$("simBudgetNumber").checkValidity())$("simBudgetNumber").value=(M.totals(rows()).cost/100).toFixed(2);update();};
$("simReset").onclick=()=>{if(!quantities)return;quantities.clear();prices.clear();conditions.clear();priorRepairs.clear();unitStates.clear();greaseManual=null;requested=null;goalValue=roiValue=0;$("simGoal").value=$("simRoi").value=0;$("simStrategy").textContent="Listino Vauclair";onQuantity();};
$("simTransfer").onclick=()=>{
 const payload=rows().map(r=>({id:r.id,qty:r.qty,unit:r.price/100}));
 if(!payload.length)return;
 if(M.totals(rows()).cost>1000000000){$("simGoalStatus").textContent="L’ordine supera il limite del registro ($10.000.000). Dividi la fornitura prima del trasferimento.";return;}
 try{
  const selected=greaseManual??M.greaseSuggested(rows());
  const extra=M.financials(rows(),selected).repair/100;
  sessionStorage.setItem("vauclair.armurerie.simulation-order.v1",JSON.stringify({lines:payload,expenses:extra,greaseCount:selected}));
  location.href="ordini.html?v=20261023-shared1#nuovo";
 }
 catch(e){$("simGoalStatus").textContent="Il browser non consente il trasferimento della bozza. Nessun ordine è stato modificato.";}
};
})();

