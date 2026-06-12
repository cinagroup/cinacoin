import Link from "next/link";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    status: "active" | "paused" | "inactive";
    network: string;
    requests: number;
    createdAt: string;
  };
}

function StatusBadge({ status }: { status: ProjectCardProps["project"]["status"] }) {
  const map = {
    active: "badge-success",
    paused: "badge-warning",
    inactive: "badge-neutral",
  };
  return (
    <span className={`badge ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <article className="cc-card card-hover cursor-pointer transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-[var(--cc-ink)]">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <dl className="space-y-1 text-body-sm">
          <div className="flex justify-between text-ink-body">
            <dt>Network</dt>
            <dd>{project.network}</dd>
          </div>
          <div className="flex justify-between text-ink-body">
            <dt>Requests</dt>
            <dd>{project.requests.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between text-ink-mute text-caption">
            <dt>Created</dt>
            <dd>{project.createdAt}</dd>
          </div>
        </dl>
      </article>
    </Link>
  );
}
