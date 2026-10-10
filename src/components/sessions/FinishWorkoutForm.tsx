"use client";

import { useActionState, useTransition } from "react";
import { Check } from "lucide-react";
import { finishWorkout, discardWorkout, type SessionState } from "@/app/actions/sessions";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { buttonVariants } from "@/components/ui/Button";

const initialState: SessionState = {};

export function FinishWorkoutForm({
  sessionId,
  loggedSetCount,
}: {
  sessionId: string;
  loggedSetCount: number;
}) {
  const [state, formAction, pending] = useActionState(
    finishWorkout.bind(null, sessionId),
    initialState
  );
  const [isDiscarding, startDiscard] = useTransition();

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          loggedSetCount === 0 &&
          !confirm("Nie ma jeszcze żadnej zapisanej serii. Zakończyć trening mimo to?")
        ) {
          event.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <FormTextarea
        label="Notatka do treningu (opcjonalnie)"
        id="notes"
        name="notes"
        placeholder="Jak poszło? Coś bolało, coś było łatwiejsze niż zwykle?"
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={isDiscarding || pending}
          onClick={() => {
            if (!confirm("Usunąć ten trening razem z zapisanymi seriami?")) return;
            startDiscard(async () => {
              const result = await discardWorkout(sessionId);
              if (result?.error) alert(result.error);
            });
          }}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {isDiscarding ? "Usuwanie…" : "Porzuć trening"}
        </button>
        <button
          type="submit"
          disabled={pending || isDiscarding}
          className={buttonVariants({ size: "lg" })}
        >
          <Check /> {pending ? "Zapisywanie…" : "Zakończ trening"}
        </button>
      </div>
    </form>
  );
}
