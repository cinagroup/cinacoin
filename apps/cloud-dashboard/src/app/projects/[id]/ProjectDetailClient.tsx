"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { UsageChart } from "@/components/UsageChart";

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

  useEffect(() => {
    // Generate mock usage data
    const now = Date.now();
    const data: UsageDataPoint[] = Array.from({ length: 14 }, (_, i) => {
      const requests = Math.floor(Math.random() * 5000);
      return {
        date: new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10),
        requests,
        errors: Math.floor(Math.random() * 50),
      };
    });
    setUsageData(data);
  }, [projectId]);

  const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);
  const totalErrors = usageData.reduce((sum, d) => sum + d.errors, 0);

  return (
    <div className="min-h-screen bg-[var(--cc-canvas)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a href="/projects" className="text-sm text-[var(--cc-muted)] hover:text-[var(--cc-ink)]">
            ← Back to Projects
          </a>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--cc-ink)]">{project.name}</h1>
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
              <div className="rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] p-6">
                <p className="text-sm text-[var(--cc-muted)]">Total Requests</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--cc-ink)]">
                  {totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] p-6">
                <p className="text-sm text-[var(--cc-muted)]">Errors</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--cc-error)]">
                  {totalErrors.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] p-6">
                <p className="text-sm text-[var(--cc-muted)]">Avg Latency</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--cc-success)]">
                  45ms
                </p>
              </div>
            </div>
            {usageData.length > 0 && <UsageChart data={usageData} />}
          </div>
        )}

        {activeTab === "keys" && (
          <div className="rounded-xl border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] p-6">
            <ApiKeyManager projectId={projectId} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="rounded-xl border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] p-6">
            <h3 className="mb-4 text-lg font-medium tracking-tight text-[var(--cc-ink)]">Project Settings</h3>
            <p className="text-sm text-[var(--cc-muted)]">Settings management coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
