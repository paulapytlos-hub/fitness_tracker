import Link from "next/link";
import { Trophy } from "lucide-react";
import { ProgressLineChart } from "@/components/progress/ProgressLineChart";
import { dateKeyToDate, formatLongDate } from "@/lib/schedule";
import { formatNumber } from "@/lib/sessions";
import type { ExerciseProgress } from "@/lib/progress";

function formatValue(value: number, metric: "kg" | "reps") {
  return metric === "kg" ? `${formatNumber(value)} kg` : `${formatNumber(value)} powt.`;
}

export function ExerciseProgressCard({
  progress,
  showTitle = true,
}: {
  progress: ExerciseProgress;
  showTitle?: boolean;
}) {
  const { points, metric, best } = progress;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const change = last.value - first.value;

  return (
    <section className="paper-shadow rounded-xl border border-line bg-card p-5">
      {showTitle && <h3 className="text-lg font-medium">{progress.name}</h3>}
      <p className="mt-0.5 text-sm text-muted-foreground">
        {metric === "kg" ? "Najcięższa seria" : "Najwięcej powtórzeń w serii"} na trening ·{" "}
        {points.length} {points.length === 1 ? "trening" : "treningów"}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-xs text-muted-foreground">Ostatnio</dt>
          <dd className="mt-0.5 text-xl font-medium">{formatValue(last.value, metric)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="size-3 text-primary" /> Rekord
          </dt>
          <dd className="mt-0.5 text-xl font-medium">{formatValue(best, metric)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Od początku</dt>
          <dd className="mt-0.5 text-xl font-medium">
            {points.length < 2
              ? "–"
              : `${change > 0 ? "+" : change < 0 ? "−" : ""}${formatValue(Math.abs(change), metric)}`}
          </dd>
        </div>
      </dl>

      {points.length >= 2 ? (
        <div className="mt-5">
          <ProgressLineChart
            label={progress.name}
            unit={metric === "kg" ? "kg" : "powt."}
            points={points.map((p) => ({
              key: p.sessionId,
              dateKey: p.dateKey,
              value: p.value,
              detail: [
                metric === "kg" && p.reps !== null ? `× ${p.reps} powt.` : null,
                `${p.setCount} ${p.setCount === 1 ? "seria" : "serii"}`,
              ]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Wykres pojawi się po drugim treningu z tym ćwiczeniem.
        </p>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Pokaż wszystkie treningi</summary>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {[...points].reverse().map((point) => (
            <li key={point.sessionId}>
              <Link
                href={`/history/${point.sessionId}`}
                className="flex justify-between gap-3 py-2 hover:text-primary"
              >
                <span>{formatLongDate(dateKeyToDate(point.dateKey))}</span>
                <span className="text-muted-foreground">
                  {formatValue(point.value, metric)}
                  {metric === "kg" && point.reps !== null ? ` × ${point.reps}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
