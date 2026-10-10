import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, TrendingUp, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { buttonVariants } from "@/components/ui/Button";
import { ExerciseProgressCard } from "@/components/progress/ExerciseProgressCard";
import { buildExerciseProgress } from "@/lib/progress";
import { formatNumber, sessionDate, totalVolume } from "@/lib/sessions";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, scheduled_date, started_at, session_exercises(name, exercise_sets(reps, weight))")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: true })
    .limit(500);

  const completed = sessions ?? [];
  const exercises = buildExerciseProgress(completed);
  const allSets = completed.flatMap((s) => s.session_exercises.flatMap((ex) => ex.exercise_sets));
  const volume = totalVolume(allSets);

  const now = new Date();
  const thisMonth = completed.filter((s) => {
    const d = sessionDate(s);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const stats = [
    { label: "Treningi łącznie", value: String(completed.length) },
    { label: "W tym miesiącu", value: String(thisMonth) },
    { label: "Serie łącznie", value: String(allSets.length) },
    { label: "Podniesione łącznie", value: volume > 0 ? `${formatNumber(volume)} kg` : "–" },
  ];

  return (
    <Page title="Progress" description="Jak rośnie Twoja siła — liczone z zapisanych treningów.">
      <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="py-5">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-medium">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Dumbbell className="size-4 text-primary" />
          Siła
        </h2>
        {exercises.length === 0 ? (
          <div className="mt-4 grid min-h-60 place-items-center border-y border-line py-12 text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-primary">
                <BarChart3 />
              </span>
              <p className="mt-5 font-medium">Brak danych z treningów</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Zakończ pierwszy trening z zapisanymi seriami, a tutaj pojawi się
                postęp każdego ćwiczenia.
              </p>
              <Link href="/workouts" className={buttonVariants({ className: "mt-6" })}>
                Zobacz plan treningowy
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {exercises.map((exercise) => (
              <ExerciseProgressCard key={exercise.name} progress={exercise} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <TrendingUp className="size-4 text-primary" />
          Pomiary ciała
        </h2>
        <p className="mt-4 border-y border-line py-8 text-center text-sm text-muted-foreground">
          Pojawią się tutaj, gdy powstanie tygodniowy raport (waga, obwody, zdjęcia).
        </p>
      </section>
    </Page>
  );
}
