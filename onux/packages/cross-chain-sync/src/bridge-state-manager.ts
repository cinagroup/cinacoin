/**
 * Bridge State Manager — State machine + IndexedDB persistence
 *
 * Manages the lifecycle state of bridge transfers with:
 *   - State machine transitions (initiated → confirming → locking → minting → completed)
 *   - Failure rollback (→ failed → refunded)
 *   - Timeout handling (confirming → expired → refunded)
 *   - IndexedDB persistence in browser, in-memory fallback in Node
 */

import type {
  BridgeLifecycleState,
  BridgeStateTransition,
  BridgeTransferRecord,
} from "./types";

// ============================================================
// Valid State Transitions
// ============================================================

const VALID_TRANSITIONS: Record<BridgeLifecycleState, BridgeLifecycleState[]> = {
  initiated: ["confirming", "failed"],
  confirming: ["locking", "expired", "failed"],
  locking: ["minting", "failed"],
  minting: ["completed", "failed"],
  completed: [], // Terminal state
  failed: ["refunded"], // Can only refund from failed
  expired: ["refunded"], // Can only refund from expired
  refunded: [], // Terminal state
};

// ============================================================
// IndexedDB Storage Adapter
// ============================================================

/** Browser IndexedDB storage for bridge transfers */
class IndexedDBBridgeStorage {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null;

  constructor(dbName: string = "cinacoin-bridge", storeName: string = "transfers") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "transferId",
          });
          store.createIndex("state", "state", { unique: false });
          store.createIndex("sender", "sender", { unique: false });
          store.createIndex("recipient", "recipient", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(new Error(`IndexedDB open failed: ${request.error?.message}`));
      };
    });
  }

  async get(transferId: string): Promise<BridgeTransferRecord | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.get(transferId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? deserializeRecord(result) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<BridgeTransferRecord[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result || []).map(deserializeRecord));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(indexName: string, value: string): Promise<BridgeTransferRecord[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve((request.result || []).map(deserializeRecord));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async put(record: BridgeTransferRecord): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.put(serializeRecord(record));

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(transferId: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.delete(transferId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================================
// In-Memory Storage (Node.js / testing fallback)
// ============================================================

class InMemoryBridgeStorage {
  private store: Map<string, BridgeTransferRecord> = new Map();

  async get(transferId: string): Promise<BridgeTransferRecord | null> {
    return this.store.get(transferId) ?? null;
  }

  async getAll(): Promise<BridgeTransferRecord[]> {
    return Array.from(this.store.values());
  }

  async getByIndex(
    indexName: string,
    value: string,
  ): Promise<BridgeTransferRecord[]> {
    return Array.from(this.store.values()).filter((r) => {
      switch (indexName) {
        case "state":
          return r.state === value;
        case "sender":
          return r.sender === value;
        case "recipient":
          return r.recipient === value;
        default:
          return false;
      }
    });
  }

  async put(record: BridgeTransferRecord): Promise<void> {
    this.store.set(record.transferId, record);
  }

  async delete(transferId: string): Promise<void> {
    this.store.delete(transferId);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// ============================================================
// Serialization Helpers (bigint ↔ string for storage)
// ============================================================

interface SerializedBridgeRecord {
  transferId: string;
  state: BridgeLifecycleState;
  fromChain: string;
  fromChainId: number;
  toChain: string;
  toChainId: number;
  sourceToken: string;
  destToken: string;
  amount: string; // bigint serialized
  tokenSymbol: string;
  decimals: number;
  sender: string;
  recipient: string;
  sourceTxHash?: string;
  destTxHash?: string;
  relayMessageId?: string;
  history: BridgeStateTransition[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

function serializeRecord(record: BridgeTransferRecord): SerializedBridgeRecord {
  return {
    ...record,
    amount: record.amount.toString(),
  };
}

function deserializeRecord(raw: SerializedBridgeRecord): BridgeTransferRecord {
  return {
    ...raw,
    amount: BigInt(raw.amount),
  };
}

// ============================================================
// Bridge State Manager
// ============================================================

/**
 * Manages bridge transfer lifecycle state with persistence.
 *
 * Features:
 *   - State machine with validated transitions
 *   - IndexedDB persistence (browser) or in-memory (Node)
 *   - Query by state, sender, or recipient
 *   - Transition history tracking
 */
export class BridgeStateManager {
  private storage: IndexedDBBridgeStorage | InMemoryBridgeStorage;

  constructor() {
    // Detect environment: use IndexedDB in browser, in-memory in Node
    if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
      this.storage = new IndexedDBBridgeStorage();
    } else {
      this.storage = new InMemoryBridgeStorage();
    }
  }

  /**
   * Create with explicit storage (useful for testing)
   */
  static withStorage(
    storage: IndexedDBBridgeStorage | InMemoryBridgeStorage,
  ): BridgeStateManager {
    const manager = new BridgeStateManager();
    manager.storage = storage;
    return manager;
  }

  // ----------------------------------------------------------
  // State Transitions
  // ----------------------------------------------------------

  /**
   * Transition a transfer to a new state.
   *
   * Validates the transition, updates the record, and persists.
   */
  async transition(
    transferId: string,
    newState: BridgeLifecycleState,
    metadata?: Record<string, string | number | boolean>,
  ): Promise<BridgeTransferRecord> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error(`Transfer not found: ${transferId}`);
    }

    const validTargets = VALID_TRANSITIONS[transfer.state];
    if (!validTargets.includes(newState)) {
      throw new Error(
        `Invalid state transition: ${transfer.state} → ${newState}. Valid: [${validTargets.join(", ")}]`,
      );
    }

    const now = Date.now();
    const transition: BridgeStateTransition = {
      from: transfer.state,
      to: newState,
      timestamp: now,
      metadata,
    };

    const updated: BridgeTransferRecord = {
      ...transfer,
      state: newState,
      history: [...transfer.history, transition],
      updatedAt: now,
    };

    // If error metadata, store it
    if (metadata?.error && typeof metadata.error === "string") {
      updated.error = metadata.error;
    }

    await this.saveTransfer(updated);
    return updated;
  }

  // ----------------------------------------------------------
  // CRUD Operations
  // ----------------------------------------------------------

  /**
   * Save a bridge transfer to storage.
   */
  async saveTransfer(record: BridgeTransferRecord): Promise<void> {
    await this.storage.put(record);
  }

  /**
   * Get a single transfer by ID.
   */
  async getTransfer(
    transferId: string,
  ): Promise<BridgeTransferRecord | null> {
    return this.storage.get(transferId);
  }

  /**
   * Get all bridge transfers.
   */
  async getAllTransfers(): Promise<BridgeTransferRecord[]> {
    return this.storage.getAll();
  }

  /**
   * Get transfers filtered by state.
   */
  async getTransfersByState(
    state: BridgeLifecycleState,
  ): Promise<BridgeTransferRecord[]> {
    return this.storage.getByIndex("state", state);
  }

  /**
   * Get transfers for a specific address (sender or recipient).
   */
  async getTransfersByAddress(
    address: string,
  ): Promise<BridgeTransferRecord[]> {
    const bySender = await this.storage.getByIndex("sender", address);
    const byRecipient = await this.storage.getByIndex("recipient", address);

    // Deduplicate
    const seen = new Set<string>();
    const combined: BridgeTransferRecord[] = [];
    for (const t of [...bySender, ...byRecipient]) {
      if (!seen.has(t.transferId)) {
        seen.add(t.transferId);
        combined.push(t);
      }
    }

    // Sort by creation time (newest first)
    return combined.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Delete a transfer (use with caution).
   */
  async deleteTransfer(transferId: string): Promise<void> {
    await this.storage.delete(transferId);
  }

  /**
   * Clear all transfers (testing only).
   */
  async clearAll(): Promise<void> {
    await this.storage.clear();
  }

  // ----------------------------------------------------------
  // Bridge History
  // ----------------------------------------------------------

  /**
   * Get the complete transition history for a transfer.
   */
  async getHistory(
    transferId: string,
  ): Promise<BridgeStateTransition[]> {
    const transfer = await this.getTransfer(transferId);
    return transfer?.history ?? [];
  }

  /**
   * Get bridge history for an address (all transfers with history).
   */
  async getHistoryByAddress(
    address: string,
  ): Promise<{ transfer: BridgeTransferRecord; history: BridgeStateTransition[] }[]> {
    const transfers = await this.getTransfersByAddress(address);
    return transfers.map((t) => ({
      transfer: t,
      history: t.history,
    }));
  }

  // ----------------------------------------------------------
  // Timeout Detection
  // ----------------------------------------------------------

  /**
   * Get transfers that may have timed out (in "confirming" state
   * for longer than expected).
   */
  async getPotentiallyTimedOut(
    maxConfirmingMs: number = 900_000, // 15 minutes default
  ): Promise<BridgeTransferRecord[]> {
    const confirming = await this.getTransfersByState("confirming");
    const now = Date.now();

    return confirming.filter((t) => now - t.updatedAt > maxConfirmingMs);
  }

  /**
   * Get all non-terminal transfers (not completed, refunded).
   */
  async getActiveTransfers(): Promise<BridgeTransferRecord[]> {
    const all = await this.getAllTransfers();
    return all.filter(
      (t) => t.state !== "completed" && t.state !== "refunded",
    );
  }
}
