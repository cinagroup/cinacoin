import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a href={`/projects/${project.id}`} className="group block cc-card">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--cc-primary)]/10 text-[var(--cc-link)]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <span className="cc-badge" style={{ backgroundColor: 'var(--cc-success-bg, rgba(0,112,243,0.10))', color: 'var(--cc-success)' }}>
          Active
        </span>
      </div>
      <h3 className="mb-1 cc-body-md-strong text-[var(--cc-ink)] transition-colors group-hover:text-[var(--cc-link)]">
        {project.name}
      </h3>
      <p className="mb-3 text-[14px] text-[var(--cc-muted)] line-clamp-2">
        {project.description || "No description"}
      </p>
      <div className="flex items-center justify-between text-[12px] text-[var(--cc-muted)]">
        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
    </a>
  );
}
