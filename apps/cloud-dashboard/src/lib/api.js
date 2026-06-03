const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
async function fetchApi(path, options) {
    const { ownerId, headers: extraHeaders, ...fetchOptions } = options || {};
    const url = new URL(`${API_BASE}${path}`);
    if (ownerId)
        url.searchParams.set("ownerId", ownerId);
    const headers = {
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
export async function createProject(input) {
    return fetchApi("/api/projects", {
        method: "POST",
        body: JSON.stringify(input),
        ownerId: input.ownerId,
    });
}
export async function listProjects(ownerId) {
    return fetchApi("/api/projects", { ownerId });
}
export async function getProject(id, ownerId) {
    return fetchApi(`/api/projects/${id}`, { ownerId });
}
export async function updateProject(id, ownerId, input) {
    return fetchApi(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
        ownerId,
    });
}
export async function deleteProject(id, ownerId) {
    await fetchApi(`/api/projects/${id}`, {
        method: "DELETE",
        ownerId,
    });
}
// API Key API
export async function generateApiKey(projectId, ownerId, input) {
    return fetchApi(`/api/projects/${projectId}/api-keys`, {
        method: "POST",
        body: JSON.stringify(input),
        ownerId,
    });
}
export async function listApiKeys(projectId, ownerId) {
    return fetchApi(`/api/projects/${projectId}/api-keys`, { ownerId });
}
export async function revokeApiKey(keyId) {
    await fetchApi(`/api/api-keys/${keyId}`, { method: "DELETE" });
}
// Usage Stats (mock — would connect to analytics in production)
export async function getUsageStats(_projectId) {
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
//# sourceMappingURL=api.js.map