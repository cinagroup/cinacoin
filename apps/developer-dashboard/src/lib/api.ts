/**
 * Cinacoin Developer Dashboard — API Client
 *
 * Centralized API calls for the developer dashboard.
 * In production, these hit the Cinacoin API gateway.
 * For the static export, mock data is used directly in pages.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.cinacoin.com/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = typeof window !== "undefined" ? localStorage.getItem("cc_auth_token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  loginSIWE: (message: string, signature: string) =>
    request<{ token: string; user: User }>("/auth/siwe", {
      method: "POST",
      body: { message, signature },
    }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cc_auth_token");
    }
  },

  me: () => request<User>("/auth/me"),
};

// ─── Projects ──────────────────────────────────────────────────────────────────

export const projects = {
  list: () => request<Project[]>("/projects"),

  get: (id: string) => request<Project>(`/projects/${id}`),

  create: (data: CreateProjectInput) =>
    request<Project>("/projects", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: Partial<CreateProjectInput>) =>
    request<Project>(`/projects/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),
};

// ─── API Keys ──────────────────────────────────────────────────────────────────

export const apiKeys = {
  list: (projectId: string) => request<ApiKey[]>(`/projects/${projectId}/keys`),

  create: (projectId: string, data: CreateApiKeyInput) =>
    request<ApiKey & { key: string }>(`/projects/${projectId}/keys`, {
      method: "POST",
      body: data,
    }),

  revoke: (projectId: string, keyId: string) =>
    request<void>(`/projects/${projectId}/keys/${keyId}`, {
      method: "DELETE",
    }),
};

// ─── Analytics ─────────────────────────────────────────────────────────────────

export const analytics = {
  usage: (projectId: string, params: { from: string; to: string }) =>
    request<UsageData>(
      `/projects/${projectId}/analytics/usage?from=${params.from}&to=${params.to}`
    ),

  errors: (projectId: string, params: { from: string; to: string }) =>
    request<ErrorData>(
      `/projects/${projectId}/analytics/errors?from=${params.from}&to=${params.to}`
    ),

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
