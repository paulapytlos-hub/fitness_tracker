import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { buttonVariants } from "@/components/ui/Button";
import {
  formatSessionDate,
  formatSet,
  formatTarget,
  formatDuration,
  formatNumber,
  totalVolume,
} from "@/lib/sessions";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: session } = await supabase
    .from("workout_sessions")
    .select(
      `id, title, scheduled_date, started_at, completed_at, notes,
       workout_plans(name),
       session_exercises(id, name, position, target_sets, target_rep_range, target_weight, target_rpe,
         exercise_sets(id, set_number, reps, weight, rpe))`
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .order("position", { referencedTable: "session_exercises", ascending: true })
    .order("set_number", { referencedTable: "session_exercises.exercise_sets", ascending: true })
    .maybeSingle();

  if (!session) {
    notFound();
  }
  if (!session.completed_at) {
    redirect(`/session/${session.id}`);
  }

  const allSets = session.session_exercises.flatMap((ex) => ex.exercise_sets);
  const volume = totalVolume(allSets);
  const duration = formatDuration(session.started_at, session.completed_at);

  return (
    <Page
      eyebrow="Zrobione"
      title={session.title ?? "Trening"}
      description={[formatSessionDate(session), session.workout_plans?.name]
        .filter(Boolean)
        .join(" · ")}
      action={
        <Link
          href="/history"
          aria-label="Wróć do historii"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft />
        </Link>
      }
    >
      <dl className="grid grid-cols-3 border-y border-line">
        {[
          { label: "Serie", value: String(allSets.length) },
          { label: "Objętość", value: volume > 0 ? `${formatNumber(volume)} kg` : "–" },
          { label: "Czas", value: duration ?? "–" },
        ].map((stat) => (
          <div key={stat.label} className="py-5">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-medium">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {session.notes && (
        <p className="mt-6 rounded-xl bg-secondary/60 p-4 text-sm leading-6">{session.notes}</p>
      )}

      <div className="mt-8 space-y-4">
        {session.session_exercises.map((exercise) => {
          const target = formatTarget(exercise);
          return (
            <section
              key={exercise.id}
              className="paper-shadow rounded-xl border border-line bg-card p-5"
            >
              <h2 className="text-lg font-medium">{exercise.name}</h2>
              {target && <p className="mt-1 text-sm text-muted-foreground">Cel: {target}</p>}
              {exercise.exercise_sets.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Pominięte — brak serii.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {exercise.exercise_sets.map((set, index) => (
                    <li key={set.id} className="py-2 text-sm">
                      <span className="mr-3 text-muted-foreground">Seria {index + 1}</span>
                      {formatSet(set)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </Page>
  );
}
