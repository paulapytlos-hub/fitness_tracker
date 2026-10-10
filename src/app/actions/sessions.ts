"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, assertOwnsPlan, type TypedClient } from "@/lib/supabase/ownership";
import { resolveDay, dateKeyToDate, toDateKey } from "@/lib/schedule";

export type SessionState = {
  error?: string;
};

function parseOptionalNumber(value: FormDataEntryValue | null): number | null | "invalid" {
  const raw = (value as string | null)?.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return "invalid";
  return parsed;
}

/**
 * Sesja + informacja, czy jeszcze trwa. Zwraca null, jeśli sesja nie
 * istnieje albo nie należy do zalogowanej osoby (RLS i tak by ją ukrył,
 * ale sprawdzamy jawnie, jak w reszcie akcji).
 */
async function getOwnSession(supabase: TypedClient, sessionId: string, userId: string) {
  const { data } = await supabase
    .from("workout_sessions")
    .select("id, plan_id, scheduled_date, completed_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

async function getOwnSessionExercise(
  supabase: TypedClient,
  sessionExerciseId: string,
  userId: string
) {
  const { data } = await supabase
    .from("session_exercises")
    .select("id, session_id, workout_sessions!inner(user_id, completed_at)")
    .eq("id", sessionExerciseId)
    .eq("workout_sessions.user_id", userId)
    .maybeSingle();
  return data;
}

/**
 * Start treningu dla konkretnej daty z kalendarza. Ćwiczenia z planu są
 * KOPIOWANE do session_exercises — późniejsza edycja planu nie zmienia
 * tego treningu. Jeśli na tę datę jest już sesja, otwieramy ją zamiast
 * tworzyć drugą.
 */
export async function startWorkout(planId: string, dateKey: string): Promise<SessionState> {
  if (dateKey > toDateKey(new Date())) {
    return { error: "Nie można rozpocząć treningu zaplanowanego na przyszłość." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!(await assertOwnsPlan(supabase, planId, user.id))) {
    return { error: "Nie znaleziono planu." };
  }

  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("user_id", user.id)
    .eq("plan_id", planId)
    .eq("scheduled_date", dateKey)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect(existing.completed_at ? `/history/${existing.id}` : `/session/${existing.id}`);
  }

  const { data: override } = await supabase
    .from("scheduled_workouts")
    .select("scheduled_date, source_day_of_week, status")
    .eq("plan_id", planId)
    .eq("scheduled_date", dateKey)
    .maybeSingle();
  const { sourceDayOfWeek } = resolveDay(dateKeyToDate(dateKey), override ?? undefined);

  if (sourceDayOfWeek === null) {
    return { error: "Ten dzień to REST — nie ma treningu do rozpoczęcia." };
  }

  const [{ data: exercises }, { data: planDay }] = await Promise.all([
    supabase
      .from("exercises")
      .select("id, name, position, sets, rep_range, target_weight, target_rpe, notes")
      .eq("plan_id", planId)
      .eq("day_of_week", sourceDayOfWeek)
      .order("position", { ascending: true }),
    supabase
      .from("plan_days")
      .select("name")
      .eq("plan_id", planId)
      .eq("day_of_week", sourceDayOfWeek)
      .maybeSingle(),
  ]);

  if (!exercises || exercises.length === 0) {
    return { error: "Ten dzień nie ma żadnych ćwiczeń." };
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      plan_id: planId,
      scheduled_date: dateKey,
      title: planDay?.name?.trim() || "Trening",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return { error: sessionError?.message ?? "Nie udało się rozpocząć treningu." };
  }

  const { error: snapshotError } = await supabase.from("session_exercises").insert(
    exercises.map((exercise, index) => ({
      session_id: session.id,
      source_exercise_id: exercise.id,
      name: exercise.name,
      position: index,
      target_sets: exercise.sets,
      target_rep_range: exercise.rep_range,
      target_weight: exercise.target_weight,
      target_rpe: exercise.target_rpe,
      notes: exercise.notes,
    }))
  );

  if (snapshotError) {
    // Bez ćwiczeń sesja jest bezużyteczna — sprzątamy, żeby nie wisiała pusta.
    await supabase.from("workout_sessions").delete().eq("id", session.id);
    return { error: snapshotError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect(`/session/${session.id}`);
}

export async function addSet(
  sessionExerciseId: string,
  _prevState: SessionState,
  formData: FormData
): Promise<SessionState> {
  const reps = parseOptionalNumber(formData.get("reps"));
  const weight = parseOptionalNumber(formData.get("weight"));
  const rpe = parseOptionalNumber(formData.get("rpe"));

  if (reps === "invalid" || weight === "invalid" || rpe === "invalid") {
    return { error: "Wpisz poprawne liczby." };
  }
  if (reps === null) {
    return { error: "Podaj liczbę powtórzeń." };
  }
  if (!Number.isInteger(reps)) {
    return { error: "Powtórzenia muszą być liczbą całkowitą." };
  }
  if (rpe !== null && rpe > 10) {
    return { error: "RPE to skala 1–10." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  const sessionExercise = await getOwnSessionExercise(supabase, sessionExerciseId, user.id);
  if (!sessionExercise) {
    return { error: "Nie znaleziono ćwiczenia." };
  }
  if (sessionExercise.workout_sessions.completed_at) {
    return { error: "Ten trening jest już zakończony." };
  }

  const { data: lastSet } = await supabase
    .from("exercise_sets")
    .select("set_number")
    .eq("session_exercise_id", sessionExerciseId)
    .order("set_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("exercise_sets").insert({
    session_exercise_id: sessionExerciseId,
    set_number: (lastSet?.set_number ?? 0) + 1,
    reps,
    weight,
    rpe,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/session/${sessionExercise.session_id}`);
  return {};
}

export async function deleteSet(setId: string): Promise<SessionState> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: set } = await supabase
    .from("exercise_sets")
    .select("id, session_exercise_id")
    .eq("id", setId)
    .maybeSingle();
  if (!set) {
    return { error: "Nie znaleziono serii." };
  }

  const sessionExercise = await getOwnSessionExercise(supabase, set.session_exercise_id, user.id);
  if (!sessionExercise) {
    return { error: "Nie znaleziono serii." };
  }
  if (sessionExercise.workout_sessions.completed_at) {
    return { error: "Ten trening jest już zakończony." };
  }

  const { error } = await supabase.from("exercise_sets").delete().eq("id", setId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/session/${sessionExercise.session_id}`);
  return {};
}

export async function finishWorkout(
  sessionId: string,
  _prevState: SessionState,
  formData: FormData
): Promise<SessionState> {
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  const supabase = await createClient();
  const user = await requireUser(supabase);
  const session = await getOwnSession(supabase, sessionId, user.id);
  if (!session) {
    return { error: "Nie znaleziono treningu." };
  }
  if (session.completed_at) {
    redirect(`/history/${sessionId}`);
  }

  const { error } = await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString(), notes })
    .eq("id", sessionId);
  if (error) {
    return { error: error.message };
  }

  // Oznacz dzień w kalendarzu jako wykonany (to samo, co "Mark as done").
  if (session.plan_id && session.scheduled_date) {
    const { data: override } = await supabase
      .from("scheduled_workouts")
      .select("scheduled_date, source_day_of_week, status")
      .eq("plan_id", session.plan_id)
      .eq("scheduled_date", session.scheduled_date)
      .maybeSingle();
    const { sourceDayOfWeek } = resolveDay(
      dateKeyToDate(session.scheduled_date),
      override ?? undefined
    );
    await supabase.from("scheduled_workouts").upsert(
      {
        plan_id: session.plan_id,
        user_id: user.id,
        scheduled_date: session.scheduled_date,
        source_day_of_week: sourceDayOfWeek,
        status: "completed",
      },
      { onConflict: "plan_id,scheduled_date" }
    );
    revalidatePath(`/workouts/${session.plan_id}/edit`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect(`/history/${sessionId}`);
}

/** Porzucenie treningu w toku (np. kliknięty przez pomyłkę). Zakończonych nie usuwamy. */
export async function discardWorkout(sessionId: string): Promise<SessionState> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const session = await getOwnSession(supabase, sessionId, user.id);
  if (!session) {
    return { error: "Nie znaleziono treningu." };
  }
  if (session.completed_at) {
    return { error: "Zakończonego treningu nie można usunąć." };
  }

  const { error } = await supabase.from("workout_sessions").delete().eq("id", sessionId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect(session.plan_id ? `/workouts/${session.plan_id}/edit` : "/dashboard");
}
