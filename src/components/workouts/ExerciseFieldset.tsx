import { FormField } from "@/components/ui/FormField";
import { FormTextarea } from "@/components/ui/FormTextarea";
import type { Tables } from "@/lib/supabase/database.types";

type ExerciseFieldsetProps = {
  idPrefix: string;
  defaults?: Pick<
    Tables<"exercises">,
    "name" | "sets" | "rep_range" | "target_weight" | "target_rpe" | "notes"
  >;
};

export function ExerciseFieldset({ idPrefix, defaults }: ExerciseFieldsetProps) {
  return (
    <div className="space-y-3">
      <FormField
        label="Nazwa ćwiczenia"
        id={`${idPrefix}-name`}
        name="name"
        type="text"
        defaultValue={defaults?.name}
        required
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FormField
          label="Serie"
          id={`${idPrefix}-sets`}
          name="sets"
          type="number"
          inputMode="numeric"
          step={1}
          min={1}
          defaultValue={defaults?.sets ?? undefined}
        />
        <FormField
          label="Powtórzenia"
          id={`${idPrefix}-rep_range`}
          name="rep_range"
          type="text"
          placeholder="np. 8-12"
          defaultValue={defaults?.rep_range ?? undefined}
        />
        <FormField
          label="Ciężar (kg)"
          id={`${idPrefix}-target_weight`}
          name="target_weight"
          type="number"
          inputMode="decimal"
          step={0.01}
          min={0}
          defaultValue={defaults?.target_weight ?? undefined}
        />
        <FormField
          label="RPE"
          id={`${idPrefix}-target_rpe`}
          name="target_rpe"
          type="number"
          inputMode="decimal"
          step={0.5}
          min={0}
          max={10}
          defaultValue={defaults?.target_rpe ?? undefined}
        />
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Notatka (opcjonalnie)
        </summary>
        <div className="mt-2">
          <FormTextarea
            label="Notatka"
            id={`${idPrefix}-notes`}
            name="notes"
            defaultValue={defaults?.notes ?? undefined}
          />
        </div>
      </details>
    </div>
  );
}
