import type { Address } from 'viem';
import type { SenderReputation, ReputationConfig } from './server-types';

/**
 * ReputationTracker — tracks sender behavior and determines
 * throttle/ban status based on violation count.
 */
export class ReputationTracker {
  private config: ReputationConfig;
  /** sender → reputation data. */
  private records: Map<Address, SenderRecord> = new Map();

  constructor(config: ReputationConfig) {
    this.config = config;
  }

  /**
   * Record a successful UserOp for this sender.
   */
  recordSuccess(sender: Address): void {
    const record = this.getOrCreate(sender);
    record.successes += 1;
    // Improve score
    record.score = Math.min(100, record.score + 1);
    record.lastUpdated = Date.now();
  }

  /**
   * Record a violation for this sender.
   */
  recordViolation(sender: Address, _reason?: string): void {
    const record = this.getOrCreate(sender);
    record.violations += 1;
    // Degrade score
    record.score = Math.max(0, record.score - 10);
    record.lastUpdated = Date.now();
  }

  /**
   * Check if a sender is throttled.
   */
  isThrottled(sender: Address): boolean {
    const record = this.records.get(sender);
    if (!record) return false;

    if (record.violations >= this.config.throttleThreshold) {
      if (record.throttledUntil && Date.now() < record.throttledUntil) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a sender is banned.
   */
  isBanned(sender: Address): boolean {
    const record = this.records.get(sender);
    if (!record) return false;

    if (record.violations >= this.config.banThreshold) {
      if (this.config.banDurationSec === 0) {
        return true; // Permanent ban
      }
      if (record.bannedUntil && Date.now() < record.bannedUntil) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get reputation multiplier for priority scoring.
   * New senders get 1.0. Good senders get up to 1.2. Bad senders get 0.5.
   */
  priorityMultiplier(sender: Address): number {
    const record = this.records.get(sender);
    if (!record) return 1.0;

    if (this.isBanned(sender)) return 0;
    if (this.isThrottled(sender)) return 0.5;

    if (record.score >= 80) return 1.2;
    if (record.score >= 50) return 1.0;
    if (record.score >= 20) return 0.8;
    return 0.5;
  }

  /**
   * Get full reputation data for a sender.
   */
  getReputation(sender: Address): SenderReputation {
    const record = this.records.get(sender);
    if (!record) {
      return { score: 0, violations: 0, successes: 0, throttled: false, banned: false };
    }
    return {
      score: record.score,
      violations: record.violations,
      successes: record.successes,
      throttled: this.isThrottled(sender),
      banned: this.isBanned(sender),
    };
  }

  /**
   * Get all reputation stats.
   */
  getAllStats(): Map<Address, SenderReputation> {
    const result = new Map<Address, SenderReputation>();
    for (const [sender] of this.records) {
      result.set(sender, this.getReputation(sender));
    }
    return result;
  }

  /**
   * Reset a sender's reputation.
   */
  reset(sender: Address): void {
    this.records.delete(sender);
  }

  private getOrCreate(sender: Address): SenderRecord {
    let record = this.records.get(sender);
    if (!record) {
      record = {
        score: 0,
        violations: 0,
        successes: 0,
        throttledUntil: 0,
        bannedUntil: 0,
        lastUpdated: Date.now(),
      };
      this.records.set(sender, record);
    }
    return record;
  }

  /**
   * Called when a violation threshold is crossed.
   * Sets throttle/ban timers.
   */
  enforce(sender: Address): void {
    const record = this.records.get(sender);
    if (!record) return;

    if (record.violations >= this.config.banThreshold) {
      if (this.config.banDurationSec > 0) {
        record.bannedUntil = Date.now() + this.config.banDurationSec * 1000;
      } else {
        record.bannedUntil = Number.MAX_SAFE_INTEGER; // Permanent
      }
    } else if (record.violations >= this.config.throttleThreshold) {
      record.throttledUntil = Date.now() + this.config.throttleDurationSec * 1000;
    }
  }
}

interface SenderRecord {
  score: number;
  violations: number;
  successes: number;
  throttledUntil: number;
  bannedUntil: number;
  lastUpdated: number;
}
