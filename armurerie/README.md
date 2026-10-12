# Vauclair Armurerie

Un unico sito della Maison Vauclair, con due pagine essenziali:

- **Listino acquisti** (\`index.html\`): tutte le 22 armi da fuoco, prezzo indicativo di acquisto Vauclair, ricerca, categorie e selezione delle quantità.
- **Ordini** (\`ordini.html\`): creazione di forniture, fornitore/controparte, armi e quantità, prezzo concordato, elenco ordini, modifica dello stato (Da valutare, Confermato, In corso, Ricevuto, Annullato) e backup JSON.

Dal listino, il pulsante **Continua negli Ordini** apre la pagina Ordini con la distinta delle armi già inserita.

## Indirizzo unico del sito

https://dannyvauclair.github.io/tenuta-vauclair/armurerie/

La pagina Ordini è una sezione interna dello stesso sito, non un secondo progetto o dominio. Nessuna modifica al gestionale Tenuta Vauclair nella radice del repository.

## Listino e proiezioni

I prezzi sono i valori del Google Sheet “Wildlands Proiezione Prezzi”, tab “01 - Proposta commerciale”, preparati a partire dal tab “Proiezione costi”.

- 11 armi: il costo attuale è consultabile dal file \`vauclair-production-costs.js\` del repository Tenuta Vauclair.
- 8 armi: costo stimato applicando il moltiplicatore **176,50 / 124,40 = 1,418810289**, ossia +41,88% rispetto al wipe precedente. Per prudenza, tra costo attuale e costo proiettato è stato preso il maggiore.
- 3 armi senza dato storico sufficiente: Navy Crossover, Volcanic, Bolt Action; prezzi proposti mediante analogia con armi comparabili.

Il prezzo d'acquisto all'ingrosso nasce da circa l'85% del prezzo pubblico di riferimento, corretto per remunerare il costo prudenziale del produttore. Le stime sono contrassegnate sulla pagina. Tutti i 22 modelli hanno un prezzo d'acquisto indicativo.

**Non vengono pubblicati né il prezzo del blip export né i margini del proprietario**: è un sito commerciale destinato ai fornitori/giocatori.

## Limitazioni dell'attuale versione Ordini

Il registro è utilizzabile, ma gli ordini sono salvati soltanto nel **localStorage del browser locale**: non si sincronizzano tra dispositivi o dipendenti. Il comando “Esporta backup” salva un file JSON come copia, ma non è ancora prevista la reimportazione nell'interfaccia. Non ci sono login o database condivisi. Per la gestione condivisa servirà un backend con autenticazione e permessi adeguati; non riutilizzare il database del sito della Tenuta senza un accordo esplicito.

I dati del carrello vengono trasferiti temporaneamente dal listino agli ordini nello stesso browser/tab tramite sessionStorage. Il prezzo di ciascuna arma è fotografato quando si registra l'ordine, mentre il prezzo totale può essere modificato per riflettere una trattativa.

## Struttura

- \`index.html\` e \`ordini.html\` — due pagine dello stesso sito
- \`styles.css\` — grafica condivisa, stile Maison Vauclair
- \`catalogo.js\` — 22 prezzi di acquisto e origine (attuale/proiezione/ipotesi)
- \`listino.js\` — filtri, selezione e trasferimento delle quantità agli Ordini
- \`ordini.js\` — salvataggio locale, stati, ricerca e backup
