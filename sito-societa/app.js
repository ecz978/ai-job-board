// Configuratore hardware per inferenza locale.
// Tutte le cifre sono fasce indicative di mercato (fonti secondarie, ottobre 2026):
// vanno sostituite con i prezzi reali del distributore prima della pubblicazione.
const FASCE = [
  {
    max: 5,
    nome: "Workstation GPU da 24 GB",
    hw: [3500, 6000],
    modelli: "modelli da circa 7-30 miliardi di parametri (es. Mistral Small, Gemma, Qwen)",
    adatta: "un piccolo studio o una segreteria, pochi utenti in contemporanea",
  },
  {
    max: 15,
    nome: "Mini-server con 128 GB di memoria unificata (classe NVIDIA GB10)",
    hw: [3000, 7000],
    modelli: "modelli fino a circa 70-120 miliardi di parametri, con quantizzazione",
    adatta: "studi e PMI con uso quotidiano e documenti pesanti",
  },
  {
    max: 40,
    nome: "Server con 1-2 GPU professionali",
    hw: [12000, 30000],
    modelli: "modelli da 70 miliardi di parametri con più utenti in parallelo",
    adatta: "PMI strutturate o scuole con più sedi",
  },
  {
    max: Infinity,
    nome: "Server multi-GPU con ridondanza",
    hw: [50000, 120000],
    modelli: "modelli grandi, carichi continui, alta disponibilità",
    adatta: "oltre 40 utenti o requisiti di continuità di servizio",
  },
];

// Costo indicativo annuo di un abbonamento per utente a un assistente AI in cloud (€/utente/mese).
const CLOUD_UTENTE_MESE = 30;
const SERVIZIO_INSTALLAZIONE = [2900, 8000]; // setup + messa in opera, da definire

const euro = (n) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function calcola() {
  const utenti = Math.max(1, parseInt(document.getElementById("utenti").value, 10) || 1);
  const dati = document.getElementById("dati").value;
  const fascia = FASCE.find((f) => utenti <= f.max);
  const ridondanza = document.getElementById("ridondanza").checked;

  let hwMin = fascia.hw[0] * (ridondanza ? 2 : 1);
  let hwMax = fascia.hw[1] * (ridondanza ? 2 : 1);
  const totMin = hwMin + SERVIZIO_INSTALLAZIONE[0];
  const totMax = hwMax + SERVIZIO_INSTALLAZIONE[1];
  const cloudAnno = utenti * CLOUD_UTENTE_MESE * 12;

  const consiglio =
    dati === "alta"
      ? "Per dati molto sensibili consigliamo l'opzione tutto locale: nulla esce dalla sede."
      : dati === "media"
      ? "Valutate anche l'opzione intermedia: server in sede per i documenti, richieste al modello via API con contratto adeguato."
      : "Con dati poco sensibili il cloud può bastare: confrontiamo i costi prima di proporvi hardware.";

  document.getElementById("risultato").innerHTML = `
    <p class="eyebrow">Configurazione indicativa</p>
    <div class="big">${fascia.nome}${ridondanza ? " × 2 (ridondanza)" : ""}</div>
    <p>Adatta a ${fascia.adatta}. Esegue ${fascia.modelli}.</p>
    <div class="kv">
      <div><b>Hardware</b>${euro(hwMin)} – ${euro(hwMax)}</div>
      <div><b>Installazione e messa in opera</b>${euro(SERVIZIO_INSTALLAZIONE[0])} – ${euro(SERVIZIO_INSTALLAZIONE[1])}</div>
      <div><b>Totale una tantum</b>${euro(totMin)} – ${euro(totMax)}</div>
      <div><b>Confronto cloud (stima)</b>${euro(cloudAnno)} / anno per ${utenti} utenti</div>
    </div>
    <p>${consiglio}</p>
    <p class="note">Fasce indicative, IVA esclusa, non sono un'offerta. Il confronto con il cloud non include tempi di installazione, energia e manutenzione del server, né il costo del personale. I benchmark misurati da noi (token al secondo su modelli reali) saranno pubblicati qui.</p>
    <a class="btn" href="#contatti">Richiedi un preventivo</a>`;
}

document.addEventListener("DOMContentLoaded", () => {
  ["utenti", "dati", "ridondanza"].forEach((id) =>
    document.getElementById(id).addEventListener("input", calcola)
  );
  calcola();

  const form = document.getElementById("contatto");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `Nome: ${d.get("nome")}\nAzienda: ${d.get("azienda")}\n\n${d.get("msg")}`;
    // Segnaposto: sostituire con un endpoint reale (form service o backend).
    location.href = `mailto:info@example.invalid?subject=${encodeURIComponent("Richiesta colloquio")}&body=${encodeURIComponent(body)}`;
  });
});
