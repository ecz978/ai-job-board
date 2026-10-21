# Classroom Quiz

Il docente accede con Google, sceglie una classroom, un argomento, data e ora di consegna, carica un testo (PDF, DOCX, TXT, MD) e il numero e il livello di domande. L'app genera un compito individuale per ogni studente su Google Classroom, con domande diverse ma dello stesso livello, tutte ricavate dal testo.

## Setup

1. Google Cloud Console: crea un progetto, abilita **Google Classroom API**.
2. Schermata di consenso OAuth: aggiungi gli scope `classroom.courses.readonly`, `classroom.rosters.readonly`, `classroom.coursework.students`. In test mode aggiungi gli account docenti come utenti di prova.
3. Credenziali OAuth (tipo Web): redirect URI `http://localhost:3000/api/auth/callback/google` (in produzione, il dominio reale).
4. Copia `.env.example` in `.env.local` e compila le variabili.
5. `npm install && npm run dev`

## Note

- Ogni studente riceve un compito individuale (`assigneeMode: INDIVIDUAL_STUDENTS`) con le proprie domande nella descrizione. Le risposte non vengono raccolte: la chiave di risposta si scarica dall'app come JSON.
- Le domande vengono scartate se la citazione di supporto non compare letteralmente nel testo.
- Nessun dato viene salvato su database: Classroom è l'unico registro.
- Le sessioni durano quanto il token Google (circa un'ora). Dopo la scadenza si riparte dal login.
