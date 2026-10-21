import { GoogleGenAI, Type } from "@google/genai";
import { normalizeWhitespace } from "@/lib/source-text";

export const DIFFICULTIES = {
  base: {
    label: "Base",
    rubric:
      "comprensione diretta: la risposta si trova in un solo passaggio del testo, anche parafrasata con parole semplici. I distrattori sono chiaramente sbagliati.",
  },
  intermedio: {
    label: "Intermedio",
    rubric:
      "collegamento: la risposta richiede di unire due informazioni del testo o una semplice inferenza. I distrattori sono plausibili.",
  },
  avanzato: {
    label: "Avanzato",
    rubric:
      "analisi: la risposta richiede di combinare più parti del testo, spiegare una relazione causale o applicare un concetto a un caso descritto nel testo. I distrattori sono molto plausibili.",
  },
} as const;

export type Difficulty = keyof typeof DIFFICULTIES;

export type Question = {
  question: string;
  options: string[];
  answerIndex: number;
  sourceQuote: string;
};

type BuildPoolInput = {
  text: string;
  topic: string;
  difficulty: Difficulty;
  needed: number;
};

const BATCH_SIZE = 10;
const MAX_ROUNDS = 4;
const CONCURRENCY = 4;
const OVERSAMPLE = 1.4;

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      answerIndex: { type: Type.INTEGER },
      sourceQuote: { type: Type.STRING },
    },
    required: ["question", "options", "answerIndex", "sourceQuote"],
  },
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurata");
  return new GoogleGenAI({ apiKey });
}

function buildPrompt(text: string, topic: string, difficulty: Difficulty, count: number) {
  return `Sei un docente che prepara domande a scelta multipla.

REGOLE, da rispettare tutte:
- Usa ESCLUSIVAMENTE le informazioni presenti nel TESTO. Non usare conoscenze esterne.
- Concentrati sull'ARGOMENTO indicato, se nel testo è presente.
- Livello di difficoltà: ${DIFFICULTIES[difficulty].label}. Criterio: ${DIFFICULTIES[difficulty].rubric}
- Scrivi esattamente ${count} domande, ognuna con 4 opzioni e una sola risposta corretta.
- Le domande devono essere diverse tra loro: non ripetere la stessa informazione.
- "answerIndex" è l'indice (0-3) dell'opzione corretta.
- "sourceQuote" è una citazione COPIATA LETTERALMENTE dal testo che contiene l'informazione necessaria per rispondere.
- Scrivi in italiano.

ARGOMENTO: ${topic}

TESTO:
"""
${text}
"""`;
}

function isValidRaw(q: unknown): q is Question {
  if (!q || typeof q !== "object") return false;
  const c = q as Question;
  return (
    typeof c.question === "string" &&
    c.question.trim().length > 0 &&
    Array.isArray(c.options) &&
    c.options.length === 4 &&
    c.options.every((o) => typeof o === "string" && o.trim().length > 0) &&
    Number.isInteger(c.answerIndex) &&
    c.answerIndex >= 0 &&
    c.answerIndex <= 3 &&
    typeof c.sourceQuote === "string"
  );
}

async function generateBatch(
  text: string,
  topic: string,
  difficulty: Difficulty,
  count: number,
): Promise<Question[]> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const res = await ai.models.generateContent({
    model,
    contents: buildPrompt(text, topic, difficulty, count),
    config: {
      responseMimeType: "application/json",
      responseSchema: questionSchema,
      temperature: 0.8,
    },
  });

  const parsed: unknown = JSON.parse(res.text ?? "[]");
  if (!Array.isArray(parsed)) return [];

  // Verifica di ancoraggio: la citazione deve esistere davvero nel testo sorgente.
  const normalizedSource = normalizeWhitespace(text).toLowerCase();
  return parsed.filter(
    (q): q is Question =>
      isValidRaw(q) &&
      normalizedSource.includes(normalizeWhitespace(q.sourceQuote).toLowerCase()),
  );
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    results.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
  }
  return results;
}

export async function buildQuestionPool({ text, topic, difficulty, needed }: BuildPoolInput) {
  const pool: Question[] = [];
  const seen = new Set<string>();

  for (let round = 0; round < MAX_ROUNDS && pool.length < needed; round++) {
    const missing = needed - pool.length;
    const batchCount = Math.ceil((missing * OVERSAMPLE) / BATCH_SIZE);
    const batches = Array.from({ length: batchCount }, () => BATCH_SIZE);

    const generated = await mapWithConcurrency(batches, CONCURRENCY, (count) =>
      generateBatch(text, topic, difficulty, count),
    );

    for (const q of generated.flat()) {
      const key = normalizeWhitespace(q.question).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push(q);
    }
  }

  if (pool.length < needed) {
    throw new Error(
      `Generate solo ${pool.length} domande valide su ${needed} richieste. Prova con un testo più ricco o meno domande.`,
    );
  }
  return pool.slice(0, needed);
}

// Mescola il pool e assegna a ogni studente un blocco disgiunto: nessuna domanda è condivisa.
export function dealQuestions(pool: Question[], studentCount: number, perStudent: number) {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return Array.from({ length: studentCount }, (_, s) =>
    shuffled.slice(s * perStudent, (s + 1) * perStudent),
  );
}

const LETTERS = ["A", "B", "C", "D"];

export function renderDescription(topic: string, difficulty: Difficulty, questions: Question[]) {
  const header = [
    `Argomento: ${topic}`,
    `Livello: ${DIFFICULTIES[difficulty].label}`,
    "",
    "Per ogni domanda scegli una sola risposta.",
    "",
  ];
  const body = questions.flatMap((q, i) => [
    `${i + 1}. ${q.question}`,
    ...q.options.map((o, k) => `   ${LETTERS[k]}) ${o}`),
    "",
  ]);
  return [...header, ...body].join("\n");
}

export function answerKey(questions: Question[]) {
  return questions.map((q, i) => ({
    n: i + 1,
    question: q.question,
    correct: LETTERS[q.answerIndex],
  }));
}
