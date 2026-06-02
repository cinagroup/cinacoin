interface UsageDataPoint {
  date: string;
  requests: number;
  errors: number;
}

export function UsageChart({ data }: { data: UsageDataPoint[] }) {
  const maxRequests = Math.max(...data.map((d) => d.requests), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        {data.map((point) => {
          const height = maxRequests > 0 ? (point.requests / maxRequests) * 100 : 0;
          return (
            <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="relative flex w-full flex-col items-center justify-end"
                style={{ height: "160px" }}
              >
                <div
                  className="w-full rounded-t-sm bg-primary-600 transition-all hover:bg-primary-500"
                  style={{ height: `${height}%` }}
                  title={`${point.requests} requests, ${point.errors} errors`}
                />
              </div>
              <span className="text-xs text-slate-500">{point.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-primary-600" />
          <span>Requests</span>
        </div>
      </div>
    </div>
  );
}
