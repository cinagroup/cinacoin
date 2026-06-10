/**
 * PaymentHistory — Payment transaction history tracking and management
 *
 * Provides persistent storage and querying of payment transactions.
 * Supports filtering, pagination, and export functionality.
 *
 * @example
 * ```ts
 * const history = new PaymentHistory({
 *   storageType: 'memory', // or 'localStorage', 'indexedDB'
 *   maxEntries: 1000,
 * });
 *
 * // Record a payment
 * history.record({
 *   id: 'pmt_123',
 *   type: 'buy',
 *   provider: 'moonpay',
 *   amount: 100,
 *   currency: 'USD',
 *   token: 'ETH',
 *   status: 'completed',
 *   timestamp: Date.now(),
 * });
 *
 * // Query history
 * const recent = history.query({
 *   type: 'buy',
 *   limit: 10,
 *   offset: 0,
 * });
 * ```
 */

import type { PaymentType } from './PaymentRouter';

// ============================================================
// Types
// ============================================================

export type PaymentHistoryStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PaymentHistoryEntry {
  /** Unique payment identifier */
  id: string;
  /** Payment type */
  type: PaymentType;
  /** Provider used (if applicable) */
  provider?: string;
  /** Input amount */
  inputAmount: number;
  /** Input token/currency */
  inputToken: string;
  /** Output amount */
  outputAmount: number;
  /** Output token */
  outputToken: string;
  /** Exchange rate */
  exchangeRate: number;
  /** Fees paid */
  fees: number;
  /** Payment status */
  status: PaymentHistoryStatus;
  /** Transaction hash (if on-chain) */
  txHash?: string;
  /** Order ID (if from provider) */
  orderId?: string;
  /** Timestamp when payment was initiated */
  timestamp: number;
  /** Timestamp when payment was completed */
  completedAt?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Error message (if failed) */
  error?: string;
}

export interface PaymentHistoryQuery {
  /** Filter by payment type */
  type?: PaymentType;
  /** Filter by status */
  status?: PaymentHistoryStatus;
  /** Filter by provider */
  provider?: string;
  /** Filter by token */
  token?: string;
  /** Filter by date range (start timestamp) */
  startDate?: number;
  /** Filter by date range (end timestamp) */
  endDate?: number;
  /** Minimum amount */
  minAmount?: number;
  /** Maximum amount */
  maxAmount?: number;
  /** Sort field */
  sortBy?: 'timestamp' | 'amount' | 'status';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Number of entries to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface PaymentHistoryStats {
  /** Total number of payments */
  totalPayments: number;
  /** Total volume in USD */
  totalVolume: number;
  /** Total fees paid */
  totalFees: number;
  /** Number of completed payments */
  completedPayments: number;
  /** Number of failed payments */
  failedPayments: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average payment amount */
  averageAmount: number;
  /** Payments by type */
  byType: Record<PaymentType, number>;
  /** Payments by provider */
  byProvider: Record<string, number>;
}

export type StorageType = 'memory' | 'localStorage' | 'indexedDB';

export interface PaymentHistoryConfig {
  /** Storage backend type */
  storageType?: StorageType;
  /** Maximum number of entries to store */
  maxEntries?: number;
  /** Storage key (for localStorage/indexedDB) */
  storageKey?: string;
  /** Whether to persist to storage immediately */
  autoPersist?: boolean;
}

// ============================================================
// PaymentHistory
// ============================================================

export class PaymentHistory {
  private config: Required<PaymentHistoryConfig>;
  private entries: Map<string, PaymentHistoryEntry> = new Map();

  constructor(config: PaymentHistoryConfig = {}) {
    this.config = {
      storageType: config.storageType ?? 'memory',
      maxEntries: config.maxEntries ?? 1000,
      storageKey: config.storageKey ?? 'cinacoin_payment_history',
      autoPersist: config.autoPersist ?? true,
    };

    // Load from storage if not memory-only
    if (this.config.storageType !== 'memory') {
      this.loadFromStorage();
    }
  }

  /**
   * Record a new payment entry.
   */
  record(entry: PaymentHistoryEntry): void {
    // Check if entry already exists
    if (this.entries.has(entry.id)) {
      throw new Error(`Payment entry ${entry.id} already exists`);
    }

    // Add entry
    this.entries.set(entry.id, entry);

    // Enforce max entries limit
    if (this.entries.size > this.config.maxEntries) {
      this.removeOldest();
    }

    // Persist if auto-persist is enabled
    if (this.config.autoPersist) {
      this.persist();
    }
  }

  /**
   * Update an existing payment entry.
   */
  update(id: string, updates: Partial<PaymentHistoryEntry>): void {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Payment entry ${id} not found`);
    }

    const updated = { ...entry, ...updates };
    this.entries.set(id, updated);

    if (this.config.autoPersist) {
      this.persist();
    }
  }

  /**
   * Get a payment entry by ID.
   */
  get(id: string): PaymentHistoryEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Query payment history with filters.
   */
  query(query: PaymentHistoryQuery = {}): PaymentHistoryEntry[] {
    let results = Array.from(this.entries.values());

    // Apply filters
    if (query.type) {
      results = results.filter((e) => e.type === query.type);
    }

    if (query.status) {
      results = results.filter((e) => e.status === query.status);
    }

    if (query.provider) {
      results = results.filter((e) => e.provider === query.provider);
    }

    if (query.token) {
      results = results.filter(
        (e) => e.inputToken === query.token || e.outputToken === query.token
      );
    }

    if (query.startDate) {
      results = results.filter((e) => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter((e) => e.timestamp <= query.endDate!);
    }

    if (query.minAmount !== undefined) {
      results = results.filter((e) => e.inputAmount >= query.minAmount!);
    }

    if (query.maxAmount !== undefined) {
      results = results.filter((e) => e.inputAmount <= query.maxAmount!);
    }

    // Sort
    const sortBy = query.sortBy ?? 'timestamp';
    const sortOrder = query.sortOrder ?? 'desc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'amount':
          comparison = a.inputAmount - b.inputAmount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? results.length;

    return results.slice(offset, offset + limit);
  }

  /**
   * Get all payment entries.
   */
  getAll(): PaymentHistoryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get payment history statistics.
   */
  getStats(): PaymentHistoryStats {
    const entries = Array.from(this.entries.values());

    const completed = entries.filter((e) => e.status === 'completed');
    const failed = entries.filter((e) => e.status === 'failed');

    const totalVolume = completed.reduce((sum, e) => sum + e.inputAmount, 0);
    const totalFees = completed.reduce((sum, e) => sum + e.fees, 0);

    const byType: Record<PaymentType, number> = {
      buy: 0,
      swap: 0,
      deposit: 0,
    };

    const byProvider: Record<string, number> = {};

    for (const entry of entries) {
      byType[entry.type]++;

      if (entry.provider) {
        byProvider[entry.provider] = (byProvider[entry.provider] ?? 0) + 1;
      }
    }

    return {
      totalPayments: entries.length,
      totalVolume,
      totalFees,
      completedPayments: completed.length,
      failedPayments: failed.length,
      successRate: entries.length > 0 ? completed.length / entries.length : 0,
      averageAmount: entries.length > 0 ? totalVolume / entries.length : 0,
      byType,
      byProvider,
    };
  }

  /**
   * Delete a payment entry.
   */
  delete(id: string): void {
    if (!this.entries.has(id)) {
      throw new Error(`Payment entry ${id} not found`);
    }

    this.entries.delete(id);

    if (this.config.autoPersist) {
      this.persist();
    }
  }

  /**
   * Clear all payment history.
   */
  clear(): void {
    this.entries.clear();

    if (this.config.autoPersist) {
      this.persist();
    }
  }

  /**
   * Export payment history as JSON.
   */
  export(): string {
    return JSON.stringify(Array.from(this.entries.values()), null, 2);
  }

  /**
   * Import payment history from JSON.
   */
  import(json: string): void {
    try {
      const entries: PaymentHistoryEntry[] = JSON.parse(json);

      for (const entry of entries) {
        if (!this.entries.has(entry.id)) {
          this.entries.set(entry.id, entry);
        }
      }

      if (this.config.autoPersist) {
        this.persist();
      }
    } catch (error) {
      throw new Error('Failed to import payment history: invalid JSON');
    }
  }

  /**
   * Get the number of entries in history.
   */
  size(): number {
    return this.entries.size;
  }

  // ============================================================
  // Storage Management
  // ============================================================

  private persist(): void {
    if (this.config.storageType === 'memory') {
      return;
    }

    try {
      const data = this.export();

      if (this.config.storageType === 'localStorage' && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.config.storageKey, data);
      } else if (this.config.storageType === 'indexedDB') {
        // IndexedDB implementation would go here
        // For now, just log a warning
        console.warn('[PaymentHistory] IndexedDB persistence not yet implemented');
      }
    } catch (error) {
      console.error('[PaymentHistory] Failed to persist:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      let data: string | null = null;

      if (this.config.storageType === 'localStorage' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(this.config.storageKey);
      } else if (this.config.storageType === 'indexedDB') {
        // IndexedDB implementation would go here
        console.warn('[PaymentHistory] IndexedDB loading not yet implemented');
        return;
      }

      if (data) {
        this.import(data);
      }
    } catch (error) {
      console.error('[PaymentHistory] Failed to load from storage:', error);
    }
  }

  private removeOldest(): void {
    const entries = Array.from(this.entries.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove the oldest entry
    if (entries.length > 0) {
      const [oldestId] = entries[0];
      this.entries.delete(oldestId);
    }
  }
}
