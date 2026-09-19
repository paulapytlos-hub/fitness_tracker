import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BarChart3, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { buttonVariants } from "@/components/ui/Button";

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

  return (
    <Page
      eyebrow="Exercise progress"
      title={exercise.name}
      description="Your strength story will appear here after completed sessions."
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
    </Page>
  );
}
