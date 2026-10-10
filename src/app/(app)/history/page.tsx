import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, CalendarDays, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Page } from "@/components/Page";
import { buttonVariants } from "@/components/ui/Button";
import { DAYS_OF_WEEK } from "@/lib/days";
import { toDateKey, jsDateToDayOfWeek } from "@/lib/schedule";
import {
  sessionDate,
  formatSessionDate,
  formatDuration,
  formatNumber,
  totalVolume,
} from "@/lib/sessions";

const MONTH_NAMES = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

function parseMonth(value: string | undefined): { year: number; month: number } {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const month = Number(match[2]) - 1;
    if (month >= 0 && month <= 11) return { year: Number(match[1]), month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthParam(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const { year, month } = parseMonth(m);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(
      "id, title, scheduled_date, started_at, completed_at, session_exercises(exercise_sets(reps, weight))"
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(200);

  const all = sessions ?? [];
  const inProgress = all.filter((s) => !s.completed_at);
  const completed = all.filter((s) => s.completed_at);
  const activeDateKeys = new Set(completed.map((s) => toDateKey(sessionDate(s))));

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = jsDateToDayOfWeek(firstOfMonth);
  const todayKey = toDateKey(new Date());

  return (
    <Page
      eyebrow="Your rhythm"
      title="History"
      description="Zapis treningów, które już zrobiłaś."
    >
      {inProgress.map((session) => (
        <Link
          key={session.id}
          href={`/session/${session.id}`}
          className="workout-glow mb-8 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-surface p-5"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <Timer className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                W toku
              </p>
              <p className="font-medium">{session.title ?? "Trening"}</p>
              <p className="text-sm text-muted-foreground">{formatSessionDate(session)}</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-primary" />
        </Link>
      ))}

      <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
        <section>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {MONTH_NAMES[month]} {year}
            </p>
            <div className="flex gap-1">
              <Link
                href={`/history?m=${monthParam(year, month - 1)}`}
                aria-label="Poprzedni miesiąc"
                className={buttonVariants({ variant: "ghost", size: "icon", className: "size-7" })}
              >
                <ChevronLeft />
              </Link>
              <Link
                href={`/history?m=${monthParam(year, month + 1)}`}
                aria-label="Następny miesiąc"
                className={buttonVariants({ variant: "ghost", size: "icon", className: "size-7" })}
              >
                <ChevronRight />
              </Link>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day.value} className="py-1 text-muted-foreground">
                {day.short}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dateKey = toDateKey(new Date(year, month, i + 1));
              const active = activeDateKeys.has(dateKey);
              return (
                <span
                  key={dateKey}
                  className={[
                    "grid aspect-square place-items-center rounded-md text-sm",
                    active ? "bg-secondary font-medium text-primary" : "",
                    dateKey === todayKey ? "ring-1 ring-primary/40" : "",
                  ].join(" ")}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <CalendarDays className="size-4 text-primary" />
            Ostatnie treningi
          </h2>
          {completed.length === 0 ? (
            <div className="mt-4 border-y border-line py-12 text-center">
              <p className="font-medium">Jeszcze nic tu nie ma</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Rozpocznij trening z kalendarza albo z ekranu głównego — po
                zakończeniu pojawi się tutaj.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {completed.map((session) => {
                const sets = session.session_exercises.flatMap((ex) => ex.exercise_sets);
                const volume = totalVolume(sets);
                const stats = [
                  `${sets.length} ${sets.length === 1 ? "seria" : "serii"}`,
                  volume > 0 ? `${formatNumber(volume)} kg` : null,
                  formatDuration(session.started_at, session.completed_at),
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={session.id}>
                    <Link
                      href={`/history/${session.id}`}
                      className="flex items-center gap-4 py-4"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                        <Check className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{session.title ?? "Trening"}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatSessionDate(session)}
                        </p>
                      </div>
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        {stats}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}
