"use client";

import { useActionState, useEffect, useRef } from "react";
import { createExercise, type ExerciseState } from "@/app/actions/plans";
import { ExerciseFieldset } from "@/components/workouts/ExerciseFieldset";
import { getDay, type DayOfWeek } from "@/lib/days";

const initialState: ExerciseState = {};

export function AddExerciseForm({
  planId,
  dayOfWeek,
}: {
  planId: string;
  dayOfWeek: DayOfWeek;
}) {
  const action = createExercise.bind(null, planId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      formRef.current?.reset();
    }
  }, [state]);

  const day = getDay(dayOfWeek);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border border-line bg-card p-4"
    >
      <h3 className="text-sm font-semibold">
        Dodaj ćwiczenie — {day?.full}
      </h3>
      <input type="hidden" name="day_of_week" value={dayOfWeek} />

      <ExerciseFieldset idPrefix="add-exercise" />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-success">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Dodawanie…" : "Dodaj ćwiczenie"}
      </button>
    </form>
  );
}
