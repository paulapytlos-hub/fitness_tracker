import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { SetLogForm } from "@/components/sessions/SetLogForm";
import { DeleteSetButton } from "@/components/sessions/DeleteSetButton";
import { FinishWorkoutForm } from "@/components/sessions/FinishWorkoutForm";
import { formatSessionDate, formatSet, formatTarget, formatNumber } from "@/lib/sessions";

export default async function WorkoutSessionPage({
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
      `id, title, scheduled_date, started_at, completed_at,
       workout_plans(name),
       session_exercises(id, name, position, target_sets, target_rep_range, target_weight, target_rpe, notes,
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
  if (session.completed_at) {
    redirect(`/history/${session.id}`);
  }

  const exercises = session.session_exercises;
  const loggedSetCount = exercises.reduce((sum, ex) => sum + ex.exercise_sets.length, 0);

  return (
    <Page
      eyebrow="Trening w toku"
      title={session.title ?? "Trening"}
      description={[formatSessionDate(session), session.workout_plans?.name]
        .filter(Boolean)
        .join(" · ")}
    >
      <div className="space-y-4">
        {exercises.map((exercise, index) => {
          const sets = exercise.exercise_sets;
          const lastSet = sets[sets.length - 1];
          const target = formatTarget(exercise);
          const targetSets = exercise.target_sets ?? 0;
          const done = targetSets > 0 && sets.length >= targetSets;

          return (
            <section
              key={exercise.id}
              className="paper-shadow rounded-xl border border-line bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Ćwiczenie {index + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-medium">{exercise.name}</h2>
                  {target && (
                    <p className="mt-1 text-sm text-muted-foreground">Cel: {target}</p>
                  )}
                  {exercise.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{exercise.notes}</p>
                  )}
                </div>
                {targetSets > 0 && (
                  <span
                    className={
                      done
                        ? "shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-success"
                        : "shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary"
                    }
                  >
                    {sets.length} / {targetSets}
                  </span>
                )}
              </div>

              {sets.length > 0 && (
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {sets.map((set, setIndex) => (
                    <li key={set.id} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        <span className="mr-3 text-muted-foreground">Seria {setIndex + 1}</span>
                        {formatSet(set)}
                      </span>
                      <DeleteSetButton setId={set.id} />
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                <SetLogForm
                  key={sets.length}
                  sessionExerciseId={exercise.id}
                  nextSetNumber={sets.length + 1}
                  defaultReps={lastSet?.reps != null ? String(lastSet.reps) : ""}
                  defaultWeight={
                    lastSet?.weight != null
                      ? formatNumber(lastSet.weight)
                      : exercise.target_weight != null
                        ? formatNumber(exercise.target_weight)
                        : ""
                  }
                />
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="text-lg font-medium">Koniec treningu</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Zapisane serie: {loggedSetCount}. Po zakończeniu trening trafi do historii i nie
          będzie można go już zmieniać.
        </p>
        <FinishWorkoutForm sessionId={session.id} loggedSetCount={loggedSetCount} />
      </section>
    </Page>
  );
}
