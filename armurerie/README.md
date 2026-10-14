# Vauclair Armurerie

Sito commerciale distinto dal gestionale originale **Tenuta Vauclair**. Tutti i file di questa attività risiedono in `armurerie/`: il sito Armeria/Ranch nella radice del repository non va modificato per questa attività.

- **Listino acquisti:** `index.html`, prezzi di acquisto pubblici per 22 armi, categorie richiudibili, ricerca, filtri, quantità e carrello.
- **Ordini:** `ordini.html`, registro locale con fornitori, forniture, stati e backup JSON.
- **Registro esportazioni:** `riservata.html`, terza voce della navigazione Armurerie. L'indirizzo è pubblico e mostra una schermata di accesso, ma **le tariffe del blip sono leggibili unicamente dall'account proprietario** grazie alla Row Level Security Supabase.

Sito pubblico: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/

Registro riservato: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/riservata.html

## Fonte unica dei prezzi

Google Sheet: https://docs.google.com/spreadsheets/d/1pEC4RjsqgQCZQZ_U5X3WPfLgKRsNNuv_4CkFL8Se4tU/edit

Scheda principale: **01 - Proposta commerciale**.

I 22 prezzi massimi d'acquisto pubblici sono in `catalogo.js`. Solo in Supabase sono disponibili le 22 tariffe proposte per il blip e i relativi margini (non pubblicare tariffe o margini direttamente in HTML, JavaScript, repository, README o localStorage).

Qualità delle basi di costo: **11 reali, 4 ricostruite con ricette storiche, 4 stime per confronto e 3 analogie**. Il vecchio calcolo universale sull'Evans è stato eliminato. Per le 11 armi non ancora rilasciate i valori restano provvisori.

**Il +150% sul prezzo d'acquisto di riferimento è la nuova proposta di esportazione allo staff, NON una tariffa già approvata nel gioco.** Il precedente +120% è mantenuto solo come confronto storico nel foglio di calcolo.

## Sicurezza registro esportazioni

Backend: Supabase (progetto esistente Wildlands, tabelle nuove e isolate dal sistema della mappa tesori).

- `public.vauclair_export_prices`: 22 valori privati. SELECT soltanto agli utenti autenticati che compaiono nella tabella di accesso.
- `public.vauclair_private_members`: elenco degli UUID Supabase abilitati. Nessun utente pubblico o autenticato può autoaggiungersi o modificare le tariffe; per gli utenti non approvati le policy RLS restituiscono zero righe.
- Un solo account è stato verificato tramite conferma email e autorizzato nel database. L'accesso ai prezzi è negato a tutti gli altri account, anche se registrati.
- La chiave `sb_publishable_` utilizzata nel frontend è pubblica per definizione; **non usare mai service_role né altre chiavi segrete nei file GitHub**.

### Accesso proprietario già attivato

L'unico account registrato è risultato **email confermata** ed è già presente tra i membri autorizzati. Aprire **Registro** dalla navigazione del sito Armurerie ed effettuare il login con l'email e la password già utilizzate: non occorre una seconda registrazione né un nuovo link di conferma.

L'email di conferma ricevuta inizialmente non ha riportato alla pagina per via della configurazione di redirect del progetto, ma l'account è già confermato lato Supabase. Se un giorno si vorrà riattivare la registrazione da questa interfaccia, prima configurare i redirect dell'applicazione in Supabase > Authentication > URL Configuration.

Per revocare l'accesso si elimina il membro autorizzato dal database. Non abilitare policy di INSERT/UPDATE/DELETE per i ruoli `anon` o `authenticated`.

## Ordini

La pagina Ordini utilizza ancora il **localStorage del browser**; non è sincronizzata tra giocatori e non condivide il sistema di accesso della pagina esportazioni. Il carrello dal listino agli ordini si trasferisce tramite sessionStorage.

## Grafica

Fogli condivisi `styles.css`: bordeaux scuro, ottone brunito, dettagli e tipografia ispirati alla Tenuta, ma identità propria **Vauclair Armurerie**. La disposizione del listino e degli ordini non è stata cambiata.

## File

- `index.html`, `ordini.html`, `riservata.html`: le tre pagine.
- `styles.css` e `ornamenti.css`: stile condiviso, fregi oro e icone. La voce di navigazione corrente non ha più una sottolineatura.
- `catalogo.js`: **solo** i 22 prezzi pubblici di acquisto.
- `listino.js`: catalogo, quantità, categorie, carrello.
- `ordini.js`: gestione locale ordini.
- `riservata.js`: autenticazione, controllo permessi e visualizzazione sicura delle tariffe via Supabase.
- `notifiche.js`: campanella notifiche del registro ordini locale.
