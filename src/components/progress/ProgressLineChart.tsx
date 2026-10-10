"use client";

import { useEffect, useRef, useState } from "react";
import { dateKeyToDate } from "@/lib/schedule";
import { formatNumber } from "@/lib/sessions";
import type { ProgressPoint } from "@/lib/progress";

const HEIGHT = 160;
const PAD = { top: 12, right: 12, bottom: 24, left: 36 };

function shortDate(dateKey: string): string {
  const d = dateKeyToDate(dateKey);
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function niceTicks(min: number, max: number): number[] {
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep;
  const ticks: number[] = [];
  for (let t = Math.floor(min / step) * step; t <= max + step / 2; t += step) {
    ticks.push(Math.round(t * 100) / 100);
  }
  return ticks;
}

/**
 * Jedna seria (najlepszy wynik na trening) — kolor primary, bez legendy,
 * bo tytuł karty nazywa serię. Crosshair przyciąga się do najbliższego
 * treningu; strzałki działają z klawiatury.
 */
export function ProgressLineChart({
  points,
  unit,
}: {
  points: ProgressPoint[];
  unit: "kg" | "reps";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = rawMin === rawMax ? Math.max(1, rawMax * 0.1) : 0;
  const ticks = niceTicks(Math.max(0, rawMin - pad), rawMax + pad);
  const yMin = ticks[0]!;
  const yMax = ticks[ticks.length - 1]! === yMin ? yMin + 1 : ticks[ticks.length - 1]!;

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L${x(points.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`
      : "";

  function formatValue(v: number) {
    return unit === "kg" ? `${formatNumber(v)} kg` : `${formatNumber(v)} powt.`;
  }

  function nearestIndex(clientX: number) {
    const rect = containerRef.current!.getBoundingClientRect();
    const px = clientX - rect.left;
    let best = 0;
    for (let i = 1; i < points.length; i += 1) {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    }
    return best;
  }

  const activePoint = active !== null ? points[active] : null;

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Wykres: najlepszy wynik na trening, ${points.length} treningów`}
          tabIndex={0}
          className="block outline-none focus-visible:rounded-md focus-visible:ring-1 focus-visible:ring-ring"
          onPointerMove={(e) => setActive(nearestIndex(e.clientX))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(points.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? 0) - 1));
            if (e.key === "ArrowRight")
              setActive((i) => Math.min(points.length - 1, (i ?? points.length - 1) + 1));
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {formatNumber(t)}
              </text>
            </g>
          ))}

          <text
            x={x(0)}
            y={HEIGHT - 6}
            textAnchor={points.length === 1 ? "middle" : "start"}
            className="fill-muted-foreground text-[11px]"
          >
            {shortDate(points[0]!.dateKey)}
          </text>
          {points.length > 1 && (
            <text
              x={x(points.length - 1)}
              y={HEIGHT - 6}
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {shortDate(points[points.length - 1]!.dateKey)}
            </text>
          )}

          {areaPath && <path d={areaPath} fill="var(--color-primary)" fillOpacity={0.1} />}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {activePoint && (
            <line
              x1={x(active!)}
              x2={x(active!)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--color-muted-foreground)"
              strokeOpacity={0.4}
              strokeWidth={1}
            />
          )}

          {points.map((p, i) => (
            <circle
              key={p.sessionId}
              cx={x(i)}
              cy={y(p.value)}
              r={i === active ? 5 : 4}
              fill="var(--color-primary)"
              stroke="var(--color-card)"
              strokeWidth={2}
            />
          ))}
        </svg>
      )}

      {activePoint && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border border-line bg-card px-3 py-2 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(x(active!) - 70, 0), Math.max(0, width - 140)),
            width: 140,
          }}
        >
          <p className="text-muted-foreground">{shortDate(activePoint.dateKey)}</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {formatValue(activePoint.value)}
            {unit === "kg" && activePoint.reps !== null && (
              <span className="font-normal text-muted-foreground"> × {activePoint.reps}</span>
            )}
          </p>
          <p className="text-muted-foreground">
            {activePoint.setCount} {activePoint.setCount === 1 ? "seria" : "serii"}
          </p>
        </div>
      )}
    </div>
  );
}
