import { deletePlan } from "@/app/actions/plans";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";

export function DeletePlanButton({ planId }: { planId: string }) {
  const action = deletePlan.bind(null, planId);

  return (
    <form action={action}>
      <ConfirmSubmitButton
        confirmMessage="Usunąć ten plan wraz ze wszystkimi ćwiczeniami? Tej operacji nie można cofnąć."
        className="w-full rounded-md border border-line px-4 py-2 text-sm text-destructive hover:bg-destructive/5 sm:w-auto"
      >
        Usuń plan
      </ConfirmSubmitButton>
    </form>
  );
}
