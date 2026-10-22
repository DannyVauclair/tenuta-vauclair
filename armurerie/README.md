# Vauclair Armurerie

Sito commerciale distinto dal gestionale originale **Tenuta Vauclair**. Tutti i file di questa attività risiedono in `armurerie/`: il sito Armeria/Ranch nella radice del repository non va modificato per questa attività.

- **Listino acquisti:** `index.html`, prezzi di acquisto pubblici per 11 armi attualmente disponibili (gli altri 11 modelli restano archiviati e nascosti fino al rilascio), categorie richiudibili, ricerca, filtri, quantità e carrello.
- **Ordini:** `ordini.html`, registro locale con fornitori, forniture, stati e backup JSON.
- **Registro esportazioni:** `riservata.html`, terza voce della navigazione Armurerie. L'indirizzo è pubblico e mostra una schermata di accesso, ma **le tariffe del blip sono leggibili unicamente dall'account proprietario** grazie alla Row Level Security Supabase.

Sito pubblico: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/

Registro riservato: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/riservata.html

## Fonte unica dei prezzi

Google Sheet: https://docs.google.com/spreadsheets/d/1pEC4RjsqgQCZQZ_U5X3WPfLgKRsNNuv_4CkFL8Se4tU/edit

Scheda principale: **01 - Proposta commerciale**.

I 22 modelli originali rimangono in `catalogo.js` per preservare i riferimenti degli ordini già registrati, ma solo 11 con `tag: "attuale"` sono disponibili nei nuovi acquisti. Il registro privato mostra solo le 11 tariffe confermate dallo staff; le altre 11 sono disabilitate nel database (blip_price = 0) fino al rilascio. Non pubblicare tariffe o margini direttamente in HTML, JavaScript, repository, README o localStorage.

Qualità delle basi di costo: **11 reali, 4 ricostruite con ricette storiche, 4 stime per confronto e 3 analogie**. Il vecchio calcolo universale sull'Evans è stato eliminato. Le 11 armi non ancora rilasciate non sono acquistabili o esportabili nel sito e non mostrano tariffe proiettate.

**Le 11 tariffe attive sono state approvate dallo staff il 22 ottobre 2026** e sono consultabili solo tramite l’area privata. Il foglio Google conserva per ora le simulazioni storiche al +150% e +120%; non è il listino operativo. L’esportazione riguarda solo armi integre.

## Sicurezza registro esportazioni

Backend: Supabase (progetto esistente Wildlands, tabelle nuove e isolate dal sistema della mappa tesori).

- `public.vauclair_export_prices`: 22 righe (11 quotazioni approvate, 11 modelli futuri disabilitati con blip_price=0). SELECT soltanto agli utenti autenticati che compaiono nella tabella di accesso.
- `public.vauclair_private_members`: elenco degli UUID Supabase abilitati. Nessun utente pubblico o autenticato può autoaggiungersi o modificare le tariffe; per gli utenti non approvati le policy RLS restituiscono zero righe.
- Un solo account è stato verificato tramite conferma email e autorizzato nel database. L'accesso ai prezzi è negato a tutti gli altri account, anche se registrati.
- La chiave `sb_publishable_` utilizzata nel frontend è pubblica per definizione; **non usare mai service_role né altre chiavi segrete nei file GitHub**.

### Accesso proprietario già attivato

L'unico account registrato è risultato **email confermata** ed è già presente tra i membri autorizzati. Aprire **Registro** dalla navigazione del sito Armurerie ed effettuare il login con l'email e la password già utilizzate: non occorre una seconda registrazione né un nuovo link di conferma.

L'email di conferma ricevuta inizialmente non ha riportato alla pagina per via della configurazione di redirect del progetto, ma l'account è già confermato lato Supabase. Se un giorno si vorrà riattivare la registrazione da questa interfaccia, prima configurare i redirect dell'applicazione in Supabase > Authentication > URL Configuration.

Per revocare l'accesso si elimina il membro autorizzato dal database. Non abilitare policy di INSERT/UPDATE/DELETE per i ruoli `anon` o `authenticated`.

## Simulatore di forniture (area privata)

La pagina `riservata.html` contiene ora un simulatore integrato, che si attiva solo dopo accesso Supabase autorizzato e lettura RLS delle tariffe staff. Consente aggiunta rapida dei modelli, quantità 0–999, offerte per arma (slider e importo esatto), preset Vauclair/prezzo pieno/sconti 5% e 10%, distribuzione proporzionale di un budget globale con residuo di arrotondamento esplicito, profitto lordo, rendimento sulla spesa e margine sul ricavo, obiettivo di profitto e ROI minimo. Il trasferimento verso Ordini passa esclusivamente ID, quantità e prezzi negoziati in `sessionStorage` temporaneo (non trasmette i ricavi al blip), lasciando intatti i prezzi e gli ordini già salvati. Il calcolo usa centesimi interi. Include ora la manutenzione: esportazione consentita da **90% di condizione**, ciascun grasso costa **$8** e ripristina **20 punti percentuali** per utilizzo. Per ogni modello si può indicare una condizione iniziale uniforme (predefinita 100%): vengono suggeriti i grassi necessari, moltiplicati per le quantità. La quantità effettivamente acquistata è modificabile manualmente; il sistema segnala se risulta inferiore a quella consigliata. Il riepilogo separa costo armi, numero/costo grassi, investimento complessivo, profitto **dopo manutenzione**, ROI e margine sul ricavo. Gli obiettivi di guadagno e il limite massimo negoziabile sottraggono già il costo dei grassi. Lo slider budget distribuisce **solo** il budget d'acquisto delle armi, senza includere i materiali.
 
L'importo trasferito a Ordini è soltanto quanto concordato con il fornitore per le armi: i costi di manutenzione non vengono addebitati alle armerie. Le condizioni dei singoli pezzi possono differire; la stima per modello non sostituisce la verifica reale delle armi, che vanno portate almeno al 90% prima dell'esportazione. Non sono inclusi ulteriori costi (trasporto, ecc.).

Moduli: `simulatore-core.js` (formule), `simulatore.js` (interfaccia riservata), `simulatore.css` (stile). Nessuna tariffa export è hardcoded nei sorgenti GitHub.

## Ordini

La pagina Ordini utilizza ancora il **localStorage del browser**; non è sincronizzata tra giocatori e non condivide il sistema di accesso della pagina esportazioni. Il carrello dal listino agli ordini si trasferisce tramite sessionStorage.

## Grafica

Fogli condivisi `styles.css`: bordeaux scuro, ottone brunito, dettagli e tipografia ispirati alla Tenuta, ma identità propria **Vauclair Armurerie**. La disposizione del listino e degli ordini non è stata cambiata.

## File

- `index.html`, `ordini.html`, `riservata.html`: le tre pagine.
- `styles.css` e `ornamenti.css`: stile condiviso, fregi oro e icone. La voce di navigazione corrente non ha più una sottolineatura.
- `catalogo.js`: prezzi d’acquisto e storico di 22 modelli; ne vengono mostrati 11 attualmente disponibili.
- `listino.js`: catalogo, quantità, categorie, carrello.
- `ordini.js`: gestione locale ordini.
- `riservata.js`: autenticazione, controllo permessi e visualizzazione sicura delle tariffe via Supabase.
- `notifiche.js`: campanella notifiche del registro ordini locale.
