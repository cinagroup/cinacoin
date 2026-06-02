import Header from "@/components/Header";
import { ProjectForm } from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Create Project</h1>
          <p className="mt-1 text-sm text-slate-400">
            Set up a new project to get started with Cinacoin.
          </p>
        </div>
        <div className="rounded-xl border border-dark-800 bg-dark-900 p-6">
          <ProjectForm />
        </div>
      </main>
    </div>
  );
}
