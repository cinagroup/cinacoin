"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  checkAllServices,
  saveToHistory,
  getHistory,
  loadHistoryUptimes,
  calculateOverallStatus,
  formatTime,
  formatDuration,
} from "@/lib/health-check";
import { fetchIncidents, severityConfig } from "@/lib/incidents";
import type { Incident } from "@/lib/incidents";
import { ServiceCheck, ServiceConfig, ServiceStatus, HistoryEntry } from "@/types";

import { useTheme } from "@/providers/ThemeProvider";
import { useI18n } from "@/providers/I18nProvider";
import type { Locale } from "@/providers/I18nProvider";

/* ---- Icons ---- */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-.994-9.638a9.955 9.955 0 0113.958 3.222M20.015 4.356a9.955 9.955 0 00-13.958-3.222" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

/* ---- Theme Toggle ---- */

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="cc-icon-button"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        /* sun */
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        /* moon */
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
      className="cc-form-input-sm"
      style={{ width: 'auto', cursor: 'pointer', textAlign: 'center' }}
      aria-label="Select language"
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

  const statusColorMap: Record<string, string> = {
    healthy: "text-[var(--cc-cyan-deep)] bg-[var(--cc-cyan-soft)] border-[var(--cc-cyan)]",
    degraded: "text-[var(--cc-warning-deep)] bg-[var(--cc-warning-soft)] border-[var(--cc-warning)]",
    down: "text-[var(--cc-error-deep)] bg-[var(--cc-error-soft)] border-[var(--cc-error)]",
    unknown: "text-[var(--cc-body)] bg-[var(--cc-canvas-soft-2)] border-[var(--cc-hairline)]",
  };
  const colorClasses = statusColorMap[status] || statusColorMap.unknown;

  return (
    <span className={`cc-badge inline-flex items-center gap-1.5 border ${colorClasses}`}>
      {status === "healthy" && <CheckIcon className="w-3 h-3" />}
      {status === "degraded" && <WarningIcon className="w-3 h-3" />}
      {status === "down" && <ErrorIcon className="w-3 h-3" />}
      {label}
    </span>
  );
}

function UptimeBadge({ uptime }: { uptime: number }) {
  const color = uptime >= 99.9 ? "text-[var(--cc-cyan-deep)]" : uptime >= 99 ? "text-[var(--cc-warning-deep)]" : "text-[var(--cc-error-deep)]";
  return (
    <span className={`cc-caption-mono ${color}`}>
      {uptime.toFixed(2)}%
    </span>
  );
}

function ServiceCard({ service }: { service: ServiceCheck }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const detailId = `details-${service.name}`;
  const statusColor = {
    healthy: "border-l-[var(--cc-cyan)]",
    degraded: "border-l-[var(--cc-warning)]",
    down: "border-l-[var(--cc-error)]",
    unknown: "border-l-[var(--cc-muted)]",
  }[service.status];

  const svcHistory = useMemo(() => {
    return getHistory().slice(-72).map((entry) => {
      const found = entry.services.find((s) => s.name === service.name);
      return found?.status || "unknown";
    });
  }, [service.name]);

  const dotColor = (s: string) => {
    if (s === "healthy") return "bg-[var(--cc-cyan)]";
    if (s === "degraded") return "bg-[var(--cc-warning)]";
    if (s === "down") return "bg-[var(--cc-error)]";
    return "bg-[var(--cc-hairline-strong)]";
  };

  return (
    <div className={`cc-card animate-fade-in border-l-4 ${statusColor} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left"
        aria-expanded={expanded}
        aria-controls={`details-${service.name}`}
        aria-label={`${service.name} - status: ${service.status}. Click to ${expanded ? "collapse" : "expand"} details.`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="cc-body-md-strong text-[var(--cc-ink)]">{service.name}</span>
            <p className="cc-body-sm text-[var(--cc-body)] mt-1">{service.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={service.status} />
            <ChevronIcon open={expanded} />
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="text-[var(--cc-body)]">{t("responseTime")}</span>
            <p className={`cc-code mt-0.5 ${service.responseTime !== null && service.responseTime < 1000 ? "text-[var(--cc-cyan-deep)]" : service.responseTime !== null && service.responseTime < 3000 ? "text-[var(--cc-warning-deep)]" : "text-[var(--cc-error-deep)]"}`}>
              {formatDuration(service.responseTime)}
            </p>
          </div>
          <div>
            <span className="text-[var(--cc-body)]">{t("uptime")}</span>
            <p className="mt-0.5"><UptimeBadge uptime={service.uptime} /></p>
          </div>
          <div>
            <span className="text-[var(--cc-body)]">{t("lastCheck")}</span>
            <p className="cc-code text-[var(--cc-muted)] mt-0.5">{formatTime(service.lastChecked)}</p>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[var(--cc-hairline)] pt-4 animate-fade-in" id={`details-${service.name}`}>
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="text-[var(--cc-muted)]" />
            <span className="cc-caption text-[var(--cc-muted)]">{t("last6Hours")}</span>
          </div>
          <div className="flex gap-px" role="img" aria-label={`Status history for ${service.name} over the last 6 hours`}>
            {svcHistory.map((status, idx) => (
              <div
                key={idx}
                className={`flex-1 h-8 ${dotColor(status)} transition-colors duration-300`}
                title={`${status}`}
                style={{ borderRadius: 'var(--cc-radius-xs)' }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 cc-caption text-[var(--cc-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--cc-cyan)]" style={{ borderRadius: 'var(--cc-radius-xs)' }} /> {t("statusOperational")}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--cc-warning)]" style={{ borderRadius: 'var(--cc-radius-xs)' }} /> {t("statusDegraded")}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--cc-error)]" style={{ borderRadius: 'var(--cc-radius-xs)' }} /> {t("statusDown")}</span>
          </div>
          {service.error && (
            <div className="cc-code mt-3 px-3 py-2 rounded-[var(--cc-radius-sm)]" style={{ background: 'var(--cc-error-soft)', border: '1px solid var(--cc-error)', color: 'var(--cc-error-deep)' }}>
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
    <div className={`cc-card animate-fade-in ${isActive ? "border-[var(--cc-warning)]/30" : "border-[var(--cc-hairline)]"}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Incident severity and status">
            <h4 className="cc-body-sm-strong text-[var(--cc-ink)]">{incident.title}</h4>
            <span className={`cc-badge ${sev.bg} ${sev.text} border ${sev.border}`}>
              {sevLabel}
            </span>
            <span className={`cc-badge ${isActive ? "bg-[var(--cc-warning-soft)] text-[var(--cc-warning-deep)] border-[var(--cc-warning)]" : "bg-[var(--cc-cyan-soft)] text-[var(--cc-cyan-deep)] border-[var(--cc-cyan)]"}`}>
              {incStatusLabel}
            </span>
          </div>
          <p className="cc-caption text-[var(--cc-muted)] mt-1">
            {t("affected")}: {incident.affected_services.join(", ")}
          </p>
        </div>
        <span className="cc-caption text-[var(--cc-muted)] whitespace-nowrap">
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
                <div className={`w-2 h-2 rounded-full ${idx === incident.updates.length - 1 && incident.status === "resolved" ? "bg-[var(--cc-cyan)]" : "bg-[var(--cc-muted)]"}`} />
                {idx < incident.updates.length - 1 && <div className="w-px h-full bg-[var(--cc-hairline)] mt-1" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`cc-body-sm-strong ${sev.text}`}>{updStatusLabel}</span>
                  <span className="cc-caption text-[var(--cc-muted)]">{formatTime(update.timestamp)}</span>
                </div>
                <p className="cc-body-sm text-[var(--cc-body)]">{update.message}</p>
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
    <footer className="cc-footer mt-12" role="contentinfo">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Cinacoin" width={24} height={24} className="h-6 w-6 rounded" loading="lazy" />
          <span className="cc-body-sm-strong text-[var(--cc-ink)]">Cinacoin</span>
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
      <p className="mt-8 cc-caption text-[var(--cc-muted)]">
        © 2026 Cinacoin · {t("healthChecksInfo")}
      </p>
    </footer>
  );
}

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
    healthy: { gradient: "from-[var(--cc-cyan)]/20 to-[var(--cc-cyan)]/5", border: "border-[var(--cc-cyan)]/30", icon: "text-[var(--cc-cyan-deep)]", label: t("allOperational") },
    degraded: { gradient: "from-[var(--cc-warning)]/20 to-[var(--cc-warning)]/5", border: "border-[var(--cc-warning)]/30", icon: "text-[var(--cc-warning-deep)]", label: t("someDegraded") },
    down: { gradient: "from-[var(--cc-error)]/20 to-[var(--cc-error)]/5", border: "border-[var(--cc-error)]/30", icon: "text-[var(--cc-error-deep)]", label: t("systemOutage") },
    unknown: { gradient: "from-[var(--cc-muted)]/20 to-[var(--cc-muted)]/5", border: "border-[var(--cc-hairline-strong)]/30", icon: "text-[var(--cc-muted)]", label: t("statusUnknown") },
  }[overallStatus];

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  // Screen reader status announcement
  const statusAnnouncement = useMemo(() => {
    if (!configLoaded) return "Loading service status...";
    return `Overall status: ${overallConfig.label}. ${services.length} services checked.`;
  }, [configLoaded, overallConfig.label, services.length]);

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--cc-primary)] focus:text-[var(--cc-on-primary)] focus:rounded-[var(--cc-radius-sm)]"
      >
        Skip to main content
      </a>

      {/* Top nav bar — consistent brand lockup */}
      <header className="sticky top-0 z-50 h-16 bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)]">
        <div className="cc-container px-4 h-16 flex items-center justify-between">
          <a href="https://cinacoin.com" className="flex items-center gap-2" aria-label="Cinacoin home">
            <img src="/logo.svg" alt="Cinacoin" width={28} height={28} className="h-7 w-7 rounded-md" loading="lazy" />
            <span className="cc-body-md-strong text-[var(--cc-ink)]">
              Cinacoin <span className="cc-body-md text-[var(--cc-muted)] font-normal">Status</span>
            </span>
          </a>
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <a className="cc-navbar-link" href="https://docs.cinacoin.com">Docs</a>
            <a className="cc-navbar-link" href="https://cinacoin.com">Home</a>
          </nav>
        </div>
      </header>

      <div id="main-content" className="cc-container px-4 py-8 sm:py-12">
        {/* Page title */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="cc-display-md text-[var(--cc-ink)]">{t("pageTitle")}</h1>
              <p className="cc-body-sm text-[var(--cc-body)] mt-1">{t("siteName")}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LanguageSelector />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-1.5 cc-btn-secondary-sm transition-colors ${
                  autoRefresh
                    ? "cc-btn-auto-refresh-active"
                    : ""
                }`}
                aria-label={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
                aria-pressed={autoRefresh}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-[var(--cc-link)] animate-pulse-dot" : "bg-[var(--cc-hairline-strong)]"}`} />
                {t("autoRefresh")}
              </button>
              <button
                type="button"
                onClick={runChecks}
                disabled={refreshing}
                className="cc-btn-primary-sm flex items-center gap-1.5 disabled:opacity-50"
                aria-label="Refresh service status checks"
              >
                <RefreshIcon spinning={refreshing} />
                {t("refresh")}
              </button>
            </div>
          </div>
        </header>

        {/* Screen reader live region */}
        <div role="status" aria-live="polite" className="sr-only" aria-atomic="true">
          {statusAnnouncement}
        </div>

        {/* Overall Status */}
        <div
          className={`mb-8 rounded-[var(--cc-radius-md)] border ${overallConfig.border} bg-gradient-to-r ${overallConfig.gradient} p-6 animate-fade-in`}
          role="status"
          aria-live="polite"
          style={{ boxShadow: 'var(--cc-level4)' }}
        >
          <div className="flex items-center gap-3">
            {overallStatus === "healthy" && <CheckIcon className={`w-6 h-6 ${overallConfig.icon}`} />}
            {overallStatus === "degraded" && <WarningIcon className={`w-6 h-6 ${overallConfig.icon}`} />}
            {overallStatus === "down" && <ErrorIcon className={`w-6 h-6 ${overallConfig.icon}`} />}
            {overallStatus === "unknown" && <span className={`w-6 h-6 rounded-full border-2 border-current ${overallConfig.icon}`} />}
            <div>
              <h2 className={`cc-display-sm ${overallConfig.icon}`}>{overallConfig.label}</h2>
              <p className="cc-body-sm text-[var(--cc-body)] mt-0.5">
                {lastRefresh ? `${t("lastChecked")} ${formatTime(lastRefresh)}` : t("checking")}
                {refreshing && ` (${t("refreshing")})`}
              </p>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <section className="mb-8 animate-fade-in" aria-label="Active incidents">
            <h3 className="cc-display-sm text-[var(--cc-ink)] mb-4">
              {t("activeIncidents")} ({activeIncidents.length})
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
          <div
            className="mb-6 px-4 py-3 rounded-[var(--cc-radius-sm)] animate-fade-in cc-body-sm"
            role="alert"
            style={{ background: 'var(--cc-error-soft)', border: '1px solid var(--cc-error)', color: 'var(--cc-error-deep)' }}
          >
            {error}
          </div>
        )}

        {/* Service Cards */}
        <section className="mb-8" aria-label={t("services")}>
          <h3 className="cc-display-sm text-[var(--cc-ink)] mb-4">{t("services")}</h3>
          <div className="space-y-4">
            {!configLoaded ? (
              <div className="text-center py-12 text-[var(--cc-body)] animate-fade-in" role="status">
                <RefreshIcon spinning />
                <p className="mt-4 cc-body-sm">{t("loadingConfig")}</p>
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[var(--cc-radius-md)] border border-dashed border-[var(--cc-hairline-strong)] py-16 text-center bg-[var(--cc-canvas)]" role="status">
                <WarningIcon className="mb-4 h-12 w-12 text-[var(--cc-muted)]" />
                <p className="cc-display-sm text-[var(--cc-ink)]">No services configured</p>
                <p className="cc-body-sm text-[var(--cc-body)] mt-1">Add services to /service-status.json</p>
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
          <section className="mb-8 animate-fade-in" aria-label="Resolved incidents">
            <h3 className="cc-display-sm text-[var(--cc-ink)] mb-4">
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
