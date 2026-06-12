"use client";

import { Monitor, Database, Upload, Rocket } from "lucide-react";

const actions = [
  {
    name: "Create VM.",
    description: "Launch a new virtual machine.",
    icon: Monitor,
  },
  {
    name: "Create database.",
    description: "Provision a new database.",
    icon: Database,
  },
  {
    name: "Upload files.",
    description: "Upload to object storage.",
    icon: Upload,
  },
  {
    name: "Deploy app.",
    description: "Deploy from container image.",
    icon: Rocket,
  },
];

export default function QuickActions() {
  return (
    <div>
      <p className="cc-caption-mono text-[var(--cc-muted)] mb-2">ACTIONS</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button
            key={action.name}
            className="resource-card text-left hover:shadow-[var(--cc-level3)] transition-shadow"
          >
            <action.icon className="w-6 h-6 text-[var(--cc-ink)] mb-2" aria-hidden="true" />
            <h3 className="cc-body-sm-strong text-[var(--cc-ink)] mt-2">{action.name}</h3>
            <p className="cc-caption text-[var(--cc-body)] mt-1">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
