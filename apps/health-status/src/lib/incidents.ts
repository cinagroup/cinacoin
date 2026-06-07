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

export const severityConfig: Record<IncidentSeverity, {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  text: string;
  bg: string;
  border: string;
}> = {
  critical: {
    label: "严重", text: "text-[var(--cc-error)]",
    textColor: "var(--cc-error)", bgColor: "var(--cc-error-soft)", borderColor: "var(--cc-error)",
    bg: "bg-[var(--cc-error-soft)]", border: "border-[var(--cc-error)]",
  },
  major: {
    label: "重要", text: "text-[var(--cc-warning)]",
    textColor: "var(--cc-warning)", bgColor: "var(--cc-warning-soft)", borderColor: "var(--cc-warning)",
    bg: "bg-[var(--cc-warning-soft)]", border: "border-[var(--cc-warning)]",
  },
  minor: {
    label: "轻微", text: "text-[var(--cc-warning-deep)]",
    textColor: "var(--cc-warning-deep)", bgColor: "var(--cc-warning-soft)", borderColor: "var(--cc-warning)",
    bg: "bg-[var(--cc-warning-soft)]", border: "border-[var(--cc-warning)]",
  },
  maintenance: {
    label: "维护", text: "text-[var(--cc-link)]",
    textColor: "var(--cc-link)", bgColor: "var(--cc-link-bg-soft)", borderColor: "var(--cc-link)",
    bg: "bg-[var(--cc-link-bg-soft)]", border: "border-[var(--cc-link)]",
  },
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
