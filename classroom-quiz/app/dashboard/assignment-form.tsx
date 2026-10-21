"use client";

import { useState } from "react";
import type { CourseOption } from "@/lib/classroom";

type Result = {
  topic: string;
  difficulty: string;
  created: number;
  total: number;
  results: {
    student: string;
    status: "ok" | "error";
    error?: string;
    answerKey: { n: number; question: string; correct: string }[];
  }[];
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

export default function AssignmentForm({ courses }: { courses: CourseOption[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const date = String(form.get("dueDate") ?? "");
    const time = String(form.get("dueTime") ?? "");
    form.delete("dueDate");
    form.delete("dueTime");
    form.set("dueLocal", `${date}T${time}`);
    form.set("tzOffsetMinutes", String(new Date().getTimezoneOffset()));

    try {
      const res = await fetch("/api/assignments", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore sconosciuto");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function downloadAnswerKey() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chiavi-${result.topic}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Classroom</span>
          <select name="courseId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Seleziona una classroom
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.section ? ` (${c.section})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Argomento</span>
          <input name="topic" required maxLength={200} className={inputClass} placeholder="es. La Rivoluzione francese" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Numero di domande per studente</span>
            <input name="numQuestions" type="number" min={1} max={20} defaultValue={5} required className={inputClass} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Difficoltà</span>
            <select name="difficulty" defaultValue="intermedio" className={inputClass}>
              <option value="base">Base</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzato">Avanzato</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Data di consegna</span>
            <input name="dueDate" type="date" required className={inputClass} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Ora di consegna</span>
            <input name="dueTime" type="time" required className={inputClass} />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Documento (PDF, DOCX, TXT, MD)</span>
          <input name="file" type="file" accept=".pdf,.docx,.txt,.md" className="block w-full text-sm" />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Oppure incolla il testo</span>
          <textarea name="text" rows={8} className={inputClass} />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Generazione in corso… può richiedere qualche minuto" : "Crea compiti individuali"}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <section className="space-y-4">
          <p className="font-medium">
            Creati {result.created} compiti su {result.total} studenti.
          </p>
          <ul className="space-y-1 text-sm">
            {result.results.map((r) => (
              <li key={r.student} className={r.status === "ok" ? "" : "text-red-600"}>
                {r.student}: {r.status === "ok" ? "ok" : r.error}
              </li>
            ))}
          </ul>
          <button type="button" onClick={downloadAnswerKey} className="text-sm underline">
            Scarica le chiavi di risposta (JSON)
          </button>
        </section>
      )}
    </div>
  );
}
