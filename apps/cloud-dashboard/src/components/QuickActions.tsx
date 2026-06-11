"use client";

import { Monitor, Database, Upload, Rocket } from "lucide-react";

const actions = [
  {
    name: "Create VM",
    description: "Launch a new virtual machine",
    icon: Monitor,
  },
  {
    name: "Create Database",
    description: "Provision a new database",
    icon: Database,
  },
  {
    name: "Upload Files",
    description: "Upload to object storage",
    icon: Upload,
  },
  {
    name: "Deploy App",
    description: "Deploy from container image",
    icon: Rocket,
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          className="resource-card text-left hover:shadow-level-3 transition-shadow duration-fast"
        >
          <action.icon className="w-6 h-6 text-ink mb-2" />
          <h3 className="text-body-sm font-semibold text-ink mt-2">{action.name}</h3>
          <p className="text-caption text-body mt-1">{action.description}</p>
        </button>
      ))}
    </div>
  );
}
