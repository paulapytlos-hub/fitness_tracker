"use client";

import { useActionState, useState } from "react";
import { updatePlan, type PlanState } from "@/app/actions/plans";
import { FormField } from "@/components/ui/FormField";
import { FormTextarea } from "@/components/ui/FormTextarea";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: PlanState = {};

export function PlanDetailsForm({
  plan,
}: {
  plan: Pick<Tables<"workout_plans">, "id" | "name" | "description">;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const action = updatePlan.bind(null, plan.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.message) {
      setIsEditing(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs"
          >
            Edytuj
          </button>
        </div>
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField
        label="Nazwa planu"
        id="name"
        name="name"
        type="text"
        defaultValue={plan.name}
        required
      />
      <FormTextarea
        label="Opis (opcjonalnie)"
        id="description"
        name="description"
        defaultValue={plan.description ?? ""}
      />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="rounded-md border border-line px-4 py-2 text-sm"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
