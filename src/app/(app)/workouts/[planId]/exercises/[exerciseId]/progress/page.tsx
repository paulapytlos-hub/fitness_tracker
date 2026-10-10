import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BarChart3, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { buttonVariants } from "@/components/ui/Button";
import { ExerciseProgressCard } from "@/components/progress/ExerciseProgressCard";
import { buildExerciseProgress, exerciseKey } from "@/lib/progress";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ planId: string; exerciseId: string }>;
}) {
  const { planId, exerciseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, name, plan_id, workout_plans!inner(user_id)")
    .eq("id", exerciseId)
    .eq("plan_id", planId)
    .eq("workout_plans.user_id", user.id)
    .maybeSingle();

  if (!exercise) {
    notFound();
  }

  // Szukamy po nazwie w zakończonych treningach — sesje to kopie ćwiczeń,
  // więc historia przetrwa nawet zmianę/usunięcie ćwiczenia w planie.
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, scheduled_date, started_at, session_exercises!inner(name, exercise_sets(reps, weight))")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .ilike("session_exercises.name", exercise.name.trim())
    .order("started_at", { ascending: true })
    .limit(500);

  const progress = buildExerciseProgress(sessions ?? []).find(
    (p) => exerciseKey(p.name) === exerciseKey(exercise.name)
  );

  return (
    <Page
      eyebrow="Exercise progress"
      title={exercise.name}
      description={
        progress
          ? "Twoja historia siły w tym ćwiczeniu."
          : "Your strength story will appear here after completed sessions."
      }
      action={
        <Link
          href={`/workouts/${planId}/edit`}
          aria-label="Wróć do planu"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft />
        </Link>
      }
    >
      {progress ? (
        <ExerciseProgressCard progress={progress} showTitle={false} />
      ) : (
        <div className="grid min-h-72 place-items-center border-y border-line py-16 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-primary">
              <BarChart3 />
            </span>
            <h2 className="mt-5 text-lg font-medium">No workout data yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Complete your first workout to start tracking weight, completed
              sets and personal bests.
            </p>
            <Link
              href={`/workouts/${planId}/edit`}
              className={buttonVariants({ className: "mt-6" })}
            >
              Back to workout plan
            </Link>
          </div>
        </div>
      )}
    </Page>
  );
}
