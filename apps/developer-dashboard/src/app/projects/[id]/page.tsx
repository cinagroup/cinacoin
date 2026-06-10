import Link from "next/link";
import StatCard from "@/components/StatCard";

// Mock project detail
const project = {
  id: "proj-1",
  name: "Cinacoin Wallet",
  description: "Official Cinacoin wallet application with multi-chain support",
  status: "active",
  network: "Mainnet",
  sdkVersion: "v2.4.1",
  createdAt: "2025-03-15",
  projectId: "cc_proj_a1b2c3d4e5",
};

const apiKeys = [
  {
    id: "key-1",
    name: "Production Key",
    prefix: "cc_live_sk1_...a8f2",
    permissions: "admin",
    lastUsed: "2026-06-09",
    createdAt: "2025-03-15",
  },
  {
    id: "key-2",
    name: "Staging Key",
    prefix: "cc_test_sk1_...b3e1",
    permissions: "write",
    lastUsed: "2026-06-08",
    createdAt: "2025-06-20",
  },
];

export default function ProjectDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-link hover:text-link-hover">
          ← Back to Projects
        </Link>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink">{project.name}</h1>
            <span className="badge badge-success">Active</span>
          </div>
          <p className="text-ink-body mt-1">{project.description}</p>
          <div className="flex gap-4 mt-2 text-sm text-ink-mute">
            <span>Project ID: <code className="text-ink font-mono text-xs">{project.projectId}</code></span>
            <span>Network: {project.network}</span>
            <span>SDK: {project.sdkVersion}</span>
          </div>
        </div>
        <button className="btn-secondary">⚙️ Edit Project</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value="842,301" icon="📊" />
        <StatCard label="Avg Latency" value="42ms" icon="⚡" />
        <StatCard label="Error Rate" value="0.12%" icon="⚠️" />
        <StatCard label="API Keys" value="2" icon="🔑" />
      </div>

      {/* API Keys */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">API Keys</h2>
          <button className="btn-primary">+ Generate Key</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Permissions</th>
                <th>Last Used</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-canvas-soft transition-colors">
                  <td className="font-medium text-ink">{key.name}</td>
                  <td className="font-mono text-xs text-ink-body">{key.prefix}</td>
                  <td>
                    <span className="badge badge-neutral">
                      {key.permissions.charAt(0).toUpperCase() + key.permissions.slice(1)}
                    </span>
                  </td>
                  <td className="text-ink-mute">{key.lastUsed}</td>
                  <td className="text-ink-mute">{key.createdAt}</td>
                  <td>
                    <button className="text-danger text-sm font-medium hover:underline">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Chart Placeholder */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ink mb-4">Usage (Last 30 Days)</h2>
        <div className="h-48 flex items-center justify-center bg-canvas-soft rounded-lg border border-dashed border-hairline-dark">
          <p className="text-ink-mute text-sm">📈 Chart loads with client-side recharts</p>
        </div>
      </div>
    </div>
  );
}
