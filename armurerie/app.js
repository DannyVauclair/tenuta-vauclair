/* Vauclair Armurerie — vetrina commerciale.
   Non è un sistema d'ordine remoto: prepara testi copiabili, senza inviare dati.
   Il listino di acquisto indicativo proviene da catalogo.js; non contiene tariffe export. */
(() => {
  'use strict';
  const items = Array.isArray(window.VAUCLAIR_CATALOG) ? window.VAUCLAIR_CATALOG : [];
  const money = new Intl.NumberFormat('it-IT', {style:'currency',currency:'USD',currencyDisplay:'narrowSymbol',minimumFractionDigits:0,maximumFractionDigits:2});
  const key='vauclair.armurerie.offerta.v1';
  const selection = new Map();
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    for(const item of items) {
      const n=Number(saved[item.id]);
      if(Number.isSafeInteger(n)&&n>0&&n<=999)selection.set(item.id,n);
    }
  } catch (_) {}
  let group='Tutte', query='', prepared='';
  const byId=id=>document.getElementById(id);
  const nameEl=byId('catalogList'), offerEl=byId('offerItems');
  const canQuote=item=>item.status==='attuale';
  const slug=str=>str.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function persist() {
    try {localStorage.setItem(key,JSON.stringify(Object.fromEntries(selection)));} catch(_) {}
  }
  function element(tag,cls,text){
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function badge(status){
    const labels={attuale:'Quotazione di riferimento',stimato:'In valutazione',ipotetico:'Su richiesta'};
    const b=element('small','quote-status '+status,labels[status]||'In valutazione');
    return b;
  }
  function addItem(id,delta) {
    const current=selection.get(id)||0;
    const next=Math.max(0,Math.min(999,current+delta));
    if(next)selection.set(id,next);else selection.delete(id);
    prepared='';byId('copyProposal').disabled=true;byId('proposalStatus').textContent='Distinta modificata: prepara nuovamente il messaggio per aggiornarlo.';
    persist();renderCatalog();renderOffer();renderPreview();
  }
  function renderCatalog(){
    if(!nameEl)return;
    nameEl.replaceChildren();
    const filtered=items.filter(item=>(group==='Tutte'||group===item.group)&&slug(item.name).includes(slug(query)));
    byId('catalogInfo').textContent = filtered.length+' modelli visualizzati · I prezzi esposti sono indicativi e soggetti a conferma. I modelli non ancora disponibili sono mostrati solo per richiesta informazioni.';
    if(!filtered.length){
      const empty=element('div','empty-results','Nessun modello trovato. Modifica la ricerca.');
      nameEl.append(empty);return;
    }
    for(const item of filtered){
      const row=element('article','weapon-row');
      const left=element('div','weapon-identity');
      left.append(element('span','weapon-mark',item.group==='Revolver'?'R':item.group==='Pistole'?'P':'F'));
      const meta=element('div','weapon-meta');
      meta.append(element('strong','weapon-name',item.name),badge(item.status));
      left.append(meta);
      const value=element('div','weapon-valuation');
      value.append(element('small','',canQuote(item)?'Acquisto indicativo':'Quotazione'));
      value.append(element('strong','',canQuote(item)?money.format(item.buy):'Da concordare'));
      const control=element('div','weapon-action');
      if(selection.has(item.id)){
        const minus=element('button','qty-button','−');
        minus.type='button';minus.setAttribute('aria-label','Rimuovi un '+item.name);
        minus.addEventListener('click',()=>addItem(item.id,-1));
        const count=element('output','qty-count',String(selection.get(item.id)));
        const plus=element('button','qty-button','+');
        plus.type='button';plus.setAttribute('aria-label','Aggiungi un '+item.name);
        plus.addEventListener('click',()=>addItem(item.id,1));
        control.append(minus,count,plus);
      } else {
        const add=element('button','add-weapon','+ Aggiungi');
        add.type='button';add.setAttribute('aria-label','Aggiungi '+item.name+' alla proposta');
        add.addEventListener('click',()=>addItem(item.id,1));
        control.append(add);
      }
      row.append(left,value,control);nameEl.append(row);
    }
  }
  function renderOffer(){
    if(!offerEl)return;
    offerEl.replaceChildren();let total=0,unknown=0;
    for(const [id,qty] of selection){
      const item=items.find(x=>x.id===id);
      if(!item)continue;
      const line=element('div','offer-line');
      const label=element('div','offer-line-name');
      label.append(element('strong','',item.name),element('small','',qty+' × '+(canQuote(item)?money.format(item.buy):'su richiesta')));
      const minus=element('button','remove-line','×');minus.type='button';minus.setAttribute('aria-label','Rimuovi '+item.name);
      minus.addEventListener('click',()=>{selection.delete(id);persist();renderOffer();renderCatalog();renderPreview();prepared='';byId('copyProposal').disabled=true;});
      line.append(label,minus);offerEl.append(line);
      if(canQuote(item))total+=qty*item.buy;else unknown+=qty;
    }
    if(!offerEl.children.length)offerEl.append(element('div','offer-empty','Nessuna arma selezionata.'));
    byId('offerTotal').textContent = money.format(total)+(unknown?' + valutazioni': '');
  }
  function renderPreview(){
    const area=byId('proposalPreview');
    const line=[];
    for(const [id,qty] of selection){
      const item=items.find(x=>x.id===id);
      if(item)line.push(qty+' × '+item.name+(canQuote(item)?' ('+money.format(item.buy)+' cad. indicativi)':' (prezzo da concordare)'));
    }
    area.textContent=line.length ? 'Armi selezionate:\n'+line.join('\n') : 'Nessun modello aggiunto alla distinta. Puoi comunque preparare una richiesta di informazioni.';
  }
  function createText(){
    const name=byId('contactName').value.trim(),supplier=byId('supplierType').value,
      place=byId('contactPlace').value.trim(),contact=byId('contactHandle').value.trim(),
      condition=byId('weaponCondition').value, notes=byId('proposalNotes').value.trim();
    let list=[...selection].map(([id,qty])=>{
      const item=items.find(x=>x.id===id);
      if(!item)return null;
      return '• '+qty+' × '+item.name;
    }).filter(Boolean);
    const manual=byId('weaponSelect').value;
    if(manual && !selection.has(manual)){
      const item=items.find(x=>x.id===manual);
      if(item)list.push('• 1 × '+item.name+' (da definire)');
    }
    const text=[
      'VAUCLAIR ARMURERIE — RICHIESTA COMMERCIALE',
      'Referente: '+name,
      'Fornitore: '+supplier,
      place?'Luogo: '+place:null,
      contact?'Recapito RP: '+contact:null,
      'Condizioni: '+condition,
      '',
      'Armi proposte:',
      list.length?list.join('\n'):'• Da definire con Daniel Vauclair',
      notes?'':'',notes?'Dettagli: '+notes:null,
      '',
      'Prezzi e disponibilità da concordare direttamente con Daniel Vauclair.'
    ].filter(x=>x!==null).join('\n').trim();
    return text;
  }
  async function copyText(){
    if(!prepared)return;
    try{
      await navigator.clipboard.writeText(prepared);
      byId('proposalStatus').textContent='Testo copiato. Ora puoi incollarlo nel messaggio RP o su Discord.';
    } catch(_) {
      const ta=element('textarea','copy-fallback');
      ta.value=prepared;ta.setAttribute('aria-label','Testo della richiesta');
      byId('proposalForm').append(ta);ta.focus();ta.select();
      try{document.execCommand('copy');byId('proposalStatus').textContent='Testo selezionato e copiato, se il browser lo consente.';}
      catch(__){byId('proposalStatus').textContent='Seleziona e copia manualmente il testo mostrato.';}
    }
  }
  function init(){
    if(!nameEl)return;
    byId('searchInput').addEventListener('input',e=>{query=e.target.value;renderCatalog();});
    document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{
      group=button.dataset.filter;
      document.querySelectorAll('.filter').forEach(b=>{const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
      renderCatalog();
    }));
    byId('clearOffer').addEventListener('click',()=>{selection.clear();prepared='';byId('copyProposal').disabled=true;persist();renderCatalog();renderOffer();renderPreview();});
    const select=byId('weaponSelect');
    for(const item of items){const option=element('option','',item.name);option.value=item.id;select.append(option);}
    byId('proposalForm').addEventListener('submit',async e=>{
      e.preventDefault();
      if(!e.target.reportValidity())return;
      prepared=createText();
      byId('proposalPreview').textContent=prepared;
      byId('copyProposal').disabled=false;
      byId('proposalStatus').textContent='Messaggio preparato. Copialo e invialo a Daniel: nessuna richiesta è stata inviata automaticamente.';
      await copyText();
    });
    byId('copyProposal').addEventListener('click',copyText);
    const menuButton=byId('menuButton'),menu=byId('mobileMenu');
    menuButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));});
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');}));
    renderCatalog();renderOffer();renderPreview();
  }
  init();
})();
