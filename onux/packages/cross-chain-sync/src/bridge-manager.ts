/**
 * BridgeStateManager — IndexedDB persistence + state machine for bridge transfers.
 *
 * Manages the full lifecycle of a cross-chain bridge transfer:
 *   initiated → confirming → locking → minting → completed
 *   initiated → failed → refunded
 *   confirming → expired → refunded
 */

import type {
  BridgeLifecycleState,
  BridgeTransferRecord,
  BridgeStateTransition,
  BridgeRoute,
  BridgeFeeEstimate,
  BridgeTimeEstimate,
} from "./types";

// ============================================================
// Supported Bridge Routes
// ============================================================

/** Canonical bridge routes supported by the engine. */
export const SUPPORTED_BRIDGE_ROUTES: BridgeRoute[] = [
  {
    id: "eth-arb",
    fromChain: "eth",
    fromChainId: 1,
    toChain: "arbitrum",
    toChainId: 42161,
    estimatedTimeSeconds: 600,
    feePercent: 0.05,
    minAmount: 10_000_000_000_000n, // 0.00001 ETH
    maxAmount: 10_000_000_000_000_000_000n, // 10 ETH
    active: true,
    protocol: "canonical",
  },
  {
    id: "eth-op",
    fromChain: "eth",
    fromChainId: 1,
    toChain: "optimism",
    toChainId: 10,
    estimatedTimeSeconds: 600,
    feePercent: 0.05,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "canonical",
  },
  {
    id: "eth-poly",
    fromChain: "eth",
    fromChainId: 1,
    toChain: "polygon",
    toChainId: 137,
    estimatedTimeSeconds: 1800,
    feePercent: 0.1,
    minAmount: 10_000_000_000_000n,
    maxAmount: 50_000_000_000_000_000_000n,
    active: true,
    protocol: "third-party",
  },
  {
    id: "eth-base",
    fromChain: "eth",
    fromChainId: 1,
    toChain: "base",
    toChainId: 8453,
    estimatedTimeSeconds: 600,
    feePercent: 0.05,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "canonical",
  },
  // Reverse routes (L2 → ETH)
  {
    id: "arb-eth",
    fromChain: "arbitrum",
    fromChainId: 42161,
    toChain: "eth",
    toChainId: 1,
    estimatedTimeSeconds: 3600,
    feePercent: 0.05,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "canonical",
  },
  {
    id: "op-eth",
    fromChain: "optimism",
    fromChainId: 10,
    toChain: "eth",
    toChainId: 1,
    estimatedTimeSeconds: 3600,
    feePercent: 0.05,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "canonical",
  },
  {
    id: "poly-eth",
    fromChain: "polygon",
    fromChainId: 137,
    toChain: "eth",
    toChainId: 1,
    estimatedTimeSeconds: 3600,
    feePercent: 0.1,
    minAmount: 10_000_000_000_000n,
    maxAmount: 50_000_000_000_000_000_000n,
    active: true,
    protocol: "third-party",
  },
  {
    id: "base-eth",
    fromChain: "base",
    fromChainId: 8453,
    toChain: "eth",
    toChainId: 1,
    estimatedTimeSeconds: 3600,
    feePercent: 0.05,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "canonical",
  },
  // L2 ↔ L2 routes (via ETH)
  {
    id: "arb-op",
    fromChain: "arbitrum",
    fromChainId: 42161,
    toChain: "optimism",
    toChainId: 10,
    estimatedTimeSeconds: 7200,
    feePercent: 0.1,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "third-party",
  },
  {
    id: "arb-base",
    fromChain: "arbitrum",
    fromChainId: 42161,
    toChain: "base",
    toChainId: 8453,
    estimatedTimeSeconds: 7200,
    feePercent: 0.1,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "third-party",
  },
  {
    id: "op-base",
    fromChain: "optimism",
    fromChainId: 10,
    toChain: "base",
    toChainId: 8453,
    estimatedTimeSeconds: 7200,
    feePercent: 0.1,
    minAmount: 10_000_000_000_000n,
    maxAmount: 10_000_000_000_000_000_000n,
    active: true,
    protocol: "third-party",
  },
];

/** Look up a route by from/to chain names. */
export function findRoute(
  fromChain: string,
  toChain: string,
): BridgeRoute | undefined {
  return SUPPORTED_BRIDGE_ROUTES.find(
    (r) =>
      r.fromChain.toLowerCase() === fromChain.toLowerCase() &&
      r.toChain.toLowerCase() === toChain.toLowerCase(),
  );
}

/** Check if a route exists. */
export function isSupportedRoute(
  fromChain: string,
  toChain: string,
): boolean {
  return findRoute(fromChain, toChain) !== undefined;
}

// ============================================================
// Token Mapping (ETH ↔ L2 canonical tokens)
// ============================================================

export interface TokenMapping {
  /** Token address on source chain */
  source: string;
  /** Token address on destination chain */
  dest: string;
  /** Token symbol */
  symbol: string;
  /** Decimals */
  decimals: number;
}

/** Native ETH mapping (same on all EVM chains). */
const NATIVE_ETH: TokenMapping = {
  source: "native",
  dest: "native",
  symbol: "ETH",
  decimals: 18,
};

/** Known ERC-20 token mappings for supported routes. */
export const ERC20_MAPPINGS: Record<string, TokenMapping[]> = {
  "eth-arb": [
    NATIVE_ETH,
    {
      source: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      dest: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      symbol: "USDC",
      decimals: 6,
    },
    {
      source: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      dest: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      symbol: "USDT",
      decimals: 6,
    },
  ],
  "eth-op": [
    NATIVE_ETH,
    {
      source: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      dest: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      symbol: "USDC",
      decimals: 6,
    },
  ],
  "eth-poly": [
    NATIVE_ETH,
    {
      source: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      dest: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      symbol: "USDC",
      decimals: 6,
    },
  ],
  "eth-base": [
    NATIVE_ETH,
    {
      source: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      dest: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      symbol: "USDC",
      decimals: 6,
    },
  ],
  "arb-eth": [
    NATIVE_ETH,
    {
      source: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      dest: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      decimals: 6,
    },
  ],
  "op-eth": [
    NATIVE_ETH,
    {
      source: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      dest: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      decimals: 6,
    },
  ],
  "poly-eth": [
    NATIVE_ETH,
    {
      source: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      dest: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      decimals: 6,
    },
  ],
  "base-eth": [
    NATIVE_ETH,
    {
      source: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      dest: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      decimals: 6,
    },
  ],
};

/** Resolve a token mapping for a given route and token. */
export function resolveTokenMapping(
  fromChain: string,
  toChain: string,
  token: string,
): TokenMapping | undefined {
  const routeId = `${fromChain.toLowerCase()}-${toChain.toLowerCase()}`;
  const mappings = ERC20_MAPPINGS[routeId];
  if (!mappings) return undefined;

  const tokenLower = token.toLowerCase();
  return mappings.find(
    (m) =>
      m.source.toLowerCase() === tokenLower ||
      m.source === token ||
      (tokenLower === "native" && m.source === "native") ||
      (tokenLower === "eth" && m.symbol === "ETH"),
  );
}

// ============================================================
// IndexedDB Persistence
// ============================================================

const DB_NAME = "cross-chain-bridge";
const DB_VERSION = 1;
const STORE_NAME = "bridge-transfers";

/**
 * Open (or create) the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "bridgeId" });
        store.createIndex("state", "state", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("fromChain", "fromChain", { unique: false });
        store.createIndex("toChain", "toChain", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * BridgeStateManager — handles persistence and state machine transitions.
 */
export class BridgeStateManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /** Valid state transitions per the required state machine:
   *   initiated → confirming → locking → minting → completed
   *   initiated → failed → refunded
   *   confirming → expired → refunded
   */
  private static readonly TRANSITIONS: Record<
    BridgeLifecycleState,
    BridgeLifecycleState[]
  > = {
    initiated: ["confirming", "failed"],
    confirming: ["locking", "expired", "failed"],
    locking: ["minting", "failed"],
    minting: ["completed", "failed"],
    completed: [],
    failed: ["refunded"],
    expired: ["refunded"],
    refunded: [],
  };

  private dbReady(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    if (!this.dbPromise) {
      this.dbPromise = openDB().then((db) => {
        this.db = db;
        return db;
      });
    }
    return this.dbPromise;
  }

  /** Check if a state transition is valid. */
  static isValidTransition(
    from: BridgeLifecycleState,
    to: BridgeLifecycleState,
  ): boolean {
    return this.TRANSITIONS[from]?.includes(to) ?? false;
  }

  /** Create a state transition record. */
  static createTransition(
    from: BridgeLifecycleState,
    to: BridgeLifecycleState,
    metadata?: Record<string, string | number | boolean>,
  ): BridgeStateTransition {
    return { from, to, timestamp: Date.now(), metadata };
  }

  // ---- IndexedDB CRUD ----

  /** Save a bridge transfer record to IndexedDB. */
  async saveTransfer(record: BridgeTransferRecord): Promise<void> {
    const db = await this.dbReady();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** Load a bridge transfer record by ID. */
  async loadTransfer(transferId: string): Promise<BridgeTransferRecord | null> {
    const db = await this.dbReady();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(transferId);
      request.onsuccess = () =>
        resolve(request.result as BridgeTransferRecord | null);
      request.onerror = () => reject(request.error);
    });
  }

  /** Load all bridge transfer records. */
  async loadAllTransfers(): Promise<BridgeTransferRecord[]> {
    const db = await this.dbReady();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result as BridgeTransferRecord[]) ?? [];
        resolve(results.filter((r) => !r.deleted));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Load transfers filtered by state. */
  async loadTransfersByState(
    state: BridgeLifecycleState,
  ): Promise<BridgeTransferRecord[]> {
    const all = await this.loadAllTransfers();
    return all.filter((r) => r.state === state);
  }

  /** Update only the state of a transfer. */
  async updateState(
    transferId: string,
    newState: BridgeLifecycleState,
    metadata?: Record<string, string | number | boolean>,
  ): Promise<BridgeTransferRecord> {
    const record = await this.loadTransfer(transferId);
    if (!record) {
      throw new Error(`Transfer ${transferId} not found`);
    }

    const transition = BridgeStateManager.createTransition(
      record.state,
      newState,
      metadata,
    );

    record.state = newState;
    record.history = [...record.history, transition];
    record.updatedAt = Date.now();

    await this.saveTransfer(record);
    return record;
  }

  /** Delete a transfer record (soft delete). */
  async deleteTransfer(transferId: string): Promise<void> {
    const record = await this.loadTransfer(transferId);
    if (!record) return;

    record.deleted = true;
    record.updatedAt = Date.now();
    await this.saveTransfer(record);
  }
}

// ============================================================
// Default Route Timings (for time estimation)
// ============================================================

interface ChainTiming {
  /** Average block confirmation time (seconds) */
  blockTime: number;
  /** Blocks needed for confirmation */
  confirmationBlocks: number;
}

/** Chain-specific timing data. */
export const CHAIN_TIMINGS: Record<string, ChainTiming> = {
  eth: { blockTime: 12, confirmationBlocks: 12 },
  arbitrum: { blockTime: 2, confirmationBlocks: 1 },
  optimism: { blockTime: 2, confirmationBlocks: 1 },
  polygon: { blockTime: 2, confirmationBlocks: 128 },
  base: { blockTime: 2, confirmationBlocks: 1 },
};

/** Chain-specific relay overhead (seconds). */
export const RELAY_OVERHEAD: Record<string, number> = {
  "eth-arb": 30,
  "eth-op": 30,
  "eth-poly": 120,
  "eth-base": 30,
  "arb-eth": 1800, // withdrawal delay
  "op-eth": 1800,
  "poly-eth": 600,
  "base-eth": 1800,
};
