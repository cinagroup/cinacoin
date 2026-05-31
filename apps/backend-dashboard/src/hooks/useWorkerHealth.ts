"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SERVICES, HealthCheck, checkHealth, ServiceStatus } from "@/lib/services";

export interface WorkerHealthState {
  health: Record<string, HealthCheck>;
  allHealthy: boolean;
  degradedCount: number;
  downCount: number;
  checking: boolean;
  lastRefresh: number | null;
}

export function useWorkerHealth(pollingIntervalMs: number = 15000) {
  const [health, setHealth] = useState<Record<string, HealthCheck>>({});
  const [checking, setChecking] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const runChecks = useCallback(async () => {
    if (!mountedRef.current) return;
    setChecking(true);

    const results: Record<string, HealthCheck> = {};
    const checks = SERVICES.map(async (svc) => {
      const result = await checkHealth(svc.id);
      return [svc.id, result] as [string, HealthCheck];
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
  const allHealthy =
    statuses.length === SERVICES.length &&
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
export function aggregateStatusLabel(
  allHealthy: boolean,
  degradedCount: number,
  downCount: number,
  checking: boolean
): { label: string; color: string } {
  if (checking) return { label: "Checking...", color: "text-dashboard-muted" };
  if (downCount > 0) return { label: `${downCount} Service${downCount > 1 ? "s" : ""} Down`, color: "text-dashboard-danger" };
  if (degradedCount > 0) return { label: `${degradedCount} Degraded`, color: "text-dashboard-warning" };
  if (allHealthy) return { label: "All Systems Operational", color: "text-dashboard-success" };
  return { label: "Initializing...", color: "text-dashboard-muted" };
}
