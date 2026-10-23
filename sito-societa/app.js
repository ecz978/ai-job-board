// Demo, tab e configuratore. Tutti i dati della demo sono fittizi.
// Le fasce di costo hardware sono indicative (fonti secondarie, ottobre 2026):
// sostituirle con i prezzi reali del distributore prima della pubblicazione.

const DEMO = {
  acq: {
    label: "Email in arrivo · cliente",
    text: "Buongiorno, servono 40 sacchi di cemento 32.5, 12 mq di lastre di cartongesso da 13 mm e 6 profili 48 per mercoledì in cantiere a Monza. Mi mandate il prezzo? Grazie, G. Rossi",
    out: `<table>
      <tr><th>Scritto</th><th>Articolo</th><th>Qtà</th><th>Giacenza</th><th>€/unità</th></tr>
      <tr><td>cemento 32.5</td><td>Cemento CEM II 32,5 · 25 kg</td><td>40</td><td><span class="chip">Disponibile</span></td><td>6,80</td></tr>
      <tr><td>cartongesso 13 mm</td><td>Lastra standard 13 · 1,2×2 m</td><td>5</td><td><span class="chip warn">Parziale · 3</span></td><td>8,40</td></tr>
      <tr><td>profili 48</td><td>Montante 48 · 3 m</td><td>6</td><td><span class="chip">Disponibile</span></td><td>3,20</td></tr>
    </table>
    <p><b>Margine stimato:</b> 22% · <b>Da ordinare al fornitore:</b> 2 lastre · <b>Prezzi:</b> listino cliente</p>`,
    human: "Il commerciale sceglie i prezzi e invia"
  },
  seg: {
    label: "Email in arrivo · candidato",
    text: "Buongiorno, vorrei sapere costo e date del corso per operatori socio sanitari, e se posso passare a parlarne giovedì pomeriggio. Grazie, M. Bianchi",
    out: `<p><b>Classificazione:</b> informazione + richiesta di colloquio</p>
    <p><b>Risposta (dalla scheda corso):</b> costo e date come da documentazione ufficiale; requisiti di accesso in allegato. <i>Fonte: scheda corso OSS, rev. 2026</i></p>
    <p><b>Slot proposti:</b> giovedì 15:00 · giovedì 16:30</p>`,
    human: "L'operatore verifica e conferma"
  },
  stu: {
    label: "PEC in arrivo · studio",
    text: "OGGETTO: Notifica atto di citazione. Il Tribunale di Monza comunica che l'udienza di prima comparizione è fissata per il 14/03/2027. In allegato atto (PDF, 18 pp.).",
    out: `<p><b>Tipo:</b> atto giudiziario · notifica</p>
    <p><b>Estratto dal testo:</b> Tribunale di Monza · udienza 14/03/2027 · atto di citazione, 18 pp.</p>
    <p><b>Sintesi:</b> 1) citazione notificata via PEC; 2) udienza di prima comparizione fissata; 3) allegato da leggere integralmente.</p>
    <p><b>Termini:</b> <span class="chip warn">da calcolare e verificare dal professionista</span></p>`,
    human: "Il professionista legge e gestisce la pratica"
  }
};

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let typeTimer = null;
function typeText(el, text) {
  clearInterval(typeTimer);
  if (REDUCED) { el.textContent = text; el.classList.remove("typing"); return; }
  el.textContent = "";
  el.classList.add("typing");
  let i = 0;
  typeTimer = setInterval(() => {
    i += 2;
    el.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(typeTimer); el.classList.remove("typing"); }
  }, 14);
}

let demoKey = "acq";
function showDemo(k) {
  demoKey = k;
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.d === k));
  document.getElementById("in-label").textContent = DEMO[k].label;
  typeText(document.getElementById("in-text"), DEMO[k].text);
  document.getElementById("out-wrap").classList.add("hidden");
  const run = document.getElementById("run");
  run.disabled = false; run.textContent = "Prepara la bozza →";
}
function runDemo() {
  const d = DEMO[demoKey];
  const wrap = document.getElementById("out-wrap");
  const out = document.getElementById("out");
  const run = document.getElementById("run");
  run.disabled = true;
  wrap.classList.remove("hidden");
  out.innerHTML = '<div class="thinking">lettura del documento…</div>';
  setTimeout(() => {
    out.innerHTML = `${d.out}<div class="human" id="human"><span>Controllo umano · ${d.human}</span><button type="button" id="ok">Approva</button></div>`;
    document.getElementById("ok").addEventListener("click", () => {
      const h = document.getElementById("human");
      h.classList.add("done");
      h.innerHTML = "<span>Approvato dalla persona. Solo ora parte l'invio.</span>";
    });
    run.textContent = "Rigenera"; run.disabled = false;
  }, 900);
}

// Fasce hardware
const FASCE = [
  { max: 5, nome: "Workstation GPU da 24 GB", hw: [3500, 6000], modelli: "modelli da circa 7-30 miliardi di parametri (es. Mistral Small, Gemma, Qwen)", adatta: "un piccolo studio o una segreteria" },
  { max: 15, nome: "Mini-server con 128 GB di memoria unificata (classe NVIDIA GB10)", hw: [3000, 7000], modelli: "modelli fino a circa 70-120 miliardi di parametri, quantizzati", adatta: "studi e PMI con uso quotidiano" },
  { max: 40, nome: "Server con 1-2 GPU professionali", hw: [12000, 30000], modelli: "modelli da 70 miliardi di parametri con più utenti in parallelo", adatta: "PMI strutturate o scuole con più sedi" },
  { max: Infinity, nome: "Server multi-GPU con ridondanza", hw: [50000, 120000], modelli: "modelli grandi, carichi continui", adatta: "oltre 40 utenti" },
];
const CLOUD_UTENTE_MESE = 30; // €/utente/mese, stima
const SERVIZIO = [2900, 8000]; // installazione, da definire
const euro = (n) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
let dati = "alta";

function calcola() {
  const u = parseInt(document.getElementById("utenti").value, 10);
  document.getElementById("utenti-val").textContent = u;
  const f = FASCE.find((x) => u <= x.max);
  const r = document.getElementById("ridondanza").checked ? 2 : 1;
  const hw = [f.hw[0] * r, f.hw[1] * r];
  const tot = [hw[0] + SERVIZIO[0], hw[1] + SERVIZIO[1]];
  const cloud = u * CLOUD_UTENTE_MESE * 12;
  const mid = (tot[0] + tot[1]) / 2;
  const anni = mid / cloud;
  const pct = Math.min(100, Math.round((cloud / (mid || 1)) * 100));
  const cons = {
    alta: "Dati molto sensibili: consigliamo tutto locale. Nulla esce dalla sede.",
    media: "Valutate anche server in sede con richieste al modello via API e contratto adeguato.",
    bassa: "Con dati poco sensibili il cloud può bastare: confrontiamo i costi prima di proporvi hardware.",
  }[dati];
  document.getElementById("risultato").innerHTML = `
    <div class="label">Configurazione indicativa</div>
    <div class="big">${f.nome}${r > 1 ? " × 2" : ""}</div>
    <p>Adatta a ${f.adatta}. Esegue ${f.modelli}.</p>
    <div class="kv">
      <div><b>Hardware</b>${euro(hw[0])} – ${euro(hw[1])}</div>
      <div><b>Installazione</b>${euro(SERVIZIO[0])} – ${euro(SERVIZIO[1])}</div>
      <div><b>Totale una tantum</b>${euro(tot[0])} – ${euro(tot[1])}</div>
    </div>
    <div class="label">Cloud per ${u} utenti: ${euro(cloud)} / anno (stima)</div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <p class="note">${anni >= 10 ? "Il cloud costa meno per molti anni: l'hardware si giustifica solo per riservatezza." : `Pareggio indicativo dopo circa ${anni.toFixed(1).replace(".", ",")} anni, senza contare energia, manutenzione e personale.`}</p>
    <p>${cons}</p>
    <p class="note">Fasce indicative, IVA esclusa, non sono un'offerta. I benchmark misurati da noi saranno pubblicati qui.</p>
    <a class="btn hot" href="#contatti">Richiedi un preventivo</a>`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showDemo(t.dataset.d)));
  document.getElementById("run").addEventListener("click", runDemo);
  showDemo("acq");

  document.querySelectorAll(".pick").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".pick").forEach((x) => x.setAttribute("aria-selected", x === b));
      document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("hidden", p.dataset.p !== b.dataset.s));
    })
  );

  document.getElementById("cells").innerHTML = Array.from({ length: 30 }, (_, i) => `<i class="${i < 24 ? "" : "o"}" style="--k:${i}"></i>`).join("");
  initReveal();
  initNet();

  document.getElementById("utenti").addEventListener("input", calcola);
  document.getElementById("ridondanza").addEventListener("change", calcola);
  document.querySelectorAll("#dati button").forEach((b) =>
    b.addEventListener("click", () => {
      dati = b.dataset.v;
      document.querySelectorAll("#dati button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      calcola();
    })
  );
  calcola();

  const form = document.getElementById("contatto");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `Nome: ${d.get("nome")}\nAzienda: ${d.get("azienda")}\n\n${d.get("msg")}`;
    // Segnaposto: sostituire con un endpoint reale.
    location.href = `mailto:info@example.invalid?subject=${encodeURIComponent("Richiesta colloquio")}&body=${encodeURIComponent(body)}`;
  });
});

// Comparsa graduale allo scroll
function initReveal() {
  const sel = ".strip div, #soluzioni .picker, .panel > div, .node, .step, .grid > .card, .conf > div, .eyebrow, section h2";
  const els = [...document.querySelectorAll(sel)];
  els.forEach((el) => {
    el.classList.add("reveal");
    const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains("reveal")) : [];
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 90 + "ms");
  });
  const cells = document.getElementById("cells");
  if (REDUCED || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in")); cells.classList.add("in"); return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
  io.observe(cells);
}

// Rete neurale di sfondo: pochi nodi, linee sottili, segnali lenti
function initNet() {
  const c = document.getElementById("net");
  if (!c || !c.getContext) return;
  const ctx = c.getContext("2d");
  let w = 0, h = 0, nodes = [], pulses = [], raf = 0, visible = true;
  const LINK = 150;

  function size() {
    const r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(18, Math.min(46, Math.round((w * h) / 22000)));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
    }));
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
      ctx.strokeStyle = `rgba(36,60,110,${0.16 * (1 - d / LINK)})`;
      ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
    });
    nodes.forEach((n) => { ctx.fillStyle = "rgba(36,60,110,.28)"; ctx.beginPath(); ctx.arc(n.x, n.y, 2, 0, 6.283); ctx.fill(); });
    pulses.forEach((p) => {
      const a = nodes[p.i], b = nodes[p.j];
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.fillStyle = `rgba(36,87,255,${Math.sin(p.t * Math.PI) * 0.9})`;
      ctx.beginPath(); ctx.arc(x, y, 2.8, 0, 6.283); ctx.fill();
    });
    return es;
  }
  function step() {
    nodes.forEach((n) => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });
    const es = draw();
    if (es.length && pulses.length < 5 && Math.random() < 0.025) {
      const e = es[Math.floor(Math.random() * es.length)];
      pulses.push({ i: e[0], j: e[1], t: 0 });
    }
    pulses.forEach((p) => (p.t += 0.012));
    pulses = pulses.filter((p) => p.t < 1);
    if (visible) raf = requestAnimationFrame(step);
  }

  size(); draw();
  if (REDUCED) return;
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(step);
  }).observe(c);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(); }, 150); });
}
