"use client";

import { useState } from "react";

const currentPlan = {
  name: "Pro",
  price: "$99",
  period: "/month",
  description: "For growing projects and teams",
  features: [
    "1,000,000 API requests/month",
    "10 API keys",
    "5 projects",
    "Priority support",
    "Advanced analytics",
  ],
};

const usageStats = [
  {
    label: "API Requests",
    used: 842_301,
    total: 1_000_000,
    unit: "requests",
    color: "bg-link",
    warning: false,
  },
  {
    label: "API Keys",
    used: 3,
    total: 10,
    unit: "keys",
    color: "bg-success",
    warning: false,
  },
  {
    label: "Projects",
    used: 4,
    total: 5,
    unit: "projects",
    color: "bg-warning",
    warning: true,
  },
  {
    label: "Storage",
    used: 2.4,
    total: 10,
    unit: "GB",
    color: "bg-success",
    warning: false,
  },
];

const availablePlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For testing and personal projects",
    features: [
      "10,000 API requests/month",
      "2 API keys",
      "1 project",
      "Community support",
    ],
    current: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing projects and teams",
    features: [
      "1,000,000 API requests/month",
      "10 API keys",
      "5 projects",
      "Priority support",
      "Advanced analytics",
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: "$499",
    period: "/month",
    description: "For large-scale applications",
    features: [
      "10,000,000 API requests/month",
      "Unlimited API keys",
      "Unlimited projects",
      "24/7 dedicated support",
      "Custom SLA",
      "Advanced security",
    ],
    current: false,
  },
];

export default function BillingPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-md font-semibold text-ink">Billing & Quotas</h1>
        <p className="text-ink-body mt-1">
          Manage your subscription and monitor usage limits.
        </p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-body-lg font-semibold text-ink">Current Plan</h2>
              <span className="badge badge-success">Active</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-display-lg font-bold text-ink">{currentPlan.price}</span>
              <span className="text-ink-mute">{currentPlan.period}</span>
            </div>
            <p className="text-body-sm text-ink-body mb-3">{currentPlan.description}</p>
            <ul className="space-y-1">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="text-body-sm text-ink-body flex items-center gap-2">
                  <span className="text-success">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right">
            <div className="text-body-sm text-ink-mute mb-2">Next billing date</div>
            <div className="text-body-sm font-medium text-ink">July 10, 2026</div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary mt-4"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Usage vs Quota */}
      <div>
        <h2 className="text-body-lg font-semibold text-ink mb-4">Usage vs Quota</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usageStats.map((stat) => {
            const percentage = (stat.used / stat.total) * 100;
            return (
              <div key={stat.label} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm font-medium text-ink">{stat.label}</span>
                  <span className="text-body-sm text-ink-mute">
                    {stat.used.toLocaleString()} / {stat.total.toLocaleString()} {stat.unit}
                  </span>
                </div>
                <div className="w-full bg-canvas-soft-2 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${stat.color} transition-all duration-300 ${
                      percentage > 90 ? "bg-danger" : percentage > 70 ? "bg-warning" : ""
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-caption text-ink-mute">
                    {percentage.toFixed(1)}% used
                  </span>
                  {stat.warning && (
                    <span className="text-caption text-warning font-medium">
                      ⚠️ Approaching limit
                    </span>
                  )}
                  {percentage > 90 && (
                    <span className="text-caption text-danger font-medium">
                      ⚠️ Near quota
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="card">
        <h2 className="text-body-lg font-semibold text-ink mb-4">Recent Invoices</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-canvas-soft transition-colors">
                <td className="text-ink-mute">June 10, 2026</td>
                <td className="text-ink">Pro Plan - Monthly</td>
                <td className="text-ink font-medium">$99.00</td>
                <td>
                  <span className="badge badge-success">Paid</span>
                </td>
                <td>
                  <button className="text-link hover:text-link-hover text-body-sm font-medium">
                    Download
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-canvas-soft transition-colors">
                <td className="text-ink-mute">May 10, 2026</td>
                <td className="text-ink">Pro Plan - Monthly</td>
                <td className="text-ink font-medium">$99.00</td>
                <td>
                  <span className="badge badge-success">Paid</span>
                </td>
                <td>
                  <button className="text-link hover:text-link-hover text-body-sm font-medium">
                    Download
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-canvas-soft transition-colors">
                <td className="text-ink-mute">April 10, 2026</td>
                <td className="text-ink">Pro Plan - Monthly</td>
                <td className="text-ink font-medium">$99.00</td>
                <td>
                  <span className="badge badge-success">Paid</span>
                </td>
                <td>
                  <button className="text-link hover:text-link-hover text-body-sm font-medium">
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display-sm font-semibold text-ink">Choose Your Plan</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-ink-mute hover:text-ink text-display-md leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-4 ${
                    plan.current
                      ? "border-ink bg-canvas-soft"
                      : "border-hairline hover:border-hairline-dark"
                  }`}
                >
                  {plan.current && (
                    <div className="text-caption font-medium text-ink mb-2">Current Plan</div>
                  )}
                  <h3 className="text-body-lg font-semibold text-ink mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-display-md font-bold text-ink">{plan.price}</span>
                    <span className="text-body-sm text-ink-mute">{plan.period}</span>
                  </div>
                  <p className="text-body-sm text-ink-body mb-4">{plan.description}</p>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-body-sm text-ink-body flex items-start gap-2">
                        <span className="text-success mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full ${plan.current ? "btn-secondary" : "btn-primary"} justify-center`}
                    disabled={plan.current}
                  >
                    {plan.current ? "Current Plan" : plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
