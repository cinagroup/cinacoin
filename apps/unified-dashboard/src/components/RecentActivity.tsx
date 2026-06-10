"use client";

const activities = [
  {
    action: "New user registered",
    user: "john@example.com",
    time: "2 min ago",
    icon: "👤",
  },
  {
    action: "API key generated",
    user: "dev-team@company.com",
    time: "15 min ago",
    icon: "🔑",
  },
  {
    action: "Transaction completed",
    user: "wallet_0x8f3a...c2d1",
    time: "23 min ago",
    icon: "✅",
  },
  {
    action: "Rate limit triggered",
    user: "api-client-42",
    time: "45 min ago",
    icon: "⚠️",
  },
  {
    action: "System config updated",
    user: "admin@cinacoin.com",
    time: "1h ago",
    icon: "⚙️",
  },
  {
    action: "New deployment",
    user: "ci-pipeline",
    time: "2h ago",
    icon: "🚀",
  },
];

export function RecentActivity() {
  return (
    <div className="cc-card">
      <h3 className="text-body-md font-semibold text-ink mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-3 text-3xl" aria-hidden="true">📋</div>
            <h3 className="text-body-md font-semibold text-ink">No recent activity</h3>
            <p className="text-caption text-mute mt-1">Activity will appear here as events occur.</p>
          </div>
        ) : activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-3 py-2 border-b border-hairline last:border-0"
          >
            <span className="text-body-lg mt-1">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-ink">
                {activity.action}
              </p>
              <p className="text-caption text-mute truncate">{activity.user}</p>
            </div>
            <span className="text-caption text-mute whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
