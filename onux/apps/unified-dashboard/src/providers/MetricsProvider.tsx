"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useWebSocket } from "./WebSocketProvider";
import type { TimeRange } from "@/components/TimeRangeSelector";

// ─── Types ─────────────────────────────────────────────────────────────

export interface MetricSummary {
  users: number;
  projects: number;
  transactions: number;
  revenue: number;
  usersDelta: number;
  projectsDelta: number;
  transactionsDelta: number;
  revenueDelta: number;
}

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

interface MetricsContextType {
  summary: MetricSummary;
  loading: boolean;
  getTimeSeriesData: (key: string, range: TimeRange) => TimeSeriesPoint[];
  refresh: () => void;
}

const MetricsContext = createContext<MetricsContextType | null>(null);

export function useMetrics() {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error("useMetrics must be used within MetricsProvider");
  return ctx;
}

// ─── Mock Data Generator ───────────────────────────────────────────────

function generateMockSummary(): MetricSummary {
  return {
    users: 12847,
    projects: 342,
    transactions: 1_284_930,
    revenue: 284_500,
    usersDelta: 12.5,
    projectsDelta: 8.3,
    transactionsDelta: -2.1,
    revenueDelta: 15.7,
  };
}

function generateTimeSeriesData(key: string, range: TimeRange): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  let count: number;
  let formatFn: (i: number) => string;

  switch (range) {
    case "1h":
      count = 12;
      formatFn = (i) => `${i * 5}m`;
      break;
    case "24h":
      count = 24;
      formatFn = (i) => `${i}:00`;
      break;
    case "7d":
      count = 7;
      formatFn = (i) => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return days[i % 7];
      };
      break;
    case "30d":
      count = 30;
      formatFn = (i) => `Day ${i + 1}`;
      break;
    case "90d":
      count = 12;
      formatFn = (i) => `W${i + 1}`;
      break;
  }

  // Generate realistic-looking data based on key
  const baseValue = getBaseValue(key);
  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.3) * baseValue * 0.3;
    points.push({
      time: formatFn(i),
      value: Math.round(baseValue + variance),
    });
  }

  return points;
}

function getBaseValue(key: string): number {
  const bases: Record<string, number> = {
    users: 500,
    transactions: 50000,
    revenue: 10000,
    requests: 100000,
    errors: 50,
    latency: 120,
  };
  return bases[key] || 1000;
}

// ─── Provider ──────────────────────────────────────────────────────────

interface MetricsProviderProps {
  children: ReactNode;
}

export function MetricsProvider({ children }: MetricsProviderProps) {
  const [summary, setSummary] = useState<MetricSummary>(generateMockSummary());
  const [loading, setLoading] = useState(false);
  const { connected, subscribe } = useWebSocket();

  // Subscribe to metrics updates via WebSocket
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribe("metrics", (data: unknown) => {
      const msg = data as { type: string; payload: MetricSummary };
      if (msg.type === "metrics:update" && msg.payload) {
        setSummary(msg.payload);
      }
    });

    return unsubscribe;
  }, [connected, subscribe]);

  const refresh = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));
    setSummary(generateMockSummary());
    setLoading(false);
  }, []);

  const getTimeSeriesData = useCallback(
    (key: string, range: TimeRange): TimeSeriesPoint[] => {
      return generateTimeSeriesData(key, range);
    },
    []
  );

  return (
    <MetricsContext.Provider value={{ summary, loading, getTimeSeriesData, refresh }}>
      {children}
    </MetricsContext.Provider>
  );
}
