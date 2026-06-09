"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mockInvoices = [
    { id: "INV-2026-001", date: "2026-06-01", amount: "$125.50", status: "paid" },
    { id: "INV-2026-002", date: "2026-05-01", amount: "$98.75", status: "paid" },
    { id: "INV-2026-003", date: "2026-04-01", amount: "$142.30", status: "paid" },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-canvas border-b border-hairline h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-canvas-soft-2 mr-4 transition-colors duration-fast"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-heading-2 text-ink">Billing</h1>
            <p className="text-body-sm text-body mt-1">Manage your subscription and billing</p>
          </div>

          {/* Current Plan */}
          <div className="bg-canvas border border-hairline rounded-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-heading-3 text-ink mb-1">Current Plan</h2>
                <p className="text-body-sm text-body">Professional Plan</p>
              </div>
              <button className="btn-secondary px-4 py-2">
                Upgrade Plan
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-hairline">
              <div>
                <p className="text-caption text-mute mb-1">Monthly Cost</p>
                <p className="text-heading-3 text-ink">$99/mo</p>
              </div>
              <div>
                <p className="text-caption text-mute mb-1">Next Billing Date</p>
                <p className="text-body-sm text-ink">July 1, 2026</p>
              </div>
              <div>
                <p className="text-caption text-mute mb-1">Payment Method</p>
                <p className="text-body-sm text-ink">Visa •••• 4242</p>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="bg-canvas border border-hairline rounded-md p-6 mb-6">
            <h2 className="text-heading-3 text-ink mb-4">Current Usage</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Compute Resources</span>
                  <span className="text-ink font-medium">8 / 10 vCPUs</span>
                </div>
                <div className="w-full bg-canvas-soft-2 rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Storage</span>
                  <span className="text-ink font-medium">450 GB / 1 TB</span>
                </div>
                <div className="w-full bg-canvas-soft-2 rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Bandwidth</span>
                  <span className="text-ink font-medium">2.1 TB / 5 TB</span>
                </div>
                <div className="w-full bg-canvas-soft-2 rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <div className="px-6 py-4 border-b border-hairline">
              <h2 className="text-heading-3 text-ink">Invoice History</h2>
            </div>
            <table className="w-full">
              <thead className="bg-canvas-soft-2 border-b border-hairline">
                <tr>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Invoice</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-caption font-medium text-mute uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-hairline last:border-b-0 hover:bg-canvas-soft transition-colors">
                    <td className="px-6 py-4 text-body-sm text-ink font-medium">{invoice.id}</td>
                    <td className="px-6 py-4 text-body-sm text-body">{invoice.date}</td>
                    <td className="px-6 py-4 text-body-sm text-ink font-medium">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <span className="badge badge-success">{invoice.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-body-sm text-link hover:underline">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
