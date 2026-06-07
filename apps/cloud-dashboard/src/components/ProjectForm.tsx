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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cc-success)]/10">
          <svg className="h-6 w-6 text-[var(--cc-success)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--cc-ink)]">Project Created!</h3>
        <p className="text-sm text-[var(--cc-muted)]">Your project has been created successfully.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/dashboard/projects" className="cc-btn-secondary-sm px-4">
            Back to Projects
          </a>
          <a href={`/projects/${created}`} className="cc-btn-primary-sm px-4">
            View Project
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">Project Name <span className="text-[var(--cc-error)]">*</span></label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="cc-form-input"
          placeholder="My Awesome Project"
        />
      </div>

      <div>
        <label htmlFor="description" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">Description</label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="cc-form-input"
          placeholder="What does your project do?"
        />
      </div>

      <div>
        <label htmlFor="ownerAddress" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">Owner Wallet Address</label>
        <input
          id="ownerAddress"
          type="text"
          required
          value={formData.ownerAddress}
          onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
          className="cc-form-input font-mono"
          placeholder="0x..."
        />
      </div>

      <div>
        <label htmlFor="websiteUrl" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">Website URL (optional)</label>
        <input
          id="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          className="cc-form-input"
          placeholder="https://myproject.com"
        />
      </div>

      <div>
        <label htmlFor="redirectUris" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">Redirect URIs (comma-separated)</label>
        <input
          id="redirectUris"
          type="text"
          value={formData.redirectUris}
          onChange={(e) => setFormData({ ...formData, redirectUris: e.target.value })}
          className="cc-form-input"
          placeholder="https://myproject.com/callback"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <a href="/dashboard/projects" className="cc-btn-secondary-sm px-4">
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading}
          className="cc-btn-primary-sm px-4 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
