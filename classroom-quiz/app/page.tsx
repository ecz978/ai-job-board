import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Verifiche personalizzate</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Accedi con l&apos;account Google del docente per creare compiti individuali su Classroom,
        generati dal tuo testo.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Accedi con Google
        </button>
      </form>
    </main>
  );
}
