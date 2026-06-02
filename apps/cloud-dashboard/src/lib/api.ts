import type {
  Project,
  ApiKey,
  ApiKeyWithPlain,
  CreateProjectInput,
  UpdateProjectInput,
  GenerateApiKeyInput,
  UsageStats,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface ApiOptions extends Omit<RequestInit, "headers"> {
  ownerId?: string;
  headers?: Record<string, string>;
}

async function fetchApi<T>(path: string, options?: ApiOptions): Promise<T> {
  const { ownerId, headers: extraHeaders, ...fetchOptions } = options || {};

  const url = new URL(`${API_BASE}${path}`);
  if (ownerId) url.searchParams.set("ownerId", ownerId);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };

  const res = await fetch(url.toString(), {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
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

// API Key API
export async function generateApiKey(
  projectId: string,
  ownerId: string,
  input: GenerateApiKeyInput
): Promise<ApiKeyWithPlain> {
  return fetchApi<ApiKeyWithPlain>(`/api/projects/${projectId}/api-keys`, {
    method: "POST",
    body: JSON.stringify(input),
    ownerId,
  });
}

export async function listApiKeys(
  projectId: string,
  ownerId: string
): Promise<ApiKey[]> {
  return fetchApi<ApiKey[]>(`/api/projects/${projectId}/api-keys`, { ownerId });
}

export async function revokeApiKey(keyId: string): Promise<void> {
  await fetchApi(`/api/api-keys/${keyId}`, { method: "DELETE" });
}

// Usage Stats (mock — would connect to analytics in production)
export async function getUsageStats(_projectId: string): Promise<UsageStats> {
  const now = Date.now();
  const dailyData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(now - (29 - i) * 86400000).toISOString().slice(0, 10),
    requests: Math.floor(Math.random() * 5000),
  }));

  return {
    totalRequests: dailyData.reduce((sum, d) => sum + d.requests, 0),
    totalErrors: Math.floor(Math.random() * 100),
    avgLatency: 45,
    dailyData,
  };
}
