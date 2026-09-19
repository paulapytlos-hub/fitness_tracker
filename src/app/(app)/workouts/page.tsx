import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanCard } from "@/components/workouts/PlanCard";
import { Page } from "@/components/Page";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plans, error } = await supabase
    .from("workout_plans")
    .select("id, name, description, updated_at, exercises(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <Page
      eyebrow="Your plans"
      title="Workouts"
      description="Twoje plany treningowe — wybierz plan, żeby zobaczyć harmonogram tygodnia."
      action={
        <Link
          href="/workouts/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Nowy plan
        </Link>
      }
    >
      {error && (
        <p className="text-sm text-destructive">
          Nie udało się załadować planów. Spróbuj odświeżyć stronę.
        </p>
      )}

      {!error && plans && plans.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nie masz jeszcze żadnych planów treningowych. Utwórz pierwszy, żeby
          zacząć.
        </p>
      )}

      {!error && plans && plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={{
                id: plan.id,
                name: plan.name,
                description: plan.description,
                updated_at: plan.updated_at,
                exerciseCount: plan.exercises[0]?.count ?? 0,
              }}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
