"use client";
import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  error?: string;
}

// Monkey-patch fetch to log requests
const originalFetch = globalThis.fetch;
const listeners = new Set<(entry: LogEntry) => void>();

globalThis.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const start = performance.now();
  const method = init?.method || "GET";
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  try {
    const response = await originalFetch(input, init);
    const duration = Math.round(performance.now() - start);
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      method,
      url,
      status: response.status,
      duration,
      requestSize: new Blob([init?.body?.toString() || ""]).size,
      responseSize: 0,
    };
    listeners.forEach((fn) => fn(entry));
    return response;
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      method,
      url,
      status: 0,
      duration,
      requestSize: 0,
      responseSize: 0,
      error: (err as Error).message,
    };
    listeners.forEach((fn) => fn(entry));
    throw err;
  }
};

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "errors" | "slow">("all");

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  useEffect(() => {
    listeners.add(addLog);
    return () => { listeners.delete(addLog); };
  }, [addLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "d") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === "errors") return log.status >= 400 || log.error;
    if (filter === "slow") return log.duration > 1000;
    return true;
  });

  const statusColor = (status: number) => {
    if (status === 0) return "text-ink-mute";
    if (status < 300) return "text-success";
    if (status < 400) return "text-warning";
    return "text-danger";
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-72 bg-primary text-on-primary border-t-2 border-warning z-50 flex flex-col font-mono text-caption">
      <div className="flex items-center justify-between px-4 py-2 bg-primary/95 border-b border-on-primary/20">
        <div className="flex items-center gap-4">
          <span className="font-bold text-warning">🔧 Debug Console</span>
          <div className="flex gap-1">
            {(["all", "errors", "slow"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-caption ${
                  filter === f ? "bg-on-primary/20 text-on-primary" : "text-on-primary/60 hover:text-on-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-on-primary/60">{filteredLogs.length} requests</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLogs([])} className="text-on-primary/60 hover:text-on-primary px-2">
            Clear
          </button>
          <button onClick={() => setOpen(false)} className="text-on-primary/60 hover:text-on-primary px-2">
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-on-primary/40">
            No requests captured yet. Interact with the dashboard to see API calls.
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-primary/95">
              <tr className="text-on-primary/60">
                <th className="px-3 py-1 text-left w-20">Method</th>
                <th className="px-3 py-1 text-left">URL</th>
                <th className="px-3 py-1 text-left w-16">Status</th>
                <th className="px-3 py-1 text-left w-20">Duration</th>
                <th className="px-3 py-1 text-left w-32">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-on-primary/20 hover:bg-primary/95">
                  <td className="px-3 py-1">
                    <span className={log.method === "GET" ? "text-success" : "text-link"}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-3 py-1 truncate max-w-md">{log.url}</td>
                  <td className={`px-3 py-1 ${statusColor(log.status)}`}>
                    {log.error ? "ERR" : log.status}
                  </td>
                  <td className={`px-3 py-1 ${log.duration > 1000 ? "text-danger" : "text-on-primary/60"}`}>
                    {log.duration}ms
                  </td>
                  <td className="px-3 py-1 text-on-primary/60">
                    {log.timestamp.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
