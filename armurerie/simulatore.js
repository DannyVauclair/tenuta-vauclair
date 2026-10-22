/* Private simulator: receives approved data only after existing auth/RLS checks. */
(()=>{
"use strict";
const M=window.VauclairMath,$=id=>document.getElementById(id);
const retail={a1:80,a2:90,a3:95,a4:120,a5:140,a9:125,a10:145,a15:100,a16:140,a17:240,a18:245};
const money=c=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"USD",currencyDisplay:"narrowSymbol"}).format(c/100);
const pct=x=>x===null?"—":new Intl.NumberFormat("it-IT",{maximumFractionDigits:2}).format(x)+"%";
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||"";if(text!==undefined)n.textContent=text;return n;};
let data=[],quantities=null,prices=new Map(),onQuantity=()=>{},views=new Map(),requested=null,goalValue=0,roiValue=0;
function rows(){return data.filter(w=>quantities?.get(w.id)>0).map(w=>({...w,qty:quantities.get(w.id),price:prices.get(w.id)??w.standard}));}
function button(text,fn){const b=el("button","order-subtle",text);b.type="button";b.onclick=fn;return b;}
function input(type,value,min,max,step,label){const i=el("input");Object.assign(i,{type,value,min,max,step});i.setAttribute("aria-label",label);return i;}
function manual(){requested=null;$("simStrategy").textContent="Prezzi personalizzati";}
function update(){
 const rr=rows(),t=M.totals(rr),profit=t.revenue-t.cost;
 const goal=goalValue,roi=roiValue;
 const maximum=M.target(t.revenue,goal,roi);
 for(const [id,value] of Object.entries({simCount:t.count,simCost:money(t.cost),simRevenue:money(t.revenue),simProfit:money(profit),simReturn:pct(t.cost?profit/t.cost*100:null),simMargin:pct(t.revenue?profit/t.revenue*100:null),simSaving:money(t.retail-t.cost),simMaximum:t.count?money(maximum):"—",simRoom:t.count?money(maximum-t.cost):"—"}))$(id).textContent=value;
 $("simProfit").classList.toggle("sim-loss",profit<0);
 $("simBudget").max=(t.retail/100).toFixed(2);$("simBudgetNumber").max=(t.retail/100).toFixed(2);
 if(document.activeElement!==$("simBudget"))$("simBudget").value=((requested??t.cost)/100).toFixed(2);
 if(document.activeElement!==$("simBudgetNumber"))$("simBudgetNumber").value=((requested??t.cost)/100).toFixed(2);
 $("simResidual").textContent=requested===null?"Offerta effettiva: "+money(t.cost):"Budget richiesto: "+money(requested)+" · Offerta effettiva: "+money(t.cost)+" · Residuo non distribuito: "+money(requested-t.cost);
 $("simGoalStatus").textContent=!t.count?"Aggiungi almeno un’arma per valutare l’obiettivo.":maximum<0?"Obiettivo impossibile: il profitto richiesto supera l’intero ricavo, anche con acquisti a costo zero.":maximum===0?"Obiettivo raggiungibile solo a costo zero: fornitura gratuita, non una trattativa realistica. Il rendimento a spesa zero non è definito.":t.cost===0&&roi>0?"Profitto valutabile, ma il rendimento percentuale non è definito con una spesa pari a zero.":t.cost<=maximum?"Obiettivi rispettati. Puoi aumentare l’offerta complessiva fino al limite indicato.":"Obiettivi non raggiunti con l’offerta attuale: riduci la spesa di almeno "+money(t.cost-maximum)+".";
 $("simWarning").textContent=t.count&&(maximum<t.standard||rr.some(r=>r.price<r.standard))?"Attenzione: un’offerta sotto il listino Vauclair potrebbe essere poco interessante per il fornitore. Non conosciamo il suo minimo accettabile; il costo di produzione non è una soglia di accettazione.":"La disponibilità del fornitore ad accettare il prezzo va comunque negoziata.";
 $("simTransfer").disabled=!t.count;
 $("simBudget").disabled=$("simBudgetNumber").disabled=!t.count;
 for(const r of rr){const v=views.get(r.id);if(!v)continue;v.profit.textContent=money(r.qty*(r.export-r.price));v.total.textContent=money(r.qty*r.price);v.range.max=Math.max(r.retail,r.price)/100;if(document.activeElement!==v.range)v.range.value=r.price/100;if(document.activeElement!==v.exact)v.exact.value=(r.price/100).toFixed(2);v.range.max=Math.max(r.retail,r.price)/100;v.warning.textContent=r.price<r.standard?"Offerta inferiore al listino Vauclair":r.price>r.retail?"Offerta superiore al prezzo pieno":"";}
}
function render(){
 if(!quantities)return;
 requested=null;
 const root=$("simLines");root.replaceChildren();views.clear();
 for(const r of rows()){
  const card=el("article","sim-line"),head=el("div","sim-line-head");
  head.append(el("h3","",r.name),button("Rimuovi",()=>{quantities.delete(r.id);manual();onQuantity();}));
  const refs=el("p","sim-reference","Listino Vauclair "+money(r.standard)+" · Prezzo pieno "+money(r.retail)+" · Esportazione "+money(r.export));
  const qty=input("number",r.qty,0,999,1,"Quantità "+r.name);
  const qbox=el("label","sim-quantity","Quantità ");
  const change=n=>{if(!Number.isInteger(n)||n<0||n>999){qty.setCustomValidity("Quantità intera da 0 a 999");qty.reportValidity();return;}qty.setCustomValidity("");if(n)quantities.set(r.id,n);else quantities.delete(r.id);manual();onQuantity();};
  qty.onchange=()=>change(Number(qty.value));
  qbox.append(button("−",()=>change(r.qty-1)),qty,button("+",()=>change(Math.min(999,r.qty+1))));
  const range=input("range",r.price/100,0,Math.max(r.retail,r.price)/100,.01,"Prezzo offerto "+r.name);
  const exact=input("number",(r.price/100).toFixed(2),0,100000,.01,"Prezzo unitario esatto "+r.name);
  const offer=el("label","sim-offer","Offerta per arma ($)");offer.append(range,exact);
  const set=i=>{if(i.value===""||!i.checkValidity())return;prices.set(r.id,M.cents(i.value));manual();update();};
  range.oninput=()=>set(range);exact.oninput=()=>set(exact);
  exact.onchange=()=>{if(!exact.checkValidity()||exact.value===""){exact.value=((prices.get(r.id)??r.standard)/100).toFixed(2);}update();};
  const summary=el("div","sim-line-bottom"),total=el("strong"),gain=el("strong"),warning=el("small","sim-warning");
  const c=el("span","","Acquisto modello ");c.append(total);const g=el("span","","Profitto lordo ");g.append(gain);summary.append(c,g);
  card.append(head,refs,qbox,offer,summary,warning);root.append(card);views.set(r.id,{range,exact,total,profit:gain,warning});
 }
 if(!rows().length)root.append(el("p","empty","Seleziona le armi dal catalogo qui sopra. Le simulazioni restano temporanee."));
 update();
}
window.VauclairSimulator={
 mount(weapons,q,callback,preserve=false){
  const catalog=window.VAUCLAIR_WEAPONS||[];
  data=weapons.map(w=>{const p=catalog.find(p=>p.id===w.weapon_id&&p.tag==="attuale");if(!p||!retail[p.id])throw Error("Modello non disponibile nel catalogo ufficiale");return {id:p.id,name:p.name,standard:M.cents(p.buy),retail:M.cents(retail[p.id]),export:M.cents(w.blip_price)};});
  quantities=q;onQuantity=callback;if(!preserve)prices.clear();requested=null;
  const picker=$("simAddModel");picker.replaceChildren();
  for(const w of data){const option=el("option","",w.name);option.value=w.id;picker.append(option);}
  $("simAddButton").disabled=!data.length;
  render();
 },
 render,
 clear(){data=[];quantities=null;prices.clear();views.clear();requested=null;goalValue=roiValue=0;$("simStrategy").textContent="Listino Vauclair";$("simLines").replaceChildren();$("simAddModel").replaceChildren();$("simAddButton").disabled=true;for(const id of ["simCost","simRevenue","simProfit","simReturn","simMargin","simSaving","simMaximum","simRoom","simCount","simResidual","simGoalStatus","simWarning"])$(id).textContent="";$("simGoal").value=$("simRoi").value=$("simBudget").value=$("simBudgetNumber").value=0;},
};
$("simAddForm").onsubmit=event=>{
 event.preventDefault();
 if(!quantities)return;
 const id=$("simAddModel").value,qty=Number($("simAddQty").value);
 if(!data.some(w=>w.id===id)||!Number.isInteger(qty)||qty<1||qty>999)return;
 quantities.set(id,Math.min(999,(quantities.get(id)||0)+qty));
 manual();onQuantity();
};
document.querySelectorAll("[data-sim-preset]").forEach(b=>b.onclick=()=>{if(!quantities)return;const mode=b.dataset.simPreset;if(mode==="custom"){manual();update();return;}for(const w of data)prices.set(w.id,mode==="standard"?w.standard:Math.round(w.retail*(mode==="full"?1:mode==="five"?.95:.9)));requested=null;$("simStrategy").textContent=b.textContent;render();});
for(const id of ["simGoal","simRoi"]){
 $(id).oninput=()=>{if($(id).value!==""&&$(id).checkValidity()){if(id==="simGoal")goalValue=M.cents($(id).value);else roiValue=Math.round(Number($(id).value)*100);update();}};
 $(id).onchange=()=>{if($(id).value===""||!$(id).checkValidity())$(id).value=((id==="simGoal"?goalValue:roiValue)/100).toFixed(2);update();};
}
function budget(i){if(!quantities||i.value===""||!i.checkValidity())return;const rr=rows(),a=M.allocate(rr,M.cents(i.value));rr.forEach((r,j)=>prices.set(r.id,a.prices[j]));requested=a.budget;$("simStrategy").textContent="Budget proporzionale al listino";update();}
$("simBudget").oninput=()=>budget($("simBudget"));
$("simBudgetNumber").oninput=()=>budget($("simBudgetNumber"));
$("simBudgetNumber").onchange=()=>{if(!$("simBudgetNumber").checkValidity())$("simBudgetNumber").value=(M.totals(rows()).cost/100).toFixed(2);update();};
$("simReset").onclick=()=>{if(!quantities)return;quantities.clear();prices.clear();requested=null;goalValue=roiValue=0;$("simGoal").value=$("simRoi").value=0;$("simStrategy").textContent="Listino Vauclair";onQuantity();};
$("simTransfer").onclick=()=>{
 const payload=rows().map(r=>({id:r.id,qty:r.qty,unit:r.price/100}));
 if(!payload.length)return;
 if(M.totals(rows()).cost>1000000000){$("simGoalStatus").textContent="L’ordine supera il limite del registro ($10.000.000). Dividi la fornitura prima del trasferimento.";return;}
 try{sessionStorage.setItem("vauclair.armurerie.simulation-order.v1",JSON.stringify(payload));location.href="ordini.html?v=20261022-sim3#nuovo";}
 catch(e){$("simGoalStatus").textContent="Il browser non consente il trasferimento della bozza. Nessun ordine è stato modificato.";}
};
})();

