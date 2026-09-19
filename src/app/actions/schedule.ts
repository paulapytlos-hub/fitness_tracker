"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, assertOwnsPlan, type TypedClient } from "@/lib/supabase/ownership";
import { resolveDay, dateKeyToDate, addDays, isPastDateKey } from "@/lib/schedule";
import type { DayOfWeek } from "@/lib/days";

export type ScheduleState = {
  error?: string;
  conflict?: boolean;
};

const SHIFT_SEARCH_HORIZON_DAYS = 60;

async function resolveEffectiveDayOfWeek(
  supabase: TypedClient,
  planId: string,
  dateKey: string
): Promise<DayOfWeek | null> {
  const { data: override } = await supabase
    .from("scheduled_workouts")
    .select("scheduled_date, source_day_of_week, status")
    .eq("plan_id", planId)
    .eq("scheduled_date", dateKey)
    .maybeSingle();
  return resolveDay(dateKeyToDate(dateKey), override ?? undefined).sourceDayOfWeek;
}

async function getExerciseCountByDay(
  supabase: TypedClient,
  planId: string
): Promise<Map<number, number>> {
  const { data } = await supabase
    .from("exercises")
    .select("day_of_week")
    .eq("plan_id", planId);
  const map = new Map<number, number>();
  for (const row of data ?? []) {
    if (row.day_of_week === null) continue;
    map.set(row.day_of_week, (map.get(row.day_of_week) ?? 0) + 1);
  }
  return map;
}

function isOccupied(
  dayOfWeek: DayOfWeek | null,
  exerciseCountByDay: Map<number, number>
): boolean {
  if (dayOfWeek === null) return false;
  return (exerciseCountByDay.get(dayOfWeek) ?? 0) > 0;
}

async function writeSlot(
  supabase: TypedClient,
  planId: string,
  userId: string,
  dateKey: string,
  sourceDayOfWeek: DayOfWeek | null,
  status: "planned" | "completed" = "planned"
) {
  const { error } = await supabase.from("scheduled_workouts").upsert(
    {
      plan_id: planId,
      user_id: userId,
      scheduled_date: dateKey,
      source_day_of_week: sourceDayOfWeek,
      status,
    },
    { onConflict: "plan_id,scheduled_date" }
  );
  return error?.message ?? null;
}

function revalidateSchedule(planId: string) {
  revalidatePath(`/workouts/${planId}/edit`);
}

export async function rescheduleWorkout(
  planId: string,
  fromDate: string,
  toDate: string
): Promise<ScheduleState> {
  if (fromDate === toDate) return {};
  if (isPastDateKey(toDate)) {
    return { error: "Nie można zaplanować treningu na dzień, który już minął." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const exerciseCountByDay = await getExerciseCountByDay(supabase, planId);
  const fromDayOfWeek = await resolveEffectiveDayOfWeek(supabase, planId, fromDate);
  if (!isOccupied(fromDayOfWeek, exerciseCountByDay)) {
    return { error: "Ten dzień jest pusty — nie ma czego przenieść." };
  }

  const toDayOfWeek = await resolveEffectiveDayOfWeek(supabase, planId, toDate);
  if (isOccupied(toDayOfWeek, exerciseCountByDay)) {
    return { conflict: true };
  }

  const toError = await writeSlot(supabase, planId, user.id, toDate, fromDayOfWeek);
  if (toError) return { error: toError };

  const fromError = await writeSlot(supabase, planId, user.id, fromDate, null);
  if (fromError) return { error: fromError };

  revalidateSchedule(planId);
  return {};
}

export async function swapScheduledWorkouts(
  planId: string,
  dateA: string,
  dateB: string
): Promise<ScheduleState> {
  if (isPastDateKey(dateB)) {
    return { error: "Nie można zaplanować treningu na dzień, który już minął." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const dayA = await resolveEffectiveDayOfWeek(supabase, planId, dateA);
  const dayB = await resolveEffectiveDayOfWeek(supabase, planId, dateB);

  const errorA = await writeSlot(supabase, planId, user.id, dateA, dayB);
  if (errorA) return { error: errorA };

  const errorB = await writeSlot(supabase, planId, user.id, dateB, dayA);
  if (errorB) return { error: errorB };

  revalidateSchedule(planId);
  return {};
}

export async function shiftScheduledWorkoutsForward(
  planId: string,
  fromDate: string,
  toDate: string
): Promise<ScheduleState> {
  if (isPastDateKey(toDate)) {
    return { error: "Nie można zaplanować treningu na dzień, który już minął." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const exerciseCountByDay = await getExerciseCountByDay(supabase, planId);

  const rangeStart = addDays(toDate, 1);
  const rangeEnd = addDays(toDate, SHIFT_SEARCH_HORIZON_DAYS);
  const { data: overrides } = await supabase
    .from("scheduled_workouts")
    .select("scheduled_date, source_day_of_week, status")
    .eq("plan_id", planId)
    .gte("scheduled_date", rangeStart)
    .lte("scheduled_date", rangeEnd);
  const overrideByDate = new Map((overrides ?? []).map((row) => [row.scheduled_date, row]));

  let restDate: string | null = null;
  for (let i = 1; i <= SHIFT_SEARCH_HORIZON_DAYS; i += 1) {
    const candidate = addDays(toDate, i);
    const resolved = resolveDay(dateKeyToDate(candidate), overrideByDate.get(candidate));
    if (!isOccupied(resolved.sourceDayOfWeek, exerciseCountByDay)) {
      restDate = candidate;
      break;
    }
  }
  if (!restDate) {
    return {
      error: `Nie znaleziono wolnego dnia w najbliższych ${SHIFT_SEARCH_HORIZON_DAYS} dniach.`,
    };
  }

  // Chronologiczna lista dat od toDate do znalezionego dnia REST (włącznie).
  const dates: string[] = [];
  for (let cursor = toDate; cursor !== restDate; cursor = addDays(cursor, 1)) {
    dates.push(cursor);
  }
  dates.push(restDate);

  const toOverride = overrideByDate.get(toDate) ?? undefined;
  const originalDayOfWeek = dates.map((dateKey, i) =>
    i === 0
      ? resolveDay(dateKeyToDate(dateKey), toOverride).sourceDayOfWeek
      : resolveDay(dateKeyToDate(dateKey), overrideByDate.get(dateKey)).sourceDayOfWeek
  );

  // Każda data (poza pierwszą, czyli toDate) przejmuje oryginalną
  // zawartość poprzedniej — czyli wszystko przesuwa się o jeden dzień.
  for (let i = dates.length - 1; i >= 1; i -= 1) {
    const error = await writeSlot(
      supabase,
      planId,
      user.id,
      dates[i]!,
      originalDayOfWeek[i - 1]!
    );
    if (error) return { error };
  }

  const fromDayOfWeek = await resolveEffectiveDayOfWeek(supabase, planId, fromDate);
  const toError = await writeSlot(supabase, planId, user.id, toDate, fromDayOfWeek);
  if (toError) return { error: toError };

  const fromError = await writeSlot(supabase, planId, user.id, fromDate, null);
  if (fromError) return { error: fromError };

  revalidateSchedule(planId);
  return {};
}

export async function toggleRestDay(
  planId: string,
  date: string
): Promise<ScheduleState> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const exerciseCountByDay = await getExerciseCountByDay(supabase, planId);
  const currentDayOfWeek = await resolveEffectiveDayOfWeek(supabase, planId, date);
  const currentlyRest = !isOccupied(currentDayOfWeek, exerciseCountByDay);

  const nextDayOfWeek = currentlyRest
    ? resolveDay(dateKeyToDate(date), undefined).sourceDayOfWeek
    : null;

  const error = await writeSlot(supabase, planId, user.id, date, nextDayOfWeek);
  if (error) return { error };

  revalidateSchedule(planId);
  return {};
}

export async function markWorkoutCompleted(
  planId: string,
  date: string
): Promise<ScheduleState> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const dayOfWeek = await resolveEffectiveDayOfWeek(supabase, planId, date);
  const error = await writeSlot(supabase, planId, user.id, date, dayOfWeek, "completed");
  if (error) return { error };

  revalidateSchedule(planId);
  return {};
}
