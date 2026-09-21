import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="px-4 py-10">
      <header className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-serif text-ink mb-2">Un dialogo con Dio</h1>
        <p className="text-sm text-ink/60 max-w-lg mx-auto">
          Un'esperienza di dialogo spirituale generata da intelligenza artificiale,
          ispirata alla tradizione cristiano-cattolica. Non è una guida teologica
          né sostituisce un sacerdote, un direttore spirituale o il Magistero della Chiesa.
        </p>
      </header>
      <Chat />
      <footer className="max-w-2xl mx-auto text-center mt-6 text-xs text-ink/40">
        Contenuto generato da IA a scopo devozionale e riflessivo. In caso di crisi
        personale o spirituale, rivolgiti a persone reali: un sacerdote, un professionista
        della salute mentale o chi ti è vicino.
      </footer>
    </main>
  );
}
