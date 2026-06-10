"use client";

const activities = [
  {
    id: 1,
    type: "user_signup",
    message: "New user registered from San Francisco, US",
    time: "2 minutes ago",
    icon: "👤",
    color: "bg-canvas-soft-2 text-ink",
  },
  {
    id: 2,
    type: "api_spike",
    message: "API call spike detected: /api/v2/transactions (+340%)",
    time: "8 minutes ago",
    icon: "📈",
    color: "bg-success-light text-success",
  },
  {
    id: 3,
    type: "error",
    message: "Error rate increased in EU-West region (0.8% → 1.2%)",
    time: "15 minutes ago",
    icon: "⚠️",
    color: "bg-warning-light text-warning",
  },
  {
    id: 4,
    type: "deployment",
    message: "Analytics engine v2.4.1 deployed successfully",
    time: "32 minutes ago",
    icon: "🚀",
    color: "bg-canvas-soft-2 text-ink",
  },
  {
    id: 5,
    type: "milestone",
    message: "Monthly active users exceeded 125,000 milestone",
    time: "1 hour ago",
    icon: "🎯",
    color: "bg-canvas-soft-2 text-ink",
  },
  {
    id: 6,
    type: "security",
    message: "SSL certificate renewed for api.cinacoin.com",
    time: "2 hours ago",
    icon: "🔒",
    color: "bg-canvas-soft-2 text-ink",
  },
  {
    id: 7,
    type: "user_signup",
    message: "Batch import: 1,200 users from partner integration",
    time: "3 hours ago",
    icon: "👥",
    color: "bg-canvas-soft-2 text-ink",
  },
];

export default function RecentActivity() {
  return (
    <div className="space-y-sm max-h-80 overflow-y-auto pr-xs">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="mb-3 text-3xl" aria-hidden="true">📋</div>
          <h3 className="text-body font-semibold text-ink">No recent activity</h3>
          <p className="text-body-sm text-ink-mute mt-1">Activity will appear here as events occur.</p>
        </div>
      ) : activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-sm p-sm rounded-md hover:bg-canvas-soft transition-colors"
        >
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center text-body-sm flex-shrink-0 ${activity.color}`}
          >
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body text-ink-body leading-snug">{activity.message}</p>
            <p className="text-body-sm text-ink-mute mt-xxs">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
