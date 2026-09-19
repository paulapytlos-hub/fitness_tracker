"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createPlan, type PlanState } from "@/app/actions/plans";
import { FormField } from "@/components/ui/FormField";
import { FormTextarea } from "@/components/ui/FormTextarea";

const initialState: PlanState = {};

export default function NewWorkoutPlanPage() {
  const [state, formAction, pending] = useActionState(createPlan, initialState);

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <h1 className="text-3xl font-medium text-foreground sm:text-4xl">Nowy plan</h1>

      <form action={formAction} className="space-y-4">
        <FormField
          label="Nazwa planu"
          id="name"
          name="name"
          type="text"
          placeholder="np. Glutes A"
          required
        />
        <FormTextarea
          label="Opis (opcjonalnie)"
          id="description"
          name="description"
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50 sm:w-auto"
        >
          {pending ? "Tworzenie…" : "Utwórz plan"}
        </button>
      </form>

      <Link href="/workouts" className="block text-sm text-muted-foreground underline">
        Anuluj i wróć do listy
      </Link>
    </div>
  );
}
