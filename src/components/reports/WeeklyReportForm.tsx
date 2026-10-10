"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveWeeklyReport, registerProgressPhoto, deleteProgressPhoto } from "@/app/actions/reports";
import {
  PHOTO_BUCKET,
  PHOTO_TYPES,
  PHOTO_LABELS,
  MOODS,
  MEASUREMENTS,
  type PhotoType,
} from "@/lib/reports";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ExistingReport = {
  weight: number | null;
  waist: number | null;
  hips: number | null;
  thigh: number | null;
  mood: string | null;
  notes: string | null;
};

type ExistingPhoto = { id: string; url: string | null };

const MAX_SIDE = 1600;

/** Zmniejsza zdjęcie z telefonu do max 1600 px (JPEG) przed wysłaniem. */
async function resizeImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    return blob ?? file;
  } catch {
    // Format, którego przeglądarka nie umie narysować — wysyłamy oryginał.
    return file;
  }
}

function formatInitial(value: number | null) {
  return value === null ? "" : String(value).replace(".", ",");
}

export function WeeklyReportForm({
  userId,
  weekStart,
  report,
  photos,
}: {
  userId: string;
  weekStart: string;
  report: ExistingReport | null;
  photos: Partial<Record<PhotoType, ExistingPhoto>>;
}) {
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(report?.mood ?? null);
  const [files, setFiles] = useState<Partial<Record<PhotoType, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<PhotoType, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pickFile(type: PhotoType, file: File | undefined) {
    if (!file) return;
    setSaved(false);
    setFiles((prev) => ({ ...prev, [type]: file }));
    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
  }

  function clearPicked(type: PhotoType) {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  }

  function removeExisting(photoId: string) {
    if (!confirm("Usunąć to zdjęcie?")) return;
    startTransition(async () => {
      const result = await deleteProgressPhoto(photoId);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    formData.set("weekStart", weekStart);
    formData.set("mood", mood ?? "");

    startTransition(async () => {
      setStatus("Zapisywanie raportu…");
      const result = await saveWeeklyReport(formData);
      if (result.error || !result.reportId) {
        setError(result.error ?? "Nie udało się zapisać raportu.");
        setStatus(null);
        return;
      }

      const supabase = createClient();
      const entries = Object.entries(files) as [PhotoType, File][];
      for (const [index, [type, file]] of entries.entries()) {
        setStatus(`Wysyłanie zdjęć (${index + 1}/${entries.length})…`);
        const blob = await resizeImage(file);
        const path = `${userId}/${result.reportId}/${type}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (uploadError) {
          setError(`Zdjęcie „${PHOTO_LABELS[type]}” nie zostało wysłane: ${uploadError.message}`);
          setStatus(null);
          router.refresh();
          return;
        }
        const registered = await registerProgressPhoto(result.reportId, type, path);
        if (registered.error) {
          setError(registered.error);
          setStatus(null);
          router.refresh();
          return;
        }
      }

      setFiles({});
      setPreviews({});
      setStatus(null);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-medium">Pomiary</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Wypełnij tylko to, co zmierzyłaś — reszta może zostać pusta.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {MEASUREMENTS.map((m) => (
              <label key={m.key} className="block text-sm font-medium">
                {m.label}
                <span className="relative mt-1 block">
                  <input
                    name={m.key}
                    inputMode="decimal"
                    defaultValue={formatInitial(report?.[m.key] ?? null)}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 pr-10 text-base font-normal focus:border-primary focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-normal text-muted-foreground">
                    {m.unit}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium">Notatka dla siebie</h2>
          <p className="mt-4 text-sm font-medium">Samopoczucie</p>
          <div className="mt-2 flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mood === m}
                onClick={() => setMood(mood === m ? null : m)}
                className={cn(
                  "grid size-11 place-items-center rounded-full border text-xl transition-colors",
                  mood === m
                    ? "border-primary bg-secondary"
                    : "border-line bg-card hover:border-primary/40"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <FormTextarea
              label="Notatki"
              id="notes"
              name="notes"
              rows={4}
              defaultValue={report?.notes ?? ""}
              placeholder="Jak minął tydzień? Sen, energia, dieta, cokolwiek."
            />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-medium">Zdjęcia progresowe</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Widoczne tylko dla Ciebie.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {PHOTO_TYPES.map((type) => {
              const preview = previews[type];
              const existing = photos[type];
              const shownUrl = preview ?? existing?.url ?? null;
              return (
                <div key={type} className="space-y-1.5">
                  <label
                    className={cn(
                      "relative grid aspect-[3/4] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-primary/40 bg-card text-center text-sm text-muted-foreground transition-colors hover:bg-secondary",
                      shownUrl && "border-solid"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => pickFile(type, e.target.files?.[0])}
                    />
                    {shownUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- podpisane URL-e ze Storage / blob: z przeglądarki
                      <img
                        src={shownUrl}
                        alt={PHOTO_LABELS[type]}
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <span className="grid justify-items-center gap-2">
                        <Camera className="size-5 text-primary" />
                        {PHOTO_LABELS[type]}
                      </span>
                    )}
                  </label>
                  {preview ? (
                    <button
                      type="button"
                      onClick={() => clearPicked(type)}
                      className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" /> Nie zmieniaj
                    </button>
                  ) : existing ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeExisting(existing.id)}
                      className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" /> Usuń
                    </button>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">{PHOTO_LABELS[type]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {status && <p className="text-sm text-muted-foreground">{status}</p>}

        <button
          type="submit"
          disabled={isPending}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          {saved ? (
            <>
              <Check /> Raport zapisany
            </>
          ) : isPending ? (
            "Zapisywanie…"
          ) : report ? (
            "Zapisz zmiany"
          ) : (
            "Zapisz raport"
          )}
        </button>
      </div>
    </form>
  );
}
