# Vauclair Armurerie · Maison Française

Sito **dell'attività commerciale RP** Vauclair Armurerie, separato dal gestionale Tenuta Vauclair. La homepage non è un dossier di proposta per lo staff: si presenta ai giocatori come vetrina della Maison.

## Pagine

- \`index.html\` — vetrina commerciale: identità della Maison, acquisto armi, forniture, personalizzazioni, contatti.
- \`registro.html\` — banco commerciale: registro acquisti, commissioni ed esportazioni, statistiche, stati, note, esportazione CSV e backup JSON.
- \`catalogo.js\` — prezzi di riferimento di acquisto delle 22 armi, senza prezzi blip né margini di esportazione.
- \`app.js\` — selezione armi, quotazione orientativa, preparazione e copia del messaggio RP.
- \`registro.js\` — registro locale con filtro, creazione pratiche, aggiornamenti, duplicazione, cancellazione, CSV, backup e importazione.
- \`styles.css\` — grafica responsive in stile Vauclair.
- Immagini riutilizzate dal repository Tenuta Vauclair: \`../assets/vauclair-logo.webp\` e \`../assets/vauclair-background.webp\`.

## Cosa funziona già

1. I giocatori possono consultare il listino, filtrare i modelli, selezionare quantità, comporre una distinta e preparare un messaggio RP per Daniel.
2. Per motivi di trasparenza, le richieste **non vengono spedite automaticamente**: occorre copiarle e inviarle manualmente tramite i canali RP o Discord utilizzati dai giocatori.
3. Il banco commerciale permette a Daniel di registrare realmente, **sul dispositivo corrente**, pratiche e movimenti, conservandoli con localStorage. È possibile esportare un backup e reimportarlo.
4. Il prezzo del blip **non viene mostrato pubblicamente**. Nel banco commerciale il prezzo delle esportazioni si inserisce manualmente; non viene simulato un blip approvato.
5. La vetrina distingue i **11 modelli** con prezzi/costi attuali dai **8 stimati** e dai **3 ipotizzati per analogia**. Per i modelli non confermati indica "da concordare", non una falsa quotazione certa.

## Limiti da risolvere prima dell'attivazione collettiva

- Nessun database condiviso è connesso a queste pagine. localStorage è visibile soltanto nel proprio browser e può essere cancellato dal browser stesso. Il backup consente la migrazione manuale. Nessun ordine inviato da un altro utente entra automaticamente nel banco commerciale.
- Il registro **non è protetto da autenticazione**, perché è una demo locale statica. Non inserire dati sensibili veri o segreti nel prototipo. Prima di abilitare un registro condiviso occorrono database dedicato, ruoli e permessi lato server.
- Prezzi e possibilità di skin/blip sono ancora soggetti al regolamento e all'approvazione dello staff.
- Il file \`catalogo.js\` si può aggiornare quando i nuovi modelli diventano effettivamente craftabili.

## Prezzi e origine

Fonte: Google Sheet "Wildlands Proiezione Prezzi", tab "01 - Proposta commerciale" (12 ottobre 2026). Le valutazioni partono da circa l'85% del prezzo retail, con correzioni prudenziali. Questo è **il listino di acquisto**, non di vendita ai clienti.

Il moltiplicatore export discusso (+120%) e i prezzi del blip sono **omessi dal sito pubblico**: rimangono oggetto di trattativa con lo staff.

## Indirizzo

Con GitHub Pages attivo sulla radice del ramo \`main\`:

https://dannyvauclair.github.io/tenuta-vauclair/armurerie/

Questa è una sezione del repository Tenuta Vauclair, non ancora un repository indipendente. Il gestionale esistente alla radice del repository non è stato modificato.
