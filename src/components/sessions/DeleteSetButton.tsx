"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteSet } from "@/app/actions/sessions";
import { buttonVariants } from "@/components/ui/Button";

export function DeleteSetButton({ setId }: { setId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Usuń serię"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteSet(setId);
          if (result.error) alert(result.error);
        })
      }
      className={buttonVariants({ variant: "ghost", size: "icon", className: "size-7" })}
    >
      <X />
    </button>
  );
}
