"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { UsageChart } from "@/components/UsageChart";
import { getUsageStats } from "@/lib/api";

interface UsageDataPoint {
  date: string;
  requests: number;
  errors: number;
}

interface ProjectDetailClientProps {
  projectId: string;
  project: { name: string; description: string };
}

export function ProjectDetailClient({ projectId, project }: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "keys" | "settings">(
    "overview"
  );
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([]);
  const [avgLatency, setAvgLatency] = useState<number>(0);
  const [usageLoading, setUsageLoading] = useState(true);
  const [projectName, setProjectName] = useState(project.name);
  const [network, setNetwork] = useState("mainnet");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setProjectName(project.name);
  }, [project.name]);

  useEffect(() => {
    let cancelled = false;
    setUsageLoading(true);
    getUsageStats(projectId, 14)
      .then((stats) => {
        if (cancelled) return;
        setUsageData(stats.dailyData);
        setAvgLatency(stats.avgLatency);
      })
      .catch(() => {
        if (!cancelled) setUsageData([]);
      })
      .finally(() => {
        if (!cancelled) setUsageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);
  const totalErrors = usageData.reduce((sum, d) => sum + d.errors, 0);

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a href="/dashboard/projects" className="text-sm text-[var(--cc-muted)] hover:text-[var(--cc-ink)]">
            ← Back to Projects
          </a>
          <h1 className="mt-2 cc-display-md text-[var(--cc-ink)]">{project.name}</h1>
          <p className="mt-1 text-sm text-[var(--cc-muted)]">{project.description}</p>
        </div>

        <div className="mb-6 border-b border-[var(--cc-hairline)]">
          <nav className="-mb-px flex gap-6">
            {(["overview", "keys", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-[var(--cc-primary)] text-[var(--cc-primary)]"
                    : "border-transparent text-[var(--cc-muted)] hover:border-[var(--cc-hairline-strong)] hover:text-[var(--cc-ink)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="cc-card">
                <p className="text-sm text-[var(--cc-muted)]">Total Requests</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">
                  {totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="cc-card">
                <p className="text-sm text-[var(--cc-muted)]">Errors</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--cc-error)]">
                  {totalErrors.toLocaleString()}
                </p>
              </div>
              <div className="cc-card">
                <p className="text-sm text-[var(--cc-muted)]">Avg Latency</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--cc-success)]">
                  {avgLatency > 0 ? `${avgLatency}ms` : "—"}
                </p>
              </div>
            </div>
            {usageLoading ? (
              <div className="cc-card text-sm text-[var(--cc-muted)]">
                Loading usage…
              </div>
            ) : usageData.some((d) => d.requests > 0) ? (
              <UsageChart data={usageData} />
            ) : (
              <div className="cc-card text-sm text-[var(--cc-muted)]">
                No usage recorded yet. Traffic from your API keys will appear here.
              </div>
            )}
          </div>
        )}

        {activeTab === "keys" && (
          <div className="cc-card">
            <ApiKeyManager projectId={projectId} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="cc-card">
              <h3 className="cc-display-sm text-[var(--cc-ink)] mb-4">Project Settings</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSaved(true);
                  setTimeout(() => setIsSaved(false), 2000);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--cc-body)] mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="cc-form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--cc-body)] mb-1">
                    Environment / Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="cc-form-input bg-[var(--cc-canvas)]"
                  >
                    <option value="mainnet">Mainnet</option>
                    <option value="testnet">Testnet</option>
                    <option value="devnet">Devnet</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" className="cc-btn-primary-sm">
                    Save Changes
                  </button>
                  {isSaved && (
                    <span className="text-sm font-medium text-[var(--cc-success)]">Saved</span>
                  )}
                </div>
              </form>
            </div>

            <div className="cc-card border border-[var(--cc-error)] bg-[var(--cc-error-soft)]/10">
              <h3 className="text-lg font-medium tracking-tight text-[var(--cc-error)] mb-2">Danger Zone</h3>
              <p className="text-sm text-[var(--cc-body)] mb-4">
                Once you delete a project, all of its API keys and usage statistics will be permanently removed.
              </p>
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    "Are you sure you want to delete this project? This action is permanent and cannot be undone."
                  );
                  if (confirmed) {
                    window.alert("Project deleted (demo).");
                    window.location.href = "/dashboard/projects";
                  }
                }}
                className="inline-flex items-center justify-center rounded-[var(--cc-radius-sm)] bg-[var(--cc-error)] text-white px-4 py-2 text-sm font-medium hover:bg-[var(--cc-error-deep)] transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
