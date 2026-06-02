/**
 * Bridge Protocol — Cross-chain asset transfer state machine
 *
 * Defines the bridge lifecycle states and manages asset transfers
 * between chains via the relay-server.
 *
 * Bridge State Machine:
 *   init → preparing → locked → bridging → confirming → completed
 *                                                      ↓
 *                                                   failed
 *
 * Each transition is recorded with a timestamp and optional metadata.
 */

import type { ChainFamily } from "../types.js";

// ============================================================
// Bridge States
// ============================================================

/** All possible states in the bridge lifecycle. */
export type BridgeState =
  | "init"          // Bridge request created
  | "preparing"     // Preparing source-chain transaction
  | "locked"        // Assets locked on source chain
  | "bridging"      // Cross-chain message in transit
  | "confirming"    // Destination chain confirmation pending
  | "completed"     // Successfully bridged
  | "failed"        // Bridge failed (recoverable or terminal)
  | "refunding";    // Refund in progress (after failure)

/** Valid state transitions. */
const VALID_TRANSITIONS: Record<BridgeState, BridgeState[]> = {
  init: ["preparing", "failed"],
  preparing: ["locked", "failed"],
  locked: ["bridging", "failed", "refunding"],
  bridging: ["confirming", "failed", "refunding"],
  confirming: ["completed", "failed", "refunding"],
  completed: [], // Terminal state
  failed: ["refunding"], // Can attempt refund
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
  /** Estimated completion time */
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
// State Machine
// ============================================================

/**
 * Check if a state transition is valid.
 */
export function isValidTransition(from: BridgeState, to: BridgeState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Create a new bridge transfer in the "init" state.
 */
export function createBridgeTransfer(options: {
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
    state: "init",
    sourceChain: options.sourceChain,
    sourceChainId: options.sourceChainId,
    destChain: options.destChain,
    destChainId: options.destChainId,
    asset: options.asset,
    sourceAddress: options.sourceAddress,
    destAddress: options.destAddress,
    protocol: options.protocol,
    history: [{ from: "init", to: "init", timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transition a bridge transfer to a new state.
 * Returns the updated transfer or throws on invalid transition.
 */
export function transitionBridge(
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
    init: 0,
    preparing: 10,
    locked: 30,
    bridging: 60,
    confirming: 85,
    completed: 100,
    failed: -1,
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
  return transfer.state === "failed" || transfer.state === "refunding";
}
