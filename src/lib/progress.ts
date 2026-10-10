import { toDateKey } from "@/lib/schedule";
import { sessionDate } from "@/lib/sessions";

type SetRow = { reps: number | null; weight: number | null };

export type CompletedSessionForProgress = {
  id: string;
  scheduled_date: string | null;
  started_at: string;
  session_exercises: { name: string; exercise_sets: SetRow[] }[];
};

export type ProgressPoint = {
  sessionId: string;
  dateKey: string;
  /** Najcięższa seria (kg) albo — dla ćwiczeń bez ciężaru — najwięcej powtórzeń. */
  value: number;
  reps: number | null;
  setCount: number;
};

export type ExerciseProgress = {
  name: string;
  /** "kg" gdy choć jedna seria miała ciężar; inaczej śledzimy powtórzenia. */
  metric: "kg" | "reps";
  points: ProgressPoint[];
  best: number;
};

export function exerciseKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Grupuje ćwiczenia po nazwie (nie po id z planu — sesje to kopie, a to
 * samo ćwiczenie może być w kilku dniach/planach). Zwraca od ostatnio
 * trenowanego.
 */
export function buildExerciseProgress(
  sessions: CompletedSessionForProgress[]
): ExerciseProgress[] {
  const ordered = [...sessions].sort(
    (a, b) => sessionDate(a).getTime() - sessionDate(b).getTime()
  );
  const byKey = new Map<string, { name: string; rows: { sessionId: string; dateKey: string; sets: SetRow[] }[] }>();

  for (const session of ordered) {
    const dateKey = toDateKey(sessionDate(session));
    for (const exercise of session.session_exercises) {
      const sets = exercise.exercise_sets.filter((set) => set.reps !== null || set.weight !== null);
      if (sets.length === 0) continue;
      const key = exerciseKey(exercise.name);
      const entry = byKey.get(key) ?? { name: exercise.name, rows: [] };
      entry.name = exercise.name; // najnowsza pisownia
      entry.rows.push({ sessionId: session.id, dateKey, sets });
      byKey.set(key, entry);
    }
  }

  const result: ExerciseProgress[] = [];
  for (const { name, rows } of byKey.values()) {
    const metric = rows.some((row) => row.sets.some((set) => (set.weight ?? 0) > 0))
      ? "kg"
      : "reps";
    const points = rows.map((row) => {
      const top =
        metric === "kg"
          ? row.sets.reduce((a, b) => ((b.weight ?? 0) > (a.weight ?? 0) ? b : a))
          : row.sets.reduce((a, b) => ((b.reps ?? 0) > (a.reps ?? 0) ? b : a));
      return {
        sessionId: row.sessionId,
        dateKey: row.dateKey,
        value: metric === "kg" ? top.weight ?? 0 : top.reps ?? 0,
        reps: top.reps,
        setCount: row.sets.length,
      };
    });
    result.push({
      name,
      metric,
      points,
      best: Math.max(...points.map((p) => p.value)),
    });
  }

  return result.sort(
    (a, b) =>
      (b.points[b.points.length - 1]?.dateKey ?? "").localeCompare(
        a.points[a.points.length - 1]?.dateKey ?? ""
      )
  );
}
