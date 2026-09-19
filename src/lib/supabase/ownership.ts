import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type TypedClient = SupabaseClient<Database>;

export async function requireUser(supabase: TypedClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function assertOwnsPlan(
  supabase: TypedClient,
  planId: string,
  userId: string
) {
  const { data } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}
