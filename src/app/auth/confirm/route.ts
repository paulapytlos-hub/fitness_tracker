import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tu trafia link z maila Supabase. Obsługujemy oba formaty:
// - ?code=...                  (domyślny szablon maila, flow PKCE)
// - ?token_hash=...&type=...   (własny szablon maila w Supabase)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  // Tylko ścieżki wewnątrz aplikacji — bez przekierowań na obce domeny.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  }

  if (ok) {
    return NextResponse.redirect(new URL(safeNext, origin));
  }

  return NextResponse.redirect(new URL("/forgot-password?error=link", origin));
}
