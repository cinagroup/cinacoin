import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cc-ink)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--cc-body)]">
            Welcome to Cinacoin Cloud. Manage your projects and API keys from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-6 shadow-[var(--cc-level1)]">
            <p className="text-sm text-[var(--cc-body)]">Total Projects</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">0</p>
          </div>
          <div className="rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-6 shadow-[var(--cc-level1)]">
            <p className="text-sm text-[var(--cc-body)]">Total API Keys</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">0</p>
          </div>
          <div className="rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-6 shadow-[var(--cc-level1)]">
            <p className="text-sm text-[var(--cc-body)]">Requests Today</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">0</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-6 shadow-[var(--cc-level1)]">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--cc-ink)]">Quick Start</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="/projects/new"
              className="rounded-md border border-dashed border-[var(--cc-hairline-strong)] p-4 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <p className="font-medium text-[var(--cc-primary)]">+ Create Project</p>
              <p className="text-xs text-[var(--cc-body)]">Start building with Cinacoin</p>
            </a>
            <a
              href="/projects"
              className="rounded-md border border-dashed border-[var(--cc-hairline-strong)] p-4 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <p className="font-medium text-[var(--cc-primary)]">View All Projects</p>
              <p className="text-xs text-[var(--cc-body)]">Manage existing projects</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
