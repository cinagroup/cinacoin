"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { listProjects } from "@/lib/api";
import type { Project } from "@/types";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load real projects; fall back to empty list
    const ownerId = typeof window !== "undefined" ? localStorage.getItem("cinacoin_owner_id") || "" : "";
    if (ownerId) {
      listProjects(ownerId)
        .then(setProjects)
        .catch(() => setProjects([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

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
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3" role="region" aria-label="Dashboard statistics">
          <div className="cc-card" role="status" aria-busy={loading}>
            <p className="cc-caption text-[var(--cc-muted)]">Total Projects</p>
            <p className="cc-display-sm text-[var(--cc-ink)] mt-1">
              {loading ? (
                <span className="inline-block w-12 h-6 bg-[var(--cc-canvas-soft-2)] rounded animate-pulse" aria-hidden="true" />
              ) : projects.length}
            </p>
          </div>
          <div className="cc-card" role="status" aria-busy={loading}>
            <p className="cc-caption text-[var(--cc-muted)]">Total API Keys</p>
            <p className="cc-display-sm text-[var(--cc-ink)] mt-1">
              {loading ? (
                <span className="inline-block w-12 h-6 bg-[var(--cc-canvas-soft-2)] rounded animate-pulse" aria-hidden="true" />
              ) : '—'}
            </p>
          </div>
          <div className="cc-card" role="status" aria-busy={loading}>
            <p className="cc-caption text-[var(--cc-muted)]">Requests Today</p>
            <p className="cc-display-sm text-[var(--cc-ink)] mt-1">
              {loading ? (
                <span className="inline-block w-12 h-6 bg-[var(--cc-canvas-soft-2)] rounded animate-pulse" aria-hidden="true" />
              ) : '—'}
            </p>
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
