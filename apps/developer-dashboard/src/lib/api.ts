/**
 * CinaCoin Developer Dashboard — Production API Client
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - GET request deduplication
 * - Token refresh on 401
 * - Comprehensive error handling
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.cinacoin.com/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiError extends Error {
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

export class TimeoutError extends Error {
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
