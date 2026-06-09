"use client";

/**
 * Projects management page.
 */
export default function ProjectsPage() {
  const projects = [
    { name: "wallet-explorer", description: "Multi-chain wallet and transaction explorer", status: "active", members: 5, lastDeploy: "2 hours ago" },
    { name: "analytics-service", description: "Real-time analytics and reporting platform", status: "active", members: 3, lastDeploy: "10 min ago" },
    { name: "payment-gateway", description: "Crypto payment processing integration", status: "active", members: 4, lastDeploy: "1 day ago" },
    { name: "nft-marketplace", description: "NFT minting and trading platform", status: "paused", members: 2, lastDeploy: "1 week ago" },
    { name: "defi-aggregator", description: "DeFi yield aggregation dashboard", status: "active", members: 6, lastDeploy: "3 days ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Projects</h1>
          <p className="text-sm text-[var(--cc-muted)] mt-1">
            Manage your projects and configurations
          </p>
        </div>
        <button className="cc-btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </button>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.name} className="cc-card-hover p-5 cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas-soft2)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--cc-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <span
                className={`cc-badge ${
                  project.status === "active" ? "cc-badge-success" : "cc-badge-warning"
                }`}
              >
                {project.status}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--cc-ink)] mb-1">{project.name}</h3>
            <p className="text-xs text-[var(--cc-muted)] mb-4 line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between text-xs text-[var(--cc-muted)]">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {project.members} members
              </span>
              <span>Deployed {project.lastDeploy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
