'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    network: 'mainnet',
    sdkVersion: 'v2',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would call the API
    alert(`Project "${formData.name}" created! (Demo)`);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/projects" className="text-body-sm text-link hover:text-link-hover">
          ← Back to Projects
        </Link>
        <h1 className="text-display-md font-semibold text-[var(--cc-ink)] mt-2">New project</h1>
        <p className="text-ink-body mt-1">
          Set up a new project to start integrating with CinaCoin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="cc-card space-y-5">
        <div>
          <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Project Name</label>
          <input
            name="name"
            type="text"
            placeholder="My Awesome dApp"
            aria-label="Project name"
            className="cc-form-input"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Description</label>
          <textarea
            name="description"
            placeholder="Brief description of your project..."
            aria-label="Project description"
            className="cc-form-input min-h-[100px] resize-y"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Network</label>
            <select
              name="network"
              aria-label="Network"
              className="cc-form-input"
              value={formData.network}
              onChange={handleChange}
            >
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">SDK Version</label>
            <select
              name="sdkVersion"
              aria-label="SDK version"
              className="cc-form-input"
              value={formData.sdkVersion}
              onChange={handleChange}
            >
              <option value="v2">v2.x (Latest)</option>
              <option value="v1">v1.x (Legacy)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="cc-btn-primary">
            Create Project
          </button>
          <Link href="/projects" className="cc-btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
