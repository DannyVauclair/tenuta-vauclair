# Vauclair Armurerie — sito commerciale

Un **unico sito pubblico**, con homepage, spiegazione dell'attività, listino acquisti e modulo per copiare una proposta commerciale. Tutto è contenuto in \`index.html\`; non ci sono altri gestionali o pagine secondarie.

Sito: https://dannyvauclair.github.io/tenuta-vauclair/armurerie/

## Cosa fa

- Presenta l'attività RP di Daniel Vauclair (acquisto ed esportazione di sole armi da fuoco).
- Mostra un **prezzo indicativo di acquisto per tutte le 22 armi**, incluse le non ancora disponibili.
- Evidenzia l'origine del prezzo: 11 costruiti da costi del wipe attuale, 8 da proiezione dei vecchi costi, 3 per analogia.
- Consente di filtrare le armi, selezionare le quantità e preparare una proposta commerciale da copiare e condividere via Discord/RP.

Il sito **non invia automaticamente richieste**, non crea ordini remoti e non mostra prezzi o margini del blip di esportazione. Il sito Tenuta Vauclair alla radice del repository non è stato modificato.

## Metodo dei prezzi

Sorgente: Google Sheet "Wildlands Proiezione Prezzi", schede "Proiezione costi" e "01 - Proposta commerciale"; costi attuali da \`vauclair-production-costs.js\` in questo repository.

Per l'Evans, il costo storico è $124,40 e quello attuale $176,50, con moltiplicatore **1,418810289** (+41,88%). Il medesimo incremento è applicato ai costi storici per le armi non ancora craftabili. Per armi craftabili oggi, il costo di riferimento è il maggiore tra il costo reale e quello proiettato. Per le tre armi senza dati passati (Navy Crossover, Volcanic, Bolt Action), sono state applicate analogie, da verificare.

Il prezzo di acquisto all'ingrosso è stato calcolato, nel foglio, come arrotondamento ai $5 più vicini del maggiore fra:
- 85% del prezzo pubblico reale o proiettato;
- costo prudenziale + il maggiore fra $5 e un quarto della differenza fra prezzo pubblico e costo prudenziale.

Tutti i prezzi indicati sul sito sono **proposte di acquisto**, non prezzi già autorizzati dallo staff. Per 11 armi i costi attuali sono verificati, ma i prezzi d'acquisto della nuova attività rimangono comunque prezzi da concordare.

Immagini del sito: \`../assets/vauclair-logo.webp\`, \`../assets/vauclair-background.webp\`.
