"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addSet, type SessionState } from "@/app/actions/sessions";
import { buttonVariants } from "@/components/ui/Button";

const initialState: SessionState = {};

const inputClass =
  "mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none";

export function SetLogForm({
  sessionExerciseId,
  nextSetNumber,
  defaultReps,
  defaultWeight,
}: {
  sessionExerciseId: string;
  nextSetNumber: number;
  defaultReps: string;
  defaultWeight: string;
}) {
  const [state, formAction, pending] = useActionState(
    addSet.bind(null, sessionExerciseId),
    initialState
  );

  return (
    <form action={formAction} className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-end gap-2">
        <span className="pb-2.5 text-sm font-medium text-muted-foreground">
          #{nextSetNumber}
        </span>
        <label className="text-xs text-muted-foreground">
          Powt.
          <input
            name="reps"
            inputMode="numeric"
            defaultValue={defaultReps}
            required
            className={inputClass}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Ciężar (kg)
          <input
            name="weight"
            inputMode="decimal"
            defaultValue={defaultWeight}
            className={inputClass}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          RPE
          <input name="rpe" inputMode="decimal" className={inputClass} />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}
      >
        <Plus /> {pending ? "Zapisywanie…" : "Zapisz serię"}
      </button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
