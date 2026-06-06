import { ProjectDetailClient } from "./ProjectDetailClient";
import { demoProjects } from "@/lib/api";

export function generateStaticParams() {
  return demoProjects.map((p) => ({ id: p.id }));
}

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const projectId = params.id;
  const project = demoProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--cc-canvas)]">
        <p className="text-[var(--cc-muted)]">Project not found.</p>
      </div>
    );
  }

  return <ProjectDetailClient projectId={projectId} project={project} />;
}
