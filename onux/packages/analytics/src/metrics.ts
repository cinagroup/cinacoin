/**
 * Metric calculations for analytics events.
 */

import { AnalyticsEvent } from './types.js';

/** Read a numeric value from an event's properties bag. */
function propNumber(e: AnalyticsEvent, key: string): number | undefined {
  const v = e.properties?.[key];
  return typeof v === 'number' ? v : undefined;
}

export interface ConnectionMetrics {
  /** Total connection attempts. */
  totalAttempts: number;
  /** Successful connections. */
  successful: number;
  /** Failed connections. */
  failed: number;
  /** Connection success rate (0-1). */
  successRate: number;
  /** Average connection time (ms). */
  avgConnectionTime: number;
}

export interface WalletMetrics {
  /** Number of unique wallets seen. */
  uniqueWallets: number;
  /** Wallet popularity: walletId -> connection count. */
  walletPopularity: Map<string, number>;
}

export interface ChainMetrics {
  /** Chain usage distribution: chainId -> switch count. */
  chainUsage: Map<number, number>;
  /** Most common destination chain. */
  mostSwitchedToChain?: number;
}

export class MetricsCalculator {
  /** Calculate all metrics from events */
  calculate(events: AnalyticsEvent[]): {
    connection: ConnectionMetrics;
    wallet: WalletMetrics;
    chain: ChainMetrics;
  } {
    return {
      connection: this.calculateConnectionMetrics(events),
      wallet: this.calculateWalletMetrics(events),
      chain: this.calculateChainMetrics(events),
    };
  }

  /** Calculate connection success rate and avg time */
  private calculateConnectionMetrics(events: AnalyticsEvent[]): ConnectionMetrics {
    const attempts = events.filter(
      (e) => e.type === 'wallet_connected' || e.type === 'wallet_disconnected',
    );
    const totalAttempts = attempts.length;
    const successful = events.filter((e) => e.type === 'wallet_connected').length;
    const failed = totalAttempts - successful;
    const successRate = totalAttempts > 0 ? successful / totalAttempts : 0;

    const durations = attempts
      .map((e) => propNumber(e, 'duration'))
      .filter((d): d is number => d != null);
    const avgConnectionTime = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return { totalAttempts, successful, failed, successRate, avgConnectionTime };
  }

  /** Calculate wallet popularity */
  private calculateWalletMetrics(events: AnalyticsEvent[]): WalletMetrics {
    const popularity = new Map<string, number>();
    for (const event of events) {
      if (event.type === 'wallet_connected') {
        const walletId = event.wallet;
        if (walletId == null) continue;
        popularity.set(walletId, (popularity.get(walletId) ?? 0) + 1);
      }
    }
    return { uniqueWallets: popularity.size, walletPopularity: popularity };
  }

  /** Calculate chain usage distribution */
  private calculateChainMetrics(events: AnalyticsEvent[]): ChainMetrics {
    const usage = new Map<number, number>();
    let maxCount = 0;
    let mostSwitchedTo: number | undefined;

    for (const event of events) {
      if (event.type === 'chain_switched') {
        const toChain = event.chainId;
        if (toChain == null) continue;
        const count = (usage.get(toChain) ?? 0) + 1;
        usage.set(toChain, count);
        if (count > maxCount) {
          maxCount = count;
          mostSwitchedTo = toChain;
        }
      }
    }

    return { chainUsage: usage, mostSwitchedToChain: mostSwitchedTo };
  }
}

/* ───────────────────────────────────────────────────────────────────
 * Standalone functional API (used by index.ts re-exports). These wrap
 * the MetricsCalculator so callers can compute a single metric without
 * instantiating the class.
 * ─────────────────────────────────────────────────────────────────── */

const _calc = new MetricsCalculator();

/** Connection success rate + average connection time. */
export function calculateConnectionMetrics(
  events: AnalyticsEvent[],
): ConnectionMetrics {
  return _calc.calculate(events).connection;
}

/** Wallet popularity (walletId -> connection count). */
export function calculateWalletPopularity(
  events: AnalyticsEvent[],
): Map<string, number> {
  return _calc.calculate(events).wallet.walletPopularity;
}

/** Chain usage distribution (chainId -> switch count). */
export function calculateChainUsage(
  events: AnalyticsEvent[],
): Map<number, number> {
  return _calc.calculate(events).chain.chainUsage;
}

/** Transaction success rate (0-1) over transaction events. */
export function calculateTransactionSuccessRate(
  events: AnalyticsEvent[],
): number {
  const txEvents = events.filter(
    (e) =>
      e.type === 'transaction_attempted' ||
      e.type === 'transaction_confirmed' ||
      e.type === 'transaction_failed',
  );
  if (txEvents.length === 0) return 0;
  const confirmed = txEvents.filter(
    (e) => e.type === 'transaction_confirmed',
  ).length;
  return confirmed / txEvents.length;
}

/** Count of unique sessions present in the events. */
export function countUniqueSessions(events: AnalyticsEvent[]): number {
  const sessions = new Set<string>();
  for (const e of events) {
    if (e.sessionId) sessions.add(e.sessionId);
  }
  return sessions.size;
}
