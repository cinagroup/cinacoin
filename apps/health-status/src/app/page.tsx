"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  checkAllServices,
  saveToHistory,
  getHistory,
  loadHistoryUptimes,
  calculateOverallStatus,
  formatTime,
  formatDuration,
} from "@/lib/health-check";
import { fetchIncidents, severityConfig, statusLabels } from "@/lib/incidents";
import { ServiceCheck, ServiceConfig, ServiceStatus, HistoryEntry } from "@/types";
import type { Incident } from "@/lib/incidents";
import { useTheme } from "@/providers/ThemeProvider";
import { useI18n } from "@/providers/I18nProvider";
import type { Locale } from "@/providers/I18nProvider";

/* ---- Icons ---- */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-.994-9.638a9.955 9.955 0 0113.958 3.222M20.015 4.356a9.955 9.955 0 00-13.958-3.222" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

/* ---- Theme Toggle ---- */

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
    >
      {theme === 'dark' ? (
        /* sun */
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        /* moon */
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

/* ---- Language Selector ---- */

function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="px-2 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors cursor-pointer outline-none"
      aria-label="Language"
    >
      <option value="en">EN</option>
      <option value="zh">中文</option>
    </select>
  );
}

/* ---- Components ---- */

function StatusBadge({ status }: { status: ServiceStatus }) {
  const { t } = useI18n();
  const statusKeyMap: Record<string, "statusOperational" | "statusDegraded" | "statusDown" | "statusUnknown"> = {
    healthy: "statusOperational",
    degraded: "statusDegraded",
    down: "statusDown",
    unknown: "statusUnknown",
  };
  const statusKey = statusKeyMap[status] || "statusUnknown";
  const label = t(statusKey);

  const config = {
    healthy: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    degraded: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    down: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    unknown: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {status === "healthy" && <CheckIcon className="w-3 h-3" />}
      {status === "degraded" && <WarningIcon className="w-3 h-3" />}
      {status === "down" && <ErrorIcon className="w-3 h-3" />}
      {label}
    </span>
  );
}

function UptimeBadge({ uptime }: { uptime: number }) {
  const color = uptime >= 99.9 ? "text-emerald-400" : uptime >= 99 ? "text-yellow-400" : "text-red-400";
  return (
    <span className={`text-xs font-mono ${color}`}>
      {uptime.toFixed(2)}%
    </span>
  );
}

function ServiceCard({ service }: { service: ServiceCheck }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const statusColor = {
    healthy: "border-l-emerald-500",
    degraded: "border-l-yellow-500",
    down: "border-l-red-500",
    unknown: "border-l-gray-500",
  }[service.status];

  const history = getHistory();
  const svcHistory = history.slice(-72).map((entry) => {
    const found = entry.services.find((s) => s.name === service.name);
    return found?.status || "unknown";
  });

  const dotColor = (s: string) => {
    if (s === "healthy") return "bg-emerald-500";
    if (s === "degraded") return "bg-yellow-500";
    if (s === "down") return "bg-red-500";
    return "bg-gray-600";
  };

  return (
    <div className={`animate-fade-in bg-[var(--bg-card)] rounded-[var(--cc-radius-md)] border border-[var(--border)] border-l-4 ${statusColor} overflow-hidden hover:bg-[var(--bg-card-hover)] transition-colors`} style={{ boxShadow: '0 2px 2px rgba(0,0,0,0.1), 0 8px 16px -4px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{service.name}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{service.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={service.status} />
            <ChevronIcon open={expanded} />
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="text-[var(--text-secondary)]">{t("responseTime")}</span>
            <p className={`font-mono text-sm mt-0.5 ${service.responseTime !== null && service.responseTime < 1000 ? "text-emerald-400" : service.responseTime !== null && service.responseTime < 3000 ? "text-yellow-400" : "text-red-400"}`}>
              {formatDuration(service.responseTime)}
            </p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">{t("uptime")}</span>
            <p className="mt-0.5"><UptimeBadge uptime={service.uptime} /></p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">{t("lastCheck")}</span>
            <p className="font-mono text-sm text-[var(--text-secondary)] mt-0.5">{formatTime(service.lastChecked)}</p>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[var(--border)] pt-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)]">{t("last6Hours")}</span>
          </div>
          <div className="flex gap-px">
            {svcHistory.map((status, idx) => (
              <div
                key={idx}
                className={`flex-1 h-8 rounded-sm ${dotColor(status)}`}
                title={`${status}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> {t("statusOperational")}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500" /> {t("statusDegraded")}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> {t("statusDown")}</span>
          </div>
          {service.error && (
            <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono">
              Error: {service.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const { t } = useI18n();
  const sev = severityConfig[incident.severity];
  const isActive = incident.status !== "resolved";

  // Translate severity label
  const sevKey = `sev_${incident.severity}` as "sev_critical" | "sev_major" | "sev_minor" | "sev_maintenance";
  const sevLabel = t(sevKey);

  // Translate incident status
  const incStatusKey = `inc_${incident.status}` as "inc_investigating" | "inc_identified" | "inc_monitoring" | "inc_resolved";
  const incStatusLabel = t(incStatusKey);

  return (
    <div className={`animate-fade-in bg-[var(--bg-card)] rounded-[var(--cc-radius-md)] border ${isActive ? "border-yellow-500/30" : "border-[var(--border)]"} p-5`} style={{ boxShadow: '0 2px 2px rgba(0,0,0,0.1), 0 8px 16px -4px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{incident.title}</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sev.bg} ${sev.text} border ${sev.border}`}>
              {sevLabel}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${isActive ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
              {incStatusLabel}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {t("affected")}: {incident.affected_services.join(", ")}
          </p>
        </div>
        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
          {new Date(incident.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-3 mt-4">
        {incident.updates.map((update, idx) => {
          const updStatusKey = `inc_${update.status}` as "inc_investigating" | "inc_identified" | "inc_monitoring" | "inc_resolved";
          const updStatusLabel = t(updStatusKey);
          return (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${idx === incident.updates.length - 1 && incident.status === "resolved" ? "bg-emerald-500" : "bg-[var(--text-secondary)]"}`} />
                {idx < incident.updates.length - 1 && <div className="w-px h-full bg-[var(--border)] mt-1" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${sev.text}`}>{updStatusLabel}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{formatTime(update.timestamp)}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{update.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Footer() {
  const { t } = useI18n();

  return (
    <footer className="pt-8 mt-8 border-t border-[var(--cc-hairline)]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" width={24} height={24} className="h-6 w-6 rounded" />
          <span className="text-sm font-semibold tracking-tight text-[var(--cc-ink)]">Cinacoin</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-6">
          <div>
            <p className="cc-footer-heading">Status</p>
            <a href="/incidents.json" className="cc-footer-link" target="_blank" rel="noopener noreferrer">{t("incidentsApi")}</a>
            <a href="https://status.cinacoin.com" className="cc-footer-link">Live status</a>
          </div>
          <div>
            <p className="cc-footer-heading">Developers</p>
            <a href="https://docs.cinacoin.com" className="cc-footer-link">Docs</a>
            <a href="https://github.com/cinagroup/cinacoin" className="cc-footer-link" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <div>
            <p className="cc-footer-heading">Company</p>
            <a href="https://cinacoin.com" className="cc-footer-link">Home</a>
          </div>
        </div>
      </div>
      <p className="mt-8 text-xs text-[var(--cc-muted)]">
        © 2026 Cinacoin · {t("healthChecksInfo")}
      </p>
    </footer>
  );
}

/* ---- Severity config override for theme-aware colors ---- */

// We override severityConfig labels dynamically in IncidentCard via i18n,
// but the tailwind classes remain static (they reference raw color values).

export default function HealthStatusPage() {
  const { t } = useI18n();
  const [services, setServices] = useState<ServiceCheck[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<ServiceStatus>("healthy");
  const [error, setError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const serviceConfigRef = useRef<ServiceConfig[]>([]);

  const runChecks = useCallback(async () => {
    const cfgs = serviceConfigRef.current;
    if (cfgs.length === 0) return;

    setRefreshing(true);
    setError(null);
    try {
      const checks = await checkAllServices(cfgs);
      const hist = getHistory();
      const uptimes = loadHistoryUptimes(cfgs, hist);
      const updated = checks.map((c) => ({
        ...c,
        uptime: uptimes.get(c.name) ?? 99,
      }));

      saveToHistory(updated);
      setServices(updated);
      setHistory([...hist, {
        timestamp: new Date().toISOString(),
        services: updated.map((s) => ({ name: s.name, status: s.status, responseTime: s.responseTime })),
      }].slice(-288));
      setOverallStatus(calculateOverallStatus(updated));
      setLastRefresh(new Date().toISOString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load configuration + incidents
  useEffect(() => {
    let mounted = true;

    fetch("/service-status.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        serviceConfigRef.current = data.services;
        setConfigs(data.services);
        setConfigLoaded(true);
        setHistory(getHistory());
      })
      .catch((err) => {
        if (!mounted) return;
        setError(`Failed to load service configuration: ${err.message}`);
        setConfigLoaded(true);
      });

    fetchIncidents().then((data) => {
      if (!mounted) return;
      setIncidents(data.incidents);
    });

    return () => { mounted = false; };
  }, []);

  // Initial check
  useEffect(() => {
    if (configLoaded && configs.length > 0) {
      runChecks();
    }
  }, [configLoaded, configs, runChecks]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(runChecks, 300000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, runChecks]);

  const overallConfig = {
    healthy: { gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", icon: "text-emerald-400", label: t("allOperational") },
    degraded: { gradient: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-500/30", icon: "text-yellow-400", label: t("someDegraded") },
    down: { gradient: "from-red-500/20 to-red-500/5", border: "border-red-500/30", icon: "text-red-400", label: t("systemOutage") },
    unknown: { gradient: "from-gray-500/20 to-gray-500/5", border: "border-gray-500/30", icon: "text-gray-400", label: t("statusUnknown") },
  }[overallStatus];

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      {/* Top nav bar — consistent brand lockup */}
      <header className="sticky top-0 z-50 h-16 bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)]">
        <div className="max-w-4xl mx-auto h-16 px-4 flex items-center justify-between">
          <a href="https://cinacoin.com" className="flex items-center gap-2" aria-label="Cinacoin home">
            <img src="/logo.png" alt="Cinacoin logo" width={28} height={28} className="h-7 w-7 rounded-md" />
            <span className="text-[16px] font-semibold tracking-tight text-[var(--cc-ink)]">
              Cinacoin <span className="text-[var(--cc-muted)] font-normal">Status</span>
            </span>
          </a>
          <nav className="flex items-center gap-1">
            <a className="cc-navbar-link" href="https://docs.cinacoin.com">Docs</a>
            <a className="cc-navbar-link" href="https://cinacoin.com">Home</a>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Page title */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--cc-ink)]">{t("pageTitle")}</h1>
              <p className="text-[var(--cc-body)] text-sm mt-1">{t("siteName")}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LanguageSelector />
              <ThemeToggle />
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[100px] text-xs font-medium transition-colors ${
                  autoRefresh
                    ? "bg-[var(--cc-primary)] text-[var(--cc-on-primary)]"
                    : "bg-[var(--cc-canvas)] border border-[var(--cc-border)] text-[var(--cc-body)]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-blue-400 animate-pulse-dot" : "bg-gray-600"}`} />
                {t("autoRefresh")}
              </button>
              <button
                onClick={runChecks}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[100px] text-xs font-medium bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 transition-colors disabled:opacity-50"
              >
                <RefreshIcon spinning={refreshing} />
                {t("refresh")}
              </button>
            </div>
          </div>
        </header>

        {/* Overall Status */}
        <div className={`mb-8 rounded-[var(--cc-radius-md)] border ${overallConfig.border} bg-gradient-to-r ${overallConfig.gradient} p-6 animate-fade-in`} style={{ boxShadow: '0 2px 2px rgba(0,0,0,0.1), 0 8px 16px -4px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-3">
            {overallStatus === "healthy" && <CheckIcon className={`w-6 h-6 ${overallConfig.icon}`} />}
            {overallStatus === "degraded" && <WarningIcon className={`w-6 h-6 ${overallConfig.icon}`} />}
            {overallStatus === "down" && <ErrorIcon className={`w-6 h-6 ${overallConfig.icon}`} />}
            {overallStatus === "unknown" && <span className={`w-6 h-6 rounded-full border-2 border-current ${overallConfig.icon}`} />}
            <div>
              <h2 className={`text-lg font-semibold ${overallConfig.icon}`}>{overallConfig.label}</h2>
              <p className="text-sm text-[var(--cc-body)] mt-0.5">
                {lastRefresh ? `${t("lastChecked")} ${formatTime(lastRefresh)}` : t("checking")}
                {refreshing && ` (${t("refreshing")})`}
              </p>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <h3 className="text-base font-semibold text-[var(--cc-ink)] mb-4">
              ⚡ {t("activeIncidents")} ({activeIncidents.length})
            </h3>
            <div className="space-y-4">
              {activeIncidents.map((inc) => (
                <IncidentCard key={inc.id} incident={inc} />
              ))}
            </div>
          </section>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        {/* Service Cards */}
        <section className="mb-8">
          <h3 className="text-base font-semibold text-[var(--cc-ink)] mb-4">{t("services")}</h3>
          <div className="space-y-4">
            {!configLoaded ? (
              <div className="text-center py-12 text-[var(--cc-body)] animate-fade-in">
                <RefreshIcon spinning />
                <p className="mt-4">{t("loadingConfig")}</p>
              </div>
            ) : (
              services.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))
            )}
          </div>
        </section>

        {/* Resolved Incidents */}
        {resolvedIncidents.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <h3 className="text-base font-semibold text-[var(--cc-ink)] mb-4">
              {t("resolvedIncidents")} ({resolvedIncidents.length})
            </h3>
            <div className="space-y-4">
              {resolvedIncidents.map((inc) => (
                <IncidentCard key={inc.id} incident={inc} />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
