"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
}

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [invoices] = useState<Invoice[]>([
    {
      id: "INV-2026-001",
      date: "2026-06-01",
      amount: "$677.75",
      status: "paid",
    },
    {
      id: "INV-2026-002",
      date: "2026-05-01",
      amount: "$612.30",
      status: "paid",
    },
    {
      id: "INV-2026-003",
      date: "2026-04-01",
      amount: "$589.45",
      status: "paid",
    },
  ]);

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-canvas border-b border-hairline h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-canvas-soft-2 mr-4 transition-colors duration-fast"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-body-sm font-medium text-ink">Billing</h1>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 className="text-heading-2 text-ink">Billing</h1>
              <p className="text-body-sm text-body mt-1">
                Manage your subscription, payment methods, and view invoices.
              </p>
            </div>

            {/* Current Plan */}
            <div className="bg-canvas rounded-md shadow-level-2 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-heading-3 text-ink">Current Plan</h2>
                  <p className="text-body-sm text-body mt-1">Professional Tier</p>
                </div>
                <button className="btn-secondary px-4 py-2">Change Plan</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-hairline">
                <div>
                  <p className="text-caption text-mute mb-1">Monthly Cost</p>
                  <p className="text-heading-3 text-ink">$677.75</p>
                </div>
                <div>
                  <p className="text-caption text-mute mb-1">Billing Cycle</p>
                  <p className="text-body-sm text-ink">Monthly (June 1st)</p>
                </div>
                <div>
                  <p className="text-caption text-mute mb-1">Next Invoice</p>
                  <p className="text-body-sm text-ink">July 1, 2026</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-canvas rounded-md shadow-level-2 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading-3 text-ink">Payment Method</h2>
                <button className="btn-secondary px-4 py-2">Update</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-canvas-soft-2 rounded-sm flex items-center justify-center">
                  <span className="text-caption font-medium text-ink">VISA</span>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-ink">•••• •••• •••• 4242</p>
                  <p className="text-caption text-mute">Expires 12/2028</p>
                </div>
              </div>
            </div>

            {/* Invoices */}
            <div className="bg-canvas rounded-md shadow-level-2 overflow-hidden">
              <div className="px-6 py-4 border-b border-hairline">
                <h2 className="text-heading-3 text-ink">Invoice History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-canvas-soft">
                    <tr>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Invoice ID
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-caption font-medium text-mute uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-canvas-soft transition-colors duration-fast">
                        <td className="px-6 py-4">
                          <p className="text-body-sm font-medium text-ink">{invoice.id}</p>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-body">{invoice.date}</td>
                        <td className="px-6 py-4 text-body-sm font-medium text-ink">{invoice.amount}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-pill text-caption font-medium ${
                              invoice.status === "paid"
                                ? "badge-success"
                                : invoice.status === "pending"
                                ? "badge-warning"
                                : "badge-error"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-caption text-link hover:underline">
                            Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
