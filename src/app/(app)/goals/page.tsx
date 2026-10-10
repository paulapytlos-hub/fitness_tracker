import { redirect } from "next/navigation";
import { Check, Circle, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { NewGoalForm } from "@/components/goals/NewGoalForm";
import { GoalActions } from "@/components/goals/GoalActions";
import { buildExerciseProgress, exerciseKey } from "@/lib/progress";
import { formatNumber, sessionDate } from "@/lib/sessions";
import { dateKeyToDate, formatLongDate, toDateKey } from "@/lib/schedule";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: goals }, { data: sessions }, { data: planExercises }] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("workout_sessions")
      .select(
        "id, scheduled_date, started_at, completed_at, session_exercises(name, exercise_sets(reps, weight))"
      )
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .limit(1000),
    supabase.from("exercises").select("name, workout_plans!inner(user_id)").eq("workout_plans.user_id", user.id),
  ]);

  const completedSessions = sessions ?? [];
  const bestByExercise = new Map(
    buildExerciseProgress(completedSessions)
      .filter((p) => p.metric === "kg")
      .map((p) => [exerciseKey(p.name), p.best])
  );
  const exerciseNames = [
    ...new Map((planExercises ?? []).map((e) => [exerciseKey(e.name), e.name.trim()])).values(),
  ].sort((a, b) => a.localeCompare(b, "pl"));
  const todayKey = toDateKey(new Date());

  const items = (goals ?? []).map((goal) => {
    let current = goal.current_value;
    let progressText: string;

    if (goal.goal_type === "exercise_weight") {
      current = bestByExercise.get(exerciseKey(goal.name)) ?? 0;
      progressText =
        current > 0
          ? `Najcięższa seria: ${formatNumber(current)} kg z ${formatNumber(goal.target_value ?? 0)} kg`
          : `Jeszcze brak zapisanych serii z ciężarem · cel ${formatNumber(goal.target_value ?? 0)} kg`;
    } else if (goal.goal_type === "workout_count") {
      const fromKey = toDateKey(new Date(goal.created_at));
      current = completedSessions.filter((s) => {
        const key = toDateKey(sessionDate(s));
        return key >= fromKey && (!goal.deadline || key <= goal.deadline);
      }).length;
      progressText = `${current} z ${formatNumber(goal.target_value ?? 0)} treningów`;
    } else {
      progressText =
        goal.target_value !== null
          ? `${formatNumber(current)} z ${formatNumber(goal.target_value)}`
          : goal.completed
            ? "Osiągnięty"
            : "W trakcie";
    }

    const percent =
      goal.target_value && goal.target_value > 0
        ? Math.min(100, Math.round((current / goal.target_value) * 100))
        : goal.completed
          ? 100
          : 0;
    const done = goal.completed || percent >= 100;
    const overdue = !done && goal.deadline !== null && goal.deadline < todayKey;

    return { goal, current, percent, done, overdue, progressText };
  });

  const sorted = [...items.filter((i) => !i.done), ...items.filter((i) => i.done)];

  return (
    <Page
      eyebrow="Your intention"
      title="Goals"
      description="Małe, jasne cele. Postęp liczy się sam z treningów, gdzie się da."
    >
      <div className="mb-8">
        <NewGoalForm exerciseNames={exerciseNames} />
      </div>

      {sorted.length === 0 ? (
        <div className="grid min-h-60 place-items-center border-y border-line py-12 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-primary">
              <Flag />
            </span>
            <p className="mt-5 font-medium">Nie masz jeszcze żadnego celu</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Np. „Hip Thrust 80 kg” albo „12 treningów do końca miesiąca”.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {sorted.map(({ goal, current, percent, done, overdue, progressText }) => (
            <li key={goal.id} className="py-5">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 text-primary">
                  {done ? <Check className="size-5" /> : <Circle className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={done ? "font-medium text-muted-foreground" : "font-medium"}>
                      {goal.goal_type === "exercise_weight"
                        ? `${goal.name} — ${formatNumber(goal.target_value ?? 0)} kg`
                        : goal.goal_type === "workout_count"
                          ? `${goal.name}: ${formatNumber(goal.target_value ?? 0)}`
                          : goal.name}
                    </p>
                    {(goal.target_value !== null || done) && (
                      <span className="shrink-0 text-sm text-muted-foreground">{percent}%</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {progressText}
                    {goal.deadline && (
                      <span className={overdue ? "text-destructive" : undefined}>
                        {" "}
                        · {overdue ? "termin minął " : "do "}
                        {formatLongDate(dateKeyToDate(goal.deadline)).toLowerCase()}
                      </span>
                    )}
                  </p>
                  {goal.description && <p className="mt-1 text-sm">{goal.description}</p>}
                  {(goal.target_value !== null || done) && (
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                  <GoalActions
                    goalId={goal.id}
                    isCustom={goal.goal_type === "custom"}
                    hasTarget={goal.target_value !== null}
                    currentValue={current}
                    completed={goal.completed}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
