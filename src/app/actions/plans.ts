"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, assertOwnsPlan, type TypedClient } from "@/lib/supabase/ownership";

export type PlanState = {
  error?: string;
  message?: string;
};

export type ExerciseState = {
  error?: string;
  message?: string;
};

export type DayNameState = {
  error?: string;
  message?: string;
};

async function getOwnedExercise(
  supabase: TypedClient,
  exerciseId: string,
  userId: string
) {
  const { data } = await supabase
    .from("exercises")
    .select("id, plan_id, day_of_week, workout_plans!inner(user_id)")
    .eq("id", exerciseId)
    .eq("workout_plans.user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, plan_id: data.plan_id, day_of_week: data.day_of_week };
}

async function touchPlan(supabase: TypedClient, planId: string) {
  await supabase
    .from("workout_plans")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", planId);
}

function revalidatePlanPaths(planId: string) {
  revalidatePath("/workouts");
  revalidatePath(`/workouts/${planId}/edit`);
}

// --- Plans ---

export async function createPlan(
  _prevState: PlanState,
  formData: FormData
): Promise<PlanState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Nazwa planu jest wymagana." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: plan, error } = await supabase
    .from("workout_plans")
    .insert({ user_id: user.id, name, description })
    .select("id")
    .single();

  if (error || !plan) {
    return { error: error?.message ?? "Nie udało się utworzyć planu." };
  }

  revalidatePath("/workouts");
  redirect(`/workouts/${plan.id}/edit`);
}

export async function updatePlan(
  planId: string,
  _prevState: PlanState,
  formData: FormData
): Promise<PlanState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Nazwa planu jest wymagana." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const { error } = await supabase
    .from("workout_plans")
    .update({ name, description })
    .eq("id", planId);

  if (error) {
    return { error: error.message };
  }

  revalidatePlanPaths(planId);
  return { message: "Zapisano zmiany." };
}

export async function deletePlan(planId: string) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    redirect("/workouts");
  }

  await supabase.from("workout_plans").delete().eq("id", planId);

  revalidatePath("/workouts");
  redirect("/workouts");
}

export async function setDayName(
  planId: string,
  dayOfWeek: number,
  _prevState: DayNameState,
  formData: FormData
): Promise<DayNameState> {
  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { error: "Nazwa dnia jest wymagana." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const { error } = await supabase
    .from("plan_days")
    .upsert(
      { plan_id: planId, day_of_week: dayOfWeek, name },
      { onConflict: "plan_id,day_of_week" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePlanPaths(planId);
  return { message: "Zapisano nazwę dnia." };
}

// --- Exercises ---

type ExerciseFields = {
  name: string;
  day_of_week: number;
  sets: number | null;
  rep_range: string | null;
  target_weight: number | null;
  target_rpe: number | null;
  notes: string | null;
};

type ParsedExerciseFields =
  | { ok: true; fields: ExerciseFields }
  | { ok: false; error: string };

function parseExerciseFields(formData: FormData): ParsedExerciseFields {
  const name = (formData.get("name") as string)?.trim();
  if (!name) {
    return { ok: false, error: "Nazwa ćwiczenia jest wymagana." };
  }

  const dayRaw = (formData.get("day_of_week") as string)?.trim();
  const dayOfWeek = parseInt(dayRaw, 10);
  if (Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { ok: false, error: "Wybierz dzień tygodnia." };
  }

  const setsRaw = (formData.get("sets") as string)?.trim();
  let sets: number | null = null;
  if (setsRaw) {
    sets = parseInt(setsRaw, 10);
    if (Number.isNaN(sets) || sets < 1) {
      return { ok: false, error: "Liczba serii musi być liczbą całkowitą co najmniej 1." };
    }
  }

  const repRange = (formData.get("rep_range") as string)?.trim() || null;

  const weightRaw = (formData.get("target_weight") as string)?.trim();
  let targetWeight: number | null = null;
  if (weightRaw) {
    targetWeight = parseFloat(weightRaw);
    if (Number.isNaN(targetWeight) || targetWeight < 0) {
      return { ok: false, error: "Nieprawidłowy ciężar." };
    }
  }

  const rpeRaw = (formData.get("target_rpe") as string)?.trim();
  let targetRpe: number | null = null;
  if (rpeRaw) {
    targetRpe = parseFloat(rpeRaw);
    if (Number.isNaN(targetRpe) || targetRpe < 0 || targetRpe > 10) {
      return { ok: false, error: "RPE musi być w zakresie 0–10." };
    }
  }

  const notes = (formData.get("notes") as string)?.trim() || null;

  return {
    ok: true,
    fields: {
      name,
      day_of_week: dayOfWeek,
      sets,
      rep_range: repRange,
      target_weight: targetWeight,
      target_rpe: targetRpe,
      notes,
    },
  };
}

export async function createExercise(
  planId: string,
  _prevState: ExerciseState,
  formData: FormData
): Promise<ExerciseState> {
  const parsed = parseExerciseFields(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const { data: lastExercise } = await supabase
    .from("exercises")
    .select("position")
    .eq("plan_id", planId)
    .eq("day_of_week", parsed.fields.day_of_week)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (lastExercise?.position ?? -1) + 1;

  const { error } = await supabase.from("exercises").insert({
    ...parsed.fields,
    plan_id: planId,
    position: nextPosition,
  });

  if (error) {
    return { error: error.message };
  }

  await touchPlan(supabase, planId);
  revalidatePlanPaths(planId);
  return { message: "Dodano ćwiczenie." };
}

export async function updateExercise(
  exerciseId: string,
  _prevState: ExerciseState,
  formData: FormData
): Promise<ExerciseState> {
  const parsed = parseExerciseFields(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const owned = await getOwnedExercise(supabase, exerciseId, user.id);
  if (!owned) {
    return { error: "Nie znaleziono ćwiczenia." };
  }

  const { error } = await supabase
    .from("exercises")
    .update(parsed.fields)
    .eq("id", exerciseId);

  if (error) {
    return { error: error.message };
  }

  await touchPlan(supabase, owned.plan_id);
  revalidatePlanPaths(owned.plan_id);
  return { message: "Zapisano." };
}

export async function deleteExercise(exerciseId: string) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const owned = await getOwnedExercise(supabase, exerciseId, user.id);
  if (!owned) return;

  await supabase.from("exercises").delete().eq("id", exerciseId);

  await touchPlan(supabase, owned.plan_id);
  revalidatePlanPaths(owned.plan_id);
}

export async function reorderExercise(
  exerciseId: string,
  direction: "up" | "down"
) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const owned = await getOwnedExercise(supabase, exerciseId, user.id);
  if (!owned) return;

  let siblingsQuery = supabase
    .from("exercises")
    .select("id, position")
    .eq("plan_id", owned.plan_id);
  siblingsQuery =
    owned.day_of_week === null
      ? siblingsQuery.is("day_of_week", null)
      : siblingsQuery.eq("day_of_week", owned.day_of_week);

  const { data: siblings } = await siblingsQuery
    .order("position", { ascending: true })
    .order("id", { ascending: true });

  if (!siblings) return;

  const index = siblings.findIndex((row) => row.id === exerciseId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= siblings.length) {
    return;
  }

  const current = siblings[index];
  const target = siblings[targetIndex];

  await supabase
    .from("exercises")
    .update({ position: target.position })
    .eq("id", current.id);
  await supabase
    .from("exercises")
    .update({ position: current.position })
    .eq("id", target.id);

  revalidatePlanPaths(owned.plan_id);
}
