import Link from "next/link";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { Folder, BarChart3, Activity, Key, BarChart2, Settings } from "lucide-react";

// Mock data for static export
const stats = {
  projects: 12,
  totalRequests: 1_284_392,
  activeProjects: 8,
};

const recentProjects = [
  {
    id: "proj-1",
    name: "CinaCoin Wallet",
    status: "active" as const,
    network: "Mainnet",
    requests: 842_301,
    createdAt: "2025-03-15",
  },
  {
    id: "proj-2",
    name: "DeFi Analytics",
    status: "active" as const,
    network: "Mainnet",
    requests: 312_455,
    createdAt: "2025-05-22",
  },
  {
    id: "proj-3",
    name: "NFT Marketplace",
    status: "paused" as const,
    network: "Testnet",
    requests: 45_200,
    createdAt: "2025-08-10",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <p className="font-mono text-xs text-ink-mute mb-2">DASHBOARD</p>
        <h1 className="text-display-md font-semibold text-ink">Welcome back, developer.</h1>
        <p className="text-body text-ink-body mt-1">
          Here&apos;s an overview of your CinaCoin projects and usage.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Projects" value={stats.projects.toString()} icon={Folder} />
        <StatCard label="Total Requests" value={stats.totalRequests.toLocaleString()} icon={BarChart3} />
        <StatCard label="Active Projects" value={stats.activeProjects.toString()} icon={Activity} />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-body-lg font-semibold text-ink">Recent projects.</h2>
          <Link href="/projects/new" className="cc-btn-primary">
            + New Project
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="cc-card">
        <h3 className="text-body-sm font-semibold text-ink mb-3">Quick links.</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/api-keys" className="cc-btn-secondary">
            <Key className="w-4 h-4 mr-2" />
            Manage API Keys
          </Link>
          <Link href="/analytics" className="cc-btn-secondary">
            <BarChart2 className="w-4 h-4 mr-2" />
            View Analytics
          </Link>
          <Link href="/projects/new" className="cc-btn-secondary">
            <Folder className="w-4 h-4 mr-2" />
            Create Project
          </Link>
          <Link href="/settings" className="cc-btn-secondary">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
