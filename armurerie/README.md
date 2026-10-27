## Prezzo al venditore al netto dei grassi — 27 ottobre 2026

Nel simulatore riservato il prezzo originale di acquisto resta distinto da una **offerta teorica al netto dei grassi**. Accanto a ciascuna offerta per modello e al totale della fornitura viene mostrato, fra parentesi o sotto il prezzo, il corrispettivo d'acquisto meno $8 per grasso. Per il totale si usa la quantità di grassi selezionata (automatica al 15% oppure manuale); per ciascun modello si usano i grassi prudenziali consigliati al 15%, considerando condizione e riparazioni già effettuate dei singoli esemplari. Con più armi per modello, il valore unitario mostrato è una **media indicativa**, non un prezzo specifico per ogni arma. Le armi non garantite recuperabili vengono segnalate: se un modello è interamente non recuperabile, non si presenta un'offerta netta calcolata dal numero zero di grassi.

Il suggerimento si ferma a **$0** se il costo dei grassi supera l'importo di acquisto, mostrando la parte eccedente. **È esclusivamente un riferimento per negoziare con il venditore**, non un ribasso automaticamente approvato: l'offerta attiva, la spesa prevista, ROI/profitto e il trasferimento agli Ordini restano basati sui prezzi effettivamente inseriti. Non si sottrae due volte il costo dei grassi. Non si modificano tariffe riservate, dati Supabase o ordini esistenti.

## Correzione grasso per armi — 26 ottobre 2026

Nuova informazione dello staff: ogni grasso costa **$8** e ripristina casualmente **15–20 punti percentuali** della condizione (non sempre 20). La soglia blip rimane 90%, e ogni esemplare può subire massimo **5 riparazioni totali**, comprese quelle precedenti. Non assumere alcuna distribuzione uniforme: i due estremi sono scenari, non probabilità né valori medi.

- **Prudente (15% per grasso):** scenario usato per preventivi, quantità automatica di grassi, ricavo, profitto, ROI, margine, obiettivi commerciali e massimo prezzo d'acquisto. È una stima per difetto dei risultati raggiungibili quando ci sono abbastanza grassi e riparazioni residue. Un'arma che richiede più interventi del limite non è **garantita** esportabile; potrebbe riuscire con riparazioni più favorevoli.
- **Favorevole (20% per grasso):** scenario ipotetico separato nel riepilogo, con *gli stessi grassi acquistati* e *gli stessi costi*. Mostra quante armi/ricavi/profitti sarebbero possibili se tutte le applicazioni rendessero il massimo. Se l'algoritmo di assegnazione dei grassi suggerisce una combinazione meno redditizia, si conserva almeno la combinazione praticabile nello scenario prudente.
- **Riparazioni individuali:** indicano il numero di grassi richiesti negli estremi, oppure distinguono le armi solo potenzialmente recuperabili da quelle impossibili persino al 20% entro il limite di 5.
- **Trasferimento agli Ordini:** invia unicamente la spesa prudenziale calcolata per i grassi (selezionata dall'utente), separata dal prezzo dovuto al fornitore. Dopo riparazioni effettive, aggiornare il costo reale e le condizioni delle singole armi, perché l'esito randomico non è prevedibile.

Nessuna tabella Supabase o tariffa blip riservata viene modificata da questa correzione. Le tariffe rimangono protette e sono lette nel browser solo dopo autorizzazione RLS.

## Modifica completa delle forniture — 25 ottobre 2026

Le schede di **Ordini** e **Archivio** dispongono ora del pulsante `Modifica ordine` al posto del precedente `Modifica costi`. Il modulo precompilato consente di modificare fornitore, tipologia del fornitore, modelli delle armi, quantità di ogni modello, prezzo unitario indicativo, prezzo totale effettivamente pagato, spese aggiuntive, stato e note. Il comando `Applica al prezzo totale` consente di riportare la somma delle righe nel campo pagamento; se il prezzo è stato negoziato diversamente, si inserisce manualmente la cifra effettiva, che **non deve essere sovrascritta**.

Il salvataggio fa `UPDATE` della stessa riga `vauclair_shared_orders`, preservando `id` e `created` e aggiungendo `edited_at` per mostrare l'ultima modifica nella scheda. Non elimina o duplica le righe: cambiare da 35 Evans a 35 Henry aggiornando il costo da $7.875 a $7.700 mantiene lo storico dello stesso ordine e ricalcola ricavo e profitto blip sulla base dei nuovi modelli. Il salvataggio passa dal controllo RLS già esistente e applica la condizione ottimistica `updated_at` per evitare che Daniel e Vivian sovrascrivano modifiche contemporanee. In caso di errore i dati compilati rimangono nel modulo. L'editor si usa anche su forniture già ricevute; cambiare lo stato sposta la scheda nella vista appropriata.

## Archivio delle forniture ricevute — 25 ottobre 2026

La pagina **`archivio.html`** usa la stessa grafica, autenticazione Supabase e archivio `public.vauclair_shared_orders` della pagina `ordini.html`. **Non è un secondo archivio:** `ordini.html` mostra gli ordini con stato diverso da `Ricevuto`, `archivio.html` mostra solo quelli con stato `Ricevuto`. Cambiare lo stato sposta l'ordine fra le due viste, senza duplicarlo né cancellarlo. L'Archivio mostra le schede complete con costi, ricavi previsti, profitti, note e pulsanti di modifica; in alto riassume ordini ricevuti, numero di armi e profitto complessivo stimato. Il profitto non va interpretato come incasso già realizzato.

Daniel e Vivian entrano nell'Archivio tramite il nuovo pulsante di navigazione; l'accesso resta sotto RLS e verifica esplicita di `vauclair_private_members`. Se manca la sessione, il collegamento `riservata.html?dest=archivio` effettua login e ritorno soltanto dopo l'autorizzazione. Le notifiche locali di stato “Ricevuto” rimandano alla nuova pagina. Il backup completo contiene anche gli ordini non ricevuti.

## Ordini condivisi Daniel / Vivian — dal 23 ottobre 2026

`ordini.html` è ora un archivio **privato e condiviso**, non più uno storico soltanto locale. Il client usa l'autenticazione Supabase esistente e prima di mostrare qualunque ordine verifica `vauclair_private_members`; la tabella `public.vauclair_shared_orders` applica RLS a lettura, inserimento, modifica ed eliminazione per i soli membri approvati. La tabella ha privilegi `SELECT, INSERT, UPDATE, DELETE` per `authenticated` (nessun accesso `anon`, `PUBLIC`, `TRUNCATE` o `TRIGGER`). La pubblicazione `supabase_realtime` include esclusivamente questa nuova tabella per l'aggiornamento fra i due account. Sono previsti anche aggiornamento manuale, all'attivazione della scheda e polling ogni 20 secondi.

La prima apertura **autenticata dal browser che contiene lo storico vecchio** importa automaticamente i record da `localStorage` alla nuova tabella. L'importazione salta ID già presenti (idempotente), salva un marker locale soltanto dopo risposta positiva e mantiene il vecchio archivio come backup. Ogni nuova operazione viene confermata da Supabase; in caso di errore la pagina non sostiene che sia stata salvata. `Esporta backup` esporta il registro condiviso. Le notifiche della campanella continuano invece a essere personali al browser e non costituiscono il registro condiviso.

Il riepilogo mostra **prezzo d'acquisto**, **eventuali altre spese**, **ricavo di esportazione previsto** e **profitto netto stimato = ricavo blip − acquisto − altre spese**, con i prezzi di esportazione letti esclusivamente dopo login/RLS da `vauclair_export_prices`. Nessuna tariffa è inserita nel JavaScript pubblico o negli ordini condivisi. Gli ordini già registrati hanno `expenses=0` per compatibilità; il nuovo modulo consente di indicare grassi, trasporto e commissioni e il pulsante `Modifica ordine` permette di correggere anche modelli, quantità e prezzi delle forniture esistenti. Il ricavo presuppone tutte le armi a condizione esportabile ≥90% e attualmente usa le tariffe correnti: non è un incasso realizzato. Se un'arma non ha una tariffa approvata, non si presenta un profitto fuorviante.

La pagina Ordini e la pagina Archivio non contengono moduli di login aggiuntivi: chi non è autenticato usa `riservata.html?dest=ordini` oppure `riservata.html?dest=archivio`, ritornando alla pagina corretta dopo login e verifica dei permessi.

# Vauclair Armurerie

Sito commerciale distinto dal gestionale originale **Tenuta Vauclair**. Tutti i file di questa attività risiedono in `armurerie/`: il sito Armeria/Ranch nella radice del repository non va modificato per questa attività.

- **Listino acquisti:** `index.html`, prezzi di acquisto pubblici per 11 armi attualmente disponibili (gli altri 11 modelli restano archiviati e nascosti fino al rilascio), categorie richiudibili, ricerca, filtri, quantità e carrello.
- **Ordini:** `ordini.html`, forniture attive condivise e riservate. **Archivio:** `archivio.html`, ordini ricevuti, con riepiloghi e profitto stimato.
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
- L'accesso al registro è gestito da una lista esplicita di account autorizzati tramite UUID Supabase; si può abilitare separatamente un secondo account per Vivian senza condividere le credenziali. Fino all'inserimento nel database, l'account aggiuntivo non può accedere ai prezzi, anche se è già registrato. Gli altri account rimangono esclusi.
- La chiave `sb_publishable_` utilizzata nel frontend è pubblica per definizione; **non usare mai service_role né altre chiavi segrete nei file GitHub**.

### Accesso proprietario già attivato

L'account proprietario iniziale è risultato **email confermata** ed è già presente tra i membri autorizzati. Aprire **Registro** dalla navigazione Armurerie ed effettuare l'accesso con le credenziali personali dell'account autorizzato. L'eventuale secondo utente va prima creato in Supabase Auth e poi autorizzato in `vauclair_private_members`.

L'email di conferma ricevuta inizialmente non ha riportato alla pagina per via della configurazione di redirect del progetto, ma l'account è già confermato lato Supabase. Se un giorno si vorrà riattivare la registrazione da questa interfaccia, prima configurare i redirect dell'applicazione in Supabase > Authentication > URL Configuration.

Per revocare l'accesso si elimina il membro autorizzato dal database. Non abilitare policy di INSERT/UPDATE/DELETE per i ruoli `anon` o `authenticated`.

## Simulatore di forniture (area privata)

La pagina `riservata.html` contiene ora un simulatore integrato, che si attiva solo dopo accesso Supabase autorizzato e lettura RLS delle tariffe staff. Consente aggiunta rapida dei modelli, quantità 0–999, offerte per arma (slider e importo esatto), preset Vauclair/prezzo pieno/sconti 5% e 10%, distribuzione proporzionale di un budget globale con residuo di arrotondamento esplicito, profitto lordo, rendimento sulla spesa e margine sul ricavo, obiettivo di profitto e ROI minimo. Il trasferimento verso Ordini passa ID, quantità, prezzi negoziati e il **solo costo totale dei grassi** in `sessionStorage` temporaneo (non trasmette i ricavi al blip): il costo di manutenzione viene inserito nelle spese aggiuntive, **non nel prezzo delle armi**. Rimangono intatti prezzi e ordini già salvati. Il calcolo usa centesimi interi. Include ora la manutenzione: esportazione consentita da **90% di condizione**, ciascun grasso costa **$8** e ripristina **un valore casuale tra 15 e 20 punti percentuali** per utilizzo. **Ogni singola arma ammette massimo 5 riparazioni complessive nell'intera sua vita**: il simulatore consente di inserire la condizione iniziale (0–100%) e le riparazioni già effettuate (0–5), sia come valori comuni per modello sia personalizzando ogni esemplare nel pannello a pagine da 20 armi. La stima dei grassi considera solo gli esemplari recuperabili fino alla soglia del 90%, senza superare il limite residuo per ciascuno. Le armi non recuperabili rimangono nel costo d'acquisto ma non generano ricavo di esportazione. Se si acquistano meno grassi di quelli necessari, si considerano esportabili solo gli esemplari effettivamente coperti, dando precedenza a quelli che richiedono meno grassi e, a parità, ai modelli con ricavo di esportazione maggiore; eventuali grassi in eccesso restano una spesa senza beneficio sui ricavi. Valori iniziali: 100% e zero riparazioni precedenti. Per le forniture con esemplari diversi si usano i dettagli individuali. Il riepilogo separa costo armi, numero/costo grassi, investimento complessivo, profitto **dopo manutenzione**, ROI e margine sul ricavo. Gli obiettivi di guadagno e il limite massimo negoziabile sottraggono già il costo dei grassi. Lo slider budget distribuisce **solo** il budget d'acquisto delle armi, senza includere i materiali.
 
L'importo trasferito a Ordini è soltanto quanto concordato con il fornitore per le armi: i costi di manutenzione non vengono addebitati alle armerie. Le condizioni e la storia delle riparazioni possono differire fra esemplari; è responsabilità dell'acquirente verificare questi dati. Solo le armi che possono arrivare al 90% rispettando il limite di 5 riparazioni vengono conteggiate nel ricavo stimato. Il trasferimento al registro Ordini mantiene quantità e prezzi concordati e porta il costo dei grassi stimato nel campo **Spese aggiuntive** (separato dal prezzo dovuto al fornitore), ma non trasferisce lo storico riparazioni simulato o le tariffe riservate. Non sono inclusi ulteriori costi (trasporto, ecc.).

Moduli: `simulatore-core.js` (formule), `simulatore.js` (interfaccia riservata), `simulatore.css` (stile). Nessuna tariffa export è hardcoded nei sorgenti GitHub.

## Attivazione account e recupero password

La pagina `accesso.html` gestisce in modo indipendente il primo accesso degli account familiari già invitati e il recupero delle password. `accesso.js` usa esclusivamente la chiave pubblicabile Supabase: invia una email tramite `resetPasswordForEmail` specificando `redirectTo: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/accesso.html`, e consente `updateUser({password})` esclusivamente dopo il collegamento autenticato e la conferma di appartenenza alla tabella privata con RLS. La procedura **non crea utenti né autorizza nuovi account**, e non espone tariffe o credenziali riservate.

**Configurazione necessaria su Supabase Dashboard → Authentication → URL Configuration:** aggiungere fra i Redirect URLs autorizzati l’indirizzo ESATTO `https://dannyvauclair.github.io/tenuta-vauclair/armurerie/accesso.html` (senza wildcard). Non è necessario cambiare il Site URL principale del progetto Supabase condiviso con altri servizi. I vecchi link di invito con redirect errato possono essere sostituiti da un nuovo link inviato direttamente dalla pagina `accesso.html`, dopo la configurazione.

## Ordini

Ordini e Archivio usano Supabase con RLS e accesso condiviso fra Daniel e Vivian. Il vecchio localStorage è importato una sola volta, senza cancellare il backup. Il carrello dal listino agli ordini passa tramite sessionStorage.

## Grafica

Fogli condivisi `styles.css`: bordeaux scuro, ottone brunito, dettagli e tipografia ispirati alla Tenuta, ma identità propria **Vauclair Armurerie**. La disposizione del listino e degli ordini non è stata cambiata.

## File

- `index.html`, `ordini.html`, `archivio.html`, `riservata.html`, `accesso.html`: le pagine del sito, archivio e credenziali.
- `styles.css` e `ornamenti.css`: stile condiviso, fregi oro e icone. La voce di navigazione corrente non ha più una sottolineatura.
- `catalogo.js`: prezzi d’acquisto e storico di 22 modelli; ne vengono mostrati 11 attualmente disponibili.
- `listino.js`: catalogo, quantità, categorie, carrello.
- `ordini.js`: gestione degli ordini condivisi su Supabase, con filtro di stato automatico fra Ordini e Archivio.
- `riservata.js`: autenticazione, controllo permessi e visualizzazione sicura delle tariffe via Supabase.
- `notifiche.js`: notifiche del browser; quelle relative agli ordini Ricevuti rimandano all’Archivio (le notifiche non sono ancora sincronizzate fra browser).
