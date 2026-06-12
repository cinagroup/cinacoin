import type {
  Project,
  ApiKey,
  ApiKeyWithPlain,
  CreateProjectInput,
  UpdateProjectInput,
  GenerateApiKeyInput,
  UsageStats,
  LoginResponse,
  RegisterResponse,
  User,
  TwoFactorVerifyResponse,
  OAuthProvider,
} from "@/types";

export const demoProjects: Project[] = [
  {
    id: "demo-1",
    name: "Demo Wallet App",
    description: "A demo wallet application using CinaCoin SDK",
    owner_address: "0xDemo",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    name: "NFT Marketplace",
    description: "Multi-chain NFT marketplace integration",
    owner_address: "0xDemo",
    status: "active",
    chain_ids: ["eth", "sol", "btc"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

import { getEnv } from '../env';

const env = getEnv();
const API_BASE = env.NEXT_PUBLIC_API_URL;
const AUTH_BASE = env.NEXT_PUBLIC_AUTH_URL;

interface ApiOptions extends Omit<RequestInit, "headers"> {
  ownerId?: string;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function fetchApi<T>(path: string, options?: ApiOptions): Promise<T> {
  const { ownerId, headers: extraHeaders, skipAuth, ...fetchOptions } = options || {};

  const url = new URL(`${API_BASE}${path}`);
  if (ownerId) url.searchParams.set("ownerId", ownerId);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };

  // Add auth token if available and not skipping auth
  if (!skipAuth && typeof window !== "undefined") {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Add CSRF token for state-changing requests
  const method = (fetchOptions.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const res = await fetch(url.toString(), {
    ...fetchOptions,
    headers,
    credentials: "include", // Include cookies for session management
  });

  // Handle 401 - attempt token refresh
  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = sessionStorage.getItem("access_token");
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      const retryRes = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
        credentials: "include",
      });
      if (!retryRes.ok) {
        const error = await retryRes.json().catch(() => ({ error: retryRes.statusText }));
        throw new Error(error.error || `API error: ${retryRes.status}`);
      }
      return retryRes.json();
    } else {
      // Refresh failed, redirect to login
      if (typeof window !== "undefined") {
        clearSession();
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

// CSRF Token Management
let csrfToken: string | null = null;

function getCsrfToken(): string | null {
  if (csrfToken) return csrfToken;
  if (typeof window !== "undefined") {
    csrfToken = sessionStorage.getItem("csrf_token");
  }
  return csrfToken;
}

export async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  const res = await fetch(`${AUTH_BASE}/auth/csrf-token`, {
    method: "GET",
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  
  const data = await res.json();
  csrfToken = data.token;
  
  if (typeof window !== "undefined") {
    sessionStorage.setItem("csrf_token", csrfToken!);
  }
  
  return csrfToken!;
}

// Session Management
export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  
  const accessToken = sessionStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const expiresAt = localStorage.getItem("token_expires_at");
  const userStr = localStorage.getItem("user");
  
  if (!accessToken || !refreshToken || !expiresAt) return null;
  
  // Check if token is expired
  if (Date.now() >= parseInt(expiresAt)) {
    clearSession();
    return null;
  }
  
  const user = userStr ? JSON.parse(userStr) : null;
  
  return {
    user,
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAt),
  };
}

export function setSession(data: LoginResponse): void {
  if (typeof window === "undefined") return;
  
  sessionStorage.setItem("access_token", data.accessToken ?? "");
  localStorage.setItem("refresh_token", data.refreshToken ?? "");
  localStorage.setItem("token_expires_at", String(Date.now() + (data.expiresIn ?? 0) * 1000));
  
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("csrf_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_expires_at");
  localStorage.removeItem("user");
  csrfToken = null;
}

export async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;
  
  try {
    const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    sessionStorage.setItem("access_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);
    localStorage.setItem("token_expires_at", String(Date.now() + data.expiresIn * 1000));
    
    return true;
  } catch {
    return false;
  }
}

// Authentication API
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || "Login failed");
  }
  
  const data = await res.json();
  
  // Handle 2FA required response
  if (data.requires2FA) {
    return {
      requires2FA: true,
      twoFactorToken: data.twoFactorToken,
      accessToken: "",
      refreshToken: "",
      expiresIn: 0,
    };
  }
  
  // Store session data
  setSession(data);
  
  // Fetch CSRF token after login
  await fetchCsrfToken();
  
  return data;
}

export async function verifyTwoFactor(code: string, twoFactorToken: string): Promise<TwoFactorVerifyResponse> {
  const res = await fetch(`${AUTH_BASE}/auth/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, token: twoFactorToken }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || "2FA verification failed");
  }
  
  const data = await res.json();
  
  // Store session data
  setSession(data);
  
  // Fetch CSRF token after 2FA
  await fetchCsrfToken();
  
  return data;
}

export async function register(email: string, username: string, password: string): Promise<RegisterResponse> {
  const res = await fetch(`${AUTH_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || "Registration failed");
  }
  
  const data = await res.json();
  
  // Store session data
  setSession(data);
  
  // Fetch CSRF token after registration
  await fetchCsrfToken();
  
  return data;
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      await fetch(`${AUTH_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });
    }
  } catch {
    // Ignore logout API errors
  } finally {
    clearSession();
  }
}

export async function getCurrentUser(): Promise<User> {
  return fetchApi<User>(`${AUTH_BASE}/auth/me`, { skipAuth: false });
}

// OAuth API
export function getOAuthUrl(provider: OAuthProvider): string {
  const redirectUri = typeof window !== "undefined" 
    ? `${window.location.origin}/oauth/callback` 
    : "";
  return `${AUTH_BASE}/auth/oauth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export async function exchangeOAuthCode(code: string): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE}/auth/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || "OAuth token exchange failed");
  }
  
  const data = await res.json();
  
  if (!data.success || !data.data) {
    throw new Error("Invalid OAuth response");
  }
  
  // Store session data
  setSession(data.data);
  
  // Fetch CSRF token after OAuth login
  await fetchCsrfToken();
  
  return data.data;
}

// Project API
export async function createProject(input: CreateProjectInput): Promise<Project> {
  return fetchApi<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
    ownerId: input.ownerId,
  });
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  return fetchApi<Project[]>("/api/projects", { ownerId });
}

export async function getProject(id: string, ownerId: string): Promise<Project> {
  return fetchApi<Project>(`/api/projects/${id}`, { ownerId });
}

export async function updateProject(
  id: string,
  ownerId: string,
  input: UpdateProjectInput
): Promise<Project> {
  return fetchApi<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    ownerId,
  });
}

export async function deleteProject(id: string, ownerId: string): Promise<void> {
  await fetchApi(`/api/projects/${id}`, {
    method: "DELETE",
    ownerId,
  });
}

// API Key API — paths match project-registry-api routes:
//   POST   /api/projects/:id/keys
//   GET    /api/projects/:id/keys
//   DELETE /api/projects/:id/keys/:keyId
// The backend returns the raw key once on creation (field `key`) and stores
// only its hash; list responses never include the secret.
interface RawApiKeyRow {
  id: string;
  project_id: string;
  label: string;
  permissions: string;
  is_active: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
  key?: string; // present only in the create response
}

function mapApiKey(row: RawApiKeyRow): ApiKey {
  return {
    id: row.id,
    projectId: row.project_id,
    keyHash: "",
    name: row.label,
    permissions:
      typeof row.permissions === "string"
        ? safeParsePermissions(row.permissions)
        : (row.permissions as unknown as string[]),
    prefix: "",
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function safeParsePermissions(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export async function generateApiKey(
  projectId: string,
  input: GenerateApiKeyInput
): Promise<ApiKeyWithPlain> {
  const row = await fetchApi<RawApiKeyRow>(`/api/projects/${projectId}/keys`, {
    method: "POST",
    body: JSON.stringify({
      label: input.name,
      permissions: input.permissions,
      expires_at: input.expiresAt,
    }),
  });
  return { ...mapApiKey(row), plainKey: row.key ?? "" };
}

export async function listApiKeys(projectId: string): Promise<ApiKey[]> {
  const rows = await fetchApi<RawApiKeyRow[] | { results?: RawApiKeyRow[] }>(
    `/api/projects/${projectId}/keys`
  );
  const list = Array.isArray(rows) ? rows : rows.results ?? [];
  return list.map(mapApiKey);
}

export async function revokeApiKey(
  projectId: string,
  keyId: string
): Promise<void> {
  await fetchApi(`/api/projects/${projectId}/keys/${keyId}`, {
    method: "DELETE",
  });
}

// Usage Stats — backed by the project-registry-api usage summary endpoint
// (GET /api/usage/:project_id/summary), which aggregates the usage_stats D1
// table populated by POST /api/usage/record. A project with no recorded
// traffic returns zeros (not random data).
interface UsageSummaryResponse {
  totals?: { requests?: number; errors?: number };
  dailyStats?: { date: string; request_count: number; error_count: number }[];
}

function zeroFilledDays(
  days: number
): { date: string; requests: number; errors: number }[] {
  const now = Date.now();
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(now - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
    requests: 0,
    errors: 0,
  }));
}

export async function getUsageStats(
  projectId: string,
  days = 30
): Promise<UsageStats> {
  let summary: UsageSummaryResponse;
  try {
    summary = await fetchApi<UsageSummaryResponse>(
      `/api/usage/${projectId}/summary?days=${days}`
    );
  } catch {
    // Backend unreachable or no usage table yet — render an empty (zeroed)
    // 30-day window rather than fabricated numbers.
    return {
      totalRequests: 0,
      totalErrors: 0,
      avgLatency: 0,
      dailyData: zeroFilledDays(days),
    };
  }

  // Zero-fill the full window so charts are continuous, then overlay real
  // per-day counts returned by the aggregation query.
  const byDate = new Map<string, { requests: number; errors: number }>();
  for (const d of summary.dailyStats ?? []) {
    byDate.set(d.date, { requests: d.request_count, errors: d.error_count });
  }
  const dailyData = zeroFilledDays(days).map((d) => {
    const hit = byDate.get(d.date);
    return {
      date: d.date,
      requests: hit?.requests ?? 0,
      errors: hit?.errors ?? 0,
    };
  });

  return {
    totalRequests: summary.totals?.requests ?? 0,
    totalErrors: summary.totals?.errors ?? 0,
    avgLatency: 0, // latency percentiles not yet tracked server-side (see P2-2)
    dailyData,
  };
}
