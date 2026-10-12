/* Vauclair Armurerie — Dossier dimostrativo, nessuna chiamata esterna.
   Prezzi di riferimento: Wildlands Proiezione Prezzi, tab "01 - Proposta commerciale".
   Ricarico export proposto = prezzo d'acquisto di riferimento * 2,20.
   Le stime non equivalgono a valori reali confermati dal server.
*/
(() => {
  "use strict";
  const DATA = [
    {name:"Revolver Cattleman",status:"REALE",retail:80,buy:70,blip:154},
    {name:"Revolver Double Action",status:"REALE",retail:90,buy:75,blip:165},
    {name:"Colt M1892",status:"REALE",retail:95,buy:80,blip:176},
    {name:"Colt M1873",status:"REALE",retail:120,buy:100,blip:220},
    {name:"Revolver Schofield",status:"REALE",retail:140,buy:120,blip:264},
    {name:"Revolver LeMat",status:"STIMA",retail:120.60,buy:105,blip:231},
    {name:"Revolver Navy",status:"STIMA",retail:170.26,buy:145,blip:319},
    {name:"Revolver Navy Crossover",status:"ANALOGIA",retail:187.28,buy:160,blip:352},
    {name:"Pistola semiautomatica",status:"REALE",retail:125,buy:105,blip:231},
    {name:"Pistola M1899",status:"REALE",retail:145,buy:125,blip:275},
    {name:"Pistola Mauser",status:"STIMA",retail:148.98,buy:125,blip:275},
    {name:"Pistola Volcanic",status:"ANALOGIA",retail:125,buy:105,blip:231},
    {name:"Fucile Springfield",status:"STIMA",retail:269.57,buy:240,blip:528},
    {name:"Fucile Bolt Action",status:"ANALOGIA",retail:283.76,buy:245,blip:539},
    {name:"Fucile Varmint",status:"REALE",retail:100,buy:95,blip:209},
    {name:"Repeater Carabina",status:"REALE",retail:140,buy:120,blip:264},
    {name:"Repeater Henry",status:"REALE",retail:240,buy:205,blip:451},
    {name:"Repeater Evans",status:"REALE",retail:245,buy:210,blip:462},
    {name:"Repeater Winchester",status:"STIMA",retail:283.76,buy:240,blip:528},
    {name:"Doppietta a canna liscia",status:"STIMA",retail:227.01,buy:205,blip:451},
    {name:"Fucile a pompa a ripetizione",status:"STIMA",retail:227.01,buy:195,blip:429},
    {name:"Fucile Elephant",status:"STIMA",retail:425.64,buy:360,blip:792}
  ];
  const expected = {"REALE":11,"STIMA":8,"ANALOGIA":3};
  for (const row of DATA) {
    if (Math.abs(row.blip - row.buy * 2.2) > .001) {
      throw new Error("Errore nel ricarico export: " + row.name);
    }
  }
  for (const [status, count] of Object.entries(expected)) {
    if (DATA.filter(item => item.status === status).length !== count) {
      throw new Error("Conteggio armi non corretto: " + status);
    }
  }
  const money = new Intl.NumberFormat("it-IT", {
    style:"currency",currency:"USD",currencyDisplay:"narrowSymbol",
    minimumFractionDigits:0,maximumFractionDigits:2
  });
  const num = new Intl.NumberFormat("it-IT",{maximumFractionDigits:0});
  const preset = ["Revolver Cattleman","Revolver Schofield","Repeater Carabina","Repeater Henry","Repeater Evans"];
  const quantity = new Map(DATA.map(row => [row.name,preset.includes(row.name) ? 1 : 0]));
  const state = {filter:"all",query:"",mode:"wholesale"};

  const el = id => document.getElementById(id);
  const body = el("catalogBody");
  const resultCount = el("resultCount");
  const searchInput = el("searchInput");
  const searchText = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("it-IT");
  const statusName = s => s === "REALE" ? "Confermato" : s === "STIMA" ? "Stima" : "Ipotesi";

  function td(className,text){
    const cell = document.createElement("td");
    if(className)cell.className=className;
    cell.textContent=text;
    return cell;
  }

  function renderCatalog() {
    body.replaceChildren();
    const filtered=DATA.filter(item=>(state.filter==="all" || item.status===state.filter)
      && searchText(item.name).includes(searchText(state.query)));
    if(!filtered.length){
      const empty = document.createElement("tr");
      const cell = td("empty-row","Nessuna arma corrisponde alla ricerca.");
      cell.colSpan=6;empty.append(cell);body.append(empty);
    }
    for(const item of filtered){
      const row=document.createElement("tr");
      const name=td("name-cell","");
      const title=document.createElement("strong");
      title.className="weapon-name";
      title.textContent=item.name + (item.status==="STIMA"?" *":item.status==="ANALOGIA"?" †":"");
      const tag=document.createElement("span");
      tag.className="weapon-tag";tag.textContent=statusName(item.status);
      name.append(title,tag);row.append(name);
      row.append(td("",money.format(item.retail)));
      row.append(td("",money.format(item.buy)));
      row.append(td("blip-value",money.format(item.blip)));
      row.append(td("profit-value",money.format(item.blip-item.buy)));
      const qtyCell=td("","");
      const container=document.createElement("div");container.className="qty-control";
      const minus=document.createElement("button");
      minus.type="button";minus.textContent="−";
      minus.disabled=(quantity.get(item.name)||0)===0;
      minus.setAttribute("aria-label","Rimuovi una unità di "+item.name);
      minus.addEventListener("click",()=>{
        quantity.set(item.name,Math.max(0,(quantity.get(item.name)||0)-1));
        renderCatalog();renderTotals();
      });
      const count=document.createElement("output");
      count.setAttribute("aria-label","Quantità di "+item.name);
      count.textContent=String(quantity.get(item.name)||0);
      const plus=document.createElement("button");
      plus.type="button";plus.textContent="+";
      plus.setAttribute("aria-label","Aggiungi una unità di "+item.name);
      plus.addEventListener("click",()=>{
        quantity.set(item.name,(quantity.get(item.name)||0)+1);
        renderCatalog();renderTotals();
      });
      container.append(minus,count,plus);qtyCell.append(container);row.append(qtyCell);
      body.append(row);
    }
    resultCount.textContent=num.format(filtered.length)+(filtered.length===1?" modello":" modelli");
  }

  function renderTotals(){
    let count=0,cost=0,revenue=0;
    for(const item of DATA){
      const n=quantity.get(item.name)||0;
      count+=n;
      cost+=n*(state.mode==="wholesale"?item.buy:item.retail);
      revenue+=n*item.blip;
    }
    const profit=Math.round((revenue-cost)*100)/100;
    el("simCount").textContent=num.format(count);
    el("simCost").textContent=money.format(cost);
    el("simRevenue").textContent=money.format(revenue);
    el("simProfit").textContent=money.format(profit);
    const comp=el("simComparison");
    comp.textContent=count
      ?"Con il doppio delle stesse armi: "+money.format(profit*2)+" di margine lordo."
      :"Seleziona una o più armi dalla tabella per iniziare.";
  }

  function wire(){
    searchInput.addEventListener("input",()=>{
      state.query=searchInput.value.trim();
      renderCatalog();
    });
    document.querySelectorAll(".filter-btn").forEach(button=>{
      button.addEventListener("click",()=>{
        state.filter=button.dataset.filter;
        document.querySelectorAll(".filter-btn").forEach(el=>{
          const chosen=el===button;el.classList.toggle("active",chosen);
          el.setAttribute("aria-pressed",String(chosen));
        });
        renderCatalog();
      });
    });
    document.querySelectorAll(".mode-btn").forEach(button=>{
      button.addEventListener("click",()=>{
        state.mode=button.dataset.mode;
        document.querySelectorAll(".mode-btn").forEach(el=>{
          const chosen=el===button;el.classList.toggle("active",chosen);
          el.setAttribute("aria-pressed",String(chosen));
        });
        renderTotals();
      });
    });
    el("presetButton").addEventListener("click",()=>{
      for(const item of DATA)quantity.set(item.name,preset.includes(item.name)?1:0);
      renderCatalog();renderTotals();
    });
    el("clearButton").addEventListener("click",()=>{
      for(const item of DATA)quantity.set(item.name,0);
      renderCatalog();renderTotals();
    });
    const menuButton=el("menuButton");
    const nav=el("mobileNav");
    menuButton.addEventListener("click",()=>{
      const expanded=menuButton.getAttribute("aria-expanded")==="true";
      menuButton.setAttribute("aria-expanded",String(!expanded));
      menuButton.setAttribute("aria-label",expanded?"Apri il menu":"Chiudi il menu");
      nav.hidden=expanded;
    });
    nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
      nav.hidden=true;menuButton.setAttribute("aria-expanded","false");
      menuButton.setAttribute("aria-label","Apri il menu");
    }));
    el("simProfit").setAttribute("aria-live","polite");
  }
  if(!body || !el("simProfit"))return;
  wire();
  renderCatalog();
  renderTotals();
})();
