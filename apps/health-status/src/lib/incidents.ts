/**
 * Service Status — Incident Report System
 */

export type IncidentSeverity = "critical" | "major" | "minor" | "maintenance";
export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface IncidentUpdate {
  timestamp: string;
  status: IncidentStatus;
  message: string;
}

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  created_at: string;
  resolved_at?: string;
  updates: IncidentUpdate[];
  affected_services: string[];
}

export interface IncidentsData {
  incidents: Incident[];
}

export const severityConfig: Record<IncidentSeverity, { label: string; text: string; bg: string; border: string }> = {
  critical: { label: "严重", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  major: { label: "重要", text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  minor: { label: "轻微", text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  maintenance: { label: "维护", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

export const statusLabels: Record<IncidentStatus, string> = {
  investigating: "调查中",
  identified: "已定位",
  monitoring: "监控中",
  resolved: "已解决",
};

export function loadIncidents(): IncidentsData {
  try {
    const raw = localStorage.getItem("cina-incidents");
    if (raw) return JSON.parse(raw) as IncidentsData;
  } catch { /* ignore */ }
  return { incidents: [] };
}

export function fetchIncidents(): Promise<IncidentsData> {
  return fetch("/incidents.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) return loadIncidents();
      return res.json() as Promise<IncidentsData>;
    })
    .catch(() => loadIncidents());
}

export function saveIncidents(data: IncidentsData): void {
  try {
    localStorage.setItem("cina-incidents", JSON.stringify(data));
  } catch { /* ignore */ }
}
