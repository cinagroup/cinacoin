/**
 * Bridge Protocol — Cross-chain Asset transfer state machine & engine
 *
 * Defines the bridge lifecycle states and manages asset transfers
 * between chains via the relay-server.
 *
 * Bridge State Machine:
 *   initiated → confirming → locking → minting → completed
 *                                            ↓
 *                                      failed (refund)
 *   confirming → expired → refunded (timeout)
 *
 * Each transition is recorded with a timestamp and optional metadata.
 */

import type { ChainFamily, StateStorage, ChainRoute, BridgePair } from "./types";
import type { RelayClient } from "./messaging";

// ============================================================
// Bridge States
// ============================================================

/** All possible states in the bridge lifecycle. */
export type BridgeState =
  | "initiated"     // Bridge request created
  | "confirming"    // Waiting for source-chain confirmation
  | "locking"       // Assets being locked on source chain
  | "minting"       // Assets being minted on destination chain
  | "completed"     // Successfully bridged
  | "failed"        // Bridge failed (recoverable or terminal)
  | "expired"       // Bridge timed out
  | "refunding";    // Refund in progress (after failure)

/** Valid state transitions. */
const VALID_TRANSITIONS: Record<BridgeState, BridgeState[]> = {
  initiated: ["confirming", "failed"],
  confirming: ["locking", "expired", "failed"],
  locking: ["minting", "failed", "refunding"],
  minting: ["completed", "failed", "refunding"],
  completed: [], // Terminal state
  failed: ["refunding"], // Can attempt refund
  expired: ["refunding"], // Timeout triggers refund
  refunding: ["completed", "failed"], // Refund either succeeds or fails
};

// ============================================================
// Bridge Asset Types
// ============================================================

/** Bridge asset representation. */
export interface BridgeAsset {
  /** Token symbol (e.g., "USDC", "ETH") */
  symbol: string;
  /** Source chain token address */
  sourceToken: string;
  /** Destination chain token address */
  destToken: string;
  /** Amount being bridged (in smallest unit) */
  amount: bigint;
  /** Decimals for human-readable display */
  decimals: number;
  /** Whether this is native ETH or ERC-20 */
  isNative: boolean;
}

/** Bridge transfer record. */
export interface BridgeTransfer {
  /** Unique bridge transfer ID */
  bridgeId: string;
  /** Current state */
  state: BridgeState;
  /** Source chain */
  sourceChain: ChainFamily;
  /** Source chain ID */
  sourceChainId: number;
  /** Destination chain */
  destChain: ChainFamily;
  /** Destination chain ID */
  destChainId: number;
  /** Asset being bridged */
  asset: BridgeAsset;
  /** Source user address */
  sourceAddress: string;
  /** Destination user address */
  destAddress: string;
  /** Bridge protocol used */
  protocol: string;
  /** Source chain transaction hash */
  sourceTxHash?: string;
  /** Destination chain transaction hash */
  destTxHash?: string;
  /** State transition history */
  history: BridgeTransition[];
  /** Error message if failed */
  error?: string;
  /** Estimated completion time (unix ms) */
  estimatedCompletionTime?: number;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/** A single state transition record. */
export interface BridgeTransition {
  /** From state */
  from: BridgeState;
  /** To state */
  to: BridgeState;
  /** Transition timestamp */
  timestamp: number;
  /** Optional metadata (tx hash, block number, etc.) */
  metadata?: Record<string, string | number | boolean>;
}

// ============================================================
// Bridge Fee Estimate
// ============================================================

export interface BridgeFeeEstimate {
  /** Protocol fee in smallest unit */
  protocolFee: bigint;
  /** Gas estimate on source chain (in wei or native) */
  sourceGasEstimate: bigint;
  /** Gas estimate on dest chain (in wei or native) */
  destGasEstimate: bigint;
  /** Total fee (protocol + gas) */
  totalFee: bigint;
  /** Fee as percentage of amount */
  feePercentage: number;
  /** Fee token symbol */
  feeToken: string;
}

// ============================================================
// Bridge Time Estimate
// ============================================================

export interface BridgeTimeEstimate {
  /** Estimated time in seconds */
  estimatedSeconds: number;
  /** Best case time in seconds */
  bestCaseSeconds: number;
  /** Worst case time in seconds */
  worstCaseSeconds: number;
  /** Confidence level (0-1) */
  confidence: number;
}

// ============================================================
// Static State Machine Functions
// ============================================================

/**
 * Check if a state transition is valid.
 */
export function isValidTransition(from: BridgeState, to: BridgeState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Create a new bridge transfer in the "initiated" state.
 */
export function createBridgeTransferRecord(options: {
  bridgeId?: string;
  sourceChain: ChainFamily;
  sourceChainId: number;
  destChain: ChainFamily;
  destChainId: number;
  asset: BridgeAsset;
  sourceAddress: string;
  destAddress: string;
  protocol: string;
}): BridgeTransfer {
  const now = Date.now();
  const bridgeId = options.bridgeId || `bridge-${now}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    bridgeId,
    state: "initiated",
    sourceChain: options.sourceChain,
    sourceChainId: options.sourceChainId,
    destChain: options.destChain,
    destChainId: options.destChainId,
    asset: options.asset,
    sourceAddress: options.sourceAddress,
    destAddress: options.destAddress,
    protocol: options.protocol,
    history: [{ from: "initiated", to: "initiated", timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transition a bridge transfer to a new state.
 * Returns the updated transfer or throws on invalid transition.
 */
export function transitionBridgeState(
  transfer: BridgeTransfer,
  newState: BridgeState,
  metadata?: Record<string, string | number | boolean>,
): BridgeTransfer {
  if (!isValidTransition(transfer.state, newState)) {
    throw new Error(
      `Invalid bridge transition: ${transfer.state} → ${newState}`,
    );
  }

  const now = Date.now();
  const transition: BridgeTransition = {
    from: transfer.state,
    to: newState,
    timestamp: now,
    metadata,
  };

  return {
    ...transfer,
    state: newState,
    history: [...transfer.history, transition],
    updatedAt: now,
  };
}

/**
 * Get the current progress percentage of a bridge transfer (0-100).
 */
export function getBridgeProgress(transfer: BridgeTransfer): number {
  const stateProgress: Record<BridgeState, number> = {
    initiated: 0,
    confirming: 15,
    locking: 30,
    minting: 70,
    completed: 100,
    failed: -1,
    expired: -1,
    refunding: 50,
  };

  return Math.max(0, stateProgress[transfer.state] ?? 0);
}

/**
 * Check if a bridge transfer is in a terminal state.
 */
export function isBridgeTerminal(transfer: BridgeTransfer): boolean {
  return transfer.state === "completed" || transfer.state === "failed";
}

/**
 * Check if a bridge transfer can be retried.
 */
export function canRetryBridge(transfer: BridgeTransfer): boolean {
  return transfer.state === "failed" || transfer.state === "expired";
}

// ============================================================
// Supported Bridge Pairs Registry
// ============================================================

/** Chain definitions for supported networks */
const CHAIN_ROUTES: Record<string, ChainRoute> = {
  eth: {
    family: "evm",
    chainId: 1,
    name: "Ethereum",
    nativeCurrency: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
  },
  arbitrum: {
    family: "evm",
    chainId: 42161,
    name: "Arbitrum One",
    nativeCurrency: "ETH",
    isL2: true,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
  },
  optimism: {
    family: "evm",
    chainId: 10,
    name: "Optimism",
    nativeCurrency: "ETH",
    isL2: true,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
  },
  polygon: {
    family: "evm",
    chainId: 137,
    name: "Polygon",
    nativeCurrency: "MATIC",
    isSidechain: true,
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
  },
  base: {
    family: "evm",
    chainId: 8453,
    name: "Base",
    nativeCurrency: "ETH",
    isL2: true,
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
  },
};

/** Supported bridge pairs */
const SUPPORTED_BRIDGE_PAIRS: BridgePair[] = [
  { sourceChain: CHAIN_ROUTES.eth, destChain: CHAIN_ROUTES.arbitrum, protocol: "native", supportsNativeETH: true, supportsERC20: true, estimatedTimeSeconds: 600, baseFeeBps: 5 },
  { sourceChain: CHAIN_ROUTES.arbitrum, destChain: CHAIN_ROUTES.eth, protocol: "native", supportsNativeETH: true, supportsERC20: true, estimatedTimeSeconds: 3600, baseFeeBps: 10 },
  { sourceChain: CHAIN_ROUTES.eth, destChain: CHAIN_ROUTES.optimism, protocol: "native", supportsNativeETH: true, supportsERC20: true, estimatedTimeSeconds: 600, baseFeeBps: 5 },
  { sourceChain: CHAIN_ROUTES.optimism, destChain: CHAIN_ROUTES.eth, protocol: "native", supportsNativeETH: true, supportsERC20: true, estimatedTimeSeconds: 3600, baseFeeBps: 10 },
  { sourceChain: CHAIN_ROUTES.eth, destChain: CHAIN_ROUTES.polygon, protocol: "canonical", supportsNativeETH: false, supportsERC20: true, estimatedTimeSeconds: 1800, baseFeeBps: 8 },
  { sourceChain: CHAIN_ROUTES.polygon, destChain: CHAIN_ROUTES.eth, protocol: "canonical", supportsNativeETH: false, supportsERC20: true, estimatedTimeSeconds: 7200, baseFeeBps: 12 },
  { sourceChain: CHAIN_ROUTES.eth, destChain: CHAIN_ROUTES.base, protocol: "native", supportsNativeETH: true, supportsERC20: true, estimatedTimeSeconds: 600, baseFeeBps: 5 },
  { sourceChain: CHAIN_ROUTES.base, destChain: CHAIN_ROUTES.eth, protocol: "native", supportsNativeETH: true, supportsERC20: true, estimatedTimeSeconds: 3600, baseFeeBps: 10 },
];

/**
 * Look up a supported bridge pair by chain IDs.
 */
export function lookupBridgePair(
  sourceChainId: number,
  destChainId: number,
): BridgePair | undefined {
  return SUPPORTED_BRIDGE_PAIRS.find(
    (p) => p.sourceChain.chainId === sourceChainId && p.destChain.chainId === destChainId,
  );
}

/**
 * Get all supported bridge pairs.
 */
export function getSupportedBridgePairs(): BridgePair[] {
  return [...SUPPORTED_BRIDGE_PAIRS];
}

/**
 * Check if a bridge route is supported.
 */
export function isBridgeRouteSupported(
  sourceChainId: number,
  destChainId: number,
): boolean {
  return lookupBridgePair(sourceChainId, destChainId) !== undefined;
}

// ============================================================
// Bridge Storage (localStorage/IndexedDB wrapper)
// ============================================================

const BRIDGE_STORAGE_KEY = "cinacoin-bridge-transfers";

/**
 * Persist bridge transfers to browser storage.
 */
export async function persistBridgeTransfers(
  storage: StateStorage,
  transfers: BridgeTransfer[],
): Promise<void> {
  // Convert bigint fields to strings for JSON serialization
  const serialized = transfers.map((t) => ({
    ...t,
    asset: { ...t.asset, amount: t.asset.amount.toString() },
  }));
  await storage.set(BRIDGE_STORAGE_KEY, serialized);
}

/**
 * Restore bridge transfers from browser storage.
 */
export async function restoreBridgeTransfers(
  storage: StateStorage,
): Promise<BridgeTransfer[]> {
  const raw = await storage.get<Record<string, unknown>[]>(BRIDGE_STORAGE_KEY);
  if (!raw) return [];

  return raw.map((r) => {
    const asset = r.asset;
    if (!asset || typeof asset !== "object") return r as unknown as BridgeTransfer;
    return {
      ...r,
      asset: {
        ...asset,
        amount: BigInt((asset as unknown).amount),
      },
    } as unknown as BridgeTransfer;
  });
}

// ============================================================
// BridgeEngine Class
// ============================================================

/** Options for BridgeEngine constructor */
export interface BridgeEngineOptions {
  /** Storage backend for persisting bridge state */
  storage?: StateStorage;
  /** Relay client for cross-chain message passing */
  relayClient?: RelayClient;
  /** Protocol fee override (basis points, default per-pair) */
  feeOverrideBps?: number;
}

/** Parameters for creating a bridge transfer */
export interface CreateBridgeParams {
  fromChain: number;
  toChain: number;
  amount: bigint;
  token: string; // "native" or ERC-20 address
  recipient: string;
}

/**
 * BridgeEngine — core engine for managing cross-chain bridge operations.
 *
 * Provides a high-level API for creating, executing, and tracking bridge transfers.
 */
export class BridgeEngine {
  private storage: StateStorage;
  private relayClient?: RelayClient;
  private feeOverrideBps?: number;
  private _transfers: Map<string, BridgeTransfer>;
  private _initialized: boolean;

  constructor(options?: BridgeEngineOptions) {
    this.storage = options?.storage ?? new InMemoryStorageFallback();
    this.relayClient = options?.relayClient;
    this.feeOverrideBps = options?.feeOverrideBps;
    this._transfers = new Map();
    this._initialized = false;
  }

  /**
   * Initialize the engine by restoring persisted state.
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;

    const restored = await restoreBridgeTransfers(this.storage);
    for (const transfer of restored) {
      this._transfers.set(transfer.bridgeId, transfer);
    }

    // Clean up expired transfers
    for (const [id, transfer] of this._transfers.entries()) {
      if (
        transfer.state === "confirming" &&
        transfer.createdAt + 300_000 < Date.now()
      ) {
        try {
          const expired = transitionBridgeState(transfer, "expired", {
            reason: "timeout",
          });
          this._transfers.set(id, expired);
        } catch {
          // Already expired or invalid transition
        }
      }
    }

    await this._persist();
    this._initialized = true;
  }

  /**
   * Create a new bridge transfer without executing it.
   *
   * @param fromChain Source chain ID
   * @param toChain Destination chain ID
   * @param amount Amount to bridge (in smallest unit)
   * @param token Token address or "native" for native ETH
   * @param recipient Destination address
   */
  async createBridgeTransfer(
    fromChain: number,
    toChain: number,
    amount: bigint,
    token: string,
    recipient: string,
  ): Promise<BridgeTransfer> {
    const pair = lookupBridgePair(fromChain, toChain);
    if (!pair) {
      throw new Error(
        `Unsupported bridge route: ${fromChain} → ${toChain}`,
      );
    }

    if (token === "native" && !pair.supportsNativeETH) {
      throw new Error("Native ETH bridging not supported on this route");
    }

    if (token !== "native" && !pair.supportsERC20) {
      throw new Error("ERC-20 bridging not supported on this route");
    }

    const asset: BridgeAsset = {
      symbol: pair.sourceChain.nativeCurrency,
      sourceToken: token === "native" ? "native" : token,
      destToken: token === "native" ? "native" : token,
      amount,
      decimals: 18,
      isNative: token === "native",
    };

    const transfer = createBridgeTransferRecord({
      sourceChain: pair.sourceChain.family,
      sourceChainId: pair.sourceChain.chainId,
      destChain: pair.destChain.family,
      destChainId: pair.destChain.chainId,
      asset,
      sourceAddress: "", // Set by caller before execution
      destAddress: recipient,
      protocol: pair.protocol,
    });

    const timeEstimate = this.estimateBridgeTime(fromChain, toChain);
    transfer.estimatedCompletionTime =
      Date.now() + timeEstimate.estimatedSeconds * 1000;

    this._transfers.set(transfer.bridgeId, transfer);
    await this._persist();

    return transfer;
  }

  /**
   * Execute a bridge transfer: lock assets, relay message, track state.
   *
   * In a production environment this would:
   * 1. Submit the source-chain transaction (lock/burn)
   * 2. Create a cross-chain message
   * 3. Submit the message to the relay server
   * 4. Poll for completion
   *
   * @param transferId The bridge transfer ID to execute
   */
  async executeBridgeTransfer(transferId: string): Promise<BridgeTransfer> {
    const transfer = this._transfers.get(transferId);
    if (!transfer) {
      throw new Error(`Bridge transfer not found: ${transferId}`);
    }

    if (transfer.state !== "initiated") {
      throw new Error(
        `Cannot execute transfer in state: ${transfer.state}`,
      );
    }

    try {
      // Step 1: Transition to confirming
      let updated = transitionBridgeState(transfer, "confirming", {
        reason: "execution_started",
      });
      this._transfers.set(transferId, updated);
      await this._persist();

      // Step 2: Simulate source-chain lock transaction
      // In production: call contract.deposit() or bridge.lock()
      const sourceTxHash = `0xlock_${transferId}_${Date.now().toString(16)}`;
      updated = transitionBridgeState(updated, "locking", {
        sourceTxHash,
      });
      updated.sourceTxHash = sourceTxHash;
      this._transfers.set(transferId, updated);
      await this._persist();

      // Step 3: Create and submit cross-chain message to relay
      if (this.relayClient) {
        const message = await this._createBridgeMessage(updated);
        await this.relayClient.submit(message);
      }

      // Step 4: Transition to minting (assets minted on dest chain)
      const destTxHash = `0xmint_${transferId}_${Date.now().toString(16)}`;
      updated = transitionBridgeState(updated, "minting", {
        destTxHash,
      });
      updated.destTxHash = destTxHash;
      this._transfers.set(transferId, updated);
      await this._persist();

      // Step 5: Complete the transfer
      updated = transitionBridgeState(updated, "completed", {
        reason: "bridge_completed",
      });
      this._transfers.set(transferId, updated);
      await this._persist();

      return updated;
    } catch (err) {
      // Rollback to failed state
      const failed = transitionBridgeState(transfer, "failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      failed.error = err instanceof Error ? err.message : String(err);
      this._transfers.set(transferId, failed);
      await this._persist();

      throw err;
    }
  }

  /**
   * Estimate the bridge fee for a given route and amount.
   *
   * @param fromChain Source chain ID
   * @param toChain Destination chain ID
   * @param amount Amount being bridged (in smallest unit)
   */
  estimateBridgeFee(
    fromChain: number,
    toChain: number,
    amount: bigint,
  ): BridgeFeeEstimate {
    const pair = lookupBridgePair(fromChain, toChain);
    if (!pair) {
      throw new Error(
        `Unsupported bridge route: ${fromChain} → ${toChain}`,
      );
    }

    const bps = this.feeOverrideBps ?? pair.baseFeeBps;
    const protocolFee = (amount * BigInt(bps)) / 10000n;

    // Gas estimates vary by route
    const isL1toL2 = !pair.sourceChain.isL2 && pair.destChain.isL2;
    const isL2toL1 = pair.sourceChain.isL2 && !pair.destChain.isL2;

    let sourceGasEstimate: bigint;
    let destGasEstimate: bigint;

    if (isL1toL2) {
      sourceGasEstimate = 150_000n; // ~150k gas on Ethereum
      destGasEstimate = 50_000n; // ~50k gas on L2
    } else if (isL2toL1) {
      sourceGasEstimate = 30_000n; // ~30k gas on L2
      destGasEstimate = 200_000n; // ~200k gas on Ethereum
    } else {
      // Sidechain / other
      sourceGasEstimate = 100_000n;
      destGasEstimate = 100_000n;
    }

    const totalFee = protocolFee + sourceGasEstimate + destGasEstimate;
    const feePercentage = bps / 100;

    return {
      protocolFee,
      sourceGasEstimate,
      destGasEstimate,
      totalFee,
      feePercentage,
      feeToken: pair.sourceChain.nativeCurrency,
    };
  }

  /**
   * Estimate the bridge time for a given route.
   *
   * @param fromChain Source chain ID
   * @param toChain Destination chain ID
   */
  estimateBridgeTime(
    fromChain: number,
    toChain: number,
  ): BridgeTimeEstimate {
    const pair = lookupBridgePair(fromChain, toChain);
    if (!pair) {
      throw new Error(
        `Unsupported bridge route: ${fromChain} → ${toChain}`,
      );
    }

    const baseSeconds = pair.estimatedTimeSeconds;
    const isL1toL2 = !pair.sourceChain.isL2 && pair.destChain.isL2;
    const isL2toL1 = pair.sourceChain.isL2 && !pair.destChain.isL2;

    if (isL1toL2) {
      // L1 → L2 is fast (minutes)
      return {
        estimatedSeconds: baseSeconds,
        bestCaseSeconds: Math.floor(baseSeconds * 0.5),
        worstCaseSeconds: Math.floor(baseSeconds * 2),
        confidence: 0.9,
      };
    } else if (isL2toL1) {
      // L2 → L1 requires challenge period (hours)
      return {
        estimatedSeconds: baseSeconds,
        bestCaseSeconds: Math.floor(baseSeconds * 0.7),
        worstCaseSeconds: Math.floor(baseSeconds * 3),
        confidence: 0.7,
      };
    } else {
      // Sidechain
      return {
        estimatedSeconds: baseSeconds,
        bestCaseSeconds: Math.floor(baseSeconds * 0.6),
        worstCaseSeconds: Math.floor(baseSeconds * 4),
        confidence: 0.6,
      };
    }
  }

  /**
   * Get the status of a bridge transfer.
   *
   * @param transferId The bridge transfer ID
   */
  async getBridgeStatus(transferId: string): Promise<BridgeTransfer | null> {
    let transfer = this._transfers.get(transferId);
    if (!transfer) {
      // Try to restore from storage
      const restored = await restoreBridgeTransfers(this.storage);
      for (const t of restored) {
        if (t.bridgeId === transferId) {
          transfer = t;
          this._transfers.set(transferId, transfer);
          break;
        }
      }
    }

    if (!transfer) return null;

    // Poll relay server for in-flight transfers
    if (
      this.relayClient &&
      !isBridgeTerminal(transfer) &&
      transfer.state !== "initiated"
    ) {
      try {
        const relayStatus = await this.relayClient.getStatus(transferId);

        const stateMap: Record<string, BridgeState> = {
          pending: "confirming",
          relaying: "locking",
          delivered: "minting",
          confirmed: "completed",
          failed: "failed",
        };

        const newState = stateMap[relayStatus.status];
        if (newState && newState !== transfer.state) {
          transfer = transitionBridgeState(transfer, newState, {
            destTxHash: relayStatus.destTxHash ?? "",
          });
          if (relayStatus.destTxHash) {
            transfer.destTxHash = relayStatus.destTxHash;
          }
          this._transfers.set(transferId, transfer);
          await this._persist();
        }
      } catch {
        // Relay poll failed, keep current state
      }
    }

    // Check for timeout on confirming state
    if (
      transfer.state === "confirming" &&
      transfer.createdAt + 300_000 < Date.now()
    ) {
      try {
        transfer = transitionBridgeState(transfer, "expired", {
          reason: "timeout",
        });
        this._transfers.set(transferId, transfer);
        await this._persist();
      } catch {
        // Already expired or invalid
      }
    }

    return transfer;
  }

  /**
   * Get all bridge transfers for a given address.
   */
  async getBridgeHistory(address: string): Promise<BridgeTransfer[]> {
    const allTransfers = [
      ...this._transfers.values(),
      ...(await restoreBridgeTransfers(this.storage)),
    ];

    // Deduplicate by bridgeId
    const seen = new Set<string>();
    const unique: BridgeTransfer[] = [];
    for (const t of allTransfers) {
      if (!seen.has(t.bridgeId)) {
        seen.add(t.bridgeId);
        unique.push(t);
      }
    }

    return unique.filter(
      (t) => t.sourceAddress === address || t.destAddress === address,
    );
  }

  /**
   * Get all active (non-terminal) bridge transfers.
   */
  getActiveTransfers(): BridgeTransfer[] {
    return [...this._transfers.values()].filter(
      (t) => !isBridgeTerminal(t),
    );
  }

  /**
   * Refund a failed or expired bridge transfer.
   */
  async refundBridgeTransfer(transferId: string): Promise<BridgeTransfer> {
    const transfer = this._transfers.get(transferId);
    if (!transfer) {
      throw new Error(`Bridge transfer not found: ${transferId}`);
    }

    if (transfer.state !== "failed" && transfer.state !== "expired") {
      throw new Error(
        `Cannot refund transfer in state: ${transfer.state}`,
      );
    }

    let updated = transitionBridgeState(transfer, "refunding", {
      reason: "refund_initiated",
    });
    this._transfers.set(transferId, updated);
    await this._persist();

    // Simulate refund transaction
    try {
      updated = transitionBridgeState(updated, "completed", {
        reason: "refund_completed",
        refundTxHash: `0xrefund_${transferId}`,
      });
      this._transfers.set(transferId, updated);
      await this._persist();

      return updated;
    } catch (err) {
      updated = transitionBridgeState(updated, "failed", {
        reason: "refund_failed",
        error: err instanceof Error ? err.message : String(err),
      });
      this._transfers.set(transferId, updated);
      await this._persist();

      throw err;
    }
  }

  /**
   * Create a cross-chain bridge message for relay submission.
   */
  private async _createBridgeMessage(
    transfer: BridgeTransfer,
  ): Promise<import("./messaging").CrossChainMessage> {
    const { createCrossChainMessage } = await import("./messaging");

    return createCrossChainMessage({
      type: "transfer",
      sourceChain: transfer.sourceChain,
      sourceChainId: transfer.sourceChainId,
      destChain: transfer.destChain,
      destChainId: transfer.destChainId,
      sender: transfer.sourceAddress,
      recipient: transfer.destAddress,
      payload: {
        bridgeId: transfer.bridgeId,
        asset: transfer.asset.symbol,
        amount: transfer.asset.amount.toString(),
        sourceToken: transfer.asset.sourceToken,
        destToken: transfer.asset.destToken,
        isNative: transfer.asset.isNative,
      },
      signature: "0x", // Would be signed by wallet
      nonce: Date.now(),
      ttlSeconds: transfer.estimatedCompletionTime
        ? Math.floor((transfer.estimatedCompletionTime - Date.now()) / 1000)
        : 3600,
    });
  }

  /** Persist all transfers to storage */
  private async _persist(): Promise<void> {
    await persistBridgeTransfers(
      this.storage,
      [...this._transfers.values()],
    );
  }
}

// ============================================================
// Fallback InMemoryStorage for bridge module self-containment
// ============================================================

class InMemoryStorageFallback implements StateStorage {
  private store: Map<string, string> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getState(): Promise<BridgeState> {
    return this.get<BridgeState>("bridge-state");
  }

  async setState(state: unknown): Promise<void> {
    await this.set("bridge-state", state);
  }
}
