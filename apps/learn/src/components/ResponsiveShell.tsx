"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2"
        style={{
          backgroundColor: 'var(--cc-canvas)',
          border: '1px solid var(--cc-hairline)',
          borderRadius: 'var(--cc-radius-md)',
          boxShadow: 'var(--cc-shadow-3)'
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
      >
        <svg 
          className="w-6 h-6" 
          style={{ color: 'var(--cc-ink)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'rgba(23, 23, 23, 0.5)' }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <main 
        className="flex-1 lg:ml-64"
        style={{ padding: 'var(--cc-space-lg)' }}
      >
        {children}
      </main>
    </div>
  );
}
