"use client";

import { useEffect, useState } from "react";
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

export default function RealtimeDashboard() {
  const [data, setData] = useState<RealtimeData>({
    activeUsers: 0,
    tps: 0,
    transactions: [],
    heatmap: [],
  });

  const { connectionState, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || "wss://analytics.cinacoin.com/ws/realtime",
    enabled: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  useEffect(() => {
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

  // Simulate data for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        tps: Math.floor(Math.random() * 100) + 50,
        transactions: [
          {
            id: `tx_${Date.now()}`,
            from: "0x1234...5678",
            to: "0xabcd...efgh",
            amount: Math.random() * 10,
            chain: ["Ethereum", "Polygon", "Arbitrum"][Math.floor(Math.random() * 3)],
            timestamp: Date.now(),
          },
          ...prev.transactions.slice(0, 19),
        ],
        heatmap: [
          { region: "North America", requests: 1250, lat: 40, lng: -100 },
          { region: "Europe", requests: 980, lat: 50, lng: 10 },
          { region: "Asia", requests: 1450, lat: 35, lng: 105 },
          { region: "South America", requests: 420, lat: -15, lng: -60 },
          { region: "Africa", requests: 280, lat: 0, lng: 25 },
        ],
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="space-y-lg">
      {/* Connection Status */}
      <div className="flex items-center gap-xs">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionState === "connected"
              ? "bg-green-500"
              : connectionState === "connecting" || connectionState === "reconnecting"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        <span className="text-body-sm text-ink-mute capitalize">{connectionState}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="card p-lg">
          <p className="text-body-sm text-ink-mute mb-xs">Active Users</p>
          <p className="text-display-lg text-ink font-mono tabular-nums">
            {formatNumber(data.activeUsers)}
          </p>
        </div>
        <div className="card p-lg">
          <p className="text-body-sm text-ink-mute mb-xs">Transactions Per Second</p>
          <p className="text-display-lg text-ink font-mono tabular-nums">{data.tps}</p>
        </div>
      </div>

      {/* Realtime Transaction Stream */}
      <div className="card p-lg">
        <h3 className="text-heading-3 text-ink mb-md">Live Transaction Stream</h3>
        <div className="space-y-xs max-h-96 overflow-y-auto">
          {data.transactions.length === 0 ? (
            <p className="text-body text-ink-mute text-center py-lg">Waiting for transactions...</p>
          ) : (
            data.transactions.map((tx) => (
              <div
                key={tx.id}
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
                    <p className="text-caption text-ink-mute font-mono">
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
            ))
          )}
        </div>
      </div>

      {/* Global Heatmap */}
      <div className="card p-lg">
        <h3 className="text-heading-3 text-ink mb-md">Global Request Distribution</h3>
        <div className="space-y-sm">
          {data.heatmap.map((item) => (
            <div key={item.region}>
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
                    width: `${(item.requests / Math.max(...data.heatmap.map((h) => h.requests))) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
