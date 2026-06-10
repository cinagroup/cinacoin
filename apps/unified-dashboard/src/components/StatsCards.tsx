"use client";

const stats = [
  {
    title: "Total Users",
    value: "128,430",
    change: "+12.5%",
    positive: true,
    icon: "👥",
  },
  {
    title: "API Calls (24h)",
    value: "2,847,392",
    change: "+8.2%",
    positive: true,
    icon: "🔌",
  },
  {
    title: "Transactions",
    value: "45,892",
    change: "+23.1%",
    positive: true,
    icon: "💰",
  },
  {
    title: "Avg Response Time",
    value: "142ms",
    change: "-5.3%",
    positive: true,
    icon: "⚡",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.title} className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-label">{stat.title}</p>
            <span className="text-display-md">{stat.icon}</span>
          </div>
          <p className="stat-value">{stat.value}</p>
          <div className="flex items-center mt-2">
            <span
              className={`text-body-sm font-medium ${
                stat.positive ? "text-link" : "text-error"
              }`}
            >
              {stat.change}
            </span>
            <span className="text-body-sm text-mute ml-2">vs last week</span>
          </div>
        </div>
      ))}
    </div>
  );
}
