(()=>{
"use strict";
const weapons=Array.isArray(window.VAUCLAIR_WEAPONS)?window.VAUCLAIR_WEAPONS:[];
const money=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"USD",currencyDisplay:"narrowSymbol",minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
const pick=new Map();
let category="Tutte",filter="";
const $=id=>document.getElementById(id);
const n=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el};
const normalized=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function update(){
  const root=$("catalog");root.replaceChildren();
  const visible=weapons.filter(w=>(category==="Tutte"||category===w.cat)&&normalized(w.name).includes(normalized(filter)));
  if(!visible.length)root.append(n("div","empty","Nessun modello trovato."));
  for(const w of visible){
    const row=n("article","weapon"),name=n("div"),price=n("div","price"),qty=n("div","qty");
    name.append(n("strong","weapon-name",w.name));
    const description=w.tag==="attuale"?"Costo del wipe attuale":w.tag==="proiezione"?"Proiezione dal vecchio wipe":"Stima per analogia";
    name.append(n("small",w.tag==="proiezione"?"estimate":w.tag==="ipotesi"?"guess":"",description));
    price.append(n("span","","Acquisto"),n("b","",money(w.buy)));
    const minus=n("button","","−"),count=n("output","",pick.get(w.id)||0),plus=n("button","","+");
    minus.type=plus.type="button";
    minus.setAttribute("aria-label","Rimuovi una "+w.name);
    plus.setAttribute("aria-label","Aggiungi una "+w.name);
    minus.disabled=!(pick.get(w.id)||0);
    minus.addEventListener("click",()=>change(w.id,-1));
    plus.addEventListener("click",()=>change(w.id,1));
    qty.append(minus,count,plus);row.append(name,price,qty);root.append(row);
  }
  const selected=$("selected");selected.replaceChildren();
  let sum=0,quantity=0;
  for(const w of weapons){
    const amount=pick.get(w.id)||0;
    if(!amount)continue;
    sum+=amount*w.buy;quantity+=amount;
    const line=n("div","selected-line");
    line.append(n("span","",amount+" × "+w.name),n("strong","",money(amount*w.buy)));
    selected.append(line);
  }
  if(!quantity)selected.append(n("div","empty","Nessuna arma selezionata."));
  $("total").textContent=money(sum);
  $("startOrder").disabled=!quantity;
}
function change(id,delta){
  const value=Math.max(0,Math.min(999,(pick.get(id)||0)+delta));
  if(value)pick.set(id,value);else pick.delete(id);
  update();
}
$("search").addEventListener("input",e=>{filter=e.target.value;update()});
document.querySelectorAll("[data-cat]").forEach(btn=>btn.addEventListener("click",()=>{
  category=btn.dataset.cat;
  document.querySelectorAll("[data-cat]").forEach(other=>{const active=other===btn;other.classList.toggle("active",active);other.setAttribute("aria-pressed",String(active))});
  update();
}));
$("startOrder").addEventListener("click",()=>{
  const lines=weapons.filter(w=>pick.has(w.id)).map(w=>({id:w.id,qty:pick.get(w.id)}));
  if(!lines.length)return;
  try{sessionStorage.setItem("vauclair.armurerie.draft.v1",JSON.stringify(lines));}
  catch(_){alert("Impossibile trasferire la selezione in questo browser. Apri Ordini e inserisci le armi manualmente.");return}
  window.location.href="ordini.html#nuovo";
});
if(weapons.length!==22)throw Error("Il catalogo non contiene 22 armi.");
update();
})();
