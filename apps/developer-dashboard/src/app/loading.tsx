export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-[var(--cc-canvas-soft-2)] rounded" />
      <div className="h-4 w-96 bg-[var(--cc-canvas-soft-2)] rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc-card h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc-card h-40" />
        ))}
      </div>
    </div>
  );
}
