# Vauclair Armurerie — dossier per Wildlands 1900

Sito di presentazione autonomo nella directory /armurerie/ del repository della Tenuta Vauclair.

## Scopo

Presentare allo staff un'attività custom di acquisto di sole armi da fuoco da armerie, privati e banchi dei pegni, con esportazione a un blip dedicato. Il progetto è una proposta, non una meccanica attiva o approvata.

## File

- index.html — presentazione, RP, filiera, bilanciamento e catalogo.
- styles.css — stile storico/armurerie, responsive.
- app.js — 22 prezzi di riferimento e simulatore locale di forniture.

Il logo e lo sfondo riutilizzano i file già pubblici nel sito Tenuta Vauclair:
- ../assets/vauclair-logo.webp
- ../assets/vauclair-background.webp

Nessun database, tracciamento o server: è un sito statico. I calcoli del simulatore avvengono nel browser, senza inviare dati.

## Economia e fonte dei prezzi

Fonte: Google Sheet **Wildlands Proiezione Prezzi**, scheda **01 - Proposta commerciale**, verificato il 12 ottobre 2026.

- Compra all'ingrosso indicativamente all'85% del prezzo pubblico; ove il margine del fornitore sarebbe troppo basso, si corregge rispetto al costo prudenziale e si arrotonda ai 5 dollari più vicini.
- Il blip proposto riconosce il prezzo di riferimento × 2,20 (+120% di ricarico).
- 11 armi hanno costi e prezzi al pubblico attuali verificati: https://github.com/DannyVauclair/tenuta-vauclair/blob/main/vauclair-production-costs.js e https://github.com/DannyVauclair/tenuta-vauclair/blob/main/index.html
- 8 armi usano stime da precedente wipe (+41,88% sul costo/valore ricavato dall'Evans).
- 3 armi sono analogie non verificate: Navy Crossover, Volcanic, Bolt Action.

Il catalogo è un **listino proposto**, non il prezzo di un blip esistente. Il blip del server non si aggiorna automaticamente da questo sito.

Il simulatore include esempi con prezzi all'ingrosso e a prezzo pieno, ma non rappresenta volumi o ricavi garantiti. Il sistema con prezzo del blip superiore al retail crea incentivo all'acquisto/produzione per export; questa conseguenza va discussa apertamente con lo staff.

## Aggiornamenti

Per cambiare i prezzi mostrati sul sito, modificare l'array \`DATA\` in app.js e mantenere il controllo: \`blip = buy × 2.2\`.

## Pubblicazione

Se GitHub Pages del repository è configurato per distribuire la radice del branch main, il percorso previsto è:

https://dannyvauclair.github.io/tenuta-vauclair/armurerie/

L'URL sotto /armurerie/ è una pagina **separata per contenuto**, ma non un repository GitHub indipendente. Per un indirizzo autonomo del tipo /vauclair-armurerie/ occorrerebbe creare un nuovo repository e configurare GitHub Pages in quel repository.
