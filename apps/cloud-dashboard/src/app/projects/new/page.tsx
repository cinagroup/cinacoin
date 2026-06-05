import Header from "@/components/Header";
import { ProjectForm } from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas)]">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cc-ink)]">Create Project</h1>
          <p className="mt-1 text-sm text-[var(--cc-muted)]">
            Set up a new project to get started with Cinacoin.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] p-6">
          <ProjectForm />
        </div>
      </main>
    </div>
  );
}
