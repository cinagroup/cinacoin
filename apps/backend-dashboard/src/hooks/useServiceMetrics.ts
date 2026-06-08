"use client";

import { useState, useEffect } from "react";
import { fetchMetrics, generateDemoMetrics, ServiceMetrics } from "@/lib/services";

/**
 * Fetches live metrics from the service's /metrics endpoint, falling back to
 * demo data with a clear banner when the endpoint is unreachable.
 */
export function useServiceMetrics(serviceId: string) {
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchMetrics(serviceId);
        if (!cancelled) {
          if (data) {
            setMetrics(data);
            setIsDemo(false);
            setError(null);
          } else {
            setMetrics(generateDemoMetrics(serviceId));
            setIsDemo(true);
            setError("Live metrics unavailable — showing demo data");
          }
        }
      } catch {
        if (!cancelled) {
          setMetrics(generateDemoMetrics(serviceId));
          setIsDemo(true);
          setError("Live metrics unavailable — showing demo data");
        }
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [serviceId]);

  return { metrics, isDemo, error };
}
