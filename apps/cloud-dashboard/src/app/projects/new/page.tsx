import { ProjectForm } from "@/components/ProjectForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function NewProjectPage() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs />
      <div className="mb-6">
        <h1 className="cc-display-md text-[var(--cc-ink)]">Create Project</h1>
        <p className="cc-body-sm text-[var(--cc-muted)] mt-1">
          Set up a new project to get started with Cinacoin.
        </p>
      </div>
      <div className="cc-card">
        <ProjectForm />
      </div>
    </main>
  );
}
