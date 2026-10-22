(()=>{
"use strict";
// Public Supabase project URL and PUBLISHABLE key. No service-role key or blip prices are shipped in this file.
// Database RLS is the security boundary: only explicitly approved Supabase user IDs can SELECT the prices.
const SUPABASE_URL="https://bvihgkzztxksmzdjtniy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_kXVblfFaJZzSIPHbQYs6ig_0do9tewr";
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"USD",currencyDisplay:"narrowSymbol",maximumFractionDigits:2}).format(n);
const node=(tag,cls,content)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(content!==undefined)v.textContent=String(content);return v;};
const normalize=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const groups=["Revolver","Pistole","Fucili","Repeater"];
const expanded=new Set(["Revolver"]);
const quantities=new Map();
let weapons=[],client=null,filter="",category="Tutte",version=0,owner=null;
const show=panel=>{
  for(const id of ["authPanel","awaitingApproval","privateWorkspace"])$(id).hidden=id!==panel;
};
const msg=(id,value)=>{$(id).textContent=value||"";};
const notify=message=>msg("authMessage",message);
const failSafe=()=>{owner=null;weapons=[];quantities.clear();$("privateCatalog").replaceChildren();window.VauclairSimulator.clear();};
function rerender(){
  const root=$("privateCatalog");root.replaceChildren();
  const active=weapons.filter(w=>(category==="Tutte"||w.category===category)&&normalize(w.weapon_name).includes(normalize(filter)));
  if(!active.length)root.append(node("p","empty","Nessuna arma trovata."));
  for(const group of groups){
    const groupItems=active.filter(w=>w.category===group);
    if(!groupItems.length)continue;
    const section=node("section","weapon-category");
    section.setAttribute("aria-label",group);
    const header=node("h3","weapon-category-header");
    const toggle=node("button","weapon-category-toggle");
    const body=node("div","weapon-category-items");
    toggle.type="button";body.id="priv-group-"+groups.indexOf(group);
    const opened=expanded.has(group);
    body.hidden=!opened;
    toggle.setAttribute("aria-expanded",String(opened));
    toggle.setAttribute("aria-controls",body.id);
    toggle.append(node("span","weapon-category-title",group),node("span","weapon-category-count",groupItems.length+" modelli"),node("span","weapon-category-arrow","▼"));
    toggle.addEventListener("click",()=>{if(expanded.has(group))expanded.delete(group);else expanded.add(group);const open=expanded.has(group);toggle.setAttribute("aria-expanded",String(open));body.hidden=!open;});
    header.append(toggle);section.append(header);
    for(const w of groupItems){
      const row=node("article","private-weapon");
      const name=node("div","private-weapon-name");
      name.append(node("strong","",w.weapon_name),node("small","","Solo armi integre"));
      const amounts=[
        ["Acquisto",fmt(Number(w.purchase_ceiling)),"private-value"],
        ["Al blip",fmt(Number(w.blip_price)),"private-value blip"],
        ["Margine",fmt(Number(w.blip_price)-Number(w.purchase_ceiling)),"private-value profit"]
      ];
      row.append(name);
      for(const [label,value,cls] of amounts){const v=node("div",cls);v.append(node("small","",label),node("strong","",value));row.append(v);}
      const qty=node("div","qty");
      const minus=node("button","","−"),count=node("output","",quantities.get(w.weapon_id)||0),plus=node("button","","+");
      minus.type=plus.type="button";
      minus.disabled=!(quantities.get(w.weapon_id)||0);
      minus.setAttribute("aria-label","Rimuovi una "+w.weapon_name);
      plus.setAttribute("aria-label","Aggiungi una "+w.weapon_name);
      minus.addEventListener("click",()=>adjust(w.weapon_id,-1));
      plus.addEventListener("click",()=>adjust(w.weapon_id,1));
      qty.append(minus,count,plus);row.append(qty);
      body.append(row);
    }
    section.append(body);root.append(section);
  }
  window.VauclairSimulator.render();
}
function adjust(id,delta){
  const qty=Math.min(999,Math.max(0,(quantities.get(id)||0)+delta));
  if(qty)quantities.set(id,qty);else quantities.delete(id);
  rerender();
}
async function sync(){
  const request=++version;
  try{
    const {data:{user},error}=await client.auth.getUser();
    if(request!==version)return;
    if(error||!user){failSafe();show("authPanel");return;}
    const member=await client.from("vauclair_private_members").select("user_id").eq("user_id",user.id).maybeSingle();
    if(request!==version)return;
    if(member.error)throw member.error;
    if(!member.data){
      failSafe();
      msg("approvalMessage","Questo account non è autorizzato. Accedi con un account abilitato al registro.");
      show("awaitingApproval");return;
    }
    const {data,error:readError}=await client.from("vauclair_export_prices")
      .select("weapon_id,weapon_name,category,purchase_ceiling,blip_price,quality")
      .eq("quality","REALE").gt("blip_price",0);
    if(request!==version)return;
    if(readError)throw readError;
    if(!Array.isArray(data)||data.length!==11)throw new Error("Archivio delle tariffe approvate non disponibile o incompleto.");
    weapons=data.sort((a,b)=>Number(a.weapon_id.slice(1))-Number(b.weapon_id.slice(1)));
    const preserve=owner===user.id;
    if(!preserve)quantities.clear();owner=user.id;
    $("privateCount").textContent=String(weapons.length);
    $("privateApprovedCount").textContent=String(weapons.length);
    window.VauclairSimulator.mount(weapons,quantities,rerender,preserve);
    show("privateWorkspace");rerender();
  }catch(error){
    if(request!==version)return;
    failSafe();show("awaitingApproval");
    msg("approvalMessage","Non riesco a verificare l'autorizzazione: "+(error?.message||"errore di connessione")+". Riprova.");
  }
}
const resetLogin=()=>{$("authForm").reset();notify("");};
async function logout(){
  ++version;failSafe();show("authPanel");resetLogin();
  const {error}=await client.auth.signOut();if(error)notify("Impossibile disconnettersi: "+error.message);
}
async function submitAuth(event){
  event.preventDefault();
  const btn=$("privateSubmit");
  const email=$("privateEmail").value.trim(),password=$("privatePassword").value;
  if(!email||password.length<8){
    notify("Inserisci l’email e la password dell’account già registrato.");
    return;
  }
  btn.disabled=true;
  notify("Verifica delle credenziali…");
  try{
    const {error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    notify("");
    await sync();
  }catch(error){
    notify("Accesso non riuscito: "+(error?.message||"riprovare più tardi"));
  }finally{
    btn.disabled=false;
  }
}
if(!window.supabase||typeof window.supabase.createClient!=="function"){
  notify("Il servizio di autenticazione non si è caricato. Controlla la connessione e ricarica la pagina.");return;
}
client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
$("authForm").addEventListener("submit",submitAuth);
$("privateLogout").addEventListener("click",logout);
$("pendingLogout").addEventListener("click",logout);
$("retryApproval").addEventListener("click",sync);
$("privateSearch").addEventListener("input",e=>{filter=e.target.value;if(filter.trim())for(const w of weapons)if(normalize(w.weapon_name).includes(normalize(filter)))expanded.add(w.category);rerender();});
document.querySelectorAll("[data-private-cat]").forEach(btn=>btn.addEventListener("click",()=>{category=btn.dataset.privateCat;
  if(category!=="Tutte")expanded.add(category);
  document.querySelectorAll("[data-private-cat]").forEach(b=>{b.classList.toggle("active",b===btn);b.setAttribute("aria-pressed",String(b===btn));});
  rerender();
}));
$("privateCollapseAll").addEventListener("click",()=>{expanded.clear();
  document.querySelectorAll("#privateCatalog .weapon-category-toggle").forEach(button=>{button.setAttribute("aria-expanded","false");const list=document.getElementById(button.getAttribute("aria-controls"));if(list)list.hidden=true;});
});
client.auth.onAuthStateChange((event)=>{if(["SIGNED_IN","SIGNED_OUT","TOKEN_REFRESHED","USER_UPDATED","INITIAL_SESSION"].includes(event))queueMicrotask(sync);});
sync();
})();
