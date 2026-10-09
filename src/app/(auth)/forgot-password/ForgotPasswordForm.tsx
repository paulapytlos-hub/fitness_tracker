"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "@/app/actions/auth";
import { FormField } from "@/components/ui/FormField";

const initialState: AuthState = {};

export function ForgotPasswordForm({ linkError }: { linkError: boolean }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Nie pamiętasz hasła?</h1>
        <p className="text-sm text-muted-foreground">
          Podaj e-mail konta, a wyślemy Ci link do ustawienia nowego hasła.
        </p>

        {linkError && !state.message && (
          <p className="text-sm text-destructive">
            Link wygasł albo jest nieprawidłowy. Wyślij nowy.
          </p>
        )}

        <FormField
          label="E-mail"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.message && (
          <p className="text-sm text-success">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Wysyłanie…" : "Wyślij link"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Wróć do logowania
          </Link>
        </p>
      </form>
    </div>
  );
}
