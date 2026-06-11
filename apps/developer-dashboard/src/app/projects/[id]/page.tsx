import ProjectDetailClient from "./ProjectDetailClient";

// Generate static params for all known project IDs
export function generateStaticParams() {
  return [
    { id: "proj-1" },
    { id: "proj-2" },
    { id: "proj-3" },
    { id: "proj-4" },
    { id: "proj-5" },
  ];
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
