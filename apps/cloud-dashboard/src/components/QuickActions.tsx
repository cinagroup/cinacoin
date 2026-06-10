"use client";

const actions = [
  {
    name: "Create VM",
    description: "Launch a new virtual machine",
    icon: "🖥️",
  },
  {
    name: "Create Database",
    description: "Provision a new database",
    icon: "🗄️",
  },
  {
    name: "Upload Files",
    description: "Upload to object storage",
    icon: "📤",
  },
  {
    name: "Deploy App",
    description: "Deploy from container image",
    icon: "🚀",
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
          <span className="text-[24px]">{action.icon}</span>
          <h3 className="text-body-sm font-semibold text-ink mt-2">{action.name}</h3>
          <p className="text-caption text-body mt-1">{action.description}</p>
        </button>
      ))}
    </div>
  );
}
