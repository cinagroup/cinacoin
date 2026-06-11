"use client";

import { Sidebar } from "@/components/Sidebar";
import { UserManagement } from "@/components/UserManagement";
import { NewsletterSubscribers } from "@/components/NewsletterSubscribers";
import { PermissionManagement } from "@/components/PermissionManagement";
import { SystemConfig } from "@/components/SystemConfig";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";
import { AuditLog } from "@/components/AuditLog";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("users");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ErrorBoundary>
    <div className="flex min-h-screen bg-canvas-soft">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-[var(--color-ink)]/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Mobile drawer sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 lg:ml-60 p-lg">
        {/* Mobile header */}
        <div className="lg:hidden mb-md flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-sm text-body hover:text-ink hover:bg-canvas-soft transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-heading-2 text-ink">Backend admin.</h1>
        </div>

        <div className="max-w-7xl mx-auto">
          <header className="mb-lg hidden lg:block">
            <h1 className="text-heading-1 text-ink">
              Backend administration.
            </h1>
            <p className="text-body text-body-color mt-1">
              Manage users, permissions, and system configuration.
            </p>
          </header>

          {activeTab === "users" && <UserManagement />}
          {activeTab === "newsletter" && <NewsletterSubscribers />}
          {activeTab === "permissions" && <PermissionManagement />}
          {activeTab === "2fa" && <TwoFactorAuth />}
          {activeTab === "audit" && <AuditLog />}
          {activeTab === "config" && <SystemConfig />}
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}
