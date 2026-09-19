"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/app/actions/auth";
import { FormField } from "@/components/ui/FormField";

const initialState: AuthState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Rejestracja</h1>

        <FormField
          label="Imię"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
        />
        <FormField
          label="E-mail"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <FormField
          label="Hasło"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FormField
          label="Powtórz hasło"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
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
          {pending ? "Tworzenie konta…" : "Zarejestruj się"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <Link href="/login" className="underline">
            Zaloguj się
          </Link>
        </p>
      </form>
    </div>
  );
}
