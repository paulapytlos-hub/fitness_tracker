"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createGoal, type GoalState } from "@/app/actions/goals";
import { FormField } from "@/components/ui/FormField";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const initialState: GoalState = {};

const TYPES = [
  { value: "exercise_weight", label: "Ciężar w ćwiczeniu", hint: "np. Hip Thrust 80 kg" },
  { value: "workout_count", label: "Liczba treningów", hint: "np. 12 treningów do końca miesiąca" },
  { value: "custom", label: "Własny cel", hint: "cokolwiek innego" },
] as const;

export function NewGoalForm({ exerciseNames }: { exerciseNames: string[] }) {
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState<(typeof TYPES)[number]["value"]>("exercise_weight");
  const [state, formAction, pending] = useActionState(
    async (prev: GoalState, formData: FormData) => {
      const result = await createGoal(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    initialState
  );

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonVariants()}>
        <Plus /> Nowy cel
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="paper-shadow w-full space-y-4 rounded-xl border border-line bg-card p-5 text-left"
    >
      <input type="hidden" name="goalType" value={goalType} />
      <div className="grid gap-2 sm:grid-cols-3">
        {TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            aria-pressed={goalType === type.value}
            onClick={() => setGoalType(type.value)}
            className={cn(
              "rounded-lg border p-3 text-left text-sm transition-colors",
              goalType === type.value
                ? "border-primary bg-secondary"
                : "border-line hover:border-primary/40"
            )}
          >
            <span className="block font-medium">{type.label}</span>
            <span className="text-xs text-muted-foreground">{type.hint}</span>
          </button>
        ))}
      </div>

      {goalType === "exercise_weight" ? (
        <>
          <FormField
            label="Ćwiczenie"
            id="goal-name"
            name="name"
            list="goal-exercise-names"
            placeholder="Hip Thrust"
            required
          />
          <datalist id="goal-exercise-names">
            {exerciseNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <FormField
            label="Docelowy ciężar (kg)"
            id="goal-target"
            name="target"
            inputMode="decimal"
            required
          />
          <p className="text-xs text-muted-foreground">
            Postęp liczy się sam z zapisanych treningów (najcięższa seria tego ćwiczenia).
          </p>
        </>
      ) : goalType === "workout_count" ? (
        <>
          <FormField
            label="Nazwa"
            id="goal-name"
            name="name"
            defaultValue="Treningi"
            required
          />
          <FormField
            label="Ile treningów"
            id="goal-target"
            name="target"
            inputMode="numeric"
            required
          />
          <p className="text-xs text-muted-foreground">
            Liczą się treningi zakończone od dziś do terminu.
          </p>
        </>
      ) : (
        <>
          <FormField label="Nazwa" id="goal-name" name="name" required />
          <FormField
            label="Cel liczbowy (opcjonalnie)"
            id="goal-target"
            name="target"
            inputMode="decimal"
            placeholder="np. 10 — postęp wpisujesz ręcznie"
          />
        </>
      )}

      <FormField label="Termin (opcjonalnie)" id="goal-deadline" name="deadline" type="date" />
      <FormField label="Opis (opcjonalnie)" id="goal-description" name="description" />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={buttonVariants({ variant: "ghost" })}
        >
          Anuluj
        </button>
        <button type="submit" disabled={pending} className={buttonVariants()}>
          {pending ? "Zapisywanie…" : "Dodaj cel"}
        </button>
      </div>
    </form>
  );
}
