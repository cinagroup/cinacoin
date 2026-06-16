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
      <main id="main-content" className="flex items-center justify-center min-h-[400px]">
        <p className="text-[var(--cc-muted)]">Project not found or API unavailable.</p>
      </main>
    );
  }

  return <ProjectDetailClient projectId={projectId} project={project} />;
}
