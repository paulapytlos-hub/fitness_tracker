"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/ownership";
import { PHOTO_BUCKET, PHOTO_TYPES, MOODS, type PhotoType } from "@/lib/reports";

export type ReportState = {
  error?: string;
  reportId?: string;
};

function parseMeasurement(value: FormDataEntryValue | null): number | null | "invalid" {
  const raw = (value as string | null)?.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 1000) return "invalid";
  return Math.round(parsed * 100) / 100;
}

function revalidateReports() {
  revalidatePath("/progress");
  revalidatePath("/progress/photos");
  revalidatePath("/weekly-report");
  revalidatePath("/dashboard");
}

/** Zapis (albo poprawka) raportu na dany tydzień — jeden raport na tydzień. */
export async function saveWeeklyReport(formData: FormData): Promise<ReportState> {
  const weekStart = (formData.get("weekStart") as string | null) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return { error: "Nieprawidłowy tydzień." };
  }

  const weight = parseMeasurement(formData.get("weight"));
  const waist = parseMeasurement(formData.get("waist"));
  const hips = parseMeasurement(formData.get("hips"));
  const thigh = parseMeasurement(formData.get("thigh"));
  if ([weight, waist, hips, thigh].includes("invalid")) {
    return { error: "Wpisz poprawne liczby w pomiarach." };
  }

  const moodRaw = (formData.get("mood") as string | null) ?? "";
  const mood = (MOODS as readonly string[]).includes(moodRaw) ? moodRaw : null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data, error } = await supabase
    .from("weekly_reports")
    .upsert(
      {
        user_id: user.id,
        week_start: weekStart,
        weight: weight as number | null,
        waist: waist as number | null,
        hips: hips as number | null,
        thigh: thigh as number | null,
        mood,
        notes,
      },
      { onConflict: "user_id,week_start" }
    )
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Nie udało się zapisać raportu." };
  }

  revalidateReports();
  return { reportId: data.id };
}

/**
 * Plik wysyła przeglądarka prosto do Storage (zdjęcia z telefonu są za duże
 * na server action). Tu tylko rejestrujemy go w bazie — po sprawdzeniu, że
 * raport i ścieżka należą do zalogowanej osoby. Poprzednie zdjęcie tego
 * samego typu w tym raporcie jest usuwane.
 */
export async function registerProgressPhoto(
  reportId: string,
  photoType: PhotoType,
  storagePath: string
): Promise<ReportState> {
  if (!PHOTO_TYPES.includes(photoType)) {
    return { error: "Nieprawidłowy typ zdjęcia." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!storagePath.startsWith(`${user.id}/${reportId}/`)) {
    return { error: "Nieprawidłowa ścieżka zdjęcia." };
  }

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!report) {
    return { error: "Nie znaleziono raportu." };
  }

  const { data: previous } = await supabase
    .from("progress_photos")
    .select("id, storage_path")
    .eq("weekly_report_id", reportId)
    .eq("photo_type", photoType);

  const { error } = await supabase.from("progress_photos").insert({
    user_id: user.id,
    weekly_report_id: reportId,
    photo_type: photoType,
    storage_path: storagePath,
  });
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    return { error: error.message };
  }

  if (previous && previous.length > 0) {
    await supabase.storage.from(PHOTO_BUCKET).remove(previous.map((p) => p.storage_path));
    await supabase
      .from("progress_photos")
      .delete()
      .in(
        "id",
        previous.map((p) => p.id)
      );
  }

  revalidateReports();
  return {};
}

export async function deleteProgressPhoto(photoId: string): Promise<ReportState> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: photo } = await supabase
    .from("progress_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!photo) {
    return { error: "Nie znaleziono zdjęcia." };
  }

  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("progress_photos").delete().eq("id", photoId);
  if (error) {
    return { error: error.message };
  }

  revalidateReports();
  return {};
}
