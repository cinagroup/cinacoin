"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
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
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      <Header />
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
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {projects.length === 0 && (
              <div className="cc-card-soft p-12 text-center">
                <p className="cc-body-sm text-[var(--cc-muted)]">No projects yet.</p>
                <a
                  href="/projects/new"
                  className="mt-4 cc-btn-primary px-4 !h-10 text-sm"
                >
                  Create Your First Project
                </a>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
