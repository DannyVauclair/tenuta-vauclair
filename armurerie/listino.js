(()=>{
"use strict";
const weapons=Array.isArray(window.VAUCLAIR_WEAPONS)?window.VAUCLAIR_WEAPONS:[];
const money=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"USD",currencyDisplay:"narrowSymbol",minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
const pick=new Map();
let category="Tutte",filter="";
const groups=["Revolver","Pistole","Fucili","Repeater"];
const expanded=new Set(["Revolver"]);
const $=id=>document.getElementById(id);
const n=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el};
const normalized=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function update(){
  const root=$("catalog");root.replaceChildren();
  const visible=weapons.filter(w=>(category==="Tutte"||category===w.cat)&&normalized(w.name).includes(normalized(filter)));
  if(!visible.length)root.append(n("div","empty","Nessun modello trovato."));
  for(const groupName of groups){
    const members=visible.filter(w=>w.cat===groupName);
    if(!members.length)continue;
    const section=n("section","weapon-category");
    section.setAttribute("aria-label",groupName);
    const header=n("h3","weapon-category-header");
    const toggle=n("button","weapon-category-toggle");
    toggle.type="button";
    const groupList=n("div","weapon-category-items");
    groupList.id="weapon-category-"+groups.indexOf(groupName);
    const isOpen=expanded.has(groupName);
    groupList.hidden=!isOpen;
    toggle.setAttribute("aria-controls",groupList.id);
    toggle.setAttribute("aria-expanded",String(isOpen));
    toggle.append(n("span","weapon-category-title",groupName));
    toggle.append(n("span","weapon-category-count",members.length===1?"1 modello":members.length+" modelli"));
    toggle.append(n("span","weapon-category-arrow","▼"));
    toggle.addEventListener("click",()=>{
      if(expanded.has(groupName))expanded.delete(groupName);
      else expanded.add(groupName);
      const open=expanded.has(groupName);
      toggle.setAttribute("aria-expanded",String(open));
      groupList.hidden=!open;
    });
    header.append(toggle);
    section.append(header);
    for(const w of members){
      const row=n("article","weapon"),name=n("div"),price=n("div","price"),qty=n("div","qty");
      name.append(n("strong","weapon-name",w.name));
      const description=w.tag==="attuale"?"Costo del wipe attuale":w.tag==="proiezione"?"Proiezione dal vecchio wipe":"Stima per analogia";
      name.append(n("small",w.tag==="proiezione"?"estimate":w.tag==="ipotesi"?"guess":"",description));
      price.append(n("span","","Acquisto"),n("b","",money(w.buy)));
      const minus=n("button","","−"),count=n("output","",pick.get(w.id)||0),plus=n("button","+","+");
      minus.type=plus.type="button";
      minus.setAttribute("aria-label","Rimuovi una "+w.name);
      plus.setAttribute("aria-label","Aggiungi una "+w.name);
      minus.disabled=!(pick.get(w.id)||0);
      minus.addEventListener("click",()=>change(w.id,-1));
      plus.addEventListener("click",()=>change(w.id,1));
      qty.append(minus,count,plus);row.append(name,price,qty);groupList.append(row);
    }
    section.append(groupList);
    root.append(section);
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
$("search").addEventListener("input",e=>{
  filter=e.target.value;
  if(filter.trim()){
    for(const w of weapons)if(normalized(w.name).includes(normalized(filter)))expanded.add(w.cat);
  }
  update();
});
document.querySelectorAll("[data-cat]").forEach(btn=>btn.addEventListener("click",()=>{
  category=btn.dataset.cat;
  if(category!=="Tutte")expanded.add(category);
  document.querySelectorAll("[data-cat]").forEach(other=>{const active=other===btn;other.classList.toggle("active",active);other.setAttribute("aria-pressed",String(active))});
  update();
}));
$("collapseAllCategories").addEventListener("click",()=>{
  expanded.clear();
  // Chiude subito le sezioni correnti, senza ricreare il catalogo
  // e senza perdere selezione, quantità o posizione di scorrimento.
  document.querySelectorAll("#catalog .weapon-category-toggle").forEach(toggle=>{
    toggle.setAttribute("aria-expanded","false");
    const list=document.getElementById(toggle.getAttribute("aria-controls"));
    if(list)list.hidden=true;
  });
});
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
