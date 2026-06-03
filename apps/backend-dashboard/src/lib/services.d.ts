export interface ServiceDefinition {
    id: string;
    name: string;
    description: string;
    healthPath: string;
    metricsPath: string;
    icon: string;
    color: string;
}
export declare const SERVICES: ServiceDefinition[];
export type ServiceStatus = "healthy" | "degraded" | "down" | "unknown";
export interface HealthCheck {
    status: ServiceStatus;
    latency: number | null;
    lastChecked: number;
    error?: string;
}
export interface ServiceMetrics {
    requestId?: string;
    totalRequests?: number;
    errorCount?: number;
    errorRate?: number;
    avgLatency?: number;
    p99Latency?: number;
    activeConnections?: number;
    activeSessions?: number;
    storageUsed?: number;
    storageLimit?: number;
    throughput?: number;
    deliveryRate?: number;
    deviceTokens?: number;
    deliverySuccess?: number;
    deliveryFailed?: number;
}
export declare function checkHealth(serviceId: string): Promise<HealthCheck>;
export declare function fetchMetrics(serviceId: string): Promise<ServiceMetrics | null>;
export declare function generateDemoMetrics(serviceId: string): ServiceMetrics;
//# sourceMappingURL=services.d.ts.map