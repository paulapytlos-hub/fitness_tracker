"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Wypełnij wszystkie pola." };
  }
  if (password.length < 8) {
    return { error: "Hasło musi mieć co najmniej 8 znaków." };
  }
  if (password !== confirmPassword) {
    return { error: "Hasła nie są takie same." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { error: error.message };
  }

  // Jeśli w projekcie Supabase włączone jest potwierdzanie e-maila,
  // signUp nie zwraca aktywnej sesji — użytkownik musi kliknąć link.
  if (!data.session) {
    return {
      message: "Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację.",
    };
  }

  redirect("/dashboard");
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Podaj e-mail i hasło." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error: "Konto nie jest potwierdzone. Kliknij link w mailu z rejestracji.",
      };
    }
    return { error: "Nieprawidłowy e-mail lub hasło." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Podaj e-mail." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Limit wysyłki maili to jedyny błąd, który warto pokazać. Pozostałych
  // nie zdradzamy, żeby nie dało się sprawdzić, czy dany e-mail ma konto.
  if (error?.status === 429) {
    return { error: "Za dużo prób. Spróbuj ponownie za kilka minut." };
  }

  return {
    message:
      "Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła.",
  };
}

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Wypełnij oba pola." };
  }
  if (password.length < 8) {
    return { error: "Hasło musi mieć co najmniej 8 znaków." };
  }
  if (password !== confirmPassword) {
    return { error: "Hasła nie są takie same." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.code === "same_password") {
      return { error: "Nowe hasło musi być inne niż poprzednie." };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}
