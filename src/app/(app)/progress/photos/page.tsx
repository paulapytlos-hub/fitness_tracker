import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { buttonVariants } from "@/components/ui/Button";
import {
  PHOTO_TYPES,
  PHOTO_LABELS,
  formatWeekLabel,
  getSignedPhotoUrls,
  type PhotoType,
} from "@/lib/reports";

export default async function ProgressPhotosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("id, week_start, progress_photos!inner(photo_type, storage_path, created_at)")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false });

  const weeks = reports ?? [];
  const urls = await getSignedPhotoUrls(
    supabase,
    weeks.flatMap((r) => r.progress_photos.map((p) => p.storage_path))
  );

  return (
    <Page
      eyebrow="Progress"
      title="Zdjęcia progresowe"
      description="Tydzień po tygodniu — widoczne tylko dla Ciebie."
      action={
        <Link
          href="/progress"
          aria-label="Wróć do Progress"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft />
        </Link>
      }
    >
      {weeks.length === 0 ? (
        <div className="border-y border-line py-12 text-center">
          <p className="font-medium">Brak zdjęć</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Zdjęcia dodajesz w raporcie tygodniowym.
          </p>
          <Link href="/weekly-report" className={buttonVariants({ className: "mt-5" })}>
            Otwórz raport tygodniowy
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {weeks.map((report) => {
            const byType: Partial<Record<PhotoType, string>> = {};
            for (const photo of [...report.progress_photos].sort((a, b) =>
              a.created_at.localeCompare(b.created_at)
            )) {
              const url = urls.get(photo.storage_path);
              if (url) byType[photo.photo_type as PhotoType] = url;
            }
            return (
              <section key={report.id} className="py-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium">{formatWeekLabel(report.week_start)}</h2>
                  <Link
                    href={`/weekly-report?week=${report.week_start}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    <Pencil /> Edytuj
                  </Link>
                </div>
                <div className="mt-3 grid max-w-xl grid-cols-3 gap-3">
                  {PHOTO_TYPES.map((type) => (
                    <figure key={type}>
                      <div className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-xl border border-line bg-card text-sm text-muted-foreground">
                        {byType[type] ? (
                          <a href={byType[type]} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element -- podpisany URL ze Storage */}
                            <img
                              src={byType[type]}
                              alt={`${PHOTO_LABELS[type]}, ${formatWeekLabel(report.week_start)}`}
                              className="absolute inset-0 size-full object-cover"
                            />
                          </a>
                        ) : (
                          "–"
                        )}
                      </div>
                      <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                        {PHOTO_LABELS[type]}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Page>
  );
}
