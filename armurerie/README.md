# Vauclair Armurerie

Sito commerciale distinto dal gestionale originale **Tenuta Vauclair**. Tutti i file di questa attività risiedono in `armurerie/`: il sito Armeria/Ranch nella radice del repository non va modificato per questa attività.

- **Listino acquisti:** `index.html`, prezzi di acquisto pubblici per 22 armi, categorie richiudibili, ricerca, filtri, quantità e carrello.
- **Ordini:** `ordini.html`, registro locale con fornitori, forniture, stati e backup JSON.
- **Registro privato esportazioni:** `riservata.html`, login Supabase e dati del blip visibili **esclusivamente ad account approvati**. La pagina non è nella navigazione pubblica, ma URL e HTML sono comunque pubblici: la protezione vera è la Row Level Security del database.

Sito pubblico: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/

Registro riservato: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/riservata.html

## Fonte unica dei prezzi

Google Sheet: https://docs.google.com/spreadsheets/d/1pEC4RjsqgQCZQZ_U5X3WPfLgKRsNNuv_4CkFL8Se4tU/edit

Scheda principale: **01 - Proposta commerciale**.

I 22 prezzi massimi d'acquisto pubblici sono in `catalogo.js`. Solo in Supabase sono disponibili le 22 tariffe proposte per il blip e i relativi margini (non pubblicare tariffe o margini direttamente in HTML, JavaScript, repository, README o localStorage).

Qualità delle basi di costo: **11 reali, 4 ricostruite con ricette storiche, 4 stime per confronto e 3 analogie**. Il vecchio calcolo universale sull'Evans è stato eliminato. Per le 11 armi non ancora rilasciate i valori restano provvisori.

**Il +120% per le esportazioni è una proposta economica allo staff e NON una tariffa già approvata nel gioco.**

## Sicurezza registro esportazioni

Backend: Supabase (progetto esistente Wildlands, tabelle nuove e isolate dal sistema della mappa tesori).

- `public.vauclair_export_prices`: 22 valori privati. SELECT soltanto agli utenti autenticati che compaiono nella tabella di accesso.
- `public.vauclair_private_members`: elenco degli UUID Supabase abilitati. Nessun utente pubblico o autenticato può autoaggiungersi o modificare le tariffe; per gli utenti non approvati le policy RLS restituiscono zero righe.
- Le tabelle sono state create senza membri iniziali: **nessuno può vedere i prezzi finché il proprietario non viene esplicitamente autorizzato**.
- La chiave `sb_publishable_` utilizzata nel frontend è pubblica per definizione; **non usare mai service_role né altre chiavi segrete nei file GitHub**.

### Attivazione account proprietario (una volta sola)

1. In Supabase > Authentication > URL Configuration, aggiungere tra i redirect consentiti `https://dannyvauclair.github.io/tenuta-vauclair/armurerie/riservata.html` (per confermare l'email e tornare alla pagina).
2. Aprire il registro privato, scegliere **Registrati**, inserire la propria email/password e confermare l'email se richiesto. **Non condividere mai la password**.
3. Una volta autenticato, appare il proprio UUID nella schermata “In attesa di autorizzazione”; copiare l'UUID e comunicarlo all'amministratore.
4. L'amministratore inserisce esclusivamente quell'UUID in `public.vauclair_private_members`, dopo aver verificato che appartenga al proprietario. Quindi premere **Verifica di nuovo**: la pagina mostra i prezzi.

Per revocare l'accesso si elimina il membro autorizzato dal database. Non abilitare policy di INSERT/UPDATE/DELETE per i ruoli `anon` o `authenticated`.

## Ordini

La pagina Ordini utilizza ancora il **localStorage del browser**; non è sincronizzata tra giocatori e non condivide il sistema di accesso della pagina esportazioni. Il carrello dal listino agli ordini si trasferisce tramite sessionStorage.

## Grafica

Fogli condivisi `styles.css`: bordeaux scuro, ottone brunito, dettagli e tipografia ispirati alla Tenuta, ma identità propria **Vauclair Armurerie**. La disposizione del listino e degli ordini non è stata cambiata.

## File

- `index.html`, `ordini.html`, `riservata.html`: le tre pagine.
- `styles.css`: stile condiviso.
- `catalogo.js`: **solo** i 22 prezzi pubblici di acquisto.
- `listino.js`: catalogo, quantità, categorie, carrello.
- `ordini.js`: gestione locale ordini.
- `riservata.js`: autenticazione, controllo permessi e visualizzazione sicura delle tariffe via Supabase.
- `notifiche.js`: campanella notifiche del registro ordini locale.
