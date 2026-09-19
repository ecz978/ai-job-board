"use client";

import { useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Figlio mio, sono qui. Puoi parlarmi come si parla a un Padre: senza timore, senza formalità. Cosa hai nel cuore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Risposta non disponibile.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setError("Qualcosa si è interrotto. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto border border-gold/40 rounded-2xl shadow-xl bg-white/70 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-ink text-parchment rounded-br-sm"
                  : "bg-gold/10 border border-gold/30 text-ink rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-6 text-sm text-red-600 pb-2">{error}</p>
      )}

      <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t border-gold/30">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi qui..."
          className="flex-1 rounded-full border border-gold/40 px-4 py-2 bg-white/80 outline-none focus:ring-2 focus:ring-gold/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-ink text-parchment px-5 py-2 disabled:opacity-40"
        >
          Invia
        </button>
      </form>
    </div>
  );
}
