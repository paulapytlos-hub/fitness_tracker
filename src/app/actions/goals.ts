"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/ownership";

export type GoalState = {
  error?: string;
  ok?: boolean;
};

const GOAL_TYPES = ["exercise_weight", "workout_count", "custom"] as const;
type GoalType = (typeof GOAL_TYPES)[number];

function parsePositive(value: FormDataEntryValue | null): number | null | "invalid" {
  const raw = (value as string | null)?.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return "invalid";
  return parsed;
}

export async function createGoal(_prev: GoalState, formData: FormData): Promise<GoalState> {
  const goalType = formData.get("goalType") as GoalType;
  if (!GOAL_TYPES.includes(goalType)) {
    return { error: "Wybierz rodzaj celu." };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const deadlineRaw = (formData.get("deadline") as string | null) ?? "";
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw) ? deadlineRaw : null;
  const target = parsePositive(formData.get("target"));

  if (!name) {
    return {
      error: goalType === "exercise_weight" ? "Podaj nazwę ćwiczenia." : "Podaj nazwę celu.",
    };
  }
  if (target === "invalid") {
    return { error: "Cel musi być liczbą większą od zera." };
  }
  if (goalType !== "custom" && target === null) {
    return {
      error: goalType === "exercise_weight" ? "Podaj docelowy ciężar." : "Podaj liczbę treningów.",
    };
  }
  if (goalType === "workout_count" && target !== null && !Number.isInteger(target)) {
    return { error: "Liczba treningów musi być liczbą całkowitą." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    goal_type: goalType,
    name,
    description,
    target_value: target,
    deadline,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/goals");
  return { ok: true };
}

/** Ręczna aktualizacja postępu — tylko dla celów "custom". */
export async function updateGoalProgress(goalId: string, value: number): Promise<GoalState> {
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Nieprawidłowa wartość." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: goal } = await supabase
    .from("goals")
    .select("id, goal_type, target_value")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!goal || goal.goal_type !== "custom") {
    return { error: "Nie znaleziono celu." };
  }

  const reached = goal.target_value !== null && value >= goal.target_value;
  const { error } = await supabase
    .from("goals")
    .update({ current_value: value, ...(reached ? { completed: true } : {}) })
    .eq("id", goalId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/goals");
  return { ok: true };
}

export async function setGoalCompleted(goalId: string, completed: boolean): Promise<GoalState> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { error, count } = await supabase
    .from("goals")
    .update({ completed }, { count: "exact" })
    .eq("id", goalId)
    .eq("user_id", user.id);
  if (error) {
    return { error: error.message };
  }
  if (!count) {
    return { error: "Nie znaleziono celu." };
  }

  revalidatePath("/goals");
  return { ok: true };
}

export async function deleteGoal(goalId: string): Promise<GoalState> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("user_id", user.id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/goals");
  return { ok: true };
}
