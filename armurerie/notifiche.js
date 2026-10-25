/* Vauclair Armurerie — notifiche eleganti del registro ordini.
   La versione attuale usa localStorage: notifiche visibili solo su questo browser.
   Per notifiche condivise a tutti servirà sincronizzare prima gli ordini. */
(()=>{
  "use strict";
  const KEY="vauclair.armurerie.notifications.v1";
  const MAX=60;
  const $=id=>document.getElementById(id);
  const panel=$("notificationPanel"),bell=$("notificationBell"),badge=$("notificationCount"),list=$("notificationList"),markAll=$("markNotificationsRead");
  if(!panel||!bell||!badge||!list||!markAll)return;

  const safeText=v=>String(v==null?"":v).slice(0,240);
  function read(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||"[]");
      if(!Array.isArray(raw))return [];
      return raw.filter(x=>x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.title==="string"&&typeof x.text==="string"&&typeof x.createdAt==="string").slice(0,MAX);
    }catch(_){return [];}
  }
  function store(items){
    try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,MAX)));return true;}
    catch(_){return false;}
  }
  const date=v=>{
    const x=new Date(v);
    return Number.isNaN(x.getTime())?"":x.toLocaleString("it-IT",{dateStyle:"short",timeStyle:"short"});
  };
  function elt(tag,cls,content){
    const x=document.createElement(tag);
    if(cls)x.className=cls;
    if(content!==undefined)x.textContent=content;
    return x;
  }
  function setOpen(open){
    panel.hidden=!open;
    bell.setAttribute("aria-expanded",String(open));
  }
  function render(){
    const items=read().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const unread=items.filter(x=>!x.read).length;
    badge.hidden=unread===0;
    badge.textContent=unread>99?"99+":String(unread);
    bell.setAttribute("aria-label",unread>0?"Notifiche ordini: "+unread+" non lette":"Apri notifiche ordini");
    markAll.disabled=unread===0;
    list.replaceChildren();
    if(!items.length){
      list.append(elt("div","notification-empty","Nessuna notifica al momento."));
      return;
    }
    for(const item of items){
      const link=elt("a","notification-item"+(item.read?"":" unread"));
      // Un aggiornamento allo stato Ricevuto porta alla scheda ora visibile nell’Archivio.
      link.href=/→\s*Ricevuto\s*$/.test(item.text)?"archivio.html":"ordini.html";
      link.setAttribute("aria-label",safeText(item.title)+": "+safeText(item.text));
      const mark=elt("span","notification-item-mark","✦");
      const body=elt("span","notification-item-body");
      body.append(elt("strong","",safeText(item.title)));
      body.append(elt("span","notification-item-desc",safeText(item.text)));
      body.append(elt("small","",date(item.createdAt)));
      link.append(mark,body);
      link.addEventListener("click",()=>{
        const data=read();
        for(const n of data)if(n.id===item.id)n.read=true;
        store(data);
      });
      list.append(link);
    }
  }
  bell.addEventListener("click",()=>setOpen(panel.hidden));
  markAll.addEventListener("click",()=>{
    const data=read().map(x=>({...x,read:true}));
    store(data);render();
  });
  document.addEventListener("click",event=>{
    if(!panel.hidden&&!panel.contains(event.target)&&!bell.contains(event.target))setOpen(false);
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!panel.hidden){setOpen(false);bell.focus();}
  });
  window.addEventListener("storage",event=>{if(event.key===KEY)render();});

  window.VAUCLAIR_NOTIFY=function(title,message,orderId=""){
    const now=new Date().toISOString();
    const id=(typeof crypto!=="undefined"&&crypto.randomUUID)
      ?crypto.randomUUID():now+"-"+Math.random().toString(36).slice(2);
    const items=read();
    items.unshift({id,title:safeText(title),text:safeText(message),orderId:safeText(orderId),createdAt:now,read:false});
    store(items);
    render();
  };
  render();
})();