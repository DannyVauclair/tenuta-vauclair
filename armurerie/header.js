/* Vauclair Armurerie: unica intestazione per Listino, Ordini e Registro.
   Lo script viene caricato PRIMA di notifiche.js (entrambi defer).
   Le tre pagine conservano un'intestazione HTML di fallback nel caso in cui JS non parta.
   Il solo elemento variabile è la pagina attiva, evidenziata in bordeaux. */
(()=>{
  "use strict";
  const header=document.querySelector("header.header");
  if(!header)return;
  const inner="<div class=\"wrap header-inner\">\n<a class=\"brand\" href=\"./\" aria-label=\"Vauclair Armurerie — Listino acquisti\"><img src=\"../assets/vauclair-logo.webp\" alt=\"Stemma Vauclair\" width=\"96\" height=\"96\"><span><strong>Vauclair <em>Armurerie</em></strong></span></a>\n<div class=\"header-tools\"><nav class=\"nav\" aria-label=\"Navigazione\"><a class=\"last\" href=\"riservata.html?v=20261012-unified1\">Registro</a><a class=\"last current\" href=\"./\" aria-current=\"page\">Listino acquisti</a><a class=\"last\" href=\"ordini.html\">Ordini</a></nav><div class=\"notification-shell\">\n  <button class=\"notification-toggle\" id=\"notificationBell\" type=\"button\" aria-label=\"Apri notifiche ordini\" aria-haspopup=\"true\" aria-expanded=\"false\" aria-controls=\"notificationPanel\">\n    <svg viewBox=\"0 0 32 32\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\">\n      <path d=\"M16 5.5c-4.3 0-7 3.1-7 7.3v3.3c0 3.6-1.2 5.3-3.3 7.1h20.6c-2.1-1.8-3.3-3.5-3.3-7.1v-3.3c0-4.2-2.7-7.3-7-7.3Z\" stroke=\"currentColor\" stroke-width=\"1.55\" stroke-linejoin=\"round\"/>\n      <path d=\"M16 2.8v2.7M12.5 26.2a3.5 3.5 0 0 0 7 0\" stroke=\"currentColor\" stroke-width=\"1.55\" stroke-linecap=\"round\"/>\n    </svg>\n    <span class=\"notification-count\" id=\"notificationCount\" hidden>0</span>\n  </button>\n  <div class=\"notification-panel\" id=\"notificationPanel\" role=\"region\" aria-label=\"Notifiche degli ordini\" hidden>\n    <div class=\"notification-top\">\n      <div><span>REGISTRO VAUCLAIR</span><strong>Notifiche ordini</strong></div>\n      <button type=\"button\" id=\"markNotificationsRead\">Segna lette</button>\n    </div>\n    <div class=\"notification-list\" id=\"notificationList\"><div class=\"notification-empty\">Nessuna notifica al momento.</div></div>\n    <div class=\"notification-bottom\"><a href=\"ordini.html\">Vai agli ordini <span aria-hidden=\"true\">↗</span></a></div>\n  </div>\n</div></div>\n</div>";
  header.innerHTML=inner;
  const filename=window.location.pathname.split("/").pop().toLowerCase();
  const active=filename==="riservata.html"?"riservata.html":filename==="ordini.html"?"ordini.html":"./";
  const nav=header.querySelector(".nav");
  if(!nav)return;
  nav.querySelectorAll("a").forEach(link=>{
    const current=link.getAttribute("href").split("?")[0]===active;
    link.classList.toggle("current",current);
    if(current)link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  });
})();
