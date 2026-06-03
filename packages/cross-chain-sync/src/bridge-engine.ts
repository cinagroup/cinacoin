/**
 * BridgeEngine — core cross-chain bridge operations.
 *
 * Provides createBridgeTransfer, executeBridgeTransfer, estimateBridgeFee,
 * estimateBridgeTime, and getBridgeStatus.
 */

import type {
  BridgeLifecycleState,
  BridgeTransferRecord,
  BridgeFeeEstimate,
  BridgeTimeEstimate,
  CreateBridgeTransferOptions,
  BridgeTransferResult,
} from "./types";
import {
  BridgeStateManager,
  findRoute,
  resolveTokenMapping,
  CHAIN_TIMINGS,
  RELAY_OVERHEAD,
} from "./bridge-manager";
import {
  BridgeExecutor,
  type BridgeExecuteParams,
  type BridgeProtocol,
  type BridgeExecutionResult,
  type BridgeExecutionState,
  BRIDGE_CONTRACTS,
  getChainOrDefine,
  pollTransactionReceipt,
} from "./bridge-executor";
import type { Address, Hex, WalletClient, Transport, Chain, Account } from "viem";
import { http, createPublicClient, defineChain } from "viem";

// ============================================================
// BridgeEngine Options
// ============================================================

/** Options for BridgeEngine constructor */
export interface BridgeEngineOptions {
  /** Custom state manager (defaults to new BridgeStateManager) */
  stateManager?: BridgeStateManager;
  /** Wallet client for signing transactions (required for real execution) */
  wallet?: WalletClient<Transport, Chain, Account>;
  /** Override RPC URLs per chain ID */
  rpcUrlOverrides?: Record<number, string>;
  /** Default L2 gas limit for optimistic bridge deposits */
  l2GasLimit?: number;
}

/** Options for createBridgeTransfer */
export interface BridgeCreateOptions extends CreateBridgeTransferOptions {}

/** Default RPC URLs per chain ID */
const DEFAULT_RPC_URLS: Record<number, string> = {
  1: "https://eth.llamarpc.com",
  10: "https://mainnet.optimism.io",
  42161: "https://arb1.arbitrum.io/rpc",
  137: "https://polygon-rpc.com",
  8453: "https://mainnet.base.org",
};

// ============================================================
// BridgeEngine
// ============================================================

/** Engine for executing and tracking cross-chain bridge transfers. */
export class BridgeEngine {
  private stateManager: BridgeStateManager;
  private wallet?: WalletClient<Transport, Chain, Account>;
  private rpcUrlOverrides: Record<number, string>;
  private l2GasLimit: number;
  private executor: BridgeExecutor;

  constructor(options?: BridgeStateManager | BridgeEngineOptions) {
    if (options instanceof BridgeStateManager) {
      this.stateManager = options;
      this.wallet = undefined;
      this.rpcUrlOverrides = {};
      this.l2GasLimit = 200_000;
    } else {
      this.stateManager = options?.stateManager ?? new BridgeStateManager();
      this.wallet = options?.wallet;
      this.rpcUrlOverrides = options?.rpcUrlOverrides ?? {};
      this.l2GasLimit = options?.l2GasLimit ?? 200_000;
    }
    this.executor = new BridgeExecutor();
  }

  /** Access the underlying state manager. */
  get manager(): BridgeStateManager {
    return this.stateManager;
  }

  /** Access the bridge executor (for real on-chain interactions). */
  get executorRef(): BridgeExecutor {
    return this.executor;
  }

  /** Get current executor state (for monitoring). */
  get executorState(): BridgeExecutionState | null {
    return this.executor.state;
  }

  /** Resolve RPC URL for a chain ID */
  private getRpcUrl(chainId: number): string {
    return this.rpcUrlOverrides[chainId] ?? DEFAULT_RPC_URLS[chainId] ?? "";
  }

  /** Determine bridge protocol for a route */
  private determineProtocol(fromChain: string, toChain: string): BridgeProtocol {
    const from = fromChain.toLowerCase();
    const to = toChain.toLowerCase();

    if (from === "polygon" || to === "polygon") {
      return "polygon-pos";
    }
    if (from === "eth" && (to === "arbitrum" || to === "optimism" || to === "base")) {
      return "standard-bridge";
    }
    if ((from === "arbitrum" || from === "optimism" || from === "base") && to === "eth") {
      return "standard-bridge";
    }
    return "canonical";
  }

  /** Get bridge contract address for a chain */
  private getBridgeAddress(
    protocol: BridgeProtocol,
    chainId: number,
  ): Address {
    if (protocol === "polygon-pos") {
      const polygonAddresses = BRIDGE_CONTRACTS["polygon"];
      return (polygonAddresses?.[chainId] ?? "0x0000000000000000000000000000000000000000") as Address;
    }
    // Standard bridge / canonical: check all known protocols
    for (const [, addresses] of Object.entries(BRIDGE_CONTRACTS)) {
      if (addresses[chainId]) {
        return addresses[chainId] as Address;
      }
    }
    return "0x0000000000000000000000000000000000000000" as Address;
  }

  // ---- Fee Estimation ----

  /**
   * Estimate bridge fees for a transfer.
   */
  async estimateBridgeFee(
    fromChain: string,
    toChain: string,
    amount: bigint,
    token: string = "native",
  ): Promise<BridgeFeeEstimate> {
    const route = findRoute(fromChain, toChain);
    if (!route) {
      throw new Error(
        `No supported route from ${fromChain} to ${toChain}`,
      );
    }

    const feePercent = route.feePercent / 100;
    const protocolFee = BigInt(
      Math.floor(Number(amount) * feePercent),
    );

    // Gas estimates (approximate, in wei)
    const isNative = token.toLowerCase() === "native" || token.toLowerCase() === "eth";
    const fromTiming = CHAIN_TIMINGS[fromChain.toLowerCase()] ?? { blockTime: 12, confirmationBlocks: 12 };
    const toTiming = CHAIN_TIMINGS[toChain.toLowerCase()] ?? { blockTime: 12, confirmationBlocks: 12 };

    // Approximate gas costs based on chain type
    const l2GasCost = 500_000n; // ~500k gas on L2
    const l1GasCost = 2_000_000n; // ~2M gas on L1 (includes data availability)

    const sourceGasEstimate =
      fromChain.toLowerCase() === "eth"
        ? l1GasCost * 30_000_000_000n // 30 gwei
        : l2GasCost * 1_000_000n; // 0.001 gwei

    const destGasEstimate =
      toChain.toLowerCase() === "eth"
        ? l1GasCost * 30_000_000_000n
        : l2GasCost * 1_000_000n;

    const totalFee = protocolFee + sourceGasEstimate + destGasEstimate;

    const tokenInfo = resolveTokenMapping(fromChain, toChain, token);
    const tokenSymbol = tokenInfo?.symbol ?? (isNative ? "ETH" : token.slice(0, 6));

    return {
      feePercent: route.feePercent,
      feeAmount: protocolFee,
      sourceGasEstimate,
      destGasEstimate,
      totalEstimate: totalFee,
      tokenSymbol,
    };
  }

  // ---- Time Estimation ----

  /**
   * Estimate bridge time for a route.
   */
  async estimateBridgeTime(
    fromChain: string,
    toChain: string,
  ): Promise<BridgeTimeEstimate> {
    const fromKey = fromChain.toLowerCase();
    const toKey = toChain.toLowerCase();
    const routeId = `${fromKey}-${toKey}`;

    const fromTiming = CHAIN_TIMINGS[fromKey] ?? { blockTime: 12, confirmationBlocks: 12 };
    const toTiming = CHAIN_TIMINGS[toKey] ?? { blockTime: 12, confirmationBlocks: 12 };

    const sourceConfirmationSeconds =
      fromTiming.blockTime * fromTiming.confirmationBlocks;
    const destConfirmationSeconds =
      toTiming.blockTime * toTiming.confirmationBlocks;
    const relayTimeSeconds = RELAY_OVERHEAD[routeId] ?? 60;

    const totalSeconds =
      sourceConfirmationSeconds + relayTimeSeconds + destConfirmationSeconds;

    const description = this.buildTimeDescription(totalSeconds);

    return {
      sourceConfirmationSeconds,
      relayTimeSeconds,
      destConfirmationSeconds,
      totalSeconds,
      description,
    };
  }

  // ---- Create Bridge Transfer ----

  /**
   * Create a new bridge transfer (initiated state).
   * Persists to IndexedDB.
   */
  async createBridgeTransfer(
    options: CreateBridgeTransferOptions,
  ): Promise<BridgeTransferResult> {
    const { fromChain, toChain, amount, token, recipient, sender, decimals } =
      options;

    // Validate route
    const route = findRoute(fromChain, toChain);
    if (!route) {
      throw new Error(`No supported route from ${fromChain} to ${toChain}`);
    }
    if (!route.active) {
      throw new Error(`Route ${fromChain} → ${toChain} is currently inactive`);
    }

    // Resolve token
    const tokenMapping = resolveTokenMapping(fromChain, toChain, token);
    if (!tokenMapping) {
      throw new Error(
        `Token ${token} not supported on route ${fromChain} → ${toChain}`,
      );
    }

    // Parse amount
    const dec = decimals ?? tokenMapping.decimals;
    const amountBigInt = this.parseAmount(amount, dec);

    // Validate amount range
    if (amountBigInt < route.minAmount) {
      throw new Error(
        `Amount too small. Minimum: ${this.formatAmount(route.minAmount, dec)} ${tokenMapping.symbol}`,
      );
    }
    if (amountBigInt > route.maxAmount) {
      throw new Error(
        `Amount too large. Maximum: ${this.formatAmount(route.maxAmount, dec)} ${tokenMapping.symbol}`,
      );
    }

    // Generate transfer ID
    const transferId = `bridge-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const now = Date.now();

    // Create transfer record
    const record: BridgeTransferRecord = {
      transferId,
      state: "initiated",
      fromChain,
      fromChainId: route.fromChainId,
      toChain,
      toChainId: route.toChainId,
      sourceToken: tokenMapping.source,
      destToken: tokenMapping.dest,
      amount: amountBigInt,
      tokenSymbol: tokenMapping.symbol,
      decimals: dec,
      sender: sender ?? "",
      recipient,
      history: [
        BridgeStateManager.createTransition("initiated", "initiated"),
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Persist
    await this.stateManager.saveTransfer(record);

    // Estimate fee and time
    const [estimatedFee, estimatedTime] = await Promise.all([
      this.estimateBridgeFee(fromChain, toChain, amountBigInt, token),
      this.estimateBridgeTime(fromChain, toChain),
    ]);

    return {
      transferId,
      state: "initiated",
      fromChain,
      toChain,
      amount,
      token,
      recipient,
      estimatedFee,
      estimatedTime,
    };
  }

  // ---- Execute Bridge Transfer ----

  /**
   * Execute a bridge transfer through the state machine.
   * Transitions: initiated → confirming → locking → minting → completed
   *
   * When a wallet client is configured, this performs real on-chain
   * interactions via the BridgeExecutor (viem). Otherwise, it falls
   * back to simulated state transitions for testing.
   */
  async executeBridgeTransfer(
    transferId: string,
  ): Promise<BridgeTransferRecord> {
    let record = await this.stateManager.loadTransfer(transferId);
    if (!record) {
      throw new Error(`Transfer ${transferId} not found`);
    }

    // Check current state
    if (record.state !== "initiated") {
      throw new Error(
        `Cannot execute transfer in state "${record.state}"`,
      );
    }

    // Step 1: initiated → confirming
    record = await this.stateManager.updateState(
      transferId,
      "confirming",
      { step: "submitting_to_relay" },
    );

    // Determine if we have a wallet for real execution
    if (this.wallet && this.wallet.account) {
      return this.executeRealBridgeTransfer(transferId, record);
    }

    // Fallback: simulated state transitions (for testing / no-wallet mode)
    return this.executeSimulatedBridgeTransfer(transferId, record);
  }

  /**
   * Execute a real bridge transfer using viem and on-chain contracts.
   */
  private async executeRealBridgeTransfer(
    transferId: string,
    record: BridgeTransferRecord,
  ): Promise<BridgeTransferRecord> {
    const protocol = this.determineProtocol(record.fromChain, record.toChain);
    const sourceRpcUrl = this.getRpcUrl(record.fromChainId);
    const destRpcUrl = this.getRpcUrl(record.toChainId);
    const sourceBridgeAddress = this.getBridgeAddress(protocol, record.fromChainId);
    const destBridgeAddress = this.getBridgeAddress(protocol, record.toChainId);

    if (!sourceRpcUrl) {
      throw new Error(`No RPC URL configured for source chain ${record.fromChainId}`);
    }
    if (!destRpcUrl) {
      throw new Error(`No RPC URL configured for destination chain ${record.toChainId}`);
    }

    // Step 2: confirming → locking (real on-chain lock)
    const lockStartTime = Date.now();

    try {
      const result: BridgeExecutionResult = await this.executor.execute({
        sourceChainId: record.fromChainId,
        destChainId: record.toChainId,
        sourceRpcUrl,
        destRpcUrl,
        sourceToken: record.sourceToken as string,
        destToken: record.destToken as string,
        amount: record.amount,
        wallet: this.wallet!,
        recipient: record.recipient as `0x${string}`,
        protocol,
        sourceBridgeAddress,
        destBridgeAddress,
        l2GasLimit: this.l2GasLimit,
      });

      // Update state with real transaction hashes
      record = await this.stateManager.updateState(
        transferId,
        "locking",
        {
          step: "locking_on_source",
          sourceTxHash: result.source.txHash,
          sourceBlockNumber: result.source.blockNumber.toString(),
        },
      );

      // Update destination state
      if (result.dest) {
        record = await this.stateManager.updateState(
          transferId,
          "minting",
          {
            step: "minting_on_dest",
            destTxHash: result.dest.txHash,
            destBlockNumber: result.dest.blockNumber.toString(),
            totalGasUsed: result.totalGasUsed.toString(),
            totalGasCost: result.totalGasCost.toString(),
          },
        );
      } else {
        // Relay pending — minting will happen via relay
        record = await this.stateManager.updateState(
          transferId,
          "minting",
          {
            step: "awaiting_relay",
            sourceTxHash: result.source.txHash,
            relayProtocol: protocol,
            estimatedRelaySeconds: this.getRelayWaitSeconds(record.fromChainId, record.toChainId),
          },
        );
      }

      // Complete
      record = await this.stateManager.updateState(
        transferId,
        "completed",
        {
          step: "transfer_complete",
          totalGasUsed: result.totalGasUsed.toString(),
          totalGasCost: result.totalGasCost.toString(),
        },
      );

      return record;
    } catch (err) {
      // Record failure and attempt rollback
      const executorState = this.executor.state;
      await this.stateManager.updateState(
        transferId,
        "failed",
        {
          error: err instanceof Error ? err.message : String(err),
          executorPhase: executorState.phase,
          sourceTxHash: executorState.sourceTxHash ?? "",
          failedAt: Date.now(),
        },
      );

      // Attempt refund
      try {
        record = await this.stateManager.updateState(
          transferId,
          "refunded",
          {
            reason: "auto_refund_after_failure",
            refundInitiatedAt: Date.now(),
          },
        );
      } catch {
        // Refund transition may not be valid from all states
      }

      throw err;
    }
  }

  /**
   * Execute a simulated bridge transfer (fallback for testing).
   */
  private async executeSimulatedBridgeTransfer(
    transferId: string,
    record: BridgeTransferRecord,
  ): Promise<BridgeTransferRecord> {
    // Step 2: confirming → locking (simulate source chain lock)
    record = await this.stateManager.updateState(
      transferId,
      "locking",
      {
        step: "locking_on_source",
        sourceTxHash: `0xsim_source_${transferId}`,
      },
    );

    // Step 3: locking → minting (simulate dest chain mint/release)
    record = await this.stateManager.updateState(
      transferId,
      "minting",
      {
        step: "minting_on_dest",
        destTxHash: `0xsim_dest_${transferId}`,
      },
    );

    // Step 4: minting → completed
    record = await this.stateManager.updateState(
      transferId,
      "completed",
      { step: "transfer_complete" },
    );

    return record;
  }

  /**
   * Get estimated relay wait time in seconds based on chain pair.
   */
  private getRelayWaitSeconds(fromChainId: number, toChainId: number): number {
    // L1 → L2: fast (minutes)
    if (fromChainId === 1) {
      return 300; // ~5 minutes
    }
    // L2 → L1: challenge period (hours to days)
    if (toChainId === 1) {
      return 7 * 24 * 3600; // ~7 days
    }
    // Other: ~30 minutes
    return 1800;
  }

  // ---- Get Bridge Status ----

  /**
   * Get the current status of a bridge transfer.
   */
  async getBridgeStatus(
    transferId: string,
  ): Promise<BridgeTransferRecord | null> {
    return this.stateManager.loadTransfer(transferId);
  }

  // ---- Timeout / Expiry Handling ----

  /**
   * Check for transfers stuck in "confirming" state that have exceeded the timeout.
   * Transitions them to expired → refunded.
   *
   * @param timeoutMs Timeout in milliseconds (default: 30 minutes)
   * @returns List of expired and refunded transfer IDs
   */
  async handleTimeouts(timeoutMs: number = 30 * 60 * 1000): Promise<string[]> {
    const confirmingTransfers =
      await this.stateManager.loadTransfersByState("confirming");
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const record of confirmingTransfers) {
      if (now - record.updatedAt > timeoutMs) {
        // Transition to expired
        await this.stateManager.updateState(
          record.transferId,
          "expired",
          { reason: "timeout", timeoutMs },
        );

        // Transition to refunded
        await this.stateManager.updateState(
          record.transferId,
          "refunded",
          { reason: "auto_refund" },
        );

        expiredIds.push(record.transferId);
      }
    }

    return expiredIds;
  }

  // ---- Failure Handling ----

  /**
   * Mark a transfer as failed and initiate refund.
   */
  async failAndRefund(
    transferId: string,
    reason: string,
  ): Promise<BridgeTransferRecord> {
    const record = await this.stateManager.loadTransfer(transferId);
    if (!record) {
      throw new Error(`Transfer ${transferId} not found`);
    }

    // Can only fail from non-terminal states
    const failableStates: BridgeLifecycleState[] = [
      "initiated",
      "confirming",
      "locking",
      "minting",
    ];

    if (!failableStates.includes(record.state)) {
      throw new Error(
        `Cannot fail transfer in state "${record.state}"`,
      );
    }

    // Transition to failed
    await this.stateManager.updateState(transferId, "failed", { reason });

    // Transition to refunded
    const refunded = await this.stateManager.updateState(
      transferId,
      "refunded",
      { reason: "refund_after_failure" },
    );

    return refunded;
  }

  // ---- Helpers ----

  private parseAmount(humanAmount: string, decimals: number): bigint {
    const parts = humanAmount.split(".");
    const integerPart = parts[0] || "0";
    const fractionalPart = parts[1] || "";

    // Pad or truncate fractional part to match decimals
    const paddedFraction =
      fractionalPart.length >= decimals
        ? fractionalPart.slice(0, decimals)
        : fractionalPart.padEnd(decimals, "0");

    return BigInt(integerPart + paddedFraction);
  }

  private formatAmount(amount: bigint, decimals: number): string {
    const str = amount.toString().padStart(decimals + 1, "0");
    const intPart = str.slice(0, str.length - decimals) || "0";
    const fracPart = str.slice(str.length - decimals);
    // Remove trailing zeros
    const trimmedFrac = fracPart.replace(/0+$/, "");
    return trimmedFrac ? `${intPart}.${trimmedFrac}` : intPart;
  }

  private buildTimeDescription(totalSeconds: number): string {
    if (totalSeconds < 60) return `${totalSeconds} seconds`;
    if (totalSeconds < 3600) return `~${Math.round(totalSeconds / 60)} minutes`;
    if (totalSeconds < 86400) return `~${Math.round(totalSeconds / 3600 * 10) / 10} hours`;
    return `~${Math.round(totalSeconds / 86400 * 10) / 10} days`;
  }
}
