"use client";

import { useState, useMemo } from "react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  category: "auth" | "users" | "permissions" | "system" | "content" | "api";
  details: string;
  ipAddress: string;
  status: "success" | "failure" | "warning";
  metadata?: Record<string, string>;
}

const mockAuditLogs: AuditEntry[] = [
  { id: "1", timestamp: "2026-06-09T04:55:00Z", user: "Super Admin", userEmail: "root@cinacoin.com", action: "user.created", category: "users", details: "Created new user account for alice@example.com", ipAddress: "192.168.1.100", status: "success" },
  { id: "2", timestamp: "2026-06-09T04:48:00Z", user: "Super Admin", userEmail: "root@cinacoin.com", action: "auth.login", category: "auth", details: "Successful login from new device", ipAddress: "192.168.1.100", status: "success" },
  { id: "3", timestamp: "2026-06-09T04:30:00Z", user: "Admin John", userEmail: "john@cinacoin.com", action: "permission.role_updated", category: "permissions", details: "Updated Editor role permissions", ipAddress: "10.0.0.52", status: "success" },
  { id: "4", timestamp: "2026-06-09T04:15:00Z", user: "Admin John", userEmail: "john@cinacoin.com", action: "user.suspended", category: "users", details: "Suspended user bob@example.com for policy violation", ipAddress: "10.0.0.52", status: "success" },
  { id: "5", timestamp: "2026-06-09T03:50:00Z", user: "System", userEmail: "system@cinacoin.com", action: "system.config_updated", category: "system", details: "Rate limit changed from 500 to 1000 req/min", ipAddress: "127.0.0.1", status: "success" },
  { id: "6", timestamp: "2026-06-09T03:30:00Z", user: "Unknown", userEmail: "—", action: "auth.login_failed", category: "auth", details: "Failed login attempt for admin@cinacoin.com (invalid password)", ipAddress: "203.0.113.42", status: "failure" },
  { id: "7", timestamp: "2026-06-09T03:12:00Z", user: "Unknown", userEmail: "—", action: "auth.login_failed", category: "auth", details: "Failed login attempt for admin@cinacoin.com (invalid password)", ipAddress: "203.0.113.42", status: "failure" },
  { id: "8", timestamp: "2026-06-09T02:45:00Z", user: "Super Admin", userEmail: "root@cinacoin.com", action: "system.backup", category: "system", details: "Manual database backup initiated", ipAddress: "192.168.1.100", status: "success" },
  { id: "9", timestamp: "2026-06-09T02:30:00Z", user: "Admin John", userEmail: "john@cinacoin.com", action: "api.key_generated", category: "api", details: "Generated new API key for service account", ipAddress: "10.0.0.52", status: "success" },
  { id: "10", timestamp: "2026-06-09T02:00:00Z", user: "Super Admin", userEmail: "root@cinacoin.com", action: "2fa.enabled", category: "auth", details: "Two-factor authentication enabled", ipAddress: "192.168.1.100", status: "success" },
  { id: "11", timestamp: "2026-06-09T01:30:00Z", user: "System", userEmail: "system@cinacoin.com", action: "system.maintenance", category: "system", details: "Scheduled maintenance window started", ipAddress: "127.0.0.1", status: "warning" },
  { id: "12", timestamp: "2026-06-09T01:00:00Z", user: "Admin John", userEmail: "john@cinacoin.com", action: "content.deleted", category: "content", details: "Deleted 3 spam content items", ipAddress: "10.0.0.52", status: "success" },
  { id: "13", timestamp: "2026-06-08T23:45:00Z", user: "Super Admin", userEmail: "root@cinacoin.com", action: "user.role_changed", category: "users", details: "Changed user charlie@example.com role from User to Moderator", ipAddress: "192.168.1.100", status: "success" },
  { id: "14", timestamp: "2026-06-08T22:30:00Z", user: "System", userEmail: "system@cinacoin.com", action: "system.alert", category: "system", details: "CPU usage exceeded 85% threshold", ipAddress: "127.0.0.1", status: "warning" },
  { id: "15", timestamp: "2026-06-08T21:00:00Z", user: "Unknown", userEmail: "—", action: "auth.login_failed", category: "auth", details: "Failed login attempt — account locked after 5 attempts", ipAddress: "198.51.100.23", status: "failure" },
];

const categoryLabels: Record<string, string> = {
  auth: "Authentication",
  users: "User Management",
  permissions: "Permissions",
  system: "System",
  content: "Content",
  api: "API",
};

const statusStyles: Record<string, string> = {
  success: "badge-success",
  failure: "badge-error",
  warning: "badge-warning",
};

const categoryIcons: Record<string, string> = {
  auth: "🔐",
  users: "👥",
  permissions: "🛡️",
  system: "⚙️",
  content: "📝",
  api: "🔌",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState("24h");
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((entry) => {
      const matchesSearch =
        searchTerm === "" ||
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.ipAddress.includes(searchTerm);
      const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, categoryFilter, statusFilter]);

  const allSelected = filteredLogs.length > 0 && selectedEntries.size === filteredLogs.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredLogs.map((e) => e.id)));
    }
  };

  const handleSelectEntry = (id: string) => {
    const newSet = new Set(selectedEntries);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEntries(newSet);
  };

  const handleExport = (format: "csv" | "json") => {
    const dataToExport = selectedEntries.size > 0
      ? mockAuditLogs.filter((e) => selectedEntries.has(e.id))
      : filteredLogs;

    if (format === "csv") {
      const headers = "Timestamp,User,Action,Category,Details,IP Address,Status\n";
      const rows = dataToExport.map((e) =>
        `"${e.timestamp}","${e.user}","${e.action}","${e.category}","${e.details}","${e.ipAddress}","${e.status}"`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-lg">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
        <div className="card p-md">
          <p className="text-caption text-mute uppercase tracking-wider mb-1">Total Events</p>
          <p className="text-heading-2 text-ink">{mockAuditLogs.length}</p>
          <p className="text-caption text-body-color mt-1">Last 24 hours</p>
        </div>
        <div className="card p-md">
          <p className="text-caption text-mute uppercase tracking-wider mb-1">Failed Attempts</p>
          <p className="text-heading-2 text-error">
            {mockAuditLogs.filter((e) => e.status === "failure").length}
          </p>
          <p className="text-caption text-body-color mt-1">Requires attention</p>
        </div>
        <div className="card p-md">
          <p className="text-caption text-mute uppercase tracking-wider mb-1">Auth Events</p>
          <p className="text-heading-2 text-ink">
            {mockAuditLogs.filter((e) => e.category === "auth").length}
          </p>
          <p className="text-caption text-body-color mt-1">Logins & 2FA</p>
        </div>
        <div className="card p-md">
          <p className="text-caption text-mute uppercase tracking-wider mb-1">System Changes</p>
          <p className="text-heading-2 text-ink">
            {mockAuditLogs.filter((e) => e.category === "system").length}
          </p>
          <p className="text-caption text-body-color mt-1">Config & maintenance</p>
        </div>
      </div>

      {/* Main log table */}
      <div className="card">
        {/* Toolbar */}
        <div className="p-md border-b border-hairline">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-heading-3 text-ink">Audit Log</h2>
            <div className="flex items-center gap-2">
              {selectedEntries.size > 0 && (
                <span className="text-caption text-body-color mr-2">
                  {selectedEntries.size} selected
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => handleExport("csv")}
                  className="btn btn-secondary text-caption"
                >
                  <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export CSV
                </button>
              </div>
              <button
                onClick={() => handleExport("json")}
                className="btn btn-secondary text-caption"
              >
                <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Export JSON
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search actions, users, IPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input max-w-xs"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select w-auto"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
            <div className="flex items-center gap-1 bg-canvas-soft rounded-md p-1">
              {["1h", "24h", "7d", "30d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-caption font-medium rounded transition-colors ${
                    dateRange === range
                      ? "bg-canvas text-ink shadow-sm"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((entry) => (
                <tr
                  key={entry.id}
                  className={`${selectedEntries.has(entry.id) ? "bg-[var(--color-link-bg-soft)]/50" : ""}`}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => handleSelectEntry(entry.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div>
                      <p className="text-body-sm text-ink whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                      <p className="text-caption text-mute">
                        {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-body-sm font-medium text-ink">{entry.user}</p>
                      <p className="text-caption text-mute">{entry.userEmail}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{categoryIcons[entry.category]}</span>
                      <code className="text-code text-caption bg-canvas-soft-2 px-2 py-1 rounded">
                        {entry.action}
                      </code>
                    </div>
                  </td>
                  <td>
                    <p className="text-body-sm text-body-color max-w-xs truncate">
                      {entry.details}
                    </p>
                  </td>
                  <td>
                    <code className="text-code text-caption text-body-color">
                      {entry.ipAddress}
                    </code>
                  </td>
                  <td>
                    <span className={`badge ${statusStyles[entry.status]}`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-md border-t border-hairline flex items-center justify-between">
          <p className="text-body-sm text-body-color">
            Showing {filteredLogs.length} of {mockAuditLogs.length} entries
            {selectedEntries.size > 0 && ` · ${selectedEntries.size} selected`}
          </p>
          <div className="flex gap-2">
            <button className="btn btn-secondary text-caption" disabled>
              Previous
            </button>
            <button className="btn btn-secondary text-caption">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
