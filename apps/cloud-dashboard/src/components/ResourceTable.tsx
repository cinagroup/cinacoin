"use client";

import { Monitor } from "lucide-react";

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
    <div className="bg-[var(--cc-canvas)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level2)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--cc-hairline)] flex items-center justify-between">
        <h2 className="cc-body-md-strong text-[var(--cc-ink)]">Resources.</h2>
        <button className="cc-btn-primary">
          + Create resource
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--cc-canvas-soft)]">
            <tr>
              <th className="px-6 py-3 text-left cc-caption-mono text-[var(--cc-muted)] tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left cc-caption-mono text-[var(--cc-muted)] tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left cc-caption-mono text-[var(--cc-muted)] tracking-wider">
                Region
              </th>
              <th className="px-6 py-3 text-left cc-caption-mono text-[var(--cc-muted)] tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left cc-caption-mono text-[var(--cc-muted)] tracking-wider">
                Specs
              </th>
              <th className="px-6 py-3 text-left cc-caption-mono text-[var(--cc-muted)] tracking-wider">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--cc-hairline)]">
            {resources.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Monitor className="w-8 h-8 text-[var(--cc-muted)] mb-4" />
                    <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-1">No resources.</h3>
                    <p className="cc-body-sm text-[var(--cc-body)] max-w-sm">Create your first cloud resource to get started.</p>
                  </div>
                </td>
              </tr>
            ) : resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-[var(--cc-canvas-soft)] transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="cc-body-sm-strong text-[var(--cc-ink)]">{resource.name}</p>
                    <p className="cc-caption font-[var(--font-mono)] text-[var(--cc-muted)]">{resource.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 cc-body-sm text-[var(--cc-body)]">{resource.type}</td>
                <td className="px-6 py-4 cc-body-sm text-[var(--cc-body)]">{resource.region}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-[var(--cc-radius-pill)] cc-caption font-medium ${
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
                <td className="px-6 py-4 cc-body-sm text-[var(--cc-body)]">
                  {resource.cpu !== "-" ? `${resource.cpu} / ${resource.memory}` : resource.memory}
                </td>
                <td className="px-6 py-4 cc-body-sm-strong text-[var(--cc-ink)]">{resource.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
