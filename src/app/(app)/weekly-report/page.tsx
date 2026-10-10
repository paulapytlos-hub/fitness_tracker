import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { buttonVariants } from "@/components/ui/Button";
import { WeeklyReportForm } from "@/components/reports/WeeklyReportForm";
import { addDays } from "@/lib/schedule";
import {
  currentWeekStartKey,
  toWeekStartKey,
  formatWeekLabel,
  getSignedPhotoUrls,
  type PhotoType,
} from "@/lib/reports";

export default async function WeeklyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const currentWeek = currentWeekStartKey();
  const requested = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? toWeekStartKey(week) : currentWeek;
  const weekStart = requested > currentWeek ? currentWeek : requested;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("id, weight, waist, hips, thigh, mood, notes, progress_photos(id, photo_type, storage_path, created_at)")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  const photoRows = report?.progress_photos ?? [];
  const urls = await getSignedPhotoUrls(
    supabase,
    photoRows.map((p) => p.storage_path)
  );
  const photos: Partial<Record<PhotoType, { id: string; url: string | null }>> = {};
  for (const row of [...photoRows].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    photos[row.photo_type as PhotoType] = { id: row.id, url: urls.get(row.storage_path) ?? null };
  }

  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  return (
    <Page
      eyebrow="Weekly check-in"
      title="Jak minął Twój tydzień?"
      description="Chwila, żeby zauważyć, jak się czujesz — nie tylko liczby."
    >
      <div className="mb-8 flex items-center gap-2">
        <Link
          href={`/weekly-report?week=${prevWeek}`}
          aria-label="Poprzedni tydzień"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ChevronLeft />
        </Link>
        <p className="min-w-44 text-center text-sm font-medium">
          {formatWeekLabel(weekStart)}
          {weekStart === currentWeek && (
            <span className="ml-2 text-xs font-normal text-primary">ten tydzień</span>
          )}
        </p>
        {weekStart < currentWeek ? (
          <Link
            href={`/weekly-report?week=${nextWeek}`}
            aria-label="Następny tydzień"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ChevronRight />
          </Link>
        ) : (
          <span className="size-9" />
        )}
      </div>

      <WeeklyReportForm
        key={weekStart}
        userId={user.id}
        weekStart={weekStart}
        report={report}
        photos={photos}
      />
    </Page>
  );
}
