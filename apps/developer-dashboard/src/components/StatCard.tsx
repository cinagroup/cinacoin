import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export default function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <article className="cc-card">
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 text-ink-mute" aria-hidden="true" />
      </div>
      <div className="mt-3">
        <div className="text-display-md font-semibold text-[var(--cc-ink)]">{value}</div>
        <div className="text-body-sm text-ink-mute mt-1">{label}</div>
      </div>
    </article>
  );
}
