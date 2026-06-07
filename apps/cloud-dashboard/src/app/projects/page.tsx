"use client";

import Header from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { demoProjects } from "@/lib/api";

export default function ProjectsPage() {
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demoProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {demoProjects.length === 0 && (
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
      </main>
    </div>
  );
}
