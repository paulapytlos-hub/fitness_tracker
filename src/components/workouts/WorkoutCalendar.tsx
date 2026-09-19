"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Check, Repeat2 } from "lucide-react";
import {
  rescheduleWorkout,
  swapScheduledWorkouts,
  shiftScheduledWorkoutsForward,
  toggleRestDay,
  markWorkoutCompleted,
} from "@/app/actions/schedule";
import {
  getRangeDates,
  toDateKey,
  dateKeyToDate,
  resolveDay,
  isMissed,
  isPastDate,
  jsDateToDayOfWeek,
  formatDateRangeLabel,
  type ViewRange,
} from "@/lib/schedule";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/lib/days";
import { ExerciseRow } from "@/components/workouts/ExerciseRow";
import { AddExerciseForm } from "@/components/workouts/AddExerciseForm";
import { DayNameEditor } from "@/components/workouts/DayNameEditor";
import { buttonVariants } from "@/components/ui/Button";
import type { Tables } from "@/lib/supabase/database.types";

type DaySlot = {
  dateKey: string;
  sourceDayOfWeek: DayOfWeek | null;
  status: "planned" | "completed";
};

const RANGE_OPTIONS: { value: ViewRange; label: string }[] = [
  { value: "week", label: "Tydzień" },
  { value: "biweek", label: "2 tygodnie" },
  { value: "month", label: "Miesiąc" },
];

export function WorkoutCalendar({
  planId,
  exercises,
  planDays,
  scheduledWorkouts,
}: {
  planId: string;
  exercises: Tables<"exercises">[];
  planDays: Tables<"plan_days">[];
  scheduledWorkouts: Tables<"scheduled_workouts">[];
}) {
  const [viewRange, setViewRange] = useState<ViewRange>("week");
  const [rangeOffset, setRangeOffset] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [dragged, setDragged] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ from: string; to: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleDates = useMemo(
    () => getRangeDates(viewRange, rangeOffset),
    [viewRange, rangeOffset]
  );
  const visibleDateKeys = useMemo(() => visibleDates.map(toDateKey), [visibleDates]);

  const overrideByDate = useMemo(() => {
    const map = new Map<string, Tables<"scheduled_workouts">>();
    for (const row of scheduledWorkouts) {
      map.set(row.scheduled_date, row);
    }
    return map;
  }, [scheduledWorkouts]);

  const exerciseCountByDay = useMemo(() => {
    const map = new Map<number, number>();
    for (const ex of exercises) {
      if (ex.day_of_week === null) continue;
      map.set(ex.day_of_week, (map.get(ex.day_of_week) ?? 0) + 1);
    }
    return map;
  }, [exercises]);

  const visibleSlots: DaySlot[] = useMemo(
    () =>
      visibleDates.map((date, i) => {
        const dateKey = visibleDateKeys[i]!;
        const resolved = resolveDay(date, overrideByDate.get(dateKey));
        return {
          dateKey,
          sourceDayOfWeek: resolved.sourceDayOfWeek,
          status: resolved.status,
        };
      }),
    [visibleDates, visibleDateKeys, overrideByDate]
  );

  function changeRange(range: ViewRange) {
    setViewRange(range);
    setRangeOffset(0);
  }

  function runAction(fn: () => Promise<{ error?: string; conflict?: boolean }>) {
    startTransition(async () => {
      setActionError(null);
      const result = await fn();
      if (result.error) setActionError(result.error);
    });
  }

  function requestMove(fromKey: string, toKey: string) {
    if (fromKey === toKey) {
      setMoving(null);
      return;
    }
    if (isPastDate(dateKeyToDate(toKey))) {
      setActionError("Nie można zaplanować treningu na dzień, który już minął.");
      return;
    }
    startTransition(async () => {
      setActionError(null);
      const result = await rescheduleWorkout(planId, fromKey, toKey);
      if (result.conflict) {
        setConflict({ from: fromKey, to: toKey });
        return;
      }
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setSelectedDateKey(toKey);
      setMoving(null);
      setDragged(null);
    });
  }

  function resolveConflict(method: "swap" | "shift") {
    if (!conflict) return;
    const { from, to } = conflict;
    startTransition(async () => {
      setActionError(null);
      const result =
        method === "swap"
          ? await swapScheduledWorkouts(planId, from, to)
          : await shiftScheduledWorkoutsForward(planId, from, to);
      if (result.error) setActionError(result.error);
      setSelectedDateKey(to);
      setConflict(null);
      setMoving(null);
      setDragged(null);
    });
  }

  const selectedIndex = visibleDateKeys.indexOf(selectedDateKey);
  const selectedDate = visibleDates[selectedIndex] ?? visibleDates[0]!;
  const selectedSlot = visibleSlots[selectedIndex] ?? visibleSlots[0]!;
  const selectedDayOfWeek = selectedSlot.sourceDayOfWeek;
  const effectiveDayOfWeek: DayOfWeek =
    selectedDayOfWeek ?? jsDateToDayOfWeek(selectedDate);
  const selectedName =
    selectedDayOfWeek === null
      ? null
      : (planDays.find((d) => d.day_of_week === selectedDayOfWeek)?.name ?? null);
  const selectedExercises = exercises
    .filter((e) => e.day_of_week === selectedDayOfWeek)
    .sort((a, b) => a.position - b.position);
  const selectedIsRest = selectedDayOfWeek === null || selectedExercises.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-line bg-surface p-1 text-xs">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeRange(option.value)}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                viewRange === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {formatDateRangeLabel(visibleDates)}
          </p>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => setRangeOffset((v) => v - 1)}
              aria-label="Poprzedni zakres"
              className="flex size-8 items-center justify-center rounded-md hover:bg-secondary"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setRangeOffset(0)}
              className="px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Dziś
            </button>
            <button
              type="button"
              onClick={() => setRangeOffset((v) => v + 1)}
              aria-label="Następny zakres"
              className="flex size-8 items-center justify-center rounded-md hover:bg-secondary"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-4 sm:grid-cols-7">
        {visibleDates.map((date, i) => {
          const dateKey = visibleDateKeys[i]!;
          const slot = visibleSlots[i]!;
          const count =
            slot.sourceDayOfWeek === null
              ? 0
              : (exerciseCountByDay.get(slot.sourceDayOfWeek) ?? 0);
          const isRest = slot.sourceDayOfWeek === null || count === 0;
          const name =
            slot.sourceDayOfWeek === null
              ? null
              : planDays.find((d) => d.day_of_week === slot.sourceDayOfWeek)?.name;
          const missed = isMissed(
            { sourceDayOfWeek: slot.sourceDayOfWeek, status: slot.status, isOverride: true },
            date
          );
          const isSelected = dateKey === selectedDateKey;
          const isPast = isPastDate(date);
          const shortDay = DAYS_OF_WEEK[jsDateToDayOfWeek(date)]?.short ?? "";

          return (
            <button
              key={dateKey}
              type="button"
              draggable={!isRest}
              onDragStart={() => setDragged(dateKey)}
              onDragEnd={() => setDragged(null)}
              onDragOver={(e) => {
                if (isPast) return;
                e.preventDefault();
              }}
              onDrop={() => dragged && !isPast && requestMove(dragged, dateKey)}
              onClick={() =>
                moving !== null ? requestMove(moving, dateKey) : setSelectedDateKey(dateKey)
              }
              className={`rounded-xl border p-3 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-secondary"
                  : "border-line bg-card hover:border-primary/40"
              } ${dragged && dragged !== dateKey && !isPast ? "border-dashed" : ""} ${
                isPast ? "opacity-60" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {shortDay} {date.getDate()}
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {isRest ? "Rest" : (name ?? "Trening")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isRest ? "Recovery" : `${count} ćwiczeń`}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                {slot.status === "completed" && (
                  <Check className="size-3.5 text-success" />
                )}
                {missed && (
                  <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    MISSED
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="hidden text-xs text-muted-foreground md:block">
        Przeciągnij trening na inny dzień, albo użyj „Reschedule” poniżej. W
        widoku „2 tygodnie”/„Miesiąc” możesz przenieść trening na dowolny
        widoczny dzień bez przełączania zakresu.
      </p>

      {conflict && (
        <section className="rounded-lg border-l-2 border-primary bg-secondary/55 p-5">
          <p className="font-medium">Ten dzień już ma trening</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Zamień oba treningi miejscami, albo przesuń resztę planu o jeden
            dzień do przodu, do najbliższego wolnego dnia.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => resolveConflict("swap")}
              className={buttonVariants({ size: "sm" })}
            >
              Swap workouts
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => resolveConflict("shift")}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Shift plan forward
            </button>
            <button
              type="button"
              onClick={() => {
                setConflict(null);
                setDragged(null);
                setMoving(null);
              }}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="space-y-4 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {DAYS_OF_WEEK[jsDateToDayOfWeek(selectedDate)]?.full} ·{" "}
              {selectedDate.getDate()}.{String(selectedDate.getMonth() + 1).padStart(2, "0")}
            </p>
            {!selectedIsRest && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat2 className="size-3.5" />
                Powtarza się co tydzień
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={selectedIsRest}
              onClick={() => setMoving(moving === selectedDateKey ? null : selectedDateKey)}
              className={buttonVariants({
                variant: moving === selectedDateKey ? "secondary" : "outline",
                size: "sm",
              })}
            >
              {moving === selectedDateKey ? "Wybierz dzień" : "Reschedule"}
            </button>
            {!selectedIsRest && selectedSlot.status !== "completed" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction(() => markWorkoutCompleted(planId, selectedDateKey))}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Mark as done
              </button>
            )}
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => toggleRestDay(planId, selectedDateKey))}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {selectedIsRest ? "Ustaw trening" : "Ustaw REST"}
            </button>
          </div>
        </div>

        {moving === selectedDateKey && (
          <div className="flex flex-wrap gap-2 border-b border-line pb-4">
            {visibleDateKeys.map((dateKey, i) =>
              dateKey !== selectedDateKey && !isPastDate(visibleDates[i]!) ? (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => requestMove(selectedDateKey, dateKey)}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  {DAYS_OF_WEEK[jsDateToDayOfWeek(visibleDates[i]!)]?.short}{" "}
                  {visibleDates[i]!.getDate()}
                </button>
              ) : null
            )}
          </div>
        )}

        <DayNameEditor
          planId={planId}
          dayOfWeek={effectiveDayOfWeek}
          name={selectedName}
        />

        {selectedIsRest ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm font-medium">REST</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dzień odpoczynku. Dodaj ćwiczenie poniżej, jeśli to jednak dzień
              treningowy.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedExercises.map((exercise, index) => (
              <ExerciseRow
                key={exercise.id}
                planId={planId}
                exercise={exercise}
                isFirst={index === 0}
                isLast={index === selectedExercises.length - 1}
              />
            ))}
          </div>
        )}

        <AddExerciseForm
          key={effectiveDayOfWeek}
          planId={planId}
          dayOfWeek={effectiveDayOfWeek}
        />
      </div>
    </div>
  );
}
