import Link from "next/link";

const projects = [
  {
    id: "proj-1",
    name: "Cinacoin Wallet",
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
  {
    id: "proj-4",
    name: "Cross-chain Bridge",
    status: "active" as const,
    network: "Mainnet",
    requests: 156_780,
    createdAt: "2025-09-01",
  },
  {
    id: "proj-5",
    name: "DAO Governance",
    status: "inactive" as const,
    network: "Testnet",
    requests: 3_100,
    createdAt: "2025-11-20",
  },
];

function StatusBadge({ status }: { status: "active" | "paused" | "inactive" }) {
  const map = {
    active: "badge-success",
    paused: "badge-warning",
    inactive: "badge-neutral",
  };
  return (
    <span className={`badge ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-semibold text-ink">Projects</h1>
          <p className="text-ink-body mt-1">Manage your Cinacoin projects</p>
        </div>
        <Link href="/projects/new" className="cc-btn-primary">
          + New Project
        </Link>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Network</th>
              <th>Requests</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-canvas-soft transition-colors">
                <td className="font-medium text-ink">{project.name}</td>
                <td>
                  <StatusBadge status={project.status} />
                </td>
                <td className="text-ink-body">{project.network}</td>
                <td className="text-ink-body">{project.requests.toLocaleString()}</td>
                <td className="text-ink-mute">{project.createdAt}</td>
                <td>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-link hover:text-link-hover text-body-sm font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
