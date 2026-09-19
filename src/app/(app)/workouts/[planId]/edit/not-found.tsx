import Link from "next/link";

export default function PlanNotFound() {
  return (
    <div className="max-w-md space-y-4 px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold">Nie znaleziono planu</h1>
      <p className="text-sm text-muted-foreground">
        Nie znaleziono planu lub nie masz do niego dostępu.
      </p>
      <Link href="/workouts" className="text-sm underline">
        Wróć do listy planów
      </Link>
    </div>
  );
}
