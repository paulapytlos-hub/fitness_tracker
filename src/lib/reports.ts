import type { TypedClient } from "@/lib/supabase/ownership";
import { startOfWeek, toDateKey, dateKeyToDate, addDays } from "@/lib/schedule";

export const PHOTO_BUCKET = "progress-photos";

export const PHOTO_TYPES = ["front", "side", "back"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

export const PHOTO_LABELS: Record<PhotoType, string> = {
  front: "Przód",
  side: "Bok",
  back: "Tył",
};

// Muszą się zgadzać z CHECK w tabeli weekly_reports.
export const MOODS = ["😞", "😐", "🙂", "😄", "🔥"] as const;

export const MEASUREMENTS = [
  { key: "weight", label: "Waga", unit: "kg" },
  { key: "waist", label: "Talia", unit: "cm" },
  { key: "hips", label: "Biodra", unit: "cm" },
  { key: "thigh", label: "Udo", unit: "cm" },
] as const;
export type MeasurementKey = (typeof MEASUREMENTS)[number]["key"];

export function currentWeekStartKey(): string {
  return toDateKey(startOfWeek(new Date()));
}

/** Normalizuje dowolną datę YYYY-MM-DD do poniedziałku jej tygodnia. */
export function toWeekStartKey(dateKey: string): string {
  return toDateKey(startOfWeek(dateKeyToDate(dateKey)));
}

const MONTHS_GENITIVE = [
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

/** "6–12 października" */
export function formatWeekLabel(weekStartKey: string): string {
  const start = dateKeyToDate(weekStartKey);
  const end = dateKeyToDate(addDays(weekStartKey, 6));
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTHS_GENITIVE[start.getMonth()]} – ${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]}`;
}

/** Bucket jest prywatny — do wyświetlenia potrzebne są tymczasowe linki. */
export async function getSignedPhotoUrls(
  supabase: TypedClient,
  paths: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}
