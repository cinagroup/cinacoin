"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { SERVICES, checkHealth } from "@/lib/services";
export function useWorkerHealth(pollingIntervalMs = 15000) {
    const [health, setHealth] = useState({});
    const [checking, setChecking] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);
    const mountedRef = useRef(true);
    const runChecks = useCallback(async () => {
        if (!mountedRef.current)
            return;
        setChecking(true);
        const results = {};
        const checks = SERVICES.map(async (svc) => {
            const result = await checkHealth(svc.id);
            return [svc.id, result];
        });
        const entries = await Promise.all(checks);
        for (const [id, result] of entries) {
            results[id] = result;
        }
        if (mountedRef.current) {
            setHealth(results);
            setLastRefresh(Date.now());
            setChecking(false);
        }
    }, []);
    useEffect(() => {
        mountedRef.current = true;
        runChecks();
        const interval = setInterval(runChecks, pollingIntervalMs);
        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [runChecks, pollingIntervalMs]);
    const statuses = Object.values(health).map((h) => h.status);
    const allHealthy = statuses.length === SERVICES.length &&
        statuses.every((s) => s === "healthy");
    const degradedCount = statuses.filter((s) => s === "degraded").length;
    const downCount = statuses.filter((s) => s === "down").length;
    return {
        health,
        allHealthy,
        degradedCount,
        downCount,
        checking,
        lastRefresh,
        manualRefresh: runChecks,
    };
}
/** Determine aggregate status label for header badge */
export function aggregateStatusLabel(allHealthy, degradedCount, downCount, checking) {
    if (checking)
        return { label: "Checking...", color: "text-dashboard-muted" };
    if (downCount > 0)
        return { label: `${downCount} Service${downCount > 1 ? "s" : ""} Down`, color: "text-dashboard-danger" };
    if (degradedCount > 0)
        return { label: `${degradedCount} Degraded`, color: "text-dashboard-warning" };
    if (allHealthy)
        return { label: "All Systems Operational", color: "text-dashboard-success" };
    return { label: "Initializing...", color: "text-dashboard-muted" };
}
//# sourceMappingURL=useWorkerHealth.js.map