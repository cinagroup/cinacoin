export const SERVICES = [
    {
        id: "rpc-proxy",
        name: "RPC Proxy",
        description: "RPC request proxy with KV caching",
        healthPath: "/health",
        metricsPath: "/metrics",
        icon: "🔄",
        color: "#3b82f6",
    },
    {
        id: "keys-server",
        name: "Keys Server",
        description: "Session key management with D1 storage",
        healthPath: "/health",
        metricsPath: "/metrics",
        icon: "🔑",
        color: "#8b5cf6",
    },
    {
        id: "relay-server",
        name: "Relay Server",
        description: "WebSocket relay via Durable Objects",
        healthPath: "/health",
        metricsPath: "/metrics",
        icon: "📡",
        color: "#06b6d4",
    },
    {
        id: "notify-server",
        name: "Notify Server",
        description: "Notification delivery service",
        healthPath: "/health",
        metricsPath: "/metrics",
        icon: "🔔",
        color: "#f59e0b",
    },
    {
        id: "push-server",
        name: "Push Server",
        description: "Push notification delivery",
        healthPath: "/health",
        metricsPath: "/metrics",
        icon: "📱",
        color: "#22c55e",
    },
];
// Base URLs for services — these should match your Cloudflare Workers deployments
// Override via environment variable DASHBOARD_SERVICE_BASE_URL or per-service env vars
function getBaseUrl(serviceId) {
    // Per-service override
    const envKey = `SERVICE_URL_${serviceId.toUpperCase().replace(/-/g, "_")}`;
    if (typeof process !== "undefined" && process.env?.[envKey]) {
        return process.env[envKey];
    }
    // Generic override
    if (typeof process !== "undefined" && process.env?.DASHBOARD_SERVICE_BASE_URL) {
        const base = process.env.DASHBOARD_SERVICE_BASE_URL;
        return `${base}/${serviceId}`;
    }
    // Check if running in production (Cloudflare Pages)
    const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost";
    if (isProduction) {
        // Use direct Worker subdomain URLs
        // Cloudflare Pages static export doesn't support cross-origin proxy redirects
        const urlMap = {
            "rpc-proxy": "https://rpc.cinacoin.com",
            "keys-server": "https://keys.cinacoin.com",
            "relay-server": "https://relay.cinacoin.com",
            "notify-server": "https://notify.cinacoin.com",
            "push-server": "https://push.cinacoin.com",
        };
        return urlMap[serviceId] || `https://${serviceId}.cinacoin.com`;
    }
    // Default: localhost dev URLs
    const defaults = {
        "rpc-proxy": "http://localhost:8787",
        "keys-server": "http://localhost:8788",
        "relay-server": "http://localhost:8789",
        "notify-server": "http://localhost:8790",
        "push-server": "http://localhost:8791",
    };
    return defaults[serviceId] || `http://localhost:8787/${serviceId}`;
}
export async function checkHealth(serviceId) {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) {
        return { status: "unknown", latency: null, lastChecked: Date.now(), error: "Unknown service" };
    }
    const baseUrl = getBaseUrl(serviceId);
    const url = `${baseUrl}${service.healthPath}`;
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
        });
        clearTimeout(timeout);
        const latency = Date.now() - start;
        if (response.ok) {
            return { status: "healthy", latency, lastChecked: Date.now() };
        }
        else if (response.status >= 500) {
            return { status: "degraded", latency, lastChecked: Date.now(), error: `HTTP ${response.status}` };
        }
        else {
            return { status: "degraded", latency, lastChecked: Date.now(), error: `HTTP ${response.status}` };
        }
    }
    catch (err) {
        const latency = Date.now() - start;
        return {
            status: "down",
            latency: err.name === "AbortError" ? null : latency,
            lastChecked: Date.now(),
            error: err.message || "Connection failed",
        };
    }
}
export async function fetchMetrics(serviceId) {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service)
        return null;
    const baseUrl = getBaseUrl(serviceId);
    const url = `${baseUrl}${service.metricsPath}`;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
        });
        clearTimeout(timeout);
        if (response.ok) {
            return response.json();
        }
        return null;
    }
    catch {
        return null;
    }
}
// Simulated metrics for demo mode (when real endpoints aren't available)
export function generateDemoMetrics(serviceId) {
    const base = (() => {
        switch (serviceId) {
            case "rpc-proxy":
                return {
                    totalRequests: 1284567,
                    errorCount: 2341,
                    errorRate: 0.18,
                    avgLatency: 45,
                    p99Latency: 189,
                };
            case "keys-server":
                return {
                    activeSessions: 3842,
                    storageUsed: 2400000000,
                    storageLimit: 10000000000,
                    totalRequests: 892341,
                    errorCount: 1023,
                    errorRate: 0.11,
                    avgLatency: 12,
                    p99Latency: 67,
                };
            case "relay-server":
                return {
                    activeConnections: 1247,
                    throughput: 8534,
                    totalRequests: 4521890,
                    errorCount: 892,
                    errorRate: 0.02,
                    avgLatency: 8,
                    p99Latency: 34,
                };
            case "notify-server":
                return {
                    totalRequests: 345678,
                    deliveryRate: 98.7,
                    errorCount: 4521,
                    errorRate: 1.31,
                    avgLatency: 230,
                    p99Latency: 890,
                };
            case "push-server":
                return {
                    deviceTokens: 52890,
                    deliverySuccess: 498721,
                    deliveryFailed: 3421,
                    deliveryRate: 99.3,
                    totalRequests: 502142,
                    errorCount: 3421,
                    errorRate: 0.68,
                    avgLatency: 180,
                    p99Latency: 620,
                };
            default:
                return {};
        }
    })();
    return base;
}
//# sourceMappingURL=services.js.map