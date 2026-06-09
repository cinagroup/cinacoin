"use client";

import MetricCard from "@/components/MetricCard";
import { formatNumber } from "@/lib/utils";

/**
 * Backend services overview page.
 */
export default function BackendPage() {
  const services = [
    { name: "RPC Proxy", status: "healthy", requests: "1.2M", latency: "45ms", uptime: "99.98%" },
    { name: "Keys Server", status: "healthy", requests: "458K", latency: "32ms", uptime: "99.99%" },
    { name: "Relay Server", status: "healthy", requests: "892K", latency: "67ms", uptime: "99.95%" },
    { name: "Notify Server", status: "warning", requests: "234K", latency: "128ms", uptime: "99.87%" },
    { name: "Push Server", status: "healthy", requests: "567K", latency: "89ms", uptime: "99.92%" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Backend Services</h1>
        <p className="text-sm text-[var(--cc-muted)] mt-1">
          Monitor and manage backend infrastructure
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests (24h)"
          value="3.4M"
          delta={{ value: 12.5, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
        />
        <MetricCard
          title="Avg Latency"
          value="72ms"
          delta={{ value: -8.3, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Error Rate"
          value="0.08%"
          delta={{ value: -15.2, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <MetricCard
          title="Uptime"
          value="99.95%"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Services table */}
      <div className="cc-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="text-sm font-semibold text-[var(--cc-ink)]">Services</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--cc-canvas-soft)]">
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">Service</th>
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">Status</th>
                <th className="text-right py-3 px-5 text-[var(--cc-muted)] font-medium">Requests (24h)</th>
                <th className="text-right py-3 px-5 text-[var(--cc-muted)] font-medium">Avg Latency</th>
                <th className="text-right py-3 px-5 text-[var(--cc-muted)] font-medium">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cc-hairline)]">
              {services.map((service) => (
                <tr key={service.name} className="hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="py-3 px-5 font-medium text-[var(--cc-ink)]">{service.name}</td>
                  <td className="py-3 px-5">
                    <span
                      className={`cc-badge ${
                        service.status === "healthy"
                          ? "cc-badge-success"
                          : service.status === "warning"
                          ? "cc-badge-warning"
                          : "cc-badge-danger"
                      }`}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right text-[var(--cc-ink)]">{service.requests}</td>
                  <td className="py-3 px-5 text-right text-[var(--cc-ink)]">{service.latency}</td>
                  <td className="py-3 px-5 text-right text-[var(--cc-ink)]">{service.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
