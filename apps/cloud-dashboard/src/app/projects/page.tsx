"use client";

import Header from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/types";

const demoProjects: Project[] = [
  {
    id: "demo-1",
    name: "Demo Wallet App",
    description: "A demo wallet application using Cinacoin SDK",
    owner_address: "0xDemo",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    name: "NFT Marketplace",
    description: "Multi-chain NFT marketplace integration",
    owner_address: "0xDemo",
    status: "active",
    chain_ids: ["eth", "sol", "btc"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Projects</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your Cinacoin projects
            </p>
          </div>
          <a
            href="/projects/new"
            className="rounded-[100px] bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
          >
            + New Project
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demoProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {demoProjects.length === 0 && (
          <div className="rounded-lg border border-dashed border-dark-800 p-12 text-center">
            <p className="text-sm text-slate-400">No projects yet.</p>
            <a
              href="/projects/new"
              className="mt-4 inline-block rounded-[100px] bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
            >
              Create Your First Project
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
