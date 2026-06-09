/**
 * BridgeExecutor — Cross-Chain Transfer Execution Engine
 *
 * Orchestrates multi-step cross-chain transfers with:
 *   - Source chain lock/burn initiation
 *   - Message relay to destination chain
 *   - Destination chain mint/release execution
 *   - Failure recovery with automatic retry
 *   - Comprehensive status tracking and event emission
 *
 * This is the high-level orchestrator that coordinates the lower-level
 * components (AtomicSwap, LiquidityPool, CrossChainMessenger, etc.)
 */

import type { ChainFamily } from "./types";
import {
  AtomicSwapManager,
  type AtomicSwap,
  type SwapStatus,
  type SwapEvent,
  type InitiateSwapConfig,
} from "./AtomicSwap";
import {
  LiquidityPoolManager,
  type LiquidityPool,
  type SwapQuote,
  type SwapConfig as PoolSwapConfig,
} from "./LiquidityPool";
import {
  CrossChainMessenger,
  type CrossChainMessage,
  type MessageStatus,
  type RelayConfig,
} from "./CrossChainMessenger";

// ============================================================
// Transfer Types
// ============================================================

/** Transfer execution mode. */
export type ExecutionMode = "atomic_swap" | "liquidity_pool" | "lock_mint";

/** State of a bridge transfer execution. */
export type ExecutionState =
  | "created"
  | "validating"
  | "source_locking"
  | "source_locked"
  | "relaying"
  | "relayed"
  | "dest_executing"
  | "dest_executed"
  | "completed"
  | "failed"
  | "refunded"
  | "retrying";

/** A single bridge transfer record. */
export interface BridgeTransfer {
  /** Unique transfer ID */
  transferId: string;
  /** Execution mode */
  mode: ExecutionMode;
  /** Source chain */
  sourceChain: ChainFamily;
  sourceChainId: number;
  /** Destination chain */
  destChain: ChainFamily;
  destChainId: number;
  /** Sender address */
  sender: string;
  /** Recipient address */
  recipient: string;
  /** Token being transferred */
  tokenSymbol: string;
  /** Amount (smallest unit) */
  amount: bigint;
  /** Current execution state */
  state: ExecutionState;
  /** Source transaction hash */
  sourceTxHash: string | null;
  /** Destination transaction hash */
  destTxHash: string | null;
  /** Message ID for relay tracking */
  messageId: string | null;
  /** Swap ID (for atomic swap mode) */
  swapId: string | null;
  /** Pool ID (for liquidity pool mode) */
  poolId: string | null;
  /** Number of retries */
  retryCount: number;
  /** Maximum retries */
  maxRetries: number;
  /** Error message if failed */
  error: string | null;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Completion timestamp */
  completedAt: number | null;
  /** Event history */
  events: TransferEvent[];
}

/** Event in transfer lifecycle. */
export interface TransferEvent {
  type: string;
  timestamp: number;
  state: ExecutionState;
  details?: Record<string, string | number>;
}

/** Configuration for executing a bridge transfer. */
export interface ExecuteTransferConfig {
  mode: ExecutionMode;
  sourceChain: ChainFamily;
  sourceChainId: number;
  destChain: ChainFamily;
  destChainId: number;
  sender: string;
  recipient: string;
  tokenSymbol: string;
  amount: bigint;
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Timeout in seconds */
  timeoutSeconds?: number;
}

/** Result of a transfer execution. */
export interface TransferResult {
  transferId: string;
  state: ExecutionState;
  sourceTxHash: string | null;
  destTxHash: string | null;
  completed: boolean;
  error: string | null;
}

// ============================================================
// BridgeExecutor
// ============================================================

export class BridgeExecutor {
  private transfers: Map<string, BridgeTransfer> = new Map();
  private swapManager: AtomicSwapManager;
  private poolManager: LiquidityPoolManager;
  private messenger: CrossChainMessenger;
  private listeners: ((transfer: BridgeTransfer, event: TransferEvent) => void)[] = [];
  private transferCounter = 0;

  constructor(options?: {
    swapManager?: AtomicSwapManager;
    poolManager?: LiquidityPoolManager;
    messenger?: CrossChainMessenger;
    relayConfig?: RelayConfig;
  }) {
    this.swapManager = options?.swapManager ?? new AtomicSwapManager();
    this.poolManager = options?.poolManager ?? new LiquidityPoolManager();
    this.messenger =
      options?.messenger ??
      new CrossChainMessenger({
        endpoint: "https://relay.cinacoin.io/v1",
        maxBatchSize: 50,
        batchIntervalMs: 5000,
        defaultExpirySeconds: 3600,
      });
  }

  // ---- Transfer Creation ----

  /**
   * Create and initiate a cross-chain bridge transfer.
   */
  createTransfer(config: ExecuteTransferConfig): BridgeTransfer {
    const transferId = this.generateTransferId();
    const now = Math.floor(Date.now() / 1000);

    const transfer: BridgeTransfer = {
      transferId,
      mode: config.mode,
      sourceChain: config.sourceChain,
      sourceChainId: config.sourceChainId,
      destChain: config.destChain,
      destChainId: config.destChainId,
      sender: config.sender,
      recipient: config.recipient,
      tokenSymbol: config.tokenSymbol,
      amount: config.amount,
      state: "created",
      sourceTxHash: null,
      destTxHash: null,
      messageId: null,
      swapId: null,
      poolId: null,
      retryCount: 0,
      maxRetries: config.maxRetries ?? 3,
      error: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      events: [
        {
          type: "transfer_created",
          timestamp: now,
          state: "created",
          details: { mode: config.mode },
        },
      ],
    };

    this.transfers.set(transferId, transfer);
    return transfer;
  }

  // ---- Transfer Execution ----

  /**
   * Execute a transfer through the appropriate flow based on mode.
   */
  async execute(transferId: string): Promise<TransferResult> {
    const transfer = this.getOrThrow(transferId);

    try {
      switch (transfer.mode) {
        case "atomic_swap":
          return await this.executeAtomicSwap(transfer);
        case "liquidity_pool":
          return await this.executeLiquidityPoolSwap(transfer);
        case "lock_mint":
          return await this.executeLockMint(transfer);
        default:
          throw new Error(`Unknown execution mode: ${(transfer as BridgeTransfer).mode}`);
      }
    } catch (error) {
      return this.handleFailure(
        transfer,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // ---- Atomic Swap Flow ----

  private async executeAtomicSwap(transfer: BridgeTransfer): Promise<TransferResult> {
    // Step 1: Initiate HTLC swap
    this.updateState(transfer, "validating");

    const swapConfig: InitiateSwapConfig = {
      chainA: transfer.sourceChain,
      chainAId: transfer.sourceChainId,
      chainB: transfer.destChain,
      chainBId: transfer.destChainId,
      initiatorAddressA: transfer.sender,
      participantAddressB: "0x0", // Counterparty to be matched
      participantReceiveAddressA: "0x0",
      initiatorReceiveAddressB: transfer.recipient,
      amountA: transfer.amount,
      amountB: transfer.amount, // Simplified: same amount
      tokenSymbolA: transfer.tokenSymbol,
      tokenSymbolB: transfer.tokenSymbol,
      timeLockA: 7200, // 2 hours
      timeLockB: 3600, // 1 hour
    };

    const { swapId, secret, swap } = await this.swapManager.initiate(swapConfig);
    transfer.swapId = swapId;

    this.updateState(transfer, "source_locking", {
      swapId,
      hashLock: swap.hashLock,
    });

    // Step 2: Simulate source chain lock
    const sourceTxHash = this.simulateTxHash("source");
    this.swapManager.lock(swapId, "A", "0xhtlcA", 1000, sourceTxHash);
    transfer.sourceTxHash = sourceTxHash;
    this.updateState(transfer, "source_locked", { sourceTxHash });

    // Step 3: Simulate destination chain lock (participant)
    this.swapManager.lock(swapId, "B", "0xhtlcB", 2000, this.simulateTxHash("dest"));
    this.updateState(transfer, "dest_executing");

    // Step 4: Claim on destination chain
    const claimTxHash = this.simulateTxHash("claim_dest");
    await this.swapManager.claim(swapId, "B", secret, claimTxHash);
    this.updateState(transfer, "dest_executed", { claimTxHash });

    // Step 5: Claim on source chain (secret now revealed)
    const claimSrcTxHash = this.simulateTxHash("claim_src");
    await this.swapManager.claim(swapId, "A", secret, claimSrcTxHash);
    transfer.destTxHash = claimSrcTxHash;

    return this.completeTransfer(transfer);
  }

  // ---- Liquidity Pool Flow ----

  private async executeLiquidityPoolSwap(transfer: BridgeTransfer): Promise<TransferResult> {
    this.updateState(transfer, "validating");

    // Find or create pool
    const pools = this.poolManager.getPoolsForPair(transfer.sourceChain, transfer.destChain);
    if (pools.length === 0) {
      throw new Error("No liquidity pool available for this chain pair");
    }

    const pool = pools[0];
    transfer.poolId = pool.poolId;

    // Get quote
    const swapConfig: PoolSwapConfig = {
      poolId: pool.poolId,
      direction: "A-to-B",
      inputAmount: transfer.amount,
    };

    const quote = this.poolManager.getQuote(swapConfig);

    this.updateState(transfer, "source_locking", {
      poolId: pool.poolId,
      expectedOutput: quote.outputAmount.toString(),
      priceImpactBps: quote.priceImpactBps,
    });

    // Execute swap
    const { quote: executedQuote } = this.poolManager.executeSwap(swapConfig);
    transfer.sourceTxHash = this.simulateTxHash("pool_swap");

    this.updateState(transfer, "relayed", {
      outputAmount: executedQuote.outputAmount.toString(),
      fee: executedQuote.feeAmount.toString(),
    });

    // Message relay to destination chain
    const message = this.messenger.createMessage(
      "transfer",
      transfer.sourceChain,
      transfer.sourceChainId,
      transfer.destChain,
      transfer.destChainId,
      transfer.sender,
      transfer.recipient,
      {
        tokenSymbol: transfer.tokenSymbol,
        amount: executedQuote.outputAmount.toString(),
        poolId: pool.poolId,
      },
    );
    transfer.messageId = message.messageId;

    // Deliver message
    this.messenger.relayMessage(message.messageId, "relayer-1");
    this.updateState(transfer, "dest_executing");

    this.messenger.confirmDelivery(message.messageId, this.simulateTxHash("dest_delivery"));
    transfer.destTxHash = message.destTxHash;

    return this.completeTransfer(transfer);
  }

  // ---- Lock-Mint Flow ----

  private async executeLockMint(transfer: BridgeTransfer): Promise<TransferResult> {
    this.updateState(transfer, "validating");

    // Step 1: Lock on source chain
    this.updateState(transfer, "source_locking");
    const sourceTxHash = this.simulateTxHash("lock");
    transfer.sourceTxHash = sourceTxHash;
    this.updateState(transfer, "source_locked", { sourceTxHash });

    // Step 2: Create relay message
    const message = this.messenger.createMessage(
      "transfer",
      transfer.sourceChain,
      transfer.sourceChainId,
      transfer.destChain,
      transfer.destChainId,
      transfer.sender,
      transfer.recipient,
      {
        tokenSymbol: transfer.tokenSymbol,
        amount: transfer.amount.toString(),
        sourceTxHash,
      },
    );
    transfer.messageId = message.messageId;

    // Step 3: Relay
    this.updateState(transfer, "relaying");
    this.messenger.relayMessage(message.messageId, "relayer-1");
    this.updateState(transfer, "relayed");

    // Step 4: Execute on destination chain
    this.updateState(transfer, "dest_executing");
    const destTxHash = this.simulateTxHash("mint");
    this.messenger.confirmDelivery(message.messageId, destTxHash);
    transfer.destTxHash = destTxHash;

    return this.completeTransfer(transfer);
  }

  // ---- Failure & Retry ----

  private handleFailure(transfer: BridgeTransfer, error: string): TransferResult {
    transfer.error = error;
    transfer.updatedAt = Math.floor(Date.now() / 1000);

    if (transfer.retryCount < transfer.maxRetries) {
      transfer.retryCount += 1;
      this.updateState(transfer, "retrying", {
        retryCount: transfer.retryCount,
        error,
      });

      // Exponential backoff simulation
      const delay = Math.min(1000 * Math.pow(2, transfer.retryCount), 30000);

      // Retry execution
      return this.execute(transfer.transferId);
    }

    this.updateState(transfer, "failed", { error });
    return {
      transferId: transfer.transferId,
      state: "failed",
      sourceTxHash: transfer.sourceTxHash,
      destTxHash: transfer.destTxHash,
      completed: false,
      error,
    };
  }

  // ---- Refund ----

  /**
   * Initiate refund for a failed transfer.
   */
  async refund(transferId: string): Promise<BridgeTransfer> {
    const transfer = this.getOrThrow(transferId);

    if (transfer.state !== "failed" && transfer.state !== "source_locked") {
      throw new Error(`Cannot refund transfer in state: ${transfer.state}`);
    }

    // If HTLC swap was used, refund the leg
    if (transfer.swapId) {
      const swap = this.swapManager.getSwap(transfer.swapId);
      if (swap && swap.legA.state === "locked") {
        this.swapManager.refund(transfer.swapId, "A", this.simulateTxHash("refund"));
      }
    }

    this.updateState(transfer, "refunded", {
      refundTxHash: this.simulateTxHash("refund"),
    });
    return transfer;
  }

  // ---- Queries ----

  /** Get transfer by ID. */
  getTransfer(transferId: string): BridgeTransfer | null {
    return this.transfers.get(transferId) ?? null;
  }

  /** Get all transfers. */
  getAllTransfers(): BridgeTransfer[] {
    return Array.from(this.transfers.values());
  }

  /** Get transfers by state. */
  getTransfersByState(state: ExecutionState): BridgeTransfer[] {
    return this.getAllTransfers().filter((t) => t.state === state);
  }

  /** Get transfers for a sender. */
  getTransfersBySender(sender: string): BridgeTransfer[] {
    return this.getAllTransfers().filter((t) => t.sender === sender);
  }

  /** Get pending transfers count. */
  getPendingCount(): number {
    return this.getAllTransfers().filter(
      (t) => t.state === "pending" || t.state === "relaying" || t.state === "retrying",
    ).length;
  }

  // ---- Events ----

  /** Register a listener for transfer events. */
  on(listener: (transfer: BridgeTransfer, event: TransferEvent) => void): void {
    this.listeners.push(listener);
  }

  // ---- Internal ----

  private getOrThrow(transferId: string): BridgeTransfer {
    const transfer = this.transfers.get(transferId);
    if (!transfer) throw new Error(`Transfer not found: ${transferId}`);
    return transfer;
  }

  private updateState(
    transfer: BridgeTransfer,
    newState: ExecutionState,
    details?: Record<string, string | number>,
  ): void {
    const now = Math.floor(Date.now() / 1000);
    const oldState = transfer.state;
    transfer.state = newState;
    transfer.updatedAt = now;

    const event: TransferEvent = {
      type: `state_${oldState}_to_${newState}`,
      timestamp: now,
      state: newState,
      details: { ...details, previousState: oldState },
    };
    transfer.events.push(event);

    for (const listener of this.listeners) {
      try {
        listener(transfer, event);
      } catch {
        // Don't let listener errors break execution
      }
    }
  }

  private completeTransfer(transfer: BridgeTransfer): TransferResult {
    const now = Math.floor(Date.now() / 1000);
    transfer.state = "completed";
    transfer.completedAt = now;
    transfer.updatedAt = now;

    const event: TransferEvent = {
      type: "transfer_completed",
      timestamp: now,
      state: "completed",
    };
    transfer.events.push(event);

    for (const listener of this.listeners) {
      try {
        listener(transfer, event);
      } catch {
        // noop
      }
    }

    return {
      transferId: transfer.transferId,
      state: "completed",
      sourceTxHash: transfer.sourceTxHash,
      destTxHash: transfer.destTxHash,
      completed: true,
      error: null,
    };
  }

  private generateTransferId(): string {
    this.transferCounter++;
    return `txf-${Date.now().toString(36)}-${this.transferCounter.toString(36)}`;
  }

  private simulateTxHash(prefix: string): string {
    const hex = Math.random().toString(16).slice(2, 10).padStart(8, "0");
    return `0x${prefix}${hex}0000000000000000000000000000000000000000000000000000000`;
  }
}
