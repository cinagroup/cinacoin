interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-[24px]">{icon}</span>
      </div>
      <div className="mt-3">
        <div className="text-[24px] font-semibold text-ink">{value}</div>
        <div className="text-[14px] text-ink-mute mt-0.5">{label}</div>
      </div>
    </div>
  );
}
