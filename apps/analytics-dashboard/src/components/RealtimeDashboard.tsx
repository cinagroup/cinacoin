"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import useWebSocket from "@/hooks/useWebSocket";
import { TrendingUp } from "lucide-react";

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  chain: string;
  timestamp: number;
}

interface RealtimeData {
  activeUsers: number;
  tps: number;
  transactions: Transaction[];
  heatmap: { region: string; requests: number; lat: number; lng: number }[];
}

/** Whether to use simulated data (demo mode) instead of live WebSocket */
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || true; // default true until WS backend ready

export default function RealtimeDashboard() {
  const [data, setData] = useState<RealtimeData>({
    activeUsers: 0,
    tps: 0,
    transactions: [],
    heatmap: [],
  });

  const simulationActiveRef = useRef(DEMO_MODE);

  const { connectionState, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || "wss://analytics.cinacoin.com/ws/realtime",
    enabled: !DEMO_MODE,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  // Live WebSocket data handler — only processes messages when NOT in demo mode
  useEffect(() => {
    if (simulationActiveRef.current) return;
    if (lastMessage) {
      const msg = lastMessage as Partial<RealtimeData>;
      setData((prev) => ({
        activeUsers: msg.activeUsers ?? prev.activeUsers,
        tps: msg.tps ?? prev.tps,
        transactions: msg.transactions ?? prev.transactions,
        heatmap: msg.heatmap ?? prev.heatmap,
      }));
    }
  }, [lastMessage]);

  // Demo simulation — only runs when DEMO_MODE is true
  useEffect(() => {
    if (!simulationActiveRef.current) return;

    const interval = setInterval(() => {
      setData((prev) => ({
        activeUsers: Math.max(0, prev.activeUsers + Math.floor(Math.random() * 10 - 5)),
        tps: Math.floor(Math.random() * 100) + 50,
        transactions: [
          {
            id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            from: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
            to: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
            amount: Math.random() * 10,
            chain: ["Ethereum", "Polygon", "Arbitrum"][Math.floor(Math.random() * 3)],
            timestamp: Date.now(),
          },
          ...prev.transactions.slice(0, 19),
        ],
        heatmap: [
          { region: "North America", requests: 1250 + Math.floor(Math.random() * 100), lat: 40, lng: -100 },
          { region: "Europe", requests: 980 + Math.floor(Math.random() * 80), lat: 50, lng: 10 },
          { region: "Asia", requests: 1450 + Math.floor(Math.random() * 120), lat: 35, lng: 105 },
          { region: "South America", requests: 420 + Math.floor(Math.random() * 40), lat: -15, lng: -60 },
          { region: "Africa", requests: 280 + Math.floor(Math.random() * 30), lat: 0, lng: 25 },
        ],
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  }, []);

  const maxHeatmapRequests = useMemo(
    () => Math.max(...data.heatmap.map((h) => h.requests), 1),
    [data.heatmap]
  );

  return (
    <div className="space-y-lg">
      {/* Connection Status */}
      <div className="flex items-center gap-xs" role="status" aria-label={`Connection status: ${connectionState}`}>
        <div
          className={`w-2 h-2 rounded-full ${
            connectionState === "connected"
              ? "bg-[var(--cc-success)]"
              : connectionState === "connecting" || connectionState === "reconnecting"
              ? "bg-[var(--cc-warning)]"
              : "bg-[var(--cc-error)]"
          }`}
        />
        <span className="text-body-sm text-[var(--cc-muted)] capitalize">{connectionState}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="cc-card p-lg" role="region" aria-label="Active users metric">
          <div className="flex items-center justify-between mb-xs">
            <p className="text-body-sm text-[var(--cc-muted)]">Active users</p>
            <span className="inline-flex items-center gap-xxs text-caption font-medium px-xs py-xxs rounded-full badge-success">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-success)] animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-display-lg text-[var(--cc-ink)] text-code tabular-nums">
            {formatNumber(data.activeUsers)}
          </p>
        </div>
        <div className="cc-card p-lg" role="region" aria-label="Transactions per second metric">
          <div className="flex items-center justify-between mb-xs">
            <p className="text-body-sm text-[var(--cc-muted)]">Transactions per second</p>
            <span className="inline-flex items-center gap-xxs text-caption font-medium px-xs py-xxs rounded-full badge-success">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-success)] animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-display-lg text-[var(--cc-ink)] text-code tabular-nums">{data.tps}</p>
        </div>
      </div>

      {/* Realtime Transaction Stream */}
      <div className="cc-card p-lg">
        <div className="flex items-baseline justify-between mb-md">
          <h3 className="text-heading-3 text-[var(--cc-ink)]">Live transaction stream</h3>
          <span className="text-caption text-[var(--cc-muted)]">Last 20 transactions</span>
        </div>
        <div className="space-y-xs max-h-96 overflow-y-auto" role="log" aria-label="Live transactions">
          {data.transactions.length === 0 ? (
            <p className="text-body text-[var(--cc-muted)] text-center py-lg">Waiting for transactions...</p>
          ) : (
            data.transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))
          )}
        </div>
      </div>

      {/* Global Heatmap */}
      <div className="cc-card p-lg">
        <div className="flex items-baseline justify-between mb-md">
          <h3 className="text-heading-3 text-[var(--cc-ink)]">Global request distribution</h3>
          <span className="text-caption text-[var(--cc-muted)]">By region</span>
        </div>
        <div className="space-y-sm">
          {data.heatmap.map((item) => (
            <HeatmapRow key={item.region} item={item} maxRequests={maxHeatmapRequests} formatNumber={formatNumber} />
          ))}
        </div>
      </div>
    </div>
  );
}

const TransactionRow = React.memo(function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <div
      className="flex items-center justify-between p-sm bg-[var(--cc-canvas-soft)] rounded-md hover:bg-[var(--cc-canvas-soft-2)] transition-colors"
    >
      <div className="flex items-center gap-sm">
        <div className="w-8 h-8 bg-[var(--cc-primary)]/10 rounded-full flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[var(--cc-primary)]" />
        </div>
        <div>
          <p className="text-body-sm font-medium text-[var(--cc-ink)]">{tx.chain}</p>
          <p className="text-caption text-[var(--cc-muted)] text-code">
            {tx.from} → {tx.to}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-body-sm font-medium text-[var(--cc-ink)]">{tx.amount.toFixed(4)}</p>
        <p className="text-caption text-[var(--cc-muted)]">
          {new Date(tx.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
});

const HeatmapRow = React.memo(function HeatmapRow({ item, maxRequests, formatNumber }: { item: { region: string; requests: number }; maxRequests: number; formatNumber: (n: number) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-xs">
        <span className="text-body-sm text-[var(--cc-body)]">{item.region}</span>
        <span className="text-body-sm font-medium text-[var(--cc-ink)]">
          {formatNumber(item.requests)} req
        </span>
      </div>
      <div className="h-2 bg-[var(--cc-canvas-soft-2)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--cc-primary)] to-[var(--cc-primary)]/60 transition-all duration-500"
          style={{
            width: `${(item.requests / maxRequests) * 100}%`,
          }}
        />
      </div>
    </div>
  );
});
