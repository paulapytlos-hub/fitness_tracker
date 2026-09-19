"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthState } from "@/app/actions/auth";
import { FormField } from "@/components/ui/FormField";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Log in</h1>

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
          autoComplete="current-password"
          required
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Logowanie…" : "Zaloguj się"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <Link href="/register" className="underline">
            Zarejestruj się
          </Link>
        </p>
      </form>
    </div>
  );
}
