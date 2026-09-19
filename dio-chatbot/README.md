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

## Deploy su Cloudflare Pages

1. Su dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Seleziona il repository `ecz978/ai-job-board`, branch `main` (o quello che vuoi pubblicare).
3. Nelle impostazioni di build:
   - **Root directory**: `dio-chatbot`
   - **Install command**: `npm install --legacy-peer-deps` (necessario per un conflitto di peer-dependency tra `@cloudflare/next-on-pages` e `wrangler`)
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
4. In **Environment variables** aggiungi `ANTHROPIC_API_KEY` con la tua chiave.
5. Deploy.

L'API route usa `runtime = "edge"` per essere compatibile con il runtime dei Workers di Cloudflare Pages.

## Note

- Il prompt di sistema (`src/app/api/chat/route.ts`) impone che il bot si dichiari
  sempre una simulazione IA, non un'autorità religiosa reale, e che indirizzi
  a un aiuto umano reale in caso di crisi personale.
- Nessuna dipendenza dal resto del repository (job board Astro): package.json
  e configurazione separati.
