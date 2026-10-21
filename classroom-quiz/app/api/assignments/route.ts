import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createIndividualAssignment, listStudents } from "@/lib/classroom";
import { extractText, normalizeWhitespace } from "@/lib/source-text";
import {
  DIFFICULTIES,
  answerKey,
  buildQuestionPool,
  dealQuestions,
  renderDescription,
  type Difficulty,
} from "@/lib/questions";

export const maxDuration = 300;

const MIN_TEXT_LENGTH = 500;
const MAX_QUESTIONS = 20;

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// Converte data e ora locali del docente in data e ora UTC, come richiede l'API Classroom.
function toUtcDue(local: string, tzOffsetMinutes: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) throw new Error("Data o ora di consegna non valide");
  const [year, month, day, hours, minutes] = match.slice(1).map(Number);

  // getTimezoneOffset() restituisce UTC - locale in minuti (es. -60 per l'Italia invernale).
  const utc = new Date(Date.UTC(year, month - 1, day, hours, minutes) + tzOffsetMinutes * 60_000);
  if (Number.isNaN(utc.getTime())) throw new Error("Data o ora di consegna non valide");
  if (utc.getTime() <= Date.now()) throw new Error("La data di consegna deve essere nel futuro");

  return {
    dueDate: { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() },
    dueTime: { hours: utc.getUTCHours(), minutes: utc.getUTCMinutes(), seconds: 0, nanos: 0 },
  };
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.accessToken) return errorResponse("Non autenticato", 401);
  const accessToken = session.accessToken;

  const form = await request.formData();
  const courseId = field(form, "courseId");
  const topic = field(form, "topic");
  const difficulty = field(form, "difficulty") as Difficulty;
  const numQuestions = Number(field(form, "numQuestions"));
  const dueLocal = field(form, "dueLocal");
  const tzOffsetMinutes = Number(field(form, "tzOffsetMinutes"));

  if (!courseId) return errorResponse("Seleziona una classroom");
  if (!topic) return errorResponse("Inserisci un argomento");
  if (!(difficulty in DIFFICULTIES)) return errorResponse("Livello di difficoltà non valido");
  if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > MAX_QUESTIONS) {
    return errorResponse(`Il numero di domande deve essere tra 1 e ${MAX_QUESTIONS}`);
  }
  if (!Number.isFinite(tzOffsetMinutes)) return errorResponse("Fuso orario non valido");

  let due;
  try {
    due = toUtcDue(dueLocal, tzOffsetMinutes);
  } catch (err) {
    return errorResponse((err as Error).message);
  }

  const file = form.get("file");
  let rawText = field(form, "text");
  if (file instanceof File && file.size > 0) {
    try {
      rawText = await extractText(file);
    } catch (err) {
      return errorResponse((err as Error).message);
    }
  }
  const text = normalizeWhitespace(rawText);
  if (text.length < MIN_TEXT_LENGTH) {
    return errorResponse(`Il testo è troppo breve (minimo ${MIN_TEXT_LENGTH} caratteri)`);
  }

  const students = await listStudents(accessToken, courseId);
  if (students.length === 0) return errorResponse("La classroom non ha studenti");

  let pool;
  try {
    pool = await buildQuestionPool({
      text,
      topic,
      difficulty,
      needed: students.length * numQuestions,
    });
  } catch (err) {
    return errorResponse((err as Error).message, 502);
  }

  const sets = dealQuestions(pool, students.length, numQuestions);

  const results = [];
  for (const [i, student] of students.entries()) {
    const questions = sets[i];
    try {
      await createIndividualAssignment(accessToken, {
        courseId,
        studentId: student.id,
        title: topic,
        description: renderDescription(topic, difficulty, questions),
        ...due,
      });
      results.push({ student: student.name, status: "ok" as const, answerKey: answerKey(questions) });
    } catch (err) {
      results.push({
        student: student.name,
        status: "error" as const,
        error: (err as Error).message,
        answerKey: answerKey(questions),
      });
    }
  }

  return NextResponse.json({
    topic,
    difficulty,
    created: results.filter((r) => r.status === "ok").length,
    total: results.length,
    results,
  });
}
