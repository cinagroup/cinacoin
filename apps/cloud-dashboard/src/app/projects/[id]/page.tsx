import { ProjectDetailClient } from "./ProjectDetailClient";

const demoProjects: Record<string, { name: string; description: string }> = {
  "demo-1": {
    name: "Demo Wallet App",
    description: "A demo wallet application using Cinacoin SDK",
  },
  "demo-2": {
    name: "NFT Marketplace",
    description: "Multi-chain NFT marketplace integration",
  },
};

export function generateStaticParams() {
  return Object.keys(demoProjects).map((id) => ({ id }));
}

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const projectId = params.id;
  const project = demoProjects[projectId];

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--cc-canvas)]">
        <p className="text-[var(--cc-muted)]">Project not found.</p>
      </div>
    );
  }

  return <ProjectDetailClient projectId={projectId} project={project} />;
}
