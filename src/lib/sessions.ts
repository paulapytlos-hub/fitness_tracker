import { dateKeyToDate, formatLongDate } from "@/lib/schedule";

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10).replace(".", ",");
}

/** "3 × 8–10 · 40 kg · RPE 8" — cel z planu skopiowany do sesji. */
export function formatTarget(target: {
  target_sets: number | null;
  target_rep_range: string | null;
  target_weight: number | null;
  target_rpe: number | null;
}): string {
  const parts: string[] = [];
  if (target.target_sets && target.target_rep_range) {
    parts.push(`${target.target_sets} × ${target.target_rep_range}`);
  } else if (target.target_sets) {
    parts.push(`${target.target_sets} serie`);
  } else if (target.target_rep_range) {
    parts.push(`${target.target_rep_range} powt.`);
  }
  if (target.target_weight !== null) parts.push(`${formatNumber(target.target_weight)} kg`);
  if (target.target_rpe !== null) parts.push(`RPE ${formatNumber(target.target_rpe)}`);
  return parts.join(" · ");
}

/** "10 × 40 kg · RPE 8" — jedna wykonana seria. */
export function formatSet(set: {
  reps: number | null;
  weight: number | null;
  rpe: number | null;
}): string {
  const main =
    set.weight !== null && set.weight > 0
      ? `${set.reps ?? "–"} × ${formatNumber(set.weight)} kg`
      : `${set.reps ?? "–"} powt.`;
  return set.rpe !== null ? `${main} · RPE ${formatNumber(set.rpe)}` : main;
}

export function sessionDate(session: {
  scheduled_date: string | null;
  started_at: string;
}): Date {
  return session.scheduled_date
    ? dateKeyToDate(session.scheduled_date)
    : new Date(session.started_at);
}

export function formatSessionDate(session: {
  scheduled_date: string | null;
  started_at: string;
}): string {
  return formatLongDate(sessionDate(session));
}

export function formatDuration(startedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null;
  const minutes = Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000
  );
  if (minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** Suma ciężar × powtórzenia ze wszystkich serii. */
export function totalVolume(sets: { reps: number | null; weight: number | null }[]): number {
  return sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0);
}
