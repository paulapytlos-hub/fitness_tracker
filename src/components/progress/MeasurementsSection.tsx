import Link from "next/link";
import { TrendingUp, Camera } from "lucide-react";
import { ProgressLineChart } from "@/components/progress/ProgressLineChart";
import { buttonVariants } from "@/components/ui/Button";
import { formatNumber } from "@/lib/sessions";
import { MEASUREMENTS, PHOTO_TYPES, PHOTO_LABELS, formatWeekLabel, type PhotoType } from "@/lib/reports";

export type ReportRow = {
  id: string;
  week_start: string;
  weight: number | null;
  waist: number | null;
  hips: number | null;
  thigh: number | null;
  mood: string | null;
};

function formatChange(change: number, unit: string) {
  if (change === 0) return "bez zmian";
  return `${change > 0 ? "+" : "−"}${formatNumber(Math.abs(change))} ${unit} od poprzedniego`;
}

export function MeasurementsSection({
  reports,
  latestPhotos,
  latestPhotosWeek,
}: {
  /** Rosnąco po week_start. */
  reports: ReportRow[];
  latestPhotos: Partial<Record<PhotoType, string>>;
  latestPhotosWeek: string | null;
}) {
  const series = MEASUREMENTS.map((m) => ({
    ...m,
    points: reports
      .filter((r) => r[m.key] !== null)
      .map((r) => ({ key: r.id, dateKey: r.week_start, value: r[m.key] as number })),
  }));

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <TrendingUp className="size-4 text-primary" />
          Pomiary ciała
        </h2>
        <Link href="/weekly-report" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Raport tygodniowy
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="mt-4 border-y border-line py-10 text-center">
          <p className="font-medium">Brak pomiarów</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Raz w tygodniu wpisz wagę i obwody (i jeśli chcesz, dodaj zdjęcia) — tutaj
            zobaczysz, jak się zmieniają.
          </p>
          <Link href="/weekly-report" className={buttonVariants({ className: "mt-5" })}>
            Dodaj pierwszy raport
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 border-y border-line sm:grid-cols-4">
            {series.map((m) => {
              const last = m.points[m.points.length - 1];
              const prev = m.points[m.points.length - 2];
              return (
                <div key={m.key} className="py-5">
                  <dt className="text-xs text-muted-foreground">{m.label}</dt>
                  <dd className="mt-1 text-2xl font-medium">
                    {last ? (
                      <>
                        {formatNumber(last.value)}{" "}
                        <span className="text-base text-muted-foreground">{m.unit}</span>
                      </>
                    ) : (
                      "–"
                    )}
                  </dd>
                  {last && prev && (
                    <p className="mt-1 text-xs text-primary">
                      {formatChange(Math.round((last.value - prev.value) * 100) / 100, m.unit)}
                    </p>
                  )}
                </div>
              );
            })}
          </dl>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {series
              .filter((m) => m.points.length >= 2)
              .map((m) => (
                <div key={m.key} className="paper-shadow rounded-xl border border-line bg-card p-5">
                  <h3 className="font-medium">{m.label}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {m.points.length} pomiarów, co tydzień
                  </p>
                  <ProgressLineChart
                    label={m.label}
                    unit={m.unit}
                    points={m.points.map((p) => ({
                      ...p,
                      detail: `tydzień ${formatWeekLabel(p.dateKey)}`,
                    }))}
                  />
                </div>
              ))}
          </div>
        </>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-medium">
            <Camera className="size-4 text-primary" />
            Zdjęcia progresowe
            {latestPhotosWeek && (
              <span className="text-sm font-normal text-muted-foreground">
                · {formatWeekLabel(latestPhotosWeek)}
              </span>
            )}
          </h3>
          {latestPhotosWeek && (
            <Link href="/progress/photos" className="text-sm text-primary underline">
              Wszystkie zdjęcia
            </Link>
          )}
        </div>
        <div className="mt-4 grid max-w-md grid-cols-3 gap-3">
          {PHOTO_TYPES.map((type) => {
            const url = latestPhotos[type];
            return (
              <div
                key={type}
                className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-xl border border-dashed border-primary/40 bg-card text-sm text-muted-foreground"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- podpisany URL ze Storage
                  <img src={url} alt={PHOTO_LABELS[type]} className="absolute inset-0 size-full object-cover" />
                ) : (
                  PHOTO_LABELS[type]
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
