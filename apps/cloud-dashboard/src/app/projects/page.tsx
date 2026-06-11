"use client";

import { useState } from "react";
import { Menu, Search, MoreVertical } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FolderOpen } from "lucide-react";

export default function ProjectsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mockProjects = [
    { id: 1, name: "Production API", status: "active", resources: 12, region: "us-east-1", created: "2026-01-15" },
    { id: 2, name: "Staging Environment", status: "active", resources: 8, region: "us-west-2", created: "2026-02-20" },
    { id: 3, name: "Development", status: "active", resources: 5, region: "eu-west-1", created: "2026-03-10" },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-canvas border-b border-hairline h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-canvas-soft-2 mr-4 transition-colors duration-fast"
          >
            <Menu className="w-5 h-5 text-body" />
          </button>
          <div className="flex-1 flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-10 pr-4 py-2 bg-canvas-soft border border-hairline rounded-sm text-body-sm w-80 focus:outline-none focus:border-link focus:ring-2 focus:ring-link/10 transition-colors"
              />
            </div>
          </div>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-mute mb-2">WORKSPACE</p>
              <h1 className="text-heading-2 text-ink">Projects</h1>
              <p className="text-body-sm text-body mt-1">Manage your cloud projects</p>
            </div>
            <button className="cc-btn-primary px-4 py-2">
              + New Project
            </button>
          </div>

          <div className="grid gap-4">
            {mockProjects.length === 0 ? (
              <div className="bg-canvas border border-hairline rounded-md p-12 text-center">
                <FolderOpen className="w-8 h-8 text-mute mb-4 mx-auto" />
                <h3 className="text-heading-3 text-ink mb-1">No projects yet</h3>
                <p className="text-body-sm text-body max-w-sm">Create your first project to get started with cloud services.</p>
              </div>
            ) : mockProjects.map((project) => (
              <div key={project.id} className="bg-canvas border border-hairline rounded-md p-6 hover:shadow-level-2 transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-heading-3 text-ink">{project.name}</h3>
                      <span className="badge badge-success">{project.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-body-sm">
                      <div>
                        <span className="text-mute">Resources:</span>
                        <span className="ml-2 text-ink font-medium">{project.resources}</span>
                      </div>
                      <div>
                        <span className="text-mute">Region:</span>
                        <span className="ml-2 text-ink font-medium">{project.region}</span>
                      </div>
                      <div>
                        <span className="text-mute">Created:</span>
                        <span className="ml-2 text-ink font-medium">{project.created}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-canvas-soft-2 rounded transition-colors">
                    <MoreVertical className="w-5 h-5 text-body" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
