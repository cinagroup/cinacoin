"use client";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "users", name: "User Management", icon: "👥" },
  { id: "permissions", name: "Permissions", icon: "🔐" },
  { id: "2fa", name: "Two-Factor Auth", icon: "🛡️" },
  { id: "audit", name: "Audit Log", icon: "📋" },
  { id: "config", name: "System Config", icon: "⚙️" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-lg border-b border-gray-700">
        <h2 className="text-heading-3 text-white flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          CinaCoin
        </h2>
        <p className="text-caption text-gray-400 mt-1">Backend Admin Panel</p>
      </div>

      <nav className="flex-1 p-md space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium transition-colors ${
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="p-md border-t border-gray-700">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
            S
          </div>
          <div>
            <p className="text-body-sm font-medium text-white">Super Admin</p>
            <p className="text-caption text-gray-400">root@cinacoin.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
