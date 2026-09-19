"use client";

import { useActionState, useState } from "react";
import { setDayName, type DayNameState } from "@/app/actions/plans";

const initialState: DayNameState = {};

export function DayNameEditor({
  planId,
  dayOfWeek,
  name,
}: {
  planId: string;
  dayOfWeek: number;
  name: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const action = setDayName.bind(null, planId, dayOfWeek);
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
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{name ?? "Nienazwany dzień"}</h3>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="shrink-0 rounded-md border border-primary/30 px-3 py-1.5 text-xs text-primary"
        >
          {name ? "Zmień nazwę" : "Nazwij dzień"}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="name"
        defaultValue={name ?? ""}
        placeholder="np. Glute Day"
        required
        autoFocus
        className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-base focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Zapisywanie…" : "Zapisz"}
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="rounded-md border border-line px-3 py-2 text-sm"
      >
        Anuluj
      </button>
      {state.error && (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
