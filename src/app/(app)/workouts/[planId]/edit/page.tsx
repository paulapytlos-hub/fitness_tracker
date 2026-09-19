import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanDetailsForm } from "@/components/workouts/PlanDetailsForm";
import { DeletePlanButton } from "@/components/workouts/DeletePlanButton";
import { WorkoutCalendar } from "@/components/workouts/WorkoutCalendar";

export default async function EditWorkoutPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id, name, description, updated_at")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) {
    notFound();
  }

  const [{ data: exercises }, { data: planDays }, { data: scheduledWorkouts }] =
    await Promise.all([
      supabase
        .from("exercises")
        .select("*")
        .eq("plan_id", planId)
        .order("position", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("plan_days").select("*").eq("plan_id", planId),
      supabase.from("scheduled_workouts").select("*").eq("plan_id", planId),
    ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="flex items-center justify-between">
        <Link href="/workouts" className="text-sm text-muted-foreground underline">
          ← Wróć do listy planów
        </Link>
        <Link
          href="/progress"
          className="rounded-md border border-line px-3 py-1.5 text-xs text-primary"
        >
          Zobacz swój progres →
        </Link>
      </div>

      <div className="workout-glow space-y-8 rounded-xl border border-primary/20 bg-surface p-6">
        <PlanDetailsForm plan={plan} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Kalendarz treningów</h2>
          <WorkoutCalendar
            planId={planId}
            exercises={exercises ?? []}
            planDays={planDays ?? []}
            scheduledWorkouts={scheduledWorkouts ?? []}
          />
        </section>
      </div>

      <div className="border-t border-line pt-6">
        <DeletePlanButton planId={plan.id} />
      </div>
    </div>
  );
}
