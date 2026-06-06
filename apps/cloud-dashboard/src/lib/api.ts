import type {
  Project,
  ApiKey,
  ApiKeyWithPlain,
  CreateProjectInput,
  UpdateProjectInput,
  GenerateApiKeyInput,
  UsageStats,
} from "@/types";

export const demoProjects: Project[] = [
  {
    id: "demo-1",
    name: "Demo Wallet App",
    description: "A demo wallet application using Cinacoin SDK",
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
