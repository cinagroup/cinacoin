import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to Cinacoin Cloud. Manage your projects and API keys from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Projects</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total API Keys</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Requests Today</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Start</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="/projects/new"
              className="rounded-md border border-dashed border-gray-300 p-4 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <p className="font-medium text-blue-600">+ Create Project</p>
              <p className="text-xs text-gray-500">Start building with Cinacoin</p>
            </a>
            <a
              href="/projects"
              className="rounded-md border border-dashed border-gray-300 p-4 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <p className="font-medium text-blue-600">View All Projects</p>
              <p className="text-xs text-gray-500">Manage existing projects</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
