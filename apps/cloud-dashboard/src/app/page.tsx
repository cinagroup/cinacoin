import Header from "@/components/Header";
import { demoProjects } from "@/lib/api";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      <Header />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="cc-display-md text-[var(--cc-ink)]">Dashboard</h1>
          <p className="cc-body-sm text-[var(--cc-body)] mt-1">
            Welcome to Cinacoin Cloud. Manage your projects and API keys from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="cc-card">
            <p className="cc-caption text-[var(--cc-muted)]">Total Projects</p>
            <p className="cc-display-sm text-[var(--cc-ink)] mt-1">{demoProjects.length}</p>
          </div>
          <div className="cc-card">
            <p className="cc-caption text-[var(--cc-muted)]">Total API Keys</p>
            <p className="cc-display-sm text-[var(--cc-ink)] mt-1">3</p>
          </div>
          <div className="cc-card">
            <p className="cc-caption text-[var(--cc-muted)]">Requests Today</p>
            <p className="cc-display-sm text-[var(--cc-ink)] mt-1">12,450</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="cc-card">
          <h2 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Quick Start</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="/projects/new"
              className="cc-card text-center block hover:shadow-[var(--cc-level3)]"
            >
              <p className="cc-body-md-strong text-[var(--cc-link)]">+ Create Project</p>
              <p className="cc-caption text-[var(--cc-muted)] mt-1">Start building with Cinacoin</p>
            </a>
            <a
              href="/projects"
              className="cc-card text-center block hover:shadow-[var(--cc-level3)]"
            >
              <p className="cc-body-md-strong text-[var(--cc-link)]">View All Projects</p>
              <p className="cc-caption text-[var(--cc-muted)] mt-1">Manage existing projects</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
