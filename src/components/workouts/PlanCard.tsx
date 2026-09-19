import Link from "next/link";
import type { Tables } from "@/lib/supabase/database.types";

type PlanCardProps = {
  plan: Pick<Tables<"workout_plans">, "id" | "name" | "description" | "updated_at"> & {
    exerciseCount: number;
  };
};

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <Link
      href={`/workouts/${plan.id}/edit`}
      className="paper-shadow block rounded-xl border border-line bg-card p-4 transition-colors hover:border-primary/40"
    >
      <h2 className="text-lg font-semibold">{plan.name}</h2>
      {plan.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {plan.description}
        </p>
      )}
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>{plan.exerciseCount} ćwiczeń</span>
        <span>
          Aktualizacja: {new Date(plan.updated_at).toLocaleDateString("pl-PL")}
        </span>
      </div>
    </Link>
  );
}
