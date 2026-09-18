# Dio Chatbot

Sito di chat con un bot che simula, dichiaratamente, un dialogo con il Dio
cristiano-cattolico. Progetto Next.js indipendente, dentro `dio-chatbot/`.

## Avvio locale

```bash
cd dio-chatbot
npm install
cp .env.example .env.local   # inserisci ANTHROPIC_API_KEY
npm run dev
```

Apri http://localhost:3000.

## Note

- Il prompt di sistema (`src/app/api/chat/route.ts`) impone che il bot si dichiari
  sempre una simulazione IA, non un'autorità religiosa reale, e che indirizzi
  a un aiuto umano reale in caso di crisi personale.
- Nessuna dipendenza dal resto del repository (job board Astro): package.json
  e configurazione separati.
