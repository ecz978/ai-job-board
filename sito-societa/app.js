// Demo, schede, strumenti, calcolatore, animazioni. Tutti i dati della demo sono fittizi.
// Le fasce di costo hardware e le ipotesi dei calcolatori sono indicative
// (fonti secondarie, ottobre 2026): sostituirle con i prezzi reali del distributore.

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);
const eur = (n) => Math.round(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurK = (n) => (Math.abs(n) >= 1000 ? (n / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " k€" : Math.round(n) + " €");
const pct = (x, d = 0) => (x * 100).toLocaleString("it-IT", { maximumFractionDigits: d }) + "%";
const rng = (a) => `${eur(a[0])} – ${eur(a[1])}`;
const mid = (a) => (a[0] + a[1]) / 2;
const num = (id) => parseFloat($(id).value) || 0;
const dec = (x, d = 1) => x.toLocaleString("it-IT", { maximumFractionDigits: d });

const prevTxt = {};
function flashDiff(id) {
  const root = $(id); if (!root || REDUCED) return;
  const els = [...root.querySelectorAll(".big, .box strong, .rs td:last-child, .range-bar + .range-scale")];
  const now = els.map((e) => e.textContent), prev = prevTxt[id];
  if (prev && prev.length === now.length) els.forEach((e, i) => { if (prev[i] !== now[i]) e.classList.add("flash"); });
  prevTxt[id] = now;
}

/* ═════════ Flusso passo per passo ═════════ */
const STEPS = ["Dati", "Lettura", "Riconoscimento", "Regole", "Bozza", "Verifica"];
const OK = (t) => `<span class="chip">${t}</span>`, WN = (t) => `<span class="chip warn">${t}</span>`, KO = (t) => `<span class="chip stop">${t}</span>`;
const CASI = {
  acq: [
    { titolo: "Richiesta di preventivo", canale: "Email · cliente", text: "Buongiorno, servono 40 sacchi di cemento 32.5, 12 mq di lastre di cartongesso da 13 mm e 6 profili 48 per mercoledì in cantiere a Monza. Mi mandate il prezzo? Grazie, G. Rossi",
      lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Dati personali", "Nome del mittente"], ["Richiesta", "Preventivo con consegna"]],
      ric: [["cemento 32.5", "Cemento CEM II 32,5 · 25 kg", "Sinonimi S-014", "ok"], ["cartongesso 13 mm", "Lastra standard 13 · 1,2×2 m", "Sinonimi S-021", "ok"], ["profili 48", "Montante 48 · 3 m", "Sinonimi S-033", "ok"], ["12 mq", "5 lastre (arrotondamento per eccesso)", "Conversione U-02", "ok"]],
      regole: [["ok", "Prezzi dal listino del cliente", "L-02"], ["ok", "Giacenza verificata a magazzino", "G-01"], ["warn", "Giacenza parziale su 1 articolo: preparata richiesta al fornitore", "G-04"], ["ok", "Margine calcolato sul costo medio ponderato", "M-01"], ["ok", "Margine sopra la soglia minima del 15%", "M-07"]],
      bozza: `<div class="out"><table><tr><th>Articolo</th><th>Qtà</th><th>Giacenza</th><th>€/unità</th></tr>
        <tr><td>Cemento CEM II 32,5 · 25 kg</td><td>40</td><td>${OK("Disponibile")}</td><td>6,80</td></tr>
        <tr><td>Lastra standard 13 · 1,2×2 m</td><td>5</td><td>${WN("Parziale · 3")}</td><td>8,40</td></tr>
        <tr><td>Montante 48 · 3 m</td><td>6</td><td>${OK("Disponibile")}</td><td>3,20</td></tr></table>
        <p><b>Margine stimato:</b> 22% · <b>Da ordinare al fornitore:</b> 2 lastre</p></div>`,
      verifica: { esito: "ok", chi: "Il commerciale stabilisce i prezzi e invia" }, registro: "bozza proposta · prezzi lasciati al commerciale" },
    { titolo: "Conferma d'ordine", canale: "Email · cliente", text: "Ordine n. 4471: confermiamo 200 m di cavo FG16 3x2,5 e 20 scatole di derivazione 100x100. Consegna entro il 28 presso il cantiere di Lissone.",
      lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Riferimento", "Ordine n. 4471"], ["Richiesta", "Conferma d'ordine con data"]],
      ric: [["cavo FG16 3x2,5", "FG16OR16 3G2,5 · bobina da 100 m (2 bobine)", "Sinonimi S-041", "ok"], ["scatole 100x100", "Scatola di derivazione IP55 100×100", "Sinonimi S-052", "ok"], ["ordine 4471", "Preventivo P-3302 del cliente", "Riconciliazione R-05", "ok"]],
      regole: [["ok", "Quantità e prezzi coerenti con il preventivo accettato", "R-05"], ["ok", "Giacenza sufficiente per l'intero ordine", "G-01"], ["ok", "Data di consegna compatibile con i tempi di evasione (2 giorni)", "T-03"], ["warn", "Indirizzo di consegna diverso dall'anagrafica: da confermare", "A-02"]],
      bozza: `<div class="out"><table><tr><th>Articolo</th><th>Qtà</th><th>Stato</th></tr>
        <tr><td>FG16OR16 3G2,5 · bobina 100 m</td><td>2</td><td>${OK("Da confermare")}</td></tr>
        <tr><td>Scatola di derivazione IP55 100×100</td><td>20</td><td>${OK("Da confermare")}</td></tr></table>
        <p><b>Consegna:</b> entro il 28 · ${WN("indirizzo da confermare")}</p></div>`,
      verifica: { esito: "ok", chi: "L'ufficio ordini conferma l'indirizzo e l'ordine" }, registro: "ordine predisposto · 1 avvertenza sull'indirizzo" },
    { limite: true, titolo: "Richiesta ambigua", canale: "Email · cliente", text: "Mandatemi quello di prima ma più grosso, urgente. Rossi",
      lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Mittente", "«Rossi»"], ["Richiesta", "Non determinata"]],
      ric: [["Rossi", "4 clienti con questo cognome", "Anagrafica A-01", "ko"], ["quello di prima", "Nessun riferimento a un ordine precedente", "Riconciliazione R-05", "ko"], ["più grosso", "Dimensione non determinabile", "Vocabolario S-000", "ko"], ["urgente", "Non è una data di consegna", "Tempi T-03", "warn"]],
      regole: [["ko", "Cliente non identificabile in modo univoco", "E-01"], ["ko", "Articolo non determinabile", "E-02"], ["warn", "Urgenza senza data: non si assume nulla", "T-03"]],
      bozza: null, motivo: "Con cliente e articolo non identificabili qualsiasi bozza sarebbe un'invenzione.",
      verifica: { esito: "stop", chi: "Ufficio commerciale, con priorità alta", motivo: "Cliente e articolo non identificabili.", sugg: "Chiedere il codice cliente e il riferimento all'ultimo ordine." }, registro: "escalation · cliente ambiguo (4 omonimi) · nessuna bozza" },
  ],
  seg: [
    { titolo: "Informazioni su un corso", canale: "Email · candidato", text: "Buongiorno, vorrei sapere costo e date del corso per operatori socio sanitari, e se posso passare a parlarne giovedì pomeriggio. Grazie, M. Bianchi",
      lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Dati personali", "Nome del mittente"], ["Richiesta", "Informazioni e colloquio"]],
      ric: [["corso operatori socio sanitari", "Corso OSS · edizione 2026", "Sinonimi S-102", "ok"], ["costo e date", "Scheda corso, sezione «Quota e calendario»", "Fonti D-01", "ok"], ["giovedì pomeriggio", "Fascia 14:00–18:00", "Calendario C-02", "ok"]],
      regole: [["ok", "Risposta solo da documenti ufficiali, con fonte citata", "D-01"], ["ok", "Quote riportate senza modifiche, nessuna trattativa", "D-03"], ["ok", "Appuntamenti proposti solo dal calendario della segreteria", "C-02"]],
      bozza: `<div class="out"><p><b>Classificazione:</b> informazione + richiesta di colloquio</p><p><b>Risposta:</b> costo e date come da scheda ufficiale; requisiti di accesso in allegato. <i>Fonte: scheda corso OSS, rev. 2026</i></p><p><b>Appuntamenti proposti:</b> giovedì 15:00 · giovedì 16:30</p></div>`,
      verifica: { esito: "ok", chi: "L'operatore verifica e conferma" }, registro: "bozza proposta · fonte citata" },
    { titolo: "Certificato per una famiglia", canale: "Email · genitore", text: "Salve, sono la mamma di L.B., classe 3B. Mi serve un certificato di frequenza per l'INPS entro venerdì. Come faccio?",
      lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Dati personali", "Minore (iniziali) e genitore"], ["Richiesta", "Certificato di frequenza"]],
      ric: [["certificato di frequenza", "Procedura «Certificati» · modulo M-12", "Sinonimi S-110", "ok"], ["INPS", "Uso: ente pubblico, nessuna marca da bollo", "Fonti D-04", "ok"], ["L.B., classe 3B", "Studente da verificare in anagrafica", "Identità V-01", "warn"]],
      regole: [["ok", "Procedura dalla modulistica ufficiale", "D-04"], ["ok", "Nessun dato dello studente ripetuto nella risposta", "P-02"], ["warn", "Identità del richiedente da verificare prima di inviare il certificato", "V-01"]],
      bozza: `<div class="out"><p><b>Risposta:</b> il certificato si richiede con il modulo allegato, da restituire in segreteria o via email. Tempi di rilascio indicati dalla procedura.</p><p><b>Nota per l'operatore:</b> verificare l'identità del genitore prima del rilascio. Nessun dato dello studente è riportato nel testo.</p></div>`,
      verifica: { esito: "ok", chi: "L'operatore verifica l'identità e conferma" }, registro: "bozza proposta · minimizzazione dei dati applicata" },
    { limite: true, titolo: "Comunicazione delicata", canale: "Email · genitore", text: "Mio figlio non vuole più venire a scuola, dice che lo prendono in giro. Non so cosa fare.",
      lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Dati personali", "Minore (riferimento indiretto)"], ["Richiesta", "Non informativa"]],
      ric: [["non vuole più venire a scuola", "Argomento: benessere dello studente", "Categorie E-03", "ko"], ["lo prendono in giro", "Possibile situazione di bullismo", "Categorie E-03", "ko"]],
      regole: [["ko", "Situazione delicata riguardante un minore: nessuna risposta automatica", "E-03"], ["ko", "Priorità alta: inoltro immediato al referente", "E-04"]],
      bozza: null, motivo: "Il messaggio riguarda il benessere di un minore. Non si risponde con un testo preparato.",
      verifica: { esito: "stop", chi: "Referente per il benessere e dirigente, con priorità alta", motivo: "Situazione delicata riguardante un minore.", sugg: "Contattare la famiglia di persona o per telefono." }, registro: "escalation · benessere dello studente · nessuna bozza" },
  ],
  stu: [
    { titolo: "Atto notificato via PEC", canale: "PEC · studio legale", text: "OGGETTO: Notifica atto di citazione. Il Tribunale di Monza comunica che l'udienza di prima comparizione è fissata per il 14/03/2027. In allegato atto (PDF, 18 pp.).",
      lettura: [["Canale", "PEC"], ["Lingua", "Italiano"], ["Allegati", "PDF, 18 pagine"], ["Mittente", "Tribunale di Monza"], ["Firma", "Verificata"]],
      ric: [["Tribunale di Monza", "Autorità giudiziaria", "Anagrafica A-10", "ok"], ["atto di citazione", "Atto introduttivo del giudizio", "Tipologie T-02", "ok"], ["14/03/2027", "Data di udienza (come scritta nel testo)", "Date D-02", "ok"]],
      regole: [["ok", "Date riportate esattamente come scritte nel testo", "T-01"], ["ok", "Nessun calcolo di termini: spetta al professionista", "T-02"], ["ok", "Allegato da leggere integralmente dal professionista", "T-03"]],
      bozza: `<div class="out"><p><b>Tipo:</b> atto giudiziario · notifica</p><p><b>Estratto dal testo:</b> Tribunale di Monza · udienza 14/03/2027 · atto di citazione, 18 pp.</p><p><b>Sintesi:</b> 1) citazione notificata via PEC; 2) udienza di prima comparizione fissata; 3) allegato da leggere.</p><p><b>Termini:</b> ${WN("da calcolare e verificare dal professionista")}</p></div>`,
      verifica: { esito: "ok", chi: "Il professionista legge e gestisce la pratica" }, registro: "scheda predisposta · termini non calcolati per scelta" },
    { titolo: "Fattura da registrare", canale: "PEC · studio di commercialisti", text: "Trasmissione fattura n. 118 del 12/10/2026. Rossi Impianti S.r.l. Importo € 4.880,00 IVA inclusa. Scadenza pagamento 30 giorni data fattura.",
      lettura: [["Canale", "PEC"], ["Lingua", "Italiano"], ["Allegati", "XML della fattura"], ["Mittente", "Rossi Impianti S.r.l."], ["Cliente dello studio", "Individuato dal destinatario"]],
      ric: [["fattura n. 118", "Fattura passiva n. 118 del 12/10/2026", "Documenti D-20", "ok"], ["€ 4.880,00 IVA inclusa", "Totale documento", "Importi I-01", "ok"], ["aliquota IVA", "Non indicata nel testo", "Importi I-02", "warn"], ["30 giorni data fattura", "Scadenza: 11/11/2026", "Scadenze C-05", "ok"]],
      regole: [["ok", "Importi riportati come da documento, senza arrotondamenti", "I-01"], ["ok", "Scadenza calcolata con la regola indicata nel testo", "C-05"], ["warn", "Aliquota IVA mancante: da verificare sul documento originale", "I-02"]],
      bozza: `<div class="out"><table><tr><th>Campo</th><th>Valore</th></tr><tr><td>Fornitore</td><td>Rossi Impianti S.r.l.</td></tr><tr><td>Documento</td><td>Fattura n. 118 del 12/10/2026</td></tr><tr><td>Totale</td><td>€ 4.880,00 (IVA inclusa)</td></tr><tr><td>Scadenza</td><td>11/11/2026</td></tr><tr><td>Aliquota IVA</td><td>${WN("da verificare")}</td></tr></table></div>`,
      verifica: { esito: "ok", chi: "L'addetto verifica l'aliquota e registra" }, registro: "scheda predisposta · 1 avvertenza sull'aliquota" },
    { limite: true, titolo: "Documento non classificabile", canale: "PEC · studio", text: "Riscontro alla Vs. del 3/9: si allega quanto concordato. (Allegato: scansione illeggibile, 2 pp.)",
      lettura: [["Canale", "PEC"], ["Lingua", "Italiano"], ["Allegati", "Scansione, 2 pagine"], ["Qualità dell'allegato", "Testo non estraibile"], ["Mittente", "Non associato a una pratica"]],
      ric: [["Vs. del 3/9", "3 pratiche aperte dello stesso mittente", "Riconciliazione R-01", "ko"], ["quanto concordato", "Contenuto non determinabile", "Tipologie T-00", "ko"], ["scansione", "Qualità insufficiente per la lettura", "Allegati L-03", "ko"]],
      regole: [["ko", "Documento non leggibile: nessuna sintesi", "E-01"], ["ko", "Pratica non determinabile: nessuna assegnazione automatica", "E-05"]],
      bozza: null, motivo: "Senza testo leggibile e senza pratica certa una scheda sarebbe solo una supposizione.",
      verifica: { esito: "stop", chi: "Il professionista, senza scheda né sintesi", motivo: "Allegato illeggibile e pratica non determinabile.", sugg: "Chiedere al mittente un nuovo invio dell'allegato." }, registro: "escalation · allegato illeggibile · nessuna scheda" },
  ],
};
const DATI = {
  "Richiesta di preventivo": { esito: "ok", f: [["Anagrafica articoli", "98% di codici univoci · 2% di descrizioni incomplete", "ok"], ["Listino del cliente", "Aggiornato 12 giorni fa", "ok"], ["Giacenze", "Sincronizzate ogni notte", "ok"]], raccom: "Dati adatti: un agente può basarsi su queste fonti." },
  "Conferma d'ordine": { esito: "warn", f: [["Preventivi accettati", "Collegabili all'ordine tramite il numero", "ok"], ["Indirizzi di consegna", "11% diversi dall'ultimo ordine", "warn"], ["Giacenze", "Sincronizzate ogni notte", "ok"]], raccom: "Dati adatti, con un controllo sugli indirizzi di consegna." },
  "Richiesta ambigua": { esito: "ko", f: [["Anagrafica clienti", "4 clienti con lo stesso cognome, nessun codice nell'email", "ko"], ["Storico ordini", "Non collegabile senza un riferimento", "ko"], ["Listini", "3 file con prezzi diversi per lo stesso articolo", "ko"]], raccom: "Con questi dati un agente darebbe risposte non affidabili. Prima: normalizzare anagrafica e listini." },
  "Informazioni su un corso": { esito: "ok", f: [["Schede corso", "Aggiornate, in formato testo, rev. 2026", "ok"], ["Calendario", "Orari e fasce disponibili", "ok"], ["Storico richieste", "812 richieste, la maggior parte classificabili", "ok"]], raccom: "Dati adatti: l'assistente può rispondere dalla documentazione." },
  "Certificato per una famiglia": { esito: "warn", f: [["Modulistica", "Modulo M-12 aggiornato", "ok"], ["Anagrafica studenti", "Accessibile solo all'operatore", "warn"], ["Regolamento", "Procedura scritta e aggiornata", "ok"]], raccom: "Dati adatti, con minimizzazione dei dati personali e verifica dell'identità." },
  "Comunicazione delicata": { esito: "ko", f: [["Procedure di gestione", "Nessuna procedura scritta per le segnalazioni", "ko"], ["Dati coinvolti", "Minore, situazione delicata", "ko"], ["Storico", "Non rilevante per questo caso", "warn"]], raccom: "Non è un caso da automatizzare, indipendentemente dalla qualità dei dati: serve un referente." },
  "Atto notificato via PEC": { esito: "ok", f: [["Archivio pratiche", "Struttura costante, 94% con parti e riferimenti", "ok"], ["PEC e allegati", "Firma verificata, PDF leggibile", "ok"], ["Assegnazione", "Un professionista di riferimento per pratica", "ok"]], raccom: "Dati adatti: smistamento e scheda possono essere automatici, con verifica." },
  "Fattura da registrare": { esito: "ok", f: [["Fatture elettroniche", "XML con campi strutturati, aliquota presente nel file", "ok"], ["Anagrafica fornitori", "88% già presenti, 12% da creare", "warn"], ["Scadenzario", "Unico e aggiornato", "ok"]], raccom: "Dati adatti. Conviene leggere l'XML allegato invece del testo della PEC." },
  "Documento non classificabile": { esito: "ko", f: [["Allegato", "Scansione illeggibile, 2 pagine", "ko"], ["Archivio", "3 pratiche aperte dello stesso mittente", "warn"], ["Qualità delle scansioni dello studio", "41% sotto la soglia di lettura", "ko"]], raccom: "Prima di classificare servono scansioni leggibili: conviene sistemare l'acquisizione dei documenti." },
};
/* ── Altri ambiti ── */
const ALT_TIPO = { first: ["t-first", "Prima i dati"], noai: ["t-no", "Senza AI"], limited: ["t-assist", "Agente con limiti"] };
CASI.amm = [
  { titolo: "Risposta a un sollecito", canale: "Email · cliente", text: "Buongiorno, rispondo al vostro sollecito: la fattura 2026/214 è stata pagata il 9 ottobre con bonifico. Allego la ricevuta. Cordiali saluti, L. Verdi",
    lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Ricevuta in PDF"], ["Richiesta", "Riscontro a un sollecito"]],
    ric: [["fattura 2026/214", "Fattura attiva 2026/214 · € 3.250,00", "Documenti D-20", "ok"], ["pagata il 9 ottobre", "Pagamento dichiarato, non ancora riscontrato", "Incassi I-04", "warn"], ["ricevuta", "Bonifico del 09/10 di € 3.250,00", "Allegati L-03", "ok"]],
    regole: [["ok", "Fattura individuata con numero e importo", "D-20"], ["warn", "Incasso non ancora in banca: da verificare prima di chiudere il sollecito", "I-04"], ["ok", "Nessuna chiusura automatica: decide l'amministrazione", "A-01"]],
    bozza: `<div class="out"><table><tr><td>Cliente</td><td>L. Verdi</td></tr><tr><td>Fattura</td><td>2026/214 · € 3.250,00</td></tr><tr><td>Pagamento dichiarato</td><td>Bonifico del 09/10</td></tr><tr><td>Stato</td><td>${WN("da riscontrare in banca")}</td></tr></table><p><b>Risposta proposta:</b> grazie, verifichiamo l'accredito e vi confermiamo la chiusura.</p></div>`,
    verifica: { esito: "ok", chi: "L'amministrazione verifica l'incasso e risponde" }, registro: "risposta proposta · incasso da riscontrare" },
  { titolo: "Previsione di cassa su file sparsi", canale: "Richiesta interna · titolare", text: "Potete prepararmi ogni lunedì un riepilogo di incassi e scadenze dei prossimi 60 giorni? Ora lo faccio a mano da tre file.",
    lettura: [["Canale", "Richiesta interna"], ["Richiesta", "Riepilogo periodico"], ["Fonti citate", "3 file"], ["Frequenza", "Settimanale"]],
    ric: [["tre file", "Scadenzario clienti, scadenzario fornitori, estratto conto", "Fonti F-01", "warn"], ["incassi e scadenze", "Importi e date in colonne diverse tra i file", "Formati F-02", "ko"], ["60 giorni", "Orizzonte temporale", "Parametri P-01", "ok"]],
    regole: [["ko", "Formati diversi tra i tre file: nessun calcolo affidabile", "F-02"], ["warn", "Un riepilogo ripetuto è una regola di calcolo, non un compito per un agente", "A-07"], ["ok", "Il calcolo è deterministico e verificabile", "A-03"]],
    bozza: null, motivo: "Non serve un agente: serve un riepilogo calcolato con regole, su dati uniformati.",
    verifica: { esito: "alt", tipo: "first", titolo: "Prima i dati, poi un report automatico senza AI", passi: ["Uniformare i tre file in un unico scadenzario", "Impostare il riepilogo settimanale con regole di calcolo", "Valutare l'AI solo per le note a margine, se servono"] }, registro: "alternativa · report senza AI dopo la sistemazione dei dati" },
];
CASI.hr = [
  { titolo: "Candidatura spontanea", canale: "Email · candidato", text: "Buongiorno, allego il mio CV per la posizione di magazziniere. Ho 6 anni di esperienza con il carrello elevatore e il patentino in corso di validità. Disponibile da subito. Marco R.",
    lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "CV in PDF"], ["Dati personali", "Dati del candidato"]],
    ric: [["magazziniere", "Posizione aperta: addetto magazzino (P-212)", "Posizioni S-210", "ok"], ["carrello elevatore, patentino", "Competenza dichiarata, da verificare con il documento", "Competenze S-215", "warn"], ["disponibile da subito", "Disponibilità immediata", "Date D-02", "ok"]],
    regole: [["ok", "Estrazione delle competenze dichiarate, senza giudizio", "H-01"], ["ok", "Nessun punteggio automatico del candidato", "H-02"], ["warn", "Il patentino va verificato sul documento", "H-03"]],
    bozza: `<div class="out"><table><tr><td>Candidato</td><td>M. R.</td></tr><tr><td>Posizione</td><td>Addetto magazzino (P-212)</td></tr><tr><td>Competenze dichiarate</td><td>Carrello elevatore · 6 anni</td></tr><tr><td>Da verificare</td><td>${WN("patentino")}</td></tr></table><p>Nessuna valutazione né graduatoria: la decisione spetta al selezionatore.</p></div>`,
    verifica: { esito: "ok", chi: "Il selezionatore legge il CV e decide" }, registro: "scheda predisposta · nessun punteggio per scelta" },
  { titolo: "Selezione automatica dei CV", canale: "Richiesta interna · responsabile HR", text: "Possiamo far scartare in automatico i CV sotto un certo punteggio? Ne arrivano 300 a settimana.",
    lettura: [["Canale", "Richiesta interna"], ["Richiesta", "Selezione automatica"], ["Volume", "300 CV a settimana"], ["Dati personali", "Sì"]],
    ric: [["scartare in automatico", "Decisione su persone", "Limiti E-06", "ko"], ["sotto un certo punteggio", "Valutazione automatica dei candidati", "Limiti E-06", "ko"], ["300 a settimana", "Volume alto e ripetitivo", "Volumi V-01", "ok"]],
    regole: [["ko", "Valutazioni su persone: non si automatizzano", "E-06"], ["ok", "L'AI può riassumere e ordinare, non escludere", "H-05"], ["warn", "Conformità normativa da valutare prima di qualsiasi uso", "H-07"]],
    bozza: null, motivo: "Escludere candidati in automatico non è un compito che affidiamo all'AI.",
    verifica: { esito: "alt", tipo: "limited", titolo: "Preselezione assistita: l'AI riassume, il selezionatore decide", passi: ["Estrarre competenze ed esperienze in una scheda uniforme", "Ordinare per requisiti dichiarati, senza escludere nessuno", "Il selezionatore valuta ogni scheda"] }, registro: "alternativa · AI solo per riassumere, nessuna esclusione automatica" },
];
CASI.log = [
  { titolo: "Ritardo di un fornitore", canale: "Email · fornitore", text: "Gentile cliente, la consegna dell'ordine 7782 slitta dal 22 al 29 ottobre per un ritardo del vettore. Ci scusiamo. Logistica Alfa",
    lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Mittente", "Fornitore Alfa"], ["Richiesta", "Comunicazione di ritardo"]],
    ric: [["ordine 7782", "Ordine fornitore OF-7782 · 3 righe", "Riconciliazione R-05", "ok"], ["dal 22 al 29 ottobre", "Nuova consegna 29/10 (+7 giorni)", "Date D-02", "ok"]],
    regole: [["ok", "Ordine individuato con il numero", "R-05"], ["warn", "Il ritardo supera la copertura di magazzino per 1 articolo: avvisare gli acquisti", "G-06"], ["ok", "Nessun ordine di cliente modificato in automatico", "L-01"]],
    bozza: `<div class="out"><table><tr><td>Ordine</td><td>OF-7782</td></tr><tr><td>Nuova consegna</td><td>29/10 (+7 giorni)</td></tr><tr><td>Articoli a rischio</td><td>${WN("1 · copertura di 4 giorni")}</td></tr></table><p><b>Proposta:</b> avvisare i commerciali dei clienti interessati.</p></div>`,
    verifica: { esito: "ok", chi: "L'ufficio acquisti decide se cercare un'alternativa" }, registro: "avviso predisposto · 1 articolo a rischio di rottura di stock" },
  { titolo: "Bolle di spedizione", canale: "Richiesta interna · responsabile magazzino", text: "Vorremmo l'AI per compilare le bolle di spedizione dai nostri ordini. Il gestionale ha già tutti i dati.",
    lettura: [["Canale", "Richiesta interna"], ["Richiesta", "Compilazione di bolle"], ["Fonte", "Gestionale"], ["Testo libero", "No"]],
    ric: [["bolle di spedizione", "Documento generabile dal gestionale", "Documenti D-31", "ok"], ["dati già nel gestionale", "Ordine, indirizzo e colli già strutturati", "Fonti F-03", "ok"]],
    regole: [["ok", "I dati sono già strutturati: serve una regola, non un modello", "A-07"], ["ok", "Nessuna interpretazione di testo libero", "A-02"], ["warn", "Un modello introdurrebbe errori dove oggi non ce ne sono", "A-09"]],
    bozza: null, motivo: "Non serve l'AI: il gestionale può generare le bolle con una regola.",
    verifica: { esito: "alt", tipo: "noai", titolo: "Una configurazione del gestionale, senza AI", passi: ["Verificare il modulo di spedizione del gestionale", "Configurare la generazione automatica delle bolle", "Riconsiderare l'AI solo per i casi con note in testo libero"] }, registro: "alternativa · configurazione del gestionale, nessuna AI" },
];
CASI.cli = [
  { titolo: "Richiesta di assistenza", canale: "Email · cliente", text: "Buongiorno, la caldaia che ci avete installato a marzo ha smesso di scaldare da stamattina e mostra l'errore E12. Siamo in 5 in ufficio e fa freddo. Potete mandare qualcuno oggi? Studio Bianchi",
    lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Richiesta", "Intervento tecnico urgente"]],
    ric: [["caldaia installata a marzo", "Impianto I-0412 · installazione 14/03, in garanzia", "Impianti A-11", "ok"], ["errore E12", "Guasto noto: sensore di pressione", "Guasti G-12", "ok"], ["oggi", "Richiesta urgente", "Priorità P-02", "warn"]],
    regole: [["ok", "Impianto in garanzia: segnalare all'assistenza tecnica", "G-01"], ["ok", "Guasto E12 con procedura nota (controllo della pressione)", "G-12"], ["warn", "Urgenza: nessuna data promessa senza il planning dei tecnici", "P-02"]],
    bozza: `<div class="out"><p><b>Risposta:</b> istruzioni per il primo controllo della pressione; richiesta di un recapito telefonico; l'assistenza propone un appuntamento.</p><p><b>Scheda per il tecnico:</b> impianto I-0412 · in garanzia · errore E12 · urgenza segnalata.</p></div>`,
    verifica: { esito: "ok", chi: "L'assistenza conferma la data dell'intervento" }, registro: "risposta proposta · nessuna data promessa" },
  { limite: true, titolo: "Reclamo", canale: "Email · cliente", text: "Questa è la terza volta che sbagliate la consegna. Valuto di rivolgermi a un avvocato. Chiamatemi. G. Conti",
    lettura: [["Canale", "Email"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Richiesta", "Reclamo con toni di contenzioso"]],
    ric: [["terza volta", "Storico: 2 consegne contestate", "Storico S-30", "ok"], ["avvocato", "Possibile contenzioso", "Categorie E-07", "ko"]],
    regole: [["ko", "Reclamo con possibile contenzioso: nessuna risposta automatica", "E-07"], ["ok", "Raccolta dello storico a disposizione di chi risponderà", "S-30"]],
    bozza: null, motivo: "Un reclamo con possibile contenzioso richiede una persona e una risposta ponderata.",
    verifica: { esito: "stop", chi: "Il titolare, con priorità alta", motivo: "Possibile contenzioso.", sugg: "Preparare lo storico delle consegne contestate prima di chiamare." }, registro: "escalation · reclamo con possibile contenzioso · nessuna bozza" },
];
CASI.prod = [
  { titolo: "Non conformità di un lotto", canale: "Messaggio interno · reparto", text: "Lotto 4417: durante il controllo finale 12 pezzi su 400 con bava sul bordo. Linea 2, turno B. Fermato il lotto in attesa.",
    lettura: [["Canale", "Messaggio interno"], ["Lingua", "Italiano"], ["Allegati", "Nessuno"], ["Richiesta", "Segnalazione di non conformità"]],
    ric: [["lotto 4417", "Lotto 4417 · articolo 31-0870", "Lotti L-02", "ok"], ["12 su 400", "Difettosità del 3%", "Calcoli C-01", "ok"], ["bava sul bordo", "Difetto D-14: bava", "Difetti D-14", "ok"], ["linea 2, turno B", "Reparto stampaggio · turno B", "Reparti R-03", "ok"]],
    regole: [["ok", "Difetto classificato con il catalogo dei difetti", "D-14"], ["ok", "Soglia di allerta del 2% superata: aprire una non conformità", "Q-03"], ["ok", "Il lotto resta bloccato fino alla decisione del responsabile qualità", "Q-05"]],
    bozza: `<div class="out"><table><tr><td>Lotto</td><td>4417 · articolo 31-0870</td></tr><tr><td>Difetto</td><td>D-14 · bava sul bordo</td></tr><tr><td>Difettosità</td><td>${WN("3% (soglia 2%)")}</td></tr><tr><td>Azione</td><td>Lotto bloccato</td></tr></table><p><b>Suggerito:</b> controllare l'utensile della linea 2 (2 casi analoghi nello storico).</p></div>`,
    verifica: { esito: "ok", chi: "Il responsabile qualità decide e firma" }, registro: "scheda di non conformità predisposta · soglia superata" },
  { titolo: "Previsione dei guasti", canale: "Richiesta interna · direzione", text: "Vorremmo che l'AI prevedesse i guasti dei macchinari prima che succedano.",
    lettura: [["Canale", "Richiesta interna"], ["Richiesta", "Manutenzione predittiva"], ["Fonti citate", "Dati dei macchinari"], ["Obiettivo", "Anticipare i fermi"]],
    ric: [["prevedere i guasti", "Manutenzione predittiva", "Obiettivi O-01", "warn"], ["dati dei macchinari", "Sensori assenti, interventi registrati a mano", "Fonti F-09", "ko"]],
    regole: [["ko", "Servono dati storici sistematici dei guasti: oggi non ci sono", "F-09"], ["warn", "Con pochi guasti registrati un modello non è affidabile", "M-04"], ["ok", "Si può partire dalla registrazione strutturata degli interventi", "M-06"]],
    bozza: null, motivo: "Senza dati storici sistematici nessuna previsione sarebbe affidabile.",
    verifica: { esito: "alt", tipo: "first", titolo: "Prima raccogliere i dati, poi valutare la previsione", passi: ["Registrare gli interventi in modo strutturato: causa, componente, ore di fermo", "Raccogliere alcuni mesi di dati", "Valutare di nuovo se la previsione è fattibile"] }, registro: "alternativa · raccolta strutturata dei dati prima di qualsiasi modello" },
];
Object.assign(DATI, {
  "Risposta a un sollecito": { esito: "warn", f: [["Fatture attive", "Numerazione continua, collegate ai clienti", "ok"], ["Movimenti bancari", "Importati ogni giorno, causale libera", "warn"], ["Anagrafica clienti", "Unica e aggiornata", "ok"]], raccom: "Dati adatti, con riserva sulla riconciliazione dei bonifici." },
  "Previsione di cassa su file sparsi": { esito: "ko", f: [["Scadenzario clienti", "Colonne diverse da quello dei fornitori", "ko"], ["Scadenzario fornitori", "Date in formato testo", "warn"], ["Estratto conto", "Esportabile in CSV", "ok"]], raccom: "Un agente qui non serve: serve prima uno scadenzario unico, poi un report calcolato con regole." },
  "Candidatura spontanea": { esito: "warn", f: [["Archivio candidature", "CV in PDF di buona qualità", "ok"], ["Posizioni aperte", "Codificate per competenze", "ok"], ["Dati personali", "Conservazione da definire", "warn"]], raccom: "Dati adatti, con attenzione alla conservazione dei dati personali." },
  "Selezione automatica dei CV": { esito: "warn", f: [["CV ricevuti", "Formati diversi: PDF, Word, immagini", "warn"], ["Posizioni", "Requisiti non sempre scritti", "warn"], ["Criteri di selezione", "Non formalizzati", "ko"]], raccom: "Prima servono criteri scritti. L'AI può riassumere i CV, non escludere candidati." },
  "Ritardo di un fornitore": { esito: "warn", f: [["Ordini ai fornitori", "Numerati e collegati ai fornitori", "ok"], ["Coperture di magazzino", "Calcolate ogni notte", "ok"], ["Tempi di consegna storici", "Disponibili solo per i fornitori principali", "warn"]], raccom: "Dati adatti, con riserva sui tempi storici." },
  "Bolle di spedizione": { esito: "ok", f: [["Ordini", "Campi strutturati e completi", "ok"], ["Indirizzi", "Validati all'inserimento", "ok"], ["Colli e pesi", "Registrati dal magazzino", "ok"]], raccom: "I dati sono ottimi, ed è per questo che non serve l'AI: basta una regola del gestionale." },
  "Richiesta di assistenza": { esito: "warn", f: [["Anagrafica impianti", "Installazioni collegate ai clienti", "ok"], ["Guasti noti", "Catalogo con procedure per i codici principali", "ok"], ["Planning dei tecnici", "Gestito su un foglio condiviso", "warn"]], raccom: "Dati adatti: la data dell'intervento resta all'assistenza." },
  "Reclamo": { esito: "ko", f: [["Storico clienti", "Consegne e contestazioni collegate", "ok"], ["Procedure per i reclami", "Non scritte", "ko"], ["Registro delle comunicazioni", "Email e telefono non tracciati insieme", "warn"]], raccom: "Non è un caso da automatizzare. Conviene invece scrivere la procedura per i reclami." },
  "Non conformità di un lotto": { esito: "warn", f: [["Catalogo dei difetti", "Codificato e in uso", "ok"], ["Lotti e tracciabilità", "Collegati a linea e turno", "ok"], ["Storico delle non conformità", "In un foglio, poco strutturato", "warn"]], raccom: "Dati adatti, con riserva sullo storico delle non conformità." },
  "Previsione dei guasti": { esito: "ko", f: [["Interventi di manutenzione", "Registrati a mano, descrizioni libere", "ko"], ["Sensori delle macchine", "Assenti sulla maggior parte", "ko"], ["Fermi macchina", "Tracciati solo in parte", "warn"]], raccom: "Oggi non esistono i dati per prevedere i guasti: si parte dalla raccolta." },
});
CASI.dir = [
  { titolo: "Domanda sui numeri", canale: "Richiesta interna · direzione", text: "Qual è stato il margine sulle commesse di settembre rispetto ad agosto? Mi serve per la riunione di domani.",
    lettura: [["Canale", "Richiesta interna"], ["Richiesta", "Confronto di margini tra due mesi"], ["Periodo", "Agosto e settembre"], ["Scadenza", "Domani"]],
    ric: [["commesse di settembre", "42 commesse con data di chiusura nel mese", "Commesse C-01", "ok"], ["margine", "Ricavi meno costi diretti, per commessa", "Definizioni M-02", "ok"], ["rispetto ad agosto", "Confronto con 38 commesse del mese precedente", "Periodi P-03", "ok"]],
    regole: [["ok", "I numeri sono calcolati dal gestionale: l'AI non fa conti, li spiega", "K-01"], ["warn", "Tre commesse con costi non ancora registrati: segnalarle", "K-04"], ["ok", "La risposta indica sempre la definizione di margine usata", "K-02"]],
    bozza: `<div class="out"><table><tr><td>Margine settembre</td><td>18,4%</td></tr><tr><td>Margine agosto</td><td>20,1%</td></tr><tr><td>Differenza</td><td>-1,7 punti</td></tr><tr><td>Commesse da completare</td><td>${WN("3 con costi mancanti")}</td></tr></table><p><b>Nota:</b> cifre calcolate dal gestionale; margine = ricavi meno costi diretti. I valori sono fittizi.</p></div>`,
    verifica: { esito: "ok", chi: "Il controllo di gestione verifica i numeri prima della riunione" }, registro: "risposta predisposta · 3 commesse con costi mancanti segnalate" },
  { titolo: "Cruscotto degli indicatori", canale: "Richiesta interna · titolare", text: "Vorremmo usare l'AI per vedere ogni mattina fatturato, ordini aperti e incassi del giorno.",
    lettura: [["Canale", "Richiesta interna"], ["Richiesta", "Indicatori giornalieri"], ["Fonte", "Gestionale"], ["Frequenza", "Ogni giorno"]],
    ric: [["fatturato", "Somma delle fatture emesse", "Indicatori I-01", "ok"], ["ordini aperti", "Ordini non ancora consegnati", "Indicatori I-02", "ok"], ["incassi del giorno", "Movimenti registrati in banca", "Indicatori I-03", "ok"]],
    regole: [["ok", "Gli indicatori sono definiti e calcolabili dal gestionale", "K-05"], ["ok", "Un calcolo ripetuto è una regola, non un compito per un modello", "A-07"], ["warn", "Un modello introdurrebbe errori dove oggi non ce ne sono", "A-09"]],
    bozza: null, motivo: "Non serve l'AI: serve un cruscotto che interroga il gestionale.",
    verifica: { esito: "alt", tipo: "noai", titolo: "Un cruscotto sul gestionale, senza AI", passi: ["Fissare per iscritto la definizione di ciascun indicatore", "Configurare il cruscotto sulle interrogazioni del gestionale", "Valutare l'AI solo per commentare gli scostamenti, se serve"] }, registro: "alternativa · cruscotto sul gestionale, nessuna AI" },
];
Object.assign(DATI, {
  "Domanda sui numeri": { esito: "warn", f: [["Commesse e centri di costo", "Codificati in modo coerente tra le fonti", "ok"], ["Costi diretti", "Registrati con 5-10 giorni di ritardo", "warn"], ["Definizione di margine", "Scritta e condivisa", "ok"]], raccom: "Dati adatti, con riserva sul ritardo con cui si registrano i costi." },
  "Cruscotto degli indicatori": { esito: "ok", f: [["Fatture", "Campi strutturati e completi", "ok"], ["Ordini", "Stato aggiornato in tempo reale", "ok"], ["Movimenti bancari", "Importati ogni giorno", "ok"]], raccom: "I dati sono buoni, ed è per questo che basta un cruscotto sul gestionale: l'AI non serve." },
});
const AUTO = [["acq", 0], ["amm", 1], ["seg", 2], ["hr", 1], ["stu", 1], ["log", 1], ["cli", 0], ["prod", 1], ["stu", 2], ["cli", 1], ["acq", 2], ["prod", 0], ["dir", 0], ["dir", 1]];
const F = { a: "acq", i: 0, reached: -1, shown: -1, timers: [], touched: false, auto: null, started: false };
let typeTimer = null;
function typeText(el, text, done) {
  clearInterval(typeTimer);
  if (REDUCED) { el.textContent = text; el.classList.remove("typing"); done && done(); return; }
  el.textContent = ""; el.classList.add("typing");
  let i = 0;
  typeTimer = setInterval(() => {
    i += 2; el.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(typeTimer); el.classList.remove("typing"); done && done(); }
  }, 12);
}
const fCase = () => CASI[F.a][F.i];
const fTag = (c) => c.limite ? '<span class="lim">caso limite</span>' : c.verifica.esito === "alt" ? `<span class="lim alt">${{ first: "prima i dati", noai: "senza AI", limited: "agente con limiti" }[c.verifica.tipo]}</span>` : "";
function fClear() { F.timers.forEach(clearTimeout); F.timers = []; F.reached = -1; F.shown = -1; }
function fRenderSteps() {
  const c = fCase();
  $("f-steps").innerHTML = STEPS.map((s, k) => {
    const st = k <= F.reached ? (((c.limite || c.verifica.esito !== "ok") && k >= 4) ? "stop" : "done") : "";
    return `<li><button type="button" class="${st} ${k === F.shown ? "on" : ""}" data-k="${k}" ${k > F.reached ? "disabled" : ""}><span class="n">${k + 1}</span><span class="t">${s}</span></button></li>`;
  }).join("");
  $("f-steps").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { fTouch(); fHold(); fShow(parseInt(b.dataset.k, 10)); }));
}
function fDetail(k) {
  const c = fCase();
  if (k === 0) {
    const d = DATI[c.titolo];
    return `<div class="out"><table><tr><th>Fonte</th><th>Stato rilevato</th><th>Esito</th></tr>${d.f.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2] === "ok" ? OK("adatti") : r[2] === "warn" ? WN("con riserva") : KO("non adatti")}</td></tr>`).join("")}</table></div><div class="reco ${d.esito}"><b>Raccomandazione</b>${d.raccom}</div><p class="note">Prima di ogni flusso si valuta la qualità dei dati su cui si appoggia. Se non sono adatti, il flusso non parte.</p>`;
  }
  if (k === 1) return `<div class="out"><table>${c.lettura.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table></div><p class="note">Il testo viene normalizzato e classificato. Nessun contenuto esce dal flusso.</p>`;
  if (k === 2) return `<div class="out"><table><tr><th>Scritto</th><th>Riconosciuto</th><th>Regola</th><th>Esito</th></tr>${c.ric.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="mono">${r[2]}</td><td>${r[3] === "ok" ? OK("ok") : r[3] === "warn" ? WN("da verificare") : KO("non riconosciuto")}</td></tr>`).join("")}</table></div><p class="note">Il vocabolario aziendale traduce le parole di clienti e colleghi nei codici del gestionale, una volta sola per tutti.</p>`;
  if (k === 3) return `<ul class="rules">${c.regole.map((r) => `<li class="${r[0]}"><i>${r[0] === "ok" ? "✓" : r[0] === "warn" ? "!" : "×"}</i><span>${r[1]}</span><em>${r[2]}</em></li>`).join("")}</ul><p class="note">Regole scritte e approvate dal cliente. Ogni esito rimanda a una regola.</p>`;
  if (k === 4) return c.bozza ? c.bozza : `<div class="stopbox"><b>${c.verifica.esito === "alt" ? "Nessun agente per questo caso." : "Nessuna bozza."}</b> ${c.motivo}</div>`;
  const v = c.verifica;
  if (v.esito === "alt") { const t = ALT_TIPO[v.tipo]; return `<div class="human alt"><span>Approccio proposto: ${v.titolo}</span></div><p><span class="ptag ${t[0]}">${t[1]}</span></p><ol class="next">${v.passi.map((x) => `<li>${x}</li>`).join("")}</ol><p class="note">La valutazione dei dati può portare a una soluzione diversa da un agente. Se è la più adatta, è quella che proponiamo.</p>`; }
  return v.esito === "ok"
    ? `<div class="human" id="f-human"><span>Verifica umana · ${v.chi}</span><button type="button" id="f-ok">Convalida</button></div><p class="note">L'invio avviene solo dopo la convalida della persona.</p>`
    : `<div class="human stop"><span>Inoltrato a: ${v.chi}</span></div><p><b>Motivo:</b> ${v.motivo}</p><p><b>Suggerito:</b> ${v.sugg}</p>`;
}
function fShow(k) {
  F.shown = k; fRenderSteps();
  const d = $("f-detail");
  d.innerHTML = `<div class="fd"><div class="label">${k + 1}. ${STEPS[k]}</div>${fDetail(k)}</div>`;
  const ok = $("f-ok");
  if (ok) ok.addEventListener("click", () => { fTouch(); fConvalida(); });
}
function fConvalida() {
  const h = $("f-human"); if (!h) return;
  h.classList.add("done"); h.innerHTML = "<span>Convalidato dalla persona. Solo ora può avvenire l'invio.</span>";
  const l = $("f-log"); if (l) l.innerHTML = l.innerHTML.replace("in attesa di convalida", "convalidata");
}
function fLog() {
  const c = fCase(), t = new Date(), hh = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0");
  $("f-log").innerHTML = `<span class="mono">REGISTRO · ${hh} · ${c.registro}${c.verifica.esito === "ok" ? " · in attesa di convalida" : ""}</span>`;
}
function fSelect(a, i) {
  fClear(); F.a = a; F.i = i;
  document.querySelectorAll("#f-ambito button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.a === a));
  $("f-casi").innerHTML = CASI[a].map((c, k) => `<button type="button" class="case ${k === i ? "on" : ""}" data-i="${k}"><b>${c.titolo}</b><small>${c.canale}</small>${fTag(c)}</button>`).join("");
  $("f-casi").querySelectorAll(".case").forEach((b) => b.addEventListener("click", () => { fTouch(); fSelect(F.a, parseInt(b.dataset.i, 10)); }));
  $("f-label").textContent = fCase().canale;
  $("f-log").innerHTML = ""; $("f-detail").innerHTML = '<div class="fd empty">Avviate il flusso per vedere i passaggi, uno per volta.</div>';
  const run = $("f-run"); run.disabled = false; run.textContent = "Avvia il flusso →";
  fRenderSteps();
  typeText($("f-text"), fCase().text, () => { if (F.afterType) { const f = F.afterType; F.afterType = null; f(); } });
}
function fRun(done) {
  fClear(); $("f-run").disabled = true; $("f-log").innerHTML = "";
  const finish = () => { $("f-run").textContent = "Ripeti"; $("f-run").disabled = false; fLog(); done && done(); };
  if (REDUCED) { F.reached = 5; fShow(5); finish(); return; }
  const go = (k) => {
    F.reached = k; fShow(k);
    if (k === 5) { finish(); return; }
    F.timers = [setTimeout(() => go(k + 1), fReadTime(k))];
  };
  F.timers = [setTimeout(() => go(0), 400)];
}
// Tempo per leggere un passo: base fissa più una quota per la lunghezza del testo.
function fReadTime(k) {
  const len = fDetail(k).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").length;
  return Math.min(8000, Math.max(4000, 1800 + len * 14));
}
// Fermo l'avanzamento automatico: da qui in poi decide chi legge.
function fHold() {
  F.timers.forEach(clearTimeout); F.timers = [];
  const run = $("f-run"); run.disabled = false; run.textContent = "Ripeti";
}
function fNext() {
  fTouch(); fHold();
  if (F.reached >= 5) return;
  F.reached += 1; fShow(F.reached);
  if (F.reached === 5) fLog();
}
function fTouch() { if (F.touched) return; F.touched = true; clearTimeout(F.auto); F.afterType = null; }
function fAutoplay() {
  if (REDUCED || F.touched) return;
  let n = 0;
  const next = () => {
    if (F.touched) return;
    const [a, i] = AUTO[n % AUTO.length]; n++;
    F.afterType = () => { F.auto = setTimeout(() => fRun(() => { F.auto = setTimeout(() => { if (F.touched) return; if (fCase().verifica.esito === "ok") fConvalida(); F.auto = setTimeout(next, 5000); }, 6000); }), 900); };
    fSelect(a, i);
  };
  next();
}
function flowInit() {
  bindSeg("#f-ambito", "a", (a) => { fTouch(); fSelect(a, 0); });
  $("f-run").addEventListener("click", () => { fTouch(); fRun(); });
  $("f-next").addEventListener("click", fNext);
  fSelect("acq", 0);
  const sec = $("flusso");
  if (!REDUCED && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !F.started) { F.started = true; io.disconnect(); if (!F.touched) fAutoplay(); } }), { threshold: 0.35 });
    io.observe(sec);
  }
}

/* ═════════ Strumento · Check-up dei dati ═════════ */
const CHK_Q = [
  ["Dove si trovano i dati principali?", ["Un gestionale o un archivio unico", "Pochi file e sistemi diversi", "Sparsi tra email, file e carta"], "q"],
  ["Quanto sono uniformi codici e nomi?", ["Uniformi", "Con alcune varianti", "Molto variabili"], "q"],
  ["Quanto sono aggiornati?", ["Aggiornati con regolarità", "Non sempre", "Spesso obsoleti"], "q"],
  ["In che formato sono i documenti?", ["Digitali e strutturati", "Misti (PDF, Word)", "Scansioni o carta"], "q"],
  ["Ci sono duplicati o versioni diverse dello stesso dato?", ["Raramente", "Alcuni", "Spesso"], "q"],
  ["Esistono regole scritte per i casi ricorrenti?", ["Sì", "In parte", "No, le conoscono le persone"], "p"],
  ["Quante richieste simili arrivano?", ["Molte e ripetitive", "Un numero medio", "Poche e molto diverse"], "p"],
  ["Quanto sono sensibili i dati?", ["Poco", "Mediamente", "Molto (minori, segreto professionale)"], "r"],
];
const chkVal = CHK_Q.map(() => 1);
function chkInit() {
  $("chk-in").innerHTML = CHK_Q.map((q, i) => `<div class="field"><label class="l" for="cq${i}">${i + 1}. ${q[0]}</label><select id="cq${i}">${q[1].map((o, k) => `<option value="${k}" ${k === 1 ? "selected" : ""}>${o}</option>`).join("")}</select></div>`).join("") + '<p class="note">Otto domande, nessun dato viene inviato. Il risultato è un orientamento, non una valutazione: quella si fa sui dati veri.</p>';
  CHK_Q.forEach((_, i) => $("cq" + i).addEventListener("change", () => { chkVal[i] = parseInt($("cq" + i).value, 10); chkOut(); }));
  chkOut();
}
function chkOut() {
  const sc = (i) => 2 - chkVal[i];
  const qual = [0, 1, 2, 3, 4].reduce((s, i) => s + sc(i), 0), proc = sc(5) + sc(6), risc = chkVal[7];
  let tit, txt, passi, tipo;
  if (qual >= 8 && proc >= 3) { tipo = "t-assist"; tit = "Un agente è una buona ipotesi"; txt = "I dati sono in buono stato e il processo è ripetitivo e regolato. Si può partire con un progetto pilota su un perimetro ristretto."; passi = ["Mappare il processo con chi lo svolge", "Verificare la qualità dei dati su un campione", "Avviare un pilota breve, con criteri di verifica concordati"]; }
  else if (qual >= 8) { tipo = "t-no"; tit = "Dati buoni, ma l'agente avrebbe poco da fare"; txt = "Il processo è poco ripetitivo o poco regolato: un agente farebbe risparmiare poco tempo. Spesso conviene una ricerca nei documenti o dei modelli di risposta."; passi = ["Scrivere le regole dei casi ricorrenti", "Valutare ricerca nei documenti e modelli di risposta", "Riconsiderare l'agente se i volumi crescono"]; }
  else if (qual >= 5) { tipo = "t-first"; tit = "Prima sistemare i dati, poi un agente su un perimetro ristretto"; txt = "I dati sono utilizzabili ma con problemi che un agente amplificherebbe: codici diversi, duplicati, versioni non allineate. Meglio intervenire prima."; passi = ["Normalizzare codici e anagrafiche", "Eliminare i duplicati e allineare le versioni", "Avviare l'agente su un solo flusso"]; }
  else { tipo = "t-first"; tit = "Oggi un agente darebbe risultati non affidabili"; txt = "Con dati sparsi o disomogenei l'AI produce risposte plausibili ma sbagliate. La mossa migliore è ordinare i dati: può bastare questo a ridurre il lavoro."; passi = ["Censire dove si trovano i dati", "Definire un vocabolario e un archivio unico", "Valutare l'AI quando i dati sono ordinati"]; }
  if (chkVal[6] === 2 && qual >= 5) passi.push("Con volumi bassi e variabili, valutare prima soluzioni senza AI");
  const extra = risc === 2 ? '<p class="note"><b>Riservatezza alta:</b> valutate l\'elaborazione interamente in sede (strumento «Dimensionamento»).</p>' : "";
  const lbl = ["Alta", "Media", "Bassa"];
  const bar = (v, m) => `<div class="meterx"><i style="width:${(v / m) * 100}%"></i></div>`;
  const summary = CHK_Q.map((q, i) => `${i + 1}. ${q[0]} ${q[1][chkVal[i]]}`).join("\n");
  $("chk-out").innerHTML = `
    <div class="rs"><h3>Il vostro punto di partenza <small>orientamento</small></h3>
      <div class="gauges">
        <div><b>Qualità dei dati</b><strong>${qual}<em>/10</em></strong>${bar(qual, 10)}</div>
        <div><b>Ripetitività e regole</b><strong>${proc}<em>/4</em></strong>${bar(proc, 4)}</div>
        <div><b>Riservatezza</b><strong>${["Bassa", "Media", "Alta"][risc]}</strong>${bar(risc + 1, 3)}</div>
      </div></div>
    <div class="rs"><h3>Approccio suggerito <small>da verificare sui dati veri</small></h3>
      <p class="big">${tit}</p>
      <p>${txt}</p>
      <p><span class="ptag ${tipo}">${tipo === "t-assist" ? "Agente" : tipo === "t-no" ? "Senza AI" : "Prima i dati"}</span></p>
      <div class="two" style="grid-template-columns:1fr;border-top:1px solid var(--line);margin-top:14px"><div class="box" style="padding-left:0;border-left:0"><b>Prossimi passi</b><ol class="next">${passi.map((x) => `<li>${x}</li>`).join("")}</ol></div></div>
      ${extra}
      <div style="margin-top:14px"><a class="btn hot" href="contatti.html" id="chk-go">Richiedi una valutazione dei dati</a></div></div>`;
  $("chk-go").href = "contatti.html?msg=" + encodeURIComponent("Check-up dei dati (orientamento)\n" + summary + "\n\nEsito: " + tit);
  flashDiff("chk-out");
}

/* ═════════ Strumento 1 · Mappa delle attività ═════════ */
const ATT = {
  acq: [
    ["Inserimento di ordini da email e PDF", "auto", 6, "Estrazione e riconciliazione con i codici; la persona convalida."],
    ["Risposta a richieste di preventivo", "assist", 8, "Bozza con prezzi motivati; la persona sceglie i prezzi."],
    ["Solleciti di consegna ai fornitori", "auto", 2, "Testi ricorrenti, date di consegna note."],
    ["Controllo di ordine, bolla e fattura", "assist", 4, "Il confronto è meccanico; l'eccezione la valuta una persona."],
    ["Confronto delle offerte dei fornitori", "assist", 3, "Normalizzazione a costo finale; la scelta resta alla persona."],
    ["Negoziazione con i fornitori", "no", 3, "Relazione e giudizio: non si delega."],
    ["Qualifica e selezione dei fornitori", "no", 1, "Valutazione di soggetti e di rischio: resta umana."],
    ["Approvazione di ordini e riordini", "no", 2, "Decisione di spesa: sempre della persona."],
  ],
  seg: [
    ["Risposte a richieste ricorrenti (orari, costi, requisiti)", "auto", 8, "Risposte dalla documentazione ufficiale, con indicazione della fonte."],
    ["Fissazione di appuntamenti e colloqui", "assist", 4, "Proposta di appuntamenti dal calendario; conferma dell'operatore."],
    ["Compilazione di modulistica e attestati", "assist", 4, "Precompilazione da dati già presenti."],
    ["Rendicontazione e registri", "assist", 5, "Raccolta e controllo formale dei dati; verifica finale umana."],
    ["Comunicazioni delicate a famiglie e studenti", "no", 2, "Richiedono sensibilità e responsabilità: restano umane."],
    ["Colloqui di orientamento", "no", 3, "Relazione con la persona."],
    ["Valutazione o selezione di studenti", "no", 1, "Esclusa per scelta: riguarda persone, in particolare minori."],
    ["Gestione dei reclami", "no", 1, "Richiede giudizio e ascolto."],
  ],
  stu: [
    ["Smistamento della PEC e dei documenti in ingresso", "auto", 6, "Classificazione e assegnazione; i dubbi vanno al professionista."],
    ["Protocollo e archiviazione delle pratiche", "auto", 3, "Operazioni regolari e tracciabili."],
    ["Estrazione di parti, ruoli e scadenze", "assist", 4, "Estrazione con indicazione della fonte; verifica sul testo originale."],
    ["Sintesi di atti e documenti lunghi", "assist", 4, "Sintesi in tre punti; la lettura resta al professionista."],
    ["Ricerca di normativa e giurisprudenza", "assist", 3, "Ricerca assistita con verifica delle fonti."],
    ["Predisposizione di bozze di atti e pareri", "assist", 6, "Solo come bozza; la responsabilità è del professionista."],
    ["Calcolo dei termini processuali", "no", 1, "Non delegato: responsabilità professionale."],
    ["Consulenza e rapporto con il cliente", "no", 5, "Il nucleo della professione."],
  ],
};
const CLASSI = {
  auto: { nome: "Automatizzabile con verifica", pot: [0.5, 0.75], cls: "t-auto", bar: "a" },
  assist: { nome: "Assistito: l'AI prepara la bozza", pot: [0.2, 0.4], cls: "t-assist", bar: "b" },
  no: { nome: "Da non automatizzare", pot: [0, 0], cls: "t-no", bar: "c" },
};
const mapState = { ambito: "acq", ore: {}, on: {} };
function mapInit() {
  Object.keys(ATT).forEach((a) => ATT[a].forEach((r, i) => { mapState.ore[a + i] = r[2]; mapState.on[a + i] = true; }));
}
function mapRender() {
  const a = mapState.ambito;
  $("m-list").innerHTML = ATT[a].map((r, i) => {
    const id = a + i, c = CLASSI[r[1]];
    return `<label class="act"><input type="checkbox" data-id="${id}" ${mapState.on[id] ? "checked" : ""}>
      <span><b>${r[0]}</b><small>${r[3]}</small><span class="ptag ${c.cls}" style="margin-top:6px;display:inline-block">${c.nome}</span></span>
      <span><input class="ah" type="number" min="0" step="0.5" value="${mapState.ore[id]}" data-h="${id}" aria-label="Ore a settimana"> <small style="display:inline">h/sett.</small></span></label>`;
  }).join("");
  $("m-list").querySelectorAll("[data-id]").forEach((el) => el.addEventListener("change", () => { mapState.on[el.dataset.id] = el.checked; mapOut(); }));
  $("m-list").querySelectorAll("[data-h]").forEach((el) => el.addEventListener("input", () => { mapState.ore[el.dataset.h] = parseFloat(el.value) || 0; mapOut(); }));
  mapOut();
}
function mapOut() {
  const a = mapState.ambito, orario = num("m-orario"), settimane = 50;
  const sum = { auto: 0, assist: 0, no: 0 };
  let lo = 0, hi = 0, tot = 0;
  const fuori = [];
  ATT[a].forEach((r, i) => {
    const id = a + i; if (!mapState.on[id]) return;
    const h = mapState.ore[id] || 0, c = CLASSI[r[1]];
    sum[r[1]] += h; tot += h; lo += h * c.pot[0]; hi += h * c.pot[1];
    if (r[1] === "no") fuori.push(r);
  });
  const share = (k) => (tot ? (sum[k] / tot) * 100 : 0);
  $("m-out").innerHTML = `
    <div class="rs"><h3>Dove può intervenire l'AI <small>${dec(tot)} ore a settimana mappate</small></h3>
      <div class="stack"><i class="a" style="width:${share("auto")}%"></i><i class="b" style="width:${share("assist")}%"></i><i class="c" style="width:${share("no")}%"></i></div>
      <div class="legend"><span><i style="background:var(--ok)"></i>Automatizzabile con verifica · ${dec(sum.auto)} h</span><span><i style="background:var(--accent)"></i>Assistito · ${dec(sum.assist)} h</span><span><i style="background:#c5ccd9"></i>Da non automatizzare · ${dec(sum.no)} h</span></div>
      <div class="two" style="margin-top:8px">
        <div class="box"><b>Tempo recuperabile</b><strong>${dec(lo)} – ${dec(hi)} h</strong><span>a settimana, circa ${dec(lo * settimane, 0)} – ${dec(hi * settimane, 0)} h all'anno</span></div>
        <div class="box"><b>Valore indicativo</b><strong>${eur(lo * settimane * orario)} – ${eur(hi * settimane * orario)}</strong><span>all'anno, a ${orario} €/h</span></div>
      </div></div>
    <div class="rs"><h3>Ciò che resterebbe fuori <small>per scelta</small></h3>
      ${fuori.length ? `<table>${fuori.map((r) => `<tr><td><b>${r[0]}</b><br><span class="note">${r[3]}</span></td><td>${dec(mapState.ore[a + ATT[a].indexOf(r)])} h</td></tr>`).join("")}</table>` : "<p>Nessuna attività selezionata tra quelle da non automatizzare.</p>"}
      <p class="note" style="margin-top:12px">Quote di tempo recuperabile ipotizzate: 50-75% per le attività automatizzabili con verifica, 20-40% per quelle assistite. Sono stime di partenza, da validare nella fase di ascolto con chi svolge il lavoro.</p></div>`;
  flashDiff("m-out");
}

/* ═════════ Strumento 2 · Verifica a campione ═════════ */
function wilson(k, n, z) {
  if (n === 0) return { lo: 0, hi: 1 };
  const p = k / n, z2 = z * z, d = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / d;
  return { lo: Math.max(0, c - h), hi: Math.min(1, c + h) };
}
function nNeeded(pTrue, soglia, z) {
  for (let n = 10; n <= 1500; n++) if (wilson(Math.round(n * pTrue), n, z).lo >= soglia) return n;
  return null;
}
let vz = 1.96, vRatio = 0.8;
function verOut() {
  const n = parseInt($("v-n").value, 10);
  const kEl = $("v-k"); kEl.max = n;
  let k = Math.min(n, Math.round(n * vRatio)); if (document.activeElement === kEl) k = parseInt(kEl.value, 10); kEl.value = k;
  const s = parseInt($("v-s").value, 10) / 100, pT = parseInt($("v-p").value, 10) / 100;
  $("o-vn").textContent = n; $("o-vk").textContent = k; $("o-vs").textContent = Math.round(s * 100) + "%"; $("o-vp").textContent = Math.round(pT * 100) + "%";
  const w = wilson(k, n, vz), obs = k / n, conf = vz > 1.7 ? 95 : 90;
  let verdetto;
  if (w.lo >= s) verdetto = `<b>La soglia del ${pct(s)} è dimostrata</b> con confidenza del ${conf}%: il limite inferiore (${pct(w.lo)}) la supera.`;
  else if (obs >= s) verdetto = `<b>Il criterio operativo è soddisfatto, ma non dimostrato statisticamente.</b> Il valore osservato (${pct(obs)}) supera la soglia, ma con questo campione il limite inferiore è ${pct(w.lo)}.`;
  else verdetto = `<b>La soglia non è raggiunta:</b> il valore osservato è ${pct(obs)}, inferiore al ${pct(s)}.`;
  const nn = nNeeded(pT, s, vz);
  // curva del limite inferiore al crescere del campione
  const W = 640, H = 210, L = 44, R = 12, T = 12, B = 30, NMAX = 300;
  const x = (v) => L + ((v - 10) / (NMAX - 10)) * (W - L - R), y = (v) => T + (1 - v) * (H - T - B);
  const pts = []; for (let m = 10; m <= NMAX; m += 2) pts.push(`${x(m).toFixed(1)},${y(wilson(Math.round(m * pT), m, vz).lo).toFixed(1)}`);
  let grid = ""; [0, 0.25, 0.5, 0.75, 1].forEach((v) => (grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e7ee"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#586272">${Math.round(v * 100)}%</text>`));
  let xs = ""; [50, 100, 150, 200, 250, 300].forEach((v) => (xs += `<text x="${x(v)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#586272">${v}</text>`));
  const mk = nn && nn <= NMAX ? `<circle cx="${x(nn)}" cy="${y(s)}" r="5" fill="#fff" stroke="#2748c8" stroke-width="2"/><text x="${x(nn)}" y="${y(s) - 11}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#2748c8">n ≈ ${nn}</text>` : "";
  $("v-out").innerHTML = `
    <div class="rs"><h3>Intervallo di confidenza <small>${k} su ${n} · ${conf}%</small></h3>
      <p class="big">${pct(w.lo)} – ${pct(w.hi)}</p>
      <div class="range-bar"><div class="iv" style="left:${w.lo * 100}%;width:${(w.hi - w.lo) * 100}%"></div><div class="pt" style="left:${obs * 100}%"></div><div class="th" style="left:${s * 100}%"></div></div>
      <div class="range-scale"><span>0%</span><span>soglia ${pct(s)} (tratteggio) · valore osservato ${pct(obs)} (linea nera)</span><span>100%</span></div>
      <p style="margin-top:14px">${verdetto}</p></div>
    <div class="rs"><h3>Quante richieste servono <small>se la qualità reale fosse ${pct(pT)}</small></h3>
      <p>${nn ? `Per dimostrare almeno ${pct(s)} con confidenza del ${conf}% servono circa <b>${nn} richieste consecutive</b>.` : "Con questa qualità reale, così vicina alla soglia, servono più di 1.500 richieste."}</p>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Limite inferiore al crescere del campione">${grid}${xs}
        <line x1="${L}" x2="${W - R}" y1="${y(s)}" y2="${y(s)}" stroke="#1d7a58" stroke-dasharray="5 5"/>
        <polyline class="draw" pathLength="1" points="${pts.join(" ")}" fill="none" stroke="#2748c8" stroke-width="2.6"/>${mk}</svg>
      <div class="legend"><span><i style="background:#2748c8"></i>Limite inferiore atteso</span><span><i style="background:#1d7a58"></i>Soglia da dimostrare</span></div>
      <p class="note">Un criterio di accettazione operativo (ad esempio 24 su 30) è una regola concordata tra le parti, non una prova statistica: i due piani vanno tenuti distinti. Intervallo di Wilson, valido per risultati esito sì/no su richieste indipendenti.</p></div>`;
  flashDiff("v-out");
}

/* ═════════ Strumento 3 · Memoria dei modelli ═════════ */
const KV_MB = { 7: 0.13, 24: 0.16, 30: 0.2, 70: 0.31, 120: 0.2 }; // MB per token, stima media
const MACCH = [
  { n: "Workstation con GPU da 24 GB", mem: 24 },
  { n: "Mini-server con memoria unificata (circa 112 GB utilizzabili)", mem: 112 },
  { n: "Server con 1-2 GPU professionali (fino a 96 GB)", mem: 96 },
  { n: "Server multi-GPU (fino a 320 GB)", mem: 320 },
];
let mmBits = 4;
function memOut() {
  const par = parseInt($("mm-par").value, 10), ctx = parseInt($("mm-ctx").value, 10), users = parseInt($("mm-users").value, 10);
  $("o-mu").textContent = users;
  const eff = { 4: 4.5, 8: 8.5, 16: 16 }[mmBits];
  const pesi = (par * eff) / 8, kv = (KV_MB[par] * ctx * users) / 1024;
  const tot = (pesi + kv) * 1.1 + 2;
  const rows = MACCH.map((m) => {
    const r = tot / m.mem, ok = r <= 1;
    return `<div class="row"><span>${m.n}</span><div class="meter"><i class="${ok ? "" : "over"}" style="width:${Math.min(100, r * 100)}%"></i></div><span class="chip ${ok ? "" : "warn"}">${ok ? "Entra" : "Non entra"}</span></div>`;
  }).join("");
  const prima = [...MACCH].sort((a, b) => a.mem - b.mem).find((m) => tot <= m.mem);
  $("mm-out").innerHTML = `
    <div class="rs"><h3>Memoria necessaria <small>stima</small></h3>
      <p class="big">${dec(tot, 0)} GB</p>
      <table>
        <tr><td>Pesi del modello (${par} miliardi di parametri, ${mmBits} bit)</td><td>${dec(pesi)} GB</td></tr>
        <tr><td>Memoria di contesto (${ctx / 1024} k token × ${users} utenti)</td><td>${dec(kv)} GB</td></tr>
        <tr><td>Margine di esecuzione (10% + 2 GB)</td><td>${dec(tot - pesi - kv)} GB</td></tr>
        <tr class="tot"><td>Totale</td><td>${dec(tot, 0)} GB</td></tr>
      </table></div>
    <div class="rs"><h3>Quale macchina <small>${prima ? "la più piccola che basta: " + prima.n.split(" (")[0].toLowerCase() : "oltre le configurazioni standard"}</small></h3>
      <div class="fit">${rows}</div>
      <p class="note" style="margin-top:14px">Stime semplificate: la memoria di contesto varia con l'architettura del modello e i modelli a miscela di esperti hanno requisiti diversi. La velocità di risposta dipende dalla banda di memoria e non è stimata qui: la misureremo su macchine reali.</p></div>`;
  flashDiff("mm-out");
}

/* ═════════ Calcolatore di dimensionamento ═════════ */
const TIERS = [
  { nome: "Workstation con GPU da 24 GB", hw: [3500, 6000], inst: [2900, 4500], peakW: 450, maxModel: 30, maxConc: 2, modelli: "modelli fino a circa 30 miliardi di parametri (es. Mistral Small, Gemma, Qwen)" },
  { nome: "Mini-server con 128 GB di memoria unificata (classe NVIDIA GB10)", hw: [3000, 7000], inst: [3500, 6000], peakW: 240, maxModel: 120, maxConc: 4, modelli: "modelli fino a circa 70-120 miliardi di parametri, quantizzati" },
  { nome: "Server con 1-2 GPU professionali", hw: [12000, 30000], inst: [5000, 9000], peakW: 1000, maxModel: 120, maxConc: 12, modelli: "modelli da 70-120 miliardi di parametri con più utenti in parallelo" },
  { nome: "Server multi-GPU", hw: [50000, 120000], inst: [9000, 18000], peakW: 3000, maxModel: 400, maxConc: 60, modelli: "modelli grandi e carichi continui, anche con più sedi" },
];
const MODEL_NEED = { seg: 30, acq: 70, stu: 120, mix: 120 };
const GIORNI = 250, SEAT_MESE = 30;
const SCEN = { prudente: { min: 0.75, aut: 0.75, vol: 0.85 }, base: { min: 1, aut: 1, vol: 1 }, ottimistico: { min: 1.25, aut: 1.15, vol: 1.1 } };
let dati = "alta", formula = "acq";

function readIn() {
  return {
    I: { ambito: $("c-ambito").value, utenti: parseInt($("c-utenti").value, 10), rich: parseInt($("c-rich").value, 10), arch: parseInt($("c-arch").value, 10), ha: $("c-ha").checked, ups: $("c-ups").checked, formula },
    A: { kwh: num("a-kwh"), orario: num("a-orario"), min: num("a-min"), aut: num("a-aut") / 100, tokreq: num("a-tokreq"), token: num("a-token"), cont: num("a-cont") / 100, prog: num("a-prog"), supp: num("a-supp"), g: num("a-g") / 100, rent: num("a-rent") },
  };
}
function pickTier(I, A) {
  const conc = Math.max(1, Math.ceil(I.utenti * A.cont), Math.ceil(I.rich / 300));
  const need = MODEL_NEED[I.ambito];
  return { tier: TIERS.find((t) => t.maxModel >= need && t.maxConc >= conc) || TIERS[TIERS.length - 1], conc };
}
function calc(I, A, tier, o = {}) {
  const m = Object.assign({ rich: 1, min: 1, aut: 1, orario: 1, prog: 1, kwh: 1, hw: 1, token: 1 }, o.mult || {});
  const sc = o.scen || SCEN.base, k = I.ha ? 2 : 1, nol = I.formula === "nol";
  const hw = [tier.hw[0] * k * m.hw, tier.hw[1] * k * m.hw];
  const storage = [300 + I.arch * 0.25, 500 + I.arch * 0.4];
  const upsRete = I.ups ? [400 * k, 900 * k] : [0, 0];
  const inst = [tier.inst[0] * (I.ha ? 1.3 : 1), tier.inst[1] * (I.ha ? 1.3 : 1)];
  const asset = mid(hw) + mid(storage) + mid(upsRete);
  const invest = [hw[0] + storage[0] + upsRete[0] + inst[0], hw[1] + storage[1] + upsRete[1] + inst[1]];
  const upfront = nol ? mid(inst) : mid(invest);
  const rentAnno = nol ? (A.rent / 100) * asset * 12 : 0;
  const energia = ((tier.peakW * 0.4 * k * 8760) / 1000) * A.kwh * m.kwh;
  const manut = 0.08 * mid(hw) + A.supp;
  const eserc = energia + manut + rentAnno;
  const rich = I.rich * m.rich * sc.vol, aut = Math.min(0.95, A.aut * m.aut * sc.aut), minu = A.min * m.min * sc.min;
  const seatAnno = I.utenti * SEAT_MESE * 12, progC = A.prog * m.prog;
  const L = [upfront], Ac = [0], Se = [0], V = [0];
  for (let i = 1; i <= 120; i++) {
    const f = Math.pow(1 + A.g, Math.floor((i - 1) / 12));
    L[i] = L[i - 1] + eserc / 12;
    Ac[i] = Ac[i - 1] + (rich * f * GIORNI * A.tokreq / 1e6 * A.token * m.token) / 12;
    Se[i] = Se[i - 1] + seatAnno / 12;
    V[i] = V[i - 1] + (rich * f * GIORNI * minu / 60 * aut * A.orario * m.orario) / 12;
  }
  const first = (fn) => { for (let i = 1; i <= 120; i++) if (fn(i)) return i; return Infinity; };
  const ore = rich * GIORNI * minu / 60 * aut;
  return {
    tier, hw, storage, upsRete, inst, invest, upfront, nol, rentAnno, energia, manut, eserc, L, Ac, Se, V, ore, valore: ore * A.orario * m.orario,
    cloudAnno: Ac[12], seatAnno,
    pareggio: first((i) => L[i] <= Ac[i]),
    rCloud: first((i) => V[i] - Ac[i] >= progC),
    rSede: first((i) => V[i] - (L[i] - upfront) >= progC + upfront),
    net5: V[60] - (L[60] - upfront) - progC - upfront,
  };
}
const mesi = (m) => (!isFinite(m) ? "non rientra entro 10 anni" : m < 1 ? "meno di un mese" : m < 24 ? `${Math.round(m)} mesi` : `${dec(m / 12)} anni`);

function chart(r) {
  const W = 640, H = 230, L = 52, R = 14, T = 12, B = 30;
  const at = (arr) => (y) => arr[Math.round(y * 12)];
  const ymax = Math.max(r.L[60], r.Ac[60], r.Se[60]) * 1.08 || 1;
  const x = (y) => L + (y / 5) * (W - L - R), yy = (v) => T + (1 - v / ymax) * (H - T - B);
  const line = (arr) => Array.from({ length: 61 }, (_, i) => `${x(i / 12).toFixed(1)},${yy(arr[i]).toFixed(1)}`).join(" ");
  let grid = "";
  for (let i = 0; i <= 4; i++) { const v = (ymax / 4) * i, py = yy(v); grid += `<line x1="${L}" x2="${W - R}" y1="${py}" y2="${py}" stroke="#e3e7ee"/><text x="${L - 8}" y="${py + 4}" text-anchor="end" font-size="11" fill="#586272">${eurK(v)}</text>`; }
  let xs = ""; for (let y = 0; y <= 5; y++) xs += `<text x="${x(y)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#586272">${y === 0 ? "oggi" : y + (y === 1 ? " anno" : " anni")}</text>`;
  let mark = "";
  if (isFinite(r.pareggio) && r.pareggio <= 60) { const px = x(r.pareggio / 12), py = yy(r.L[r.pareggio]); mark = `<circle cx="${px}" cy="${py}" r="5" fill="#fff" stroke="#2748c8" stroke-width="2"/><text x="${px}" y="${py - 11}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#2748c8">pareggio ${dec(r.pareggio / 12)} anni</text>`; }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Costo cumulato in cinque anni">${grid}${xs}
    <polyline class="fadein" points="${line(r.Se)}" fill="none" stroke="#b4bdcc" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>
    <polyline class="fadein" points="${line(r.Ac)}" fill="none" stroke="#7b869a" stroke-width="2.4" stroke-dasharray="7 5"/>
    <polyline class="draw" pathLength="1" points="${line(r.L)}" fill="none" stroke="#2748c8" stroke-width="3" stroke-linejoin="round"/>${mark}</svg>
    <div class="legend"><span><i style="background:#2748c8"></i>In sede (${r.nol ? "noleggio" : "acquisto"} + esercizio)</span><span><i style="background:#7b869a"></i>Modello in cloud a consumo</span><span><i style="background:#b4bdcc"></i>Abbonamento per utente</span></div>`;
}

function tornado(I, A, tier) {
  const vars = [["rich", "Richieste al giorno"], ["min", "Minuti manuali per richiesta"], ["aut", "Quota automatizzata"], ["orario", "Costo orario del personale"], ["prog", "Costo del progetto"], ["hw", "Prezzo dell'hardware"], ["kwh", "Costo dell'energia"]];
  const rows = vars.map(([k, nome]) => {
    const a = calc(I, A, tier, { mult: { [k]: 0.75 } }).net5, b = calc(I, A, tier, { mult: { [k]: 1.25 } }).net5;
    return { nome, lo: Math.min(a, b), hi: Math.max(a, b), sw: Math.abs(b - a) };
  }).sort((p, q) => q.sw - p.sw);
  const mx = rows[0].sw || 1;
  return rows.map((r) => `<div class="row"><span>${r.nome}<small>da ${eur(r.lo)} a ${eur(r.hi)}</small></span><div class="bar2"><i style="width:${(r.sw / mx) * 100}%"></i></div></div>`).join("");
}

function summary(R, S, tierInfo, I, A) {
  const amb = { seg: "Segreteria", acq: "Acquisti e ordini", stu: "Studio professionale", mix: "Più ambiti" }[I.ambito];
  return [
    `Configurazione indicativa: ${tierInfo.tier.nome}${I.ha ? " ×2 (alta disponibilità)" : ""}`,
    `Ambito: ${amb} · ${I.utenti} utenti · ${I.rich} richieste al giorno · dati ${dati} · formula: ${I.formula === "nol" ? "noleggio" : "acquisto"}`,
    `Una tantum: ${rng(R.invest)}${R.nol ? ` (con noleggio: ${eur(R.upfront)} iniziali + ${eur(R.rentAnno)} all'anno)` : ""}`,
    `Esercizio annuo: circa ${eur(R.eserc)} (energia ${eur(R.energia)}, manutenzione e supporto ${eur(R.manut)}${R.nol ? `, noleggio ${eur(R.rentAnno)}` : ""})`,
    `Modello in cloud: circa ${eur(R.cloudAnno)} all'anno (crescita del volume ${dec(A.g * 100)}% annuo)`,
    `Pareggio in sede contro cloud: ${isFinite(R.pareggio) ? dec(R.pareggio / 12) + " anni" : "non raggiunto"}`,
    `Risparmio di lavoro (prudente / base / ottimistico): ${eur(S.prudente.valore)} / ${eur(S.base.valore)} / ${eur(S.ottimistico.valore)} all'anno`,
    "Cifre indicative, IVA esclusa, non costituiscono un'offerta.",
  ].join("\n");
}

function render() {
  $("o-utenti").textContent = $("c-utenti").value;
  $("o-rich").textContent = $("c-rich").value;
  const { I, A } = readIn();
  const ti = pickTier(I, A), tier = ti.tier;
  const R = calc(I, A, tier);
  const S = { prudente: calc(I, A, tier, { scen: SCEN.prudente }), base: R, ottimistico: calc(I, A, tier, { scen: SCEN.ottimistico }) };
  const sens = {
    alta: "Dati molto sensibili: consigliamo l'elaborazione interamente in sede, nulla lascia l'organizzazione.",
    media: "Valutate anche archivio in sede con richieste al modello in cloud e contratto adeguato.",
    bassa: "Con dati poco sensibili un modello in cloud è di norma la scelta più semplice: confrontiamo i costi prima di proporre hardware.",
  }[dati];
  const anni = isFinite(R.pareggio) ? R.pareggio / 12 : Infinity;
  const cloudVince = !(anni <= 5);
  const costoRich = (A.tokreq / 1e6) * A.token * GIORNI;
  const richP5 = costoRich > 0 ? (R.upfront / 5 + R.eserc) / costoRich : Infinity;
  const verdetto = dati === "bassa" && cloudVince
    ? "Solo sul costo conviene il modello in cloud. L'elaborazione in sede ha senso se la riservatezza o il controllo contano più della spesa."
    : cloudVince
    ? `Solo sul costo, a questo volume conviene il modello in cloud (l'investimento in sede si ripaga oltre i cinque anni, o non si ripaga). L'elaborazione in sede si giustifica per riservatezza: dal volume di circa ${isFinite(richP5) ? Math.round(richP5).toLocaleString("it-IT") : "—"} richieste al giorno inizia a convenire anche sul costo.`
    : `A questo volume l'elaborazione in sede si ripaga in circa ${dec(anni)} anni rispetto al modello in cloud, e i dati restano in sede.`;
  const gb = (v) => (v < 24 ? "good" : !isFinite(v) ? "bad" : "");
  const arch = I.arch >= 1000 ? I.arch / 1000 + " TB" : I.arch + " GB";
  const text = summary(R, S, ti, I, A);

  const costiRows = R.nol
    ? `<tr><td>Hardware, archiviazione e rete</td><td>in noleggio</td></tr>
       <tr><td>Installazione e messa in opera</td><td>${rng(R.inst)}</td></tr>
       <tr class="tot"><td>Costo iniziale</td><td>${rng(R.inst)}</td></tr>
       <tr><td>Canone di noleggio all'anno (rinnovo alle stesse condizioni)</td><td>${eur(R.rentAnno)}</td></tr>`
    : `<tr><td>Hardware</td><td>${rng(R.hw)}</td></tr>
       <tr><td>Archiviazione e copie di sicurezza (${arch})</td><td>${rng(R.storage)}</td></tr>
       <tr><td>Gruppo di continuità e rete</td><td>${I.ups ? rng(R.upsRete) : "escluso"}</td></tr>
       <tr><td>Installazione e messa in opera</td><td>${rng(R.inst)}</td></tr>
       <tr class="tot"><td>Totale una tantum</td><td>${rng(R.invest)}</td></tr>`;

  $("risultato").innerHTML = `
    <pre class="print-sum">${text}</pre>
    <div class="rs"><h3>Configurazione consigliata <small>${ti.conc} richieste in parallelo</small></h3>
      <p class="big">${tier.nome}${I.ha ? " × 2" : ""}</p>
      <p>Esegue ${tier.modelli}. ${sens}</p>
      <p class="note">I modelli a pesi aperti eseguiti in sede sono meno capaci dei modelli commerciali sui compiti più complessi: lo verifichiamo con una prova sul vostro caso prima di decidere.</p></div>

    <div class="rs"><h3>Costi <small>${R.nol ? "noleggio" : "acquisto"}</small></h3>
      <table>${costiRows}
        <tr><td>Energia all'anno</td><td>${eur(R.energia)}</td></tr>
        <tr><td>Manutenzione e supporto all'anno</td><td>${eur(R.manut)}</td></tr>
        <tr class="tot"><td>Esercizio all'anno${R.nol ? " (canone incluso)" : ""}</td><td>${eur(R.eserc)}</td></tr>
      </table></div>

    <div class="rs"><h3>Confronto in cinque anni <small>costo cumulato</small></h3>
      ${chart(R)}
      <div class="two" style="margin-top:14px">
        <div class="box"><b>In sede a 3 anni</b><strong>${eur(R.L[36])}</strong><span>${R.nol ? "noleggio" : "acquisto"} più tre anni di esercizio</span></div>
        <div class="box"><b>Cloud a 3 anni</b><strong>${eur(R.Ac[36])}</strong><span>${eur(R.cloudAnno)} il primo anno, crescita ${dec(A.g * 100)}% annua</span></div>
        <div class="box"><b>Abbonamento a 3 anni</b><strong>${eur(R.Se[36])}</strong><span>${I.utenti} utenti × ${SEAT_MESE} €/mese, solo chat</span></div>
      </div></div>

    <div class="rs"><h3>Rientro dell'investimento <small>tre scenari</small></h3>
      <p>Risparmio di lavoro stimato con ${I.rich} richieste al giorno, ${A.min} minuti manuali ciascuna e ${Math.round(A.aut * 100)}% automatizzato (scenario base): circa <b>${Math.round(R.ore).toLocaleString("it-IT")} ore</b> all'anno, pari a <b>${eur(R.valore)}</b>.</p>
      <table class="multi">
        <tr><th>Scenario</th><th>Ore/anno</th><th>Valore/anno</th><th>Rientro cloud</th><th>Rientro in sede</th></tr>
        ${["prudente", "base", "ottimistico"].map((k) => `<tr><td>${k[0].toUpperCase() + k.slice(1)}</td><td>${Math.round(S[k].ore).toLocaleString("it-IT")}</td><td>${eur(S[k].valore)}</td><td>${mesi(S[k].rCloud)}</td><td>${mesi(S[k].rSede)}</td></tr>`).join("")}
      </table>
      <div class="two" style="margin-top:14px">
        <div class="box ${gb(R.rCloud)}"><b>Base · con modello in cloud</b><strong>${mesi(R.rCloud)}</strong><span>progetto ${eur(A.prog)}</span></div>
        <div class="box ${gb(R.rSede)}"><b>Base · con elaborazione in sede</b><strong>${mesi(R.rSede)}</strong><span>progetto più ${R.nol ? "installazione" : "hardware"} (${eur(A.prog + R.upfront)})</span></div>
      </div>
      <p class="note" style="margin-top:12px">Il risparmio è una stima basata sulle ipotesi indicate, non un risultato garantito: si misura nella fase di verifica. Scenario prudente: tempi e quota automatizzata al 75%, volume al 85%; ottimistico: +25% sui tempi, +15% sulla quota, volume al 110%.</p></div>

    <div class="rs tornado"><h3>Cosa pesa di più <small>variazione ±25% di ogni ipotesi</small></h3>
      <p>Beneficio netto a cinque anni con elaborazione in sede (risparmio, meno costi, meno progetto e investimento). Le barre più lunghe indicano le ipotesi da misurare per prime.</p>
      ${tornado(I, A, tier)}</div>

    <div class="verdict"><p>${verdetto}</p>
      <div class="btns"><a class="btn hot" href="contatti.html" id="prefill">Richiedi un incontro con questi dati</a>
      <button class="btn ghost" type="button" id="copy">Copia il riepilogo</button>
      <button class="btn ghost" type="button" id="print">Stampa o salva in PDF</button></div></div>`;

  $("prefill").href = "contatti.html?msg=" + encodeURIComponent(text);
  $("print").addEventListener("click", () => {
    document.body.classList.add("printing");
    const off = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", off); };
    window.addEventListener("afterprint", off); window.print(); setTimeout(off, 1500);
  });
  $("copy").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(text); b.textContent = "Copiato"; }
    catch { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); b.textContent = "Copiato"; }
    setTimeout(() => (b.textContent = "Copia il riepilogo"), 1800);
  });
  flashDiff("risultato");
}

/* ═════════ Comparsa allo scroll ═════════ */
function initReveal() {
  const sel = ".strip div, .deliv, .flow-in, .flow-main, .ribbon, .stats, .picker, .panel > div, .node, .step, .grid > .card, .calc-in, .rs, .verdict, .tool-in, .eyebrow, section h2";
  const els = [...document.querySelectorAll(sel)];
  els.forEach((el) => {
    el.classList.add("reveal");
    const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains("reveal")) : [];
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 90 + "ms");
  });
  const cells = $("cells");
  if (REDUCED || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); if (cells) cells.classList.add("in"); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach((el) => io.observe(el));
  if (cells) io.observe(cells);
}

/* ═════════ Rete neurale di sfondo ═════════ */
function initNet() {
  const c = $("net");
  if (!c || !c.getContext) return;
  const ctx = c.getContext("2d");
  let w = 0, h = 0, nodes = [], pulses = [], raf = 0, visible = true, mouse = null;
  const LINK = 160, MR = 150;
  function size() {
    const r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(20, Math.min(54, Math.round((w * h) / 18000)));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2 }));
    pulses = [];
  }
  function edges() {
    const out = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < LINK) out.push([i, j, d]);
      }
    return out;
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const es = edges();
    ctx.lineWidth = 1;
    es.forEach(([i, j, d]) => {
      ctx.strokeStyle = `rgba(36,60,110,${0.24 * (1 - d / LINK)})`;
      ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
    });
    nodes.forEach((n) => { ctx.fillStyle = "rgba(36,60,110,.4)"; ctx.beginPath(); ctx.arc(n.x, n.y, 2.2, 0, 6.283); ctx.fill(); });
    if (mouse) {
      nodes.forEach((n) => { const d = Math.hypot(n.x - mouse.x, n.y - mouse.y); if (d < MR) { ctx.strokeStyle = `rgba(39,72,200,${0.4 * (1 - d / MR)})`; ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke(); } });
      ctx.fillStyle = "rgba(39,72,200,.55)"; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, 6.283); ctx.fill();
    }
    pulses.forEach((p) => {
      const a = nodes[p.i], b = nodes[p.j], x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.fillStyle = `rgba(39,72,200,${Math.sin(p.t * Math.PI)})`;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.283); ctx.fill();
    });
    return es;
  }
  function step() {
    nodes.forEach((n) => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1; });
    const es = draw();
    if (es.length && pulses.length < 9 && Math.random() < 0.05) { const e = es[Math.floor(Math.random() * es.length)]; pulses.push({ i: e[0], j: e[1], t: 0 }); }
    pulses.forEach((p) => (p.t += 0.012));
    pulses = pulses.filter((p) => p.t < 1);
    if (visible) raf = requestAnimationFrame(step);
  }
  size(); draw();
  if (REDUCED) return;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; cancelAnimationFrame(raf); if (visible) { if (w === 0 || h === 0) { size(); draw(); } raf = requestAnimationFrame(step); } }).observe(c);
  const hero = c.parentElement;
  hero.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  hero.addEventListener("pointerleave", () => { mouse = null; });
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(); }, 150); });
}

/* ═════════ Titolo, scorrimento, grafici ═════════ */
function splitHeadline() {
  const h = document.querySelector(".hero h1");
  if (!h || REDUCED) return;
  let i = 0;
  const wrap = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((t) => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        const o = document.createElement("span"), s = document.createElement("span");
        o.className = "w"; s.textContent = t; s.style.setProperty("--i", i++); o.appendChild(s); frag.appendChild(o);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== "BR") wrap(n);
  });
  wrap(h);
}
function initScroll() {
  const bar = $("progress"), top = document.querySelector(".top");
  const on = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    top.classList.toggle("scrolled", scrollY > 8);
  };
  addEventListener("scroll", on, { passive: true }); on();
}
function armLive() {
  const ids = ["risultato", "m-out", "v-out", "mm-out", "chk-out"].map($).filter(Boolean);
  if (REDUCED || !("IntersectionObserver" in window)) { ids.forEach((e) => e.classList.add("play", "done")); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("play"); setTimeout(() => e.target.classList.add("done"), 2200); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -15% 0px" });
  ids.forEach((e) => io.observe(e));
}

/* ═════════ Pagine: schede selezionabili da indirizzo ═════════ */
const AMBITI = ["acq", "seg", "stu", "amm", "hr", "log", "cli", "prod", "dir"];
const TOOLSLUG = { dati: "chk", mappa: "map", verifica: "camp", memoria: "mem", dimensionamento: "dim", contesti: "casi" };
function selectTool(t) {
  document.querySelectorAll("#tool-picker .pick").forEach((x) => x.setAttribute("aria-selected", x.dataset.t === t));
  document.querySelectorAll("#strumenti .tool").forEach((p) => p.classList.toggle("hidden", p.dataset.tool !== t));
}
function selectAmbito(s) {
  document.querySelectorAll("#soluzioni .pick").forEach((x) => x.setAttribute("aria-selected", x.dataset.s === s));
  document.querySelectorAll("#soluzioni .panel").forEach((p) => p.classList.toggle("hidden", p.dataset.p !== s));
}
function route(first) {
  const id = location.hash.slice(1);
  if ($("tool-picker")) {
    selectTool(TOOLSLUG[id] || "chk");
    if (!first) scrollTo({ top: 0, behavior: "instant" });
  }
  if ($("soluzioni") && AMBITI.includes(id)) {
    selectAmbito(id);
    if (!first) scrollTo({ top: 0, behavior: "instant" });
  }
}

/* ═════════ Menu su schermi stretti ═════════ */
function initMenu() {
  const btn = document.querySelector(".menu-btn"), top = document.querySelector(".top");
  if (!btn) return;
  const set = (open) => { top.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu"); };
  btn.addEventListener("click", () => set(!top.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  document.querySelectorAll("#menu a").forEach((a) => a.addEventListener("click", () => set(false)));
}

/* ═════════ Barra dei cookie ═════════
   Oggi il sito non usa cookie né strumenti non tecnici, quindi la barra è SPENTA (enabled: false):
   non serve e, senza nulla da scegliere, sarebbe solo rumore. Per accenderla quando si aggiunge
   uno strumento di statistica: 1) enabled: true; 2) mettere in ANALYTICS la funzione che carica lo
   strumento (parte solo dopo il consenso); 3) aggiornare cookie.html (strumenti, durata, fornitori)
   e l'informativa privacy. La scelta è conservata nel browser (localStorage, chiave tecnica).
   Anteprima senza accenderla: aprire una pagina con #cookiebar-demo (non salva nulla). */
const COOKIE_BAR = { enabled: false, days: 180, key: "stadera-consenso" };
const ANALYTICS = [];
function initCookieBar() {
  const demo = location.hash === "#cookiebar-demo";
  if (!COOKIE_BAR.enabled && !demo) return;
  const read = () => {
    try {
      const c = JSON.parse(localStorage.getItem(COOKIE_BAR.key) || "null");
      return c && Date.now() - c.ts < COOKIE_BAR.days * 864e5 ? c : null;
    } catch (e) { return null; }
  };
  const save = (stats) => {
    if (demo) return;
    try { localStorage.setItem(COOKIE_BAR.key, JSON.stringify({ stats, ts: Date.now() })); } catch (e) {}
  };
  const apply = (c) => { if (c && c.stats) ANALYTICS.forEach((f) => { try { f(); } catch (e) {} }); };
  const bar = document.createElement("div");
  bar.className = "cookiebar"; bar.setAttribute("role", "dialog"); bar.setAttribute("aria-label", "Preferenze sui cookie"); bar.hidden = true;
  bar.innerHTML = `
    <div class="cb-main">
      <p><b>Cookie e strumenti di terze parti.</b> Usiamo strumenti necessari al funzionamento del sito. Quelli di statistica restano spenti finché non li accettate. Potete cambiare scelta in qualsiasi momento. <a href="cookie.html">Cookie policy</a></p>
      <div class="cb-btns">
        <button type="button" class="btn sm ghost" data-a="no">Rifiuta</button>
        <button type="button" class="btn sm ghost" data-a="prefs">Preferenze</button>
        <button type="button" class="btn sm ghost" data-a="yes">Accetta</button>
      </div>
    </div>
    <div class="cb-prefs" hidden>
      <label class="cb-row"><span><b>Necessari</b><small>Servono al funzionamento del sito. Sempre attivi.</small></span><input type="checkbox" checked disabled></label>
      <label class="cb-row"><span><b>Statistiche</b><small>Ci aiutano a capire come viene usato il sito. Spenti per impostazione.</small></span><input type="checkbox" id="cb-stats"></label>
      <div class="cb-btns"><button type="button" class="btn sm ghost" data-a="no">Rifiuta tutto</button><button type="button" class="btn sm ghost" data-a="save">Salva le preferenze</button></div>
    </div>`;
  document.body.appendChild(bar);
  const stats = bar.querySelector("#cb-stats"), prefs = bar.querySelector(".cb-prefs"), main = bar.querySelector(".cb-main");
  const close = () => { bar.hidden = true; };
  const open = (showPrefs) => {
    const c = read(); stats.checked = !!(c && c.stats);
    prefs.hidden = !showPrefs; main.hidden = showPrefs; bar.hidden = false;
    (showPrefs ? stats : bar.querySelector('[data-a="yes"]')).focus({ preventScroll: true });
  };
  const choose = (v) => { save(v); apply({ stats: v }); close(); };
  bar.addEventListener("click", (e) => {
    const a = e.target.closest("button") && e.target.closest("button").dataset.a;
    if (a === "yes") choose(true); else if (a === "no") choose(false);
    else if (a === "prefs") open(true); else if (a === "save") choose(stats.checked);
  });
  const foot = document.querySelector(".foot-nav");
  if (foot) {
    const l = document.createElement("a"); l.href = "#cookie-preferenze"; l.textContent = "Preferenze cookie";
    l.addEventListener("click", (e) => { e.preventDefault(); open(true); });
    foot.append(" · ", l);
  }
  const c = read();
  if (c) apply(c); else open(false);
}

/* ═════════ Avvio ═════════ */
function bindSeg(sel, attr, cb) {
  document.querySelectorAll(sel + " button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(sel + " button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    cb(b.dataset[attr]);
  }));
}
function toolsInit() {
  document.querySelectorAll("#tool-picker .pick").forEach((b) => b.addEventListener("click", () => {
    selectTool(b.dataset.t);
    history.replaceState(null, "", "#" + b.dataset.slug);
  }));
  chkInit();
  mapInit(); mapRender();
  bindSeg("#m-ambito", "a", (a) => { mapState.ambito = a; mapRender(); });
  $("m-orario").addEventListener("input", mapOut);
  ["v-n", "v-s", "v-p"].forEach((id) => $(id).addEventListener("input", verOut));
  $("v-k").addEventListener("input", () => { vRatio = parseInt($("v-k").value, 10) / parseInt($("v-n").value, 10); verOut(); });
  bindSeg("#v-conf", "z", (z) => { vz = parseFloat(z); verOut(); });
  verOut();
  ["mm-par", "mm-ctx", "mm-users"].forEach((id) => $(id).addEventListener("input", memOut));
  bindSeg("#mm-bits", "b", (b) => { mmBits = parseInt(b, 10); memOut(); });
  memOut();
  ["c-ambito", "c-utenti", "c-rich", "c-arch", "c-ha", "c-ups", "a-kwh", "a-orario", "a-min", "a-aut", "a-tokreq", "a-token", "a-cont", "a-prog", "a-supp", "a-g", "a-rent"]
    .forEach((id) => $(id).addEventListener("input", render));
  bindSeg("#c-dati", "v", (v) => { dati = v; render(); });
  bindSeg("#c-formula", "f", (f) => { formula = f; render(); });
  render();
  document.querySelectorAll("#casi-filtro .pick").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#casi-filtro .pick").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll("#casi-grid .card").forEach((c) => c.classList.toggle("hidden", b.dataset.f !== "all" && c.dataset.a !== b.dataset.f));
  }));
}
document.addEventListener("DOMContentLoaded", () => {
  splitHeadline();
  initMenu();
  initCookieBar();

  if ($("f-run")) flowInit();
  if ($("soluzioni")) document.querySelectorAll("#soluzioni .pick").forEach((b) => b.addEventListener("click", () => selectAmbito(b.dataset.s)));
  if ($("cells")) $("cells").innerHTML = Array.from({ length: 30 }, (_, i) => `<i class="${i < 24 ? "" : "o"}" style="--k:${i}"></i>`).join("");
  if ($("tool-picker")) toolsInit();

  initReveal();
  initNet();
  initScroll();
  armLive();

  addEventListener("hashchange", () => route(false));
  route(true);

  const form = $("contatto");
  // Destinatari per il ripiego via programma di posta, composti qui e non scritti per esteso nella pagina.
  const TO = ["cotizelati.emanuele", "matteomarchi.1988"].map((u) => u + "@gmail.com").join(",");
  const pre = new URLSearchParams(location.search).get("msg");
  if (form && pre) $("msg").value = pre;
  const t0 = Date.now();
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const esito = $("esito"), btn = form.querySelector("button[type=submit]"), d = new FormData(form);
    d.append("t", String(t0));
    btn.disabled = true; esito.textContent = "Invio in corso…";
    try {
      const r = await fetch("invia.php", { method: "POST", body: d });
      const j = await r.json();
      esito.textContent = j.messaggio;
      if (j.ok) form.reset();
    } catch (err) {
      // Il server non risponde (o la pagina non è sul sito vero): apro il programma di posta.
      const body = `Nome: ${d.get("nome")}\nEmail: ${d.get("email")}\nOrganizzazione: ${d.get("azienda")}\n\n${d.get("msg")}`;
      esito.textContent = "Si apre il vostro programma di posta per completare l'invio.";
      location.href = `mailto:${TO}?subject=${encodeURIComponent("Richiesta di incontro")}&body=${encodeURIComponent(body)}`;
    }
    btn.disabled = false;
  });
});
