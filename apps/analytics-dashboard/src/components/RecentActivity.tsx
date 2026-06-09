"use client";

const activities = [
  {
    id: 1,
    type: "user_signup",
    message: "New user registered from San Francisco, US",
    time: "2 minutes ago",
    icon: "👤",
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: 2,
    type: "api_spike",
    message: "API call spike detected: /api/v2/transactions (+340%)",
    time: "8 minutes ago",
    icon: "📈",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: 3,
    type: "error",
    message: "Error rate increased in EU-West region (0.8% → 1.2%)",
    time: "15 minutes ago",
    icon: "⚠️",
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: 4,
    type: "deployment",
    message: "Analytics engine v2.4.1 deployed successfully",
    time: "32 minutes ago",
    icon: "🚀",
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: 5,
    type: "milestone",
    message: "Monthly active users exceeded 125,000 milestone",
    time: "1 hour ago",
    icon: "🎯",
    color: "bg-pink-50 text-pink-600",
  },
  {
    id: 6,
    type: "security",
    message: "SSL certificate renewed for api.cinacoin.com",
    time: "2 hours ago",
    icon: "🔒",
    color: "bg-slate-50 text-slate-600",
  },
  {
    id: 7,
    type: "user_signup",
    message: "Batch import: 1,200 users from partner integration",
    time: "3 hours ago",
    icon: "👥",
    color: "bg-indigo-50 text-indigo-600",
  },
];

export default function RecentActivity() {
  return (
    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${activity.color}`}
          >
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 leading-snug">{activity.message}</p>
            <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
