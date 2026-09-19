"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  updateExercise,
  deleteExercise,
  reorderExercise,
  type ExerciseState,
} from "@/app/actions/plans";
import { ExerciseFieldset } from "@/components/workouts/ExerciseFieldset";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { DAYS_OF_WEEK } from "@/lib/days";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: ExerciseState = {};

const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-md border border-line text-sm text-muted-foreground hover:border-primary/40 disabled:opacity-30";

function FieldStat({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export function ExerciseRow({
  planId,
  exercise,
  isFirst,
  isLast,
}: {
  planId: string;
  exercise: Tables<"exercises">;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const updateAction = updateExercise.bind(null, exercise.id);
  const [state, formAction, pending] = useActionState(
    updateAction,
    initialState
  );

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.message) {
      setIsEditing(false);
    }
  }

  const moveUpAction = reorderExercise.bind(null, exercise.id, "up");
  const moveDownAction = reorderExercise.bind(null, exercise.id, "down");
  const deleteAction = deleteExercise.bind(null, exercise.id);

  return (
    <div className="paper-shadow space-y-3 rounded-xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-semibold">{exercise.name}</h4>
        <div className="flex shrink-0 gap-1.5">
          <form action={moveUpAction}>
            <button
              type="submit"
              disabled={isFirst}
              aria-label="Przesuń w górę"
              className={iconButtonClass}
            >
              ↑
            </button>
          </form>
          <form action={moveDownAction}>
            <button
              type="submit"
              disabled={isLast}
              aria-label="Przesuń w dół"
              className={iconButtonClass}
            >
              ↓
            </button>
          </form>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label="Edytuj ćwiczenie"
              className={iconButtonClass}
            >
              ✎
            </button>
          )}
          <form action={deleteAction}>
            <ConfirmSubmitButton
              confirmMessage="Usunąć to ćwiczenie?"
              aria-label="Usuń ćwiczenie"
              className={`${iconButtonClass} text-destructive`}
            >
              ✕
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {!isEditing && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <FieldStat label="Sets" value={exercise.sets} />
            <FieldStat label="Reps" value={exercise.rep_range} />
            <FieldStat
              label="Weight"
              value={exercise.target_weight ? `${exercise.target_weight} kg` : null}
            />
            <FieldStat label="RPE" value={exercise.target_rpe} />
          </div>

          {exercise.notes && (
            <p className="text-xs text-muted-foreground">{exercise.notes}</p>
          )}

          <Link
            href={`/workouts/${planId}/exercises/${exercise.id}/progress`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs text-secondary-foreground hover:border-primary/40"
          >
            Progress
          </Link>
        </div>
      )}

      {isEditing && (
        <form action={formAction} className="space-y-3">
          <ExerciseFieldset
            idPrefix={`exercise-${exercise.id}`}
            defaults={exercise}
          />

          <div>
            <label
              htmlFor={`exercise-${exercise.id}-day_of_week`}
              className="block text-sm font-medium"
            >
              Dzień tygodnia
            </label>
            <select
              id={`exercise-${exercise.id}-day_of_week`}
              name="day_of_week"
              defaultValue={exercise.day_of_week ?? ""}
              required
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-base focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                Wybierz dzień
              </option>
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.full}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              {pending ? "Zapisywanie…" : "Zapisz"}
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
      )}
    </div>
  );
}
