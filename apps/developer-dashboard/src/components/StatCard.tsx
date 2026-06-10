interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold text-ink">{value}</div>
        <div className="text-sm text-ink-mute mt-0.5">{label}</div>
      </div>
    </div>
  );
}
