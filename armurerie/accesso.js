/* Vauclair Armurerie — secure invite and password recovery flow. No blip prices or secret keys. */
(()=>{
"use strict";
const URL_SUPABASE="https://bvihgkzztxksmzdjtniy.supabase.co";
const PUBLIC_KEY="sb_publishable_kXVblfFaJZzSIPHbQYs6ig_0do9tewr";
const REDIRECT_URL="https://dannyvauclair.github.io/tenuta-vauclair/armurerie/accesso.html";
const $=id=>document.getElementById(id);
const query=new URLSearchParams(window.location.search);
const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
const callback=hash.has("access_token")||query.has("code")||query.has("token_hash");
const urlError=hash.get("error_code")||query.get("error_code")||hash.get("error")||query.get("error");
let client=null,verifiedCallback=false;
function message(text,isError=false){const m=$("credentialMessage");m.textContent=text;m.classList.toggle("credential-error",isError);}
function view(kind){
 $("credentialRequestPanel").hidden=kind!=="request";
 $("credentialSetPanel").hidden=kind!=="set";
 $("credentialSuccess").hidden=kind!=="success";
 $("credentialTitle").textContent=kind==="request"?"Attiva o recupera la password":kind==="set"?"Scegli la tua password":"Credenziali aggiornate";
 $("credentialIntro").textContent=kind==="request"?
 "Richiedi un collegamento per attivare il tuo account Vauclair o reimpostare la password.":
 kind==="set"?"Il tuo collegamento è stato verificato. Imposta una password personale per accedere al Registro.":
 "La password è stata salvata. Effettua l'accesso con le tue nuove credenziali.";
}
async function acceptLink(){
 try{
  // Standard Supabase invitation and recovery links redirect with tokens or an auth code.
  if(query.has("token_hash")){
   const type=query.get("type");
   if(!["invite","recovery","magiclink","email"].includes(type))throw new Error("Tipo di link non riconosciuto.");
   const result=await client.auth.verifyOtp({token_hash:query.get("token_hash"),type});
   if(result.error)throw result.error;
  }
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user)throw new Error("Collegamento non valido o scaduto. Richiedi un nuovo link.");
  // The database RLS allows each approved account to see only its own membership row.
  const member=await client.from("vauclair_private_members").select("user_id").eq("user_id",data.user.id).maybeSingle();
  if(member.error||!member.data)throw new Error("Questo account non è autorizzato al Registro Vauclair.");
  verifiedCallback=true;
  window.history.replaceState(null,"",REDIRECT_URL);
  view("set");message("");
 }catch(error){
  view("request");
  message("Impossibile attivare il collegamento: "+(error.message||"errore di autenticazione")+". Richiedi un nuovo link qui sotto.",true);
 }
}
async function sendLink(event){
 event.preventDefault();
 const button=$("credentialSend"),email=$("credentialEmail").value.trim();
 if(!email||!event.currentTarget.reportValidity())return;
 button.disabled=true;message("Richiesta in corso…");
 try{
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:REDIRECT_URL});
  if(error)throw error;
  message("Se l'indirizzo è associato a un account, riceverai un'email con il collegamento per impostare la password. Controlla anche lo spam.");
 }catch(error){
  // Avoid user enumeration; only show operational errors generically.
  message("Non è stato possibile inviare il messaggio. Verifica la configurazione degli URL di reindirizzamento Supabase o riprova più tardi.",true);
 }finally{button.disabled=false;}
}
async function setPassword(event){
 event.preventDefault();
 if(!verifiedCallback){view("request");message("Apri il collegamento ricevuto tramite email per impostare la password.",true);return;}
 const password=$("credentialPassword").value,confirm=$("credentialPasswordConfirm").value;
 if(password.length<12||password!==confirm){
  message("La password deve avere almeno 12 caratteri e coincidere in entrambi i campi.",true);return;
 }
 const button=$("credentialSave");button.disabled=true;message("Salvataggio password…");
 try{
  const {error}=await client.auth.updateUser({password});
  if(error)throw error;
  verifiedCallback=false;$("credentialSetForm").reset();
  await client.auth.signOut();
  view("success");message("Password impostata correttamente.");
 }catch(error){
  message("Non è stato possibile aggiornare la password: "+(error.message||"riprova o richiedi un nuovo link")+".",true);
 }finally{button.disabled=false;}
}
async function init(){
 view("request");
 $("credentialRequestForm").addEventListener("submit",sendLink);
 $("credentialSetForm").addEventListener("submit",setPassword);
 if(!window.supabase?.createClient){message("Servizio autenticazione non disponibile. Ricarica la pagina.",true);return;}
 client=window.supabase.createClient(URL_SUPABASE,PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 if(urlError){
  message("Il collegamento ricevuto risulta scaduto o non valido. Puoi richiederne uno nuovo qui sotto.",true);return;
 }
 if(callback)await acceptLink();
}
init();
})();