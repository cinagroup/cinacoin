import Link from "next/link";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { Folder, BarChart3, Activity, Key, BarChart2, Settings } from "lucide-react";

// Mock data for static export
const stats = {
  projects: 12,
  totalRequests: 1_284_392,
  activeProjects: 8,
  avgLatency: '142ms',
  p99Latency: '380ms',
  errorRate: '0.03%',
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
        <h1 className="text-display-md font-semibold text-[var(--cc-ink)]">Dashboard.</h1>
        <p className="text-body text-ink-body mt-1">
          3 projects active · last request 4s ago.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Projects" value={stats.projects.toString()} icon={Folder} />
        <StatCard label="Requests (30d)" value={stats.totalRequests.toLocaleString()} icon={BarChart3} />
        <StatCard label="Active" value={stats.activeProjects.toString()} icon={Activity} />
        <StatCard label="Avg Latency" value={stats.avgLatency} icon={Activity} />
        <StatCard label="p99 Latency" value={stats.p99Latency} icon={Activity} />
        <StatCard label="Error Rate" value={stats.errorRate} icon={Activity} />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-body-lg font-semibold text-[var(--cc-ink)]">Projects</h2>
          <Link href="/projects/new" className="cc-btn-primary">
            New project
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
        <h3 className="text-body-sm font-semibold text-[var(--cc-ink)] mb-3">SDK &amp; resources</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/api-keys" className="cc-btn-secondary">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </Link>
          <Link href="/analytics" className="cc-btn-secondary">
            <BarChart2 className="w-4 h-4 mr-2" />
            Analytics
          </Link>
          <a href="https://docs.cinacoin.com" target="_blank" rel="noopener noreferrer" className="cc-btn-secondary">
            Docs ↗
          </a>
          <Link href="/settings" className="cc-btn-secondary">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-4 text-body-sm text-[var(--cc-muted)]">
          <span>SDK v2.4.1</span>
          <span>·</span>
          <span>Node.js ≥18.17</span>
          <span>·</span>
          <span>API v3</span>
        </div>
      </div>
    </div>
  );
}
