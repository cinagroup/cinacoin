import { HealthCheck } from "@/lib/services";
export interface WorkerHealthState {
    health: Record<string, HealthCheck>;
    allHealthy: boolean;
    degradedCount: number;
    downCount: number;
    checking: boolean;
    lastRefresh: number | null;
}
export declare function useWorkerHealth(pollingIntervalMs?: number): {
    health: Record<string, HealthCheck>;
    allHealthy: boolean;
    degradedCount: number;
    downCount: number;
    checking: boolean;
    lastRefresh: number | null;
    manualRefresh: () => Promise<void>;
};
/** Determine aggregate status label for header badge */
export declare function aggregateStatusLabel(allHealthy: boolean, degradedCount: number, downCount: number, checking: boolean): {
    label: string;
    color: string;
};
//# sourceMappingURL=useWorkerHealth.d.ts.map