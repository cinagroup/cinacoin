import type { Project } from "@/types";
import { Folder } from "lucide-react";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a href={`/projects/${project.id}`} className="group block cc-card">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--cc-primary)]/10 text-[var(--cc-link)]">
          <Folder className="h-5 w-5" />
        </div>
        <span className="cc-badge" style={{ backgroundColor: 'var(--cc-success-bg, rgba(0,112,243,0.10))', color: 'var(--cc-success)' }}>
          Active
        </span>
      </div>
      <h3 className="mb-1 cc-body-md-strong text-[var(--cc-ink)] transition-colors group-hover:text-[var(--cc-link)]">
        {project.name}
      </h3>
      <p className="mb-3 text-body-sm text-[var(--cc-muted)] line-clamp-2">
        {project.description || "No description"}
      </p>
      <div className="flex items-center justify-between text-caption text-[var(--cc-muted)]">
        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
    </a>
  );
}
