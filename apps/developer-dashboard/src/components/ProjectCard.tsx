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
    <Link href={`/projects/${project.id}`}>
      <div className="card card-hover cursor-pointer transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-ink">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-ink-body">
            <span>Network</span>
            <span>{project.network}</span>
          </div>
          <div className="flex justify-between text-ink-body">
            <span>Requests</span>
            <span>{project.requests.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-ink-mute text-xs">
            <span>Created {project.createdAt}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
