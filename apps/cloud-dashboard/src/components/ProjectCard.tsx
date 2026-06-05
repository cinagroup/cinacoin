import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a href={`/projects/${project.id}`} className="group block rounded-xl border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)]/50 p-5 transition hover:border-primary-600/50 hover:bg-[var(--cc-canvas-soft)]">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20 text-primary-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-[var(--cc-success)]">
          active
        </span>
      </div>
      <h3 className="mb-1 text-base font-semibold text-[var(--cc-ink)] transition-colors group-hover:text-primary-400">
        {project.name}
      </h3>
      <p className="mb-3 text-sm text-[var(--cc-muted)] line-clamp-2">
        {project.description || "No description"}
      </p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
    </a>
  );
}
