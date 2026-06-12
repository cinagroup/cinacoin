"use client";

import { useState } from "react";
import { Menu, Download, CreditCard } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mockInvoices = [
    { id: "INV-2026-001", date: "Jun 1, 2026", amount: "$125.50", status: "paid" },
    { id: "INV-2026-002", date: "May 1, 2026", amount: "$98.75", status: "paid" },
    { id: "INV-2026-003", date: "Apr 1, 2026", amount: "$142.30", status: "paid" },
    { id: "INV-2026-004", date: "Mar 1, 2026", amount: "$110.20", status: "paid" },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)] h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-[var(--cc-canvas-soft-2)] mr-4 transition-colors duration-fast"
          >
            <Menu className="w-5 h-5 text-body" />
          </button>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-heading-2 text-[var(--cc-ink)]">Billing & usage.</h1>
            <p className="text-body-sm text-body mt-1">Professional plan · Next billing: July 1, 2026</p>
          </div>

          {/* Current Plan */}
          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-heading-3 text-[var(--cc-ink)] mb-1">Professional plan.</h2>
                <p className="text-body-sm text-body">$99/month · Billed monthly</p>
              </div>
              <button className="cc-btn-secondary px-4 py-2">
                Upgrade plan
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--cc-hairline)]">
              <div>
                <p className="text-caption text-[var(--cc-muted)] mb-1">Monthly cost</p>
                <p className="text-heading-3 text-[var(--cc-ink)]">$99</p>
              </div>
              <div>
                <p className="text-caption text-[var(--cc-muted)] mb-1">Next billing date</p>
                <p className="text-body-sm text-[var(--cc-ink)]">July 1, 2026</p>
              </div>
              <div>
                <p className="text-caption text-[var(--cc-muted)] mb-1">Payment method</p>
                <p className="text-body-sm text-[var(--cc-ink)]">Visa •••• 4242</p>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-3 text-[var(--cc-ink)]">Current usage.</h2>
              <span className="text-caption text-[var(--cc-muted)]">Billing period: Jun 1 - Jun 30, 2026</span>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Compute resources</span>
                  <span className="text-[var(--cc-ink)] font-medium">8 / 10 vCPUs</span>
                </div>
                <div className="w-full bg-[var(--cc-canvas-soft-2)] rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-caption text-[var(--cc-muted)] mt-1">$48.50 of $99 budget used</p>
              </div>
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Storage</span>
                  <span className="text-[var(--cc-ink)] font-medium">450 GB / 1 TB</span>
                </div>
                <div className="w-full bg-[var(--cc-canvas-soft-2)] rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-caption text-[var(--cc-muted)] mt-1">$22.25 of $99 budget used</p>
              </div>
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Bandwidth</span>
                  <span className="text-[var(--cc-ink)] font-medium">2.1 TB / 5 TB</span>
                </div>
                <div className="w-full bg-[var(--cc-canvas-soft-2)] rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
                <p className="text-caption text-[var(--cc-muted)] mt-1">$15.75 of $99 budget used</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--cc-hairline)]">
              <div className="flex justify-between items-center">
                <span className="text-body-sm font-medium text-[var(--cc-ink)]">Total usage</span>
                <span className="text-body-sm font-medium text-[var(--cc-ink)]">$86.50 / $99.00</span>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--cc-hairline)]">
              <h2 className="text-heading-3 text-[var(--cc-ink)]">Invoice history.</h2>
            </div>
            <table className="w-full">
              <thead className="bg-[var(--cc-canvas-soft-2)] border-b border-[var(--cc-hairline)]">
                <tr>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Invoice</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Date</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Amount</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Status</th>
                  <th className="text-right px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--cc-hairline)] last:border-b-0 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                    <td className="px-6 py-4 text-body-sm text-[var(--cc-ink)] font-medium">{invoice.id}</td>
                    <td className="px-6 py-4 text-body-sm text-body">{invoice.date}</td>
                    <td className="px-6 py-4 text-body-sm text-[var(--cc-ink)] font-medium">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <span className="badge badge-success">{invoice.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-2 text-body-sm text-link hover:underline">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Methods */}
          <div className="mt-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-3 text-[var(--cc-ink)]">Payment methods.</h2>
              <button className="cc-btn-secondary px-4 py-2">
                + Add method
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[var(--cc-ink)]" />
                  <div>
                    <p className="text-body-sm font-medium text-[var(--cc-ink)]">Visa •••• 4242</p>
                    <p className="text-caption text-[var(--cc-muted)]">Expires 12/2028</p>
                  </div>
                </div>
                <span className="badge badge-success">Default</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
