"use client";

const resources = [
  {
    id: "vm-001",
    name: "web-server-prod-1",
    type: "Virtual Machine",
    region: "US-East-1",
    status: "running",
    cpu: "4 vCPU",
    memory: "8 GB",
    cost: "$124.50/mo",
  },
  {
    id: "vm-002",
    name: "api-server-prod-1",
    type: "Virtual Machine",
    region: "US-East-1",
    status: "running",
    cpu: "8 vCPU",
    memory: "16 GB",
    cost: "$248.00/mo",
  },
  {
    id: "db-001",
    name: "postgres-primary",
    type: "PostgreSQL",
    region: "US-East-1",
    status: "running",
    cpu: "4 vCPU",
    memory: "16 GB",
    cost: "$186.00/mo",
  },
  {
    id: "db-002",
    name: "redis-cache-01",
    type: "Redis",
    region: "US-East-1",
    status: "running",
    cpu: "2 vCPU",
    memory: "4 GB",
    cost: "$62.00/mo",
  },
  {
    id: "lb-001",
    name: "prod-load-balancer",
    type: "Load Balancer",
    region: "Global",
    status: "active",
    cpu: "-",
    memory: "-",
    cost: "$45.00/mo",
  },
  {
    id: "st-001",
    name: "assets-bucket",
    type: "Object Storage",
    region: "US-East-1",
    status: "active",
    cpu: "-",
    memory: "245 GB",
    cost: "$12.25/mo",
  },
];

export default function ResourceTable() {
  return (
    <div className="bg-canvas rounded-md shadow-level-2 overflow-hidden">
      <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
        <h2 className="text-heading-3 text-ink">Resources</h2>
        <button className="cc-btn-primary px-3 py-2 text-body-sm rounded-sm transition-colors duration-fast">
          + Create Resource
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-canvas-soft">
            <tr>
              <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                Region
              </th>
              <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                Specs
              </th>
              <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-canvas-soft transition-colors duration-fast">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-body-sm font-medium text-ink">{resource.name}</p>
                    <p className="text-caption font-[var(--font-mono)] text-mute">{resource.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-sm text-body">{resource.type}</td>
                <td className="px-6 py-4 text-body-sm text-body">{resource.region}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-pill text-caption font-medium ${
                      resource.status === "running" || resource.status === "active"
                        ? "badge-success"
                        : resource.status === "stopped"
                        ? "badge-info"
                        : "badge-warning"
                    }`}
                  >
                    {resource.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-body-sm text-body">
                  {resource.cpu !== "-" ? `${resource.cpu} / ${resource.memory}` : resource.memory}
                </td>
                <td className="px-6 py-4 text-body-sm font-medium text-ink">{resource.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
