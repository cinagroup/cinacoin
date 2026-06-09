/**
 * BundlerClient — Enhanced ERC-4337 Bundler Integration
 *
 * Provides a higher-level interface over the raw BundlerClient with:
 *   - Full UserOperation lifecycle management (build → sign → estimate → send → poll)
 *   - Automatic gas estimation via bundler
 *   - Paymaster integration for sponsored transactions
 *   - Status tracking and receipt retrieval
 *   - Exponential backoff polling for receipt confirmation
 *
 * @example
 * ```ts
 * import { BundlerClient } from '@cinacoin/aa-sdk/bundler-client';
 *
 * const bundler = new BundlerClient({
 *   url: 'https://bundler.example.com/rpc',
 *   entryPoint: '0x...',
 *   chainId: 1,
 * });
 *
 * const result = await bundler.sendUserOperation(signedUserOp, {
 *   entryPoint: '0x...',
 * });
 *
 * console.log(`UserOp sent: ${result.userOpHash}`);
 *
 * // Wait for on-chain confirmation
 * const receipt = await bundler.waitForUserOperationReceipt(result.userOpHash);
 * console.log(`Tx hash: ${receipt.transactionHash}`);
 * ```
 */

import type { Hex, Hash, Address } from 'viem';
import type {
  UserOperation,
  UserOperationGasEstimate,
  BundlerConfig,
  BundlerSendResult,
  UserOperationReceipt,
} from './types.js';
import { UserOperationStatus } from './types.js';
import { BundlerClient as RawBundlerClient } from './bundler.js';
import { PaymasterClient } from './paymaster.js';
import type { PaymasterResponse } from './types.js';

// ============================================================
// Enhanced BundlerClient
// ============================================================

/** Configuration for the enhanced BundlerClient. */
export interface EnhancedBundlerConfig extends BundlerConfig {
  /** ERC-4337 entry point address. */
  entryPoint: Address;
  /** Chain ID. */
  chainId: number;
  /** Optional paymaster configuration. */
  paymaster?: {
    url: string;
    apiKey?: string;
  };
  /** Polling interval for receipt (ms), default: 2000. */
  pollIntervalMs?: number;
  /** Max polling attempts, default: 60 (≈ 2 minutes). */
  maxPollAttempts?: number;
}

/** Result of a submitted UserOperation. */
export interface SubmittedUserOp {
  /** UserOp hash returned by the bundler. */
  userOpHash: Hash;
  /** Gas estimate used. */
  gasEstimate: UserOperationGasEstimate;
  /** Whether paymaster was applied. */
  sponsored: boolean;
  /** Status tracker. */
  status: UserOperationStatus;
}

/**
 * Enhanced BundlerClient with full lifecycle management.
 *
 * Wraps the raw BundlerClient with:
 *   - Gas estimation before submission
 *   - Paymaster sponsorship
 *   - Automatic receipt polling
 *   - Status tracking
 */
export class BundlerClient {
  private readonly raw: RawBundlerClient;
  private readonly paymaster?: PaymasterClient;
  private readonly entryPoint: Address;
  private readonly chainId: number;
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;

  /** Active UserOp status tracking. */
  private activeOps = new Map<Hash, SubmittedUserOp>();

  constructor(config: EnhancedBundlerConfig) {
    this.raw = new RawBundlerClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    this.entryPoint = config.entryPoint;
    this.chainId = config.chainId;
    this.pollIntervalMs = config.pollIntervalMs ?? 2_000;
    this.maxPollAttempts = config.maxPollAttempts ?? 60;

    if (config.paymaster) {
      this.paymaster = new PaymasterClient({
        url: config.paymaster.url,
        apiKey: config.paymaster.apiKey,
        sponsorType: 'gasless',
      });
    }
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Send a UserOperation to the bundler with full lifecycle management:
   *   1. Estimate gas
   *   2. Apply paymaster (if configured)
   *   3. Send to bundler
   *   4. Track status
   */
  async sendUserOperation(
    userOp: UserOperation,
  ): Promise<SubmittedUserOp> {
    // Step 1: Estimate gas
    const gasEstimate = await this.estimateGas(userOp);

    // Merge gas estimates into userOp
    const estimatedOp: UserOperation = {
      ...userOp,
      callGasLimit: gasEstimate.callGasLimit,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      preVerificationGas: gasEstimate.preVerificationGas,
    };

    // Step 2: Apply paymaster if configured
    let sponsored = false;
    if (this.paymaster) {
      try {
        const paymasterData = await this.paymaster.sponsor({
          userOperation: estimatedOp,
          entryPoint: this.entryPoint,
          chainId: this.chainId,
        });
        estimatedOp.paymasterAndData = paymasterData.paymasterAndData;

        // Apply gas overrides from paymaster
        if (paymasterData.preVerificationGas) {
          estimatedOp.preVerificationGas = paymasterData.preVerificationGas;
        }
        if (paymasterData.verificationGasLimit) {
          estimatedOp.verificationGasLimit = paymasterData.verificationGasLimit;
        }
        if (paymasterData.callGasLimit) {
          estimatedOp.callGasLimit = paymasterData.callGasLimit;
        }

        sponsored = true;
      } catch (err) {
        console.warn('[BundlerClient] Paymaster sponsorship failed, proceeding without paymaster:', err);
      }
    }

    // Step 3: Send to bundler
    const result = await this.raw.sendUserOperation(estimatedOp, this.entryPoint);

    // Step 4: Track status
    const submitted: SubmittedUserOp = {
      userOpHash: result.userOpHash,
      gasEstimate,
      sponsored,
      status: UserOperationStatus.Pending,
    };
    this.activeOps.set(result.userOpHash, submitted);

    return submitted;
  }

  /**
   * Get the current status of a UserOperation.
   */
  getUserOperationStatus(userOpHash: Hash): UserOperationStatus {
    return this.activeOps.get(userOpHash)?.status ?? UserOperationStatus.Pending;
  }

  /**
   * Get the receipt of a UserOperation.
   * Calls the raw bundler's getUserOperationReceipt.
   */
  async getUserOperationReceipt(
    userOpHash: Hash,
  ): Promise<UserOperationReceipt | null> {
    return this.raw.getUserOperationReceipt(userOpHash);
  }

  /**
   * Get UserOperation by hash.
   */
  async getUserOperationByHash(
    userOpHash: Hash,
  ): Promise<UserOperation | null> {
    return this.raw.getUserOperationByHash(userOpHash);
  }

  /**
   * Poll for a UserOperation receipt with exponential backoff.
   *
   * Resolves when the receipt is available or throws on timeout.
   * Updates internal status tracking.
   */
  async waitForUserOperationReceipt(
    userOpHash: Hash,
    opts?: {
      /** Override polling interval (ms). */
      intervalMs?: number;
      /** Override max attempts. */
      maxAttempts?: number;
      /** Callback on each poll attempt. */
      onPoll?: (attempt: number) => void;
    },
  ): Promise<UserOperationReceipt> {
    const interval = opts?.intervalMs ?? this.pollIntervalMs;
    const maxAttempts = opts?.maxAttempts ?? this.maxPollAttempts;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      opts?.onPoll?.(attempt);

      const receipt = await this.getUserOperationReceipt(userOpHash);

      if (receipt) {
        // Update status
        const tracked = this.activeOps.get(userOpHash);
        if (tracked) {
          tracked.status = receipt.success
            ? UserOperationStatus.Included
            : UserOperationStatus.Reverted;
        }
        return receipt;
      }

      // Exponential backoff: start at interval, double each time, cap at 30s
      const backoffMs = Math.min(interval * Math.pow(2, Math.floor(attempt / 3)), 30_000);
      await this.sleep(backoffMs);
    }

    // Mark as failed on timeout
    const tracked = this.activeOps.get(userOpHash);
    if (tracked) {
      tracked.status = UserOperationStatus.Failed;
    }

    throw new Error(
      `waitForUserOperationReceipt timed out after ${maxAttempts} attempts for ${userOpHash}`,
    );
  }

  /**
   * Execute the full UserOp lifecycle: send → wait for receipt.
   * Convenience method that combines sendUserOperation and waitForUserOperationReceipt.
   */
  async executeUserOperation(
    userOp: UserOperation,
    opts?: {
      onStatusChange?: (status: UserOperationStatus) => void;
    },
  ): Promise<{
    submitted: SubmittedUserOp;
    receipt: UserOperationReceipt;
  }> {
    const submitted = await this.sendUserOperation(userOp);
    opts?.onStatusChange?.(submitted.status);

    const receipt = await this.waitForUserOperationReceipt(submitted.userOpHash, {
      onPoll: (attempt) => {
        // Check if the bundler has an intermediate status
        if (attempt > 0 && attempt % 5 === 0) {
          opts?.onStatusChange?.(this.getUserOperationStatus(submitted.userOpHash));
        }
      },
    });

    opts?.onStatusChange?.(receipt.success ? UserOperationStatus.Included : UserOperationStatus.Reverted);

    return { submitted, receipt };
  }

  /**
   * Estimate gas for a UserOperation.
   */
  async estimateGas(userOp: UserOperation): Promise<UserOperationGasEstimate> {
    return this.raw.estimateUserOperationGas(userOp, this.entryPoint);
  }

  /**
   * Get supported entry points from the bundler.
   */
  async getSupportedEntryPoints(): Promise<Address[]> {
    return this.raw.getSupportedEntryPoints();
  }

  /**
   * Remove a tracked UserOp from the active set.
   */
  clearTrackedOp(userOpHash: Hash): void {
    this.activeOps.delete(userOpHash);
  }

  /**
   * Get all actively tracked UserOps.
   */
  getActiveOps(): Map<Hash, SubmittedUserOp> {
    return new Map(this.activeOps);
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

// ── Factory ───────────────────────────────────────────────────────

/**
 * Create an enhanced BundlerClient instance.
 */
export function createBundlerClient(config: EnhancedBundlerConfig): BundlerClient {
  return new BundlerClient(config);
}
