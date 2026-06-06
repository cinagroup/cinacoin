import Header from "@/components/Header";
import { demoProjects } from "@/lib/api";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="cc-display-md text-[var(--cc-ink)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--cc-body)]">
            Welcome to Cinacoin Cloud. Manage your projects and API keys from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="cc-card">
            <p className="text-sm text-[var(--cc-muted)]">Total Projects</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">{demoProjects.length}</p>
          </div>
          <div className="cc-card">
            <p className="text-sm text-[var(--cc-muted)]">Total API Keys</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">3</p>
          </div>
          <div className="cc-card">
            <p className="text-sm text-[var(--cc-muted)]">Requests Today</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">12,450</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="cc-card">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--cc-ink)]">Quick Start</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="/dashboard/projects/new"
              className="cc-card-soft text-center block transition-opacity hover:opacity-85"
            >
              <p className="font-medium text-[var(--cc-primary)]">+ Create Project</p>
              <p className="text-xs text-[var(--cc-body)] mt-1">Start building with Cinacoin</p>
            </a>
            <a
              href="/dashboard/projects"
              className="cc-card-soft text-center block transition-opacity hover:opacity-85"
            >
              <p className="font-medium text-[var(--cc-primary)]">View All Projects</p>
              <p className="text-xs text-[var(--cc-body)] mt-1">Manage existing projects</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
