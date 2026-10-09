"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/actions/auth";
import { FormField } from "@/components/ui/FormField";

const initialState: AuthState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Ustaw nowe hasło</h1>

        <FormField
          label="Nowe hasło"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FormField
          label="Powtórz nowe hasło"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Zapisywanie…" : "Zapisz hasło"}
        </button>
      </form>
    </div>
  );
}
