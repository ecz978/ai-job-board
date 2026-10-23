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

let demoKey = "acq";
function showDemo(k) {
  demoKey = k;
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.d === k));
  document.getElementById("in-label").textContent = DEMO[k].label;
  document.getElementById("in-text").textContent = DEMO[k].text;
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
    <div class="label" style="color:#a9b2bd">Configurazione indicativa</div>
    <div class="big">${f.nome}${r > 1 ? " × 2" : ""}</div>
    <p>Adatta a ${f.adatta}. Esegue ${f.modelli}.</p>
    <div class="kv">
      <div><b>Hardware</b>${euro(hw[0])} – ${euro(hw[1])}</div>
      <div><b>Installazione</b>${euro(SERVIZIO[0])} – ${euro(SERVIZIO[1])}</div>
      <div><b>Totale una tantum</b>${euro(tot[0])} – ${euro(tot[1])}</div>
    </div>
    <div class="label" style="color:#a9b2bd">Cloud per ${u} utenti: ${euro(cloud)} / anno (stima)</div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <p class="note">${anni >= 10 ? "Il cloud costa meno per molti anni: l'hardware si giustifica solo per riservatezza." : `Pareggio indicativo dopo circa ${anni.toFixed(1).replace(".", ",")} anni, senza contare energia, manutenzione e personale.`}</p>
    <p>${cons}</p>
    <p class="note">Fasce indicative, IVA esclusa, non sono un'offerta. I benchmark misurati da noi saranno pubblicati qui.</p>
    <a class="btn ochre" href="#contatti">Richiedi un preventivo</a>`;
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

  document.getElementById("cells").innerHTML = Array.from({ length: 30 }, (_, i) => `<i class="${i < 24 ? "" : "o"}"></i>`).join("");

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
