"use client";

import { logger } from '@cinacoin/logger';
import { useState, useEffect } from "react";
import { Mail } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  verified_at: number | null;
  created_at: number;
}

export function NewsletterSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const USERS_BASE = process.env.NEXT_PUBLIC_USERS_URL || 'https://users.cinacoin.com';

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${USERS_BASE}/api/newsletter/subscribers?page=${page}&limit=20`
      );
      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setTotal(data.subscribers?.length || 0);
    } catch (error) {
      logger.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [page]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm p-lg">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">NEWSLETTER</p>
          <h2 className="text-heading-2 text-[var(--cc-ink)]">Newsletter subscribers.</h2>
          <p className="text-body text-[var(--cc-body)] mt-1">
            Manage newsletter subscriptions
          </p>
        </div>
        <button
          onClick={fetchSubscribers}
          className="px-4 py-2 bg-[var(--cc-canvas-soft-2)] hover:bg-[var(--cc-canvas-soft)] text-body-sm font-medium text-[var(--cc-ink)] rounded-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
          <p className="text-body text-[var(--cc-body)] mt-4">Loading subscribers...</p>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-body text-[var(--cc-body)]">No subscribers yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--cc-hairline)]">
                  <th className="text-left text-caption font-medium text-[var(--cc-muted)] tracking-wider pb-3">
                    Email
                  </th>
                  <th className="text-left text-caption font-medium text-[var(--cc-muted)] tracking-wider pb-3">
                    Name
                  </th>
                  <th className="text-left text-caption font-medium text-[var(--cc-muted)] tracking-wider pb-3">
                    Source
                  </th>
                  <th className="text-left text-caption font-medium text-[var(--cc-muted)] tracking-wider pb-3">
                    Status
                  </th>
                  <th className="text-left text-caption font-medium text-[var(--cc-muted)] tracking-wider pb-3">
                    Subscribed
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Mail className="w-8 h-8 text-[var(--cc-ink)] mb-4" />
                        <h3 className="text-heading-3 text-[var(--cc-ink)] mb-1">No subscribers yet</h3>
                        <p className="text-body-sm text-[var(--cc-muted)] max-w-sm">Newsletter subscribers will appear here once people sign up.</p>
                      </div>
                    </td>
                  </tr>
                ) : subscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-[var(--cc-hairline)] last:border-b-0"
                  >
                    <td className="py-4 text-body text-[var(--cc-ink)]">
                      {subscriber.email}
                    </td>
                    <td className="py-4 text-body text-[var(--cc-body)]">
                      {subscriber.name || "—"}
                    </td>
                    <td className="py-4 text-body text-[var(--cc-body)]">
                      {subscriber.source || "—"}
                    </td>
                    <td className="py-4">
                      {subscriber.verified_at ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-sm text-caption font-medium bg-[var(--color-success-soft,var(--color-link-bg-soft))] text-[var(--color-success)]">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-sm text-caption font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-body text-[var(--cc-body)]">
                      {formatDate(subscriber.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-lg pt-lg border-t border-[var(--cc-hairline)]">
            <p className="text-caption text-[var(--cc-muted)]">
              Showing {subscribers.length} subscribers
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-caption font-medium text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)] hover:bg-[var(--cc-canvas-soft)] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={subscribers.length < 20}
                className="px-3 py-2 text-caption font-medium text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)] hover:bg-[var(--cc-canvas-soft)] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
