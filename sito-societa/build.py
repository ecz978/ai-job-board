# Genera il sito multipagina in dist/ (e dist.zip) da layout.html + pages/*.html.
import re, shutil, zipfile, pathlib

R = pathlib.Path(__file__).parent
OUT = R / "dist"
rd = lambda f: (R / f).read_text(encoding="utf-8")

NAV = [("ambiti", "Ambiti"), ("approccio", "Approccio"), ("strumenti", "Strumenti"),
       ("infrastruttura", "Infrastruttura"), ("chi-siamo", "Chi siamo")]
SUFFIX = "Stadera · Consulenza AI per PMI"
PAGES = {
    "index": ("Stadera · Consulenza AI per PMI: si parte dai vostri dati",
              "Consulenza sull'intelligenza artificiale per PMI, segreterie, uffici acquisti e studi professionali: analizziamo la qualità dei dati esistenti e proponiamo l'approccio più adatto, che non è sempre un agente.",
              ["hero", "perche", "home-ambiti", "home-cta"]),
    "ambiti": ("Ambiti di intervento · " + SUFFIX,
               "Uffici acquisti, segreterie e studi professionali: per ogni ambito cosa guardiamo nei dati e quale approccio proponiamo, con un flusso passo per passo.",
               ["soluzioni"]),
    "approccio": ("Approccio · " + SUFFIX,
                  "Analisi dei dati, valutazione, realizzazione e presidio: come lavoriamo e come si misura l'esito.",
                  ["metodo"]),
    "strumenti": ("Strumenti · " + SUFFIX,
                  "Check-up dei dati, mappa delle attività, verifica a campione, memoria dei modelli e dimensionamento dell'hardware.",
                  ["strumenti"]),
    "infrastruttura": ("Dati e infrastruttura · " + SUFFIX,
                       "Modello in cloud, archivio in sede o elaborazione interamente in sede: come scegliere, e fornitura dell'hardware.",
                       ["dati"]),
    "chi-siamo": ("Chi siamo · " + SUFFIX, "I due cofounder di Stadera: un percorso informatico e filosofico, uno ingegneristico aerospaziale.", ["chisiamo"]),
    "privacy": ("Informativa sulla privacy · " + SUFFIX, "Come trattiamo i dati personali.", ["privacy"]),
    "cookie": ("Cookie policy · " + SUFFIX, "Il sito non utilizza cookie né strumenti di tracciamento.", ["cookie"]),
    "contatti": ("Contatti · " + SUFFIX, "Richiedi un primo incontro per capire il processo.", ["contatti"]),
}
PAGE_FILE = {k: k + ".html" for k in PAGES}

def nav(cur, cls=""):
    return "\n".join('      <a href="%s.html"%s>%s</a>' % (s, ' class="active" aria-current="page"' if s == cur else "", t) for s, t in NAV)

layout = rd("layout.html")
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
for slug, (title, desc, parts) in PAGES.items():
    body = "".join(rd("pages/_%s.html" % p) for p in parts)
    foot = " · ".join('<a href="%s.html">%s</a>' % (s, t) for s, t in NAV + [("contatti", "Contatti")])
    foot += " · " + " · ".join('<a href="%s.html">%s</a>' % (s, t) for s, t in [("privacy", "Privacy"), ("cookie", "Cookie")])
    html = (layout.replace("{{title}}", title).replace("{{desc}}", desc).replace("{{page}}", slug)
            .replace("{{nav}}", nav(slug)).replace("{{footnav}}", foot).replace("{{body}}", body))
    (OUT / (slug + ".html")).write_text(html, encoding="utf-8")
for f in ("style.css", "fonts.css", "app.js"):
    shutil.copy(R / f, OUT / f)

with zipfile.ZipFile(R / "sito.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for p in sorted(OUT.iterdir()):
        z.write(p, "sito/" + p.name)
print("ok:", ", ".join(sorted(p.name for p in OUT.iterdir())))
