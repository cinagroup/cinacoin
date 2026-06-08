"use client";

import { useState, useEffect } from "react";
import { listProjects } from "@/lib/api";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ownerId = typeof window !== "undefined" ? localStorage.getItem("cinacoin_owner_id") || "" : "";
    if (ownerId) {
      listProjects(ownerId)
        .then(setProjects)
        .catch(() => setProjects([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="cc-display-md text-[var(--cc-ink)]">Projects</h1>
            <p className="cc-body-sm text-[var(--cc-muted)] mt-1">
              Manage your Cinacoin projects
            </p>
          </div>
          <a
            href="/projects/new"
            className="cc-btn-primary px-4 !h-10 text-sm"
          >
            + New Project
          </a>
        </div>

        {loading ? (
          <div className="cc-card-soft p-12 text-center">
            <p className="cc-body-sm text-[var(--cc-muted)]">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="cc-card-soft p-12 text-center">
            <p className="cc-body-sm text-[var(--cc-muted)]">No projects yet.</p>
            <a
              href="/projects/new"
              className="mt-4 cc-btn-primary px-4 !h-10 text-sm"
            >
              Create Your First Project
            </a>
          </div>
        ) : (
          <div className="cc-card p-0 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <a
                        href={`/projects/${project.id}`}
                        className="text-[var(--cc-link)] hover:text-[var(--cc-link-deep)] font-medium"
                      >
                        {project.name}
                      </a>
                    </td>
                    <td className="text-[var(--cc-body)]">
                      {project.description || '—'}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--green-bg)] text-[var(--green)]">
                        Active
                      </span>
                    </td>
                    <td className="text-[var(--cc-muted)] text-sm">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <a
                        href={`/projects/${project.id}`}
                        className="text-sm text-[var(--cc-link)] hover:text-[var(--cc-link-deep)]"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
  );
}
