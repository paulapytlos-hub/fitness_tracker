"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { startWorkout } from "@/app/actions/sessions";
import { buttonVariants } from "@/components/ui/Button";

export function StartWorkoutButton({
  planId,
  dateKey,
  label = "Rozpocznij trening",
  size = "default",
  variant = "default",
  className,
}: {
  planId: string;
  dateKey: string;
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={className}>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await startWorkout(planId, dateKey);
            if (result?.error) setError(result.error);
          })
        }
        className={buttonVariants({ size, variant })}
      >
        {isPending ? "Otwieranie…" : label} <ArrowRight />
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
