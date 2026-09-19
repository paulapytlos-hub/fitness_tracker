export default function WorkoutsLoading() {
  return (
    <div className="space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-md bg-secondary"
          />
        ))}
      </div>
    </div>
  );
}
