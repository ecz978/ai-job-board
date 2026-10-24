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

/* ═════════ Demo ═════════ */
const DEMO = {
  acq: {
    label: "Email in ingresso · cliente",
    text: "Buongiorno, servono 40 sacchi di cemento 32.5, 12 mq di lastre di cartongesso da 13 mm e 6 profili 48 per mercoledì in cantiere a Monza. Mi mandate il prezzo? Grazie, G. Rossi",
    out: `<table>
      <tr><th>Scritto</th><th>Articolo</th><th>Qtà</th><th>Giacenza</th><th>€/unità</th></tr>
      <tr><td>cemento 32.5</td><td>Cemento CEM II 32,5 · 25 kg</td><td>40</td><td><span class="chip">Disponibile</span></td><td>6,80</td></tr>
      <tr><td>cartongesso 13 mm</td><td>Lastra standard 13 · 1,2×2 m</td><td>5</td><td><span class="chip warn">Parziale · 3</span></td><td>8,40</td></tr>
      <tr><td>profili 48</td><td>Montante 48 · 3 m</td><td>6</td><td><span class="chip">Disponibile</span></td><td>3,20</td></tr>
    </table>
    <p><b>Margine stimato:</b> 22% · <b>Da ordinare al fornitore:</b> 2 lastre · <b>Prezzi:</b> listino cliente</p>`,
    human: "Il commerciale stabilisce i prezzi e invia"
  },
  seg: {
    label: "Email in ingresso · candidato",
    text: "Buongiorno, vorrei sapere costo e date del corso per operatori socio sanitari, e se posso passare a parlarne giovedì pomeriggio. Grazie, M. Bianchi",
    out: `<p><b>Classificazione:</b> informazione + richiesta di colloquio</p>
    <p><b>Risposta (dalla scheda corso):</b> costo e date come da documentazione ufficiale; requisiti di accesso in allegato. <i>Fonte: scheda corso OSS, rev. 2026</i></p>
    <p><b>Slot proposti:</b> giovedì 15:00 · giovedì 16:30</p>`,
    human: "L'operatore verifica e conferma"
  },
  stu: {
    label: "PEC in ingresso · studio",
    text: "OGGETTO: Notifica atto di citazione. Il Tribunale di Monza comunica che l'udienza di prima comparizione è fissata per il 14/03/2027. In allegato atto (PDF, 18 pp.).",
    out: `<p><b>Tipo:</b> atto giudiziario · notifica</p>
    <p><b>Estratto dal testo:</b> Tribunale di Monza · udienza 14/03/2027 · atto di citazione, 18 pp.</p>
    <p><b>Sintesi:</b> 1) citazione notificata via PEC; 2) udienza di prima comparizione fissata; 3) allegato da leggere integralmente.</p>
    <p><b>Termini:</b> <span class="chip warn">da calcolare e verificare dal professionista</span></p>`,
    human: "Il professionista legge e gestisce la pratica"
  }
};
const ORDER = ["acq", "seg", "stu"];
const DONE_MSG = "<span>Convalidato dalla persona. Solo ora può avvenire l'invio.</span>";

let typeTimer = null, demoKey = "acq", auto = null, userTouched = false;
function typeText(el, text, done) {
  clearInterval(typeTimer);
  if (REDUCED) { el.textContent = text; el.classList.remove("typing"); done && done(); return; }
  el.textContent = ""; el.classList.add("typing");
  let i = 0;
  typeTimer = setInterval(() => {
    i += 2; el.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(typeTimer); el.classList.remove("typing"); done && done(); }
  }, 14);
}
function showDemo(k, done) {
  demoKey = k;
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.d === k));
  $("in-label").textContent = DEMO[k].label;
  $("out-wrap").classList.add("hidden");
  const run = $("run"); run.disabled = false; run.textContent = "Avvia l'esempio →";
  typeText($("in-text"), DEMO[k].text, done);
}
function runDemo(after) {
  const d = DEMO[demoKey], out = $("out"), run = $("run");
  run.disabled = true;
  $("out-wrap").classList.remove("hidden");
  out.innerHTML = '<div class="thinking">lettura del documento</div>';
  setTimeout(() => {
    out.innerHTML = `${d.out}<div class="human" id="human"><span>Verifica umana · ${d.human}</span><button type="button" id="ok">Convalida</button></div>`;
    $("ok").addEventListener("click", () => {
      userTouched = true;
      const h = $("human"); h.classList.add("done"); h.innerHTML = DONE_MSG;
    });
    run.textContent = "Ripeti"; run.disabled = false;
    after && after();
  }, 900);
}
function autoplay() {
  if (REDUCED) return;
  let idx = 0;
  const cycle = () => {
    if (userTouched) return;
    showDemo(ORDER[idx], () => {
      if (userTouched) return;
      auto = setTimeout(() => runDemo(() => {
        if (userTouched) return;
        auto = setTimeout(() => {
          if (userTouched) return;
          const h = $("human");
          if (h) { h.classList.add("done"); h.innerHTML = DONE_MSG; }
          auto = setTimeout(() => { idx = (idx + 1) % ORDER.length; cycle(); }, 2600);
        }, 2600);
      }), 700);
    });
  };
  cycle();
}
function stopAuto() { userTouched = true; clearTimeout(auto); }

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
        <polyline points="${pts.join(" ")}" fill="none" stroke="#2748c8" stroke-width="2.6"/>${mk}</svg>
      <div class="legend"><span><i style="background:#2748c8"></i>Limite inferiore atteso</span><span><i style="background:#1d7a58"></i>Soglia da dimostrare</span></div>
      <p class="note">Un criterio di accettazione operativo (ad esempio 24 su 30) è una regola concordata tra le parti, non una prova statistica: i due piani vanno tenuti distinti. Intervallo di Wilson, valido per risultati esito sì/no su richieste indipendenti.</p></div>`;
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
    <polyline points="${line(r.Se)}" fill="none" stroke="#b4bdcc" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>
    <polyline points="${line(r.Ac)}" fill="none" stroke="#7b869a" stroke-width="2.4" stroke-dasharray="7 5"/>
    <polyline points="${line(r.L)}" fill="none" stroke="#2748c8" stroke-width="3" stroke-linejoin="round"/>${mark}</svg>
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
      <div class="btns"><a class="btn hot" href="#contatti" id="prefill">Richiedi un incontro con questi dati</a>
      <button class="btn ghost" type="button" id="copy">Copia il riepilogo</button>
      <button class="btn ghost" type="button" id="print">Stampa o salva in PDF</button></div></div>`;

  $("prefill").addEventListener("click", () => { $("msg").value = text; });
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
}

/* ═════════ Comparsa allo scroll ═════════ */
function initReveal() {
  const sel = ".strip div, .ribbon, .stats, .picker, .panel > div, .node, .step, .grid > .card, .calc-in, .rs, .verdict, .tool-in, .eyebrow, section h2";
  const els = [...document.querySelectorAll(sel)];
  els.forEach((el) => {
    el.classList.add("reveal");
    const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains("reveal")) : [];
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 90 + "ms");
  });
  const cells = $("cells");
  if (REDUCED || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); cells.classList.add("in"); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach((el) => io.observe(el));
  io.observe(cells);
}

/* ═════════ Rete neurale di sfondo ═════════ */
function initNet() {
  const c = $("net");
  if (!c || !c.getContext) return;
  const ctx = c.getContext("2d");
  let w = 0, h = 0, nodes = [], pulses = [], raf = 0, visible = true;
  const LINK = 160;
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
    if (es.length && pulses.length < 6 && Math.random() < 0.03) { const e = es[Math.floor(Math.random() * es.length)]; pulses.push({ i: e[0], j: e[1], t: 0 }); }
    pulses.forEach((p) => (p.t += 0.012));
    pulses = pulses.filter((p) => p.t < 1);
    if (visible) raf = requestAnimationFrame(step);
  }
  size(); draw();
  if (REDUCED) return;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(step); }).observe(c);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(); }, 150); });
}

/* ═════════ Avvio ═════════ */
function bindSeg(sel, attr, cb) {
  document.querySelectorAll(sel + " button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(sel + " button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    cb(b.dataset[attr]);
  }));
}
document.addEventListener("DOMContentLoaded", () => {
  // demo
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => { stopAuto(); showDemo(t.dataset.d); }));
  $("run").addEventListener("click", () => { stopAuto(); runDemo(); });
  $("demo").addEventListener("pointerdown", () => { if (!userTouched) stopAuto(); });
  showDemo("acq", () => { setTimeout(() => { if (!userTouched) autoplay(); }, 300); });

  // schede degli ambiti
  document.querySelectorAll("#soluzioni .pick").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#soluzioni .pick").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll("#soluzioni .panel").forEach((p) => p.classList.toggle("hidden", p.dataset.p !== b.dataset.s));
  }));

  // filtro dei contesti
  document.querySelectorAll("#casi-filtro .pick").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#casi-filtro .pick").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll("#casi-grid .card").forEach((c) => c.classList.toggle("hidden", b.dataset.f !== "all" && c.dataset.a !== b.dataset.f));
  }));

  $("cells").innerHTML = Array.from({ length: 30 }, (_, i) => `<i class="${i < 24 ? "" : "o"}" style="--k:${i}"></i>`).join("");

  // schede degli strumenti
  document.querySelectorAll("#strumenti .pick").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#strumenti .pick").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll("#strumenti .tool").forEach((p) => p.classList.toggle("hidden", p.dataset.tool !== b.dataset.t));
  }));
  // mappa
  mapInit(); mapRender();
  bindSeg("#m-ambito", "a", (a) => { mapState.ambito = a; mapRender(); });
  $("m-orario").addEventListener("input", mapOut);
  // verifica
  ["v-n", "v-s", "v-p"].forEach((id) => $(id).addEventListener("input", verOut));
  $("v-k").addEventListener("input", () => { vRatio = parseInt($("v-k").value, 10) / parseInt($("v-n").value, 10); verOut(); });
  bindSeg("#v-conf", "z", (z) => { vz = parseFloat(z); verOut(); });
  verOut();
  // memoria
  ["mm-par", "mm-ctx", "mm-users"].forEach((id) => $(id).addEventListener("input", memOut));
  bindSeg("#mm-bits", "b", (b) => { mmBits = parseInt(b, 10); memOut(); });
  memOut();

  // calcolatore
  ["c-ambito", "c-utenti", "c-rich", "c-arch", "c-ha", "c-ups", "a-kwh", "a-orario", "a-min", "a-aut", "a-tokreq", "a-token", "a-cont", "a-prog", "a-supp", "a-g", "a-rent"]
    .forEach((id) => $(id).addEventListener("input", render));
  bindSeg("#c-dati", "v", (v) => { dati = v; render(); });
  bindSeg("#c-formula", "f", (f) => { formula = f; render(); });
  render();

  initReveal();
  initNet();

  // contatti
  const form = $("contatto");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `Nome: ${d.get("nome")}\nOrganizzazione: ${d.get("azienda")}\n\n${d.get("msg")}`;
    // Segnaposto: sostituire con un endpoint reale.
    location.href = `mailto:info@example.invalid?subject=${encodeURIComponent("Richiesta di incontro")}&body=${encodeURIComponent(body)}`;
  });
});
