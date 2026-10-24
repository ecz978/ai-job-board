// Demo, schede, calcolatore, animazioni. Tutti i dati della demo sono fittizi.
// Le fasce di costo hardware e le ipotesi del calcolatore sono indicative
// (fonti secondarie, ottobre 2026): sostituirle con i prezzi reali del distributore.

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

/* ───────── Demo ───────── */
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
      const h = $("human"); h.classList.add("done");
      h.innerHTML = "<span>Convalidato dalla persona. Solo ora può avvenire l'invio.</span>";
    });
    run.textContent = "Ripeti"; run.disabled = false;
    after && after();
  }, 900);
}
// Riproduzione automatica finché l'utente non tocca la demo
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
          if (h) { h.classList.add("done"); h.innerHTML = "<span>Convalidato dalla persona. Solo ora può avvenire l'invio.</span>"; }
          auto = setTimeout(() => { idx = (idx + 1) % ORDER.length; cycle(); }, 2600);
        }, 2600);
      }), 700);
    });
  };
  cycle();
}
function stopAuto() { userTouched = true; clearTimeout(auto); }

/* ───────── Calcolatore ───────── */
const TIERS = [
  { nome: "Workstation con GPU da 24 GB", hw: [3500, 6000], inst: [2900, 4500], peakW: 450, maxModel: 30, maxConc: 2,
    modelli: "modelli fino a circa 30 miliardi di parametri (es. Mistral Small, Gemma, Qwen)" },
  { nome: "Mini-server con 128 GB di memoria unificata (classe NVIDIA GB10)", hw: [3000, 7000], inst: [3500, 6000], peakW: 240, maxModel: 120, maxConc: 4,
    modelli: "modelli fino a circa 70-120 miliardi di parametri, quantizzati" },
  { nome: "Server con 1-2 GPU professionali", hw: [12000, 30000], inst: [5000, 9000], peakW: 1000, maxModel: 120, maxConc: 12,
    modelli: "modelli da 70-120 miliardi di parametri con più utenti in parallelo" },
  { nome: "Server multi-GPU", hw: [50000, 120000], inst: [9000, 18000], peakW: 3000, maxModel: 400, maxConc: 60,
    modelli: "modelli grandi e carichi continui, anche con più sedi" },
];
const MODEL_NEED = { seg: 30, acq: 70, stu: 120, mix: 120 };
const GIORNI = 250;
const SEAT_MESE = 30; // abbonamento a un assistente in cloud, €/utente/mese (stima)
let dati = "alta";

const eur = (n) => Math.round(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurK = (n) => (n >= 1000 ? (n / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " k€" : Math.round(n) + " €");
const rng = (a) => `${eur(a[0])} – ${eur(a[1])}`;
const mid = (a) => (a[0] + a[1]) / 2;
const num = (id) => parseFloat($(id).value) || 0;

function compute() {
  const ambito = $("c-ambito").value;
  const utenti = parseInt($("c-utenti").value, 10);
  const rich = parseInt($("c-rich").value, 10);
  const arch = parseInt($("c-arch").value, 10);
  const ha = $("c-ha").checked, ups = $("c-ups").checked;
  const a = {
    kwh: num("a-kwh"), orario: num("a-orario"), min: num("a-min"), aut: num("a-aut") / 100,
    tokreq: num("a-tokreq"), token: num("a-token"), cont: num("a-cont") / 100, prog: num("a-prog"), supp: num("a-supp"),
  };
  const conc = Math.max(1, Math.ceil(utenti * a.cont), Math.ceil(rich / 300));
  const need = MODEL_NEED[ambito];
  const tier = TIERS.find((t) => t.maxModel >= need && t.maxConc >= conc) || TIERS[TIERS.length - 1];
  const k = ha ? 2 : 1;

  const hw = [tier.hw[0] * k, tier.hw[1] * k];
  const storage = [300 + arch * 0.25, 500 + arch * 0.4];
  const upsRete = ups ? [400 * k, 900 * k] : [0, 0];
  const inst = [tier.inst[0] * (ha ? 1.3 : 1), tier.inst[1] * (ha ? 1.3 : 1)];
  const invest = [hw[0] + storage[0] + upsRete[0] + inst[0], hw[1] + storage[1] + upsRete[1] + inst[1]];
  const investM = mid(invest);

  const energia = tier.peakW * 0.4 * k * 8760 / 1000 * a.kwh;
  const manut = 0.08 * mid(hw) + a.supp;
  const esercizio = energia + manut;

  const cloudAnno = rich * GIORNI * a.tokreq / 1e6 * a.token;
  const seatAnno = utenti * SEAT_MESE * 12;

  const loc = (y) => investM + esercizio * y;
  const api = (y) => cloudAnno * y;
  const seat = (y) => seatAnno * y;

  const pareggio = cloudAnno > esercizio ? investM / (cloudAnno - esercizio) : Infinity;
  const costoPerRich = a.tokreq / 1e6 * a.token * GIORNI;
  const richPareggio5 = costoPerRich > 0 ? (investM / 5 + esercizio) / costoPerRich : Infinity;

  const ore = rich * GIORNI * a.min / 60 * a.aut;
  const valore = ore * a.orario;
  const rientro = (esborso, netto) => (netto > 0 ? esborso / (netto / 12) : Infinity);
  const rLoc = rientro(a.prog + investM, valore - esercizio);
  const rApi = rientro(a.prog, valore - cloudAnno);

  return { ambito, utenti, rich, arch, ha, ups, a, conc, tier, hw, storage, upsRete, inst, invest, investM, energia, manut, esercizio,
    cloudAnno, seatAnno, loc, api, seat, pareggio, richPareggio5, ore, valore, rLoc, rApi };
}

function chart(r) {
  const W = 640, H = 230, L = 52, R = 14, T = 12, B = 30;
  const ymax = Math.max(r.loc(5), r.api(5), r.seat(5)) * 1.08 || 1;
  const x = (y) => L + (y / 5) * (W - L - R);
  const yy = (v) => T + (1 - v / ymax) * (H - T - B);
  const line = (f) => [0, 1, 2, 3, 4, 5].map((y) => `${x(y).toFixed(1)},${yy(f(y)).toFixed(1)}`).join(" ");
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const v = (ymax / 4) * i, py = yy(v);
    grid += `<line x1="${L}" x2="${W - R}" y1="${py}" y2="${py}" stroke="#e3e7ee"/><text x="${L - 8}" y="${py + 4}" text-anchor="end" font-size="11" fill="#586272">${eurK(v)}</text>`;
  }
  let xs = "";
  for (let y = 0; y <= 5; y++) xs += `<text x="${x(y)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#586272">${y === 0 ? "oggi" : y + (y === 1 ? " anno" : " anni")}</text>`;
  let mark = "";
  if (isFinite(r.pareggio) && r.pareggio <= 5) {
    const px = x(r.pareggio), py = yy(r.loc(r.pareggio));
    mark = `<circle cx="${px}" cy="${py}" r="5" fill="#fff" stroke="#2748c8" stroke-width="2"/><text x="${px}" y="${py - 11}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#2748c8">pareggio ${r.pareggio.toFixed(1).replace(".", ",")} anni</text>`;
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Costo cumulato in cinque anni">${grid}${xs}
    <polyline points="${line(r.seat)}" fill="none" stroke="#b4bdcc" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>
    <polyline points="${line(r.api)}" fill="none" stroke="#7b869a" stroke-width="2.4" stroke-dasharray="7 5"/>
    <polyline points="${line(r.loc)}" fill="none" stroke="#2748c8" stroke-width="3" stroke-linejoin="round"/>${mark}</svg>
    <div class="legend"><span><i style="background:#2748c8"></i>In sede (acquisto + esercizio)</span><span><i style="background:#7b869a"></i>Modello in cloud a consumo</span><span><i style="background:#b4bdcc"></i>Abbonamento per utente</span></div>`;
}

const mesi = (m) => (!isFinite(m) ? "non rientra" : m < 1 ? "meno di un mese" : m > 120 ? "oltre 10 anni" : m < 24 ? `${Math.round(m)} mesi` : `${(m / 12).toFixed(1).replace(".", ",")} anni`);

function summary(r) {
  const amb = { seg: "Segreteria", acq: "Acquisti e ordini", stu: "Studio professionale", mix: "Più ambiti" }[r.ambito];
  return [
    `Configurazione indicativa: ${r.tier.nome}${r.ha ? " ×2 (alta disponibilità)" : ""}`,
    `Ambito: ${amb} · ${r.utenti} utenti · ${r.rich} richieste al giorno · dati ${dati}`,
    `Una tantum: ${rng(r.invest)} (hardware ${rng(r.hw)}, installazione ${rng(r.inst)})`,
    `Esercizio annuo: circa ${eur(r.esercizio)} (energia ${eur(r.energia)}, manutenzione e supporto ${eur(r.manut)})`,
    `Modello in cloud: circa ${eur(r.cloudAnno)} all'anno`,
    `Pareggio elaborazione in sede vs cloud: ${isFinite(r.pareggio) ? r.pareggio.toFixed(1) + " anni" : "non raggiunto"}`,
    `Risparmio operativo stimato: ${eur(r.valore)} all'anno (${Math.round(r.ore)} ore)`,
    "Cifre indicative, IVA esclusa, non costituiscono un'offerta.",
  ].join("\n");
}

function render() {
  $("o-utenti").textContent = $("c-utenti").value;
  $("o-rich").textContent = $("c-rich").value;
  const r = compute();
  const sens = {
    alta: "Dati molto sensibili: consigliamo l'elaborazione interamente in sede: nulla lascia l'organizzazione.",
    media: "Valutate anche archivio in sede con richieste al modello in cloud e contratto adeguato.",
    bassa: "Con dati poco sensibili un modello in cloud è di norma la scelta più semplice: confrontiamo i costi prima di proporvi hardware.",
  }[dati];
  const apiVince = isFinite(r.pareggio) ? r.pareggio > 5 : true;
  const verdetto = dati === "bassa" && apiVince
    ? "Solo sul costo conviene il modello in cloud. L'elaborazione in sede ha senso se la riservatezza o il controllo contano più della spesa."
    : apiVince
    ? `Solo sul costo, a questo volume conviene il modello in cloud (l'hardware si ripaga oltre i cinque anni, o non si ripaga). L'elaborazione in sede si giustifica per riservatezza: dal volume di circa ${isFinite(r.richPareggio5) ? Math.round(r.richPareggio5).toLocaleString("it-IT") : "—"} richieste al giorno inizia a convenire anche sul costo.`
    : `A questo volume l'elaborazione in sede si ripaga in circa ${r.pareggio.toFixed(1).replace(".", ",")} anni rispetto al modello in cloud, e i dati restano in sede.`;
  const gb = (v, bad) => (v < 24 && isFinite(v) ? "good" : !isFinite(v) || bad ? "bad" : "");

  $("risultato").innerHTML = `
    <div class="rs"><h3>Configurazione consigliata <small>${r.conc} richieste in parallelo</small></h3>
      <p class="big">${r.tier.nome}${r.ha ? " × 2" : ""}</p>
      <p>Esegue ${r.tier.modelli}. ${sens}</p>
      <p class="note">I modelli a pesi aperti eseguiti in sede sono meno capaci dei modelli commerciali sui compiti più complessi: lo verifichiamo con una prova sul vostro caso prima di decidere.</p></div>

    <div class="rs"><h3>Costi <small>una tantum + annui</small></h3>
      <table>
        <tr><td>Hardware</td><td>${rng(r.hw)}</td></tr>
        <tr><td>Archiviazione e copie di sicurezza (${r.arch >= 1000 ? r.arch / 1000 + " TB" : r.arch + " GB"})</td><td>${rng(r.storage)}</td></tr>
        <tr><td>Gruppo di continuità e rete</td><td>${r.ups ? rng(r.upsRete) : "escluso"}</td></tr>
        <tr><td>Installazione e messa in opera</td><td>${rng(r.inst)}</td></tr>
        <tr class="tot"><td>Totale una tantum</td><td>${rng(r.invest)}</td></tr>
        <tr><td>Energia all'anno</td><td>${eur(r.energia)}</td></tr>
        <tr><td>Manutenzione e supporto all'anno</td><td>${eur(r.manut)}</td></tr>
        <tr class="tot"><td>Esercizio all'anno</td><td>${eur(r.esercizio)}</td></tr>
      </table></div>

    <div class="rs"><h3>Confronto in cinque anni <small>costo cumulato</small></h3>
      ${chart(r)}
      <div class="two" style="margin-top:14px">
        <div class="box"><b>In sede a 3 anni</b><strong>${eur(r.loc(3))}</strong><span>acquisto più tre anni di esercizio</span></div>
        <div class="box"><b>Cloud a 3 anni</b><strong>${eur(r.api(3))}</strong><span>${eur(r.cloudAnno)} all'anno a questo volume</span></div>
        <div class="box"><b>Abbonamento a 3 anni</b><strong>${eur(r.seat(3))}</strong><span>${r.utenti} utenti × ${SEAT_MESE} €/mese, solo chat</span></div>
      </div></div>

    <div class="rs"><h3>Rientro dell'investimento <small>risparmio di lavoro</small></h3>
      <p>Con ${r.rich} richieste al giorno, ${r.a.min} minuti manuali ciascuna e ${Math.round(r.a.aut * 100)}% automatizzato: circa <b>${Math.round(r.ore).toLocaleString("it-IT")} ore</b> all'anno, pari a <b>${eur(r.valore)}</b> a ${r.a.orario} €/h.</p>
      <div class="two">
        <div class="box ${gb(r.rApi)}"><b>Con modello in cloud</b><strong>${mesi(r.rApi)}</strong><span>progetto ${eur(r.a.prog)} · esercizio ${eur(r.cloudAnno)}/anno</span></div>
        <div class="box ${gb(r.rLoc)}"><b>Con elaborazione in sede</b><strong>${mesi(r.rLoc)}</strong><span>progetto più hardware (${eur(r.investM)}) · esercizio ${eur(r.esercizio)}/anno</span></div>
      </div>
      <p class="note" style="margin-top:12px">Il risparmio è una stima basata sulle ipotesi indicate, non un risultato garantito: si misura nella fase di verifica.</p></div>

    <div class="verdict"><p>${verdetto}</p>
      <div class="btns"><a class="btn hot" href="#contatti" id="prefill">Richiedi un incontro con questi dati</a>
      <button class="btn ghost" type="button" id="copy">Copia il riepilogo</button></div></div>`;

  const text = summary(r);
  $("prefill").addEventListener("click", () => { $("msg").value = text; });
  $("copy").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(text); b.textContent = "Copiato"; }
    catch { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); b.textContent = "Copiato"; }
    setTimeout(() => (b.textContent = "Copia il riepilogo"), 1800);
  });
}

/* ───────── Comparsa allo scroll ───────── */
function initReveal() {
  const sel = ".strip div, .ribbon, .stats, #soluzioni .picker, .panel > div, .node, .step, .grid > .card, .calc-in, .rs, .verdict, .eyebrow, section h2";
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
  // Il calcolatore si ridisegna: i nuovi blocchi devono comparire subito
  new MutationObserver(() => $("risultato").querySelectorAll(".reveal").forEach((n) => n.classList.add("in")))
    .observe($("risultato"), { childList: true });
}

/* ───────── Rete neurale di sfondo ───────── */
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

/* ───────── Avvio ───────── */
document.addEventListener("DOMContentLoaded", () => {
  // demo
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => { stopAuto(); showDemo(t.dataset.d); }));
  $("run").addEventListener("click", () => { stopAuto(); runDemo(); });
  $("demo").addEventListener("pointerdown", () => { if (!userTouched) { stopAuto(); } });
  showDemo("acq", () => { setTimeout(() => { if (!userTouched) autoplay(); }, 300); });

  // schede degli ambiti
  document.querySelectorAll(".pick").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".pick").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("hidden", p.dataset.p !== b.dataset.s));
  }));

  $("cells").innerHTML = Array.from({ length: 30 }, (_, i) => `<i class="${i < 24 ? "" : "o"}" style="--k:${i}"></i>`).join("");

  // calcolatore
  ["c-ambito", "c-utenti", "c-rich", "c-arch", "c-ha", "c-ups", "a-kwh", "a-orario", "a-min", "a-aut", "a-tokreq", "a-token", "a-cont", "a-prog", "a-supp"]
    .forEach((id) => $(id).addEventListener("input", render));
  document.querySelectorAll("#c-dati button").forEach((b) => b.addEventListener("click", () => {
    dati = b.dataset.v;
    document.querySelectorAll("#c-dati button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    render();
  }));
  render();

  initReveal();
  initNet();

  // contatti
  const form = $("contatto");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `Nome: ${d.get("nome")}\nAzienda: ${d.get("azienda")}\n\n${d.get("msg")}`;
    // Segnaposto: sostituire con un endpoint reale.
    location.href = `mailto:info@example.invalid?subject=${encodeURIComponent("Richiesta colloquio")}&body=${encodeURIComponent(body)}`;
  });
});
