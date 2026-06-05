'use client';

import { useState, type FormEvent } from 'react';

export function ProjectForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerAddress: '',
    websiteUrl: '',
    redirectUris: '',
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));

    const id = crypto.randomUUID();
    setCreated(id);
    setLoading(false);
  };

  if (created) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
          <svg className="h-6 w-6 text-[var(--cc-success)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--cc-ink)]">Project Created!</h3>
        <p className="text-sm text-[var(--cc-muted)]">Your project has been created successfully.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/projects" className="rounded-lg border border-dark-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-[var(--cc-canvas-soft-2)]">
            Back to Projects
          </a>
          <a href={`/projects/${created}`} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-[var(--cc-ink)] transition hover:bg-primary-500">
            View Project
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300">Project Name</label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-dark-700 bg-[var(--cc-canvas-soft)] px-3 py-2 text-sm text-[var(--cc-ink)] placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="My Awesome Project"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description</label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 w-full rounded-lg border border-dark-700 bg-[var(--cc-canvas-soft)] px-3 py-2 text-sm text-[var(--cc-ink)] placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="What does your project do?"
        />
      </div>

      <div>
        <label htmlFor="ownerAddress" className="block text-sm font-medium text-slate-300">Owner Wallet Address</label>
        <input
          id="ownerAddress"
          type="text"
          required
          value={formData.ownerAddress}
          onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
          className="mt-1 w-full rounded-lg border border-dark-700 bg-[var(--cc-canvas-soft)] px-3 py-2 text-sm font-mono text-[var(--cc-ink)] placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="0x..."
        />
      </div>

      <div>
        <label htmlFor="websiteUrl" className="block text-sm font-medium text-slate-300">Website URL (optional)</label>
        <input
          id="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          className="mt-1 w-full rounded-lg border border-dark-700 bg-[var(--cc-canvas-soft)] px-3 py-2 text-sm text-[var(--cc-ink)] placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="https://myproject.com"
        />
      </div>

      <div>
        <label htmlFor="redirectUris" className="block text-sm font-medium text-slate-300">Redirect URIs (comma-separated)</label>
        <input
          id="redirectUris"
          type="text"
          value={formData.redirectUris}
          onChange={(e) => setFormData({ ...formData, redirectUris: e.target.value })}
          className="mt-1 w-full rounded-lg border border-dark-700 bg-[var(--cc-canvas-soft)] px-3 py-2 text-sm text-[var(--cc-ink)] placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="https://myproject.com/callback"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <a href="/projects" className="rounded-lg border border-dark-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-[var(--cc-canvas-soft-2)]">
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-[var(--cc-ink)] transition hover:bg-primary-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
