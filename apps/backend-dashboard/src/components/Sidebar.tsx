"use client";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onClose?: () => void;
}

const navItems = [
  { id: "users", name: "User Management", icon: "👥" },
  { id: "permissions", name: "Permissions", icon: "🔐" },
  { id: "2fa", name: "Two-Factor Auth", icon: "🛡️" },
  { id: "audit", name: "Audit Log", icon: "📋" },
  { id: "config", name: "System Config", icon: "⚙️" },
];

export function Sidebar({ activeTab = "users", onTabChange = () => {}, onClose }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-canvas border-r border-hairline flex flex-col">
      <div className="p-lg border-b border-hairline">
        <h2 className="text-heading-3 text-ink flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          CinaCoin
        </h2>
        <p className="text-caption text-mute mt-1">Backend Admin Panel</p>
      </div>

      <nav className="flex-1 p-md space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-body-sm font-medium transition-colors ${
              activeTab === item.id
                ? "bg-canvas-soft-2 text-ink"
                : "text-body hover:bg-canvas-soft-2 hover:text-ink"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="p-md border-t border-hairline">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-canvas-soft-2 flex items-center justify-center text-sm font-medium text-ink">
            S
          </div>
          <div>
            <p className="text-body-sm font-medium text-ink">Super Admin</p>
            <p className="text-caption text-mute">root@cinacoin.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
