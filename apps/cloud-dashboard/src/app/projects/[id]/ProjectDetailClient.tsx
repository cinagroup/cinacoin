"use client";

import { useState, useEffect } from "react";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { UsageChart } from "@/components/UsageChart";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-6">
          <a href="/projects" className="text-body-sm text-[var(--cc-muted)] hover:text-[var(--cc-ink)]">
            ← Back to Projects
          </a>
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">PROJECT DETAIL</p>
          <h1 className="mt-2 cc-display-md text-[var(--cc-ink)]">{project.name}</h1>
          <p className="mt-1 text-body-sm text-[var(--cc-muted)]">{project.description}</p>
        </div>

        <div className="mb-6 border-b border-[var(--cc-hairline)]">
          <nav className="-mb-px flex gap-2" role="tablist" aria-label="Project sections">
            {(["overview", "keys", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`panel-${tab}`}
                id={`tab-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const tabs = ['overview', 'keys', 'settings'];
                    const idx = tabs.indexOf(activeTab);
                    const next = e.key === 'ArrowRight' ? (idx + 1) % 3 : (idx + 2) % 3;
                    setActiveTab(tabs[next] as typeof activeTab);
                  }
                }}
                className={`cc-tab-ghost capitalize ${
                  activeTab === tab
                    ? "bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)]"
                    : "text-[var(--cc-muted)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="stat-card">
                <p className="stat-card-label">Total Requests</p>
                <p className="stat-card-value">
                  {totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-card-label">Errors</p>
                <p className="stat-card-value text-[var(--cc-error)]">
                  {totalErrors.toLocaleString()}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-card-label">Avg Latency</p>
                <p className="stat-card-value text-[var(--cc-success)]">
                  {avgLatency > 0 ? `${avgLatency}ms` : "—"}
                </p>
              </div>
            </div>
            {usageLoading ? (
              <div className="cc-card text-body-sm text-[var(--cc-muted)]">
                Loading usage…
              </div>
            ) : usageData.some((d) => d.requests > 0) ? (
              <UsageChart data={usageData} />
            ) : (
              <div className="cc-card text-body-sm text-[var(--cc-muted)]">
                No usage recorded yet. Traffic from your API keys will appear here.
              </div>
            )}
          </div>
        )}

        {activeTab === "keys" && (
          <div className="cc-card" role="tabpanel" id="panel-keys" aria-labelledby="tab-keys">
            <ApiKeyManager projectId={projectId} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6" role="tabpanel" id="panel-settings" aria-labelledby="tab-settings">
            <div className="cc-card">
              <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">CONFIGURATION</p>
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
                  <label htmlFor="projectName" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="cc-form-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="networkSelect" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">
                    Environment / Network
                  </label>
                  <select
                    id="networkSelect"
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
                    <span className="text-body-sm font-medium text-[var(--cc-success)]">Saved</span>
                  )}
                </div>
              </form>
            </div>

            <div className="cc-card border border-[var(--cc-error)]/30 bg-[var(--cc-error-soft)]/10">
              <p className="font-mono text-xs text-[var(--cc-error)] mb-2">WARNING</p>
              <h3 className="cc-body-md-strong text-[var(--cc-error)] mb-2">Danger Zone</h3>
              <p className="cc-body-sm text-[var(--cc-body)] mb-4">
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
                    window.location.href = "/projects";
                  }
                }}
                className="cc-btn-primary-sm bg-[var(--cc-error)] hover:bg-[var(--cc-error-deep)]"
              >
                Delete Project
              </button>
            </div>
          </div>
        )}
      </main>
  );
}
