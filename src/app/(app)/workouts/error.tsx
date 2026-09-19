"use client";

export default function WorkoutsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md space-y-4 px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold">Coś poszło nie tak</h1>
      <p className="text-sm text-muted-foreground">
        Nie udało się załadować planów treningowych. Spróbuj ponownie.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md border border-line px-4 py-2 text-sm"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
