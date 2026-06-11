export default function Loading() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
