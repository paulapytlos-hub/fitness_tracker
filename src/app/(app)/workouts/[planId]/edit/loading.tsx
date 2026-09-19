export default function EditPlanLoading() {
  return (
    <div className="max-w-2xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div className="h-8 w-64 animate-pulse rounded-md bg-secondary" />
      <div className="h-32 animate-pulse rounded-md bg-secondary" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-md bg-secondary"
          />
        ))}
      </div>
    </div>
  );
}
