import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight, CalendarDays, ChevronRight, Dumbbell, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  resolveDay,
  toDateKey,
  startOfWeek,
  formatLongDate,
} from "@/lib/schedule";
import { buttonVariants } from "@/components/ui/Button";
import { StartWorkoutButton } from "@/components/sessions/StartWorkoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id, name")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = startOfWeek(today);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekDateKeys = weekDates.map(toDateKey);

  const todayKey = toDateKey(today);
  let todaySessionState: "none" | "in_progress" | "completed" = "none";
  let todayWorkoutName: string | null = null;
  let todayExerciseCount = 0;
  let completedThisWeek = 0;
  let totalThisWeek = 0;

  if (plan) {
    const [
      { data: exercises },
      { data: planDays },
      { data: scheduledWorkouts },
      { data: todaySession },
    ] = await Promise.all([
        supabase.from("exercises").select("day_of_week").eq("plan_id", plan.id),
        supabase.from("plan_days").select("day_of_week, name").eq("plan_id", plan.id),
        supabase
          .from("scheduled_workouts")
          .select("scheduled_date, source_day_of_week, status")
          .eq("plan_id", plan.id)
          .in("scheduled_date", weekDateKeys),
        supabase
          .from("workout_sessions")
          .select("completed_at")
          .eq("plan_id", plan.id)
          .eq("scheduled_date", todayKey)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (todaySession) {
      todaySessionState = todaySession.completed_at ? "completed" : "in_progress";
    }

    const exerciseCountByDay = new Map<number, number>();
    for (const ex of exercises ?? []) {
      if (ex.day_of_week === null) continue;
      exerciseCountByDay.set(ex.day_of_week, (exerciseCountByDay.get(ex.day_of_week) ?? 0) + 1);
    }

    const overrideByDate = new Map(
      (scheduledWorkouts ?? []).map((row) => [row.scheduled_date, row])
    );

    for (const date of weekDates) {
      const dateKey = toDateKey(date);
      const resolved = resolveDay(date, overrideByDate.get(dateKey));
      const occupied =
        resolved.sourceDayOfWeek !== null &&
        (exerciseCountByDay.get(resolved.sourceDayOfWeek) ?? 0) > 0;
      if (!occupied) continue;
      totalThisWeek += 1;
      if (resolved.status === "completed") completedThisWeek += 1;

      if (dateKey === todayKey) {
        todayExerciseCount = exerciseCountByDay.get(resolved.sourceDayOfWeek!) ?? 0;
        todayWorkoutName =
          planDays?.find((d) => d.day_of_week === resolved.sourceDayOfWeek)?.name ?? "Trening";
      }
    }
  }

  const weeklyProgressPercent =
    totalThisWeek === 0 ? 0 : Math.round((completedThisWeek / totalThisWeek) * 100);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <header className="mb-10 sm:mb-14">
        <p className="text-sm text-muted-foreground">{formatLongDate(today)}</p>
        <h1 className="mt-2 text-3xl font-medium sm:text-5xl">
          {profile?.name ? `Cześć, ${profile.name}` : "Cześć"}{" "}
          <span className="text-primary">♡</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          {totalThisWeek === 0
            ? "Zaplanuj swój tydzień, żeby zacząć."
            : completedThisWeek >= totalThisWeek
              ? "Tydzień ukończony — świetna robota."
              : `Zostało Ci jeszcze ${totalThisWeek - completedThisWeek} ${
                  totalThisWeek - completedThisWeek === 1 ? "trening" : "treningi"
                } w tym tygodniu.`}
        </p>
      </header>

      {!plan ? (
        <section className="workout-glow rounded-xl border border-primary/20 bg-surface p-6 sm:p-9">
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze żadnego planu treningowego.
          </p>
          <Link href="/workouts/new" className={buttonVariants({ className: "mt-5" })}>
            Utwórz plan <ArrowRight />
          </Link>
        </section>
      ) : (
        <section className="workout-glow overflow-hidden rounded-xl border border-primary/20 bg-surface">
          <div className="grid lg:grid-cols-[1.5fr_0.7fr]">
            <div className="p-6 sm:p-9 lg:p-11">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="size-4" />
                Dzisiejszy trening
              </div>
              <h2 className="mt-6 text-3xl font-medium sm:text-4xl">
                {todayWorkoutName ?? "Rest"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {todayWorkoutName ? `${todayExerciseCount} ćwiczeń` : "Dzień odpoczynku"}
              </p>
              {todayWorkoutName ? (
                <StartWorkoutButton
                  planId={plan.id}
                  dateKey={todayKey}
                  size="lg"
                  className="mt-8"
                  label={
                    todaySessionState === "completed"
                      ? "Zobacz trening"
                      : todaySessionState === "in_progress"
                        ? "Kontynuuj trening"
                        : "Rozpocznij trening"
                  }
                />
              ) : (
                <Link
                  href={`/workouts/${plan.id}/edit`}
                  className={buttonVariants({ size: "lg", className: "mt-8" })}
                >
                  Zobacz plan <ArrowRight />
                </Link>
              )}
            </div>
            <div className="border-t border-line bg-secondary/50 p-6 sm:p-9 lg:border-l lg:border-t-0">
              <p className="text-sm font-medium">Postęp tygodnia</p>
              <div className="mt-7 flex items-end justify-between">
                <span className="text-4xl font-medium">
                  {completedThisWeek}{" "}
                  <span className="text-xl text-muted-foreground">/ {totalThisWeek}</span>
                </span>
                <span className="text-xs text-muted-foreground">treningów</span>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${weeklyProgressPercent}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {totalThisWeek === 0
                  ? "Ten tydzień to same dni odpoczynku."
                  : completedThisWeek >= totalThisWeek
                    ? "Wszystko zrobione w tym tygodniu."
                    : "Zobacz kalendarz, żeby oznaczyć trening jako zrobiony."}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Szybkie akcje
        </p>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {plan && (
            <Link
              href={`/workouts/${plan.id}/edit`}
              className="flex items-center justify-between py-4 text-sm font-medium"
            >
              Edytuj plan treningowy <Dumbbell className="size-4 text-primary" />
            </Link>
          )}
          <Link
            href="/weekly-report"
            className="flex items-center justify-between py-4 text-sm font-medium"
          >
            Dodaj raport tygodniowy <ClipboardList className="size-4 text-primary" />
          </Link>
          <Link
            href="/progress"
            className="flex items-center justify-between py-4 text-sm font-medium"
          >
            Zobacz progres <ChevronRight className="size-4 text-primary" />
          </Link>
          <Link
            href="/history"
            className="flex items-center justify-between py-4 text-sm font-medium"
          >
            Historia treningów <CalendarDays className="size-4 text-primary" />
          </Link>
        </div>
      </div>
    </div>
  );
}
