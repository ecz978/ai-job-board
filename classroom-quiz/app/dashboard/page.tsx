import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { listTeachingCourses } from "@/lib/classroom";
import AssignmentForm from "./assignment-form";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/");

  let courses;
  try {
    courses = await listTeachingCourses(session.accessToken);
  } catch {
    // Token scaduto o scope mancanti: si riparte dal login.
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nuovo compito</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="text-sm text-zinc-600 underline dark:text-zinc-400">
            Esci
          </button>
        </form>
      </header>
      <AssignmentForm courses={courses} />
    </main>
  );
}
