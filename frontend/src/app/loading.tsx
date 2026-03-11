export default function Loading() {
  return (
    <div className="container-page">
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-surface-muted rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="h-40 bg-surface-muted rounded-lg" />
              <div className="h-4 bg-surface-muted rounded w-3/4" />
              <div className="h-4 bg-surface-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
