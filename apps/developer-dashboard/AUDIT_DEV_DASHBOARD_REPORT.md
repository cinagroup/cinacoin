# Cinacoin Developer Dashboard — Comprehensive Audit Report

**Date:** 2026-06-11  
**Auditor:** 000 (OpenClaw Subagent)  
**Scope:** Developer experience, API docs integration, code examples, debug tools, error boundaries & recovery

---

## Executive Summary

The Developer Dashboard is a well-structured Next.js 14 static-export application with clean component architecture and consistent design token usage. However, it has **critical gaps** in five areas:

| Area | Severity | Status |
|------|----------|--------|
| Developer Experience | 🔴 High | Missing loading states, auth flow, notifications, keyboard shortcuts |
| API Documentation Integration | 🔴 High | No inline API reference, no API explorer/tester |
| Code Example Quality | 🟡 Medium | SDK snippets exist but limited; no live playground |
| Debug Tool Support | 🔴 High | Zero debug tooling — no request logger, API tester, or webhook inspector |
| Error Boundaries & Recovery | 🔴 Critical | No error boundaries anywhere; no retry logic; no offline handling |

### Additional Bugs Found

| Issue | Severity | Location |
|-------|----------|----------|
| ~~`cc-btn-primary` missing~~ — actually defined in `@cinacoin/design-tokens/css/cinacoin.css` (imported via globals.css). Not a bug. | ✅ OK | Design tokens |
| Login form has no submit handler — button does nothing | 🔴 Functional | `login/page.tsx` |
| `recharts` in package.json but never imported — dead dependency | 🟡 Cleanup | `package.json` |
| No `loading.tsx` files for any route — transitions feel janky | 🟡 UX | All routes |
| API client has no retry, timeout, or request deduplication | 🟡 Reliability | `lib/api.ts` |
| `next.config.mjs` has `output: 'export'` but wrangler.toml expects Pages — incompatible | 🟡 Deploy | Config files |

---

## 1. Developer Experience Optimization

### 1.1 Missing Loading States

**Problem:** No `loading.tsx` files exist for any route. When navigating between pages, users see nothing until the page fully renders.

**Fix:** Add skeleton loading states for all routes.

```tsx
// src/app/loading.tsx (root loading)
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-canvas-soft-2 rounded" />
      <div className="h-4 w-96 bg-canvas-soft-2 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc-card h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc-card h-40" />
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/app/projects/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-canvas-soft-2 rounded" />
        <div className="h-10 w-28 bg-canvas-soft-2 rounded-full" />
      </div>
      <div className="table-container">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 border-b border-hairline" />
        ))}
      </div>
    </div>
  );
}
```

### 1.2 No Toast/Notification System

**Problem:** Destructive actions (revoke key, delete project) happen silently. No confirmation dialogs, no success/error feedback.

**Fix:** Add a lightweight toast system.

```tsx
// src/components/Toast.tsx
"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const icons: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="cc-card flex items-start gap-3 py-3 px-4 shadow-lg animate-slide-in"
            role="alert"
          >
            <span aria-hidden="true">{icons[toast.type]}</span>
            <p className="text-body-sm text-ink flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-ink-mute hover:text-ink text-body-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

### 1.3 No Auth State Management

**Problem:** Login page has no submit handler. No auth context. Token stored in localStorage with no expiry check, no refresh logic, no redirect after login.

**Fix:** Add auth context with proper state management.

```tsx
// src/providers/AuthProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginSIWE: (message: string, signature: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("cc_auth_token");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    auth
      .me()
      .then((user) => setState({ user, isLoading: false, isAuthenticated: true, error: null }))
      .catch(() => {
        localStorage.removeItem("cc_auth_token");
        setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { token, user } = await auth.login(email, password);
      localStorage.setItem("cc_auth_token", token);
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
      router.push("/");
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message, isLoading: false }));
    }
  }, [router]);

  const loginSIWE = useCallback(async (message: string, signature: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { token, user } = await auth.loginSIWE(message, signature);
      localStorage.setItem("cc_auth_token", token);
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
      router.push("/");
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message, isLoading: false }));
    }
  }, [router]);

  const logout = useCallback(() => {
    auth.logout();
    setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
    router.push("/login");
  }, [router]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginSIWE, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 1.4 Missing Keyboard Shortcuts & Command Palette

**Problem:** No keyboard shortcuts for common actions. Developers expect `Cmd+K` command palettes in dev tools.

**Fix:** Add a lightweight command palette.

```tsx
// src/components/CommandPalette.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Command {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    { id: "projects", label: "Go to Projects", icon: "📦", shortcut: "G P", action: () => router.push("/projects") },
    { id: "keys", label: "Go to API Keys", icon: "🔑", shortcut: "G K", action: () => router.push("/api-keys") },
    { id: "analytics", label: "Go to Analytics", icon: "📈", shortcut: "G A", action: () => router.push("/analytics") },
    { id: "new-project", label: "Create New Project", icon: "➕", action: () => router.push("/projects/new") },
    { id: "new-key", label: "Generate API Key", icon: "🔑", action: () => router.push("/api-keys") },
    { id: "settings", label: "Go to Settings", icon: "⚙️", shortcut: "G S", action: () => router.push("/settings") },
    { id: "docs", label: "Open Documentation", icon: "📖", action: () => window.open("https://docs.cinacoin.com", "_blank") },
    { id: "billing", label: "Go to Billing", icon: "💳", action: () => router.push("/billing") },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
      setQuery("");
    }
    if (e.key === "Escape" && open) {
      setOpen(false);
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg cc-card p-0 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
          <span className="text-ink-mute">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            className="flex-1 text-body-sm outline-none bg-transparent text-ink"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="text-caption text-ink-mute bg-canvas-soft px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-body-sm text-ink-mute text-center py-4">No commands found</p>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-canvas-soft transition-colors"
                onClick={() => { cmd.action(); setOpen(false); }}
              >
                <span aria-hidden="true">{cmd.icon}</span>
                <span className="text-body-sm text-ink flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="text-caption text-ink-mute">{cmd.shortcut}</kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 2. API Documentation Integration

### 2.1 No Inline API Reference

**Problem:** Developers must leave the dashboard to read docs at docs.cinacoin.com. No inline endpoint reference, no request/response schemas, no status code documentation.

**Fix:** Add an API Reference page within the dashboard.

```tsx
// src/app/api-reference/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference — Cinacoin Developer Dashboard",
  description: "Complete Cinacoin API endpoint reference with request/response examples",
};

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  responseExample: string;
}

const endpoints: { section: string; items: Endpoint[] }[] = [
  {
    section: "Authentication",
    items: [
      {
        method: "POST",
        path: "/v1/auth/login",
        summary: "Authenticate with email and password",
        auth: false,
        params: [
          { name: "email", type: "string", required: true, desc: "User email address" },
          { name: "password", type: "string", required: true, desc: "User password" },
        ],
        responseExample: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_a1b2c3",
    "email": "dev@example.com",
    "name": "Developer"
  }
}`,
      },
      {
        method: "POST",
        path: "/v1/auth/siwe",
        summary: "Authenticate with Ethereum wallet (Sign-In with Ethereum)",
        auth: false,
        params: [
          { name: "message", type: "string", required: true, desc: "SIWE message" },
          { name: "signature", type: "string", required: true, desc: "Wallet signature" },
        ],
        responseExample: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "usr_a1b2c3", "walletAddress": "0x1234...5678" }
}`,
      },
      {
        method: "GET",
        path: "/v1/auth/me",
        summary: "Get current authenticated user",
        auth: true,
        responseExample: `{
  "id": "usr_a1b2c3",
  "email": "dev@example.com",
  "name": "Developer",
  "company": "Cinacoin Labs"
}`,
      },
    ],
  },
  {
    section: "Projects",
    items: [
      {
        method: "GET",
        path: "/v1/projects",
        summary: "List all projects for the authenticated user",
        auth: true,
        responseExample: `[
  {
    "id": "proj_a1b2c3",
    "name": "My dApp",
    "status": "active",
    "network": "mainnet",
    "createdAt": "2025-03-15T00:00:00Z"
  }
]`,
      },
      {
        method: "POST",
        path: "/v1/projects",
        summary: "Create a new project",
        auth: true,
        params: [
          { name: "name", type: "string", required: true, desc: "Project display name" },
          { name: "description", type: "string", required: false, desc: "Brief project description" },
          { name: "network", type: '"mainnet" | "testnet" | "both"', required: true, desc: "Target network" },
        ],
        responseExample: `{
  "id": "proj_x7y8z9",
  "name": "My dApp",
  "status": "active",
  "projectId": "cc_proj_...",
  "createdAt": "2026-06-11T00:00:00Z"
}`,
      },
    ],
  },
  {
    section: "API Keys",
    items: [
      {
        method: "GET",
        path: "/v1/projects/:projectId/keys",
        summary: "List API keys for a project",
        auth: true,
        responseExample: `[
  {
    "id": "key_a1b2",
    "name": "Production Key",
    "prefix": "cc_live_sk1_...a8f2",
    "permissions": "admin",
    "status": "active"
  }
]`,
      },
      {
        method: "POST",
        path: "/v1/projects/:projectId/keys",
        summary: "Generate a new API key (full key shown only once)",
        auth: true,
        params: [
          { name: "name", type: "string", required: true, desc: "Key label" },
          { name: "permissions", type: '"read" | "write" | "admin"', required: true, desc: "Access level" },
        ],
        responseExample: `{
  "id": "key_new",
  "name": "My Key",
  "key": "cc_live_sk1_full_key_here",
  "permissions": "read",
  "createdAt": "2026-06-11T00:00:00Z"
}`,
      },
      {
        method: "DELETE",
        path: "/v1/projects/:projectId/keys/:keyId",
        summary: "Revoke an API key permanently",
        auth: true,
        responseExample: `// 204 No Content`,
      },
    ],
  },
  {
    section: "Analytics",
    items: [
      {
        method: "GET",
        path: "/v1/projects/:projectId/analytics/usage",
        summary: "Get API usage statistics",
        auth: true,
        params: [
          { name: "from", type: "string (ISO date)", required: true, desc: "Start date" },
          { name: "to", type: "string (ISO date)", required: true, desc: "End date" },
        ],
        responseExample: `{
  "total": 1284392,
  "daily": [{ "date": "2026-06-01", "requests": 52300 }],
  "avgLatency": 42
}`,
      },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-link/10 text-link",
  PATCH: "bg-warning/10 text-warning",
  DELETE: "bg-danger/10 text-danger",
};

export default function ApiReferencePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-md font-semibold text-ink">API Reference</h1>
        <p className="text-ink-body mt-1">
          Complete reference for the Cinacoin API. Base URL:{" "}
          <code className="text-caption bg-canvas-soft px-2 py-1 rounded font-mono">
            https://api.cinacoin.com
          </code>
        </p>
      </div>

      {/* Authentication Info */}
      <div className="cc-card bg-canvas-soft border-hairline">
        <p className="text-body-sm text-ink-body">
          🔐 <strong>Authentication:</strong> All endpoints marked with 🔒 require a Bearer token
          in the <code className="text-caption bg-canvas px-1 rounded">Authorization</code> header.
          Obtain a token via <code className="text-caption bg-canvas px-1 rounded">/auth/login</code> or{" "}
          <code className="text-caption bg-canvas px-1 rounded">/auth/siwe</code>.
        </p>
      </div>

      {endpoints.map((section) => (
        <div key={section.section} className="space-y-4">
          <h2 className="text-body-lg font-semibold text-ink border-b border-hairline pb-2">
            {section.section}
          </h2>
          {section.items.map((ep) => (
            <div key={`${ep.method}-${ep.path}`} className="cc-card">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-caption font-bold px-2 py-0.5 rounded ${methodColors[ep.method]}`}
                >
                  {ep.method}
                </span>
                <code className="text-body-sm font-mono text-ink">{ep.path}</code>
                {ep.auth && <span title="Requires authentication">🔒</span>}
              </div>
              <p className="text-body-sm text-ink-body mb-3">{ep.summary}</p>

              {ep.params && ep.params.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-caption font-medium text-ink-mute uppercase mb-2">Parameters</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ep.params.map((p) => (
                          <tr key={p.name}>
                            <td className="font-mono text-body-sm text-ink">{p.name}</td>
                            <td className="font-mono text-caption text-ink-body">{p.type}</td>
                            <td>
                              {p.required ? (
                                <span className="badge badge-danger">Required</span>
                              ) : (
                                <span className="badge badge-neutral">Optional</span>
                              )}
                            </td>
                            <td className="text-body-sm text-ink-body">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-caption font-medium text-ink-mute uppercase mb-2">Response</h4>
                <pre className="bg-[#1a1a1a] text-[#e5e5e5] p-3 rounded-lg overflow-x-auto text-caption font-mono leading-relaxed">
                  <code>{ep.responseExample}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 2.2 Add API Reference to Sidebar

```tsx
// In src/components/Sidebar.tsx, add to navItems:
const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/projects", label: "Projects", icon: "📦" },
  { href: "/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/api-reference", label: "API Reference", icon: "📖" },  // ← NEW
  { href: "/billing", label: "Billing", icon: "💳" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];
```

---

## 3. Code Example Quality

### 3.1 Expand SDK Snippets & Add Error Handling Examples

**Problem:** Only React/Vue/Next.js snippets. No Python, Go, cURL. No error handling examples. No response type definitions.

**Fix:** Expand the SDK tab in `src/app/projects/[id]/page.tsx`:

```tsx
// Add these to the sdkSnippets record:
type SdkTab = "react" | "vue" | "nextjs" | "curl" | "python";

const sdkSnippets: Record<SdkTab, string> = {
  // ... existing react, vue, nextjs ...
  
  curl: `# Get project details
curl -X GET "https://api.cinacoin.com/v1/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Create a new project
curl -X POST "https://api.cinacoin.com/v1/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My dApp",
    "description": "A sample project",
    "network": "mainnet"
  }'

# List API keys
curl -X GET "https://api.cinacoin.com/v1/projects/PROJECT_ID/keys" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,

  python: `import cinacoin

# Initialize client
client = cinacoin.Client(api_key="cc_live_sk1_...")

# List projects
projects = client.projects.list()
for project in projects:
    print(f"{project.name}: {project.status}")

# Create a project
project = client.projects.create(
    name="My dApp",
    network="mainnet",
    description="A sample project"
)

# Handle errors
try:
    key = client.api_keys.create(project.id, permissions="read")
    print(f"Key: {key.value}")  # Only available once!
except cinacoin.RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except cinacoin.AuthenticationError:
    print("Invalid API key")
except cinacoin.APIError as e:
    print(f"API error: {e.status_code} - {e.message}")`,
};
```

### 3.2 Add a Quick Start Guide Component

```tsx
// src/components/QuickStartGuide.tsx
"use client";
import { useState } from "react";

const steps = [
  {
    title: "Install the SDK",
    code: "npm install @cinacoin/sdk-react",
    language: "bash",
  },
  {
    title: "Initialize the provider",
    code: `import { CinacoinProvider } from "@cinacoin/sdk-react";

function App() {
  return (
    <CinacoinProvider projectId="YOUR_PROJECT_ID" network="mainnet">
      <YourApp />
    </CinacoinProvider>
  );
}`,
    language: "tsx",
  },
  {
    title: "Connect a wallet",
    code: `import { useCinacoin } from "@cinacoin/sdk-react";

function ConnectButton() {
  const { connect, account, isConnected } = useCinacoin();
  
  return (
    <button onClick={connect}>
      {isConnected ? \`Connected: \${account}\` : "Connect Wallet"}
    </button>
  );
}`,
    language: "tsx",
  },
  {
    title: "Make an API call",
    code: `import { useCinacoin } from "@cinacoin/sdk-react";

function Balance() {
  const { getBalance, balance, loading } = useCinacoin();
  
  useEffect(() => { getBalance(); }, []);
  
  if (loading) return <span>Loading...</span>;
  return <span>Balance: {balance} CINA</span>;
}`,
    language: "tsx",
  },
];

export default function QuickStartGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(steps[activeStep].code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="cc-card">
      <h2 className="text-body-lg font-semibold text-ink mb-4">🚀 Quick Start</h2>
      
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-caption font-medium transition-colors ${
              i === activeStep
                ? "bg-ink text-[var(--color-on-primary)]"
                : i < activeStep
                ? "bg-success/10 text-success"
                : "bg-canvas-soft text-ink-mute hover:text-ink"
            }`}
          >
            <span>{i < activeStep ? "✓" : i + 1}</span>
            <span className="hidden sm:inline">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Active step */}
      <div>
        <h3 className="text-body-sm font-medium text-ink mb-2">
          Step {activeStep + 1}: {steps[activeStep].title}
        </h3>
        <div className="relative">
          <pre className="bg-[#1a1a1a] text-[#e5e5e5] p-4 rounded-lg overflow-x-auto text-body-sm font-mono leading-relaxed">
            <code>{steps[activeStep].code}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-2 py-1 text-caption bg-[var(--color-canvas)]/10 hover:bg-[var(--color-canvas)]/20 text-[var(--color-on-primary)] rounded transition-colors"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
          disabled={activeStep === 0}
          className="cc-btn-secondary disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}
          disabled={activeStep === steps.length - 1}
          className="cc-btn-primary disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Debug Tool Support

### 4.1 API Request Logger / Console

**Problem:** Zero debug tooling. Developers can't inspect API calls, test endpoints, or debug webhook payloads from within the dashboard.

**Fix:** Add a debug panel accessible via `Cmd+Shift+D` or a sidebar toggle.

```tsx
// src/components/DebugPanel.tsx
"use client";
import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  error?: string;
}

// Monkey-patch fetch to log requests
const originalFetch = globalThis.fetch;
const listeners = new Set<(entry: LogEntry) => void>();

globalThis.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const start = performance.now();
  const method = init?.method || "GET";
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  try {
    const response = await originalFetch(input, init);
    const duration = Math.round(performance.now() - start);
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      method,
      url,
      status: response.status,
      duration,
      requestSize: new Blob([init?.body?.toString() || ""]).size,
      responseSize: 0, // Would need to clone response to measure
    };
    listeners.forEach((fn) => fn(entry));
    return response;
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      method,
      url,
      status: 0,
      duration,
      requestSize: 0,
      responseSize: 0,
      error: (err as Error).message,
    };
    listeners.forEach((fn) => fn(entry));
    throw err;
  }
};

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "errors" | "slow">("all");

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, 200)); // Keep last 200
  }, []);

  useEffect(() => {
    listeners.add(addLog);
    return () => { listeners.delete(addLog); };
  }, [addLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "d") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === "errors") return log.status >= 400 || log.error;
    if (filter === "slow") return log.duration > 1000;
    return true;
  });

  const statusColor = (status: number) => {
    if (status === 0) return "text-ink-mute";
    if (status < 300) return "text-success";
    if (status < 400) return "text-warning";
    return "text-danger";
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-72 bg-[#1a1a1a] text-[#e5e5e5] border-t-2 border-warning z-50 flex flex-col font-mono text-caption">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-[#333]">
        <div className="flex items-center gap-4">
          <span className="font-bold text-warning">🔧 Debug Console</span>
          <div className="flex gap-1">
            {(["all", "errors", "slow"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-caption ${
                  filter === f ? "bg-[#333] text-white" : "text-[#888] hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-[#888]">{filteredLogs.length} requests</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLogs([])} className="text-[#888] hover:text-white px-2">
            Clear
          </button>
          <button onClick={() => setOpen(false)} className="text-[#888] hover:text-white px-2">
            ✕
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#666]">
            No requests captured yet. Interact with the dashboard to see API calls.
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-[#252525]">
              <tr className="text-[#888]">
                <th className="px-3 py-1 text-left w-20">Method</th>
                <th className="px-3 py-1 text-left">URL</th>
                <th className="px-3 py-1 text-left w-16">Status</th>
                <th className="px-3 py-1 text-left w-20">Duration</th>
                <th className="px-3 py-1 text-left w-32">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-[#333] hover:bg-[#252525]">
                  <td className="px-3 py-1">
                    <span className={log.method === "GET" ? "text-success" : "text-link"}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-3 py-1 truncate max-w-md">{log.url}</td>
                  <td className={`px-3 py-1 ${statusColor(log.status)}`}>
                    {log.error ? "ERR" : log.status}
                  </td>
                  <td className={`px-3 py-1 ${log.duration > 1000 ? "text-danger" : "text-[#888]"}`}>
                    {log.duration}ms
                  </td>
                  <td className="px-3 py-1 text-[#888]">
                    {log.timestamp.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

### 4.2 Add API Tester / Playground

```tsx
// src/app/api-reference/ApiTester.tsx
"use client";
import { useState } from "react";

export default function ApiTester() {
  const [method, setMethod] = useState<"GET" | "POST" | "PATCH" | "DELETE">("GET");
  const [path, setPath] = useState("/v1/projects");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(`https://api.cinacoin.com${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        ...(body && method !== "GET" ? { body } : {}),
      });
      setStatus(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setStatus(0);
      setResponse(`Network Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-card mt-6">
      <h3 className="text-body-lg font-semibold text-ink mb-4">🧪 API Tester</h3>
      
      <div className="flex gap-2 mb-4">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
          className="cc-form-input w-28"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="cc-form-input flex-1 font-mono"
          placeholder="/v1/projects"
        />
        <button onClick={handleSend} disabled={loading} className="cc-btn-primary disabled:opacity-50">
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="cc-form-input font-mono"
          placeholder="API Key (Bearer token)"
        />
      </div>

      {method !== "GET" && (
        <div className="mb-4">
          <label className="block text-caption text-ink-mute mb-1">Request Body (JSON)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="cc-form-input font-mono min-h-[100px] resize-y"
            placeholder='{"name": "My Project"}'
          />
        </div>
      )}

      {status !== null && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-caption font-medium text-ink-mute">Response</span>
            <span className={`badge ${status < 300 ? "badge-success" : status < 400 ? "badge-warning" : "badge-danger"}`}>
              {status || "Error"}
            </span>
          </div>
          <pre className="bg-[#1a1a1a] text-[#e5e5e5] p-4 rounded-lg overflow-x-auto text-caption font-mono max-h-64 overflow-y-auto">
            <code>{response}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Production Error Boundaries & Recovery

### 5.1 Global Error Boundary (CRITICAL — MISSING)

**Problem:** No `error.tsx` at any level. A single component crash renders a blank page with no recovery path.

**Fix:** Add Next.js error boundaries at root and per-route.

```tsx
// src/app/error.tsx — Global error boundary
"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Cinacoin Dashboard Error]", error);
    // In production, report to error tracking service
    // Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="cc-card max-w-md text-center space-y-4">
        <div className="text-4xl" aria-hidden="true">⚠️</div>
        <h1 className="text-display-sm font-semibold text-ink">Something went wrong</h1>
        <p className="text-body-sm text-ink-body">
          {error.digest ? `Error ID: ${error.digest}` : "An unexpected error occurred while rendering this page."}
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="text-left">
            <summary className="text-caption text-ink-mute cursor-pointer">Error details</summary>
            <pre className="mt-2 p-3 bg-canvas-soft rounded text-caption font-mono text-danger overflow-x-auto">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="cc-btn-primary">
            Try again
          </button>
          <a href="/" className="cc-btn-secondary">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/app/global-error.tsx — Catches errors in root layout
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "2rem",
        }}>
          <div style={{
            border: "1px solid #ebebeb", borderRadius: "8px", padding: "2rem",
            maxWidth: "28rem", textAlign: "center", background: "white",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Application Error
            </h1>
            <p style={{ color: "#4d4d4d", fontSize: "0.875rem", marginBottom: "1rem" }}>
              A critical error occurred. The application could not be rendered.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem", background: "#171717", color: "white",
                border: "none", borderRadius: "100px", cursor: "pointer", fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### 5.2 Per-Route Error Boundaries

```tsx
// src/app/projects/error.tsx
"use client";
import Link from "next/link";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="cc-card text-center py-12 space-y-4">
      <div className="text-4xl">📦</div>
      <h2 className="text-display-sm font-semibold text-ink">Failed to load projects</h2>
      <p className="text-body-sm text-ink-body">{error.message}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="cc-btn-primary">Retry</button>
        <Link href="/" className="cc-btn-secondary">Go Home</Link>
      </div>
    </div>
  );
}
```

```tsx
// src/app/analytics/error.tsx
"use client";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="cc-card text-center py-12 space-y-4">
      <div className="text-4xl">📈</div>
      <h2 className="text-display-sm font-semibold text-ink">Failed to load analytics</h2>
      <p className="text-body-sm text-ink-body">{error.message}</p>
      <button onClick={reset} className="cc-btn-primary">Retry</button>
    </div>
  );
}
```

### 5.3 API Client with Retry, Timeout & Recovery

**Problem:** Current `lib/api.ts` has no timeout, no retry, no request deduplication, no token refresh.

**Fix:** Replace the API client with a production-grade version.

```tsx
// src/lib/api.ts — Production-grade API client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.cinacoin.com/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public digest?: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class TimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.name = "TimeoutError";
  }
}

// Simple in-memory cache for GET deduplication
const pendingRequests = new Map<string, Promise<unknown>>();

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    timeout = 15_000,
    retries = method === "GET" ? 2 : 0,
    retryDelay = 1000,
  } = options;

  const token = typeof window !== "undefined" ? localStorage.getItem("cc_auth_token") : null;

  // Deduplicate identical GET requests
  const cacheKey = `${method}:${path}`;
  if (method === "GET" && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>;
  }

  const makeRequest = async (attempt: number): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 — attempt token refresh
      if (res.status === 401 && attempt === 0) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) return makeRequest(1);
      }

      // Retry on 5xx or 429
      if ((res.status >= 500 || res.status === 429) && attempt < retries) {
        const retryAfter = res.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return makeRequest(attempt + 1);
      }

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: res.statusText }));
        throw new ApiError(
          errorBody.message || `API Error: ${res.status}`,
          res.status,
          errorBody.digest,
          res.status >= 500 || res.status === 429,
        );
      }

      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          return makeRequest(attempt + 1);
        }
        throw new TimeoutError(path, timeout);
      }
      if (err instanceof ApiError) throw err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        return makeRequest(attempt + 1);
      }
      throw err;
    }
  };

  const promise = makeRequest(0);

  if (method === "GET") {
    pendingRequests.set(cacheKey, promise);
    promise.finally(() => pendingRequests.delete(cacheKey));
  }

  return promise;
}

async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("cc_refresh_token");
    if (!refreshToken) return false;
    
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!res.ok) return false;
    
    const { token, refresh_token } = await res.json();
    localStorage.setItem("cc_auth_token", token);
    if (refresh_token) localStorage.setItem("cc_refresh_token", refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; refresh_token?: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  loginSIWE: (message: string, signature: string) =>
    request<{ token: string; refresh_token?: string; user: User }>("/auth/siwe", {
      method: "POST",
      body: { message, signature },
    }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cc_auth_token");
      localStorage.removeItem("cc_refresh_token");
    }
  },

  me: () => request<User>("/auth/me"),
};

// ─── Projects ──────────────────────────────────────────────────────────────────

export const projects = {
  list: () => request<Project[]>("/projects"),
  get: (id: string) => request<Project>(`/projects/${id}`),
  create: (data: CreateProjectInput) =>
    request<Project>("/projects", { method: "POST", body: data }),
  update: (id: string, data: Partial<CreateProjectInput>) =>
    request<Project>(`/projects/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),
};

// ─── API Keys ──────────────────────────────────────────────────────────────────

export const apiKeys = {
  list: (projectId: string) => request<ApiKey[]>(`/projects/${projectId}/keys`),
  create: (projectId: string, data: CreateApiKeyInput) =>
    request<ApiKey & { key: string }>(`/projects/${projectId}/keys`, { method: "POST", body: data }),
  revoke: (projectId: string, keyId: string) =>
    request<void>(`/projects/${projectId}/keys/${keyId}`, { method: "DELETE" }),
};

// ─── Analytics ─────────────────────────────────────────────────────────────────

export const analytics = {
  usage: (projectId: string, params: { from: string; to: string }) =>
    request<UsageData>(`/projects/${projectId}/analytics/usage?from=${params.from}&to=${params.to}`),
  errors: (projectId: string, params: { from: string; to: string }) =>
    request<ErrorData>(`/projects/${projectId}/analytics/errors?from=${params.from}&to=${params.to}`),
  chains: (projectId: string) =>
    request<ChainUsage[]>(`/projects/${projectId}/analytics/chains`),
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  walletAddress?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "inactive";
  network: string;
  sdkVersion: string;
  createdAt: string;
  projectId: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  network: "mainnet" | "testnet" | "both";
  sdkVersion: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: "read" | "write" | "admin";
  lastUsed: string;
  createdAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  permissions: "read" | "write" | "admin";
}

export interface UsageData {
  total: number;
  daily: { date: string; requests: number }[];
  avgLatency: number;
}

export interface ErrorData {
  total: number;
  rate: number;
  breakdown: { type: string; count: number }[];
}

export interface ChainUsage {
  chain: string;
  requests: number;
  percentage: number;
}

export { ApiError, TimeoutError };
```

### 5.4 Offline Detection & Recovery Banner

```tsx
// src/components/OfflineBanner.tsx
"use client";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-warning text-black text-center py-2 text-body-sm font-medium z-[100]"
      role="alert"
    >
      ⚠️ You are offline. Some features may not work until connection is restored.
    </div>
  );
}
```

---

## 6. CSS Notes

### 6.1 Design Token Classes — OK

`cc-btn-primary`, `cc-btn-secondary`, `cc-form-input` are all defined in `@cinacoin/design-tokens/css/cinacoin.css` and imported via `globals.css`. No missing class issues.

However, `globals.css` also defines legacy `btn-primary` / `btn-secondary` / `btn-danger` classes that duplicate the design token versions. These should be cleaned up to avoid confusion.

### 6.2 Remove Duplicate Legacy CSS

**Fix:** Remove the legacy `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`, `.input`, `.table-container` definitions from `globals.css` since the `cc-*` prefixed versions from design tokens are the canonical ones. This reduces CSS bloat and prevents accidental use of inconsistent styles.

---

## 7. Integration: Updated Layout with All Providers

```tsx
// src/app/layout.tsx — Updated with providers
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/providers/AuthProvider";
import CommandPalette from "@/components/CommandPalette";
import DebugPanel from "@/components/DebugPanel";
import OfflineBanner from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "Cinacoin Developer Dashboard",
  description: "Manage your Cinacoin projects, API keys, and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <OfflineBanner />
        <AuthProvider>
          <ToastProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main id="main-content" className="flex-1 p-6 bg-canvas-soft-2">
                {children}
              </main>
            </div>
            <CommandPalette />
            <DebugPanel />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 8. Summary of All Recommended New Files

| File | Purpose |
|------|---------|
| `src/app/error.tsx` | Global error boundary with retry |
| `src/app/global-error.tsx` | Root layout error boundary |
| `src/app/loading.tsx` | Root skeleton loading |
| `src/app/projects/loading.tsx` | Projects skeleton |
| `src/app/projects/error.tsx` | Projects error boundary |
| `src/app/analytics/error.tsx` | Analytics error boundary |
| `src/app/api-reference/page.tsx` | Inline API documentation |
| `src/app/api-reference/ApiTester.tsx` | API playground/tester |
| `src/components/Toast.tsx` | Toast notification system |
| `src/components/CommandPalette.tsx` | Cmd+K command palette |
| `src/components/DebugPanel.tsx` | Debug console (Cmd+Shift+D) |
| `src/components/OfflineBanner.tsx` | Offline detection banner |
| `src/components/QuickStartGuide.tsx` | Step-by-step SDK quick start |
| `src/providers/AuthProvider.tsx` | Auth state management |

---

## 9. Priority Implementation Order

1. 🔴 **CRITICAL:** `error.tsx` + `global-error.tsx` (error boundaries)
2. 🔴 **CRITICAL:** Fix `cc-btn-primary` / `cc-btn-secondary` CSS
3. 🔴 **HIGH:** Upgrade `lib/api.ts` with retry/timeout/token refresh
4. 🔴 **HIGH:** Add `loading.tsx` skeleton states
5. 🔴 **HIGH:** Add `ToastProvider` + notification system
6. 🔴 **HIGH:** Fix login page (wire up form handler + AuthProvider)
7. 🟡 **MEDIUM:** Add API Reference page + sidebar link
8. 🟡 **MEDIUM:** Add Debug Panel
9. 🟡 **MEDIUM:** Add Command Palette
10. 🟡 **MEDIUM:** Add Offline Banner
11. 🟢 **NICE-TO-HAVE:** Expand SDK snippets (cURL, Python)
12. 🟢 **NICE-TO-HAVE:** Quick Start Guide component
13. 🟢 **NICE-TO-HAVE:** API Tester playground
14. 🟢 **CLEANUP:** Remove unused `recharts` dependency

---

*End of audit report.*
