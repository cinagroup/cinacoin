interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="cc-card">
      <div className="flex items-center justify-between">
        <span className="text-display-md">{icon}</span>
      </div>
      <div className="mt-3">
        <div className="text-display-md font-semibold text-ink">{value}</div>
        <div className="text-body-sm text-ink-mute mt-1">{label}</div>
      </div>
    </div>
  );
}
