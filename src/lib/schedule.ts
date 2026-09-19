import type { DayOfWeek } from "@/lib/days";
import type { Tables } from "@/lib/supabase/database.types";

export type ScheduledWorkoutRow = Pick<
  Tables<"scheduled_workouts">,
  "scheduled_date" | "source_day_of_week" | "status"
>;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateKeyToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(dateKey: string, days: number): string {
  const d = dateKeyToDate(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function jsDateToDayOfWeek(date: Date): DayOfWeek {
  const jsDay = date.getDay(); // 0 = Sunday .. 6 = Saturday
  return ((jsDay + 6) % 7) as DayOfWeek;
}

export function startOfWeek(date: Date): Date {
  const day = jsDateToDayOfWeek(date);
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day);
  return result;
}

export type ViewRange = "week" | "biweek" | "month";

const RANGE_LENGTH: Record<ViewRange, number> = {
  week: 7,
  biweek: 14,
  month: 30,
};

/**
 * Rolling window of consecutive dates (not aligned to calendar month
 * boundaries) — "month" here means "30 days", kept simple on purpose.
 * `offset` steps by one full range length at a time.
 */
export function getRangeDates(range: ViewRange, offset: number): Date[] {
  const length = RANGE_LENGTH[range];
  const start = startOfWeek(new Date());
  start.setDate(start.getDate() + offset * length);
  return Array.from({ length }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function isSameDateKey(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export type ResolvedDay = {
  sourceDayOfWeek: DayOfWeek | null; // null = rest
  status: "planned" | "completed";
  isOverride: boolean;
};

export function resolveDay(
  date: Date,
  override: ScheduledWorkoutRow | undefined
): ResolvedDay {
  if (override) {
    return {
      sourceDayOfWeek: override.source_day_of_week as DayOfWeek | null,
      status: override.status === "completed" ? "completed" : "planned",
      isOverride: true,
    };
  }
  return {
    sourceDayOfWeek: jsDateToDayOfWeek(date),
    status: "planned",
    isOverride: false,
  };
}

export function isMissed(resolved: ResolvedDay, date: Date): boolean {
  if (resolved.sourceDayOfWeek === null) return false;
  if (resolved.status === "completed") return false;
  return isPastDate(date);
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate.getTime() < today.getTime();
}

export function isPastDateKey(dateKey: string): boolean {
  return isPastDate(dateKeyToDate(dateKey));
}

const monthNames = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

export function formatLongDate(date: Date): string {
  const dayName = DAY_FULL_NAMES[jsDateToDayOfWeek(date)];
  return `${dayName}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

const DAY_FULL_NAMES = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

export function formatDateRangeLabel(dates: Date[]): string {
  const start = dates[0];
  const end = dates[dates.length - 1];
  if (!start || !end) return "";
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
}
