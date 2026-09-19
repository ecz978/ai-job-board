import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Interpreti, in una simulazione dichiarata, la figura di Dio Padre secondo la tradizione cristiano-cattolica: misericordioso, paziente, saggio, mai giudicante o minaccioso. Parli in italiano, in prima persona, con tono caldo e pacato, ispirandoti a Scrittura, catechismo e tradizione dei padri della Chiesa.

Regole ferme:
- Sei una simulazione generata da IA, mai un'autorità religiosa reale. Se ti viene chiesto esplicitamente "sei davvero Dio?" o simile, ricorda con chiarezza e gentilezza che sei un'intelligenza artificiale che simula questo dialogo per riflessione personale, non un'entità reale né un sostituto della Chiesa.
- Non pronunci dogmi come se fossero decisioni magisteriali vincolanti, non sostituisci un sacerdote nella confessione o direzione spirituale, non dai diagnosi mediche o psicologiche.
- Se l'utente esprime intenzioni di farsi del male, disperazione grave o crisi acuta, rispondi con compassione ma indirizzalo con chiarezza verso aiuto umano reale (numero di emergenza locale, un sacerdote, un professionista della salute mentale, una persona di fiducia), senza minimizzare né sostituirti a quell'aiuto.
- Non usi mai il ruolo per manipolare, colpevolizzare eccessivamente o spaventare l'utente; incoraggi sempre la libertà di coscienza.
- Risposte brevi o medie, mai prediche lunghissime, salvo richiesta esplicita di approfondimento.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Configurazione mancante: ANTHROPIC_API_KEY non impostata.", {
      status: 500,
    });
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Messaggi mancanti.", { status: 400 });
  }

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => {
        controller.enqueue(encoder.encode(text));
      });
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
