"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import useWebSocket from "@/hooks/useWebSocket";

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
      <div className="flex items-center gap-xs">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionState === "connected"
              ? "bg-[var(--color-success)]"
              : connectionState === "connecting" || connectionState === "reconnecting"
              ? "bg-[var(--color-warning)]"
              : "bg-[var(--color-error)]"
          }`}
        />
        <span className="text-body-sm text-ink-mute capitalize">{connectionState}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="cc-card p-lg">
          <p className="text-body-sm text-ink-mute mb-xs">Active Users</p>
          <p className="text-display-lg text-ink text-code tabular-nums">
            {formatNumber(data.activeUsers)}
          </p>
        </div>
        <div className="cc-card p-lg">
          <p className="text-body-sm text-ink-mute mb-xs">Transactions Per Second</p>
          <p className="text-display-lg text-ink text-code tabular-nums">{data.tps}</p>
        </div>
      </div>

      {/* Realtime Transaction Stream */}
      <div className="cc-card p-lg">
        <p className="font-mono text-xs text-mute mb-2">STREAM</p>
        <h3 className="text-heading-3 text-ink mb-md">Live Transaction Stream</h3>
        <div className="space-y-xs max-h-96 overflow-y-auto">
          {data.transactions.length === 0 ? (
            <p className="text-body text-ink-mute text-center py-lg">Waiting for transactions...</p>
          ) : (
            data.transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))
          )}
        </div>
      </div>

      {/* Global Heatmap */}
      <div className="cc-card p-lg">
        <p className="font-mono text-xs text-mute mb-2">GEOGRAPHY</p>
        <h3 className="text-heading-3 text-ink mb-md">Global Request Distribution</h3>
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
      className="flex items-center justify-between p-sm bg-canvas-soft rounded-md hover:bg-canvas-soft-2 transition-colors"
    >
      <div className="flex items-center gap-sm">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <p className="text-body-sm font-medium text-ink">{tx.chain}</p>
          <p className="text-caption text-ink-mute text-code">
            {tx.from} → {tx.to}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-body-sm font-medium text-ink">{tx.amount.toFixed(4)}</p>
        <p className="text-caption text-ink-mute">
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
        <span className="text-body-sm text-ink-body">{item.region}</span>
        <span className="text-body-sm font-medium text-ink">
          {formatNumber(item.requests)} req
        </span>
      </div>
      <div className="h-2 bg-canvas-soft-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
          style={{
            width: `${(item.requests / maxRequests) * 100}%`,
          }}
        />
      </div>
    </div>
  );
});
