import type { Address, Hash, Hex } from 'viem';
import type { PendingUserOp, RawUserOperation, BundlerServerConfig } from './server-types';
import { UserOpPoolStatus } from './server-types';
import { computeUserOpHash } from './utils';

/**
 * UserOpPool — in-memory mempool with reputation-aware priority queue.
 *
 * UserOps are ordered by a composite score:
 *   priority = gasPrice(gwei) × reputationMultiplier × 1000
 *
 * Higher score = higher priority for inclusion in bundles.
 */
export class UserOpPool {
  /** Pending UserOps indexed by hash. */
  private entries: Map<Hash, PendingUserOp> = new Map();
  /** Hashes sorted by priority (descending) — maintained on insert. */
  private orderedHashes: Hash[] = [];
  /** Sender → count of pending ops. */
  private senderCounts: Map<Address, number> = new Map();
  /** Seen hashes for dedup (including recently processed). */
  private seenHashes: Set<Hash> = new Set();
  /** Config reference. */
  private config: BundlerServerConfig;

  constructor(config: BundlerServerConfig) {
    this.config = config;
  }

  /**
   * Add a UserOp to the pool.
   * Returns the hash or throws on duplicate/rate-limit.
   */
  async add(userOp: RawUserOperation, reputationMultiplier: number = 1.0): Promise<Hash> {
    const hash = computeUserOpHash(userOp);

    // Duplicate detection
    if (this.entries.has(hash) || this.seenHashes.has(hash)) {
      throw new PoolError('duplicate UserOp', 'ALREADY_KNOWN', hash);
    }

    // Rate limit per sender
    const sender = userOp.sender;
    const senderCount = this.senderCounts.get(sender) ?? 0;
    if (senderCount >= this.config.reputation.maxPendingPerSender) {
      throw new PoolError(
        `sender ${sender} has too many pending ops (${senderCount})`,
        'RATE_LIMITED',
        hash,
      );
    }

    // Priority score
    const prioFee = BigInt(userOp.maxPriorityFeePerGas) / 1_000_000_000n;
    const priority = Number(prioFee) * reputationMultiplier * 1000;

    const entry: PendingUserOp = {
      hash,
      userOp,
      receivedAt: Date.now(),
      status: UserOpPoolStatus.Pending,
      priority,
      retries: 0,
    };

    this.entries.set(hash, entry);
    this.insertOrdered(hash, priority);
    this.senderCounts.set(sender, senderCount + 1);
    this.seenHashes.add(hash);

    return hash;
  }

  /**
   * Get top `n` pending UserOps ordered by priority (highest first).
   */
  getTop(n: number): PendingUserOp[] {
    const result: PendingUserOp[] = [];
    for (const hash of this.orderedHashes) {
      if (result.length >= n) break;
      const entry = this.entries.get(hash);
      if (entry && entry.status === UserOpPoolStatus.Pending) {
        result.push(entry);
      }
    }
    return result;
  }

  /**
   * Mark UserOps as submitted with a bundle tx hash.
   */
  markSubmitted(hashes: Hash[], txHash: Hash): void {
    for (const hash of hashes) {
      const entry = this.entries.get(hash);
      if (entry) {
        entry.status = UserOpPoolStatus.Submitted;
        entry.bundleTxHash = txHash;
        // Decrement sender count
        const senderCount = this.senderCounts.get(entry.userOp.sender) ?? 1;
        this.senderCounts.set(entry.userOp.sender, Math.max(0, senderCount - 1));
      }
      this.entries.delete(hash);
      // Remove from ordered list
      this.removeOrdered(hash);
    }
  }

  /**
   * Mark UserOps as included on-chain.
   */
  markIncluded(hashes: Hash[]): void {
    for (const hash of hashes) {
      const entry = this.entries.get(hash);
      if (entry) {
        entry.status = UserOpPoolStatus.Included;
      }
    }
  }

  /**
   * Reject a UserOp and record the reason.
   */
  reject(hash: Hash, reason: string): void {
    const entry = this.entries.get(hash);
    if (entry) {
      entry.status = UserOpPoolStatus.Rejected;
      entry.rejectReason = reason;
      const senderCount = this.senderCounts.get(entry.userOp.sender) ?? 1;
      this.senderCounts.set(entry.userOp.sender, Math.max(0, senderCount - 1));
    }
    this.entries.delete(hash);
    this.removeOrdered(hash);
  }

  /**
   * Requeue a UserOp that failed to submit (for retry).
   */
  requeue(hash: Hash): PendingUserOp | undefined {
    const entry = this.entries.get(hash);
    if (entry) {
      entry.status = UserOpPoolStatus.Pending;
      entry.bundleTxHash = undefined;
      entry.retries += 1;
      return entry;
    }
    return undefined;
  }

  /**
   * Get a UserOp by hash (includes all statuses).
   */
  get(hash: Hash): PendingUserOp | undefined {
    return this.entries.get(hash);
  }

  /**
   * Get count of pending UserOps.
   */
  pendingCount(): number {
    return this.orderedHashes.filter(h => {
      const e = this.entries.get(h);
      return e?.status === UserOpPoolStatus.Pending;
    }).length;
  }

  /**
   * Total entries (all statuses).
   */
  totalCount(): number {
    return this.entries.size;
  }

  /**
   * Get pending count for a specific sender.
   */
  senderPendingCount(sender: Address): number {
    return this.senderCounts.get(sender) ?? 0;
  }

  /**
   * Expire old pending UserOps that have been in the pool too long.
   */
  expireOldOps(maxAgeMs: number): number {
    const now = Date.now();
    let expired = 0;
    const toExpire: Hash[] = [];

    for (const [hash, entry] of this.entries) {
      if (entry.status === UserOpPoolStatus.Pending && now - entry.receivedAt > maxAgeMs) {
        toExpire.push(hash);
      }
    }

    for (const hash of toExpire) {
      const entry = this.entries.get(hash);
      if (entry) {
        entry.status = UserOpPoolStatus.Expired;
        const senderCount = this.senderCounts.get(entry.userOp.sender) ?? 1;
        this.senderCounts.set(entry.userOp.sender, Math.max(0, senderCount - 1));
      }
      this.entries.delete(hash);
      this.removeOrdered(hash);
      expired++;
    }

    return expired;
  }

  /**
   * Purge all entries for a specific sender.
   */
  purgeSender(sender: Address): number {
    let count = 0;
    const toRemove: Hash[] = [];

    for (const [hash, entry] of this.entries) {
      if (entry.userOp.sender === sender) {
        toRemove.push(hash);
      }
    }

    for (const hash of toRemove) {
      this.entries.delete(hash);
      this.removeOrdered(hash);
      count++;
    }

    this.senderCounts.delete(sender);
    return count;
  }

  /**
   * Cleanup seen hashes that are no longer relevant.
   */
  cleanupSeen(maxAgeMs: number = 60_000): void {
    // For large pools, periodically clean old seen hashes
    // In practice this would be a more sophisticated LRU cache
    if (this.seenHashes.size > 10_000) {
      // Reset if too many (conservative approach)
      this.seenHashes.clear();
    }
  }

  // ── Internal: maintain sorted list ──────────────────────────────

  /**
   * Insert a hash into the ordered list maintaining descending priority order.
   * Uses binary search for O(log n) insertion.
   */
  private insertOrdered(hash: Hash, priority: number): void {
    let lo = 0;
    let hi = this.orderedHashes.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      const entry = this.entries.get(this.orderedHashes[mid]);
      if (entry && entry.priority > priority) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    this.orderedHashes.splice(lo, 0, hash);
  }

  private removeOrdered(hash: Hash): void {
    const idx = this.orderedHashes.indexOf(hash);
    if (idx !== -1) {
      this.orderedHashes.splice(idx, 1);
    }
  }
}

/** Custom error for pool operations. */
export class PoolError extends Error {
  public code: string;
  public hash?: Hash;

  constructor(message: string, code: string, hash?: Hash) {
    super(message);
    this.name = 'PoolError';
    this.code = code;
    this.hash = hash;
  }
}
