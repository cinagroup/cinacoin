"use client";

import { useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import { BarChart3, Zap, AlertTriangle, Key, BarChart2, Code2, Settings2, Copy, Pencil } from "lucide-react";

// Mock project detail
const initialProject = {
  id: "proj-1",
  name: "Cinacoin Wallet",
  description: "Official Cinacoin wallet application with multi-chain support",
  status: "active",
  network: "Mainnet",
  sdkVersion: "v2.4.1",
  createdAt: "2025-03-15",
  projectId: "cc_proj_a1b2c3d4e5",
};

const apiKeys = [
  {
    id: "key-1",
    name: "Production Key",
    prefix: "cc_live_sk1_...a8f2",
    permissions: "admin",
    lastUsed: "2026-06-09",
    createdAt: "2025-03-15",
  },
  {
    id: "key-2",
    name: "Staging Key",
    prefix: "cc_test_sk1_...b3e1",
    permissions: "write",
    lastUsed: "2026-06-08",
    createdAt: "2025-06-20",
  },
];

// Mock usage data for chart
const usageData = [
  { date: "May 11", requests: 22400, users: 1200 },
  { date: "May 14", requests: 26100, users: 1340 },
  { date: "May 17", requests: 28300, users: 1410 },
  { date: "May 20", requests: 24700, users: 1280 },
  { date: "May 23", requests: 31200, users: 1520 },
  { date: "May 26", requests: 29800, users: 1480 },
  { date: "May 29", requests: 33500, users: 1610 },
  { date: "Jun 01", requests: 35100, users: 1700 },
  { date: "Jun 04", requests: 32400, users: 1650 },
  { date: "Jun 07", requests: 37800, users: 1820 },
];

const initialEnvVars = [
  { key: "CINACOIN_NETWORK", value: "mainnet", secret: false },
  { key: "CINACOIN_API_KEY", value: "cc_live_sk1_••••••••a8f2", secret: true },
  { key: "CINACOIN_WEBHOOK_SECRET", value: "whsec_••••••••••••", secret: true },
];

type SdkTab = "react" | "vue" | "nextjs";

const sdkSnippets: Record<SdkTab, string> = {
  react: `import { CinacoinProvider, useCinacoin } from "@cinacoin/sdk-react";

// Wrap your app
function App() {
  return (
    <CinacoinProvider
      projectId="${initialProject.projectId}"
      network="${initialProject.network.toLowerCase()}"
    >
      <YourApp />
    </CinacoinProvider>
  );
}

// Use in components
function Wallet() {
  const { connect, account, balance } = useCinacoin();
  return <button onClick={connect}>Connect ({balance})</button>;
}`,
  vue: `import { createCinacoinPlugin } from "@cinacoin/sdk-vue";

// main.ts
const app = createApp(App);
app.use(createCinacoinPlugin({
  projectId: "${initialProject.projectId}",
  network: "${initialProject.network.toLowerCase()}",
}));

// In components
<script setup>
import { useCinacoin } from "@cinacoin/sdk-vue";
const { connect, account, balance } = useCinacoin();
</script>`,
  nextjs: `// app/providers.tsx
"use client";
import { CinacoinProvider } from "@cinacoin/sdk-next";

export function Providers({ children }) {
  return (
    <CinacoinProvider
      projectId="${initialProject.projectId}"
      network="${initialProject.network.toLowerCase()}"
    >
      {children}
    </CinacoinProvider>
  );
}

// app/layout.tsx
import { Providers } from "./providers";
export default function Layout({ children }) {
  return <Providers>{children}</Providers>;
}`,
};

export default function ProjectDetailPage() {
  const [project, setProject] = useState(initialProject);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDesc, setEditDesc] = useState(project.description);
  const [sdkTab, setSdkTab] = useState<SdkTab>("react");
  const [envVars, setEnvVars] = useState(initialEnvVars);
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newEnvSecret, setNewEnvSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "sdk" | "env">("overview");

  const handleSaveProject = () => {
    setProject({ ...project, name: editName, description: editDesc });
    setIsEditing(false);
  };

  const handleAddEnvVar = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setEnvVars([...envVars, { key: newEnvKey.trim(), value: newEnvValue.trim(), secret: newEnvSecret }]);
      setNewEnvKey("");
      setNewEnvValue("");
      setNewEnvSecret(false);
      setShowAddEnv(false);
    }
  };

  const handleRemoveEnvVar = (key: string) => {
    setEnvVars(envVars.filter((v) => v.key !== key));
  };

  // Simple bar chart rendering
  const maxRequests = Math.max(...usageData.map((d) => d.requests));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="text-body-sm text-link hover:text-link-hover">
          ← Back to Projects
        </Link>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="cc-form-input text-display-md font-semibold"
                placeholder="Project name"
              />
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="cc-form-input"
                placeholder="Description"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveProject} className="cc-btn-primary">
                  Save Changes
                </button>
                <button onClick={() => setIsEditing(false)} className="cc-btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-mono text-xs text-ink-mute mb-2">PROJECT DETAIL</p>
              <div className="flex items-center gap-3">
                <h1 className="text-display-md font-semibold text-ink">{project.name}</h1>
                <span className="badge badge-success">Active</span>
              </div>
              <p className="text-ink-body mt-1">{project.description}</p>
              <div className="flex gap-4 mt-2 text-body-sm text-ink-mute">
                <span>Project ID: <code className="text-ink font-mono text-caption">{project.projectId}</code></span>
                <span>Network: {project.network}</span>
                <span>SDK: {project.sdkVersion}</span>
              </div>
            </>
          )}
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="cc-btn-secondary">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Project
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-hairline">
        {(["overview", "sdk", "env"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-body-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-ink text-ink"
                : "border-transparent text-ink-mute hover:text-ink"
            }`}
          >
            {tab === "overview" && <><BarChart2 className="w-4 h-4" /> Overview</>}
            {tab === "sdk" && <><Code2 className="w-4 h-4" /> SDK Setup</>}
            {tab === "env" && <><Settings2 className="w-4 h-4" /> Environment Variables</>}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Total Requests" value="842,301" icon={BarChart3} />
            <StatCard label="Avg Latency" value="42ms" icon={Zap} />
            <StatCard label="Error Rate" value="0.12%" icon={AlertTriangle} />
            <StatCard label="API Keys" value="2" icon={Key} />
          </div>

          {/* Usage Chart */}
          <div className="cc-card">
            <h2 className="text-body-lg font-semibold text-ink mb-4">API Requests (Last 30 Days)</h2>
            <div className="h-52 flex items-end gap-2 px-2">
              {usageData.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-link/80 rounded-t-sm hover:bg-link transition-colors min-h-[4px]"
                    style={{ height: `${(d.requests / maxRequests) * 180}px` }}
                    title={`${d.date}: ${d.requests.toLocaleString()} requests`}
                  />
                  <span className="text-[10px] text-ink-mute rotate-[-30deg] origin-top-left whitespace-nowrap">
                    {d.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Users Chart */}
          <div className="cc-card">
            <h2 className="text-body-lg font-semibold text-ink mb-4">Active Users (Last 30 Days)</h2>
            <div className="h-52 flex items-end gap-2 px-2">
              {usageData.map((d) => {
                const maxUsers = Math.max(...usageData.map((u) => u.users));
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-success/80 rounded-t-sm hover:bg-success transition-colors min-h-[4px]"
                      style={{ height: `${(d.users / maxUsers) * 180}px` }}
                      title={`${d.date}: ${d.users.toLocaleString()} users`}
                    />
                    <span className="text-[10px] text-ink-mute rotate-[-30deg] origin-top-left whitespace-nowrap">
                      {d.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Keys */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body-lg font-semibold text-ink">API Keys</h2>
              <button className="cc-btn-primary">+ Generate Key</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key</th>
                    <th>Permissions</th>
                    <th>Last Used</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-canvas-soft transition-colors">
                      <td className="font-medium text-ink">{key.name}</td>
                      <td className="font-mono text-caption text-ink-body">{key.prefix}</td>
                      <td>
                        <span className="badge badge-neutral">
                          {key.permissions.charAt(0).toUpperCase() + key.permissions.slice(1)}
                        </span>
                      </td>
                      <td className="text-ink-mute">{key.lastUsed}</td>
                      <td className="text-ink-mute">{key.createdAt}</td>
                      <td>
                        <button className="text-danger text-body-sm font-medium hover:underline">
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SDK Setup Tab */}
      {activeTab === "sdk" && (
        <div className="cc-card">
          <h2 className="text-body-lg font-semibold text-ink mb-2">SDK Integration</h2>
          <p className="text-body-sm text-ink-body mb-4">
            Add the Cinacoin SDK to your project. Copy the snippet below for your framework.
          </p>

          {/* Framework Tabs */}
          <div className="flex gap-1 mb-4">
            {(["react", "vue", "nextjs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSdkTab(tab)}
                className={`px-3 py-2 text-body-sm font-medium rounded-full transition-colors ${
                  sdkTab === tab
                    ? "bg-primary text-on-primary"
                    : "bg-canvas-soft text-ink-body hover:text-ink"
                }`}
              >
                {tab === "react" && "React"}
                {tab === "vue" && "Vue"}
                {tab === "nextjs" && "Next.js"}
              </button>
            ))}
          </div>

          {/* Code Block */}
          <div className="relative">
            <pre className="cc-code-block">
              <code>{sdkSnippets[sdkTab]}</code>
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(sdkSnippets[sdkTab]).catch(() => {})}
              className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-caption bg-canvas/10 hover:bg-canvas/20 text-on-primary rounded transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>

          {/* Install Command */}
          <div className="mt-4 p-3 bg-canvas-soft rounded-lg border border-hairline">
            <p className="text-caption text-ink-mute mb-1">Install the package:</p>
            <code className="text-body-sm font-mono text-ink">
              {sdkTab === "vue"
                ? "npm install @cinacoin/sdk-vue"
                : sdkTab === "nextjs"
                ? "npm install @cinacoin/sdk-next"
                : "npm install @cinacoin/sdk-react"}
            </code>
          </div>
        </div>
      )}

      {/* Environment Variables Tab */}
      {activeTab === "env" && (
        <div className="space-y-4">
          <div className="cc-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-body-lg font-semibold text-ink">Environment Variables</h2>
                <p className="text-body-sm text-ink-body mt-1">
                  Configure environment variables for your project. Secret values are masked.
                </p>
              </div>
              <button onClick={() => setShowAddEnv(true)} className="cc-btn-primary">
                + Add Variable
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Type</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {envVars.map((env) => (
                    <tr key={env.key} className="hover:bg-canvas-soft transition-colors">
                      <td className="font-mono text-body-sm font-medium text-ink">{env.key}</td>
                      <td className="font-mono text-caption text-ink-body">{env.value}</td>
                      <td>
                        <span className={`badge ${env.secret ? "badge-warning" : "badge-neutral"}`}>
                          {env.secret ? "Secret" : "Plain"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemoveEnvVar(env.key)}
                          className="text-danger text-body-sm font-medium hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Env Var Form */}
          {showAddEnv && (
            <div className="cc-card">
              <h3 className="text-body-sm font-semibold text-ink mb-3">Add Environment Variable</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-body-sm text-ink-body mb-1">Key</label>
                  <input
                    type="text"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                    className="cc-form-input font-mono"
                    placeholder="MY_VARIABLE_KEY"
                  />
                </div>
                <div>
                  <label className="block text-body-sm text-ink-body mb-1">Value</label>
                  <input
                    type="text"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    className="cc-form-input font-mono"
                    placeholder="variable value"
                  />
                </div>
                <label className="flex items-center gap-2 text-body-sm text-ink-body cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEnvSecret}
                    onChange={(e) => setNewEnvSecret(e.target.checked)}
                  />
                  Mark as secret (value will be masked)
                </label>
                <div className="flex gap-2">
                  <button onClick={handleAddEnvVar} className="cc-btn-primary">
                    Add Variable
                  </button>
                  <button onClick={() => setShowAddEnv(false)} className="cc-btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
