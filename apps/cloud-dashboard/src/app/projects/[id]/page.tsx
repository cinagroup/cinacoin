"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { UsageChart } from "@/components/UsageChart";

interface UsageDataPoint {
  date: string;
  requests: number;
  errors: number;
}

const demoProjects: Record<string, { name: string; description: string }> = {
  "demo-1": {
    name: "Demo Wallet App",
    description: "A demo wallet application using Cinacoin SDK",
  },
  "demo-2": {
    name: "NFT Marketplace",
    description: "Multi-chain NFT marketplace integration",
  },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = demoProjects[projectId];

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

  if (!project) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-slate-400">Project not found.</p>
        </main>
      </div>
    );
  }

  const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);
  const totalErrors = usageData.reduce((sum, d) => sum + d.errors, 0);

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a href="/projects" className="text-sm text-slate-400 hover:text-white">
            ← Back to Projects
          </a>
          <h1 className="mt-2 text-2xl font-bold text-white">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-400">{project.description}</p>
        </div>

        <div className="mb-6 border-b border-dark-800">
          <nav className="-mb-px flex gap-6">
            {(["overview", "keys", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300"
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
              <div className="rounded-lg border border-dark-800 bg-dark-900 p-6">
                <p className="text-sm text-slate-400">Total Requests</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-dark-800 bg-dark-900 p-6">
                <p className="text-sm text-slate-400">Errors</p>
                <p className="mt-1 text-3xl font-bold text-red-400">
                  {totalErrors.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-dark-800 bg-dark-900 p-6">
                <p className="text-sm text-slate-400">Avg Latency</p>
                <p className="mt-1 text-3xl font-bold text-emerald-400">
                  45ms
                </p>
              </div>
            </div>
            {usageData.length > 0 && <UsageChart data={usageData} />}
          </div>
        )}

        {activeTab === "keys" && (
          <div className="rounded-xl border border-dark-800 bg-dark-900 p-6">
            <ApiKeyManager projectId={projectId} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="rounded-xl border border-dark-800 bg-dark-900 p-6">
            <h3 className="mb-4 text-lg font-medium text-white">Project Settings</h3>
            <p className="text-sm text-slate-400">Settings management coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
