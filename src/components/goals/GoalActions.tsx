"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateGoalProgress, setGoalCompleted, deleteGoal } from "@/app/actions/goals";
import { buttonVariants } from "@/components/ui/Button";

export function GoalActions({
  goalId,
  isCustom,
  hasTarget,
  currentValue,
  completed,
}: {
  goalId: string;
  isCustom: boolean;
  hasTarget: boolean;
  currentValue: number;
  completed: boolean;
}) {
  const [value, setValue] = useState(String(currentValue).replace(".", ","));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {isCustom && hasTarget && !completed && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateGoalProgress(goalId, Number(value.replace(",", "."))));
          }}
          className="flex items-center gap-2"
        >
          <input
            aria-label="Aktualny postęp"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 rounded-md border border-input bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Zapisz postęp
          </button>
        </form>
      )}
      {isCustom && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => setGoalCompleted(goalId, !completed))}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {completed ? "Oznacz jako w trakcie" : "Oznacz jako osiągnięty"}
        </button>
      )}
      <button
        type="button"
        aria-label="Usuń cel"
        disabled={isPending}
        onClick={() => {
          if (confirm("Usunąć ten cel?")) run(() => deleteGoal(goalId));
        }}
        className={buttonVariants({ variant: "ghost", size: "icon", className: "size-8" })}
      >
        <Trash2 />
      </button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
