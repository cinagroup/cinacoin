export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-[var(--cc-canvas-soft-2)] rounded" />
        <div className="h-10 w-28 bg-[var(--cc-canvas-soft-2)] rounded-sm" />
      </div>
      <div className="table-container">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 border-b border-[var(--cc-hairline)]" />
        ))}
      </div>
    </div>
  );
}
