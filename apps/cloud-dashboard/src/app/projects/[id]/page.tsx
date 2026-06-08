import { ProjectDetailClient } from "./ProjectDetailClient";
import { getProject } from "@/lib/api";

export const dynamic = 'force-static';
export const revalidate = 60;

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const projectId = params.id;

  // Try to fetch from API; if unavailable, show a not-found message
  let project = null;
  try {
    const ownerId = typeof window !== "undefined" ? localStorage.getItem("cinacoin_owner_id") || "" : "";
    if (ownerId) {
      project = await getProject(projectId, ownerId);
    }
  } catch {
    // API unavailable or project not found
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--cc-canvas)] flex items-center justify-center">
        <p className="text-[var(--cc-muted)]">Project not found or API unavailable.</p>
      </div>
    );
  }

  return <ProjectDetailClient projectId={projectId} project={project} />;
}
